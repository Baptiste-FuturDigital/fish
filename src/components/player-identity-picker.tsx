import { useEffect, useMemo, useState } from "react"

import type { PlayerIdentityChoice } from "@shared/game"
import { gameApi } from "@/api"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PlayerIdentityPickerProps {
  code: string
  identityId: string
  nickname: string
  onIdentityChange: (identityId: string) => void
  onNicknameChange: (nickname: string) => void
}

export function PlayerIdentityPicker({
  code,
  identityId,
  nickname,
  onIdentityChange,
  onNicknameChange,
}: PlayerIdentityPickerProps) {
  const [choices, setChoices] = useState<PlayerIdentityChoice[]>([])
  const [loading, setLoading] = useState(false)
  const normalizedCode = code.trim().toUpperCase()

  useEffect(() => {
    if (normalizedCode.length !== 4) {
      setChoices([])
      return
    }
    let active = true
    setLoading(true)
    gameApi.identities(normalizedCode)
      .then((nextChoices) => {
        if (active) setChoices(nextChoices)
      })
      .catch(() => {
        if (active) setChoices([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [normalizedCode])

  const selected = useMemo(
    () => choices.find((choice) => choice.id === identityId) ?? null,
    [choices, identityId],
  )
  const selectItems = useMemo(
    () => choices.map((choice) => ({ label: choice.displayName, value: choice.id })),
    [choices],
  )

  return (
    <>
      <Field>
        <FieldLabel htmlFor="player-identity">Qui es-tu ?</FieldLabel>
        <Select
          items={selectItems}
          value={identityId || null}
          onValueChange={(value) => onIdentityChange(value ?? "")}
          disabled={normalizedCode.length !== 4 || loading}
        >
          <SelectTrigger id="player-identity" className="h-12 w-full">
            <SelectValue placeholder={loading ? "Recherche du banc…" : "Choisis ton prénom"} />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectGroup>
              <SelectLabel>Invités de Poséithon</SelectLabel>
              {choices.map((choice) => (
                <SelectItem key={choice.id} value={choice.id} disabled={!choice.available}>
                  <span>{choice.displayName}{choice.available ? "" : " · déjà à bord"}</span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldDescription>
          {normalizedCode.length !== 4
            ? "Entre d'abord le code à quatre caractères."
            : "Chaque invitation nominative ne peut être utilisée qu'une fois."}
        </FieldDescription>
      </Field>

      {selected?.anonymous ? (
        <Field>
          <FieldLabel htmlFor="player-name">Ton pseudo</FieldLabel>
          <Input
            id="player-name"
            value={nickname}
            maxLength={24}
            onChange={(event) => onNicknameChange(event.target.value)}
            autoComplete="nickname"
            autoFocus
            placeholder="Ton nom de poisson"
          />
        </Field>
      ) : null}
    </>
  )
}
