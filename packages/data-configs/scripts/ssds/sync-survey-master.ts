/**
 * PROPOSED_NEW_SURVEYS を survey マスタ (packages/ranking/src/data/surveys.json) に冪等同期する。
 *
 * source-name-to-survey.ts の PROPOSED_NEW_SURVEYS が SSOT。既に存在する id はスキップし、
 * 未登録のものだけ surveys.json のスキーマに沿って追加する。
 *
 * 実行: cd packages/data-configs && npx tsx scripts/ssds/sync-survey-master.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PROPOSED_NEW_SURVEYS } from "../../src/ssds/source-name-to-survey";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SURVEYS_JSON = join(
  __dirname,
  "../../../ranking/src/data/surveys.json",
);

type SurveyRow = {
  id: string;
  sourceKind: string;
  externalId: string | null;
  parentSourceId: string | null;
  name: string;
  organization: string | null;
  url: string | null;
  description: string | null;
  attributionText: string | null;
  license: string | null;
  licenseUrl: string | null;
  baseUrl: string | null;
  linkTemplate: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function main(): void {
  const rows: SurveyRow[] = JSON.parse(readFileSync(SURVEYS_JSON, "utf-8"));
  const existing = new Set(rows.map((r) => r.id));
  const now = "2026-06-02 00:00:00";

  let added = 0;
  for (const { id, name, organization } of Object.values(PROPOSED_NEW_SURVEYS)) {
    if (existing.has(id)) continue;
    existing.add(id);
    rows.push({
      id,
      sourceKind: "survey",
      externalId: null,
      parentSourceId: "estat",
      name,
      organization: organization ?? null,
      url: null,
      description: null,
      attributionText: null,
      license: null,
      licenseUrl: null,
      baseUrl: null,
      linkTemplate: null,
      displayOrder: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    added++;
  }

  writeFileSync(SURVEYS_JSON, JSON.stringify(rows, null, 2) + "\n", "utf-8");
  console.log(`survey master: +${added} 追加 / 合計 ${rows.length} 件`);
}

main();
