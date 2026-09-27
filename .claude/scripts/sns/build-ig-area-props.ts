#!/usr/bin/env tsx
/**
 * build-ig-area-props.ts — 1都道府県の Instagram「地域」カルーセル
 * (火・土枠。正典 .claude/rules/sns-content-standards.md §2-3c) の props JSON をデータ層だけ決定的に生成する。
 *
 * 2026-09-27 (AREA-HIGHLIGHTS-SSOT-01): 選定は Web の県ページと同じ selectAreaHighlights
 * (packages/area-profile/src/highlights) を使い、入力は R2 `app/areas/<code>/databook.json` だけにした。
 * values.json / item.json からの順位・ラベルの自前再計算は廃止。databook.json が旧版 (schemaVersion < 2、
 * 「特徴」のメタ無し) なら fail-closed で止まる (R2 の再生成が必要)。
 *
 * fail-closed: どちらかのグループが3件未満、または出典・年が欠落した項目があれば非ゼロ終了しファイルを書かない。
 *
 * Usage:
 *   npx tsx .claude/scripts/sns/build-ig-area-props.ts 46 [--top 5] [--databook <path>] [--out <path>]
 *   --databook: R2 の代わりにローカルの databook.json を読む
 *     (`npm run check:highlights --workspace=@stats47/area-profile -- --out-dir <dir>` の出力)
 *
 * 出力既定: .local/r2/sns/area-carousel/<5桁prefCode>/instagram/props.json
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { selectAreaHighlights } from "../../../packages/area-profile/src/highlights/select-area-highlights.ts";
import {
  AREA_DATABOOK_SCHEMA_VERSION,
  parseAreaDatabookSnapshot,
  type AreaDatabookSnapshot,
} from "../../../packages/area-profile/src/types/databook-snapshot.ts";
import { PREF_CAPITAL_COORDS } from "../../../packages/migration-flow/src/lib/pref-capitals.ts";
import {
  type AreaCarouselGroup,
  buildCoverHook,
  buildCoverTeaser,
  buildScopeNote,
  normalizePrefCode,
  toAreaCarouselItem,
  validateGroup,
} from "./lib/ig-area-props.ts";

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");
const PUBLIC_URL = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const DEFAULT_TOP = 5;
const TOP_GROUP_TITLE = "全国トップクラス";
const BOTTOM_GROUP_TITLE = "全国では下位";

function parseArgs() {
  const argv = process.argv.slice(2);
  const val = (name: string): string | null => {
    const i = argv.indexOf(name);
    return i !== -1 ? (argv[i + 1] ?? null) : null;
  };
  const valueFlags = new Set(["--top", "--databook", "--out"]);
  const positional = argv.filter((v, i) => !v.startsWith("--") && !valueFlags.has(argv[i - 1] ?? ""));
  if (!positional[0]) {
    console.error("✗ 都道府県コードを指定してください (例: 46 または 46000)");
    process.exit(1);
  }
  return {
    prefCodeArg: positional[0],
    top: val("--top") ? Number(val("--top")) : DEFAULT_TOP,
    databookPath: val("--databook"),
    out: val("--out"),
  };
}

async function loadDatabook(pref5: string, databookPath: string | null): Promise<{ databook: AreaDatabookSnapshot; sourceKey: string }> {
  if (databookPath) {
    return { databook: parseAreaDatabookSnapshot(JSON.parse(readFileSync(databookPath, "utf8"))), sourceKey: databookPath };
  }
  const url = `${PUBLIC_URL}/app/areas/${pref5}/databook.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`取得失敗 (${res.status}): ${url}`);
  return { databook: parseAreaDatabookSnapshot(await res.json()), sourceKey: url };
}

async function main() {
  const { prefCodeArg, top, databookPath, out } = parseArgs();
  const { pref2, pref5 } = normalizePrefCode(prefCodeArg);
  const capital = PREF_CAPITAL_COORDS[pref2];
  if (!capital) {
    console.error(`✗ 県庁所在地が見つかりません: ${pref2}`);
    process.exit(1);
  }
  const scopeNoteText = buildScopeNote(pref2, capital.name);

  const { databook, sourceKey } = await loadDatabook(pref5, databookPath);
  if ((databook.schemaVersion ?? 1) < AREA_DATABOOK_SCHEMA_VERSION) {
    console.error(
      `✗ databook.json が旧版です (schemaVersion ${databook.schemaVersion ?? 1})。R2 の databook.json を再生成するか --databook でローカル生成物を渡してください。`,
    );
    process.exit(1);
  }
  const areaName = databook.areaName;

  const highlights = selectAreaHighlights(databook, { perGroup: top });
  const topGroup: AreaCarouselGroup = {
    title: TOP_GROUP_TITLE,
    items: highlights.top.map((h) => toAreaCarouselItem(h, scopeNoteText)),
  };
  const bottomGroup: AreaCarouselGroup = {
    title: BOTTOM_GROUP_TITLE,
    items: highlights.bottom.map((h) => toAreaCarouselItem(h, scopeNoteText)),
  };

  const errors = [
    ...validateGroup(topGroup.title, topGroup.items),
    ...validateGroup(bottomGroup.title, bottomGroup.items),
  ];
  if (errors.length > 0) {
    console.error("✗ fail-closed: 出力条件を満たしていません (ファイルは書きません):");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  const props = {
    areaCode: pref5,
    prefCode: pref2,
    areaName,
    coverHook: buildCoverHook(areaName),
    teaser: buildCoverTeaser(topGroup.items),
    canonicalUrl: `https://stats47.jp/areas/${pref5}`,
    groups: [topGroup, bottomGroup],
    generatedAt: new Date().toISOString(),
    sourceKeys: [sourceKey],
  };

  const outPath = out ?? join(PROJECT_ROOT, ".local/r2/sns/area-carousel", pref5, "instagram/props.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(props, null, 2)}\n`, "utf-8");
  console.error(`✓ 書き出し: ${outPath}`);
  console.error(`  ${topGroup.title}: ${topGroup.items.length}件 / ${bottomGroup.title}: ${bottomGroup.items.length}件`);
}

main().catch((err) => {
  console.error(`✗ ${(err as Error).message}`);
  process.exit(1);
});
