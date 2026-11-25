/**
 * 書き下ろし原稿 (1県1章の本) の注記と年の書き分けを決定的に数える (KINDLE-FRESH-CAUTION-CHECK-01・2026-11-24)。
 *
 * なぜ要るか: K-S3-08 の意味レビュー (2026-11-14) で、ブリーフの「⚠ の付いた指標は、その注意を本文にも書く」が
 * 章によって守られず (持ち家比率・物価・医師数の注記の抜け 6 件)、本文の「2022年」と「2022年度」の書き分けも
 * 機械では見ていなかった。どちらも文字列で数えられるので、scripts/verify-fresh.mts が error にする。
 *
 * 1. 注記の要点: 指標定義の note・description から、本文に必ず要る語を決める (下の CAUTION_RULES)。
 *    指標名 (title) が出てくる章は、その章の中に要る語を書く。はじめに (00-) と おわりに (90-) は
 *    第1章 (10-how-to-read.md) にまとめた注記に頼ってよい (読み方の章が注記の置き場)。
 * 2. 年の書き分け: 指標名のすぐ前後の年 (「2022年度の有効求人倍率」「持ち家比率（2023年）」「持ち家比率は2023年に」)
 *    を、指標定義の yearFormat (fiscal なら「年度」、ほかは「年」。全県表 full-tables.ts と執筆ブリーフも同じ決め方) と
 *    照らす。R2 の yearName は暦年の指標でも「年度」のことがあるので照らし先にしない (YEARFORMAT-REFLECT-01)。
 */

/** 検査が読む指標定義の項目。 */
export interface CautionMetric {
  readonly key: string;
  readonly title?: string;
  readonly note?: string;
  readonly description?: string;
  readonly yearFormat?: string;
}

export interface ManuscriptFile {
  /** ファイル名 (例 "21-fukuoka.md") */
  readonly file: string;
  readonly text: string;
}

export interface CautionFinding {
  readonly file: string;
  readonly level: "error";
  readonly code: "caution-missing" | "year-format";
  readonly msg: string;
}

/**
 * 指標定義から本文に要る語を決める規則。定義の文に印の語があれば、本文にも同じ語を要求する。
 * 規則を増やすときは、誤検知が無いことを既存の原稿で確かめてから足す。
 */
const CAUTION_RULES: readonly { readonly when: RegExp; readonly required: string; readonly why: string }[] = [
  // 家計調査の値 (例 消費支出: 「家計調査の都道府県庁所在市の値で、県全体の値ではありません。」)。
  // 物価の地域差指数の note は「県庁所在市だけでなく」と書くので「県庁所在市の値」では当たらない
  { when: /県庁所在市の値/, required: "県庁所在市", why: "県庁所在市の値で県全域の値ではない" },
  // 物価の地域差指数の総合・住居 (「持家の帰属家賃」は含まない)
  { when: /帰属家賃/, required: "帰属家賃", why: "持家の帰属家賃を含まない" },
];

/** 第1章 (読み方) の注記に頼ってよい章。 */
const RELIES_ON_HOW_TO_READ = /^(00|90)-/;
const HOW_TO_READ = "10-how-to-read.md";

/** 指標ごとに本文に要る語。要る語の無い指標は含めない。 */
export function requiredCautionTerms(metric: CautionMetric): { term: string; why: string }[] {
  const text = `${metric.note ?? ""}\n${metric.description ?? ""}`;
  return CAUTION_RULES.filter((r) => r.when.test(text)).map((r) => ({ term: r.required, why: r.why }));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 1 冊の書き下ろし原稿から、注記の抜けと年の書き分けの食い違いを数える。 */
export function checkFreshCautions(
  files: readonly ManuscriptFile[],
  metrics: readonly CautionMetric[],
): CautionFinding[] {
  const out: CautionFinding[] = [];
  const howToRead = files.find((f) => f.file === HOW_TO_READ)?.text ?? "";

  // 同じ題の指標が複数あるときは、要る語は和集合、年の書き方はそろっているときだけ照らす
  const byTitle = new Map<string, { terms: Map<string, string>; yearFormats: Set<string> }>();
  for (const m of metrics) {
    const title = m.title?.trim();
    if (!title) continue;
    const entry = byTitle.get(title) ?? { terms: new Map<string, string>(), yearFormats: new Set<string>() };
    for (const t of requiredCautionTerms(m)) entry.terms.set(t.term, t.why);
    entry.yearFormats.add(m.yearFormat === "fiscal" ? "fiscal" : "calendar");
    byTitle.set(title, entry);
  }

  for (const f of files) {
    for (const [title, { terms, yearFormats }] of byTitle) {
      if (!f.text.includes(title)) continue;

      for (const [term, why] of terms) {
        if (f.text.includes(term)) continue;
        if (RELIES_ON_HOW_TO_READ.test(f.file) && howToRead.includes(term)) continue;
        out.push({
          file: f.file,
          level: "error",
          code: "caution-missing",
          msg: `「${title}」を書いているのに注記の要点「${term}」が無い (${why})`,
        });
      }

      if (yearFormats.size !== 1) continue;
      const expectFiscal = yearFormats.has("fiscal");
      const t = escapeRegExp(title);
      const near = [
        ...f.text.matchAll(new RegExp(`(\\d{4})年(度?)の${t}`, "g")),
        ...f.text.matchAll(new RegExp(`${t}[（(]?(?:は|が|も)?(\\d{4})年(度?)`, "g")),
      ];
      for (const m of near) {
        const isFiscal = m[2] === "度";
        if (isFiscal === expectFiscal) continue;
        out.push({
          file: f.file,
          level: "error",
          code: "year-format",
          msg: `「${m[0]}」— 指標定義の yearFormat は ${expectFiscal ? "fiscal (年度)" : "暦年 (年)"}`,
        });
      }
    }
  }
  return out;
}

/** 同じ本の中で、別々の章に同じ文が現れた組。 */
export interface DuplicateSentence {
  readonly sentence: string;
  readonly files: readonly string[];
}

/** これより短い文は定型の相づち (「次に見ます。」など) として数えない。 */
const DUP_MIN_CHARS = 30;

/**
 * 1 冊の中で、2 つ以上の章に一字一句同じ文があるかを数える (KINDLE-FRESH-CAUTION-CHECK-01)。
 * ブリーフの「⚠ の注意を本文にも書く」は、県の章ごとに同じ注記の文を生みやすい。第1章にまとめた注記は
 * 県の章で省略してよい (ブリーフ側に書いた)。見出し行と表の行は文として数えない。
 */
export function findDuplicateSentences(files: readonly ManuscriptFile[]): DuplicateSentence[] {
  const seen = new Map<string, Set<string>>();
  for (const f of files) {
    const prose = f.text
      .split("\n")
      .filter((line) => !/^\s*(#|\||[-*]\s*\|)/.test(line))
      .join("\n");
    for (const raw of prose.split(/(?<=。)/)) {
      const sentence = raw.replace(/\s+/g, "");
      if (sentence.length < DUP_MIN_CHARS) continue;
      const set = seen.get(sentence) ?? new Set<string>();
      set.add(f.file);
      seen.set(sentence, set);
    }
  }
  return [...seen]
    .filter(([, set]) => set.size >= 2)
    .map(([sentence, set]) => ({ sentence, files: [...set] }));
}
