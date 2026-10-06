/**
 * 県 (と市区町村) の「特徴」を選ぶ唯一の関数群 (AREA-HIGHLIGHTS-SSOT-01)。
 *
 * Web (県ページのカード・title/description・構造化データ・OGP・関連ブログ記事・市区町村ページ) と
 * SNS (Instagram「地域」カルーセル `.claude/scripts/sns/build-ig-area-props.ts`) はすべてここを呼ぶ。
 * 件数は引数で渡し、順位のしきい値・除外・重複禁止の規則はこのファイルの中だけに置く
 * (契約テスト `__tests__/area-highlights-contract.test.ts` が他所での直書きと直接切り出しを検出する)。
 *
 * オーナー判断 (2026-09-27):
 *  (a) 候補は AREA_DATABOOK_TEMPLATE の単一値指標に限る。全約 2,000 指標のプール (profile.json) には戻さない。
 *      総数指標を人口当たり指標に置き換えることは、この変更では行わない。
 *  (b) 並べ順は「順位の極端さ」が第一。同順位は掲載価値スコア (prominence)、次に新しさ (年)、
 *      最後に決定力 (margin) で決める。分野 (category) の重複は上位・下位の各リスト内で禁止する
 *      (2026-09-27 追加判断: カード全体ではなく片側ごと)。
 *  (c) 県の profile.json は当面生成を続けるが、Web はもう読まない (利用者 0 を確認後に廃止する)。
 *
 * 表現は SNS の中立規約 (.claude/rules/sns-content-standards.md) に合わせ「強み/弱み」とは呼ばない。
 * 良否の色 (tone) は METRIC_POLARITY で極性が確定した指標にだけ付け、未確定は neutral にする。
 *
 * このファイルは純粋関数だけを置き、パッケージ外の実行時 import を持たない
 * (SNS スクリプトが相対パスで直接 import するため)。
 */
import type {
  AreaDatabookSnapshot,
  DatabookHighlightMeta,
  DatabookMetricValue,
} from "../types/databook-snapshot";

/* ------------------------------------------------------------------ */
/* しきい値 (ここ以外に書かない)                                         */
/* ------------------------------------------------------------------ */

/** 都道府県の数。順位が付いた県がこれに満たない指標 (部分集計) は候補にしない。 */
export const PREFECTURE_COUNT = 47;
/** 上位・下位として扱う順位の幅 (上位 10 / 下位 10)。SNS カルーセル (2026-09-23) と同じ。 */
export const EDGE_BAND = 10;
/** これより古い年の値は「特徴」に出さない (2014 年度以前の値が並んだ UI 全面点検の指摘)。 */
export const MIN_HIGHLIGHT_YEAR = 2019;
/**
 * 1 グループ内の家計調査 (県庁所在市の値) の上限。候補の大半は出典が「社会・人口統計体系」1 つなので、
 * 出典単位の上限 (SNS の旧実装) では県ごとにカードが埋まらない。偏りが問題だったのは家計調査なので、
 * それだけを数える (2026-09-27)。
 */
const MAX_KAKEI_PER_GROUP = 2;
/** 市区町村: 県内順位でこの位以内を「特徴」とする (市区町村の profile.json の生成と共有)。 */
export const CITY_TOP_BAND = 5;

/**
 * 「全国トップクラス / 全国では下位」の型に載せない指標。データブックには出すが、県の看板に見えるため
 * 特徴には使わない (未成年の身長・体重、死亡率・自殺率、生活保護)。2026-09-23 に SNS で山形県の表紙が
 * 「高校2年女子の平均体重 全国1位」、大阪府が「生活保護世帯 全国1位」になったことで追加。
 */
export const HIGHLIGHT_EXCLUDED_KEY_PATTERN =
  /(^|-)(height|weight)(-|$)|death|suicide|public-assistance/;

/* ------------------------------------------------------------------ */
/* 候補キー (AREA_DATABOOK_TEMPLATE)                                    */
/* ------------------------------------------------------------------ */

/** AREA_DATABOOK_TEMPLATE の型に依存しすぎないよう、走査に必要な最小限の形だけを要求する。 */
interface DatabookBlockLike {
  blockType: string;
  metrics?: { rankingKey: string }[];
  pairs?: { maleKey: string; femaleKey: string }[];
}
export interface DatabookTemplateLike {
  sections: { blocks: DatabookBlockLike[] }[];
}

/**
 * テンプレートから「1 指標 = 1 値 + 全国順位」で表示できる rankingKey を集める
 * (ranked-kpi-grid の metrics と gender-paired-kpi の男女。chart は複数指標なので除く)。
 * 県の看板に向かない指標 (HIGHLIGHT_EXCLUDED_KEY_PATTERN) はここで落とす。
 */
export function collectHighlightCandidateKeys(template: DatabookTemplateLike): string[] {
  const keys: string[] = [];
  for (const section of template.sections) {
    for (const block of section.blocks) {
      if (block.blockType === "ranked-kpi-grid" && block.metrics) {
        for (const m of block.metrics) keys.push(m.rankingKey);
      } else if (block.blockType === "gender-paired-kpi" && block.pairs) {
        for (const p of block.pairs) keys.push(p.maleKey, p.femaleKey);
      }
    }
  }
  return [...new Set(keys)].filter((k) => !HIGHLIGHT_EXCLUDED_KEY_PATTERN.test(k));
}

/* ------------------------------------------------------------------ */
/* 焼き込み用の純粋関数 (exporter が使う)                                 */
/* ------------------------------------------------------------------ */

export interface RankedValue {
  rank: number;
  value: number;
}

/**
 * 隣接順位との値差から「順位の決定力 (margin)」を測る。隣接は中央側の順位
 * (上半分なら rank+1、下半分なら rank-1)。両方が正の値なら比率、0 以下を含むなら標準偏差で割った差。
 * 判定材料が無ければ 0 (足切りには使わず、最後のタイブレークにだけ使う)。
 */
export function computeMargin(values: RankedValue[], targetRank: number): number {
  const target = values.find((v) => v.rank === targetRank);
  if (!target) return 0;
  const neighborRank = targetRank <= values.length / 2 ? targetRank + 1 : targetRank - 1;
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

/** 1 位が最大値か最小値かを、1 位と最下位の値の比較で決める。 */
export function detectRankDirection(values: RankedValue[]): "desc" | "asc" {
  if (values.length === 0) return "desc";
  const sorted = [...values].sort((a, b) => a.rank - b.rank);
  return sorted[0].value >= sorted[sorted.length - 1].value ? "desc" : "asc";
}

const CAPITAL_CITY_PREFIX_RE = /^(都道府県)?庁?所在(市|地)の/;
const MAX_QUALIFIER_LENGTH = 24;

/**
 * subtitle から label に付け足す短い修飾語を作る。家計調査なら「県庁所在市の」等の前置きは
 * 注記側が持つため剥がす。丸括弧は「・」区切りへ平坦化し、長すぎれば「…」で丸める。
 */
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

/* ------------------------------------------------------------------ */
/* 選定                                                                */
/* ------------------------------------------------------------------ */

/**
 * rankingKey の末尾から測定量の接尾辞を剥がして「家族キー」を作る
 * (例: sandals-consumption-expenditure と sandals-consumption-quantity → sandals)。
 * 同じ家族は 1 カードに 1 件まで (北海道でサンダルの支出額と消費量が並んだ指摘)。
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
        break;
      }
    }
    if (!stripped) break;
  }
  return key;
}

const YEAR_RE = /(\d{4})/;

/** "2020年度" / "2024年" から 4 桁年を取り出す。読めなければ null (候補から外す)。 */
export function parseHighlightYear(year: string): number | null {
  const m = YEAR_RE.exec(year);
  return m ? Number(m[1]) : null;
}

export type HighlightDirection = "top" | "bottom";
/** 良否の色。RankBadge の tone にそのまま渡せる値だけを使う。 */
export type HighlightTone = "positive" | "negative" | "neutral";

/**
 * 良否の色を極性から決める。値が大きい側 (1 位が最大値なら上位) かどうかと極性の組で決め、
 * 極性が未確定 (null) や neutral なら色を付けない。
 */
export function highlightTone(
  direction: HighlightDirection,
  meta: Pick<DatabookHighlightMeta, "polarity" | "rankDirection">,
): HighlightTone {
  if (meta.polarity !== "higher-is-better" && meta.polarity !== "higher-is-worse") return "neutral";
  const isHighValueSide = (direction === "top") === (meta.rankDirection === "desc");
  const isGood = meta.polarity === "higher-is-better" ? isHighValueSide : !isHighValueSide;
  return isGood ? "positive" : "negative";
}

/** 選定結果の 1 件。表示・title・SNS はこの形だけを読む。 */
export interface AreaHighlight {
  rankingKey: string;
  label: string;
  subtitle?: string;
  value: number;
  unit: string;
  rank: number;
  /** 表示用の年 (yearName、例 "2023年度") */
  year: string;
  yearNumber: number;
  category: string;
  source: string;
  isKakei: boolean;
  direction: HighlightDirection;
  tone: HighlightTone;
}

export interface AreaHighlights {
  top: AreaHighlight[];
  bottom: AreaHighlight[];
}

interface ScoredCandidate {
  highlight: AreaHighlight;
  prominence: number;
  margin: number;
}

function toCandidate(rankingKey: string, metric: DatabookMetricValue): ScoredCandidate | null {
  const meta = metric.highlight;
  if (!meta) return null; // 候補外 or 旧版 databook.json
  if (!meta.published) return null;
  if (HIGHLIGHT_EXCLUDED_KEY_PATTERN.test(rankingKey)) return null;
  if (meta.rankedCount !== PREFECTURE_COUNT) return null;
  if (!meta.label || !meta.category || !meta.source) return null;
  const yearNumber = parseHighlightYear(metric.year);
  if (yearNumber === null || yearNumber < MIN_HIGHLIGHT_YEAR) return null;
  let direction: HighlightDirection;
  if (metric.rank >= 1 && metric.rank <= EDGE_BAND) direction = "top";
  else if (metric.rank > PREFECTURE_COUNT - EDGE_BAND && metric.rank <= PREFECTURE_COUNT) direction = "bottom";
  else return null;
  return {
    highlight: {
      rankingKey,
      label: meta.label,
      ...(meta.subtitle ? { subtitle: meta.subtitle } : {}),
      value: metric.value,
      unit: metric.unit,
      rank: metric.rank,
      year: metric.year,
      yearNumber,
      category: meta.category,
      source: meta.source,
      isKakei: meta.isKakei,
      direction,
      tone: highlightTone(direction, meta),
    },
    prominence: meta.prominence,
    margin: meta.margin,
  };
}

/** 順位の極端さ → 掲載価値 → 新しさ → 決定力 → rankingKey (決定的にするため) の順で並べる。 */
function compareCandidates(a: ScoredCandidate, b: ScoredCandidate): number {
  const extremeness = (c: ScoredCandidate) =>
    c.highlight.direction === "top" ? c.highlight.rank : PREFECTURE_COUNT + 1 - c.highlight.rank;
  return (
    extremeness(a) - extremeness(b) ||
    b.prominence - a.prominence ||
    b.highlight.yearNumber - a.highlight.yearNumber ||
    b.margin - a.margin ||
    a.highlight.rankingKey.localeCompare(b.highlight.rankingKey)
  );
}

/**
 * databook.json から上位・下位の候補を全件返す (件数の計測・生成時検査用)。並び順は選定と同じ。
 */
export function listAreaHighlightCandidates(
  databook: Pick<AreaDatabookSnapshot, "metrics"> | null | undefined,
): AreaHighlights {
  const scored = Object.entries(databook?.metrics ?? {})
    .map(([key, metric]) => toCandidate(key, metric))
    .filter((c): c is ScoredCandidate => c !== null)
    .sort(compareCandidates);
  return {
    top: scored.filter((c) => c.highlight.direction === "top").map((c) => c.highlight),
    bottom: scored.filter((c) => c.highlight.direction === "bottom").map((c) => c.highlight),
  };
}

export interface SelectAreaHighlightsOptions {
  /** 上位・下位それぞれの件数 */
  perGroup: number;
}

/**
 * 県の「特徴」を選ぶ。上位グループを先に埋め、次に下位グループを埋める。
 *
 * 制約 (カード全体): 表示ラベル・家族キーの重複禁止。
 * 制約 (グループ内): 分野 (category) の重複禁止、家計調査は MAX_KAKEI_PER_GROUP 件まで。
 * databook が無い・旧版 (highlight メタ無し) の場合は両グループとも空を返す。
 */
export function selectAreaHighlights(
  databook: Pick<AreaDatabookSnapshot, "metrics"> | null | undefined,
  options: SelectAreaHighlightsOptions,
): AreaHighlights {
  const scored = Object.entries(databook?.metrics ?? {})
    .map(([key, metric]) => toCandidate(key, metric))
    .filter((c): c is ScoredCandidate => c !== null)
    .sort(compareCandidates);

  const usedLabels = new Set<string>();
  const usedFamilies = new Set<string>();
  const pick = (direction: HighlightDirection): AreaHighlight[] => {
    const picked: AreaHighlight[] = [];
    let kakeiCount = 0;
    const usedCategories = new Set<string>();
    for (const { highlight } of scored) {
      if (picked.length >= options.perGroup) break;
      if (highlight.direction !== direction) continue;
      const family = familyKeyOf(highlight.rankingKey);
      if (usedLabels.has(highlight.label)) continue;
      if (usedFamilies.has(family)) continue;
      if (usedCategories.has(highlight.category)) continue;
      if (highlight.isKakei && kakeiCount >= MAX_KAKEI_PER_GROUP) continue;
      picked.push(highlight);
      usedLabels.add(highlight.label);
      usedFamilies.add(family);
      usedCategories.add(highlight.category);
      if (highlight.isKakei) kakeiCount += 1;
    }
    return picked;
  };

  if (options.perGroup <= 0) return { top: [], bottom: [] };
  const top = pick("top");
  const bottom = pick("bottom");
  return { top, bottom };
}

/* ------------------------------------------------------------------ */
/* 市区町村                                                            */
/* ------------------------------------------------------------------ */

/** 市区町村 profile.json の 1 件 (県内順位)。 */
export interface CityHighlightSource {
  indicator: string;
  rankingKey: string;
  year: string;
  rank: number;
  value: number;
  unit: string;
}

/**
 * 市区町村の「特徴」(県内 CITY_TOP_BAND 位以内) を選ぶ。市区町村は databook が無いため
 * 候補は profile.json の strengths。順位の極端さ → rankingKey の順で並べ、同じ表示名は 1 件にする。
 * 市区町村の指標は極性の焼き込みが無いので tone は付けない (呼び出し側で neutral に描く)。
 * 値が 0 の指標は除く。小さな町村では「0 施設」が同率で上位の順位を得るため、特徴に見えてしまう
 * (2026-10-04 週次 UI 検査: 田原本町で「0人」「0施設」が 3〜5 位として並んだ)。
 */
export function selectCityHighlights<T extends CityHighlightSource>(
  strengths: readonly T[] | null | undefined,
  options: { limit: number },
): T[] {
  const seen = new Set<string>();
  const picked: T[] = [];
  const ordered = [...(strengths ?? [])]
    .filter((s) => s.rank >= 1 && s.rank <= CITY_TOP_BAND && s.value !== 0)
    .sort((a, b) => a.rank - b.rank || a.rankingKey.localeCompare(b.rankingKey));
  for (const item of ordered) {
    if (picked.length >= options.limit) break;
    const label = item.indicator.trim();
    if (seen.has(label)) continue;
    seen.add(label);
    picked.push(item);
  }
  return picked;
}
