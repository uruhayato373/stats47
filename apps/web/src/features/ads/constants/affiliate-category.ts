/**
 * アフィリエイト広告の「意図軸 (vertical)」= 全タクソノミー (category / theme / tag / ranking) を
 * 集約する単一ハブ。ページの意図 → vertical → 広告 で解決する。
 *
 * 正典: `.claude/rules/affiliate-ads-standards.md`。写像の記録の正本は台帳 `affiliate.vertical-map`
 * (data/affiliate/ledger/vertical-map.json + Schema) で、ここは型を付けて export し、解決の関数を持つ。
 * vertical の値の列挙は AffiliateVertical と Schema の enum の 2 か所にあり、テストが一致を固定する。
 */
import data from "../../../../../../data/affiliate/ledger/vertical-map.json";

/** 広告意図軸 (10 vertical)。コンテンツ分類 (category 17 / theme 20 / tag) はここへ写像する。 */
export type AffiliateVertical =
  | "labor"      // 労働・賃金・転職・キャリア
  | "housing"    // 住宅・土地・不動産・引越し
  | "population" // 人口・世帯・結婚・子育て
  | "economy"    // 家計・経済・投資・保険・物価
  | "health"     // 健康・医療・介護・フィットネス
  | "energy"     // エネルギー・水・通信
  | "travel"     // 旅行・宿泊 (OTA: 楽天トラベル/じゃらん/一休 等)
  | "furusato"   // ふるさと納税・地方財政
  | "education"  // 教育・通信教育・学習
  | "mobility";  // 交通・自動車保険・車査定・移動

/** 全 vertical の配列 (validation / iteration 用)。 */
export const AFFILIATE_VERTICALS: readonly AffiliateVertical[] = [
  "labor",
  "housing",
  "population",
  "economy",
  "health",
  "energy",
  "travel",
  "furusato",
  "education",
  "mobility",
] as const;

/**
 * @deprecated 旧名。`AffiliateVertical` を使う。型 alias として互換維持 (段階移行)。
 */
export type AffiliateCategory = AffiliateVertical;

/**
 * categoryKey (e-Stat 17 軸) → vertical。
 * ranking / category ページはこの写像で vertical を得る。
 */
export const CATEGORY_AFFILIATE_MAP = data.category as Record<string, AffiliateVertical>;

/**
 * カテゴリ一覧は回遊が主目的。17軸を明示し、分類の写像だけで広告枠を増やさない。
 * null は掲載漏れではない。人口/医療/気候や既存枠のないカテゴリは適合導線を確認するまで空。
 */
export const CATEGORY_PAGE_AFFILIATE_POLICY = data.categoryPagePolicy as Readonly<Record<string, AffiliateVertical | null>>;

/**
 * theme スラッグ (20) → vertical。テーマページ (`/themes/*`) の広告解決に使う。
 * theme の正本は台帳 `themes.catalogs`。theme を足したら `affiliate.vertical-map` の theme も足す。
 */
export const THEME_AFFILIATE_MAP = data.theme as Record<string, AffiliateVertical>;

/** タグキー → vertical（tagKey ベース。blog frontmatter tags の写像） */
export const TAG_AFFILIATE_MAP = data.tag as Record<string, AffiliateVertical>;

/**
 * 市区町村テーマ (`/municipalities/themes/<slug>`) → vertical。
 * slug の正本は MUNICIPALITY_THEME_CATALOGS (台帳 `municipalities.themes` と拡充の台帳 2 つから組み立てる)。
 * 寄せ先は同じ主題の CATEGORY_AFFILIATE_MAP / THEME_AFFILIATE_MAP と揃える (2026-09-02)。
 */
export const MUNICIPALITY_THEME_AFFILIATE_MAP = data.municipalityTheme as Record<string, AffiliateVertical>;

/**
 * 広告に付与された vertical を解決する。`vertical` を正とし、未設定なら categoryKey から写像 (後方互換)。
 * (Step B で全広告に vertical を必須化するまでの移行フォールバック)
 */
export function adVertical(ad: {
  vertical?: string | null;
  categoryKey?: string | null;
}): AffiliateVertical | undefined {
  if (ad.vertical) return ad.vertical as AffiliateVertical;
  if (ad.categoryKey) return CATEGORY_AFFILIATE_MAP[ad.categoryKey];
  return undefined;
}

/** カテゴリ別テーマカラー (識別パレット) は affiliate-category.palette.ts が正典。互換のため再 export。 */
export { AFFILIATE_THEME } from "./affiliate-category.palette";

/**
 * 出典調査 (surveys.json の id) → vertical。**カテゴリより細かい主題**で意図を決める最上位の写像。
 *
 * 17 軸のカテゴリは「納豆消費量」と「県民所得」を同じ economy に落とすが、出典調査
 * (家計調査 / 県民経済計算) なら区別できる。ランキングは item.json、ブログは all.json に
 * surveyIds が焼き込み済みなので推測は入らない (正典 `survey-linkage-standards.md`)。
 *
 * 値の意味:
 *   - vertical: その調査のページはカテゴリ・タグに関わらずこの軸で解決する
 *   - null:     主題はあるが合う商材が無い。意図軸の広告を**出さない** (ハウス枠・AdSense のみ)。
 *               意図の合わない広告を上位に置くより空の方が無害 (rules §5)
 *
 * ここに無い調査はタグ → カテゴリの従来解決に落ちる。追加は「カテゴリ写像より明らかに
 * 良い/悪い」と実測で言える調査だけ (2026-09-03: GSC 2026-W35 の imp 上位から選定)。
 */
export const SURVEY_AFFILIATE_MAP = data.survey as Readonly<Record<string, AffiliateVertical | null>>;

/** tagKey 群 → 重複なし vertical 群 (出現順)。 */
export function verticalsFromTagKeys(tagKeys: readonly string[]): AffiliateVertical[] {
  const seen = new Set<AffiliateVertical>();
  for (const tagKey of tagKeys) {
    const v = TAG_AFFILIATE_MAP[tagKey];
    if (v) seen.add(v);
  }
  return [...seen];
}

export interface ContentVerticalInput {
  /**
   * 編集判断で確定したページ固有の意図。プロパティ自体が無ければ自動解決、null は広告なし。
   * データ出典 (surveyIds) と読者の購買意図が一致しない記事だけに使う。
   */
  explicitVertical?: AffiliateVertical | null;
  /** 出典調査 id (先頭が主調査)。ranking item.json / blog all.json の surveyIds */
  surveyIds?: readonly string[] | null;
  /** 記事・指標のタグキー */
  tagKeys?: readonly string[] | null;
  /** e-Stat 17 軸カテゴリ */
  categoryKey?: string | null;
}

export type ContentVerticalResolution =
  | { source: "explicit"; vertical: AffiliateVertical; verticals: AffiliateVertical[] }
  | { source: "explicit-none"; vertical: null; verticals: [] }
  | { source: "survey"; vertical: AffiliateVertical; verticals: AffiliateVertical[] }
  | { source: "survey-none"; vertical: null; verticals: [] }
  | { source: "tags"; vertical: AffiliateVertical; verticals: AffiliateVertical[] }
  | { source: "category"; vertical: AffiliateVertical; verticals: AffiliateVertical[] }
  | { source: "none"; vertical: null; verticals: [] };

/**
 * ページの内容から広告の意図軸を 1 つ決める。全ページ共通の解決順:
 *   1. 出典調査 (SURVEY_AFFILIATE_MAP に載っている調査。null なら意図軸の広告を出さない)
 *   2. タグ (TAG_AFFILIATE_MAP。複数 vertical に解決した場合は `verticals` に全部残す)
 *   3. カテゴリ (CATEGORY_AFFILIATE_MAP)
 *   4. 無し (推測で別の軸へ流さない)
 * 純関数。R2 を読まない。
 */
/** 在庫フォールバック鎖の 1 段。上から順に試し、在庫が出た段で止める。 */
export interface ContentVerticalStep {
  source: "explicit" | "survey" | "tags" | "category";
  verticals: AffiliateVertical[];
}

/**
 * 意図軸の候補を specific → general の順に並べた在庫フォールバック鎖。
 *
 * `resolveContentVertical` は「この面の意図軸は何か」を 1 つ返すが、その軸に在庫が無いと
 * 枠が空になる。2026-09-03 以前の ranking は「tags で 0 件なら categoryKey で再試行」する
 * 在庫フォールバックを持っており、意図軸の統一 (PR #913) でこれが落ちていた。鎖を返して
 * 呼び出し側が上から順に在庫を引く。
 *
 * `blocked: true` は出典調査が `null` を指す指標 (身長・気候など商材が無いもの)。
 * **下位段へフォールバックしない** — 「意図軸の広告を出さない」判断を打ち消さないため。
 * 純関数。R2 を読まない。
 */
export interface ContentVerticalChain {
  blocked: boolean;
  steps: ContentVerticalStep[];
}

export function resolveContentVerticalChain(input: ContentVerticalInput): ContentVerticalChain {
  if (Object.prototype.hasOwnProperty.call(input, "explicitVertical")) {
    return input.explicitVertical
      ? { blocked: false, steps: [{ source: "explicit", verticals: [input.explicitVertical] }] }
      : { blocked: true, steps: [] };
  }
  const tagVerticals = verticalsFromTagKeys(input.tagKeys ?? []);
  const categoryVertical = input.categoryKey
    ? CATEGORY_AFFILIATE_MAP[input.categoryKey]
    : undefined;

  const steps: ContentVerticalStep[] = [];
  const push = (source: ContentVerticalStep["source"], verticals: AffiliateVertical[]) => {
    if (verticals.length > 0) steps.push({ source, verticals });
  };

  for (const surveyId of input.surveyIds ?? []) {
    if (!(surveyId in SURVEY_AFFILIATE_MAP)) continue;
    const v = SURVEY_AFFILIATE_MAP[surveyId];
    if (!v) return { blocked: true, steps: [] };
    push("survey", [v]);
    break;
  }
  push("tags", tagVerticals);
  push("category", categoryVertical ? [categoryVertical] : []);
  return { blocked: false, steps };
}

export function resolveContentVertical(input: ContentVerticalInput): ContentVerticalResolution {
  if (Object.prototype.hasOwnProperty.call(input, "explicitVertical")) {
    return input.explicitVertical
      ? { source: "explicit", vertical: input.explicitVertical, verticals: [input.explicitVertical] }
      : { source: "explicit-none", vertical: null, verticals: [] };
  }
  for (const surveyId of input.surveyIds ?? []) {
    if (!(surveyId in SURVEY_AFFILIATE_MAP)) continue;
    const v = SURVEY_AFFILIATE_MAP[surveyId];
    return v
      ? { source: "survey", vertical: v, verticals: [v] }
      : { source: "survey-none", vertical: null, verticals: [] };
  }
  const byTags = verticalsFromTagKeys(input.tagKeys ?? []);
  if (byTags.length > 0) {
    return { source: "tags", vertical: byTags[0], verticals: byTags };
  }
  const byCategory = input.categoryKey ? CATEGORY_AFFILIATE_MAP[input.categoryKey] : undefined;
  if (byCategory) {
    return { source: "category", vertical: byCategory, verticals: [byCategory] };
  }
  return { source: "none", vertical: null, verticals: [] };
}
