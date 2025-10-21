import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const wtoken = (await cookies()).get("wtoken")?.value;
  if (!wtoken) {
    return NextResponse.json({ success: false, message: "No token" }, { status: 401 });
  }
  const body = await req.text();
  const base = process.env.WAREHOUSE_API_BASE!;

  const r = await fetch(`${base}/workorder/monitoring`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${wtoken}`,
    },
    body,
  });
  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") || "application/json" },
  });
}
