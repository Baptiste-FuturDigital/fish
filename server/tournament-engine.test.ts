import { describe, expect, it } from "vitest"

import type { ChallengeDefinition } from "../shared/challenges/types.js"
import { projectRound, scoreRound } from "./tournament-engine.js"

const numericChallenge: ChallengeDefinition = {
  id: "le-juste-poisson",
  title: "Le juste poisson",
  shortTitle: "Juste Poisson",
  emoji: "⚖️",
  description: "Estime le poids.",
  rules: ["Une réponse par banc."],
  introMusicYoutubeId: "UaRrDZWhtWA",
  scoring: { kind: "ranked-relative", maxPoints: 4 },
  rounds: [{
    id: "poids-test",
    kind: "number",
    kicker: "Pesée",
    question: "Quel poids ?",
    durationSeconds: 20,
    unit: "kg",
    correctAnswer: 100,
    answerLabel: "100 kg",
    fact: "Un fait.",
    sourceUrl: "https://example.com",
  }],
}

const choiceChallenge: ChallengeDefinition = {
  ...numericChallenge,
  id: "question-pour-un-poisson",
  title: "Question pour un poisson",
  scoring: { kind: "exact", points: 2 },
  rounds: [{
    id: "quiz-test",
    kind: "choice",
    kicker: "Quiz",
    question: "Choisis.",
    durationSeconds: 20,
    choices: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
    correctAnswer: "b",
    answerLabel: "B",
    fact: "Un fait.",
    sourceUrl: "https://example.com",
  }],
}

describe("tournament engine", () => {
  it("ranks numeric answers by relative error and gives no points to missing teams", () => {
    expect(scoreRound(numericChallenge, 0, [
      { teamId: "team-a", answer: "90" },
      { teamId: "team-b", answer: "120" },
      { teamId: "team-c", answer: "50" },
      { teamId: "team-d", answer: null },
    ])).toEqual([
      expect.objectContaining({ teamId: "team-a", points: 4, distance: 0.1 }),
      expect.objectContaining({ teamId: "team-b", points: 3, distance: 0.2 }),
      expect.objectContaining({ teamId: "team-c", points: 2, distance: 0.5 }),
      expect.objectContaining({ teamId: "team-d", points: 0, distance: null }),
    ])
  })

  it("awards equal rank points to equal numeric answers", () => {
    const results = scoreRound(numericChallenge, 0, [
      { teamId: "team-a", answer: "90" },
      { teamId: "team-b", answer: "110" },
    ])
    expect(results.map((result) => result.points)).toEqual([4, 4])
  })

  it("scores exact answers and ignores invalid answers", () => {
    expect(scoreRound(choiceChallenge, 0, [
      { teamId: "team-a", answer: "b" },
      { teamId: "team-b", answer: "a" },
      { teamId: "team-c", answer: null },
    ])).toEqual([
      expect.objectContaining({ teamId: "team-a", points: 2, isCorrect: true }),
      expect.objectContaining({ teamId: "team-b", points: 0, isCorrect: false }),
      expect.objectContaining({ teamId: "team-c", points: 0, isCorrect: false }),
    ])
  })

  it("hides the answer until reveal", () => {
    expect(projectRound(choiceChallenge.rounds[0], false)).not.toHaveProperty("correctAnswer")
    expect(projectRound(choiceChallenge.rounds[0], false)).not.toHaveProperty("answerLabel")
    expect(projectRound(choiceChallenge.rounds[0], true)).toEqual(expect.objectContaining({
      correctAnswer: "b",
      answerLabel: "B",
      fact: "Un fait.",
    }))
  })
})
