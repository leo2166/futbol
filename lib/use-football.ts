"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type {
  LeagueCalendar,
  MatchDetail,
  NewsArticle,
  SquadPlayer,
  StandingRow,
  TeamData,
  TeamKey,
} from "@/lib/football-api"

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }
  return (await res.json()) as T
}

export function useTeamData(teamKey: TeamKey) {
  return useQuery({
    queryKey: ["team", teamKey],
    queryFn: () => getJson<TeamData>(`/api/team/${teamKey}`),
  })
}

export function useStandings(teamKey: TeamKey) {
  return useQuery({
    queryKey: ["standings", teamKey],
    queryFn: () => getJson<StandingRow[]>(`/api/standings/${teamKey}`),
  })
}

export function useLeagueCalendar(teamKey: TeamKey, date: string | null) {
  return useQuery({
    queryKey: ["league", teamKey, date ?? "next"],
    queryFn: () =>
      getJson<LeagueCalendar>(
        `/api/league/${teamKey}${date ? `?date=${date}` : ""}`,
      ),
    placeholderData: keepPreviousData, // keep matchday visible while navigating
  })
}

export function useTeamNews(teamKey: TeamKey) {
  return useQuery({
    queryKey: ["news", teamKey],
    queryFn: () => getJson<NewsArticle[]>(`/api/news/${teamKey}`),
  })
}

export function useTeamSquad(teamKey: TeamKey) {
  return useQuery({
    queryKey: ["squad", teamKey],
    queryFn: () => getJson<SquadPlayer[]>(`/api/squad/${teamKey}`),
  })
}

export function useMatchDetail(matchId: string | null, league = "esp.1") {
  return useQuery({
    queryKey: ["match", matchId, league],
    queryFn: () => (matchId ? getJson<MatchDetail>(`/api/match/${matchId}?league=${league}`) : null),
    enabled: Boolean(matchId),
  })
}

