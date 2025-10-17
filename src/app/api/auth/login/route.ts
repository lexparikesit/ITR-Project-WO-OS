// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // pastikan tidak di-cache

type LoginBody = { username?: string; password?: string };
type UpstreamUser = { id?: number; username?: string; name?: string; email?: string };

type UpstreamLoginResponse = {
  success?: boolean;
  accessToken?: string;
  user?: UpstreamUser;
  message?: string;
};

// Helper: baca exp dari JWT (detik sejak epoch) → kembalikan maxAge (detik) aman
function maxAgeFromJwt(token?: string, fallbackSeconds = 60 * 60 * 8): number {
  if (!token) return fallbackSeconds;
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return fallbackSeconds;
    // base64url decode
    const json = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const payload = JSON.parse(json) as { exp?: number };
    if (!payload.exp) return fallbackSeconds;
    const now = Math.floor(Date.now() / 1000);
    // kasih buffer 60 detik
    const ttl = Math.max(0, payload.exp - now - 60);
    // batasi wajar (5 menit min, 24 jam max)
    return Math.min(Math.max(ttl, 60 * 5), 60 * 60 * 24);
  } catch {
    return fallbackSeconds;
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as LoginBody;

  if (!body?.username || !body?.password) {
    return NextResponse.json(
      { success: false, message: "Missing credentials" },
      { status: 400 }
    );
  }

  const base = process.env.WAREHOUSE_API_BASE;
  if (!base) {
    return NextResponse.json(
      { success: false, message: "WAREHOUSE_API_BASE missing" },
      { status: 500 }
    );
  }

  // contoh: http(s)://host:port
  const url = new URL("/auth/login", base);

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ username: body.username, password: body.password }),
      cache: "no-store",
    });

    // aman: coba parse JSON; kalau gagal ambil text mentah
    const raw = await upstream.text();
    let json: UpstreamLoginResponse | string;
    try {
      json = JSON.parse(raw) as UpstreamLoginResponse;
    } catch {
      json = raw;
    }

    const ok = upstream.ok && typeof json === "object" && !!json?.success;
    if (!ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            typeof json === "object" && json?.message
              ? json.message
              : "Upstream login failed",
          upstreamStatus: upstream.status,
          upstreamBody: json,
          endpoint: url.toString(),
        },
        { status: upstream.status === 401 ? 401 : 400 }
      );
    }

    const accessToken = (json as UpstreamLoginResponse).accessToken;
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "No accessToken in upstream response" },
        { status: 500 }
      );
    }

    const u = (json as UpstreamLoginResponse).user || {};
    const displayName = u.name || u.username || body.username;

    // App guard token (bukan JWT—sekadar payload ringan biar UI bisa cek "sudah login")
    const appPayload = {
      sub: u.id ?? body.username,
      name: displayName,
      iat: Math.floor(Date.now() / 1000),
    };
    const appToken = Buffer.from(JSON.stringify(appPayload)).toString("base64url");

    // Hitung maxAge dari exp JWT jika ada; fallback 8 jam
    const maxAge = maxAgeFromJwt(accessToken, 60 * 60 * 8);
    const prod = process.env.NODE_ENV === "production";

    const res = NextResponse.json({
      success: true,
      user: { id: u.id, username: u.username, name: displayName, email: u.email },
    });

    // Cookie app guard
    (await cookies()).set({
      name: "token",
      value: appToken,
      httpOnly: true,
      sameSite: "lax",
      secure: prod,
      path: "/", // PENTING: agar terkirim ke semua route
      maxAge,
    });

    // Cookie token upstream (dipakai proxy /api/cases, dll)
    (await cookies()).set({
      name: "wtoken",
      value: accessToken,
      httpOnly: true,
      sameSite: "lax",
      secure: prod,
      path: "/",
      maxAge,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Fetch error to upstream",
        endpoint: url.toString(),
      },
      { status: 500 }
    );
  }
}
