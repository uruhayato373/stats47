/**
 * 都道府県間 人口移動の O-D 行 (R2 観測値) から、焦点県 1 つ分の `MigrationFlowData` を作る。
 *
 * Web の R2 配信 (`apps/web/scripts/export-migration-flow-r2.ts` → `app/migration-flow/{NN}.json`) と
 * Remotion の static JSON (`apps/remotion/scripts/exporters/migration-flow.ts`) が同じ変換を別々に
 * 持っていたため、ここへ一つにまとめた (2026-10-26)。React に依存しないので
 * `@stats47/migration-flow/focus-file` から Node スクリプトが直接読む。
 *
 * 並び順は流入の多い順 (同数は県コード順)。R2 配信版の既存の並びに合わせた。描画側
 * (MigrationFlowReel・MigrationFlowCover・Web の Sankey) は自前で並べ替えるか Map で引くので、
 * 並びは描画に影響せず、JSON を読む人が上位の相手県を先に見られる方を採った。
 */
import type { MigrationFlowData, MigrationPartner } from "../types";

/** 出典表記 (両 exporter 共通) */
export const MIGRATION_FLOW_SOURCE = "e-Stat 住民基本台帳人口移動報告 (統計表 0003423613)";

/** O-D 1 行。toPrefCode = 焦点県、fromPrefCode = 相手県 (どちらも 5 桁コード) */
export interface MigrationFlowOdRow {
  fromPrefCode: string;
  toPrefCode: string;
  inflow: number | null | undefined;
  outflow: number | null | undefined;
  net: number | null | undefined;
}

export interface BuildFocusFileInput {
  /** 焦点県の 5 桁コード (例 "13000") */
  focusCode5: string;
  year: number;
  rows: readonly MigrationFlowOdRow[];
  /** 5 桁コード → 県名 */
  prefNames: ReadonlyMap<string, string>;
}

/** 5 桁コード → ファイル名・focusCode に使う 2 桁コード */
export function toPrefCode2(code5: string): string {
  return code5.slice(0, 2);
}

export function buildMigrationFocusFile({ focusCode5, year, rows, prefNames }: BuildFocusFileInput): MigrationFlowData {
  const partners: MigrationPartner[] = rows
    .filter((row) => row.toPrefCode === focusCode5 && row.fromPrefCode !== focusCode5)
    .map((row) => ({
      code: toPrefCode2(row.fromPrefCode),
      name: prefNames.get(row.fromPrefCode) ?? row.fromPrefCode,
      inflow: row.inflow ?? 0,
      outflow: row.outflow ?? 0,
      net: row.net ?? 0,
    }))
    .sort((a, b) => b.inflow - a.inflow || a.code.localeCompare(b.code));
  const inflow = partners.reduce((sum, p) => sum + p.inflow, 0);
  const outflow = partners.reduce((sum, p) => sum + p.outflow, 0);
  return {
    focusCode: toPrefCode2(focusCode5),
    focusName: prefNames.get(focusCode5) ?? focusCode5,
    year,
    source: MIGRATION_FLOW_SOURCE,
    partners,
    totals: { inflow, outflow, net: inflow - outflow },
  };
}
