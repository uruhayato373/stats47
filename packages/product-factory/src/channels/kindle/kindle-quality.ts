/**
 * 既刊 Kindle の中身の機械の検査 (KINDLE-QUALITY-LOOP-01 の 1 段目。トークンを使わない)。
 * 入稿版 EPUB を章ごとに数え、基準を外れた章に印 (flag) を付ける。印の付いた章だけを、
 * 2 段目 (画面の撮影とエージェントの評価) と 3 段目 (NotebookLM の通読) へ回す。
 *
 * 数え方は epub-inspect.ts (管理画面の本文画面と共通)。ここは判定と集計だけを持つ純関数。
 */
import type { EpubChapter, FullTableIndicator } from "./epub-inspect";

/** 図の無い章を「長い」とみなす文字数。序章・あとがきの短いページは対象にしない。 */
export const LONG_CHAPTER_CHARS = 1000;

export type QualityFlagCode =
  /** 1,000 字以上あって図が 1 枚も無い章 (図を足す候補) */
  | "long-chapter-without-figure"
  /** 図のすぐ後ろが段落でない図がある章 (図の読み方を本文で補えていない) */
  | "figure-without-text"
  /** 図はあるが全 47 県の表が無い章 (全県表を付ける候補。付けるかは Previewer で確かめてから決める) */
  | "data-chapter-without-full-table"
  /** ランキング章の図を svg-builder で直接描いている (ブログ・SNS の共通の型を通らない) */
  | "figure-outside-shared-template"
  /** 本からサイトへのリンクが 1 つも無い */
  | "no-site-link"
  /** サイトへのリンクに UTM が付いていない (config/inbound-utm.mjs) */
  | "site-link-without-utm";

export interface QualityFlag {
  readonly code: QualityFlagCode;
  readonly chapterId?: string;
  readonly chapterTitle?: string;
  readonly value: number;
}

export type QualityChapter = Omit<EpubChapter, "body" | "href">;

export interface BookQuality {
  readonly id: string;
  readonly status: "measured" | "epub-missing";
  readonly title: string | null;
  readonly epubPath: string | null;
  readonly epubSha256: string | null;
  readonly modified: string | null;
  readonly chars: number | null;
  readonly figures: number | null;
  readonly figuresPer10kChars: number | null;
  readonly figuresWithoutText: number | null;
  readonly fullTables: number | null;
  /** 全県表の見出しから読んだ指標・年・単位 (KDP の紹介文の【全県の値を表で収録している指標】に入れる) */
  readonly fullTableIndicators: readonly FullTableIndicator[] | null;
  /** 家計調査の値が県庁所在市のものだという注記が本にあるか (紹介文の【データの範囲】に入れる) */
  readonly householdCityValues: boolean | null;
  readonly siteLinks: number | null;
  readonly siteLinksWithUtm: number | null;
  readonly flags: readonly QualityFlag[];
  readonly chapters: readonly QualityChapter[];
}

export function chapterFlags(chapter: QualityChapter): QualityFlag[] {
  const at = { chapterId: chapter.id, chapterTitle: chapter.title };
  const flags: QualityFlag[] = [];
  if (chapter.figures === 0 && chapter.chars >= LONG_CHAPTER_CHARS) {
    flags.push({ code: "long-chapter-without-figure", ...at, value: chapter.chars });
  }
  if (chapter.figuresWithoutText > 0) flags.push({ code: "figure-without-text", ...at, value: chapter.figuresWithoutText });
  if (chapter.figures > 0 && chapter.fullTables === 0) {
    flags.push({ code: "data-chapter-without-full-table", ...at, value: chapter.figures });
  }
  if (chapter.rankingDatabookFigures > 0) {
    flags.push({ code: "figure-outside-shared-template", ...at, value: chapter.rankingDatabookFigures });
  }
  return flags;
}

/** 1 冊分の集計。EPUB が無い本は 0 で埋めず epub-missing にする (欠測を 0 にしない)。 */
export function bookQuality(input: {
  readonly id: string;
  readonly epubPath: string | null;
  readonly epubSha256: string | null;
  readonly parsed: { readonly title: string; readonly modified: string | null; readonly chapters: readonly EpubChapter[] } | null;
}): BookQuality {
  if (!input.parsed) {
    return {
      id: input.id, status: "epub-missing", title: null, epubPath: input.epubPath, epubSha256: null, modified: null,
      chars: null, figures: null, figuresPer10kChars: null, figuresWithoutText: null, fullTables: null,
      fullTableIndicators: null, householdCityValues: null,
      siteLinks: null, siteLinksWithUtm: null, flags: [], chapters: [],
    };
  }
  const chapters: QualityChapter[] = input.parsed.chapters.map(({ body: _body, href: _href, ...chapter }) => chapter);
  const sum = (key: "chars" | "figures" | "figuresWithoutText" | "fullTables" | "siteLinks" | "siteLinksWithUtm") =>
    chapters.reduce((total, chapter) => total + chapter[key], 0);
  const chars = sum("chars");
  const figures = sum("figures");
  const siteLinks = sum("siteLinks");
  const siteLinksWithUtm = sum("siteLinksWithUtm");
  const flags = chapters.flatMap(chapterFlags);
  if (siteLinks === 0) flags.push({ code: "no-site-link", value: 0 });
  else if (siteLinksWithUtm < siteLinks) flags.push({ code: "site-link-without-utm", value: siteLinks - siteLinksWithUtm });
  return {
    id: input.id,
    status: "measured",
    title: input.parsed.title || null,
    epubPath: input.epubPath,
    epubSha256: input.epubSha256,
    modified: input.parsed.modified,
    chars,
    figures,
    figuresPer10kChars: chars ? Math.round((figures / chars) * 100000) / 10 : null,
    figuresWithoutText: sum("figuresWithoutText"),
    fullTables: sum("fullTables"),
    fullTableIndicators: chapters.flatMap((chapter) => chapter.fullTableIndicators),
    householdCityValues: chapters.some((chapter) => chapter.householdCityNotes > 0),
    siteLinks,
    siteLinksWithUtm,
    flags,
    chapters,
  };
}

/** 全冊のまとめ。基準の本 (売れた K-S1-02) と並べて読めるよう、印の数を冊ごとと種類ごとに出す。 */
export function qualitySummary(books: readonly BookQuality[], baselineBookId: string) {
  const byCode: Partial<Record<QualityFlagCode, number>> = {};
  for (const flag of books.flatMap((book) => book.flags)) byCode[flag.code] = (byCode[flag.code] ?? 0) + 1;
  const baseline = books.find((book) => book.id === baselineBookId && book.status === "measured") ?? null;
  return {
    books: books.length,
    measured: books.filter((book) => book.status === "measured").length,
    epubMissing: books.filter((book) => book.status === "epub-missing").map((book) => book.id),
    flagsByCode: byCode,
    baseline: baseline
      ? { id: baseline.id, figuresPer10kChars: baseline.figuresPer10kChars, figuresWithoutText: baseline.figuresWithoutText, fullTables: baseline.fullTables }
      : null,
  };
}
