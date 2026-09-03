import { useEffect, useRef, useState } from "react"
import { Camera, LoaderCircle, ScanFace, Sparkles } from "lucide-react"

import type { TotemView } from "@shared/game"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type ScanPhase = "idle" | "revealed" | "scanning"

interface TotemScanProps {
  totem: TotemView | null
  onClaim: () => Promise<TotemView>
}

const SCAN_DURATION_MS = 5_000

function waitForReveal() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, SCAN_DURATION_MS))
}

export function TotemScan({ totem, onClaim }: TotemScanProps) {
  const [phase, setPhase] = useState<ScanPhase>(totem ? "revealed" : "idle")
  const [revealedTotem, setRevealedTotem] = useState<TotemView | null>(totem)
  const [hasCamera, setHasCamera] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (totem && phase === "idle") {
      setRevealedTotem(totem)
      setPhase("revealed")
    }
  }, [phase, totem])

  useEffect(() => {
    const stream = streamRef.current
    if (stream && videoRef.current) videoRef.current.srcObject = stream
  }, [hasCamera, phase])

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setHasCamera(false)
  }

  async function requestCamera() {
    if (!navigator.mediaDevices?.getUserMedia) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user" },
      })
      streamRef.current = stream
      setHasCamera(true)
    } catch {
      setHasCamera(false)
    }
  }

  async function startScan() {
    setError(null)
    setPhase("scanning")
    void requestCamera()
    const revealDelay = waitForReveal()

    try {
      await revealDelay
      const assignedTotem = await onClaim()
      stopCamera()
      setRevealedTotem(assignedTotem)
      setPhase("revealed")
    } catch (caught) {
      stopCamera()
      setPhase("idle")
      setError(caught instanceof Error ? caught.message : "Le sonar a perdu ta trace.")
    }
  }

  if (phase === "revealed" && revealedTotem) {
    return (
      <Card className="mb-4 overflow-hidden">
        <div className="totem-reveal-image-wrap">
          <img
            data-testid="totem-reveal-image"
            src={revealedTotem.imageUrl}
            alt={revealedTotem.name}
            className="size-full object-cover"
          />
        </div>
        <CardHeader className="text-center">
          <CardDescription>Votre animal totem est…</CardDescription>
          <CardTitle className="font-heading text-3xl font-black capitalize">{revealedTotem.name}</CardTitle>
          <Badge variant="secondary" className="mx-auto">{revealedTotem.teamName}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm leading-relaxed text-muted-foreground">{revealedTotem.fact}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="text-center">
        <CardDescription>Attribution des équipes</CardDescription>
        <CardTitle className="font-heading text-3xl font-black">Trouve ton animal totem</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {phase === "scanning" ? (
          <div className="totem-scanner" data-testid="totem-scanner">
            <video ref={videoRef} autoPlay muted playsInline aria-label="Aperçu caméra local" />
            {!hasCamera && <ScanFace className="totem-scan-fallback" aria-hidden="true" />}
            <div className="totem-scan-grid" aria-hidden="true" />
            <div className="totem-scan-line" aria-hidden="true" />
            <div className="totem-scan-status">
              <LoaderCircle className="animate-spin" aria-hidden="true" />
              Analyse ADN marin…
            </div>
            <div className="totem-scan-progress" aria-hidden="true"><span /></div>
          </div>
        ) : (
          <>
            <div className="totem-scan-intro" aria-hidden="true">
              <Camera />
              <Sparkles />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Visage analysé localement. Rien n'est enregistré ni envoyé.
            </p>
            <Button size="lg" className="w-full" onClick={startScan}>
              <ScanFace data-icon="inline-start" /> Scanner mon visage
            </Button>
          </>
        )}
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      </CardContent>
    </Card>
  )
}
