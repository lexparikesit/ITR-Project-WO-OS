module.exports = [
"[project]/.next-internal/server/app/api/cases/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/app/api/cases/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
;
;
function safeJson(s) {
    try {
        return JSON.parse(s);
    } catch  {
        return s;
    }
}
function extractArray(raw) {
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.items)) return raw.items;
    if (Array.isArray(raw?.rows)) return raw.rows;
    if (raw?.result && Array.isArray(raw.result)) return raw.result;
    return [];
}
function joinPath(basePath, add) {
    const a = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
    const b = add.startsWith("/") ? add.slice(1) : add;
    return `${a}/${b}`;
}
function cmp(a, b) {
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
async function GET(req) {
    const baseStr = process.env.WAREHOUSE_API_BASE;
    const pathStr = process.env.WAREHOUSE_CASES_PATH || "/workorder/outstanding/itr";
    if (!baseStr) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "WAREHOUSE_API_BASE missing"
    }, {
        status: 500
    });
    const wtoken = (await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])()).get("wtoken")?.value;
    if (!wtoken) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "No warehouse token"
    }, {
        status: 401
    });
    try {
        const sp = req.nextUrl.searchParams;
        const page = Number(sp.get("page") ?? "1");
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
            headers: {
                Authorization: `Bearer ${wtoken}`,
                Accept: "application/json"
            },
            cache: "no-store"
        });
        const text = await upstream.text();
        if (!upstream.ok) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Upstream error",
                status: upstream.status,
                url: u.toString(),
                body: safeJson(text)
            }, {
                status: upstream.status
            });
        }
        const raw = safeJson(text);
        const rows = extractArray(raw);
        // === NORMALISASI ke shape yang dipakai tabel ===
        const normalized = rows.map((r, idx)=>({
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
                warehouse: r.warehouse ?? r.WAREHOUSE ?? ""
            }));
        // === FILTER (global search q) ===
        const filtered = q ? normalized.filter((x)=>{
            const hay = `${x.caseId} ${x.description} ${x.deliveryName} ${x.deviceNumber} ${x.site} ${x.siteName} ${x.warehouseName} ${x.statusWo}`.toLowerCase();
            return hay.includes(q);
        }) : normalized;
        // === SORT ===
        const sorted = [
            ...filtered
        ].sort((a, b)=>{
            const diff = cmp(a[orderBy], b[orderBy]);
            return orderDir === "asc" ? diff : -diff;
        });
        // === PAGING ===
        const total = sorted.length;
        const start = Math.max(0, (page - 1) * limit);
        const data = sorted.slice(start, start + limit);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            data,
            page,
            limit,
            total
        });
    } catch (err) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: err?.message ?? "Internal error"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__130a9e6e._.js.map