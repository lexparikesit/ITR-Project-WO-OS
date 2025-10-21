import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ woId: string }> } // ⬅️ sama seperti file kamu
) {
  const { woId } = await ctx.params;

  const wtoken = (await cookies()).get("wtoken")?.value;
  if (!wtoken) {
    return NextResponse.json({ success: false, message: "No token" }, { status: 401 });
  }

  const base = process.env.WAREHOUSE_API_BASE!;
  // proxy ke backend: /workorder/monitoring/:woId/history
  const url = `${base}/workorder/monitoring/${encodeURIComponent(woId)}/history`;

  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${wtoken}` },
    cache: "no-store",
  });

  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") || "application/json" },
  });
}
