import { useReducer } from "react"
import { CheckCircle2, ChevronLeft, LockKeyhole } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  createMillionaireAnswerState,
  millionaireAnswerReducer,
} from "./millionaire-answer-state.js"

import "./millionaire-answer-panel.css"

interface MillionaireChoice {
  id: string
  label: string
}

interface MillionaireAnswerPanelProps {
  choices: readonly MillionaireChoice[]
  value: string
  confirmationLabel: string
  busy: boolean
  onValueChange: (value: string) => void
}

export function MillionaireAnswerPanel({
  choices,
  value,
  confirmationLabel,
  busy,
  onValueChange,
}: MillionaireAnswerPanelProps) {
  const [state, dispatch] = useReducer(
    millionaireAnswerReducer,
    value,
    createMillionaireAnswerState,
  )
  const selectedIndex = choices.findIndex(
    (choice) => choice.id === state.selectedAnswer,
  )
  const selectedChoice = choices[selectedIndex]

  if (state.phase === "confirming" && selectedChoice) {
    return (
      <section
        className="millionaire-confirmation"
        data-testid="millionaire-confirmation"
        aria-live="polite"
      >
        <span className="millionaire-lock" aria-hidden="true">
          <LockKeyhole />
        </span>
        <p>Attention, les branchies vont se verrouiller</p>
        <h3>Est-ce votre dernier mot&nbsp;?</h3>
        <div className="millionaire-final-choice">
          <strong>{String.fromCharCode(65 + selectedIndex)}</strong>
          <span>{selectedChoice.label}</span>
        </div>
        <div className="millionaire-confirmation-actions">
          <Button
            type="button"
            variant="outline"
            onClick={() => dispatch({ type: "reconsider" })}
            disabled={busy}
          >
            <ChevronLeft data-icon="inline-start" /> Changer
          </Button>
          <Button type="submit" disabled={busy}>
            <CheckCircle2 data-icon="inline-start" />
            {busy ? "Verrouillage…" : confirmationLabel}
          </Button>
        </div>
      </section>
    )
  }

  return (
    <div className="millionaire-answer-panel" data-testid="millionaire-answer-panel">
      <Field>
        <FieldLabel>La réponse de votre banc</FieldLabel>
        <ToggleGroup
          className="millionaire-options"
          variant="outline"
          value={state.selectedAnswer ? [state.selectedAnswer] : []}
          onValueChange={(values) => {
            const answer = (values as string[])[0] ?? ""
            dispatch({ type: "select", answer })
            onValueChange(answer)
          }}
        >
          {choices.map((choice, index) => (
            <ToggleGroupItem
              className="millionaire-option"
              value={choice.id}
              key={choice.id}
            >
              <strong>{String.fromCharCode(65 + index)}</strong>
              <span>{choice.label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
      <Button
        size="lg"
        type="button"
        disabled={!state.selectedAnswer || busy}
        onClick={() => dispatch({ type: "request-confirmation" })}
      >
        <LockKeyhole data-icon="inline-start" /> Verrouiller cette réponse
      </Button>
    </div>
  )
}
