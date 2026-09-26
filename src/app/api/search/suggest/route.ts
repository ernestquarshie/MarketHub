import { NextResponse, type NextRequest } from "next/server";
import { suggest } from "@/server/services/search";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const data = await suggest(q);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" },
  });
}
