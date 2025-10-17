import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function safeJson(s: string) { try { return JSON.parse(s); } catch { return s; } }
function extractArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.rows)) return raw.rows;
  if (raw?.result && Array.isArray(raw.result)) return raw.result;
  return [];
}
function joinPath(basePath: string, add: string) {
  const a = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  const b = add.startsWith("/") ? add.slice(1) : add;
  return `${a}/${b}`;
}
function cmp(a: any, b: any) {
  // nulls last
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  // date
  const ad = typeof a === "string" && /^\d{4}-\d{2}-\d{2}T/.test(a) ? Date.parse(a) : NaN;
  const bd = typeof b === "string" && /^\d{4}-\d{2}-\d{2}T/.test(b) ? Date.parse(b) : NaN;
  if (!Number.isNaN(ad) && !Number.isNaN(bd)) return ad - bd;
  // number
  if (typeof a === "number" && typeof b === "number") return a - b;
  // string
  return String(a).localeCompare(String(b));
}

export async function GET(req: NextRequest) {
  const baseStr = process.env.WAREHOUSE_API_BASE;
  const pathStr = process.env.WAREHOUSE_CASES_PATH || "/workorder/outstanding/itr";
  if (!baseStr) return NextResponse.json({ error: "WAREHOUSE_API_BASE missing" }, { status: 500 });

  const wtoken = (await cookies()).get("wtoken")?.value;
  if (!wtoken) return NextResponse.json({ error: "No warehouse token" }, { status: 401 });

  try {
    const sp = req.nextUrl.searchParams;
    const page  = Number(sp.get("page")  ?? "1");
    const limit = Number(sp.get("limit") ?? "50");
    const caseId = sp.get("caseId") ?? "";
    const ageingType = sp.get("ageingType") ?? "ALL";
    const site = sp.get("site") ?? "ALL";

    // NEW: global search + sorting
    const q = (sp.get("q") ?? "").trim().toLowerCase();
    const orderBy = sp.get("orderBy") ?? "createdAt";
    const orderDir = (sp.get("orderDir") ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";

    const u = new URL(baseStr);
    u.pathname = joinPath(u.pathname, pathStr);
    if (caseId) u.searchParams.set("caseid", caseId);
    if (ageingType && ageingType !== "ALL") u.searchParams.set("ageingtype", ageingType);
    if (site && site !== "ALL") u.searchParams.set("site", site);

    const upstream = await fetch(u.toString(), {
      headers: { Authorization: `Bearer ${wtoken}`, Accept: "application/json" },
      cache: "no-store",
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Upstream error", status: upstream.status, url: u.toString(), body: safeJson(text) },
        { status: upstream.status }
      );
    }

    const raw = safeJson(text);
    const rows = extractArray(raw);

    // === NORMALISASI ke shape yang dipakai tabel ===
    const normalized = rows.map((r: any, idx: number) => ({
      id: String(r.CASEID ?? r.caseid ?? r["DEVICE NUMBER"] ?? idx + 1),
      caseId: r.CASEID ?? r.caseid ?? "",
      description: r.DESCRIPTION ?? r.description ?? "",
      deliveryName: r.DELIVERYNAME ?? r.deliveryName ?? "",
      deviceNumber: r["DEVICE NUMBER"] ?? r.deviceNumber ?? "",
      serialNumber: r["SERIAL NUMBER"] ?? r.serialNumber ?? "",
      brand: r.BRAND ?? r.brand ?? "",
      createdAt: r.CREATEDDATETIME ?? r.createdAt ?? r.created_at ?? null,
      ageing: r.aging ?? r.ageing ?? null,
      ageingType: r.ageingType ?? r.AGEINGTYPE ?? r.agingType ?? "",
      warehouseName: r.warehouseName ?? r.WAREHOUSENAME ?? "",
      siteName: r.siteName ?? r.SITENAME ?? "",
      statusWo: r["STATUS WO"] ?? r.status ?? "",
      site: r.site ?? r.SITE ?? "",
      warehouse: r.warehouse ?? r.WAREHOUSE ?? "",
    }));

    // === FILTER (global search q) ===
    const filtered = q
      ? normalized.filter((x) => {
          const hay = `${x.caseId} ${x.description} ${x.deliveryName} ${x.deviceNumber} ${x.site} ${x.siteName} ${x.warehouseName} ${x.statusWo}`.toLowerCase();
          return hay.includes(q);
        })
      : normalized;

    // === SORT ===
    const sorted = [...filtered].sort((a, b) => {
      const diff = cmp((a as any)[orderBy], (b as any)[orderBy]);
      return orderDir === "asc" ? diff : -diff;
    });

    // === PAGING ===
    const total = sorted.length;
    const start = Math.max(0, (page - 1) * limit);
    const data = sorted.slice(start, start + limit);

    return NextResponse.json({ data, page, limit, total });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal error" }, { status: 500 });
  }
}
