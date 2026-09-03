export interface MillionaireAnswerState {
  phase: "choosing" | "confirming"
  selectedAnswer: string
}

export type MillionaireAnswerAction =
  | { type: "select"; answer: string }
  | { type: "request-confirmation" }
  | { type: "reconsider" }

export function createMillionaireAnswerState(
  selectedAnswer: string,
): MillionaireAnswerState {
  return { phase: "choosing", selectedAnswer }
}

export function millionaireAnswerReducer(
  state: MillionaireAnswerState,
  action: MillionaireAnswerAction,
): MillionaireAnswerState {
  if (action.type === "select") {
    return { phase: "choosing", selectedAnswer: action.answer }
  }

  if (action.type === "request-confirmation") {
    return state.selectedAnswer
      ? { ...state, phase: "confirming" }
      : state
  }

  return { ...state, phase: "choosing" }
}
