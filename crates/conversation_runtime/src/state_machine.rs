use task_models::ConversationState;

pub fn can_transition(from: ConversationState, to: ConversationState) -> bool {
    if from == to {
        return true;
    }

    match from {
        ConversationState::Idle => matches!(to, ConversationState::Listening),
        ConversationState::Listening => matches!(
            to,
            ConversationState::HoldingForMore
                | ConversationState::Clarifying
                | ConversationState::IntentLocked
                | ConversationState::Speaking
                | ConversationState::Idle
        ),
        ConversationState::HoldingForMore => matches!(
            to,
            ConversationState::Listening
                | ConversationState::Clarifying
                | ConversationState::IntentLocked
                | ConversationState::Idle
        ),
        ConversationState::Clarifying => matches!(
            to,
            ConversationState::Listening
                | ConversationState::HoldingForMore
                | ConversationState::IntentLocked
                | ConversationState::Speaking
                | ConversationState::Idle
        ),
        ConversationState::IntentLocked => matches!(
            to,
            ConversationState::Listening | ConversationState::Speaking | ConversationState::Idle
        ),
        ConversationState::Speaking => {
            matches!(to, ConversationState::Interrupted | ConversationState::Idle)
        }
        ConversationState::Interrupted => matches!(
            to,
            ConversationState::Listening | ConversationState::Clarifying | ConversationState::Idle
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const STATES: [ConversationState; 7] = [
        ConversationState::Idle,
        ConversationState::Listening,
        ConversationState::HoldingForMore,
        ConversationState::Clarifying,
        ConversationState::IntentLocked,
        ConversationState::Speaking,
        ConversationState::Interrupted,
    ];

    fn expected_transition(from: ConversationState, to: ConversationState) -> bool {
        if from == to {
            return true;
        }

        match from {
            ConversationState::Idle => matches!(to, ConversationState::Listening),
            ConversationState::Listening => matches!(
                to,
                ConversationState::HoldingForMore
                    | ConversationState::Clarifying
                    | ConversationState::IntentLocked
                    | ConversationState::Speaking
                    | ConversationState::Idle
            ),
            ConversationState::HoldingForMore => matches!(
                to,
                ConversationState::Listening
                    | ConversationState::Clarifying
                    | ConversationState::IntentLocked
                    | ConversationState::Idle
            ),
            ConversationState::Clarifying => matches!(
                to,
                ConversationState::Listening
                    | ConversationState::HoldingForMore
                    | ConversationState::IntentLocked
                    | ConversationState::Speaking
                    | ConversationState::Idle
            ),
            ConversationState::IntentLocked => matches!(
                to,
                ConversationState::Listening
                    | ConversationState::Speaking
                    | ConversationState::Idle
            ),
            ConversationState::Speaking => {
                matches!(to, ConversationState::Interrupted | ConversationState::Idle)
            }
            ConversationState::Interrupted => matches!(
                to,
                ConversationState::Listening
                    | ConversationState::Clarifying
                    | ConversationState::Idle
            ),
        }
    }

    #[test]
    fn state_machine_accepts_only_documented_transitions() {
        for from in STATES {
            for to in STATES {
                assert_eq!(
                    can_transition(from, to),
                    expected_transition(from, to),
                    "unexpected transition result for {from:?} -> {to:?}"
                );
            }
        }
    }
}
