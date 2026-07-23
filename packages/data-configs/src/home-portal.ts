/**
 * ホームポータル (`/`) の編集キュレーション設定 (SSOT)。
 *
 * 正典: docs/02_実装計画/38_ポータル型ホーム・ヘッダー再設計仕様.md §8-9
 *
 * - category / theme / ranking の分類 SSOT は変更しない。ここは「home で見せる代表項目と順番」だけを
 *   型付き git TS で curate する (page.tsx へ配列を散らさない)。
 * - `categoryKey` は `CATEGORIES` (categories.ts) に実在する 17 軸のいずれか。表示 label だけ平易化する。
 * - `themeKey` は `ALL_THEMES` に実在する theme。存在検証は循環 import 回避のため
 *   `validateHomePortal(themeKeys)` に注入する (validateHomeFeaturedRankings と同じ流儀)。
 * - popular term は手書きの流行語ではなく、既存の主要 category/theme と検索需要から選ぶ。
 * - JSON / D1 の新 SSOT を作らない。runtime LLM 分類を入れない。
 */

import { CATEGORIES } from "./categories";

/** home「カテゴリから探す」の代表カテゴリ。href は `/category/<categoryKey>` を導出。 */
export interface HomePortalCategory {
  /** CATEGORIES に実在する categoryKey (17 軸)。 */
  categoryKey: string;
  /** home 表示用の平易な label (正式 categoryName を短縮してよい)。 */
  label: string;
  /** 表示順 (1 始まり連番)。 */
  order: number;
}

/** home「知りたいことから探す」= theme を利用意図へ翻訳した curated use case。 */
export interface HomePortalUseCase {
  /** 一意な id (kebab-case)。 */
  id: string;
  /** 利用意図の表示文 (例: 移住先を比較したい)。 */
  label: string;
  /** 1 行補足説明。 */
  description: string;
  /** ALL_THEMES に実在する themeKey。href は `/themes/<themeKey>` を導出。 */
  themeKey: string;
  /** 表示順 (1 始まり連番)。 */
  order: number;
  /** 掲載可否。 */
  isActive: boolean;
}

/** home 冒頭の人気検索キーワード。href は `/search?q=<encoded>` を導出。 */
export interface HomePortalTerm {
  term: string;
}

/**
 * カテゴリから探す (代表 8 件)。正式 categoryKey は変えず label のみ平易化。
 * href = `/category/<categoryKey>`。
 */
export const HOME_PORTAL_CATEGORIES: readonly HomePortalCategory[] = [
  { categoryKey: "population", label: "人口・世帯", order: 1 },
  { categoryKey: "laborwage", label: "仕事・年収", order: 2 },
  { categoryKey: "economy", label: "経済・家計", order: 3 },
  { categoryKey: "construction", label: "暮らし・住宅", order: 4 },
  { categoryKey: "socialsecurity", label: "医療・福祉", order: 5 },
  { categoryKey: "educationsports", label: "教育・文化", order: 6 },
  { categoryKey: "tourism", label: "運輸・観光", order: 7 },
  { categoryKey: "safetyenvironment", label: "安全・環境", order: 8 },
];

/**
 * 知りたいことから探す (代表 6 件)。theme を利用意図へ翻訳。
 * href = `/themes/<themeKey>`。themeKey は ALL_THEMES 実在キーのみ。
 */
export const HOME_PORTAL_USE_CASES: readonly HomePortalUseCase[] = [
  {
    id: "migration",
    label: "移住先を比較したい",
    description: "人口移動・転入超過から住みやすい地域を探す",
    themeKey: "population-dynamics",
    order: 1,
    isActive: true,
  },
  {
    id: "childcare-education",
    label: "子育て・教育で選びたい",
    description: "教育環境や文化資源を都道府県で比較する",
    themeKey: "education-culture",
    order: 2,
    isActive: true,
  },
  {
    id: "income-cost",
    label: "年収と物価を比べたい",
    description: "名目と実質の所得・購買力の地域差を見る",
    themeKey: "real-income",
    order: 3,
    isActive: true,
  },
  {
    id: "aging",
    label: "高齢化の実態を知りたい",
    description: "高齢化率と社会構造の変化を地域で確かめる",
    themeKey: "aging-society",
    order: 4,
    isActive: true,
  },
  {
    id: "healthcare",
    label: "医療環境を確かめたい",
    description: "医療提供体制や健康指標を都道府県で比較する",
    themeKey: "healthcare",
    order: 5,
    isActive: true,
  },
  {
    id: "local-economy",
    label: "地域経済を比較したい",
    description: "産業構造や経済活動の地域差を読み解く",
    themeKey: "local-economy",
    order: 6,
    isActive: true,
  },
];

/** 人気検索キーワード (home 冒頭)。href = `/search?q=<encoded>`。 */
export const HOME_PORTAL_TERMS: readonly HomePortalTerm[] = [
  { term: "人口減少" },
  { term: "年収" },
  { term: "出生率" },
  { term: "移住" },
  { term: "医療" },
  { term: "観光" },
];

/** home 表示件数の上限 (過密防止)。 */
export const HOME_PORTAL_LIMITS = {
  categories: 8,
  useCases: 8,
  terms: 8,
} as const;

/**
 * ホームポータル設定の決定的 validation。build/test 時に呼び、違反理由の配列を返す (空 = 妥当)。
 *
 * @param themeKeys ALL_THEMES に実在する themeKey の集合 (循環 import 回避のため注入)。
 * @param input 検証対象 (既定はモジュール定数)。テストで不正データを渡して reject を確認できる。
 */
export function validateHomePortal(
  themeKeys: ReadonlySet<string>,
  input?: {
    categories?: readonly HomePortalCategory[];
    useCases?: readonly HomePortalUseCase[];
    terms?: readonly HomePortalTerm[];
  },
): string[] {
  const categories = input?.categories ?? HOME_PORTAL_CATEGORIES;
  const useCases = input?.useCases ?? HOME_PORTAL_USE_CASES;
  const terms = input?.terms ?? HOME_PORTAL_TERMS;
  const errors: string[] = [];
  const categoryKeys = new Set(CATEGORIES.map((c) => c.categoryKey));

  // --- categories ---
  if (categories.length === 0) {
    errors.push("HOME_PORTAL_CATEGORIES が空");
  }
  if (categories.length > HOME_PORTAL_LIMITS.categories) {
    errors.push(
      `categories が上限 ${HOME_PORTAL_LIMITS.categories} 超: ${categories.length}`,
    );
  }
  const seenCatKey = new Set<string>();
  const seenCatOrder = new Set<number>();
  for (const c of categories) {
    if (!categoryKeys.has(c.categoryKey)) {
      errors.push(`categoryKey が CATEGORIES に不在: ${c.categoryKey}`);
    }
    if (seenCatKey.has(c.categoryKey)) errors.push(`categoryKey 重複: ${c.categoryKey}`);
    seenCatKey.add(c.categoryKey);
    if (seenCatOrder.has(c.order)) errors.push(`category order 重複: ${c.order}`);
    seenCatOrder.add(c.order);
    if (c.label.trim() === "") errors.push(`category label が空: ${c.categoryKey}`);
  }
  assertSequential(
    categories.map((c) => c.order),
    "category",
    errors,
  );

  // --- use cases ---
  const activeUseCases = useCases.filter((u) => u.isActive);
  if (activeUseCases.length === 0) errors.push("active な use case が無い");
  if (activeUseCases.length > HOME_PORTAL_LIMITS.useCases) {
    errors.push(
      `active use case が上限 ${HOME_PORTAL_LIMITS.useCases} 超: ${activeUseCases.length}`,
    );
  }
  const seenUseId = new Set<string>();
  const seenUseHref = new Set<string>();
  const seenUseOrder = new Set<number>();
  for (const u of useCases) {
    if (seenUseId.has(u.id)) errors.push(`use case id 重複: ${u.id}`);
    seenUseId.add(u.id);
    if (!themeKeys.has(u.themeKey)) {
      errors.push(`themeKey が ALL_THEMES に不在: ${u.id} (${u.themeKey})`);
    }
    const href = `/themes/${u.themeKey}`;
    if (seenUseHref.has(href)) errors.push(`use case href 重複: ${href}`);
    seenUseHref.add(href);
    if (seenUseOrder.has(u.order)) errors.push(`use case order 重複: ${u.order}`);
    seenUseOrder.add(u.order);
    if (u.label.trim() === "") errors.push(`use case label が空: ${u.id}`);
  }
  assertSequential(
    useCases.map((u) => u.order),
    "use case",
    errors,
  );

  // --- popular terms ---
  if (terms.length === 0) errors.push("HOME_PORTAL_TERMS が空");
  if (terms.length > HOME_PORTAL_LIMITS.terms) {
    errors.push(`terms が上限 ${HOME_PORTAL_LIMITS.terms} 超: ${terms.length}`);
  }
  const seenTerm = new Set<string>();
  for (const t of terms) {
    if (t.term.trim() === "") errors.push("popular term が空文字");
    if (seenTerm.has(t.term)) errors.push(`popular term 重複: ${t.term}`);
    seenTerm.add(t.term);
  }

  return errors;
}

/** order が 1 始まりの連番であることを検証。 */
function assertSequential(orders: number[], label: string, errors: string[]): void {
  const sorted = [...orders].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== i + 1) {
      errors.push(`${label} order が 1 始まりの連番でない: ${sorted.join(",")}`);
      break;
    }
  }
}
