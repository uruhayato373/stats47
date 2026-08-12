/**
 * KDP 出品内容 SSOT (.claude/config/kdp-listings.json) を KINDLE_BOOKS から生成する。
 * coconala-listings.json と同じ役割: ブラウザ自動化 (kdp-operator) が読む出品内容 (title/description/
 * keywords/price/epubPath 等) と公開状態 (status/asin) の一元 SoT。既存エントリの status/asin/
 * publishedAt/categories は保持 (upsert・人手で詰めた KDP カテゴリを毎回上書きしない)。
 *
 * CLI: npm run products:kindle:kdp-listings --workspace=@stats47/product-factory [-- --apply]
 * 既定は dry-run (差分表示のみ)。--apply で書き込む。
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { KINDLE_BOOKS } from "./book-catalog";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");
const OUT = join(REPO_ROOT, ".claude/config/kdp-listings.json");
const BOOKS_ROOT = join(REPO_ROOT, ".local/kindle-books");

interface KdpListing {
  id: string;
  title: string;
  subtitle: string | null;
  author: string;
  language: "ja";
  description: string;
  keywords: string[];
  /** KDP ブラウズカテゴリ (最大3・人手で確定・upsert 保持)。 */
  categories: string[];
  /**
   * categories を KDP の picker の**実表記と突き合わせたか**。
   *
   * ★候補を投入しただけの状態と、オーナーが picker で確定した状態を区別する
   *   (2026-08-12 追加)。これが無いと未照合の候補が「確定済み」に見え、実在しない
   *   カテゴリ名のまま出品しようとして気づけない。picker は表記が変わるので、
   *   初回 `kdp-publish --probe` の dump と突き合わせて true にする。
   */
  categoriesVerified: boolean;
  /**
   * 出品を止めている理由 (status="blocked-thin" 等)。
   *
   * ★理由が消えると「なぜ止めたか」が分からなくなり、次の人が status だけ戻して
   *   出品しかねない (2026-08-12 に本文量の床で 20 冊を止めた)。upsert 保持する。
   */
  blockReason?: string;
  priceYen: number;
  /** 70 | 35。¥250-1,250 は 70% 可。 */
  royaltyPlan: 70 | 35;
  /** KU (KDP Select 独占) 登録。当面 false (販売のみ)。 */
  kuEnrolled: boolean;
  epubPath: string;
  coverPath: string;
  /** `blocked-thin` = 本文量の床に届かず出品を止めている (blockReason に理由)。 */
  status: "draft" | "listed" | "blocked-thin";
  asin: string | null;
  publishedAt: string | null;
}

/**
 * KDP 内容紹介 (description) を組む。**読者が Amazon の商品ページで読む文章**。
 *
 * ★内部メモを流し込まない (2026-08-12 実測で 11 冊が該当)
 *   もとは concept + newContentNote をそのまま連結していたため、商品ページに
 *   「ココナラ商品 P-02 へ誘導するファネル」「(上位5+下位5・格差・全国平均)」という
 *   社内の言葉が出る状態だった。`newContentNote` は KDP の 30% 規定を説明する**内部の記録**で、
 *   読者に向けた文章ではないので紹介文には使わない。
 *   混入は `__tests__/export-kdp-listings.test.ts` が機械的に弾く。
 */
function buildDescription(concept: string): string {
  return (
    `${concept}\n\n` +
    `【本書の構成】\n` +
    `指標ごとに、上位5県と下位5県を左右に並べた図を添えています。両端を並べることで、その指標で「もっとも高い県」と「もっとも低い県」の落差が一目で伝わります。図のあとには、なぜその分布になるのかを産業構造・地理・人口規模から読み解く解説を置きました。\n\n` +
    `【データについて】\n` +
    `本書の数値は、すべて e-Stat（政府統計の総合窓口）で公開されている政府統計から取得し、基準年をそろえて整理したものです。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。統計の定義や調査年によって数値の解釈が変わる場合があります。\n\n` +
    `データは基準年を固定した買い切りの内容です。最新の数値や、本書で扱いきれなかった指標は、姉妹サイト stats47.jp（統計で見る都道府県）で無料でご覧いただけます。`
  );
}

function readExisting(): Record<string, KdpListing> {
  try {
    return JSON.parse(readFileSync(OUT, "utf8")).listings ?? {};
  } catch {
    return {};
  }
}

function main(): void {
  const apply = process.argv.includes("--apply");
  const existing = readExisting();
  const listings: Record<string, KdpListing> = {};
  let generatedCount = 0;
  let missingEpub = 0;

  for (const b of KINDLE_BOOKS) {
    if (b.status !== "generated" && b.status !== "published") continue;
    const epubPath = join(BOOKS_ROOT, b.id, "v1", "book.epub");
    const coverPath = join(BOOKS_ROOT, b.id, "v1", "cover.png");
    if (!existsSync(epubPath)) {
      missingEpub += 1;
      continue;
    }
    const prev = existing[b.id];
    listings[b.id] = {
      id: b.id,
      title: b.title,
      subtitle: b.subtitle ?? null,
      author: b.author,
      language: "ja",
      description: buildDescription(b.concept),
      keywords: [...b.keywords].slice(0, 7),
      categories: prev?.categories ?? [], // 人手確定を保持
      categoriesVerified: prev?.categoriesVerified ?? false, // 未照合を既定にする (勝手に確定扱いしない)
      ...(prev?.blockReason ? { blockReason: prev.blockReason } : {}), // 停止理由を保持
      priceYen: b.priceYen,
      royaltyPlan: b.priceYen >= 250 && b.priceYen <= 1250 ? 70 : 35,
      kuEnrolled: prev?.kuEnrolled ?? false,
      epubPath: `.local/kindle-books/${b.id}/v1/book.epub`,
      coverPath: `.local/kindle-books/${b.id}/v1/cover.png`,
      status: prev?.status ?? "draft",
      asin: prev?.asin ?? null,
      publishedAt: prev?.publishedAt ?? null,
    };
    void coverPath;
    generatedCount += 1;
  }

  const payload = {
    _note:
      "KDP (kdp.amazon.com) 出品内容の機械可読 SSOT (stats47 専用)。kdp-operator (Playwright) が読む。" +
      "ログイン・税務/銀行情報の入力は人間工程 (自動化しない)。実公開 (--commit) はオーナー承認時のみ。" +
      "categories/status/asin/kuEnrolled は upsert 保持。書籍設計 SSOT は packages/product-factory の KINDLE_BOOKS、" +
      "EPUB は .local/kindle-books/<id>/v1/book.epub (git 管理外)。",
    listings,
  };

  console.log(`KDP listings: ${generatedCount} 冊 (generated 済) / EPUB 不在でスキップ ${missingEpub}`);
  if (apply) {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");
    console.log(`✅ 書き込み: ${OUT}`);
  } else {
    console.log(`ℹ️ dry-run (--apply で ${OUT} に書き込み)`);
  }
}

main();
