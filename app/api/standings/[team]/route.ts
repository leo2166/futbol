import { NextResponse } from "next/server"
import { getStandings, TEAMS, type TeamKey } from "@/lib/football-api"

export const revalidate = 60

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ team: string }> },
) {
  const { team } = await params
  if (!(team in TEAMS)) {
    return NextResponse.json({ error: "Unknown team" }, { status: 404 })
  }
  try {
    const data = await getStandings(team as TeamKey)
    return NextResponse.json(data)
  } catch (err) {
    console.log("[v0] standings route error:", (err as Error).message)
    return NextResponse.json(
      { error: "Failed to load standings from ESPN" },
      { status: 502 },
    )
  }
}
