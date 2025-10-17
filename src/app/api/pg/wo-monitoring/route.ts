import { NextResponse } from "next/server";
import { z } from "zod";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  woId: z.string().min(1),
  problemCause: z.string().max(250).optional().nullable(),
  actionPlan: z.string().max(250).optional().nullable(),
  pic: z.string().max(100).optional().nullable(),
  datelineClosing: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(), // YYYY-MM-DD
});

export async function POST(req: Request) {
  try {
    const input = schema.parse(await req.json());
    const pool = getPool();

    const sql = `
      INSERT INTO wo_monitoring
        (wo_id, problem_cause, action_plan, pic, dateline_closing, updated_at)
      VALUES ($1,    $2,            $3,         $4,  $5::date,        now())
      ON CONFLICT (wo_id)
      DO UPDATE SET
        problem_cause    = EXCLUDED.problem_cause,
        action_plan      = EXCLUDED.action_plan,
        pic              = EXCLUDED.pic,
        dateline_closing = EXCLUDED.dateline_closing,
        updated_at       = now()
      RETURNING id,
                wo_id AS "woId",
                problem_cause AS "problemCause",
                action_plan AS "actionPlan",
                pic,
                to_char(dateline_closing, 'YYYY-MM-DD') AS "datelineClosing",
                updated_at AS "updatedAt";
    `;

    const vals = [
      input.woId,
      input.problemCause ?? null,
      input.actionPlan ?? null,
      input.pic ?? null,
      input.datelineClosing ?? null,
    ];

    const { rows } = await pool.query(sql, vals);
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message || "DB error" },
      { status: 400 }
    );
  }
}
