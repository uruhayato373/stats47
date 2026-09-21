/**
 * 生成済み EPUB の本文不変量 (verify-epub の第 ③ 層)。
 *
 * ★なぜ要るか (2026-09-19 の全 32 冊監査)
 *   epubcheck (仕様) とレイアウト不変量は通るのに、本文には Web 記事の名残 (「この記事」)、
 *   暦年指標に「年度」を混ぜた文、率系指標に「（人）」の単位、他冊と同一のランキング章
 *   (481 章中 177 章・71 指標が 2 冊以上に載る) が残っていた。どれも XHTML の文字列だけで決定的に数えられる。
 *   意味的な正しさ (分母・因果) は critic の領分で、ここでは扱わない。
 */

export interface ChapterText {
  readonly fileName: string;
  readonly title: string;
  /** タグを落とした本文 (見出し含む)。 */
  readonly text: string;
  /** ランキング章 (図 1 枚 + 集計文) か。冊間重複の対象。 */
  readonly isRanking: boolean;
}

export interface ContentFinding {
  readonly level: "error" | "warn";
  readonly code: string;
  readonly msg: string;
}

/** XHTML 1 章を検査用テキストに落とす。 */
export function chapterTextFromXhtml(fileName: string, xhtml: string): ChapterText {
  const title = (xhtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "").replace(/<[^>]+>/g, "").trim();
  const text = xhtml
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<\/(p|h[1-6]|li|figcaption|div|section|tr)>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
  const imgs = (xhtml.match(/<img /g) ?? []).length;
  // 図 1 枚 + 先頭の集計文 (v1 は解説文、v3 は全県表を続ける。どちらも対象)。
  const isRanking = imgs === 1 && /(1位は|最大値は)/.test(text);
  return { fileName, title, text, isRanking };
}

const WEB_SELF_REFERENCE = /この記事|本記事|関連記事|あわせて読みたい|詳しくはこちら|ページ下部|サイト内リンク/g;
/** 率・割合・指数・係数の指標に付くとおかしい単位。 */
const COUNT_UNITS = new Set(["人", "円", "件", "世帯", "戸"]);

/** 1 冊分の本文不変量。 */
export function checkBookContent(chapters: readonly ChapterText[]): ContentFinding[] {
  const f: ContentFinding[] = [];
  const stems = new Map<string, string[]>();
  for (const ch of chapters) {
    const web = ch.text.match(WEB_SELF_REFERENCE) ?? [];
    if (web.length > 0) {
      f.push({
        level: "error",
        code: "web-self-reference",
        msg: `${ch.fileName}: Web 記事の名残 ${[...new Set(web)].join("/")} × ${web.length}`,
      });
    }
    // 同じ年に「年」と「年度」の両方を当てている章 (暦年指標に年度を混ぜる)。
    const years = new Set((ch.text.match(/(\d{4})年(?!度)/g) ?? []).map((s) => s.slice(0, 4)));
    const nendo = new Set((ch.text.match(/(\d{4})年度/g) ?? []).map((s) => s.slice(0, 4)));
    const both = [...years].filter((y) => nendo.has(y));
    if (both.length > 0) {
      f.push({ level: "warn", code: "year-nendo-mix", msg: `${ch.fileName}: ${both.join(",")} が「年」と「年度」の両方で書かれている` });
    }
    if (ch.isRanking) {
      const lead = ch.text.split("\n").find((l) => /(1位は|最大値は)/.test(l)) ?? "";
      const unit = lead.match(/(?:1位は|最大値は)[^、。]*?で[\d,.]+（([^）]*)）/)?.[1];
      if (unit && /率|割合|指数|係数|比率/.test(ch.title) && COUNT_UNITS.has(unit)) {
        f.push({ level: "error", code: "rate-with-count-unit", msg: `${ch.fileName}: 率系の指標「${ch.title}」に単位（${unit}）` });
      }
      const stem = ch.title.replace(/（[^）]*）/g, "").replace(/〔[^〕]*〕/g, "").replace(/[\s・]/g, "");
      stems.set(stem, [...(stems.get(stem) ?? []), ch.title]);
    }
  }
  for (const [, titles] of stems) {
    if (titles.length > 1) {
      f.push({ level: "warn", code: "same-indicator-twice", msg: `同じ指標が ${titles.length} 章: ${titles.join(" / ")}` });
    }
  }
  return f;
}

/** 複数冊をまとめて検査したときの冊間重複。 */
export function checkCrossBookDuplicates(
  books: ReadonlyMap<string, readonly ChapterText[]>,
): ContentFinding[] {
  if (books.size < 2) return [];
  const titleOwners = new Map<string, Set<string>>();
  const paraOwners = new Map<string, Set<string>>();
  for (const [id, chapters] of books) {
    for (const ch of chapters) {
      if (ch.isRanking) titleOwners.set(ch.title, new Set([...(titleOwners.get(ch.title) ?? []), id]));
      for (const p of ch.text.split("\n")) {
        const s = p.trim();
        if (s.length < 60) continue;
        paraOwners.set(s, new Set([...(paraOwners.get(s) ?? []), id]));
      }
    }
  }
  const f: ContentFinding[] = [];
  const dupTitles = [...titleOwners.entries()].filter(([, ids]) => ids.size > 1);
  if (dupTitles.length > 0) {
    const total = [...titleOwners.values()].reduce((a, ids) => a + ids.size, 0);
    const shared = dupTitles.reduce((a, [, ids]) => a + ids.size, 0);
    f.push({
      level: "warn",
      code: "cross-book-ranking-chapter",
      msg: `ランキング章 ${total} のうち ${shared} が他冊と同一指標 (${dupTitles.length} 指標)。例: ${dupTitles
        .slice(0, 3)
        .map(([t, ids]) => `${t.slice(0, 20)}=${[...ids].join(",")}`)
        .join(" / ")}`,
    });
  }
  const dupParas = [...paraOwners.values()].filter((ids) => ids.size > 1).length;
  if (dupParas > 0) {
    f.push({ level: "warn", code: "cross-book-paragraph", msg: `60 字以上の同一段落が 2 冊以上に ${dupParas} 件` });
  }
  return f;
}
