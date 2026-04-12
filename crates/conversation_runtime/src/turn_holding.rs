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
        let normalized = transcript.trim().to_lowercase();
        if normalized.is_empty() {
            return TurnHoldingAssessment::default();
        }

        if self.config.self_repair_markers.iter().any(|marker| {
            normalized == *marker
                || normalized.starts_with(&format!("{marker} "))
                || normalized.ends_with(&format!(" {marker}"))
                || normalized.contains(&format!(" {marker} "))
        }) {
            return TurnHoldingAssessment {
                should_hold: true,
                reason: Some("Detected a self-repair phrase.".into()),
            };
        }

        if normalized.split_whitespace().last().is_some_and(|word| {
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
