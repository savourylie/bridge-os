import { createStateMachineDefinition, type TransitionTable } from "@/state/machine"

export const CONVERSATION_STATES = [
  "idle",
  "listening",
  "holding_for_more",
  "clarifying",
  "intent_locked",
  "speaking",
  "interrupted",
] as const

export type ConversationState = (typeof CONVERSATION_STATES)[number]

export type ConversationEvent =
  | { type: "START_LISTENING" }
  | { type: "HOLD_FOR_MORE" }
  | { type: "REQUEST_CLARIFICATION" }
  | { type: "LOCK_INTENT" }
  | { type: "START_SPEAKING" }
  | { type: "INTERRUPT" }
  | { type: "RESET" }

const transitions = {
  idle: {
    START_LISTENING: "listening",
  },
  listening: {
    HOLD_FOR_MORE: "holding_for_more",
    REQUEST_CLARIFICATION: "clarifying",
    LOCK_INTENT: "intent_locked",
    START_SPEAKING: "speaking",
    RESET: "idle",
  },
  holding_for_more: {
    START_LISTENING: "listening",
    REQUEST_CLARIFICATION: "clarifying",
    LOCK_INTENT: "intent_locked",
    RESET: "idle",
  },
  clarifying: {
    START_LISTENING: "listening",
    HOLD_FOR_MORE: "holding_for_more",
    LOCK_INTENT: "intent_locked",
    START_SPEAKING: "speaking",
    RESET: "idle",
  },
  intent_locked: {
    START_LISTENING: "listening",
    START_SPEAKING: "speaking",
    RESET: "idle",
  },
  speaking: {
    INTERRUPT: "interrupted",
    RESET: "idle",
  },
  interrupted: {
    START_LISTENING: "listening",
    REQUEST_CLARIFICATION: "clarifying",
    RESET: "idle",
  },
} satisfies TransitionTable<ConversationState, ConversationEvent>

export const conversationStateMachine = createStateMachineDefinition({
  name: "ConversationState",
  initialState: "idle" as ConversationState,
  transitions,
})

export const createConversationMachine = (
  initialState: ConversationState = conversationStateMachine.initialState,
) => conversationStateMachine.createMachine(initialState)
