/**
 * ranking 章の本文を R2 の ai-content から組み立てる (書籍の「中身」の中核)。
 *
 * ★なぜ要るか (2026-08-12 の実測)
 *   S2/S3/S4 の 20 冊は 1 章が「1位は◯◯で△△、最下位は…」の定型 1 文 (144〜200 字) だけで、
 *   総字数 4,313〜6,001 字しかなかった。読者に売れる状態ではない。
 *   一方 R2 `app/ranking/<key>/ai-content.json` には、決定的ゲート (数値照合・NG語・推測表現) と
 *   critic を通過した解説が 1 キーあたり ~4,700 字ある。これを書籍本文へ再利用する。
 *
 * ★捏造を通さないための設計
 *   ai-content は生成時に監査済みだが、**採用前にもう一度ここで数値を突合する**。
 *   監査は `.claude/scripts/ai-content/lib/number-audit.mjs` を直接 import して
 *   ai-content 側とまったく同じ判定を使う (書籍側に別実装を作らない = 二重実装の禁止)。
 *   判定は**フィールド単位**で、落ちたフィールドだけ捨てる。キーごと捨てると使える解説まで失う。
 *
 * ★再利用側にカウントする
 *   ai-content はサイトで公開済みの Web コンテンツなので、KDP の「Web 無料公開コンテンツ」規定上
 *   書き下ろしではない。呼び出し側は blogChars に加算する (build-book.ts の扱いを変えない)。
 */
import {
  buildValueContext,
  findOutOfRangeNumbers,
} from "../../../../../.claude/scripts/ai-content/lib/number-audit.mjs";
import { convertKanjiNumerals, extractKanjiClaims } from "../../text/kanji-numeral";

const R2 = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";

/** ai-content.json の生の形 (faq / prefectureCommentary は **JSON 文字列**で入っている)。 */
interface RawAiContent {
  readonly rankingKey?: string;
  readonly yearCode?: string;
  readonly insights?: string;
  readonly regionalAnalysis?: string;
  readonly faq?: string;
  readonly prefectureCommentary?: string;
}

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

export interface PrefCommentary {
  readonly areaCode: string;
  readonly areaName: string;
  readonly rank?: number;
  readonly value?: number;
  readonly commentary: string;
}

export interface AiContent {
  readonly rankingKey: string;
  readonly yearCode?: string;
  readonly insights?: string;
  readonly regionalAnalysis?: string;
  readonly faq: readonly FaqItem[];
  readonly prefectureCommentary: readonly PrefCommentary[];
}

/** 二重エンコードされた JSON 文字列を安全に開く。 */
function parseNested<T>(raw: unknown, pick: (o: Record<string, unknown>) => T | undefined): T | undefined {
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    return pick(o);
  } catch {
    return undefined;
  }
}

/** R2 から 1 ranking の ai-content を取得する。無ければ null (呼び出し側は定型文だけで組む)。 */
export async function fetchRankingAiContent(rankingKey: string): Promise<AiContent | null> {
  let raw: RawAiContent;
  try {
    const res = await fetch(`${R2}/app/ranking/${rankingKey}/ai-content.json`);
    if (!res.ok) return null;
    raw = (await res.json()) as RawAiContent;
  } catch {
    return null;
  }
  const faq =
    parseNested<FaqItem[]>(raw.faq, (o) => (Array.isArray(o.items) ? (o.items as FaqItem[]) : undefined)) ?? [];
  const pref =
    parseNested<PrefCommentary[]>(raw.prefectureCommentary, (o) =>
      Array.isArray(o.items) ? (o.items as PrefCommentary[]) : undefined,
    ) ?? [];
  return {
    rankingKey,
    yearCode: raw.yearCode,
    insights: typeof raw.insights === "string" ? raw.insights : undefined,
    regionalAnalysis: typeof raw.regionalAnalysis === "string" ? raw.regionalAnalysis : undefined,
    faq: faq.filter((f) => f && typeof f.question === "string" && typeof f.answer === "string"),
    prefectureCommentary: pref.filter((p) => p && typeof p.commentary === "string"),
  };
}

/** 採用判定に使う観測値の文脈 (values.json の 1 partition)。 */
export interface ValueRow {
  readonly areaName?: string;
  readonly areaCode?: string;
  readonly value: number;
  readonly rank?: number;
}

export interface FieldGateInput {
  readonly values: readonly ValueRow[];
  readonly unit?: string;
  readonly yearCode?: string;
}

export interface FieldVerdict {
  readonly ok: boolean;
  /** 落ちた理由 (採用しなかった根拠を残す。黙って捨てない)。 */
  readonly reason?: string;
  /**
   * 採用するテキスト。漢数字は算用数字へ**変換して**採用する
   * (書籍は算用数字に統一する規約だが、変換できるものを捨てる理由はない)。
   */
  readonly text?: string;
}

/**
 * テキスト 1 フィールドを採用してよいか判定する。
 *
 * ai-content 側の決定的ゲートと**同じ lib・同じ許容誤差**を使う。ここで独自の閾値を作ると
 * 「サイトでは通るが書籍では落ちる」ような二重基準が生まれる。
 */
export function judgeField(raw: string | undefined, gate: FieldGateInput): FieldVerdict {
  if (!raw || raw.trim().length === 0) return { ok: false, reason: "empty" };

  // 漢数字は**変換してから**判定する。書籍は算用数字に統一する規約だが、
  // 変換できるものを捨てると使える解説を失う (実測: 製造品出荷額の regionalAnalysis が
  // 漢数字 6 件で丸ごと落ちていた)。変換後に残るものだけを不採用にする。
  const text = convertKanjiNumerals(raw).text;
  const kanjiLeft = extractKanjiClaims(text).filter(
    (c) => c.unit === "円" || c.unit === "位" || c.unit === "倍" || c.unit === "％",
  );
  if (kanjiLeft.length > 0) return { ok: false, reason: `変換できない漢数字 ${kanjiLeft.length} 件` };

  const ctx = buildValueContext({
    values: gate.values as ValueRow[],
    unit: gate.unit,
    yearCode: gate.yearCode,
  });
  // ctx が作れない (観測値なし) ときは fail-open。ai-content 側の判定と同じ扱い。
  if (!ctx) return { ok: true, text };

  // ★変換後のテキストで照合する (漢数字のままだと数値として抽出されず素通りする)。
  const bad = findOutOfRangeNumbers(text, ctx);
  if (bad.length > 0) {
    return { ok: false, reason: `実データの範囲外の数値 ${bad.length} 件 (例: ${bad[0].raw})` };
  }
  return { ok: true, text };
}

/** FAQ のうち、1位/最下位をなぞるだけの問いを落とす (章冒頭の定型文と重複するため)。 */
export function isAnalyticalFaq(f: FaqItem): boolean {
  return !/(第?1位|最も多い|最も少ない|最下位).{0,12}(どこ|都道府県)/.test(f.question);
}

export interface ComposeInput {
  readonly ai: AiContent | null;
  readonly gate: FieldGateInput;
  /** S3 地域別: この地域の県コード (prefectureCommentary の抽出に使う)。 */
  readonly regionCodes?: readonly string[];
  /** S3 地域別: regionalAnalysis から抜き出す地方ブロックの見出し語。 */
  readonly regionBlockLabel?: string;
  /** 採用する FAQ の最大数。 */
  readonly faqLimit?: number;
}

export interface ComposeResult {
  readonly md: string;
  /** 採用したフィールド (レポート用)。 */
  readonly used: readonly string[];
  /** 落としたフィールドと理由 (黙って捨てない)。 */
  readonly dropped: readonly { field: string; reason: string }[];
}

/**
 * `## 見出し` 区切りの markdown から、指定ラベルを含む節だけを抜き出す。
 * S3 で「北海道・東北」ブロックだけを採るのに使う。見つからなければ undefined。
 */
export function extractRegionBlock(md: string | undefined, label: string | undefined): string | undefined {
  if (!md || !label) return undefined;
  const blocks = md.split(/^##\s+/m).filter((b) => b.trim().length > 0);
  const hit = blocks.find((b) => b.split("\n")[0].includes(label));
  if (!hit) return undefined;
  const body = hit.split("\n").slice(1).join("\n").trim();
  return body.length > 0 ? body : undefined;
}

/**
 * ai-content から章本文 (markdown 断片) を組む。
 * 定型文・図は呼び出し側 (ranking-databook) が前後に付ける。
 */
export function composeChapterBody(input: ComposeInput): ComposeResult {
  const used: string[] = [];
  const dropped: { field: string; reason: string }[] = [];
  const parts: string[] = [];

  const take = (field: string, text: string | undefined, heading?: string): void => {
    const v = judgeField(text, input.gate);
    if (!v.ok || !v.text) {
      if (v.reason !== "empty") dropped.push({ field, reason: v.reason ?? "?" });
      return;
    }
    used.push(field);
    parts.push(heading ? `### ${heading}\n\n${v.text.trim()}` : v.text.trim());
  };

  const ai = input.ai;
  if (!ai) return { md: "", used, dropped };

  // 考察 — insights は `## 見出し` を含むので、書籍の見出し階層に合わせて 1 段下げる。
  if (ai.insights) {
    const v = judgeField(ai.insights, input.gate);
    if (v.ok && v.text) {
      used.push("insights");
      parts.push(v.text.replace(/^##\s+/gm, "### ").trim());
    } else if (v.reason !== "empty") {
      dropped.push({ field: "insights", reason: v.reason ?? "?" });
    }
  }

  // 地方ブロック別の傾向 — S3 は該当ブロックだけ、S2/S4 は全文。
  if (input.regionBlockLabel) {
    const block = extractRegionBlock(ai.regionalAnalysis, input.regionBlockLabel);
    take("regionalAnalysis(block)", block, `${input.regionBlockLabel}の傾向`);
  } else if (ai.regionalAnalysis) {
    const v = judgeField(ai.regionalAnalysis, input.gate);
    if (v.ok && v.text) {
      used.push("regionalAnalysis");
      parts.push(v.text.replace(/^##\s+/gm, "### ").trim());
    } else if (v.reason !== "empty") {
      dropped.push({ field: "regionalAnalysis", reason: v.reason ?? "?" });
    }
  }

  // 県別解説 — S3 は地域の県だけ。S2/S4 は使わない (47 県分は書籍の章には多すぎる)。
  if (input.regionCodes && input.regionCodes.length > 0 && ai.prefectureCommentary.length > 0) {
    const set = new Set(input.regionCodes);
    const rows = ai.prefectureCommentary.filter((p) => set.has(p.areaCode));
    const body = rows
      .map((p) => `**${p.areaName}**（全国${p.rank ?? "?"}位） ${p.commentary.trim()}`)
      .join("\n\n");
    take("prefectureCommentary(region)", body || undefined, "県別に見る");
  }

  // FAQ — 1位/最下位の重複を除いた分析系だけを採る。
  const faqs = ai.faq.filter(isAnalyticalFaq).slice(0, input.faqLimit ?? 2);
  if (faqs.length > 0) {
    const body = faqs.map((f) => `**${f.question.trim()}**\n\n${f.answer.trim()}`).join("\n\n");
    take("faq", body, "よくある疑問");
  }

  return { md: parts.join("\n\n"), used, dropped };
}
