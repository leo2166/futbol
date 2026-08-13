import { NextResponse } from "next/server"
import { getLeagueCalendar, TEAMS, type TeamKey } from "@/lib/football-api"

export const revalidate = 60

export async function GET(
  req: Request,
  { params }: { params: Promise<{ team: string }> },
) {
  const { team } = await params
  if (!(team in TEAMS)) {
    return NextResponse.json({ error: "Unknown team" }, { status: 404 })
  }
  const date = new URL(req.url).searchParams.get("date") ?? undefined
  try {
    const data = await getLeagueCalendar(team as TeamKey, date || undefined)
    return NextResponse.json(data)
  } catch (err) {
    console.log("[v0] league route error:", (err as Error).message)
    return NextResponse.json(
      { error: "Failed to load league calendar from ESPN" },
      { status: 502 },
    )
  }
}
