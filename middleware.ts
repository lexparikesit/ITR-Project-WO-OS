import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/api/auth/login", "/api/auth/logout", "/_next", "/favicon.ico"];
const isPublic = (p: string) => PUBLIC_PATHS.some(x => p === x || p.startsWith(x));

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  // kalau user sudah login & membuka halaman root, lempar ke /cases
  if (pathname === "/" && token) {
    const url = new URL("/cases", req.url);
    return NextResponse.redirect(url);
  }

  if (isPublic(pathname)) return NextResponse.next();

  // lindungi halaman protected (contoh: /cases)
  const isProtected = pathname.startsWith("/cases");
  if (isProtected && !token) {
    const url = new URL("/", req.url); // root = login page
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
