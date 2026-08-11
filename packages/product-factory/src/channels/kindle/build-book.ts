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
import { buildRankingSections } from "./ranking-databook";
import { buildEpub, type EpubChapterDoc, type EpubImage } from "../../generators/epub";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");
/** product-factory ルート (freshFile のパス解決基点)。 */
const PF_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
export const KINDLE_OUT_ROOT_DEFAULT = resolve(REPO_ROOT, ".local/kindle-books");

/** KDP の Web 無料公開コンテンツ規定に備えた書き下ろし比率の下限 (この未満は警告)。 */
const FRESH_RATIO_MIN = 0.3;

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
  /** ranking 章 (S2/S4) で 1 章あたり生成する上位5+下位5 ランキングの最大数 (既定 15)。 */
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
  /** KDP の Web 無料公開コンテンツ規定の目安 (30%) を満たすか。 */
  readonly freshRatioOk: boolean;
}

/**
 * 扉 (title page) の XHTML。
 * 書名だけの扉と、奥付 (本書について) を **2 ページに分ける** (`.colophon` が改ページ)。
 * 1 ページに詰め込むと書籍の体裁にならず、Previewer でも扉が本文の一部に見える。
 * 見た目の指定は style.css の `.titlepage` / `.colophon` に置く (inline style を増やさない)。
 */
function titlePage(book: KindleBook): string {
  const sub = book.subtitle
    ? `<p class="subtitle">${escapeText(book.subtitle)}</p>`
    : "";
  return `<div class="titlepage">
<h1>${escapeText(book.title)}</h1>
${sub}
<p class="author">${escapeText(book.author)}</p>
</div>
<div class="colophon">
<h2>本書について</h2>
<p>${escapeText(book.concept)}</p>
<p>${escapeText(book.newContentNote)}</p>
<aside class="callout"><p class="callout-label">データについて</p><p>本書の数値はすべて e-Stat（政府統計の総合窓口）等で公開されている一次統計から取得し、基準年をそろえて整理したものです。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。</p></aside>
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
<p>各章の統計は、下記のページで最新のデータ・地図・グラフとして公開しています。数値は総務省・各府省が公表する政府統計（e-Stat 掲載）を一次出典とし、基準年をそろえて整理しています。</p>
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

中位の県や、自分の県が正確に何位なのかを知りたいときは、姉妹サイト stats47.jp で四十七県すべての順位と数値を確認することができます。図に添えた数字は、本文で触れた基準年の実データです。

図をながめて落差の大きさを感じ取り、本文でその背景を読む——この順番で読み進めると、それぞれの県の事情が立体的に見えてくるはずです。数字は、その県に暮らす人々の生活の一面を映した鏡でもあります。単なる順位の上下としてではなく、その裏側にある暮らしや歴史を想像しながら読んでいただければ幸いです。`;
}

/** 出典章を持たない書籍に自動付与する標準の「出典と再現について」本文 (markdown)。 */
function autoSourcesChapterMd(book: KindleBook): string {
  return `本書に掲載した統計は、すべて e-Stat（政府統計の総合窓口）で公開されている政府統計から取得したものです。総務省をはじめとする各府省が実施する公的な調査のデータを、基準年をそろえて整理し、上位・下位の対比が見えるかたちに並べ直しました。書籍のために数値を作ったり、独自に推計したりはしていません。

## データの基準年について

本書のデータは基準年を固定した「買い切り」の内容です。統計は毎年更新されていくため、本書の数値は執筆時点で公表されていた最新のものを用いています。ご自身の県の最新の数値や、本書で扱いきれなかった指標については、姉妹サイト stats47.jp（統計で見る都道府県）で、いつでも無料で確認することができます。

## 免責

本書は公的統計の概況を整理・可視化したものであり、特定の意思決定の結果を保証するものではありません。国・府省・自治体および e-Stat の公認や推奨を示すものでもありません。統計は、その定義・調査年・集計方法によって数値の意味が変わることがあります。本書の数字を根拠に何かを判断される際は、各統計の原典にあたって定義をご確認いただくことをおすすめします。

## 再現性について

本書のランキングや図表は、e-Stat が公開する一次統計から機械的に再構成できるかたちで作成しています。同じ調査・同じ基準年のデータを用いれば、どなたでも本書と同じ順位表を再現することができます。`;
}

function isoModified(): string {
  // dcterms:modified は CCYY-MM-DDThh:mm:ssZ。ミリ秒を除く。
  return new Date().toISOString().replace(/\.\d+Z$/, "Z");
}

/** 書籍 1 冊を EPUB に組み、.local/kindle-books/<id>/v1/ に書き出す。 */
export async function buildBook(book: KindleBook, opts: BuildBookOptions = {}): Promise<BuildBookResult> {
  const outRoot = opts.outRoot ?? KINDLE_OUT_ROOT_DEFAULT;
  const version = opts.version ?? "v1";
  const outDir = join(outRoot, book.id, version);
  mkdirSync(outDir, { recursive: true });

  const chapters: EpubChapterDoc[] = [];
  const images: EpubImage[] = [];
  const imageSeen = new Set<string>();
  const missingSlugs: string[] = [];
  const sources: { slug: string; title: string }[] = [];
  let freshChars = 0;
  let blogChars = 0;

  // 扉
  chapters.push({ id: "front", fileName: "chap-000.xhtml", title: "扉", bodyXhtml: titlePage(book) });

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
      freshChars += countChars(raw);
      const md = stripLeadingHeading(raw);
      chapters.push({ id, fileName, title: ch.title, bodyXhtml: `${heading}\n${mdToXhtml(md)}` });
      continue;
    }
    if (ch.source === "blog") {
      const slug = ch.blogSlug;
      if (!slug) {
        chapters.push({ id, fileName, title: ch.title, bodyXhtml: `${heading}\n<p>（本章は準備中です）</p>` });
        continue;
      }
      try {
        const art = await fetchBlogArticle(slug);
        for (const img of art.images) {
          if (!imageSeen.has(img.fileName)) {
            imageSeen.add(img.fileName);
            images.push({ fileName: img.fileName, png: (img as FetchedImage).png });
          }
        }
        blogChars += countChars(art.body);
        sources.push({ slug, title: art.title });
        chapters.push({ id, fileName, title: ch.title, bodyXhtml: `${heading}\n${mdToXhtml(art.body)}` });
      } catch {
        missingSlugs.push(slug);
        chapters.push({ id, fileName, title: ch.title, bodyXhtml: `${heading}\n<p>（本章の素材を取得できませんでした: ${escapeText(slug)}）</p>` });
      }
      continue;
    }
    // ranking source (S2/S4 データブック型): rankingKeys から R2 観測値でランキング章を生成する。
    if (ch.source === "ranking" && ch.rankingKeys && ch.rankingKeys.length > 0) {
      const limit = opts.rankingLimit ?? 24;
      const sections = await buildRankingSections(ch.rankingKeys, limit, {
        highlightRegionLabel: ch.highlightRegionLabel,
        highlightCodes: ch.highlightCodes,
      });
      // 導入 (章見出し + リード)
      chapters.push({
        id,
        fileName,
        title: ch.title,
        bodyXhtml: `${heading}\n<p>${escapeText(ch.title)}に関する主要な統計を、上位5県・下位5県のランキングで見ていきます。数値はすべて e-Stat（政府統計の総合窓口）掲載の政府統計から取得し、基準年をそろえて整理したものです。</p>`,
      });
      for (const sec of sections) {
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
      if (sections.length === 0) missingSlugs.push(`${ch.title}(ranking:データ取得0)`);
      continue;
    }
    // rankingKeys 未指定の ranking 章はプレースホルダ。
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
    } catch (e) {
      // カバー失敗は EPUB 生成を止めない (KDP の Cover Creator で作れる)。
      console.warn(`  ⚠ カバー生成に失敗 (続行): ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const totalBody = freshChars + blogChars;
  const freshRatio = totalBody > 0 ? freshChars / totalBody : 0;
  const freshRatioOk = freshRatio >= FRESH_RATIO_MIN;

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
    renderReadiness(book, chapters.length, images.length, missingSlugs, { freshChars, blogChars, freshRatio, freshRatioOk }),
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
  };
}

function renderReadiness(
  book: KindleBook,
  chapterCount: number,
  imageCount: number,
  missing: readonly string[],
  ratio: { freshChars: number; blogChars: number; freshRatio: number; freshRatioOk: boolean },
): string {
  const pct = (ratio.freshRatio * 100).toFixed(2);
  const ratioLine = ratio.freshRatioOk
    ? `- 書き下ろし比率: ${pct}%（fresh ${ratio.freshChars} / blog ${ratio.blogChars}）✅ 30% 以上`
    : `- 書き下ろし比率: ${pct}%（fresh ${ratio.freshChars} / blog ${ratio.blogChars}）⚠️ **30% 未満 — このままの KDP 出品は非推奨**（Web 公開記事の割合が高く、KDP の「Web で無料入手可能なコンテンツ」規定で却下されうる。書き下ろし章を増やしてから出品する）`;
  return `# ${book.id} 出品前チェック (KDP・人間工程)

- 書名: ${book.title}${book.subtitle ? ` / ${book.subtitle}` : ""}
- 価格: ¥${book.priceYen}（KDP 電子・印税 70% 帯は ¥250-1,250）
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

KDP のアップロードは 2FA・税務/銀行情報を扱うため自動化しない。
kdp.amazon.com にログイン → 「電子書籍または有料マンガ」→ book.epub をアップロード → 表紙 → 価格 → 出版。
`;
}
