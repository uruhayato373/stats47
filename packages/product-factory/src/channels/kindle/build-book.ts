/**
 * 1 書籍を EPUB に組む orchestrator。
 * 章素材 (fresh=書き下ろし / blog=R2 記事) を集め、扉・本文・出典/免責を XHTML 化して EPUB を書き出す。
 * 生成先は .local/kindle-books/<id>/v1/ (git 管理外・KDP へのアップロードは人間工程)。
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { KindleBook, BookChapter } from "./types";
import { fetchBlogArticle, type FetchedImage } from "./fetch-content";
import { mdToXhtml } from "./md-to-xhtml";
import { buildCoverPng } from "./cover";
import { buildRankingSections, type RankingSource } from "./ranking-databook";
import { buildEpub, type EpubChapterDoc, type EpubImage } from "../../generators/epub";
import sharp from "sharp";
import { authoredBookSha256, chapterEvidence, revisionEditorIds } from "./revision-evidence";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");
/** product-factory ルート (freshFile のパス解決基点)。 */
const PF_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
export const KINDLE_OUT_ROOT_DEFAULT = resolve(REPO_ROOT, ".local/kindle-books");

/** 自社の編集品質閾値。Amazonの公式基準や出版承認の保証ではない。 */
const FRESH_RATIO_MIN = 0.3;

/**
 * 本文の絶対量の床 (2026-08-12 追加)。
 *
 * ★比率ゲートだけでは「本になっていない本」を素通りさせる。実測: S2/S3/S4 の 20 冊は
 *   総字数 4,313〜5,725 字・1 章あたり 144〜191 字 (定型 1 文 + 図) なのに、
 *   書き下ろし比率 32.9% で ✅ を出していた。比率は分母が小さいほど満たしやすいので、
 *   絶対量を見ないと「1 章 150 字 × 30 章」が合格する。
 *
 * 閾値は実測の分離幅から取った (誤検知を出さないため間を広く空ける):
 *   総字数     … 実書籍 23,419〜43,596 / 薄い本 4,313〜5,725 → 20,000
 *   1章あたり  … 実書籍 1,952〜2,906   / 薄い本 144〜191     → 800
 */
const BOOK_CHARS_MIN = 20_000;
const CHAPTER_CHARS_MIN = 800;

/** fresh 章の本文を解決する (freshFile 優先・無ければ freshText)。 */
function resolveFreshText(ch: BookChapter): string {
  if (ch.freshFile) {
    try {
      return readFileSync(resolve(PF_ROOT, ch.freshFile), "utf8");
    } catch {
      return ch.freshText ?? "";
    }
  }
  return ch.freshText ?? "";
}

function countChars(md: string): number {
  return md.replace(/\s/g, "").length;
}

const R2_SITE = "https://stats47.jp";

export interface BuildBookOptions {
  readonly outRoot?: string;
  readonly version?: string;
  /** カバー生成を省く (satori/sharp が重い場合の高速確認用)。 */
  readonly skipCover?: boolean;
  /** 明示した場合だけ生成数を制限する。省略は全指定キー。制限による除外もcoverageへ記録する。 */
  readonly rankingLimit?: number;
}

export interface BuildBookResult {
  readonly id: string;
  readonly outDir: string;
  readonly epubPath: string;
  readonly chapterCount: number;
  readonly imageCount: number;
  readonly missingSlugs: readonly string[];
  readonly sources: readonly { slug: string; title: string }[];
  /** 書き下ろし本文の文字数 (空白除く)。 */
  readonly freshChars: number;
  /** 再利用ブログ本文の文字数 (空白除く)。 */
  readonly blogChars: number;
  /** 書き下ろし比率 (fresh / (fresh + blog))。 */
  readonly freshRatio: number;
  /** 自社の書き下ろし比率閾値 (30%) を満たすか。Amazon公式基準ではない。 */
  readonly freshRatioOk: boolean;
  /** 本文の総字数 (fresh + blog)。 */
  readonly totalChars: number;
  /** 1 章あたりの平均字数。 */
  readonly charsPerChapter: number;
  /** 本文の絶対量が書籍として成立するか (比率とは別の床)。 */
  readonly volumeOk: boolean;
  readonly coverage: BookCoverage;
  readonly rankingSources: readonly RankingSource[];
  readonly machineQualityOk: boolean;
}

export interface BookCoverage {
  readonly rankingRequested: number;
  readonly rankingIncluded: number;
  readonly missing: readonly { key: string; reason: string }[];
  readonly complete: boolean;
}

export function assertBookVersion(version: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(version)) {
    throw new Error(`Unsafe book version: ${version}`);
  }
}

/**
 * 扉 (title page) の XHTML。
 * 書名だけの扉と、奥付 (本書について) を **2 ページに分ける** (`.colophon` が改ページ)。
 * 1 ページに詰め込むと書籍の体裁にならず、Previewer でも扉が本文の一部に見える。
 * 見た目の指定は style.css の `.titlepage` / `.colophon` に置く (inline style を増やさない)。
 */
function titlePage(book: KindleBook): string {
  const sub = book.subtitle ? `<p class="subtitle">${escapeText(book.subtitle)}</p>` : "";
  return `<div class="titlepage">
<h1>${escapeText(book.title)}</h1>
${sub}
<p class="author">${escapeText(book.author)}</p>
</div>
<div class="colophon">
<h2>本書について</h2>
<p>${escapeText(book.concept)}</p>
<aside class="callout"><p class="callout-label">データについて</p><p>本書は e-Stat（政府統計の総合窓口）等の公的データを整理しています。指標ごとに対象年・母集団・集計方法は異なります。各章と出典の定義を確認してください。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。</p></aside>
</div>`;
}

/** 出典・免責ページの XHTML。 */
function sourcesPage(sources: readonly { slug: string; title: string }[]): string {
  const items = sources
    .map((s) => `<p>「${escapeText(s.title)}」— ${R2_SITE}/blog/${escapeText(s.slug)}（統計で見る都道府県）</p>`)
    .join("\n");
  return `<section class="sources">
<h1>出典と免責</h1>
<h2>各章のもとになったデータ</h2>
<p>${items ? "各章の元記事は下記のページで公開しています。" : "ランキング章の原典メタデータと観測値の参照先は「指標別の出典・対象年」に収録しています。"}指標ごとに対象年と母集団が異なるため、数値の比較には各章の定義と出典を確認してください。</p>
${items}
<h2>免責</h2>
<p>本書は公的統計の概況を整理したものであり、意思決定の結果を保証するものではありません。国・府省・自治体および e-Stat の公認・推奨を示すものではありません。統計の定義・調査年・集計方法により数値の解釈が変わる場合があります。</p>
<p>本書のデータは基準年固定です（自動更新はありません）。最新の数値は ${R2_SITE} でご確認ください。</p>
</section>`;
}

function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** fresh 章の freshText から先頭見出し行 (# ...) を除く (章タイトルと重複するため)。 */
function stripLeadingHeading(md: string): string {
  return md.replace(/^\s*#\s+.*\n+/, "");
}

/** 全書籍に付与する「本書の図表の見方」本文 (markdown・上位5/下位5 カードの読み方)。 */
function figureGuideMd(): string {
  return `本書の各章には、都道府県を比べる図を添えています。ランキングの図は、四十七都道府県すべてを一枚に詰め込むのではなく、上位五県と下位五県だけを抜き出して左右に並べる形にしています。両端を並べると、その指標で「もっとも高い県」と「もっとも低い県」の落差が一目で伝わるからです。

全県表が付いた章では、中位の県や同順位の県も表で確認できます。単一指標の大小順であり、住みやすさや個人の状態を順位付けしたものではありません。図や表の対象年は章ごとに確認してください。姉妹サイト stats47.jp の更新後の値が、本書の固定版と同じとは限りません。

図で地域差を見つけたら、対象・分母・年次を確認します。差が見えることと、その原因が分かることは別です。世帯調査の平均を全住民の実態としたり、施設数を利用しやすさと読み替えたりしないよう注意してください。

## 本文に出てくる「相関」の読み方

本文では、二つの指標がどれくらい連動しているかを示すために「相関」という言葉と、r という記号を使っています。読み飛ばしても本筋は追えますが、意味を知っておくと本文の見通しがよくなります。

r は −1 から +1 までの数で、二つの指標の直線的な関係の強さを表します。r が +1 に近いほど「片方が高い県はもう片方も高い」、−1 に近いほど「片方が高い県はもう片方が低い」という直線的な関係が強くなります。0 に近くても、曲線的な関係がないとは限りません。値の大きさだけで因果関係や実務上の重要性を判断せず、対象・年次・分母と散布図を確認してください。

「偏相関」は、指定した変数との直線的な関係を調整した後に、二つの変数の残差同士の相関を測る方法です。人口を調整しても、人口に関係する影響をすべて取り除けるとは限りません。調整変数・対象地域・欠測処理・変数間の構造によって解釈が変わり、調整後の相関だけで独立した効果や原因を証明することはできません。

**連動していることと、片方がもう片方の原因であることは別です**。二つの指標が一緒に動いていても、共通する別の条件や測定方法が関係している場合があります。「可能性」という表現でも根拠の代わりにはなりません。説明の確かさは、元の数値と定義、比較の設計に戻って判断してください。`;
}

/** 出典章を持たない書籍に自動付与する標準の「出典と再現について」本文 (markdown)。 */
function autoSourcesChapterMd(book: KindleBook): string {
  return `本書は e-Stat（政府統計の総合窓口）等の公的データを整理したものです。指標ごとに対象年・母集団・集計方法が異なります。単純平均などの編集上の集計は全国集計値と区別して示しています。指標別出典と元記事を確認し、同じ対象範囲の数値を比較してください。

## データの基準年について

本書のデータは基準年を固定した「買い切り」の内容です。収録年は指標ごとに異なります。推計を扱う章では観測値と区別し、推計の基準時点や仮定を確認してください。生成時点のR2保存データから取得しており、原典で公表された最新値と一致する保証はありません。比較前に各指標の収録年・対象地域・分母・原典を確認してください。関連する指標は姉妹サイト stats47.jp（統計で見る都道府県）でも確認できます。

## 免責

本書は公的統計の概況を整理・可視化したものであり、特定の意思決定の結果を保証するものではありません。国・府省・自治体および e-Stat の公認や推奨を示すものでもありません。統計は、その定義・調査年・集計方法によって数値の意味が変わることがあります。本書の数字を根拠に何かを判断される際は、各統計の原典にあたって定義をご確認いただくことをおすすめします。

## 再現性について

順位表を再計算するには、元の数値に加え、対象地域、欠測の扱い、同順位、丸め方をそろえる必要があります。収録表と指標別出典から比較条件を確認してください。同じ調査名や基準年というだけで、異なる集計範囲の値が一致するわけではありません。`;
}

function isoModified(): string {
  // dcterms:modified は CCYY-MM-DDThh:mm:ssZ。ミリ秒を除く。
  return new Date().toISOString().replace(/\.\d+Z$/, "Z");
}

/** 書籍 1 冊を EPUB に組み、.local/kindle-books/<id>/v1/ に書き出す。 */
export async function buildBook(book: KindleBook, opts: BuildBookOptions = {}): Promise<BuildBookResult> {
  const outRoot = opts.outRoot ?? KINDLE_OUT_ROOT_DEFAULT;
  const version = opts.version ?? "v1";
  assertBookVersion(version);
  if (!/^K-S[1-4]-\d{2}$/.test(book.id)) throw new Error(`Unsafe book id: ${book.id}`);
  const outDir = join(outRoot, book.id, version);
  mkdirSync(dirname(outDir), { recursive: true });
  // Exclusive reservation: an existing edition (including a failed attempt) is immutable.
  mkdirSync(outDir);

  const chapters: EpubChapterDoc[] = [];
  const images: EpubImage[] = [];
  const imageSeen = new Set<string>();
  const missingSlugs: string[] = [];
  const sources: { slug: string; title: string }[] = [];
  const rankingSources: RankingSource[] = [];
  const missingInputs: { key: string; reason: string }[] = [];
  const rankingRequested = book.chapters.reduce(
    (n, ch) => n + (ch.source === "ranking" ? (ch.rankingKeys?.length ?? 0) : 0),
    0,
  );
  let freshChars = 0;
  let blogChars = 0;

  // 扉
  chapters.push({
    id: "front",
    fileName: "chap-000.xhtml",
    title: "扉",
    bodyXhtml: titlePage(book),
  });

  // 図表の見方 (fresh・K-S1-01 は intro 内に同等の記述があるため除く)。
  if (book.id !== "K-S1-01") {
    const md = figureGuideMd();
    freshChars += countChars(`# 本書の図表の見方\n${md}`);
    chapters.push({
      id: "figguide",
      fileName: "chap-00a.xhtml",
      title: "本書の図表の見方",
      bodyXhtml: `<h1>本書の図表の見方</h1>\n${mdToXhtml(md)}`,
    });
  }

  let idx = 0;
  for (const ch of book.chapters) {
    idx += 1;
    const id = `chap${String(idx).padStart(3, "0")}`;
    const fileName = `${id}.xhtml`;
    const heading = `<h1>${escapeText(ch.title)}</h1>`;

    if (ch.source === "fresh") {
      const raw = resolveFreshText(ch);
      if (!raw.trim() || (ch.freshFile && !existsSync(resolve(PF_ROOT, ch.freshFile)))) {
        missingInputs.push({
          key: ch.freshFile ?? ch.title,
          reason: "missing-fresh-manuscript",
        });
        missingSlugs.push(ch.freshFile ?? ch.title);
      }
      freshChars += countChars(raw);
      const md = stripLeadingHeading(raw);
      chapters.push({
        id,
        fileName,
        title: ch.title,
        bodyXhtml: `${heading}\n${mdToXhtml(md)}`,
      });
      continue;
    }
    if (ch.source === "blog") {
      const slug = ch.blogSlug;
      if (!slug) {
        missingInputs.push({ key: ch.title, reason: "missing-blog-slug" });
        missingSlugs.push(ch.title);
        chapters.push({
          id,
          fileName,
          title: ch.title,
          bodyXhtml: `${heading}\n<p>（本章は準備中です）</p>`,
        });
        continue;
      }
      try {
        const art = await fetchBlogArticle(slug);
        for (const img of art.images) {
          if (!imageSeen.has(img.fileName)) {
            imageSeen.add(img.fileName);
            images.push({
              fileName: img.fileName,
              png: (img as FetchedImage).png,
            });
          }
        }
        blogChars += countChars(art.body);
        sources.push({ slug, title: art.title });
        chapters.push({
          id,
          fileName,
          title: ch.title,
          bodyXhtml: `${heading}\n${mdToXhtml(art.body)}`,
        });
      } catch {
        missingInputs.push({ key: slug, reason: "blog-fetch-failed" });
        missingSlugs.push(slug);
        chapters.push({
          id,
          fileName,
          title: ch.title,
          bodyXhtml: `${heading}\n<p>（本章の素材を取得できませんでした: ${escapeText(slug)}）</p>`,
        });
      }
      continue;
    }
    // ranking source (S2/S4 データブック型): rankingKeys から R2 観測値でランキング章を生成する。
    if (ch.source === "ranking" && ch.rankingKeys && ch.rankingKeys.length > 0) {
      const limit = opts.rankingLimit ?? ch.rankingKeys.length;
      const sections = await buildRankingSections(ch.rankingKeys, limit, {
        highlightRegionLabel: ch.highlightRegionLabel,
        highlightCodes: ch.highlightCodes,
        regionBlockLabel: ch.regionBlockLabel,
        onMissing: (key, reason) => {
          missingInputs.push({ key, reason });
          missingSlugs.push(key);
        },
      });
      // 導入 (章見出し + リード)
      chapters.push({
        id,
        fileName,
        title: ch.title,
        bodyXhtml: `${heading}\n<p>${escapeText(ch.title)}に関する統計を、上位5地域・下位5地域のランキングで見ていきます。指標ごとに対象年と母集団が異なります。各章題と巻末の指標別出典を確認してください。</p>`,
      });
      for (const sec of sections) {
        rankingSources.push(sec.source);
        idx += 1;
        const sid = `chap${String(idx).padStart(3, "0")}`;
        if (sec.image && !imageSeen.has(sec.image.fileName)) {
          imageSeen.add(sec.image.fileName);
          images.push({ fileName: sec.image.fileName, png: sec.image.png });
        }
        blogChars += countChars(sec.bodyMd);
        chapters.push({
          id: sid,
          fileName: `${sid}.xhtml`,
          title: sec.title,
          bodyXhtml: `<h1>${escapeText(sec.title)}</h1>\n${mdToXhtml(sec.bodyMd)}`,
        });
      }
      continue;
    }
    // rankingKeys 未指定の ranking 章はプレースホルダ。
    missingInputs.push({ key: ch.title, reason: "missing-ranking-keys" });
    missingSlugs.push(ch.title);
    chapters.push({
      id,
      fileName,
      title: ch.title,
      bodyXhtml: `${heading}\n<p>（本章はデータブック版として準備中です）</p>`,
    });
  }

  // 出典補章 (fresh 扱い・出典章が無い書籍にのみ自動付与)。
  const hasSourcesChapter = book.chapters.some((c) => c.source === "fresh" && c.title.includes("出典"));
  if (!hasSourcesChapter) {
    idx += 1;
    const sid = `chap${String(idx).padStart(3, "0")}`;
    const md = autoSourcesChapterMd(book);
    freshChars += countChars(`# 出典と再現について\n${md}`);
    chapters.push({
      id: sid,
      fileName: `${sid}.xhtml`,
      title: "出典と再現について",
      bodyXhtml: `<h1>出典と再現について</h1>\n${mdToXhtml(md)}`,
    });
  }

  // 出典・免責
  chapters.push({
    id: "sources",
    fileName: "chap-999.xhtml",
    title: "出典と免責",
    bodyXhtml: sourcesPage(sources),
  });

  let coverPng: Buffer | undefined;
  if (!opts.skipCover) {
    try {
      // 書籍ごとのカバー背景 (git 管理・文字なし 1600×2560 JPEG)。無ければシリーズ基調色の無地。
      const bgPath = join(PF_ROOT, "src/channels/kindle/assets/cover-backgrounds", `${book.id}.jpg`);
      coverPng = await buildCoverPng({
        title: book.title,
        subtitle: book.subtitle,
        series: book.series,
        author: book.author,
        backgroundJpeg: existsSync(bgPath) ? readFileSync(bgPath) : undefined,
      });
      writeFileSync(join(outDir, "cover.png"), coverPng);
      // ★KDP の表紙アップロードは **JPEG / TIFF しか受け付けない** (`accept=".tiff,.tif,.jpeg,.jpg"`)。
      //   PNG を渡しても file input が黙って拒否し、KDP 側は「表紙がアップロードされていません」の
      //   ままになる (2026-08-12 に実際に 9 件の下書きがそうなった)。EPUB には PNG を埋め、
      //   出品用に JPEG も並べて出す。
      writeFileSync(
        join(outDir, "cover.jpg"),
        await sharp(coverPng).jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toBuffer(),
      );
    } catch (e) {
      // カバー失敗は EPUB 生成を止めない (KDP の Cover Creator で作れる)。
      console.warn(`  ⚠ カバー生成に失敗 (続行): ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (rankingSources.length > 0) {
    const entries = rankingSources
      .map(
        (s) =>
          `<h2>${escapeText(s.title)}</h2><p>指標: ${escapeText(s.rankingKey)} / 年: ${escapeText(s.year)} / 単位: ${escapeText(s.unit)} / 値あり: ${s.observedAreas}地域 / 欠測: ${s.missingAreas}地域</p><p>一次出典メタ: ${escapeText(JSON.stringify(s.source))}</p><p>観測値: ${escapeText(s.rawUrl)}</p><p>解説: ${escapeText(s.canonicalUrl)}</p>`,
      )
      .join("\n");
    chapters.push({
      id: "ranking-sources",
      fileName: "ranking-sources.xhtml",
      title: "指標別の出典・対象年",
      bodyXhtml: `<h1>指標別の出典・対象年</h1><p>指標ごとに対象年・母集団が異なります。全国集計値と地域値の単純平均は区別してください。</p>${entries}`,
    });
  }
  const totalBody = freshChars + blogChars;
  const freshRatio = totalBody > 0 ? freshChars / totalBody : 0;
  const freshRatioOk = freshRatio >= FRESH_RATIO_MIN;
  // 比率とは別に絶対量を見る (比率は分母が小さいほど満たしやすい)。
  const charsPerChapter = chapters.length > 0 ? Math.round(totalBody / chapters.length) : 0;
  const volumeOk = totalBody >= BOOK_CHARS_MIN && charsPerChapter >= CHAPTER_CHARS_MIN;
  const coverage: BookCoverage = {
    rankingRequested,
    rankingIncluded: rankingSources.length,
    missing: missingInputs,
    complete: missingInputs.length === 0 && rankingRequested === rankingSources.length,
  };
  const machineQualityOk = volumeOk && freshRatioOk && coverage.complete && Boolean(coverPng);

  const epubPath = join(outDir, "book.epub");
  await buildEpub(
    {
      identifier: `urn:stats47:kindle:${book.id}`,
      title: book.title,
      author: book.author,
      modified: isoModified(),
      coverPng,
      chapters,
      images,
      description: book.concept,
    },
    epubPath,
  );

  // メタ + READINESS を書き出す。
  writeFileSync(
    join(outDir, "metadata.json"),
    JSON.stringify(
      {
        schemaVersion: 2,
        authoredSha256: authoredBookSha256(book, PF_ROOT),
        editorIds: revisionEditorIds(book.id),
        reviewChapters: chapterEvidence(chapters),
        generatedAt: new Date().toISOString(),
        version,
        status: "generated-review-required",
        id: book.id,
        series: book.series,
        title: book.title,
        subtitle: book.subtitle ?? null,
        author: book.author,
        priceYen: book.priceYen,
        keywords: book.keywords,
        chapterCount: chapters.length,
        imageCount: images.length,
        freshChars,
        blogChars,
        freshRatio: Number(freshRatio.toFixed(4)),
        freshRatioOk,
        totalChars: totalBody,
        charsPerChapter,
        volumeOk,
        coverage,
        machineQualityOk,
        rankingSources,
        reviewRequired: true,
        previewerRequired: true,
        sources,
        missingSlugs,
        newContentNote: book.newContentNote,
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(outDir, "READINESS.md"),
    renderReadiness(book, chapters.length, images.length, missingSlugs, {
      freshChars,
      blogChars,
      freshRatio,
      freshRatioOk,
    }) +
      `\n## 機械生成結果（販売準備完了ではありません）\n\n- 版: ${version}\n- 総字数: ${totalBody} / 章平均: ${charsPerChapter} / 本文量: ${volumeOk ? "PASS" : "FAIL"}\n- ランキング入力: ${rankingSources.length}/${rankingRequested} / 入力完全性: ${coverage.complete ? "PASS" : "FAIL"}\n- 機械品質: ${machineQualityOk ? "PASS" : "FAIL"}\n- 書き下ろし30%は自社の編集品質閾値です。Amazonの公式数値基準・出版承認・販売成果を保証しません。\n- 新版の意味レビュー・Kindle Previewer・archive照合・公開承認は未完了です。\n`,
  );

  return {
    id: book.id,
    outDir,
    epubPath,
    chapterCount: chapters.length,
    imageCount: images.length,
    missingSlugs,
    sources,
    freshChars,
    blogChars,
    freshRatio,
    freshRatioOk,
    totalChars: totalBody,
    charsPerChapter,
    volumeOk,
    coverage,
    rankingSources,
    machineQualityOk,
  };
}

function renderReadiness(
  book: KindleBook,
  chapterCount: number,
  imageCount: number,
  missing: readonly string[],
  ratio: {
    freshChars: number;
    blogChars: number;
    freshRatio: number;
    freshRatioOk: boolean;
  },
): string {
  const pct = (ratio.freshRatio * 100).toFixed(2);
  const ratioLine = ratio.freshRatioOk
    ? `- 書き下ろし比率: ${pct}%（fresh ${ratio.freshChars} / blog ${ratio.blogChars}）✅ 30% 以上`
    : `- 書き下ろし比率: ${pct}%（fresh ${ratio.freshChars} / blog ${ratio.blogChars}）⚠️ **自社品質閾値30%未満 — 編集を継続してください**`;
  return `# ${book.id} 出品前チェック (KDP・人間工程)

- 書名: ${book.title}${book.subtitle ? ` / ${book.subtitle}` : ""}
- 価格案: ¥${book.priceYen}（価格・ロイヤリティ条件は出品時に確認）
- 章数: ${chapterCount}（扉・出典含む） / 図版: ${imageCount} 点
${ratioLine}
${missing.length ? `- ⚠ 取得できなかった素材 slug: ${missing.join(", ")}\n` : ""}
## アップロード前チェックリスト（人間）

- [ ] 書き下ろし比率が 30% 以上である（上記）
- [ ] Kindle Previewer で全章・全図版の表示崩れがないか確認した
- [ ] （任意）epubcheck で EPUB3 妥当性を確認した
- [ ] 書き下ろし（はじめに・おわりに等）が実質を伴い、Web 公開記事の単純コピーになっていないか確認した（KDP の「Web で無料入手可能なコンテンツ」規定）
- [ ] 表紙（cover.png）を使うか、KDP Cover Creator で作り直すか決めた
- [ ] KU（Kindle Unlimited / KDP Select 独占）に登録するかを決めた（当面は非登録・販売のみを推奨）
- [ ] カテゴリ・キーワードを設定した（候補: ${book.keywords.join(" / ")}）
- [ ] 出版社／著者名・内容紹介文を用意した

## アップロード（人間・自動化しない）

ログイン・2FA・税務・銀行情報はオーナー工程です。kdp.amazon.co.jp での出品操作は、意味レビュー・Previewer・archive照合後に既定のKDP手順へ引き渡します。生成だけでは公開しません。
`;
}
