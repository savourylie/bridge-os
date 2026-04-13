use task_models::{Intent, IntentQuestion};

use crate::models::{ParsedIntentCandidate, TaskCategory};

pub(crate) fn parse_transcript(transcript: &str) -> ParsedIntentCandidate {
    let trimmed = transcript.trim();
    let lower = trimmed.to_lowercase();

    let category = detect_category(&lower);
    let normalized_scope = extract_scope(&lower, trimmed);
    let command = match category {
        Some(TaskCategory::GuardedCommand) => extract_command(trimmed),
        _ => None,
    };
    let package_name = match category {
        Some(TaskCategory::PackageInstallation) => extract_package_name(&lower),
        _ => None,
    };

    let mut unresolved_questions = Vec::new();
    if category.is_none() {
        unresolved_questions.push(IntentQuestion {
            id: "task".into(),
            text: "What should BridgeOS do with this request?".into(),
        });
    }

    if matches!(
        category,
        Some(TaskCategory::FolderOrganization)
            | Some(TaskCategory::ProjectInspection)
            | Some(TaskCategory::GuardedCommand)
    ) && normalized_scope.is_none()
    {
        unresolved_questions.push(IntentQuestion {
            id: "scope".into(),
            text: "Which folder or project should BridgeOS use?".into(),
        });
    }

    if matches!(category, Some(TaskCategory::GuardedCommand)) && command.is_none() {
        unresolved_questions.push(IntentQuestion {
            id: "command".into(),
            text: "Which guarded command should BridgeOS run?".into(),
        });
    }

    if matches!(category, Some(TaskCategory::PackageInstallation)) && package_name.is_none() {
        unresolved_questions.push(IntentQuestion {
            id: "package".into(),
            text: "Which package should BridgeOS install?".into(),
        });
    }

    let constraints = extract_constraints(&lower);
    let exclusions = extract_exclusions(&lower);

    let intent = Intent {
        goal: build_goal(category, normalized_scope.as_deref(), command.as_deref(), package_name.as_deref()),
        scope: normalized_scope.clone(),
        constraints,
        exclusions,
        unresolved_questions,
    };

    ParsedIntentCandidate {
        title: build_title(category, normalized_scope.as_deref(), package_name.as_deref()),
        summary: build_summary(category, normalized_scope.as_deref(), command.as_deref(), package_name.as_deref()),
        category,
        normalized_scope,
        command,
        package_name,
        intent,
    }
}

fn detect_category(lower: &str) -> Option<TaskCategory> {
    if lower.contains("install ") {
        return Some(TaskCategory::PackageInstallation);
    }

    if lower.contains("run ")
        || lower.contains("git status")
        || lower.contains("git log")
        || lower.contains("git diff")
        || lower.contains("cargo build")
        || lower.contains("cargo test")
        || lower.contains("npm run")
        || lower.starts_with("ls ")
        || lower.starts_with("cat ")
    {
        return Some(TaskCategory::GuardedCommand);
    }

    if lower.contains("inspect")
        || lower.contains("summarize")
        || lower.contains("what's in")
        || lower.contains("what is in")
        || lower.contains("analyze")
        || lower.contains("scan")
    {
        return Some(TaskCategory::ProjectInspection);
    }

    if lower.contains("organize")
        || lower.contains("sort")
        || lower.contains("group")
        || lower.contains("clean up")
    {
        return Some(TaskCategory::FolderOrganization);
    }

    None
}

fn extract_scope(lower: &str, original: &str) -> Option<String> {
    if let Some(path) = original
        .split_whitespace()
        .map(trim_token)
        .find(|token| token.starts_with("~/") || token.starts_with('/'))
    {
        return Some(path);
    }

    if lower.contains("downloads") {
        return Some("~/Downloads".into());
    }

    if let Some(project_name) = extract_named_project(lower) {
        return Some(format!("~/Projects/{project_name}"));
    }

    if lower.contains("this project") || lower.contains("my project") || lower.contains("project")
    {
        return Some("~/Projects".into());
    }

    None
}

fn extract_named_project(lower: &str) -> Option<String> {
    let marker = " project";
    let project_index = lower.find(marker)?;
    let prefix = &lower[..project_index];
    let candidate = prefix
        .split_whitespace()
        .last()
        .unwrap_or_default()
        .trim_matches(|character: char| !character.is_alphanumeric() && character != '-' && character != '_');

    if candidate.is_empty() || matches!(candidate, "my" | "this" | "the") {
        return None;
    }

    Some(candidate.into())
}

fn extract_command(original: &str) -> Option<String> {
    let lower = original.to_lowercase();

    if let Some(index) = lower.find("run ") {
        return Some(trim_command_clause(&original[index + 4..]));
    }

    for prefix in [
        "git status",
        "git log",
        "git diff",
        "cargo build",
        "cargo test",
        "npm run",
        "ls",
        "cat",
    ] {
        if let Some(index) = lower.find(prefix) {
            return Some(trim_command_clause(&original[index..]));
        }
    }

    None
}

fn trim_command_clause(clause: &str) -> String {
    let clause = clause.trim();
    for delimiter in [" inside ", " in ", " for ", " on "] {
        if let Some(index) = clause.to_lowercase().find(delimiter) {
            return clause[..index].trim().trim_end_matches(['.', '?', '!']).into();
        }
    }

    clause.trim_end_matches(['.', '?', '!']).into()
}

fn extract_package_name(lower: &str) -> Option<String> {
    let install_index = lower.find("install ")?;
    let tail = &lower[install_index + "install ".len()..];
    tail.split_whitespace()
        .find(|token| !matches!(*token, "the" | "a" | "package"))
        .map(|token| token.trim_matches(|character: char| !character.is_alphanumeric() && character != '-' && character != '_').into())
        .filter(|token: &String| !token.is_empty())
}

fn extract_constraints(lower: &str) -> Option<String> {
    let mut constraints = Vec::new();

    if lower.contains("do not delete") || lower.contains("don't delete") {
        constraints.push("Do not delete files.".into());
    }

    if lower.contains("preserve original filename") || lower.contains("keep original filename") {
        constraints.push("Keep original filenames.".into());
    }

    if let Some(mode) = extract_phrase_after(lower, "by ") {
        constraints.push(format!("Group items by {mode}."));
    }

    if let Some(scope) = extract_phrase_after(lower, "only ") {
        constraints.push(format!("Only include {scope}."));
    }

    if constraints.is_empty() {
        None
    } else {
        Some(constraints.join(" "))
    }
}

fn extract_exclusions(lower: &str) -> Option<String> {
    let mut exclusions = Vec::new();

    for keyword in ["pdf", "pdfs", "zip", "zips", "hidden", "installer", "installers"] {
        if lower.contains(keyword)
            && (lower.contains("ignore")
                || lower.contains("exclude")
                || lower.contains("don't touch")
                || lower.contains("do not touch"))
        {
            exclusions.push(match keyword {
                "pdf" | "pdfs" => "PDF files",
                "zip" | "zips" => "ZIP archives",
                "hidden" => "hidden files",
                "installer" | "installers" => "installers",
                _ => keyword,
            });
        }
    }

    if exclusions.is_empty() {
        None
    } else {
        Some(format!("Exclude {}.", exclusions.join(", ")))
    }
}

fn extract_phrase_after(lower: &str, marker: &str) -> Option<String> {
    let index = lower.find(marker)?;
    let tail = &lower[index + marker.len()..];
    let phrase = tail
        .split([',', '.', '?', '!'])
        .next()
        .unwrap_or_default()
        .split(" and ")
        .next()
        .unwrap_or_default()
        .trim();

    if phrase.is_empty() {
        None
    } else {
        Some(phrase.into())
    }
}

fn build_goal(
    category: Option<TaskCategory>,
    scope: Option<&str>,
    command: Option<&str>,
    package_name: Option<&str>,
) -> Option<String> {
    match category? {
        TaskCategory::FolderOrganization => {
            Some(format!("Organize files in {}", scope.unwrap_or("the selected folder")))
        }
        TaskCategory::ProjectInspection => {
            Some(format!("Inspect {}", scope.unwrap_or("the selected project")))
        }
        TaskCategory::GuardedCommand => Some(format!(
            "Run guarded command {}",
            command.unwrap_or("inside the selected project")
        )),
        TaskCategory::PackageInstallation => {
            Some(format!("Install {}", package_name.unwrap_or("the requested package")))
        }
    }
}

fn build_title(
    category: Option<TaskCategory>,
    scope: Option<&str>,
    package_name: Option<&str>,
) -> Option<String> {
    match category? {
        TaskCategory::FolderOrganization => {
            Some(format!("Organize {}", scope.unwrap_or("Folder")))
        }
        TaskCategory::ProjectInspection => {
            Some(format!("Inspect {}", scope.unwrap_or("Project")))
        }
        TaskCategory::GuardedCommand => Some("Run Guarded Command".into()),
        TaskCategory::PackageInstallation => {
            Some(format!("Install {}", package_name.unwrap_or("Package")))
        }
    }
}

fn build_summary(
    category: Option<TaskCategory>,
    scope: Option<&str>,
    command: Option<&str>,
    package_name: Option<&str>,
) -> Option<String> {
    match category? {
        TaskCategory::FolderOrganization => Some(format!(
            "BridgeOS will review {}, prepare folders, move matching files, and summarize the result.",
            scope.unwrap_or("the selected folder")
        )),
        TaskCategory::ProjectInspection => Some(format!(
            "BridgeOS will scan {}, analyze its contents, and produce a concise summary.",
            scope.unwrap_or("the selected project")
        )),
        TaskCategory::GuardedCommand => Some(format!(
            "BridgeOS will validate and run `{}` inside the guarded scope, then report the output.",
            command.unwrap_or("the requested command")
        )),
        TaskCategory::PackageInstallation => Some(format!(
            "BridgeOS will check, install, and verify `{}` with approval before the system changes.",
            package_name.unwrap_or("the requested package")
        )),
    }
}

fn trim_token(token: &str) -> String {
    token
        .trim()
        .trim_matches(|character: char| matches!(character, '.' | ',' | '?' | '!'))
        .into()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_folder_organization_requests() {
        let parsed = parse_transcript(
            "Computer, organize my Downloads by month, keep original filenames, and do not touch PDFs.",
        );

        assert_eq!(parsed.category, Some(TaskCategory::FolderOrganization));
        assert_eq!(parsed.normalized_scope.as_deref(), Some("~/Downloads"));
        assert!(parsed
            .intent
            .constraints
            .as_deref()
            .is_some_and(|value| value.contains("Keep original filenames")));
        assert!(parsed
            .intent
            .exclusions
            .as_deref()
            .is_some_and(|value| value.contains("PDF files")));
    }

    #[test]
    fn flags_missing_scope_when_needed() {
        let parsed = parse_transcript("run git status");

        assert_eq!(parsed.category, Some(TaskCategory::GuardedCommand));
        assert!(parsed
            .intent
            .unresolved_questions
            .iter()
            .any(|question| question.id == "scope"));
    }

    #[test]
    fn parses_project_and_package_requests() {
        let inspection = parse_transcript("What's in my memfuse project?");
        assert_eq!(inspection.category, Some(TaskCategory::ProjectInspection));
        assert_eq!(
            inspection.normalized_scope.as_deref(),
            Some("~/Projects/memfuse")
        );

        let installation = parse_transcript("Install ffmpeg for this project.");
        assert_eq!(installation.category, Some(TaskCategory::PackageInstallation));
        assert_eq!(installation.package_name.as_deref(), Some("ffmpeg"));
    }
}
