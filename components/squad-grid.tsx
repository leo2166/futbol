"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Shield, User, Users } from "lucide-react"
import type { SquadPlayer } from "@/lib/football-api"
import { EmptyState, ErrorState, SectionTitle, Skeleton } from "@/components/states"

const POSITIONS = ["Todos", "Portero", "Defensa", "Centrocampista", "Delantero"] as const
type PositionFilter = (typeof POSITIONS)[number]

export function SquadGrid({
  players,
  isLoading,
  isError,
  onRetry,
}: {
  players?: SquadPlayer[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}) {
  const [filter, setFilter] = useState<PositionFilter>("Todos")

  const filtered = useMemo(() => {
    if (!players) return []
    if (filter === "Todos") return players
    return players.filter((p) => p.position === filter)
  }, [players, filter])

  const counts = useMemo(() => {
    const map: Record<string, number> = { Todos: players?.length ?? 0 }
    players?.forEach((p) => {
      map[p.position] = (map[p.position] || 0) + 1
    })
    return map
  }, [players])

  return (
    <section>
      <SectionTitle icon={<Users className="h-4 w-4" />}>
        Plantilla Oficial
      </SectionTitle>

      {/* Position Filter Chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        {POSITIONS.map((pos) => {
          const active = filter === pos
          const count = counts[pos] || 0
          return (
            <button
              key={pos}
              onClick={() => setFilter(pos)}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                active
                  ? "border-[var(--team-accent)] bg-[var(--team-accent)]/15 text-foreground"
                  : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{pos === "Todos" ? "Todos" : `${pos}s`}</span>
              <span className="ml-1.5 text-[10px] opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card/60 p-3 text-center space-y-2">
              <Skeleton className="h-24 w-24 rounded-full mx-auto" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-3 w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message="No se pudo cargar la plantilla desde ESPN."
          onRetry={onRetry}
        />
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((player) => (
            <div
              key={player.id}
              className="group relative flex flex-col items-center justify-between rounded-xl border border-border bg-card/60 p-3.5 text-center backdrop-blur-sm transition-all hover:border-[var(--team-accent)]/50 hover:bg-card/80 hover:scale-[1.02]"
            >
              {/* Jersey Number Badge */}
              <div className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-muted/80 font-mono text-xs font-bold text-[var(--team-accent)]">
                {player.jersey}
              </div>

              {/* Headshot */}
              <div className="relative mb-2.5 h-20 w-20 overflow-hidden rounded-full bg-muted border border-border group-hover:border-[var(--team-accent)]/30 transition-colors">
                {player.photoUrl ? (
                  <Image
                    src={player.photoUrl}
                    alt={player.name}
                    fill
                    sizes="80px"
                    className="object-cover transition-transform group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <User className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* Name & Position */}
              <div className="w-full">
                <p className="truncate text-xs font-bold text-foreground">
                  {player.name}
                </p>
                <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                  {player.flagUrl && (
                    <div className="relative h-3 w-4 shrink-0 overflow-hidden rounded-xs">
                      <Image
                        src={player.flagUrl}
                        alt={player.citizenship || ""}
                        fill
                        sizes="16px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <span className="truncate">{player.position}</span>
                  {player.age && (
                    <span className="font-mono text-[10px] text-muted-foreground/70">
                      · {player.age}a
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState label="No hay jugadores registrados en esta categoría." />
      )}
    </section>
  )
}
