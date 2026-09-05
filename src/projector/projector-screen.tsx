import { useState } from "react"
import { Crown, Radio, ScanLine, Trophy, Users, Waves } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

import type { TvGameView, TvPlayerView, TvTeamView, TvTournamentView } from "@shared/tv"
import { PlayerPortraitLightbox } from "@/components/player-portrait-lightbox"
import { toDisplayPoints } from "@/components/score-display"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { projectorSceneKind } from "./projector-route.js"

import "./projector-screen.css"

const PROJECTOR_BUBBLES = Array.from({ length: 18 }, (_, index) => index)
const CHALLENGE_INTRO_LABELS = [
  "PREMIÈRE ÉPREUVE",
  "DEUXIÈME ÉPREUVE",
  "TROISIÈME ÉPREUVE",
  "QUATRIÈME ÉPREUVE",
] as const

function playerInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "🐟"
}

function ProjectorChrome({ game, children }: { game: TvGameView; children: React.ReactNode }) {
  return (
    <main className="projector-viewport">
      <section className="projector-stage" data-testid="projector-stage">
        <div className="projector-caustics" aria-hidden="true" />
        <div className="projector-bubbles" aria-hidden="true">
          {PROJECTOR_BUBBLES.map((bubble) => <i key={bubble} />)}
        </div>
        <header className="projector-topbar">
          <div className="projector-brand">
            <span aria-hidden="true">🐡</span>
            <div>
              <p>L’AQUARIUM EN FOLIE</p>
              <strong>Fish Tournament</strong>
            </div>
          </div>
          <div className="projector-live">
            <Radio aria-hidden="true" />
            <span>ÉCRAN PUBLIC · SYNCHRONISÉ</span>
            <strong>{game.code}</strong>
          </div>
        </header>
        <div className="projector-content">{children}</div>
      </section>
    </main>
  )
}

function ProjectorTeamScore({ team, rank }: { team: TvTeamView; rank: number }) {
  return (
    <li className="projector-team-score" data-rank={rank}>
      <span>{rank === 1 ? <Crown aria-label="Premier" /> : rank}</span>
      <strong>{team.name}</strong>
      <b>{toDisplayPoints(team.score)}</b>
      <small>PTS</small>
    </li>
  )
}

function TeamScoreRail({ game }: { game: TvGameView }) {
  const ranking = [...game.teams].sort((left, right) => right.score - left.score || left.name.localeCompare(right.name, "fr"))
  return (
    <ol className="projector-team-score-rail" aria-label="Scores des bancs">
      {ranking.map((team, index) => <ProjectorTeamScore team={team} rank={index + 1} key={team.id} />)}
    </ol>
  )
}

export const ProjectorPortraitLightbox = PlayerPortraitLightbox

function LobbyScene({ game, joinUrl }: { game: TvGameView; joinUrl: string }) {
  const players = game.players
  const waiting = players.filter((player) => !player.teamId)
  const [selectedPlayer, setSelectedPlayer] = useState<TvPlayerView | null>(null)

  return (
    <section className="projector-lobby" aria-labelledby="projector-lobby-title">
      <div className="projector-lobby-join">
        <Badge variant="secondary"><ScanLine data-icon="inline-start" /> Embarquement ouvert</Badge>
        <h1 id="projector-lobby-title">Scanne pour rejoindre</h1>
        <div className="projector-qr">
          <QRCodeSVG
            value={joinUrl}
            size={312}
            bgColor="transparent"
            fgColor="#102c37"
            level="M"
            title={`Rejoindre la partie ${game.code}`}
          />
        </div>
        <p className="projector-lobby-code">CODE <strong>{game.code}</strong></p>
        <p className="projector-join-url">{joinUrl}</p>
      </div>

      <div className="projector-lobby-roster">
        <header>
          <div>
            <p>LE BASSIN SE REMPLIT</p>
            <h2>{game.name}</h2>
          </div>
          <strong><Users aria-hidden="true" /> {players.length} poissons</strong>
        </header>
        <div className="projector-team-grid">
          {game.teams.map((team) => {
            const teamPlayers = players.filter((player) => player.teamId === team.id)
            return (
            <Card className="projector-team-card projector-team-card-rainbow" key={team.id}>
              <CardHeader>
                <CardTitle>{team.name}</CardTitle>
                <span>{team.memberCount}</span>
              </CardHeader>
              <CardContent>
                {teamPlayers.map((player) => (
                    <button
                      type="button"
                      className="projector-roster-player"
                      key={`${player.name}-${player.imageUrl}`}
                      aria-label={`Agrandir la photo de ${player.name}`}
                      onClick={() => setSelectedPlayer(player)}
                    >
                      <Avatar>
                        <AvatarImage src={player.imageUrl} alt="" />
                        <AvatarFallback>{playerInitials(player.name)}</AvatarFallback>
                      </Avatar>
                      <span>{player.name}</span>
                    </button>
                ))}
                {team.memberCount === 0 ? <p className="projector-empty-team">Banc en formation…</p> : null}
              </CardContent>
            </Card>
            )
          })}
        </div>
        {waiting.length > 0 ? (
          <p className="projector-waiting">🫧 Attribution en cours : {waiting.map((player) => player.name).join(", ")}</p>
        ) : null}
      </div>
      {selectedPlayer ? (
        <ProjectorPortraitLightbox player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      ) : null}
    </section>
  )
}

function TournamentProgress({ tournament }: { tournament: TvTournamentView }) {
  const progress = ((tournament.challengeIndex + (tournament.roundIndex + 1) / tournament.roundCount) / tournament.challengeCount) * 100
  return (
    <div className="projector-tournament-progress">
      <span>Épreuve {tournament.challengeIndex + 1} / {tournament.challengeCount}</span>
      <Progress value={progress} aria-label="Progression du tournoi" />
      <strong>Manche {tournament.roundIndex + 1} / {tournament.roundCount}</strong>
    </div>
  )
}

function IntroScene({ game, tournament }: { game: TvGameView; tournament: TvTournamentView }) {
  return (
    <section className="projector-intro" aria-labelledby="projector-intro-title">
      <div className="projector-intro-art">
        {tournament.challenge.introImageUrl || tournament.challenge.presenterImageUrl ? (
          <img
            src={tournament.challenge.introImageUrl ?? tournament.challenge.presenterImageUrl}
            alt=""
          />
        ) : <span aria-hidden="true">{tournament.challenge.emoji}</span>}
        <div className="projector-intro-number">0{tournament.challengeIndex + 1}</div>
      </div>
      <div className="projector-intro-copy">
        <Badge variant="secondary">Épreuve {tournament.challengeIndex + 1} / {tournament.challengeCount}</Badge>
        <p>{CHALLENGE_INTRO_LABELS[tournament.challengeIndex] ?? `ÉPREUVE ${tournament.challengeIndex + 1}`}</p>
        <h1 id="projector-intro-title">{tournament.challenge.title}</h1>
        <p className="projector-intro-description">{tournament.challenge.description}</p>
        <ol className="projector-rules">
          {tournament.challenge.rules.map((rule, index) => (
            <li key={rule}><span>{index + 1}</span>{rule}</li>
          ))}
        </ol>
        <TeamScoreRail game={game} />
      </div>
    </section>
  )
}

function remainingSeconds(tournament: TvTournamentView) {
  if (!tournament.endsAt) return Math.ceil((tournament.pausedRemainingMs ?? 0) / 1_000)
  return Math.max(0, Math.ceil((Date.parse(tournament.endsAt) - Date.now()) / 1_000))
}

function RoundVisual({ tournament, revealed }: { tournament: TvTournamentView; revealed: boolean }) {
  const round = tournament.round
  if (!round.imageUrl) {
    return <div className="projector-round-placeholder" aria-hidden="true">{tournament.challenge.emoji}</div>
  }
  return (
    <div className="projector-round-image" data-masked={!revealed && round.maskImage ? "true" : "false"}>
      <img src={round.imageUrl} alt={revealed ? round.answerLabel ?? "Créature révélée" : "Créature marine à deviner"} />
      {!revealed && round.maskImage ? <span aria-hidden="true">?</span> : null}
    </div>
  )
}

function ChoiceGrid({ tournament }: { tournament: TvTournamentView }) {
  return (
    <ol className="projector-choice-grid" aria-label="Réponses proposées">
      {tournament.round.choices?.map((choice, index) => (
        <li key={choice.id}><span>{String.fromCharCode(65 + index)}</span>{choice.label}</li>
      ))}
    </ol>
  )
}

function AnsweringScene({ game, tournament }: { game: TvGameView; tournament: TvTournamentView }) {
  const playerCount = game.players.filter((player) => player.teamId).length
  const answeredCount = tournament.answerProgress.reduce((total, team) => total + team.lockedCount, 0)
  const seconds = remainingSeconds(tournament)
  const isBuzzer = tournament.round.kind === "buzzer"

  return (
    <section className="projector-gameplay" aria-labelledby="projector-question">
      <TournamentProgress tournament={tournament} />
      <div className="projector-gameplay-grid">
        <RoundVisual tournament={tournament} revealed={false} />
        <div className="projector-question-panel">
          <p>{tournament.round.kicker}</p>
          <h1 id="projector-question">{tournament.round.question}</h1>
          {isBuzzer ? (
            <div className="projector-buzz-public" data-active={Boolean(tournament.buzz)}>
              <span>{tournament.buzz ? "BUZZ !" : "CHRONO"}</span>
              <strong>{tournament.buzz ? tournament.buzz.teamName : seconds}</strong>
              <p>{tournament.buzz ? `${tournament.buzz.teamName} prend la parole` : "secondes restantes"}</p>
            </div>
          ) : tournament.round.kind === "choice" ? (
            <ChoiceGrid tournament={tournament} />
          ) : (
            <div className="projector-estimate-hint">
              <span>⚖️</span>
              <p>À vos estimations</p>
              <strong>Glissez le curseur sur votre téléphone</strong>
            </div>
          )}
          {!isBuzzer ? (
            <div className="projector-answer-progress" role="status">
              <div><span style={{ width: `${playerCount > 0 ? answeredCount / playerCount * 100 : 0}%` }} /></div>
              <strong>{answeredCount} / {playerCount} poissons ont répondu</strong>
            </div>
          ) : null}
        </div>
      </div>
      <TeamScoreRail game={game} />
    </section>
  )
}

function RevealScene({ game, tournament }: { game: TvGameView; tournament: TvTournamentView }) {
  const topResults = [...tournament.results].sort((left, right) => right.points - left.points || left.playerName.localeCompare(right.playerName, "fr")).slice(0, 8)
  return (
    <section className="projector-reveal" aria-labelledby="projector-answer">
      <TournamentProgress tournament={tournament} />
      <div className="projector-reveal-grid">
        <RoundVisual tournament={tournament} revealed />
        <div className="projector-reveal-copy">
          <p>LA RÉPONSE ÉTAIT…</p>
          <h1 id="projector-answer">{tournament.round.answerLabel}</h1>
          <blockquote>{tournament.round.fact}</blockquote>
          {topResults.length > 0 ? (
            <ol className="projector-round-results" aria-label="Résultats de la manche">
              {topResults.map((result, index) => (
                <li key={`${result.playerName}-${result.teamId}`} data-correct={result.isCorrect}>
                  <span>{index + 1}</span>
                  <strong>{result.playerName}</strong>
                  <small>{game.teams.find((team) => team.id === result.teamId)?.name}</small>
                  <b>+{toDisplayPoints(result.points)}</b>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </div>
      <TeamScoreRail game={game} />
    </section>
  )
}

function PlayerRankingScene({ game, tournament }: { game: TvGameView; tournament: TvTournamentView }) {
  const ranking = game.players
    .slice()
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name, "fr"))
  const teamNames = new Map(game.teams.map((team) => [team.id, team.name]))
  return (
    <section className="projector-leaderboard" aria-labelledby="projector-leaderboard-title">
      <header>
        <div className="projector-trophy"><Trophy aria-hidden="true" /></div>
        <div>
          <p>Classement individuel · après l’épreuve {tournament.challengeIndex + 1}</p>
          <h1 id="projector-leaderboard-title">La grille des poissons</h1>
        </div>
        <strong>{ranking.length} compétiteurs</strong>
      </header>
      <ol className="projector-player-ranking">
        {ranking.map((player, index) => (
          <li key={`${player.name}-${player.imageUrl}`} data-rank={index + 1}>
            <span>{index === 0 ? <Crown aria-label="Premier" /> : index + 1}</span>
            <Avatar>
              <AvatarImage src={player.imageUrl} alt="" />
              <AvatarFallback>{playerInitials(player.name)}</AvatarFallback>
            </Avatar>
            <div><strong>{player.name}</strong><small>{player.teamId ? teamNames.get(player.teamId) : "Sans banc"}</small></div>
            <b>{toDisplayPoints(player.score)}</b>
          </li>
        ))}
      </ol>
      <TeamScoreRail game={game} />
    </section>
  )
}

function FinalScene({ game }: { game: TvGameView }) {
  const ranking = [...game.teams].sort((left, right) => right.score - left.score || left.name.localeCompare(right.name, "fr"))
  const winner = ranking[0]
  const winnerNames = game.players.filter((player) => player.teamId === winner?.id).map((player) => player.name).join(" · ")
  return (
    <section className="projector-final" aria-labelledby="projector-final-title">
      <div className="projector-confetti" aria-hidden="true">✦　●　★　◆　✦　●　★　◆　✦</div>
      <div className="projector-poseithon">
        <img src="/references/poseithon.png" alt="Poséithon, dieu des océans" />
      </div>
      <div className="projector-final-copy">
        <Badge variant="secondary">Le verdict de Poséithon</Badge>
        <p>LE BANC SACRÉ CHAMPION DES OCÉANS</p>
        <h1 id="projector-final-title">{winner?.name ?? "Un banc mystérieux"}</h1>
        <strong>{toDisplayPoints(winner?.score ?? 0)} points divins</strong>
        <p>{winnerNames}</p>
        <ol className="projector-final-ranking" aria-label="Classement final des bancs">
          {ranking.map((team, index) => <ProjectorTeamScore team={team} rank={index + 1} key={team.id} />)}
        </ol>
      </div>
    </section>
  )
}

export function ProjectorScreen({ game, joinUrl }: { game: TvGameView; joinUrl: string }) {
  const scene = projectorSceneKind(game)
  const tournament = game.tournament
  let content: React.ReactNode

  if (scene === "lobby") content = <LobbyScene game={game} joinUrl={joinUrl} />
  else if (scene === "final") content = <FinalScene game={game} />
  else if (!tournament) content = <div className="projector-empty-state"><Waves /><h1>Poséithon prépare l’aquarium…</h1></div>
  else if (scene === "intro") content = <IntroScene game={game} tournament={tournament} />
  else if (scene === "gameplay") content = <AnsweringScene game={game} tournament={tournament} />
  else if (scene === "reveal") content = <RevealScene game={game} tournament={tournament} />
  else content = <PlayerRankingScene game={game} tournament={tournament} />

  return <ProjectorChrome game={game}>{content}</ProjectorChrome>
}
