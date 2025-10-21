import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// token app kamu berisi payload base64url JSON (sub, name, exp, ...)
function decodeBase64Url(s: string) {
  // pad base64
  const pad = s.length % 4 === 2 ? "==" : s.length % 4 === 3 ? "=" : "";
  const base64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
}

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const token = jar.get("token")?.value; // app token (bukan wtoken)
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  try {
    const payload = decodeBase64Url(token);
    const now = Math.floor(Date.now() / 1000);
    const expired = typeof payload?.exp === "number" && payload.exp < now;

    if (expired) {
      // treat as not authenticated
      return NextResponse.json({ authenticated: false, reason: "expired" }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload?.sub ?? null,
        name: payload?.name ?? null,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
