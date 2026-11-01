/**
 * 市区町村の保育所等利用待機児童率 (nursery-waiting-children-rate) の手動取り込み。年 1 回。
 *
 * こども家庭庁「保育所等関連状況取りまとめ」(毎年 8 月末公表) の参考 Excel「定員・申込者の状況」
 * シート「申込者の状況」から、市区町村ごとの 申込者数(合計) と 待機児童(合計) を読み、
 * 待機児童率 = 待機児童 ÷ 申込者数 × 100 を app/stats/<key>/cities.json (ローカル staging) に書く。
 *
 *   npx tsx packages/data-configs/scripts/ingest-childcare-waiting-rate.ts --dry-run [--file <xlsx>]
 *   npx tsx packages/data-configs/scripts/ingest-childcare-waiting-rate.ts [--url <xlsx直リンク>] [--year 2025] [--refresh]
 *
 * 年が変わったとき: ① 新しい公表ページ (https://www.cfa.go.jp/policies/hoiku/torimatome/) から参考 Excel の直リンクを探す
 * ② --url と --year を渡す ③ data/metrics/nursery-waiting-children-rate.ts の provenance (url/accessedAt/sourceSha256/
 * dataDate) と years、note の件数、下の EXPECTED を新しい公表値に合わせる(検算が一致しなければ書かずに止まる)。
 *
 * 一次資料の URL は年ごとに変わるため cron にしない。R2 への反映は別工程(承認後に diff-push-r2 --prefix app/stats)。
 * ここでは .local/r2 に書くだけで、R2・本番へは何も送らない。
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildMunicipalityEntityPolicy, fetchPrefectures, listPublishableMunicipalities } from "@stats47/area";

import { buildRecipe } from "../src/recipe.js";
import { METRICS_REGISTRY } from "../src/registry.js";
import {
  assertPublishedTotals,
  buildCityRows,
  joinToMunicipalities,
  parseWaitingRows,
  tally,
  type MunicipalityRef,
} from "./lib/childcare-waiting-rate.js";
import { readXlsxSheet } from "./lib/read-xlsx-sheet.js";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const METRIC_KEY = "nursery-waiting-children-rate";
const SHEET = "申込者の状況";
/** 令和7年4月1日版の公表値(本文)。年が変わったら新しい公表値に更新する。 */
const EXPECTED = { municipalityCount: 1741, waitingMunicipalityCount: 211, waitingTotal: 2254 } as const;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

async function loadWorkbook(config: NonNullable<(typeof METRICS_REGISTRY)[string]>, year: number): Promise<{ buf: Buffer; origin: string }> {
  const file = arg("file");
  if (file) return { buf: readFileSync(resolve(file)), origin: resolve(file) };
  const prov = (config.source as { config?: { provenance?: { url?: string } } }).config?.provenance;
  const url = arg("url") ?? prov?.url;
  if (!url) throw new Error("--url か config の provenance.url が必要");
  const cache = resolve(REPO_ROOT, `.local/cfa-hoiku/${year}/${url.split("/").pop()}`);
  if (!flag("refresh") && existsSync(cache)) return { buf: readFileSync(cache), origin: cache };
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(cache), { recursive: true });
  writeFileSync(cache, buf);
  return { buf, origin: url };
}

async function main() {
  const config = METRICS_REGISTRY[METRIC_KEY];
  if (!config) throw new Error(`metric config not found: ${METRIC_KEY} (npm run build:registry --workspace=@stats47/data-configs)`);
  const year = Number(arg("year") ?? "2025");
  const dryRun = flag("dry-run");

  const { buf, origin } = await loadWorkbook(config, year);
  const sha = createHash("sha256").update(buf).digest("hex");
  const declared = (config.source as { config?: { sourceSha256?: string } }).config?.sourceSha256;
  console.log(`取得: ${origin} (${buf.length} bytes, sha256 ${sha})`);
  if (declared && declared !== sha) console.warn(`警告: config の sourceSha256 (${declared}) と異なる。新しい版なら config を更新すること`);

  const parsed = parseWaitingRows(await readXlsxSheet(buf, SHEET));
  const prefNameByCode = new Map(fetchPrefectures().map((p) => [p.prefCode.slice(0, 2), p.prefName]));
  const refs: MunicipalityRef[] = listPublishableMunicipalities(buildMunicipalityEntityPolicy()).map((e) => ({
    code: e.code,
    name: e.name,
    prefectureName: prefNameByCode.get(e.code.slice(0, 2)) ?? "",
  }));
  const { joined } = joinToMunicipalities(parsed, refs);
  const t = tally(joined);
  assertPublishedTotals(t, EXPECTED);
  console.log(
    `結合: ${t.municipalityCount} 市区町村 / 待機児童のいる自治体 ${t.waitingMunicipalityCount} / 待機児童合計 ${t.waitingTotal} 人 / ` +
      `申込者合計 ${t.applicantsTotal} 人 / 待機児童0 ${t.zeroWaitingCount} (うち申込者0 ${t.noApplicantsCount})`,
  );

  const rows = buildCityRows(joined, { year, unit: config.unit });
  const ranked = rows.filter((r) => r.rank !== null).sort((a, b) => (a.rank as number) - (b.rank as number));
  const nullCount = rows.filter((r) => r.value === null).length;
  console.log(`出力: ${rows.length} 行 / 年 ${year} / 単位 ${config.unit} / 順位あり ${ranked.length} / 値なし ${nullCount}`);
  console.log("上位 5: " + ranked.slice(0, 5).map((r) => `${r.rank}位 ${r.areaName} ${r.value}${config.unit}`).join(" / "));

  const payload = {
    metricKey: METRIC_KEY,
    entityKind: "city" as const,
    rows,
    meta: {
      rowCount: rows.length,
      yearRange: [String(year), String(year)] as [string, string],
      areaCount: new Set(rows.map((r) => r.areaCode)).size,
      generatedAt: new Date().toISOString(),
      recipe: buildRecipe(config),
      // R2 へ送るときの検査 (ksj-publication-guard の assertManualCitySnapshot) が config と照合する
      source: {
        sourceSha256: sha,
        sha256: sha,
        dataDate: (config.source as { config?: { dataDate?: string } }).config?.dataDate,
      },
    },
  };
  if (dryRun) {
    console.log("[dry-run] 書き込みなし (R2 へも送らない)");
    return;
  }
  const outPath = resolve(REPO_ROOT, `.local/r2/app/stats/${METRIC_KEY}/cities.json`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(payload));
  console.log(`wrote ${outPath} (${rows.length} rows)。R2 への反映は別工程(承認後)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
