// ESPN public (unofficial) soccer API — verified live on 2026-08-13.
// Base: https://site.api.espn.com/apis/site/v2/sports/soccer/{league}
//
// IMPORTANT real-world quirk (verified): for European leagues (esp.1) the bare
// /schedule call defaults to the *upcoming* season which can have 0 events.
// We must resolve the correct `season` year dynamically by probing candidates
// and picking the first one that actually returns events. Never hardcode a year.

const SITE_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer"
const CORE_BASE = "https://site.api.espn.com/apis/v2/sports/soccer"

export type TeamKey = "barcelona" | "real-madrid" | "inter-miami"

export interface TeamConfig {
  key: TeamKey
  name: string
  shortName: string
  league: string // ESPN league slug, e.g. "esp.1"
  leagueName: string
  espnId: string // verified ESPN team id
  accent: string // oklch accent used for per-team theming
}

// Team ids verified against the live /teams endpoints.
export const TEAMS: Record<TeamKey, TeamConfig> = {
  barcelona: {
    key: "barcelona",
    name: "FC Barcelona",
    shortName: "Barça",
    league: "esp.1",
    leagueName: "LaLiga",
    espnId: "83",
    accent: "oklch(0.55 0.19 15)", // garnet/red
  },
  "real-madrid": {
    key: "real-madrid",
    name: "Real Madrid",
    shortName: "Madrid",
    league: "esp.1",
    leagueName: "LaLiga",
    espnId: "86",
    accent: "oklch(0.72 0.16 85)", // gold
  },
  "inter-miami": {
    key: "inter-miami",
    name: "Inter Miami CF",
    shortName: "Miami",
    league: "usa.1",
    leagueName: "MLS",
    espnId: "20232",
    accent: "oklch(0.68 0.19 350)", // miami pink
  },
}

export const TEAM_ORDER: TeamKey[] = ["barcelona", "real-madrid", "inter-miami"]

// ---- Raw ESPN response shapes (only the fields we actually read) ----

interface EspnScore {
  value?: number
  displayValue?: string
  winner?: boolean
}

interface EspnCompetitor {
  homeAway: "home" | "away"
  winner?: boolean
  score?: EspnScore | string
  team: {
    id: string
    displayName: string
    shortDisplayName?: string
    abbreviation?: string
    logo?: string
    logos?: { href: string }[]
  }
}

interface EspnStatusType {
  name?: string // e.g. STATUS_FULL_TIME, STATUS_SCHEDULED, STATUS_IN_PROGRESS
  completed?: boolean
  state?: string // "pre" | "in" | "post"
  shortDetail?: string
}

interface EspnLeagueRef {
  id?: string
  name?: string
  shortName?: string
  abbreviation?: string
  slug?: string
  isTournament?: boolean
}

interface EspnEvent {
  id: string
  date: string
  name: string
  league?: EspnLeagueRef
  competitions: {
    venue?: { fullName?: string }
    status?: { type?: EspnStatusType }
    competitors: EspnCompetitor[]
  }[]
}

interface EspnScheduleResponse {
  season?: { year?: number; displayName?: string }
  events?: EspnEvent[]
}

interface EspnScoreboardResponse {
  leagues?: {
    name?: string
    abbreviation?: string
    season?: { displayName?: string; year?: number }
    calendar?: string[] // ISO dates that have fixtures this season
  }[]
  events?: EspnEvent[]
}

interface EspnStandingsEntry {
  team: { id: string; displayName: string; logos?: { href: string }[]; logo?: string }
  stats: { name: string; displayValue?: string; value?: number }[]
}

interface EspnStandingsResponse {
  children?: { standings?: { entries?: EspnStandingsEntry[] } }[]
  standings?: { entries?: EspnStandingsEntry[] }
}

// ---- Normalized types consumed by the UI ----

export interface MatchSide {
  teamId: string
  name: string
  logo: string | null
  score: number | null
  winner: boolean | null
  isHome: boolean
}

export interface Competition {
  name: string // full name, e.g. "UEFA Champions League"
  short: string // shortened label, e.g. "Champions"
  slug: string | null
  isTournament: boolean
}

export interface Match {
  id: string
  date: string // ISO
  venue: string | null
  state: "pre" | "in" | "post"
  statusDetail: string | null
  completed: boolean
  competition: Competition | null
  home: MatchSide
  away: MatchSide
}

// Human-friendly, compact competition labels (Spanish UI).
export function shortCompetition(name: string): string {
  const map: Record<string, string> = {
    "Spanish LALIGA": "LaLiga",
    "UEFA Champions League": "Champions",
    "Spanish Copa del Rey": "Copa del Rey",
    "Spanish Supercopa": "Supercopa",
    "Trofeo Joan Gamper": "Gamper",
    "Club Friendly": "Amistoso",
    MLS: "MLS",
    "Leagues Cup": "Leagues Cup",
    "Concacaf Champions Cup": "Concacaf",
    "U.S. Open Cup": "US Open Cup",
  }
  return map[name] ?? name
}

export interface StandingRow {
  teamId: string
  name: string
  logo: string | null
  rank: number
  points: number
  played: number
  wins: number
  draws: number
  losses: number
  goalDiff: string
  goalsFor: number
  goalsAgainst: number
}

export interface TeamData {
  team: TeamConfig
  seasonLabel: string | null
  competitions: { name: string; short: string; count: number }[]
  matches: Match[] // full season across ALL competitions, sorted ascending
}

export interface LeagueCalendar {
  leagueName: string
  seasonLabel: string | null
  dates: string[] // all fixture dates this season (ISO)
  selectedDate: string | null // ISO date currently shown
  index: number // position of selectedDate within dates (-1 if none)
  matches: Match[]
}

// ---- Fetch helpers ----

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } })
  if (!res.ok) {
    throw new Error(`ESPN request failed (${res.status}) for ${url}`)
  }
  return (await res.json()) as T
}

function pickLogo(team: {
  logo?: string
  logos?: { href: string }[]
}): string | null {
  if (team.logos && team.logos.length > 0) return team.logos[0].href
  if (team.logo) return team.logo
  return null
}

function scoreToNumber(score?: EspnScore | string): number | null {
  if (score == null) return null
  if (typeof score === "string") {
    const n = Number.parseInt(score, 10)
    return Number.isNaN(n) ? null : n
  }
  if (typeof score.value === "number") return score.value
  if (score.displayValue != null) {
    const n = Number.parseInt(score.displayValue, 10)
    return Number.isNaN(n) ? null : n
  }
  return null
}

function normalizeSide(c: EspnCompetitor): MatchSide {
  const score = typeof c.score === "object" ? c.score : undefined
  return {
    teamId: c.team.id,
    name: c.team.shortDisplayName || c.team.displayName,
    logo: pickLogo(c.team),
    score: scoreToNumber(c.score),
    winner: c.winner ?? score?.winner ?? null,
    isHome: c.homeAway === "home",
  }
}

function normalizeCompetition(
  league: EspnLeagueRef | undefined,
  fallbackName?: string,
): Competition | null {
  const name = league?.name ?? fallbackName
  if (!name) return null
  return {
    name,
    short: shortCompetition(name),
    slug: league?.slug ?? null,
    isTournament: Boolean(league?.isTournament),
  }
}

function normalizeEvent(e: EspnEvent, fallbackCompetition?: string): Match | null {
  const comp = e.competitions?.[0]
  if (!comp || !comp.competitors || comp.competitors.length < 2) return null
  const home = comp.competitors.find((c) => c.homeAway === "home")
  const away = comp.competitors.find((c) => c.homeAway === "away")
  if (!home || !away) return null

  const type = comp.status?.type
  const state = (type?.state as Match["state"]) || (type?.completed ? "post" : "pre")

  return {
    id: e.id,
    date: e.date,
    venue: comp.venue?.fullName ?? null,
    state,
    statusDetail: type?.shortDetail ?? null,
    completed: Boolean(type?.completed),
    competition: normalizeCompetition(e.league, fallbackCompetition),
    home: normalizeSide(home),
    away: normalizeSide(away),
  }
}

// Resolve the team's full cross-competition schedule.
//
// Verified quirks:
//  - The `/{league}/teams/{id}/schedule` path returns ONLY that league's games.
//    The `/all/teams/{id}/schedule` path returns EVERY competition the club
//    plays (league + Champions/Concacaf + domestic cups + friendlies), which is
//    exactly the "games outside their own league" the calendar must include.
//  - The upcoming season (e.g. 2026-27) is often not published yet and returns
//    0-1 events. We probe the upcoming season first (per the user's priority),
//    but fall back to the season that actually has a full schedule so we never
//    render an empty/placeholder calendar.
async function fetchScheduleResolved(
  team: TeamConfig,
): Promise<{ events: Match[]; seasonLabel: string | null }> {
  const year = new Date().getFullYear()
  const candidates = [year, year - 1] // upcoming first, then current/previous
  const scheduleUrl = (season: number) =>
    `${SITE_BASE}/all/teams/${team.espnId}/schedule?season=${season}`

  const parse = (data: EspnScheduleResponse) =>
    (data.events ?? [])
      .map((e) => normalizeEvent(e))
      .filter((m): m is Match => m !== null)

  let best: { events: Match[]; seasonLabel: string | null } | null = null
  for (const season of candidates) {
    const data = await fetchJson<EspnScheduleResponse>(scheduleUrl(season))
    const events = parse(data)
    // A real, in-use season has a full fixture list; ignore a stray friendly
    // in a not-yet-published upcoming season.
    if (events.length >= 5) {
      return { events, seasonLabel: null } // label derived from dates later
    }
    if (!best || events.length > best.events.length) {
      best = { events, seasonLabel: null }
    }
  }

  return best ?? { events: [], seasonLabel: null }
}

// ESPN's season.displayName can be misleading (it reports the platform's
// "current" season even when the returned events belong to another). Derive a
// truthful label from the actual event date range instead.
function deriveSeasonLabel(events: Match[]): string | null {
  if (events.length === 0) return null
  const years = events.map((m) => new Date(m.date).getFullYear())
  const min = Math.min(...years)
  const max = Math.max(...years)
  return min === max ? String(min) : `${min}-${String(max).slice(2)}`
}

export async function getTeamData(teamKey: TeamKey): Promise<TeamData> {
  const team = TEAMS[teamKey]
  const { events } = await fetchScheduleResolved(team)

  const matches = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  // Competition breakdown, ordered by how many games each has.
  const counts = new Map<string, { name: string; short: string; count: number }>()
  for (const m of matches) {
    if (!m.competition) continue
    const key = m.competition.name
    const prev = counts.get(key)
    if (prev) prev.count += 1
    else counts.set(key, { name: key, short: m.competition.short, count: 1 })
  }
  const competitions = [...counts.values()].sort((a, b) => b.count - a.count)

  return {
    team,
    seasonLabel: deriveSeasonLabel(matches),
    competitions,
    matches,
  }
}

// Convert an ISO timestamp to the YYYYMMDD form the scoreboard `dates` param
// expects (UTC-based, matching ESPN's own calendar entries).
function isoToYmd(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`
}

// League-wide calendar via the scoreboard endpoint. Unlike the team schedule,
// the scoreboard exposes a `calendar` array of every fixture date in the
// current season (verified: esp.1 → 2026-27 already has scheduled matchdays),
// so this genuinely surfaces the season that is starting.
export async function getLeagueCalendar(
  teamKey: TeamKey,
  dateYmd?: string,
): Promise<LeagueCalendar> {
  const team = TEAMS[teamKey]
  const base = `${SITE_BASE}/${team.league}/scoreboard`

  // 1) Pull the season calendar (list of fixture dates) + season label.
  const meta = await fetchJson<EspnScoreboardResponse>(base)
  const league = meta.leagues?.[0]
  const leagueName = league?.name ?? team.leagueName
  const seasonLabel = league?.season?.displayName ?? null
  const dates = (league?.calendar ?? []).filter(Boolean)

  // 2) Decide which date to show.
  let targetYmd = dateYmd
  if (!targetYmd) {
    const todayYmd = isoToYmd(new Date().toISOString())
    const upcoming = dates.find((iso) => isoToYmd(iso) >= todayYmd)
    targetYmd = upcoming ? isoToYmd(upcoming) : dates.length ? isoToYmd(dates[dates.length - 1]) : undefined
  }

  const index = targetYmd ? dates.findIndex((iso) => isoToYmd(iso) === targetYmd) : -1
  const selectedDate = index >= 0 ? dates[index] : null

  // 3) Fetch the fixtures for that date.
  const scoreUrl = targetYmd ? `${base}?dates=${targetYmd}` : base
  const data = await fetchJson<EspnScoreboardResponse>(scoreUrl)
  const matches = (data.events ?? [])
    .map((e) => normalizeEvent(e, leagueName))
    .filter((m): m is Match => m !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return { leagueName, seasonLabel, dates, selectedDate, index, matches }
}

function statNumber(entry: EspnStandingsEntry, name: string): number {
  const s = entry.stats.find((x) => x.name === name)
  if (!s) return 0
  if (typeof s.value === "number") return s.value
  const n = Number.parseInt(s.displayValue ?? "0", 10)
  return Number.isNaN(n) ? 0 : n
}

function statText(entry: EspnStandingsEntry, name: string): string {
  const s = entry.stats.find((x) => x.name === name)
  return s?.displayValue ?? "0"
}

export async function getStandings(teamKey: TeamKey): Promise<StandingRow[]> {
  const team = TEAMS[teamKey]
  const year = new Date().getFullYear()
  const candidates = [year, year - 1]
  const url = (season?: number) =>
    `${CORE_BASE}/${team.league}/standings${season ? `?season=${season}` : ""}`

  // A season can return a full table whose stats are all zero because no games
  // have been played yet (e.g. the upcoming season). Prefer the first season
  // that has actual matches played; keep any non-empty table as a fallback.
  const totalPlayed = (list: EspnStandingsEntry[]) =>
    list.reduce((sum, e) => {
      const s = e.stats.find((x) => x.name === "gamesPlayed")
      return sum + (typeof s?.value === "number" ? s.value : 0)
    }, 0)

  let entries: EspnStandingsEntry[] = []
  for (const season of candidates) {
    const data = await fetchJson<EspnStandingsResponse>(url(season))
    const e = data.children?.[0]?.standings?.entries ?? data.standings?.entries ?? []
    if (e.length === 0) continue
    if (entries.length === 0) entries = e // remember first non-empty as fallback
    if (totalPlayed(e) > 0) {
      entries = e
      break
    }
  }

  const rows: StandingRow[] = entries.map((entry) => ({
    teamId: entry.team.id,
    name: entry.team.displayName,
    logo: pickLogo(entry.team),
    rank: statNumber(entry, "rank"),
    points: statNumber(entry, "points"),
    played: statNumber(entry, "gamesPlayed"),
    wins: statNumber(entry, "wins"),
    draws: statNumber(entry, "ties"),
    losses: statNumber(entry, "losses"),
    goalDiff: statText(entry, "pointDifferential"),
    goalsFor: statNumber(entry, "pointsFor"),
    goalsAgainst: statNumber(entry, "pointsAgainst"),
  }))

  rows.sort((a, b) => a.rank - b.rank)
  return rows
}
