"use client"

import { useState } from "react"
import { Trophy, Users } from "lucide-react"
import { TEAM_ORDER, TEAMS, type TeamKey } from "@/lib/football-api"
import { useStandings, useTeamData } from "@/lib/use-football"
import { StandingsTable } from "@/components/standings-table"
import { TeamCalendar } from "@/components/team-calendar"
import { LeagueCalendar } from "@/components/league-calendar"
import {
  EmptyState,
  ErrorState,
  MatchGridSkeleton,
  SectionTitle,
  Skeleton,
} from "@/components/states"

type CalendarView = "team" | "league"

export function Dashboard() {
  const [active, setActive] = useState<TeamKey>("barcelona")
  const [view, setView] = useState<CalendarView>("team")
  const team = TEAMS[active]

  const teamQuery = useTeamData(active)
  const standingsQuery = useStandings(active)

  return (
    <div
      className="min-h-screen bg-background"
      style={{ ["--team-accent" as string]: team.accent }}
    >
      {/* Ambient team-colored glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-64 opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, var(--team-accent), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Centro de mando
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance sm:text-3xl">
            Mis Equipos
          </h1>
        </header>

        {/* Team switcher */}
        <div className="mb-8 flex flex-wrap gap-2">
          {TEAM_ORDER.map((key) => {
            const t = TEAMS[key]
            const isActive = key === active
            return (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? "border-transparent text-background"
                    : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
                }`}
                style={isActive ? { backgroundColor: t.accent } : undefined}
              >
                {t.name}
              </button>
            )
          })}
        </div>

        {/* Team meta */}
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{team.name}</h2>
            <p className="text-sm text-muted-foreground">
              {team.leagueName}
              {teamQuery.data?.seasonLabel ? ` · ${teamQuery.data.seasonLabel}` : ""}
            </p>
          </div>
        </div>

        {/* Calendar view switcher */}
        <div className="mb-8 inline-flex rounded-lg border border-border bg-card/60 p-1">
          <ViewTab active={view === "team"} onClick={() => setView("team")} icon={<Users className="h-4 w-4" />}>
            Calendario del equipo
          </ViewTab>
          <ViewTab active={view === "league"} onClick={() => setView("league")} icon={<Trophy className="h-4 w-4" />}>
            Calendario de {team.leagueName}
          </ViewTab>
        </div>

        {/* Calendars */}
        <div className="mb-10">
          {view === "team" ? (
            teamQuery.isLoading ? (
              <div className="space-y-8">
                <MatchGridSkeleton />
                <MatchGridSkeleton />
              </div>
            ) : teamQuery.isError ? (
              <ErrorState
                message="No se pudo cargar el calendario del equipo desde ESPN."
                onRetry={() => teamQuery.refetch()}
              />
            ) : teamQuery.data && teamQuery.data.matches.length > 0 ? (
              <TeamCalendar data={teamQuery.data} />
            ) : (
              <EmptyState label="No hay partidos disponibles para este equipo." />
            )
          ) : (
            // League calendar manages its own data + matchday navigation.
            <LeagueCalendar key={active} team={team} />
          )}
        </div>

        {/* Standings */}
        <section className="mb-6">
          <SectionTitle icon={<Trophy className="h-4 w-4" />}>
            Tabla · {team.leagueName}
          </SectionTitle>
          {standingsQuery.isLoading ? (
            <Skeleton className="h-80" />
          ) : standingsQuery.isError ? (
            <ErrorState
              message="No se pudo cargar la clasificación desde ESPN."
              onRetry={() => standingsQuery.refetch()}
            />
          ) : standingsQuery.data && standingsQuery.data.length > 0 ? (
            <StandingsTable rows={standingsQuery.data} highlightId={team.espnId} />
          ) : (
            <EmptyState label="La clasificación no está disponible por el momento." />
          )}
        </section>

        <footer className="mt-10 border-t border-border pt-4 text-center text-[11px] text-muted-foreground">
          Datos en vivo vía ESPN · se actualiza automáticamente cada minuto
        </footer>
      </div>
    </div>
  )
}

function ViewTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
        active
          ? "bg-[var(--team-accent)] text-background"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
