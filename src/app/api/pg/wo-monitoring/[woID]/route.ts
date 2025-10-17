import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { woId: string } }
) {
  try {
    const pool = getPool();
    const sql = `
      SELECT id,
             wo_id                  AS "woId",
             problem_cause          AS "problemCause",
             action_plan            AS "actionPlan",
             pic                    AS "pic",
             to_char(dateline_closing, 'YYYY-MM-DD') AS "datelineClosing",
             updated_at             AS "updatedAt"
      FROM wo_monitoring
      WHERE wo_id = $1
      LIMIT 1
    `;
    const { rows } = await pool.query(sql, [params.woId]);
    return NextResponse.json({ data: rows[0] ?? null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
