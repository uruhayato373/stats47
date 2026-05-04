import "server-only";

import { estatMetainfo, getDrizzle } from "@stats47/database/server";
import { logger } from "@stats47/logger";
import { and, eq, like, or, type SQL } from "drizzle-orm";

export interface ListCandidatesOptions {
  statsField?: string;
  categoryKey?: string;
  govOrg?: string;
  titleQuery?: string;
  limit?: number;
}

export interface CandidateMetainfo {
  statsDataId: string;
  title: string;
  statName: string | null;
  govOrg: string | null;
  categoryKey: string | null;
  statsField: string | null;
  areaType: "national" | "prefecture" | "city";
  cycle: string | null;
  surveyDate: string | null;
  updatedDate: string | null;
}

export async function listCandidates(
  options: ListCandidatesOptions = {}
): Promise<CandidateMetainfo[]> {
  const db = getDrizzle();

  try {
    const conditions: SQL[] = [eq(estatMetainfo.status, "candidate")];

    if (options.statsField) {
      conditions.push(eq(estatMetainfo.statsField, options.statsField));
    }
    if (options.categoryKey) {
      conditions.push(eq(estatMetainfo.categoryKey, options.categoryKey));
    }
    if (options.govOrg) {
      conditions.push(eq(estatMetainfo.govOrg, options.govOrg));
    }
    if (options.titleQuery) {
      const pattern = `%${options.titleQuery}%`;
      const titleOr = or(
        like(estatMetainfo.title, pattern),
        like(estatMetainfo.statName, pattern)
      );
      if (titleOr) conditions.push(titleOr);
    }

    const limit = options.limit ?? 100;
    const rows = await db
      .select({
        statsDataId: estatMetainfo.statsDataId,
        title: estatMetainfo.title,
        statName: estatMetainfo.statName,
        govOrg: estatMetainfo.govOrg,
        categoryKey: estatMetainfo.categoryKey,
        statsField: estatMetainfo.statsField,
        areaType: estatMetainfo.areaType,
        cycle: estatMetainfo.cycle,
        surveyDate: estatMetainfo.surveyDate,
        updatedDate: estatMetainfo.updatedDate,
      })
      .from(estatMetainfo)
      .where(and(...conditions))
      .limit(limit);

    return rows;
  } catch (error) {
    logger.error({ options, error }, "listCandidates: エラー");
    return [];
  }
}
