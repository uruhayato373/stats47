/**
 * A8 成果の取り込みに使う programIdMap (A8 プログラム ID → stats47 の広告 ID) を広告定義から生成する。
 *
 * Usage:
 *   npx tsx .claude/scripts/ads/build-a8-program-id-map.ts          # config を書き換える
 *   npx tsx .claude/scripts/ads/build-a8-program-id-map.ts --check  # ずれていれば一覧を出して exit 1
 *
 * なぜ要るか: programIdMap は「広告を増減したら手で再生成する」運用で、2026-07-28 の 72 件から更新されず、
 * 広告定義が 138 件の mid= を持つ 2026-09-27 に、A8 の 9 月明細 79 案件のうち 13 件 (ふるさと本舗・au PAY ふるさと納税など)
 * が「未分類」になって取り込みが止まった。手で同期する二重管理をやめ、広告定義から毎回導出する。
 *
 * 入力: apps/web/scripts/affiliate-ads-data.ts の AFFILIATE_ADS (配信停止中の広告も含む。停止中でも過去のクリックは stats47 の実績)。
 *   A8 プログラム ID は広告の URL の mid=(s + 14 桁) と、案件プロファイルが付ける programRef (a8:s…) の両方から取る。
 * 除外: _otherSiteProgramIds (doboku-note だけの ID)。_sharedWithDobokuNote (両サイトが配信する ID) は除外しない。
 *   取り込み (normalize-a8-csv.mjs → crossCheckAgainstSite / toResultsRecords) は共用 ID も対応表で拾ったうえで
 *   「両サイト合算」として別扱いにするので、対応表から外すとサイト合計との突き合わせが崩れる。
 *   2 つの一覧は doboku-note 側の定義を見て人が決める (別リポジトリなので CI から自動で読めない)。
 * 出力: .claude/config/a8-report-automation.json の a8.programIdMap。値は広告 ID を名前順に "+" でつないだもの。
 *   ファイル全体を整形し直さないよう、programIdMap の節だけを差し替える。
 */
import { readFileSync, writeFileSync } from "node:fs";

import { AFFILIATE_ADS } from "../../../apps/web/scripts/affiliate-ads-data";

const CONFIG = ".claude/config/a8-report-automation.json";
const MID = /mid=(s\d{14})/g;
const A8_REF = /^a8:(s\d{14})$/;

type MapBlock = Record<string, string>;

export function buildProgramIdMap(
  ads: ReadonlyArray<{ id: string; programRef?: string | null; htmlContent?: string | null; imageUrl?: string | null; trackingPixelUrl?: string | null }>,
  excluded: ReadonlySet<string>,
): MapBlock {
  const byProgram = new Map<string, Set<string>>();
  for (const ad of ads) {
    const ids = new Set<string>();
    for (const text of [ad.htmlContent, ad.imageUrl, ad.trackingPixelUrl]) {
      for (const m of String(text ?? "").matchAll(MID)) ids.add(m[1]);
    }
    const ref = A8_REF.exec(ad.programRef ?? "");
    if (ref) ids.add(ref[1]);
    for (const pid of ids) {
      if (excluded.has(pid)) continue;
      byProgram.set(pid, (byProgram.get(pid) ?? new Set()).add(ad.id));
    }
  }
  return Object.fromEntries(
    [...byProgram.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([pid, adIds]) => [pid, [...adIds].sort().join("+")]),
  );
}

function main() {
  const text = readFileSync(CONFIG, "utf8");
  const a8 = JSON.parse(text).a8;
  const excluded = new Set<string>(a8._otherSiteProgramIds?.ids ?? []);
  const meta = Object.fromEntries(Object.entries(a8.programIdMap as MapBlock).filter(([k]) => k.startsWith("_")));
  const current = Object.fromEntries(Object.entries(a8.programIdMap as MapBlock).filter(([k]) => !k.startsWith("_")));
  const next = buildProgramIdMap(AFFILIATE_ADS, excluded);

  const added = Object.keys(next).filter((k) => !(k in current));
  const removed = Object.keys(current).filter((k) => !(k in next));
  const changed = Object.keys(next).filter((k) => k in current && current[k] !== next[k]);
  if (process.argv.includes("--check")) {
    if (added.length + removed.length + changed.length === 0) {
      console.log(`✓ programIdMap は広告定義と一致 (${Object.keys(next).length} 件)`);
      return;
    }
    console.error(`✗ programIdMap が広告定義とずれている: 追加 ${added.length} / 削除 ${removed.length} / 変更 ${changed.length}`);
    for (const k of added) console.error(`  + ${k} → ${next[k]}`);
    for (const k of removed) console.error(`  - ${k} (${current[k]})`);
    for (const k of changed) console.error(`  ~ ${k}: ${current[k]} → ${next[k]}`);
    console.error("  → npx tsx .claude/scripts/ads/build-a8-program-id-map.ts で再生成する");
    process.exit(1);
  }

  const block = { ...meta, ...next };
  const indent = "      ";
  const body = Object.entries(block)
    .map(([k, v]) => `${indent}${JSON.stringify(k)}: ${JSON.stringify(v)}`)
    .join(",\n");
  const start = text.indexOf('    "programIdMap": {\n');
  const end = text.indexOf("\n    },\n", start);
  if (start < 0 || end < 0) throw new Error("programIdMap の節が見つからない");
  const replaced = `${text.slice(0, start)}    "programIdMap": {\n${body}${text.slice(end)}`;
  JSON.parse(replaced); // 壊れた JSON を書かない
  writeFileSync(CONFIG, replaced);
  console.log(`programIdMap: ${Object.keys(next).length} 件 (追加 ${added.length} / 削除 ${removed.length} / 変更 ${changed.length})`);
}

main();
