#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TurnHoldingConfig {
    pub short_pause_ms: u64,
    pub long_pause_ms: u64,
    pub self_repair_markers: Vec<String>,
    pub trailing_conjunctions: Vec<String>,
}

impl Default for TurnHoldingConfig {
    fn default() -> Self {
        Self {
            short_pause_ms: 1_500,
            long_pause_ms: 2_000,
            self_repair_markers: vec![
                "wait".into(),
                "actually".into(),
                "no".into(),
                "i mean".into(),
            ],
            trailing_conjunctions: vec!["and".into(), "then".into(), "also".into()],
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct TurnHoldingAssessment {
    pub should_hold: bool,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct TurnHoldingAnalyzer {
    config: TurnHoldingConfig,
}

impl TurnHoldingAnalyzer {
    pub fn new(config: TurnHoldingConfig) -> Self {
        Self { config }
    }

    pub fn config(&self) -> &TurnHoldingConfig {
        &self.config
    }

    pub fn assess(&self, transcript: &str) -> TurnHoldingAssessment {
        let collapsed = transcript
            .trim()
            .to_lowercase()
            .chars()
            .map(|character| {
                if character.is_alphanumeric() || character.is_whitespace() {
                    character
                } else {
                    ' '
                }
            })
            .collect::<String>()
            .split_whitespace()
            .collect::<Vec<_>>()
            .join(" ");

        if collapsed.is_empty() {
            return TurnHoldingAssessment::default();
        }

        if self.config.self_repair_markers.iter().any(|marker| {
            collapsed == *marker
                || collapsed.starts_with(&format!("{marker} "))
                || collapsed.ends_with(&format!(" {marker}"))
                || collapsed.contains(&format!(" {marker} "))
        }) {
            return TurnHoldingAssessment {
                should_hold: true,
                reason: Some("Detected a self-repair phrase.".into()),
            };
        }

        if collapsed.split_whitespace().last().is_some_and(|word| {
            self.config
                .trailing_conjunctions
                .iter()
                .any(|it| it == word)
        }) {
            return TurnHoldingAssessment {
                should_hold: true,
                reason: Some("Utterance ends with a trailing conjunction.".into()),
            };
        }

        TurnHoldingAssessment::default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_self_repair_markers_with_punctuation() {
        let analyzer = TurnHoldingAnalyzer::default();

        let assessment = analyzer.assess("wait, not yesterday");
        assert!(assessment.should_hold);
        assert_eq!(
            assessment.reason.as_deref(),
            Some("Detected a self-repair phrase.")
        );
    }

    #[test]
    fn detects_trailing_conjunctions() {
        let analyzer = TurnHoldingAnalyzer::default();

        let assessment = analyzer.assess("organize the screenshots and");
        assert!(assessment.should_hold);
        assert_eq!(
            assessment.reason.as_deref(),
            Some("Utterance ends with a trailing conjunction.")
        );
    }

    #[test]
    fn ignores_complete_utterances_and_empty_input() {
        let analyzer = TurnHoldingAnalyzer::default();

        assert_eq!(
            analyzer.assess("organize the screenshots from this week"),
            TurnHoldingAssessment::default()
        );
        assert_eq!(analyzer.assess("   "), TurnHoldingAssessment::default());
    }
}
