import { NextResponse } from "next/server"
import { getMatchDetail } from "@/lib/football-api"

export const revalidate = 60

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing match ID" }, { status: 400 })
  }
  const league = new URL(req.url).searchParams.get("league") || "esp.1"
  try {
    const data = await getMatchDetail(id, league)
    if (!data) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("[match route error]:", (err as Error).message)
    return NextResponse.json(
      { error: "Failed to load match detail from ESPN" },
      { status: 502 },
    )
  }
}
