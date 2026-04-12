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
