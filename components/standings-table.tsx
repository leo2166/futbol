import Image from "next/image"
import type { StandingRow } from "@/lib/football-api"

export function StandingsTable({
  rows,
  highlightId,
}: {
  rows: StandingRow[]
  highlightId: string
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur-sm">
      <div className="grid grid-cols-[2rem_1fr_2rem_2rem_2rem_2rem_2.5rem_2.5rem] items-center gap-2 border-b border-border px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[2rem_1fr_2.5rem_2rem_2rem_2rem_3rem_2.5rem]">
        <span>#</span>
        <span>Equipo</span>
        <span className="text-center">PJ</span>
        <span className="hidden text-center sm:inline">G</span>
        <span className="hidden text-center sm:inline">E</span>
        <span className="hidden text-center sm:inline">P</span>
        <span className="text-center">DG</span>
        <span className="text-center font-bold text-foreground">PTS</span>
      </div>

      <div className="divide-y divide-border">
        {rows.map((row) => {
          const active = row.teamId === highlightId
          return (
            <div
              key={row.teamId}
              className={`grid grid-cols-[2rem_1fr_2rem_2rem_2rem_2rem_2.5rem_2.5rem] items-center gap-2 px-4 py-2.5 text-sm sm:grid-cols-[2rem_1fr_2.5rem_2rem_2rem_2rem_3rem_2.5rem] ${
                active
                  ? "bg-[var(--team-accent)]/12 relative"
                  : "hover:bg-muted/40"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-0 h-full w-0.5 bg-[var(--team-accent)]" />
              )}
              <span
                className={`font-mono tabular-nums ${
                  row.rank <= 4
                    ? "font-bold text-[var(--team-accent)]"
                    : "text-muted-foreground"
                }`}
              >
                {row.rank}
              </span>
              <div className="flex min-w-0 items-center gap-2">
                <div className="relative h-5 w-5 shrink-0">
                  {row.logo ? (
                    <Image
                      src={row.logo || "/placeholder.svg"}
                      alt=""
                      fill
                      sizes="20px"
                      className="object-contain"
                      crossOrigin="anonymous"
                      unoptimized
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-muted" />
                  )}
                </div>
                <span
                  className={`truncate ${
                    active ? "font-semibold text-foreground" : "text-foreground/90"
                  }`}
                >
                  {row.name}
                </span>
              </div>
              <span className="text-center font-mono tabular-nums text-muted-foreground">
                {row.played}
              </span>
              <span className="hidden text-center font-mono tabular-nums text-muted-foreground sm:inline">
                {row.wins}
              </span>
              <span className="hidden text-center font-mono tabular-nums text-muted-foreground sm:inline">
                {row.draws}
              </span>
              <span className="hidden text-center font-mono tabular-nums text-muted-foreground sm:inline">
                {row.losses}
              </span>
              <span className="text-center font-mono tabular-nums text-muted-foreground">
                {row.goalDiff}
              </span>
              <span className="text-center font-mono font-bold tabular-nums text-foreground">
                {row.points}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
