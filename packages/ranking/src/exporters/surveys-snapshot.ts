import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { Source } from "../types/snapshot";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";

import {
  buildSurveysSnapshot,
  SURVEYS_SNAPSHOT_KEY,
} from "../types/snapshot";

export interface ExportSurveysSnapshotResult {
  key: string;
  count: number;
  sizeBytes: number;
  durationMs: number;
}

/**
 * surveys snapshot を R2 に書き出す (完全DBレス: docs/01_技術設計/19)。
 *
 * SSOT は git TS マスタ
 * `packages/ranking/src/data/surveys.json` (配信 app/survey/all.json から抽出した静的 reference,
 * displayOrder 順)。survey は低頻度更新の reference データで git TS を SSOT とする (port master と同方針)。
 *
 * `validSurveyIds` を渡すと、その集合に含まれる survey だけを書き出す。これは
 * `exportRankingItemsPerUrl` が `app/survey/{id}/items.json` を生成した survey 群
 * (= 関連ランキングが 1 件以上ある survey) で、これに絞ることで詳細ページが notFound()
 * になる orphan survey (例: cpi-regional) を一覧・サイドバー・generateStaticParams から
 * 排除する。未指定時 (後方互換) はマスタ全件を書き出す。
 */
export async function exportSurveysSnapshot(
  validSurveyIds?: Iterable<string>,
  itemCounts?: Record<string, number>,
): Promise<ExportSurveysSnapshotResult> {
  const startedAt = Date.now();

  const dataPath = path.resolve(__dirname, "../data/surveys.json");
  const allSurveys = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as Source[];

  const validSet = validSurveyIds ? new Set(validSurveyIds) : null;
  const surveys = (validSet
    ? allSurveys.filter((s) => validSet.has(s.id))
    : allSurveys
  ).map((s) =>
    // itemCount を焼き込む (/survey 一覧が all.json 1 fetch で件数を出せる)
    itemCounts?.[s.id] !== undefined ? { ...s, itemCount: itemCounts[s.id] } : s,
  );

  const snapshot = buildSurveysSnapshot(surveys);

  const body = JSON.stringify(snapshot);
  const result = await saveToR2(SURVEYS_SNAPSHOT_KEY, body, {
    contentType: "application/json; charset=utf-8",
  });

  const durationMs = Date.now() - startedAt;
  logger.info(
    { key: result.key, count: surveys.length, sizeBytes: result.size, durationMs },
    "surveys snapshot (完全DBレス) を R2 に保存しました",
  );

  return {
    key: result.key,
    count: surveys.length,
    sizeBytes: result.size,
    durationMs,
  };
}
