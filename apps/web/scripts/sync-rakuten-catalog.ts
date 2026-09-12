/**
 * 楽天市場の商品・返礼品カタログを取得して R2 snapshot に焼く (日次 cron)。
 *
 * ★**なぜ事前取得か** (2026-08-04):
 *   楽天に申告した Expected QPS は **1**。一方 deploy-workers.yml の warm-cache は
 *   sitemap の全 URL を順に叩くため、デプロイのたびに ISR が総入れ替えになり
 *   **646 ページ分の楽天呼び出しがバースト**していた。429 で弾かれてもカードは
 *   `[]` に degrade して静かに消えるだけで気づけない。
 *   ここで全品目を 1 QPS 以下で取得して R2 に置き、ページは R2 だけを読む。
 *
 * 使い方 (★`-r setup-cli.js` は必須。R2 server barrel と repositories が server-only を
 * import するため、素の tsx 実行では throw する):
 *   TSX="npx tsx -r ./packages/ranking/src/scripts/setup-cli.js"
 *   $TSX apps/web/scripts/sync-rakuten-catalog.ts              # 全件 → R2
 *   $TSX apps/web/scripts/sync-rakuten-catalog.ts --limit 3    # 動作確認 (先頭 3 件)
 *   $TSX apps/web/scripts/sync-rakuten-catalog.ts --dry-run    # R2 に書かず件数だけ出す
 *   $TSX apps/web/scripts/sync-rakuten-catalog.ts --scope furusato # 47県の返礼品だけ更新
 *   $TSX apps/web/scripts/sync-rakuten-catalog.ts --terms さんま,コーヒー --local .local/rakuten-preview
 *     # 全47県と指定商品をローカルのみ生成。API失敗は0件と分けてmanifestへ記録。
 *
 * 必要な env: RAKUTEN_APP_ID / RAKUTEN_ACCESS_KEY / NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID
 *            + R2 書き込み認証 (CI は sync-snapshots と同じ secrets)
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

import { saveToR2 } from "@stats47/r2-storage/server";
import dotenv from "dotenv";

import { RUNTIME_PRODUCT_KEYWORDS } from "../src/config/runtime-metric-summaries.generated";
import { getFurusatoNozeiLink } from "../src/features/ads/constants/furusato-nozei";
import {
  RAKUTEN_REQUEST_INTERVAL_MS,
  searchFurusatoItems,
  searchRakutenProductItems,
  RakutenApiError,
  type RakutenItem,
} from "../src/features/ads/lib/rakuten-api";
import {
  allPrefCodes,
  rakutenFurusatoKey,
  rakutenItemsKey,
  toSnapshotItems,
  type RakutenSnapshot,
  type RakutenSnapshotItem,
} from "../src/features/ads/repositories/rakuten-snapshot";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: "apps/web/.env.local" });
dotenv.config({ path: "apps/web/.env.development" });

/** 楽天の Expected QPS=1 を必ず下回るようにする。 */
const REQUEST_INTERVAL_MS = RAKUTEN_REQUEST_INTERVAL_MS;
const HITS_PER_QUERY = 4;

const argv = process.argv.slice(2);
const arg = (n: string) => {
  const i = argv.indexOf(`--${n}`);
  if (i < 0) return null;
  const value = argv[i + 1];
  if (!value || value.startsWith("--")) throw new Error(`--${n} の値が必要です`);
  return value;
};
const LIMIT = Number(arg("limit") ?? 0);
if (!Number.isInteger(LIMIT) || LIMIT < 0) throw new Error("--limit は0以上の整数を指定してください");
const DRY_RUN = argv.includes("--dry-run");
const LOCAL_OUTPUT = arg("local");
if (LOCAL_OUTPUT && DRY_RUN) throw new Error("--local と --dry-run は併用できません");
const TERMS = arg("terms")?.split(",").map((term) => term.trim()).filter(Boolean);
const SCOPE = arg("scope") ?? "all";
if (!["all", "items", "furusato"].includes(SCOPE)) {
  throw new Error("--scope は all / items / furusato を指定してください");
}
if (TERMS?.some((term) => !RUNTIME_PRODUCT_KEYWORDS.includes(term))) {
  throw new Error("--terms は既存の品目名をカンマ区切りで指定してください");
}
const localRoot = LOCAL_OUTPUT ? resolve(LOCAL_OUTPUT) : null;
if (localRoot) {
  const localPath = relative(resolve(".local"), localRoot);
  if (!localPath || localPath.startsWith("..") || isAbsolute(localPath)) throw new Error("--local の出力先はこの作業ツリーの .local/ 配下に限定します");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 削り込みは repositories 側 (toSnapshotItems) が単一実装。配信と形がズレないようにする。
const slim = (items: RakutenItem[]): RakutenSnapshotItem[] => toSnapshotItems(items);

async function put(key: string, items: RakutenSnapshotItem[], generatedAt: string) {
  const payload: RakutenSnapshot = { generatedAt, items };
  if (localRoot) {
    const target = resolve(localRoot, key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, JSON.stringify(payload, null, 2));
    return;
  }
  if (DRY_RUN) return;
  await saveToR2(key, JSON.stringify(payload), { contentType: "application/json" });
}

async function main() {
  const generatedAt = new Date().toISOString();
  const requestedKeywords = TERMS ?? RUNTIME_PRODUCT_KEYWORDS;
  const keywords = SCOPE === "furusato" ? []
    : LIMIT > 0 ? requestedKeywords.slice(0, LIMIT) : requestedKeywords;
  // 県一覧は公開 API 経由で組み立てる (FURUSATO_NOZEI_LINKS は module 内定数で export されていない)。
  // getFurusatoNozeiLink は signatureKeyword も付けて返すため、カード側と同じ絞り込み条件になる。
  const allPrefs = allPrefCodes()
    .map((code) => getFurusatoNozeiLink(code))
    .filter((l): l is NonNullable<typeof l> => l !== null);
  const prefs = SCOPE === "items" ? [] : LIMIT > 0 ? allPrefs.slice(0, LIMIT) : allPrefs;
  const reportRoot = localRoot ?? resolve(".local/rakuten-catalog-audit");
  const missingEnv = ["RAKUTEN_APP_ID", "RAKUTEN_ACCESS_KEY", "NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID"]
    .filter((key) => !process.env[key]);
  if (missingEnv.length) {
    await mkdir(reportRoot, { recursive: true });
    await writeFile(resolve(reportRoot, "manifest.json"), JSON.stringify({ generatedAt, complete: false,
      mode: localRoot ? "local-only" : DRY_RUN ? "dry-run" : "r2-local-staging", status: "missing-credentials", missingEnv,
      expected: keywords.length + prefs.length, succeeded: 0, empty: 0, failed: 0,
      notAttempted: keywords.length + prefs.length }, null, 2));
    console.error(`❌ 未設定: ${missingEnv.join(" / ")}。API未実行・既存snapshot未変更。`);
    process.exitCode = 1;
    return;
  }

  console.log(`品目 ${keywords.length} / 都道府県 ${prefs.length}${localRoot ? " (local-only)" : DRY_RUN ? " (dry-run)" : ""}`);
  console.log(
    `推定所要: 約 ${Math.ceil(((keywords.length + prefs.length) * REQUEST_INTERVAL_MS) / 60000)} 分\n`,
  );

  let emptyItems = 0;
  let withAffiliate = 0;
  const results: Array<{ key: string; status: "success" | "empty" | "failed" | "not-attempted"; count?: number; error?: string }> = [];
  let authenticationFailed = false;
  const collect = async (key: string, search: () => Promise<RakutenItem[]>) => {
    if (authenticationFailed) {
      results.push({ key, status: "not-attempted", error: "authentication-failed" });
      return null;
    }
    try {
      const got = await search();
      await put(key, slim(got), generatedAt);
      results.push({ key, status: got.length ? "success" : "empty", count: got.length });
      return got;
    } catch (error) {
      const message = error instanceof RakutenApiError ? error.message : "Local snapshot generation failed";
      results.push({ key, status: "failed", error: message });
      if (error instanceof RakutenApiError && [401, 403].includes(error.status ?? 0)) authenticationFailed = true;
      console.error(`❌ ${key}: ${message} (既存snapshotは上書きしません)`);
      return null;
    } finally {
      await sleep(REQUEST_INTERVAL_MS);
    }
  };

  for (const [i, term] of keywords.entries()) {
    const got = await collect(rakutenItemsKey(term), () => searchRakutenProductItems(term, HITS_PER_QUERY));
    if (!got) continue;
    if (got.length === 0) emptyItems++;
    if (got.some((x) => x.affiliateUrl)) withAffiliate++;
    if ((i + 1) % 50 === 0 || i === keywords.length - 1) {
      console.log(`  品目 ${i + 1}/${keywords.length} (0 件だった品目: ${emptyItems})`);
    }
  }

  let emptyPrefs = 0;
  for (const [i, link] of prefs.entries()) {
    // ★絞り込み条件 (代表返礼品で高意図検索 → 0 件なら県名のみ) は
    //   searchFurusatoItems が単一実装。ここで組み直すと二重管理になりドリフトする。
    const got = await collect(rakutenFurusatoKey(link.prefCode), () => searchFurusatoItems(
      link.prefName,
      HITS_PER_QUERY,
      link.signatureKeyword,
      15000,
      true,
    ));
    // フォールバック間の待機は searchFurusatoItems が持つ。次の県との間も空ける。
    if (!got) continue;
    if (got.length === 0) emptyPrefs++;
    if (got.some((x) => x.affiliateUrl)) withAffiliate++;
    if ((i + 1) % 10 === 0 || i === prefs.length - 1) {
      console.log(`  都道府県 ${i + 1}/${prefs.length} (0 件: ${emptyPrefs})`);
    }
  }

  const failed = results.filter((row) => row.status === "failed" || row.status === "not-attempted");
  await mkdir(reportRoot, { recursive: true });
  await writeFile(resolve(reportRoot, "manifest.json"), JSON.stringify({ generatedAt,
    finishedAt: new Date().toISOString(), mode: localRoot ? "local-only" : DRY_RUN ? "dry-run" : "r2-local-staging",
    source: "https://webservice.rakuten.co.jp/documentation/ichiba-item-search", expected: results.length,
    succeeded: results.filter((row) => row.status === "success").length, empty: results.filter((row) => row.status === "empty").length,
    failed: failed.length, complete: failed.length === 0, results }, null, 2));
  console.log(`\n${failed.length ? "❌ 取得不完全" : "✅ 完了"} (${localRoot ? "local-only: R2 未書込" : DRY_RUN ? "dry-run: R2 未書込" : "ローカルR2 stagingへ保存"})`);
  console.log(`   品目 ${keywords.length} / うち商品 0 件: ${emptyItems}`);
  console.log(`   都道府県 ${prefs.length} / うち返礼品 0 件: ${emptyPrefs}`);
  console.log(`   affiliateUrl を含む応答: ${withAffiliate}`);
  console.log(`   失敗・未取得: ${failed.length} / manifest: ${resolve(reportRoot, "manifest.json")}`);
  if (failed.length) process.exitCode = 1;

  // 成果計測が全滅していたら失敗させる (静かに 1 円も入らない状態を放置しない)
  if (keywords.length + prefs.length > 0 && withAffiliate === 0) {
    console.error("\n❌ 適合するアフィリエイト商品が0件です。取得失敗・品質除外・Affiliate ID紐付けを確認してください");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
