// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  (await cookies()).set({
    name: "token",
    value: "",
    path: "/",   // ⬅️ samain path
    maxAge: 0,   // hapus
  });
  return NextResponse.json({ success: true });
}
