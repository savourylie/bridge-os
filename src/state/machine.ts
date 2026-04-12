export interface MachineEvent {
  type: string
}

type EventType<E extends MachineEvent> = E["type"]

export type TransitionTable<S extends string, E extends MachineEvent> = Record<
  S,
  Partial<Record<EventType<E>, S>>
>

export interface StatefulMachine<S extends string, E extends MachineEvent> {
  readonly currentState: S
  canTransition(event: E): boolean
  transition(event: E): S
}

export interface MachineDefinition<S extends string, E extends MachineEvent> {
  readonly name: string
  readonly initialState: S
  canTransition(state: S, event: E): boolean
  transition(state: S, event: E): S
  createMachine(initialState?: S): StatefulMachine<S, E>
}

function resolveTransition<S extends string, E extends MachineEvent>(
  transitions: TransitionTable<S, E>,
  state: S,
  event: E,
): S | undefined {
  return transitions[state][event.type as EventType<E>]
}

export function createStateMachineDefinition<
  S extends string,
  E extends MachineEvent,
>({
  name,
  initialState,
  transitions,
}: {
  name: string
  initialState: S
  transitions: TransitionTable<S, E>
}): MachineDefinition<S, E> {
  const canTransition = (state: S, event: E) =>
    resolveTransition(transitions, state, event) !== undefined

  const transition = (state: S, event: E) => {
    const nextState = resolveTransition(transitions, state, event)

    if (nextState === undefined) {
      throw new Error(`Invalid ${name} transition: ${state} -> ${event.type}`)
    }

    return nextState
  }

  const createMachine = (startingState = initialState): StatefulMachine<S, E> => {
    let currentState = startingState

    return {
      get currentState() {
        return currentState
      },
      canTransition(event) {
        return canTransition(currentState, event)
      },
      transition(event) {
        currentState = transition(currentState, event)
        return currentState
      },
    }
  }

  return {
    name,
    initialState,
    canTransition,
    transition,
    createMachine,
  }
}
