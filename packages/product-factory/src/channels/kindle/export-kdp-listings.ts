/**
 * KINDLE_BOOKS と検証対象の版から、未公開の入稿提案を生成する。
 * 公開台帳 (.claude/config/kdp-listings.json) は参照のみ。過去の公開記録を提案内に保持する。
 *
 * CLI: npm run products:kindle:kdp-listings --workspace=@stats47/product-factory -- --version <版>
 * .local/kindle-listing-revisions/<版>.json を上書き禁止で作成する。--apply は禁止。
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { KINDLE_BOOKS } from "./book-catalog";
import { KDP_AUTHOR, KDP_READINGS } from "./kdp-reading";
import { kdpCategoriesFor } from "./kdp-category";
import { KDP_AI_DISCLOSURE, KDP_APPLY_DRM } from "./kdp-publishing-policy";
import { assertBookVersion } from "./build-book";
import { authoredBookSha256 } from "./revision-evidence";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");
const OUT = join(REPO_ROOT, ".claude/config/kdp-listings.json");
const BOOKS_ROOT = join(REPO_ROOT, ".local/kindle-books");

interface KdpListing {
  id: string;
  title: string;
  subtitle: string | null;
  author: string;
  /** 著者の姓 (KDP は姓・名を分けて持つ)。 */
  authorLastName: string;
  /** 著者の名 (屋号なので空)。 */
  authorFirstName: string;
  authorKana: string;
  authorRomaji: string;
  /** ★日本語 KDP が要求するフリガナ / ローマ字 (kdp-reading.ts が SSOT)。 */
  titleKana: string;
  titleRomaji: string;
  subtitleKana: string | null;
  subtitleRomaji: string | null;
  language: "ja";
  description: string;
  keywords: string[];
  /**
   * KDP の掲載場所 (最大 3 枠)。SSOT は `kdp-category.ts`。
   *
   * ★文字列 1 本 (`Kindleストア > … > 統計学`) をやめた (2026-08-12)
   *   実モーダルを採取したところ、KDP は段階式のドロップダウンで、
   *   もとの SSOT が持っていた「統計学」という掲載場所は**存在しなかった**。
   *   実在する分類だけを持つため `{top, leaf}` の形にし、
   *   `validate` が採取済みツリー (`.local/kdp-debug/category-tree.json`) と突き合わせる。
   *
   * ★人手保持をやめた理由
   *   カテゴリは必須項目で、未選択だとウィザードが 1 歩も進まない。
   *   「カテゴリだけ人手」という切り分けは成立しないので SSOT から機械生成する。
   */
  categoryPaths: { top: string; sub: string; place: string }[];
  /** DRM を適用するか (出版後に変更不可。SSOT は kdp-publishing-policy.ts)。 */
  applyDrm: boolean;
  /** 生成 AI の使用開示。**Amazon への申告**なので事実をそのまま出す。 */
  aiDisclosure: {
    used: boolean;
    text: string;
    images: string;
    translations: string;
    textTools: string[];
    imageTools: string[];
  };
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
  /**
   * KDP 上の下書き ID (title-setup/kindle/<ここ>/details)。
   *
   * ★upsert 保持が必須。消えると次回 `new/details` から作り直すことになり、
   *   同じ本の空下書きが増える (実際に 1 冊の試行で 5 件できた)。
   */
  draftId?: string;
  asin: string | null;
  publishedAt: string | null;
  lastSubmittedAt?: string | null;
  salesStartedAt?: string | null;
  kdpStatus?: "draft" | "in_review" | "live" | "unknown";
  kdpStatusLabel?: string | null;
  kdpStatusCheckedAt?: string | null;
}

/**
 * KDP 内容紹介 (description) を組む。**読者が Amazon の商品ページで読む文章**。
 *
 * ★内部メモを流し込まない (2026-08-12 実測で 11 冊が該当)
 *   もとは concept + newContentNote をそのまま連結していたため、商品ページに
 *   「ココナラ商品 P-02 へ誘導するファネル」「(上位5+下位5・格差・全国平均)」という
   *   社内の言葉が出る状態だった。`newContentNote` は自社の編集品質方針を説明する**内部の記録**で、
 *   読者に向けた文章ではないので紹介文には使わない。
 *   混入は `__tests__/export-kdp-listings.test.ts` が機械的に弾く。
 */
function buildDescription(concept: string): string {
  return (
    `${concept}\n\n` +
    `【本書の構成】\n` +
    `統計の比較を図表と解説でたどり、値の違いを読むために対象地域・分母・収録年を確認します。県別の概況を個人の属性や地域内の状況と混同せず、データだけでは断定できないことも整理しています。\n\n` +
    `【データについて】\n` +
    `e-Stat（政府統計の総合窓口）などの公的データをもとに編集しています。収録年・母集団・集計方法は指標ごとに異なり、将来推計や過去の観測値を含みます。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。\n\n` +
    `基準年固定の内容で、自動更新や最新値の保証はありません。出典を確認するための情報を巻末にまとめています。関連指標は姉妹サイト stats47.jp（統計で見る都道府県）でもご覧いただけます。`
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
  if (apply) throw new Error("--apply is blocked: prepare an immutable revision proposal, then complete review/Previewer/archive and obtain owner approval before switching the publication record");
  const versionIndex = process.argv.indexOf("--version");
  const version = versionIndex >= 0 ? process.argv[versionIndex + 1] : "";
  assertBookVersion(version);
  const existing = readExisting();
  const listings: Record<string, KdpListing> = {};
  let generatedCount = 0;
  let missingEpub = 0;

  for (const b of KINDLE_BOOKS) {
    if (b.status !== "generated" && b.status !== "published") continue;
    const epubPath = join(BOOKS_ROOT, b.id, version, "book.epub");
    // ★KDP は JPEG/TIFF しか受け付けないので出品に使うのは cover.jpg (cover.png は EPUB 用)。
    const coverPath = join(BOOKS_ROOT, b.id, version, "cover.jpg");
    if (!existsSync(epubPath) || !existsSync(coverPath)) {
      missingEpub += 1;
      continue;
    }
    const metadata = JSON.parse(readFileSync(join(BOOKS_ROOT, b.id, version, "metadata.json"), "utf8"));
    if (metadata.version !== version || metadata.title !== b.title || metadata.authoredSha256 !== authoredBookSha256(b, join(REPO_ROOT, "packages/product-factory"))) {
      throw new Error(`${b.id}: current manuscript/catalog differs from the requested EPUB edition`);
    }
    const prev = existing[b.id];
    listings[b.id] = {
      id: b.id,
      title: b.title,
      subtitle: b.subtitle ?? null,
      author: b.author,
      authorLastName: KDP_AUTHOR.lastName,
      authorFirstName: KDP_AUTHOR.firstName,
      authorKana: KDP_AUTHOR.kana,
      authorRomaji: KDP_AUTHOR.romaji,
      titleKana: KDP_READINGS[b.id]?.titleKana ?? "",
      titleRomaji: KDP_READINGS[b.id]?.titleRomaji ?? "",
      subtitleKana: KDP_READINGS[b.id]?.subtitleKana ?? null,
      subtitleRomaji: KDP_READINGS[b.id]?.subtitleRomaji ?? null,
      language: "ja",
      description: buildDescription(b.concept),
      keywords: [...b.keywords].slice(0, 7),
      categoryPaths: kdpCategoriesFor(b.id).map((c) => ({ ...c })), // SSOT から生成 (実在検査つき)
      applyDrm: KDP_APPLY_DRM,
      aiDisclosure: {
        ...KDP_AI_DISCLOSURE,
        textTools: [...KDP_AI_DISCLOSURE.textTools],
        imageTools: [...KDP_AI_DISCLOSURE.imageTools],
      },
      ...(prev?.blockReason ? { blockReason: prev.blockReason } : {}), // 停止理由を保持
      priceYen: b.priceYen,
      royaltyPlan: b.priceYen >= 250 && b.priceYen <= 1250 ? 70 : 35,
      kuEnrolled: prev?.kuEnrolled ?? false,
      epubPath: `.local/kindle-books/${b.id}/${version}/book.epub`,
      coverPath: `.local/kindle-books/${b.id}/${version}/cover.jpg`,
      ...(prev?.draftId ? { draftId: prev.draftId } : {}), // 下書き ID を保持
      status: prev?.status ?? "draft",
      asin: prev?.asin ?? null,
      publishedAt: prev?.publishedAt ?? null,
      ...(prev?.lastSubmittedAt ? { lastSubmittedAt: prev.lastSubmittedAt } : {}),
      ...(prev?.salesStartedAt ? { salesStartedAt: prev.salesStartedAt } : {}),
      ...(prev?.kdpStatus ? { kdpStatus: prev.kdpStatus } : {}),
      ...(prev?.kdpStatusLabel ? { kdpStatusLabel: prev.kdpStatusLabel } : {}),
      ...(prev?.kdpStatusCheckedAt ? { kdpStatusCheckedAt: prev.kdpStatusCheckedAt } : {}),
    };
    generatedCount += 1;
  }

  const payload = {
    schemaVersion: 1,
    version,
    generatedAt: new Date().toISOString(),
    readyToPublish: false,
    publicationRecordsChanged: false,
    _note:
      "未公開の入稿提案。listings 内の公開属性は旧台帳から引き継いだ履歴で、この改訂版の公開証明ではありません。" +
      "独立レビュー・Previewer・保全確認・オーナー承認後のみ対象IDを公開台帳へ反映します。" +
      "ログイン・税務/銀行情報の入力は人間工程です。書籍設計の正典は KINDLE_BOOKS、対象EPUBは明示した version のものです。",
    listings,
    previousPublicationRecords: existing,
  };

  console.log(`KDP listings: ${generatedCount} 冊 (generated 済) / 入稿資産不在でスキップ ${missingEpub}`);
  if (missingEpub) throw new Error(`改訂EPUBまたは表紙欠落 ${missingEpub} 冊。部分台帳を出力しません`);
  const proposalPath = join(REPO_ROOT, ".local/kindle-listing-revisions", `${version}.json`);
  mkdirSync(dirname(proposalPath), { recursive: true });
  writeFileSync(proposalPath, JSON.stringify(payload, null, 2) + "\n", { flag: "wx" });
  console.log(`準備用提案を書き出しました（公開台帳は未変更）: ${proposalPath}`);
}

main();
