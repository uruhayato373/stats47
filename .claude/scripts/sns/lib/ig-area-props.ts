/**
 * Instagram「地域」カルーセル (火・土枠、正典 .claude/rules/sns-content-standards.md §2-3c) の
 * SNS 固有の整形ロジック。**どの指標を選ぶかはここでは決めない。**
 *
 * 2026-09-27 (AREA-HIGHLIGHTS-SSOT-01): 選定は Web の県ページと同じ
 * `packages/area-profile/src/highlights/select-area-highlights.ts` (selectAreaHighlights) に一本化し、
 * 値・順位・表示ラベル・分野・家計調査判定・決定力は R2 `app/areas/<code>/databook.json` の焼き込み値を読む
 * (values.json / item.json からの自前再計算は廃止)。候補は人手キュレーション済みの AREA_DATABOOK_TEMPLATE だけ
 * (全約 2,000 指標を採掘する profile.json は使わない — 2026-09-23 改訂2 の判断を維持)。
 *
 * 中立フレーミングの規約: 「強み/弱み」とは書かない。家計調査由来の指標は都道府県庁所在市
 * (東京都のみ都区部) の値であることを明記する。
 */
import type { AreaHighlight } from "../../../../packages/area-profile/src/highlights/select-area-highlights.ts";

// 対決カルーセル (ig-compare-props.ts) が使う共通の整形関数。定義は選定パッケージ側にある。
export {
  buildQualifiedLabel,
  buildSubtitleQualifier,
  collectHighlightCandidateKeys as extractCuratedRankingKeys,
  familyKeyOf,
  type DatabookTemplateLike,
} from "../../../../packages/area-profile/src/highlights/select-area-highlights.ts";

/** 対決カルーセル (ig-compare-props.ts) の多様性上限。地域カルーセルの選定には使わない。 */
export const MAX_ITEMS_PER_SOURCE = 2;
export const MAX_ITEMS_PER_CATEGORY = 1;

/** 最終的に props.json へ書き出す1件 */
export interface AreaCarouselItem {
  rankingKey: string;
  label: string;
  subtitle?: string;
  value: number;
  unit: string;
  rank: number;
  year: number;
  source: string;
  scopeNote?: string;
}

export interface AreaCarouselGroup {
  title: string;
  items: AreaCarouselItem[];
}

export interface CoverTeaser {
  rankingKey: string;
  label: string;
  rank: number;
  value: number;
  unit: string;
}

const YEAR_RE = /(\d{4})/;

/** "2020年度" / "2024年" のような表記から4桁年を取り出す。読めなければ例外 (黙って0にしない)。 */
export function extractYear(yearStr: string): number {
  const m = YEAR_RE.exec(yearStr);
  if (!m) throw new Error(`年が読み取れません: ${yearStr}`);
  return Number(m[1]);
}

/** "46" / "46000" のどちらでも受け取り、2桁・5桁の両方を返す。範囲外は例外。 */
export function normalizePrefCode(input: string): { pref2: string; pref5: string } {
  const digits = input.trim();
  if (!/^\d+$/.test(digits)) throw new Error(`都道府県コードは数字のみ: ${input}`);
  let pref2: string;
  if (digits.length === 2) pref2 = digits;
  else if (digits.length === 5) pref2 = digits.slice(0, 2);
  else throw new Error(`都道府県コードは2桁または5桁で指定: ${input}`);
  const n = Number(pref2);
  if (!Number.isInteger(n) || n < 1 || n > 47) throw new Error(`都道府県コードの範囲外 (01-47): ${input}`);
  return { pref2, pref5: `${pref2}000` };
}

export function buildCoverHook(areaName: string): string {
  return `${areaName}、全国で何位？`;
}

/** カバーの一押し (テーサー): トップグループの中で最も順位が良い1件。 */
export function buildCoverTeaser(topGroupItems: AreaCarouselItem[]): CoverTeaser | undefined {
  if (topGroupItems.length === 0) return undefined;
  const best = [...topGroupItems].sort((a, b) => a.rank - b.rank)[0];
  return { rankingKey: best.rankingKey, label: best.label, rank: best.rank, value: best.value, unit: best.unit };
}

/**
 * 家計調査由来の scopeNote を作る。東京都のみ「都区部」集計なので固定文言にする。
 * 他県は pref-capitals.ts の名称から補足の丸括弧を取り除いた素の市名を使う。
 */
export function buildScopeNote(pref2: string, capitalName: string): string {
  if (pref2 === "13") return "東京都区部の値";
  const clean = capitalName.replace(/\s*[（(][^）)]*[）)]\s*$/, "").trim();
  return `県庁所在市（${clean}）の値`;
}

/** 選定結果 (AreaHighlight) を props.json の形へ変換する。家計調査由来にだけ scopeNote を付ける。 */
export function toAreaCarouselItem(h: AreaHighlight, scopeNoteText: string): AreaCarouselItem {
  const item: AreaCarouselItem = {
    rankingKey: h.rankingKey,
    label: h.label,
    value: h.value,
    unit: h.unit,
    rank: h.rank,
    year: h.yearNumber,
    source: h.source,
  };
  if (h.subtitle) item.subtitle = h.subtitle;
  if (h.isKakei) item.scopeNote = scopeNoteText;
  return item;
}

/** fail-closed 判定: 3件未満、または source/year 欠落があればエラー文の配列を返す (空なら合格)。 */
export function validateGroup(groupLabel: string, items: AreaCarouselItem[]): string[] {
  const errors: string[] = [];
  if (items.length < 3) {
    errors.push(`${groupLabel}: 件数不足 (${items.length}件、最低3件)`);
  }
  for (const item of items) {
    if (!item.source) errors.push(`${groupLabel}: ${item.rankingKey} の source が空`);
    if (!Number.isInteger(item.year) || item.year <= 0) errors.push(`${groupLabel}: ${item.rankingKey} の year が不正`);
  }
  return errors;
}
