import { z } from "zod";

export const casesFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(50),
  caseId: z.string().optional(),
  ageingType: z.string().optional(),
  site: z.string().optional(),
});
export type CasesFilter = z.infer<typeof casesFilterSchema>;

export type CaseRow = {
  id: string;
  caseId: string;
  ageingType: string;
  site: string;
  title: string;
  createdAt: string; // ISO
};

export type CasesApiResponse = {
  data: CaseRow[];
  page: number;
  limit: number;
  total: number;
};
