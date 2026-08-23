/**
 * PROPOSED_NEW_SURVEYS を survey マスタ (packages/ranking/src/data/surveys.json) に冪等同期する。
 *
 * source-name-to-survey.ts の PROPOSED_NEW_SURVEYS が SSOT。未登録 id を追加し、
 * 既存行の organization / url が null の場合だけ正典の値で補完する。
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
  const existing = new Map(rows.map((r) => [r.id, r]));
  const now = "2026-08-22 00:00:00";

  let added = 0;
  let enriched = 0;
  for (const { id, name, organization, url } of Object.values(PROPOSED_NEW_SURVEYS)) {
    const current = existing.get(id);
    if (current) {
      let changed = false;
      if (!current.organization && organization) {
        current.organization = organization;
        changed = true;
      }
      if (!current.url && url) {
        current.url = url;
        changed = true;
      }
      if (changed) {
        current.updatedAt = now;
        enriched++;
      }
      continue;
    }
    rows.push({
      id,
      sourceKind: "survey",
      externalId: null,
      parentSourceId: "estat",
      name,
      organization: organization ?? null,
      url: url ?? null,
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
    existing.set(id, rows[rows.length - 1]);
    added++;
  }

  writeFileSync(SURVEYS_JSON, JSON.stringify(rows, null, 2) + "\n", "utf-8");
  console.log(`survey master: +${added} 追加 / ${enriched} 補完 / 合計 ${rows.length} 件`);
}

main();
