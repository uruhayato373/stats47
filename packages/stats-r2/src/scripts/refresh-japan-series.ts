/**
 * data-refresh で取り直した指標の、公式の全国の系列 (`app/japan/<metric>/series.json`) を作り直す。
 *
 * テーマの全国の値は、この系列の値を item.json の表示の倍率で書く。指標の取得元や単位を変えて
 * 観測値と item.json だけを作り直すと、全国の値が古い単位のまま新しい倍率で読まれる
 * (2026-11-20 実収入の 千円 → 円 で、636.2 が約 0.1 万円と出るところだった)。
 *
 * 作り直すのは、R2 に既に公式 (`sourceMode: "official"`) の系列がある指標だけ。
 * 系列の無い指標に新しく作るかは別の判断 (GEO-SCOPE の WP0 台帳) なので、ここでは作らない。
 * derived-additive の系列は県の観測値から作るので、この段では触らない。
 *
 * 書くのは `.local/r2/app/japan/<metric>/series.json` だけ。R2 への push は workflow の
 * diff-push-r2 が行う。作り直しに失敗した指標が 1 件でもあれば exit 1 (古い系列を残して止まる)。
 *
 *   npx tsx packages/stats-r2/src/scripts/refresh-japan-series.ts --metrics a,b [--dry-run]
 */
import { pathToFileURL } from "node:url";

import { SITE } from "@stats47/types";

import { fetchWithProxy, generateOneMetric } from "./generate-japan-series";
import { japanR2Key } from "../types";

export type JapanRefreshDecision = "regenerate" | "skip-missing" | "skip-non-official";

/** R2 にある系列 (無ければ null) から、作り直すかを決める。 */
export function decideJapanRefresh(existing: unknown): JapanRefreshDecision {
  if (existing === null) return "skip-missing";
  const mode = (existing as { sourceMode?: unknown } | undefined)?.sourceMode;
  return mode === "official" ? "regenerate" : "skip-non-official";
}

const PUBLIC_R2 = process.env.R2_PUBLIC_FETCH_URL ?? SITE.r2PublicBaseUrl;

async function readExisting(metricKey: string): Promise<unknown> {
  const key = japanR2Key(metricKey);
  const response = await fetchWithProxy(`${PUBLIC_R2}/${key}`);
  if (response.status === 404) return null;
  // 404 以外の失敗を「無い」と読まない (作り直すべき系列を黙って飛ばさない)
  if (!response.ok) throw new Error(`${key}: HTTP ${response.status}`);
  return (await response.json()) as unknown;
}

async function main() {
  const argv = process.argv.slice(2);
  const at = argv.indexOf("--metrics");
  const metrics = (at >= 0 ? argv[at + 1] ?? "" : "").split(",").filter(Boolean);
  const dryRun = argv.includes("--dry-run");
  if (metrics.length === 0) {
    console.error("使い方: --metrics <key1,key2> [--dry-run]");
    process.exit(2);
  }

  const failures: string[] = [];
  for (const metricKey of metrics) {
    const decision = decideJapanRefresh(await readExisting(metricKey));
    if (decision !== "regenerate") {
      console.log(`[skip] ${metricKey}: ${decision}`);
      continue;
    }
    const result = await generateOneMetric(metricKey, { write: !dryRun, sourceMode: "official" });
    if (!result.ok) {
      failures.push(`${metricKey}: ${result.reason}`);
      continue;
    }
    console.log(
      `[${dryRun ? "dry-run" : "wrote"}] ${metricKey} rows=${result.rows} ` +
        `range=${result.rangeFrom}..${result.rangeTo} latest=${result.latestValue}${result.latestUnit}`,
    );
  }
  if (failures.length > 0) {
    console.error(`全国の系列を作り直せなかった指標:\n${failures.join("\n")}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
