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
 * 使い方:
 *   npx tsx apps/web/scripts/sync-rakuten-catalog.ts              # 全件 → R2
 *   npx tsx apps/web/scripts/sync-rakuten-catalog.ts --limit 3    # 動作確認 (先頭 3 件)
 *   npx tsx apps/web/scripts/sync-rakuten-catalog.ts --dry-run    # R2 に書かず件数だけ出す
 *
 * 必要な env: RAKUTEN_APP_ID / RAKUTEN_ACCESS_KEY / NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID
 *            + R2 書き込み認証 (CI は sync-snapshots と同じ secrets)
 */
import dotenv from "dotenv";

import { saveToR2 } from "@stats47/r2-storage/server";

import { RUNTIME_PRODUCT_KEYWORDS } from "../src/config/runtime-metric-summaries.generated";
import { FURUSATO_NOZEI_LINKS } from "../src/features/ads/constants/furusato-nozei";
import {
  FURUSATO_NOZEI_GENRE_ID,
  searchRakutenItems,
  type RakutenItem,
} from "../src/features/ads/lib/rakuten-api";
import {
  rakutenFurusatoKey,
  rakutenItemsKey,
  type RakutenSnapshot,
  type RakutenSnapshotItem,
} from "../src/features/ads/repositories/rakuten-snapshot";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: "apps/web/.env.local" });
dotenv.config({ path: "apps/web/.env.development" });

/** 楽天の Expected QPS=1 を必ず下回るようにする。 */
const REQUEST_INTERVAL_MS = 1200;
const HITS_PER_QUERY = 4;

const argv = process.argv.slice(2);
const arg = (n: string) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : null;
};
const LIMIT = Number(arg("limit") ?? 0) || 0;
const DRY_RUN = argv.includes("--dry-run");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function slim(items: RakutenItem[]): RakutenSnapshotItem[] {
  return items.map((it) => ({
    name: it.itemName,
    // アフィリエイト URL があれば必ずそちらを使う (無いと成果にならない)
    url: it.affiliateUrl ?? it.itemUrl,
    price: it.itemPrice,
    image: it.mediumImageUrls[0]?.imageUrl ?? it.smallImageUrls[0]?.imageUrl ?? null,
    reviewCount: it.reviewCount,
    reviewAverage: it.reviewAverage,
  }));
}

async function put(key: string, items: RakutenSnapshotItem[], generatedAt: string) {
  if (DRY_RUN) return;
  const payload: RakutenSnapshot = { generatedAt, items };
  await saveToR2(key, JSON.stringify(payload), "application/json");
}

async function main() {
  if (!process.env.RAKUTEN_APP_ID || !process.env.RAKUTEN_ACCESS_KEY) {
    console.error("❌ RAKUTEN_APP_ID / RAKUTEN_ACCESS_KEY が未設定です");
    process.exit(1);
  }
  if (!process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID) {
    console.error("❌ NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID が未設定です");
    console.error("   このまま取得すると成果計測 (rafcid) が付かず 1 円にもなりません");
    process.exit(1);
  }

  const generatedAt = new Date().toISOString();
  const keywords = LIMIT > 0 ? RUNTIME_PRODUCT_KEYWORDS.slice(0, LIMIT) : RUNTIME_PRODUCT_KEYWORDS;
  const prefs = LIMIT > 0 ? FURUSATO_NOZEI_LINKS.slice(0, LIMIT) : FURUSATO_NOZEI_LINKS;

  console.log(`品目 ${keywords.length} / 都道府県 ${prefs.length}${DRY_RUN ? " (dry-run)" : ""}`);
  console.log(
    `推定所要: 約 ${Math.ceil(((keywords.length + prefs.length) * REQUEST_INTERVAL_MS) / 60000)} 分\n`,
  );

  let emptyItems = 0;
  let withAffiliate = 0;
  let queries = 0;

  for (const [i, term] of keywords.entries()) {
    const got = await searchRakutenItems({
      keyword: term,
      hits: HITS_PER_QUERY,
      sort: "-reviewCount",
      timeoutMs: 15000,
    });
    queries++;
    if (got.length === 0) emptyItems++;
    if (got.some((x) => x.affiliateUrl)) withAffiliate++;
    await put(rakutenItemsKey(term), slim(got), generatedAt);
    if ((i + 1) % 50 === 0 || i === keywords.length - 1) {
      console.log(`  品目 ${i + 1}/${keywords.length} (0 件だった品目: ${emptyItems})`);
    }
    await sleep(REQUEST_INTERVAL_MS);
  }

  let emptyPrefs = 0;
  for (const [i, link] of prefs.entries()) {
    // FurusatoNozeiCard と同じ絞り込み (代表返礼品 → 0 件なら県名のみ)
    let got: RakutenItem[] = [];
    if (link.signatureKeyword) {
      got = await searchRakutenItems({
        keyword: `${link.prefName} ${link.signatureKeyword}`,
        genreId: FURUSATO_NOZEI_GENRE_ID,
        hits: HITS_PER_QUERY,
        sort: "-reviewCount",
        timeoutMs: 15000,
      });
      queries++;
      await sleep(REQUEST_INTERVAL_MS);
    }
    if (got.length === 0) {
      got = await searchRakutenItems({
        keyword: link.prefName,
        genreId: FURUSATO_NOZEI_GENRE_ID,
        hits: HITS_PER_QUERY,
        sort: "-reviewCount",
        timeoutMs: 15000,
      });
      queries++;
      await sleep(REQUEST_INTERVAL_MS);
    }
    if (got.length === 0) emptyPrefs++;
    if (got.some((x) => x.affiliateUrl)) withAffiliate++;
    await put(rakutenFurusatoKey(link.prefCode), slim(got), generatedAt);
    if ((i + 1) % 10 === 0 || i === prefs.length - 1) {
      console.log(`  都道府県 ${i + 1}/${prefs.length} (0 件: ${emptyPrefs})`);
    }
  }

  console.log(`\n✅ 完了 (${DRY_RUN ? "dry-run: R2 未書込" : "R2 へ書込済"})`);
  console.log(`   品目 ${keywords.length} / うち商品 0 件: ${emptyItems}`);
  console.log(`   都道府県 ${prefs.length} / うち返礼品 0 件: ${emptyPrefs}`);
  console.log(`   affiliateUrl を含む応答: ${withAffiliate}`);

  // 成果計測が全滅していたら失敗させる (静かに 1 円も入らない状態を放置しない)
  if (queries > 0 && withAffiliate === 0) {
    console.error("\n❌ affiliateUrl が 1 件も返っていません。楽天の Affiliate ID 紐付けを確認してください");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
