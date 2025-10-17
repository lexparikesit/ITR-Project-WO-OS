import { NextResponse } from "next/server";

type LoginBody = { username?: string; password?: string };

export async function POST(req: Request) {
  const body = (await req.json()) as LoginBody;

  if (!body?.username || !body?.password) {
    return NextResponse.json({ success: false, message: "Missing credentials" }, { status: 400 });
  }

  const base = process.env.WAREHOUSE_API_BASE;
  if (!base) {
    return NextResponse.json({ success: false, message: "WAREHOUSE_API_BASE missing" }, { status: 500 });
  }

  const url = new URL("/auth/login", base); // sesuai Postman kamu

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ username: body.username, password: body.password }),
      cache: "no-store",
    });

    const rawText = await upstream.text();
    let json: any;
    try { json = JSON.parse(rawText); } catch { json = rawText; }

    if (!upstream.ok || !json?.success) {
      // ← kirim balik detail upstream biar kebaca di UI
      return NextResponse.json(
        {
          success: false,
          message: json?.message || "Upstream login failed",
          upstreamStatus: upstream.status,
          upstreamBody: json,
          endpoint: url.toString(),
        },
        { status: 401 }
      );
    }

    const wtoken: string | undefined = json?.accessToken;
    if (!wtoken) {
      return NextResponse.json({ success: false, message: "No accessToken in upstream response" }, { status: 500 });
    }

    const displayName = json?.user?.name || json?.user?.username || body.username;

    // token dummy untuk guard lokal
    const appPayload = {
      sub: json?.user?.id ?? body.username,
      name: displayName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
    };
    const appToken = Buffer.from(JSON.stringify(appPayload)).toString("base64url");

    const res = NextResponse.json({
      success: true,
      user: { id: json?.user?.id, username: json?.user?.username, name: displayName, email: json?.user?.email },
    });

    res.cookies.set("token", appToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    res.cookies.set("wtoken", wtoken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Fetch error to upstream", endpoint: url.toString() },
      { status: 500 }
    );
  }
}
