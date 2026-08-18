/**
 * `seoTitle` / `seoDescription` の事実主張を実データと突合する純関数。
 *
 * ## なぜ要るか
 *
 * SEO 文字列はランキングページの `<title>` と `<meta name="description">` として
 * **そのまま配信される**。決定的に生成されておらず照合もされていなかったため、
 * 実データと食い違う数値がそのまま検索結果に出ていた。
 *
 * 2026-08-03 に離婚率の説明文「沖縄は2015年の6.1から急落」の 6.1 が**婚姻率**の系列
 * だったことが発覚し (`IND-DATA-CORRUPTION-01`)、2026-08-17 の抽出実測で
 * **公開中 240 件の 3.3% (8 件)** が 1 位県・値・倍率のいずれかを取り違えていた。
 *
 * ## 確実に違反と言えるものだけを見る
 *
 * 誤検知を出すゲートは運用で無効化されるので、判定は次の 3 つに絞る。どれも
 * 「その年の観測値」から決定的に導ける:
 *
 * - **順位県**: 「1位◯◯県」「最下位◯◯県」の県名が実データの首位/最下位と一致するか
 * - **値**: その県に添えられた数値が実測値と一致するか (相対 2%。丸め表記を吸収)
 * - **倍率**: 「N倍」が最大 / 最小と一致するか (相対 5%)
 *
 * 散文の一般的な数値 (「全国平均を上回る県は21」等) は見ない。文脈が閉じており
 * 何と比べるべきかが機械には決まらないため。値の網羅的な照合は
 * `.claude/scripts/ai-content/lib/number-audit.mjs` が ai-content 側で担う。
 *
 * ## 年は 2 通りの見方をする
 *
 * `config.years` の宣言範囲外は**確実な誤り**。加えて「宣言範囲内だが観測値が無い年」も
 * 誤り (実測: `cook-annual-income` は 2010-2023 を宣言しているが R2 は 2022 までしか無く、
 * seoTitle は 2023 年を名乗っていた)。前者は config だけで、後者は実データで判定する。
 *
 * I/O は持たない (呼び出し側が R2 から観測値を渡す)。
 * テスト: `src/__tests__/seo-meta-facts.test.ts`
 *
 * 正典: `.claude/todo/backlog.md` の `SEO-META-FACTUAL-GATE-01`
 */

import { isScalePrefixPartOfUnit, scalePrefixMultiplier } from "./unit/unit-semantics";

/** 順位の主張 1 件 */
export interface RankClaim {
  readonly role: "top" | "bottom";
  readonly areaName: string;
  /** 県名に添えられていた数値。無ければ null */
  readonly value: number | null;
  /** 元の表記 (報告用) */
  readonly raw: string;
}

export interface SeoClaims {
  readonly ranks: readonly RankClaim[];
  /** 「N倍」の主張。無ければ null */
  readonly ratio: number | null;
  /** 本文に現れた 4 桁年 (重複除去・出現順) */
  readonly years: readonly number[];
}

export interface SeoFactFinding {
  readonly kind:
    | "year-out-of-declared-range"
    | "year-not-in-data"
    | "rank-area-mismatch"
    | "rank-value-mismatch"
    | "ratio-mismatch";
  readonly detail: string;
}

/** 値の照合に使う相対誤差 (seoTitle は丸めた表記を書くため) */
export const VALUE_TOLERANCE = 0.02;
/** 倍率の照合に使う相対誤差 (最大/最小それぞれの丸めが乗るので緩める) */
export const RATIO_TOLERANCE = 0.05;

function toNumber(raw: string): number | null {
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * 数値に添えられた桁の接頭辞 (`5,090億円` の「億」) を倍率に直す。
 *
 * **自前のスケール表を持たない** — 正典は `unit/unit-semantics.ts`
 * (`.claude/rules/unit-semantics-standards.md` §3 の禁止事項)。
 *
 * 「千」がスケール接頭辞か単位そのものかは SSOT の unit でしか判別できない。
 * `unit="千円"` に対する「13,326千円」を ×1000 すると全件不一致になる
 * (2026-08-12 に地図照合で実際に起きた)。判別できない場合は倍率を掛けず
 * `null` を返し、**呼び出し側に値の照合を諦めさせる** (誤検知を出すより見送る)。
 */
function scaleMultiplier(prefix: string | undefined, ssotUnit: string | null | undefined): number | null {
  if (!prefix) return 1;
  if (isScalePrefixPartOfUnit(prefix, ssotUnit)) return 1;
  return scalePrefixMultiplier(prefix);
}

/** SCALE_PREFIX の語彙 (長い順)。正典の表に無い接頭辞は拾わない */
const SCALE_TOKEN = "兆|千億|百億|十億|億|千万|百万|十万|万|千|百|十";

/** 「北海道」と「北海」を同一視する (表記ゆれで誤検知しない) */
function normalizeAreaName(name: string): string {
  return name.trim().replace(/[都道府県]$/, "");
}

function near(a: number, b: number, tol: number): boolean {
  return Math.abs(a - b) <= Math.max(Math.abs(b), 1) * tol;
}

/**
 * SEO 文字列から事実主張を抜き出す。
 *
 * 括弧つき (`1位福島県（25,226ｈａ）`) と括弧なし (`1位宮崎県8.2‰`) の両方が実在するので
 * 括弧を任意にする。順位ラベルと県名の間の助詞 (`1位は北海道`) も許す。
 *
 * 県名は**漢字のみ + 都/道/府/県**に限る。ひらがなを許すと「1位は北海道」の助詞まで
 * 県名に食い込み、実データと一致しているのに不一致として報告してしまう。47 県すべて
 * 漢字表記なので、絞っても取りこぼさない。
 */
const AREA_NAME = /[一-鿿]{1,4}[都道府県]/;

export function extractSeoClaims(text: string, ssotUnit?: string | null): SeoClaims {
  const s = String(text ?? "");
  const ranks: RankClaim[] = [];
  for (const m of s.matchAll(
    new RegExp(
      `(1位|最下位)\\s*(?:は|が|の)?\\s*(${AREA_NAME.source})\\s*[（(]?\\s*([\\d,]+(?:\\.\\d+)?)?\\s*(${SCALE_TOKEN})?`,
      "g",
    ),
  )) {
    // 「47都道府県」等の総称は県ではない (数字は文字クラス外なので「都道府県」だけが残る)
    if (m[2] === "都道府県") continue;
    const base = m[3] ? toNumber(m[3]) : null;
    const mult = base === null ? null : scaleMultiplier(m[4], ssotUnit);
    ranks.push({
      role: m[1] === "1位" ? "top" : "bottom",
      areaName: m[2],
      value: base === null || mult === null ? null : base * mult,
      raw: m[0].trim(),
    });
  }
  // 倍率には桁の接頭辞を付けない (「1741.3倍」)。単位を持たない無次元量なので接頭辞を読まない
  const ratioMatch = s.match(/([\d,]+(?:\.\d+)?)\s*倍/);
  const years = [...new Set([...s.matchAll(/(\d{4})\s*年/g)].map((m) => Number(m[1])))];
  return {
    ranks,
    ratio: ratioMatch ? toNumber(ratioMatch[1]) : null,
    years,
  };
}

/**
 * 主張を実データと突合する。
 *
 * @param claims `extractSeoClaims` の結果
 * @param truth 主張している年 (無ければ最新年) の観測値。`null` なら値の照合はしない
 * @param declaredYears config の `years` から展開した年の集合。空なら年の範囲検査をしない
 * @param dataYears 観測値が実在する年の集合。空なら「データに無い年」の検査をしない
 */
export function checkSeoFacts(params: {
  readonly claims: SeoClaims;
  readonly truth: {
    readonly year: string;
    readonly top: { areaName: string; value: number };
    readonly bottom: { areaName: string; value: number };
  } | null;
  readonly declaredYears?: ReadonlySet<number>;
  readonly dataYears?: ReadonlySet<string>;
}): SeoFactFinding[] {
  const { claims, truth, declaredYears, dataYears } = params;
  const out: SeoFactFinding[] = [];

  for (const y of claims.years) {
    if (declaredYears && declaredYears.size > 0 && !declaredYears.has(y)) {
      out.push({
        kind: "year-out-of-declared-range",
        detail: `主張 ${y} 年は config.years の宣言範囲外`,
      });
      continue; // 宣言範囲外なら観測値にも無いので二重に報告しない
    }
    if (dataYears && dataYears.size > 0 && !dataYears.has(String(y))) {
      out.push({
        kind: "year-not-in-data",
        detail: `主張 ${y} 年の観測値が無い`,
      });
    }
  }

  if (!truth) return out;

  for (const c of claims.ranks) {
    const t = c.role === "top" ? truth.top : truth.bottom;
    const label = c.role === "top" ? "1位" : "最下位";
    if (normalizeAreaName(c.areaName) !== normalizeAreaName(t.areaName)) {
      out.push({
        kind: "rank-area-mismatch",
        detail: `${label} 主張 ${c.areaName} / 実 ${t.areaName} (${truth.year}年)`,
      });
      continue; // 県が違えば値の一致は意味がない
    }
    if (c.value !== null && !near(c.value, t.value, VALUE_TOLERANCE)) {
      out.push({
        kind: "rank-value-mismatch",
        detail: `${label} ${c.areaName} 主張 ${c.value} / 実 ${t.value} (${truth.year}年)`,
      });
    }
  }

  // 最小が 0 以下なら倍率は定義できない (「∞倍」を主張と突き合わせない)
  if (claims.ratio !== null && truth.bottom.value > 0) {
    const real = truth.top.value / truth.bottom.value;
    if (!near(claims.ratio, real, RATIO_TOLERANCE)) {
      out.push({
        kind: "ratio-mismatch",
        detail: `主張 ${claims.ratio}倍 / 実 ${real.toFixed(1)}倍 (${truth.year}年)`,
      });
    }
  }

  return out;
}
