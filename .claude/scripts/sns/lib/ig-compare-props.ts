/**
 * Instagram「県どうしの比較」カルーセル (金枠、正典 .claude/rules/sns-content-standards.md §2-3c) の
 * データ選定・整形ロジック。ネットワーク I/O は build-ig-compare-props.ts が担い、ここには
 * 「候補からどれを選ぶか」「どう表示形へ変換するか」を決める純粋関数だけを置く
 * (fixture でテストできるようにするため)。
 *
 * 指標プール・多様性キャップ (出典/カテゴリ上限)・subtitle 修飾語・都道府県コード正規化・
 * scopeNote の考え方は Instagram「地域」カルーセルの `lib/ig-area-props.ts` と共通のため、
 * その汎用ユーティリティを import して再利用する (この比較ドメイン固有のロジックだけをここに書く)。
 */

import {
  type Candidate as AreaCandidate,
  type DatabookTemplateLike,
  MAX_ITEMS_PER_CATEGORY,
  MAX_ITEMS_PER_SOURCE,
  buildQualifiedLabel,
  buildSubtitleQualifier,
  extractCuratedRankingKeys,
  familyKeyOf,
  normalizePrefCode,
} from "./ig-area-props.ts";

export { extractCuratedRankingKeys, normalizePrefCode };
export type { DatabookTemplateLike };

/** 47県そろった values.json の両地域分の値・順位 */
export interface DuelSide {
  value: number;
  rank: number;
}

/** R2 から解決した1指標分の対決候補 (両地域とも値が存在するものだけ) */
export interface DuelCandidate {
  rankingKey: string;
  /** readerLabel ?? title (subtitle 修飾語を付与する前の素のラベル) */
  rawLabel: string;
  subtitle?: string;
  unit: string;
  year: number;
  source: string;
  category: string;
  isKakei: boolean;
  a: DuelSide;
  b: DuelSide;
}

/** 最終的に props.json へ書き出す1件 */
export interface CompareDuelItem {
  rankingKey: string;
  label: string;
  subtitle?: string;
  unit: string;
  year: number;
  source: string;
  scopeNote?: string;
  precision: number;
  a: DuelSide;
  b: DuelSide;
  winner: "a" | "b" | "tie";
}

export interface CompareCarouselSummary {
  aWins: number;
  bWins: number;
  ties: number;
}

/** 対決として成立する最低件数・最大件数 (done_when: 5〜7個) */
export const MIN_DUEL_ITEMS = 5;
export const MAX_DUEL_ITEMS = 7;

/**
 * 対決の「見どころ度」を測る margin。大きい値÷小さい値 (どちらも正の場合)。
 * 0以下を含む場合は意味を持たないため 1 (差なし扱い) を返す
 * (候補からは除外しない — margin は並べ替えのヒントに留める)。
 */
export function computeDuelMargin(a: number, b: number): number {
  if (a > 0 && b > 0) return Math.max(a, b) / Math.min(a, b);
  return 1;
}

/** 生の値だけを比較して勝者を決める (中立: 数値の大小のみ。強み/弱みの評価はしない) */
export function classifyWinner(a: number, b: number): "a" | "b" | "tie" {
  if (a > b) return "a";
  if (b > a) return "b";
  return "tie";
}

/**
 * 候補群から need 件を選ぶ。margin (見どころ度) 降順を優先し、重複ラベル・同一家族・
 * 出典/カテゴリの多様性キャップ (ig-area-props と共通の定数) で多様性を担保する。
 */
export function selectDuelCandidates(
  candidates: DuelCandidate[],
  need: number,
): DuelCandidate[] {
  if (need <= 0) return [];
  const ordered = [...candidates].sort(
    (x, y) => computeDuelMargin(y.a.value, y.b.value) - computeDuelMargin(x.a.value, x.b.value),
  );
  const usedLabels = new Set<string>();
  const usedFamilies = new Set<string>();
  const sourceCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const picked: DuelCandidate[] = [];

  for (const c of ordered) {
    if (picked.length >= need) break;
    if (usedLabels.has(c.rawLabel)) continue;
    const family = familyKeyOf(c.rankingKey);
    if (usedFamilies.has(family)) continue;
    if ((sourceCounts.get(c.source) ?? 0) >= MAX_ITEMS_PER_SOURCE) continue;
    if ((categoryCounts.get(c.category) ?? 0) >= MAX_ITEMS_PER_CATEGORY) continue;
    picked.push(c);
    usedLabels.add(c.rawLabel);
    usedFamilies.add(family);
    sourceCounts.set(c.source, (sourceCounts.get(c.source) ?? 0) + 1);
    categoryCounts.set(c.category, (categoryCounts.get(c.category) ?? 0) + 1);
  }
  return picked;
}

/** カバーの問いかけ (中立・煽らない語調) */
export function buildCoverQuestion(areaAName: string, areaBName: string): string {
  return `${areaAName} vs ${areaBName}\n暮らしの数字、上なのはどっち？`;
}

const CAPITAL_PAREN_RE = /\s*[（(][^）)]*[）)]\s*$/;

/** pref-capitals.ts の表記 ("東京 (新宿区)") から素の市名だけを取り出す */
function cleanCapitalName(pref2: string, capitalName: string): string {
  if (pref2 === "13") return "都区部";
  return capitalName.replace(CAPITAL_PAREN_RE, "").trim();
}

/**
 * 家計調査由来の scopeNote (両地域の県庁所在市を明記)。
 * 例: "県庁所在市（東京都区部・大阪市）の値"
 */
export function buildCompareScopeNote(
  prefA2: string,
  capitalA: string,
  prefB2: string,
  capitalB: string,
): string {
  const cityA = cleanCapitalName(prefA2, capitalA);
  const cityB = cleanCapitalName(prefB2, capitalB);
  return `県庁所在市（${cityA}・${cityB}）の値`;
}

/** DuelCandidate → CompareDuelItem (表示用ラベル・scopeNote・winner・precision を確定する) */
export function toDuelItem(
  c: DuelCandidate,
  precision: number,
  scopeNoteText: string,
): CompareDuelItem {
  const qualifier = buildSubtitleQualifier(c.subtitle, c.isKakei);
  const label = buildQualifiedLabel(c.rawLabel, qualifier);
  const item: CompareDuelItem = {
    rankingKey: c.rankingKey,
    label,
    unit: c.unit,
    year: c.year,
    source: c.source,
    precision,
    a: c.a,
    b: c.b,
    winner: classifyWinner(c.a.value, c.b.value),
  };
  if (c.subtitle) item.subtitle = c.subtitle;
  if (c.isKakei) item.scopeNote = scopeNoteText;
  return item;
}

/** 勝敗まとめ (X勝 / Y勝 / 引き分け) */
export function tallyWins(items: CompareDuelItem[]): CompareCarouselSummary {
  let aWins = 0;
  let bWins = 0;
  let ties = 0;
  for (const item of items) {
    if (item.winner === "a") aWins += 1;
    else if (item.winner === "b") bWins += 1;
    else ties += 1;
  }
  return { aWins, bWins, ties };
}

/**
 * fail-closed 判定: 件数が [MIN_DUEL_ITEMS, MAX_DUEL_ITEMS] の範囲外、または
 * source/year 欠落があればエラー文の配列を返す (空なら合格)。
 */
export function validateDuelItems(items: CompareDuelItem[]): string[] {
  const errors: string[] = [];
  if (items.length < MIN_DUEL_ITEMS || items.length > MAX_DUEL_ITEMS) {
    errors.push(
      `対決件数が範囲外 (${items.length}件、${MIN_DUEL_ITEMS}〜${MAX_DUEL_ITEMS}件が必要)`,
    );
  }
  for (const item of items) {
    if (!item.source) errors.push(`${item.rankingKey} の source が空`);
    if (!Number.isInteger(item.year) || item.year <= 0) {
      errors.push(`${item.rankingKey} の year が不正`);
    }
    if (!Number.isFinite(item.a.value) || !Number.isFinite(item.b.value)) {
      errors.push(`${item.rankingKey} の値が不正 (両地域とも数値が必要)`);
    }
  }
  return errors;
}

export interface CompareCaptionInput {
  areaAName: string;
  areaBName: string;
  items: CompareDuelItem[];
  summary: CompareCarouselSummary;
}

/**
 * caption.txt の本文 (sns-content-standards.md §2-3 の雛形に準拠)。
 * IG のキャプション内 URL はタップできないため雛形どおり載せず、
 * 「プロフィールのリンクから」で導線する。2200字以内・ハッシュタグ8〜13個。
 */
export function buildCompareCaption(input: CompareCaptionInput): string {
  const { areaAName, areaBName, items, summary } = input;
  const lines: string[] = [];
  lines.push(`【県どうしの比較】${areaAName} vs ${areaBName}`);
  lines.push("");
  for (const item of items) {
    const mark = item.winner === "a" ? areaAName : item.winner === "b" ? areaBName : "引き分け";
    lines.push(`${item.label}: ${mark}が上（${item.year}年・出典: ${item.source}）`);
  }
  lines.push("");
  lines.push(
    `${items.length}項目中 ${areaAName} ${summary.aWins}勝 / ${areaBName} ${summary.bWins}勝` +
      (summary.ties > 0 ? ` / 引き分け ${summary.ties}` : ""),
  );
  lines.push("");
  lines.push("保存して後で見返してね📌");
  lines.push("プロフィールのリンクから全47都道府県が見られます");
  lines.push("");
  lines.push(`#都道府県比較 #${areaAName} #${areaBName} #都道府県ランキング #統計 #暮らし #地域比較 #雑学 #stats47`);
  return lines.join("\n");
}
