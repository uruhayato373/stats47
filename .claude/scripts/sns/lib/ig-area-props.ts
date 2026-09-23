/**
 * Instagram「地域」カルーセル (火・土枠、正典 .claude/rules/sns-content-standards.md §2-3c) の
 * データ選定ロジック。ネットワーク I/O は build-ig-area-props.ts が担い、ここには
 * 「候補からどれを選ぶか」を決める純粋関数だけを置く (fixture でテストできるようにするため)。
 *
 * 中立フレーミングの規約: 「強み/弱み」とは書かない。家計調査由来の指標は都道府県庁所在市
 * (東京都のみ都区部) の値であることを明記する。
 *
 * 2026-09-23 改訂2: `app/areas/<code>/profile.json` (全指標 ~2,000本を機械的に採掘) を候補プールに
 * するのをやめた。indexable 優先という代理指標で品質を担保していたが、① 家計調査の消費支出額に
 * 偏る ② サブタイトルを見ずにラベル化して意味の異なる指標 (例: 韓国・朝鮮籍限定の外国人人口を
 * 「外国人人口」と表示) を誤表示する、という問題を生んだ。編集済みで人手キュレーション済みの
 * `AREA_DATABOOK_TEMPLATE` (packages/data-configs/src/area-databook/template.ts) の rankingKey
 * だけを候補プールにし、順位のしきい値 (トップ10/下位10) と実際の値から margin を計算して選ぶ。
 */

/** item.json から抽出した表示メタ + values.json 由来の値・順位・margin を合成した選定候補 */
export interface Candidate {
  rankingKey: string;
  /** readerLabel ?? title に subtitle 修飾語を付与した表示用ラベル */
  label: string;
  /** item.json の生 subtitle (存在すれば)。label 生成に使った後も参照用に保持する。 */
  subtitle?: string;
  value: number;
  unit: string;
  rank: number;
  year: number;
  source: string;
  category: string;
  isKakei: boolean;
  /** 隣接順位との値差 (決定力)。computeMargin の結果。取得できなければ0。 */
  margin: number;
}

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

/**
 * rankingKey の末尾から測定量・職種年収系の接尾辞を反復的に剥がして家族キーを作る。
 * 「〜消費支出額/消費量」だけでなく「〜年収/〜給与/〜所定内給与/〜時間給/〜率/〜割合/〜数」
 * のような同一対象・別測定量のペアも束ねる (例: nurse-annual-income と nurse-salary → nurse)。
 * 剥がせなければ rankingKey そのものを返す (=単独家族)。
 */
const FAMILY_SUFFIX_PATTERNS: RegExp[] = [
  /-consumption-expenditure$/,
  /-consumption-quantity$/,
  /-scheduled-earnings$/,
  /-annual-income$/,
  /-hourly-wage$/,
  /-salary$/,
  /-per-[a-z0-9]+$/,
  /-expenditure$/,
  /-quantity$/,
  /-rate$/,
  /-ratio$/,
  /-count$/,
];

export function familyKeyOf(rankingKey: string): string {
  let key = rankingKey;
  for (let guard = 0; guard < 8; guard += 1) {
    let stripped = false;
    for (const pattern of FAMILY_SUFFIX_PATTERNS) {
      const next = key.replace(pattern, "");
      if (next !== key && next.length > 0) {
        key = next;
        stripped = true;
        break; // 剥がしたら先頭のパターンから再走査する (複合接尾辞に対応)
      }
    }
    if (!stripped) break;
  }
  return key;
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

/** 順位がどちらのグループに属すかを判定する。トップ10でも下位10でもなければ null (どちらにも入れない)。 */
export const TOP_RANK_THRESHOLD = 10;
export const BOTTOM_RANK_THRESHOLD = 38;
export type GroupDirection = "top" | "bottom";
export function classifyRank(rank: number): GroupDirection | null {
  if (rank <= TOP_RANK_THRESHOLD) return "top";
  if (rank >= BOTTOM_RANK_THRESHOLD) return "bottom";
  return null;
}

/** AREA_DATABOOK_TEMPLATE の型に依存しすぎないよう、走査に必要な最小限の形だけを要求する。 */
interface DatabookBlockLike {
  blockType: string;
  metrics?: { rankingKey: string }[];
  pairs?: { maleKey: string; femaleKey: string }[];
}
interface DatabookSectionLike {
  blocks: DatabookBlockLike[];
}
export interface DatabookTemplateLike {
  sections: DatabookSectionLike[];
}

/**
 * AREA_DATABOOK_TEMPLATE から「1指標=1值+全国順位」で表示できる rankingKey だけを集める。
 * ranked-kpi-grid の metrics と gender-paired-kpi の男女ペアを対象にする
 * (chart ブロックは複数指標の可視化であり、単一の順位カードには使えないため除外)。
 */
export function extractCuratedRankingKeys(template: DatabookTemplateLike): string[] {
  const keys: string[] = [];
  for (const section of template.sections) {
    for (const block of section.blocks) {
      if (block.blockType === "ranked-kpi-grid" && block.metrics) {
        for (const m of block.metrics) keys.push(m.rankingKey);
      } else if (block.blockType === "gender-paired-kpi" && block.pairs) {
        for (const p of block.pairs) {
          keys.push(p.maleKey);
          keys.push(p.femaleKey);
        }
      }
    }
  }
  return [...new Set(keys)];
}

/** グループ間で重複排除するための可変状態 (家族/ラベルは両グループで共有)。 */
export interface SelectionState {
  usedLabels: Set<string>;
  usedFamilies: Set<string>;
}
export function createSelectionState(): SelectionState {
  return { usedLabels: new Set(), usedFamilies: new Set() };
}

/** 出典・カテゴリの多様性上限は「グループ内」だけで数える (グループごとに新規作成する)。 */
export const MAX_ITEMS_PER_SOURCE = 2;
export const MAX_ITEMS_PER_CATEGORY = 1;

export interface GroupCaps {
  sourceCounts: Map<string, number>;
  categoryCounts: Map<string, number>;
}
export function createGroupCaps(): GroupCaps {
  return { sourceCounts: new Map(), categoryCounts: new Map() };
}
function withinCaps(c: Candidate, caps: GroupCaps): boolean {
  if ((caps.sourceCounts.get(c.source) ?? 0) >= MAX_ITEMS_PER_SOURCE) return false;
  if ((caps.categoryCounts.get(c.category) ?? 0) >= MAX_ITEMS_PER_CATEGORY) return false;
  return true;
}
function recordCaps(c: Candidate, caps: GroupCaps): void {
  caps.sourceCounts.set(c.source, (caps.sourceCounts.get(c.source) ?? 0) + 1);
  caps.categoryCounts.set(c.category, (caps.categoryCounts.get(c.category) ?? 0) + 1);
}

export interface RankedValue {
  rank: number;
  value: number;
}

/**
 * 隣接順位との値差から「順位の決定力 (margin)」を測る。両方が正の値なら比率
 * (大きいほど僅差でない・1に近いほど僅差)。0やマイナスを含む場合は比率が意味を持たないため、
 * 全体の標準偏差で正規化した差を使う。隣接順位が values に無ければ判定材料なしとして0を返す
 * (候補からは除外しない — margin は足切りではなく同順位タイブレークのヒントに留める)。
 */
export function computeMargin(values: RankedValue[], targetRank: number, order: "asc" | "desc"): number {
  const target = values.find((v) => v.rank === targetRank);
  if (!target) return 0;
  const neighborRank = order === "asc" ? targetRank + 1 : targetRank - 1;
  const neighbor = values.find((v) => v.rank === neighborRank);
  if (!neighbor) return 0;
  const v1 = target.value;
  const v2 = neighbor.value;
  if (v1 > 0 && v2 > 0) return Math.max(v1, v2) / Math.min(v1, v2);
  const nums = values.map((v) => v.value);
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
  const stdev = Math.sqrt(variance);
  if (stdev === 0) return 0;
  return Math.abs(v1 - v2) / stdev;
}

/**
 * subtitle から label に付け足す短い修飾語を作る。家計調査由来なら「都道府県庁所在市の」等の
 * 前置きは scopeNote 側が既に持つため重複させず剥がす。既存の丸括弧は「・」区切りへ平坦化し
 * (label 側の括弧とネストさせない)、長すぎる場合は指定文字数で「…」に丸める。
 */
const CAPITAL_CITY_PREFIX_RE = /^(都道府県)?庁?所在(市|地)の/;
const MAX_QUALIFIER_LENGTH = 24;

export function buildSubtitleQualifier(subtitle: string | undefined, isKakei: boolean): string | undefined {
  if (!subtitle) return undefined;
  let s = subtitle.trim();
  if (isKakei) s = s.replace(CAPITAL_CITY_PREFIX_RE, "").trim();
  s = s
    .replace(/[（(]/g, "・")
    .replace(/[）)]/g, "")
    .replace(/^・+/, "")
    .replace(/・+/g, "・")
    .trim();
  if (!s) return undefined;
  const chars = [...s];
  if (chars.length > MAX_QUALIFIER_LENGTH) s = `${chars.slice(0, MAX_QUALIFIER_LENGTH).join("")}…`;
  return s;
}

export function buildQualifiedLabel(label: string, qualifier: string | undefined): string {
  return qualifier ? `${label}（${qualifier}）` : label;
}

/**
 * 候補群から need 件を選ぶ。優先順位: ① 実際の順位 (top はトップ10側=昇順、bottom は下位10側=
 * 降順で「より極端な順位」を優先) ② margin 降順 (同順位のタイブレーク)。
 * 出典・カテゴリの多様性はソートではなく caps (per-group 上限) というハード制約で担保する。
 * 重複ラベル・同一家族はグループを跨いで必ず落とす (state で管理)。
 */
export function selectCandidates(
  candidates: Candidate[],
  need: number,
  direction: GroupDirection,
  state: SelectionState,
  caps: GroupCaps,
): Candidate[] {
  if (need <= 0) return [];
  const ordered = [...candidates].sort((a, b) => {
    const rankDiff = direction === "top" ? a.rank - b.rank : b.rank - a.rank;
    if (rankDiff !== 0) return rankDiff;
    return b.margin - a.margin;
  });
  const picked: Candidate[] = [];
  for (const c of ordered) {
    if (picked.length >= need) break;
    if (state.usedLabels.has(c.label)) continue; // 重複ラベルは落とす (disambiguate せず drop = シンプル優先)
    const family = familyKeyOf(c.rankingKey);
    if (state.usedFamilies.has(family)) continue; // 同一家族は両グループ通じて1件まで
    if (!withinCaps(c, caps)) continue; // 出典/カテゴリの偏りをハード制約で抑える
    picked.push(c);
    state.usedLabels.add(c.label);
    state.usedFamilies.add(family);
    recordCaps(c, caps);
  }
  return picked;
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
 * 家計調査由来の scopeNote を作る。東京都のみ「都区部」集計 (23区。県庁所在市という概念に
 * 当たらない) なので固定文言にする。他県は pref-capitals.ts の名称から補足の丸括弧
 * (例: 東京の "東京 (新宿区)") を取り除いた素の市名を使う。
 */
export function buildScopeNote(pref2: string, capitalName: string): string {
  if (pref2 === "13") return "東京都区部の値";
  const clean = capitalName.replace(/\s*[（(][^）)]*[）)]\s*$/, "").trim();
  return `県庁所在市（${clean}）の値`;
}

/** 家計調査由来 (isKakei) の候補にだけ scopeNote を付けて最終形へ変換する。 */
export function toAreaCarouselItem(c: Candidate, scopeNoteText: string): AreaCarouselItem {
  const item: AreaCarouselItem = {
    rankingKey: c.rankingKey,
    label: c.label,
    value: c.value,
    unit: c.unit,
    rank: c.rank,
    year: c.year,
    source: c.source,
  };
  if (c.subtitle) item.subtitle = c.subtitle;
  if (c.isKakei) item.scopeNote = scopeNoteText;
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
