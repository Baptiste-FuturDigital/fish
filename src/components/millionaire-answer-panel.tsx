import { useReducer } from "react"
import { CheckCircle2, ChevronLeft, LoaderCircle, LockKeyhole, Scissors } from "lucide-react"

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
  locked?: boolean
  verdict?: "correct" | "wrong" | null
  joker: {
    available: boolean
    keptChoiceIds: readonly string[] | null
  }
  jokerBusy: boolean
  onUseFiftyFifty: () => void
  onValueChange: (value: string) => void
}

export function MillionaireAnswerPanel({
  choices,
  value,
  confirmationLabel,
  busy,
  locked = false,
  verdict = null,
  joker,
  jokerBusy,
  onUseFiftyFifty,
  onValueChange,
}: MillionaireAnswerPanelProps) {
  const [state, dispatch] = useReducer(
    millionaireAnswerReducer,
    value,
    createMillionaireAnswerState,
  )
  const selectedIndex = choices.findIndex(
    (choice) => choice.id === (locked ? value : state.selectedAnswer),
  )
  const selectedChoice = choices[selectedIndex]
  const selectedAnswer = locked ? value : state.selectedAnswer
  const displayedChoices = joker.keptChoiceIds
    ? choices.filter((choice) => joker.keptChoiceIds?.includes(choice.id))
    : choices

  if (!locked && state.phase === "confirming" && selectedChoice) {
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
      <div className="millionaire-joker-zone">
        <Button
          className="millionaire-joker"
          type="button"
          variant="outline"
          disabled={locked || !joker.available || Boolean(selectedAnswer) || busy || jokerBusy}
          onClick={onUseFiftyFifty}
        >
          {jokerBusy
            ? <LoaderCircle className="animate-spin" data-icon="inline-start" />
            : <Scissors data-icon="inline-start" />}
          {joker.available ? "Joker 50/50" : "Joker utilisé"}
        </Button>
        <p>{joker.available ? "Une seule fois pour tout ton banc" : "Deux réponses ont disparu"}</p>
      </div>
      <Field>
        <FieldLabel>Choisis ta réponse</FieldLabel>
        <ToggleGroup
          className="millionaire-options"
          variant="outline"
          value={selectedAnswer ? [selectedAnswer] : []}
          onValueChange={(values) => {
            if (locked) return
            const answer = (values as string[])[0] ?? ""
            dispatch({ type: "select", answer })
            onValueChange(answer)
          }}
        >
          {displayedChoices.map((choice) => {
            const originalIndex = choices.findIndex((candidate) => candidate.id === choice.id)
            return (
            <ToggleGroupItem
              className="millionaire-option"
              value={choice.id}
              key={choice.id}
              data-choice-id={choice.id}
              data-answer-state={choice.id === selectedAnswer
                ? verdict ?? (locked ? "locked" : undefined)
                : undefined}
              disabled={locked}
            >
              <strong>{String.fromCharCode(65 + originalIndex)}</strong>
              <span>{choice.label}</span>
            </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      </Field>
      {locked ? (
        <div className="millionaire-locked-status" role="status" aria-live="polite">
          {verdict === "correct" ? <CheckCircle2 aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}
          <strong>{verdict === "correct"
            ? "Bonne réponse"
            : verdict === "wrong"
              ? "Mauvaise réponse"
              : "Réponse verrouillée"}</strong>
          <span>{verdict ? "Verdict de Poséithon" : "Ton dernier mot est enregistré"}</span>
        </div>
      ) : (
        <Button
          size="lg"
          type="button"
          disabled={!state.selectedAnswer || busy}
          onClick={() => dispatch({ type: "request-confirmation" })}
        >
          <LockKeyhole data-icon="inline-start" /> Verrouiller cette réponse
        </Button>
      )}
    </div>
  )
}
