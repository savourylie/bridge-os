#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TranscriptIntent {
    Normal,
    StatusQuery,
    Redirect,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TranscriptIntentConfig {
    pub status_phrases: Vec<String>,
    pub redirect_markers: Vec<String>,
    pub redirect_continuations: Vec<String>,
}

impl Default for TranscriptIntentConfig {
    fn default() -> Self {
        Self {
            status_phrases: vec![
                "what are you doing".into(),
                "whats happening".into(),
                "what is happening".into(),
                "where are we".into(),
                "status".into(),
                "progress".into(),
            ],
            redirect_markers: vec![
                "actually".into(),
                "stop".into(),
                "wait".into(),
                "no".into(),
            ],
            redirect_continuations: vec![
                "instead".into(),
                " do ".into(),
                " run ".into(),
                " try ".into(),
            ],
        }
    }
}

#[derive(Debug, Clone, Default)]
pub struct TranscriptIntentClassifier {
    config: TranscriptIntentConfig,
}

impl TranscriptIntentClassifier {
    pub fn new(config: TranscriptIntentConfig) -> Self {
        Self { config }
    }

    pub fn config(&self) -> &TranscriptIntentConfig {
        &self.config
    }

    pub fn classify(&self, transcript: &str) -> TranscriptIntent {
        let normalized = normalize(transcript);
        if normalized.is_empty() {
            return TranscriptIntent::Normal;
        }

        // A leading redirect marker plus a continuation clause is the strongest
        // signal of intent change — check it before status to avoid mis-classifying
        // commands like "stop, run git status instead" as a status query.
        let starts_with_marker = self.config.redirect_markers.iter().any(|marker| {
            normalized == *marker || normalized.starts_with(&format!("{marker} "))
        });
        if starts_with_marker
            && self
                .config
                .redirect_continuations
                .iter()
                .any(|continuation| normalized.contains(continuation.as_str()))
        {
            return TranscriptIntent::Redirect;
        }

        if self
            .config
            .status_phrases
            .iter()
            .any(|phrase| normalized.contains(phrase.as_str()))
        {
            return TranscriptIntent::StatusQuery;
        }

        TranscriptIntent::Normal
    }
}

fn normalize(transcript: &str) -> String {
    transcript
        .trim()
        .to_lowercase()
        .chars()
        .filter_map(|character| {
            if character.is_alphanumeric() || character.is_whitespace() {
                Some(character)
            } else if matches!(character, '\'' | '\u{2019}') {
                // Drop straight and curly apostrophes so contractions like
                // "what's" collapse to "whats" rather than splitting into "what s".
                None
            } else {
                Some(' ')
            }
        })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn classifies_status_query_for_what_are_you_doing() {
        let classifier = TranscriptIntentClassifier::default();
        assert_eq!(
            classifier.classify("What are you doing now?"),
            TranscriptIntent::StatusQuery
        );
    }

    #[test]
    fn classifies_status_query_for_progress_keyword() {
        let classifier = TranscriptIntentClassifier::default();
        assert_eq!(
            classifier.classify("Give me progress."),
            TranscriptIntent::StatusQuery
        );
    }

    #[test]
    fn classifies_status_query_for_whats_happening_with_apostrophe() {
        let classifier = TranscriptIntentClassifier::default();
        assert_eq!(
            classifier.classify("What's happening?"),
            TranscriptIntent::StatusQuery
        );
    }

    #[test]
    fn classifies_redirect_for_actually_do_instead() {
        let classifier = TranscriptIntentClassifier::default();
        assert_eq!(
            classifier.classify("Actually, organize my Desktop instead."),
            TranscriptIntent::Redirect
        );
    }

    #[test]
    fn classifies_redirect_for_stop_run() {
        let classifier = TranscriptIntentClassifier::default();
        assert_eq!(
            classifier.classify("Stop, run git status instead."),
            TranscriptIntent::Redirect
        );
    }

    #[test]
    fn classifies_redirect_requires_continuation() {
        let classifier = TranscriptIntentClassifier::default();
        assert_eq!(
            classifier.classify("Actually."),
            TranscriptIntent::Normal,
            "bare marker should not trigger redirect"
        );
    }

    #[test]
    fn does_not_treat_self_repair_pause_as_redirect() {
        let classifier = TranscriptIntentClassifier::default();
        assert_eq!(
            classifier.classify("Wait, not yesterday."),
            TranscriptIntent::Normal,
            "self-repair phrasing without a continuation must remain Normal"
        );
    }

    #[test]
    fn classifies_normal_for_unrelated_chatter() {
        let classifier = TranscriptIntentClassifier::default();
        assert_eq!(
            classifier.classify("keep going"),
            TranscriptIntent::Normal
        );
    }

    #[test]
    fn status_query_takes_precedence_when_both_match() {
        let classifier = TranscriptIntentClassifier::default();
        assert_eq!(
            classifier.classify("What's the status, and actually do something else instead?"),
            TranscriptIntent::StatusQuery
        );
    }

    #[test]
    fn ignores_empty_or_whitespace_transcripts() {
        let classifier = TranscriptIntentClassifier::default();
        assert_eq!(classifier.classify(""), TranscriptIntent::Normal);
        assert_eq!(classifier.classify("   "), TranscriptIntent::Normal);
    }

    #[test]
    fn case_insensitive_and_punctuation_tolerant() {
        let classifier = TranscriptIntentClassifier::default();
        assert_eq!(
            classifier.classify("WHERE ARE WE?!"),
            TranscriptIntent::StatusQuery
        );
    }
}
