import { NextResponse } from "next/server"
import { getTeamSquad, TEAMS, type TeamKey } from "@/lib/football-api"

export const revalidate = 300

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ team: string }> },
) {
  const { team } = await params
  if (!(team in TEAMS)) {
    return NextResponse.json({ error: "Unknown team" }, { status: 404 })
  }
  try {
    const data = await getTeamSquad(team as TeamKey)
    return NextResponse.json(data)
  } catch (err) {
    console.error("[squad route error]:", (err as Error).message)
    return NextResponse.json(
      { error: "Failed to load squad from ESPN" },
      { status: 502 },
    )
  }
}
