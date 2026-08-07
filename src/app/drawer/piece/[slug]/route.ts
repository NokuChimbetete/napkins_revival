import { NextResponse } from "next/server";
import { getPieceForDrawer } from "@/lib/drawer";

// Full piece content for the napkin modal, fetched on open — shipping all
// ~110 bodies with the canvas would be ~800KB against ~15KB of metadata.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const piece = await getPieceForDrawer(slug);
  if (!piece) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(piece, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
  });
}
