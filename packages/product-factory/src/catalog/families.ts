/**
 * ファミリー ↔ ID 先頭文字の対応と、レビュー文書との突合用の期待値。
 * レビュー: docs/04_レビュー/2026-07-18-coconala-content-monetization.md 節 A〜L。
 */
import type { ProductFamily } from "./types";

/** ID 先頭文字 → family。レビュー文書の節 A〜L と 1:1。 */
export const FAMILY_BY_LETTER: Readonly<Record<string, ProductFamily>> = {
  A: "asset",
  B: "powerpoint",
  C: "excel",
  D: "data",
  E: "industry",
  F: "government",
  G: "media",
  H: "education",
  I: "consumer",
  J: "service",
  K: "license",
  L: "entry",
} as const;

/** family → ID 先頭文字 (FAMILY_BY_LETTER の逆写像)。 */
export const LETTER_BY_FAMILY: Readonly<Record<ProductFamily, string>> = Object.freeze(
  Object.fromEntries(
    Object.entries(FAMILY_BY_LETTER).map(([letter, family]) => [family, letter]),
  ),
) as Record<ProductFamily, string>;

/**
 * レビュー文書での family 別商品数 (機械検証の期待値)。
 * 合計 174 (A18 B20 C24 D20 E16 F15 G10 H10 I9 J15 K10 L7)。
 * レビュー文書の各表を追加・削除したらここも更新し、テスト (catalog.test.ts) が
 * 実際のレビュー Markdown から抽出した ID 集合と突合して drift を検知する。
 */
export const EXPECTED_FAMILY_COUNTS: Readonly<Record<string, number>> = {
  A: 18,
  B: 20,
  C: 24,
  D: 20,
  E: 16,
  F: 15,
  G: 10,
  H: 10,
  I: 9,
  J: 15,
  K: 10,
  L: 7,
} as const;

/** レビュー文書の商品総数。 */
export const EXPECTED_TOTAL: number = Object.values(EXPECTED_FAMILY_COUNTS).reduce(
  (sum, n) => sum + n,
  0,
);

/** family の表示メタ (レビュー節への参照)。 */
export const FAMILY_META: Readonly<
  Record<ProductFamily, { readonly letter: string; readonly label: string; readonly reviewSection: string }>
> = {
  asset: { letter: "A", label: "汎用の地図・チャート素材", reviewSection: "A. 汎用の地図・チャート素材" },
  powerpoint: { letter: "B", label: "PowerPoint テンプレート", reviewSection: "B. PowerPointテンプレート" },
  excel: { letter: "C", label: "Excel テンプレート", reviewSection: "C. Excelテンプレート" },
  data: { letter: "D", label: "データ入り完成商品", reviewSection: "D. データ入り完成商品" },
  industry: { letter: "E", label: "業種・用途特化パック", reviewSection: "E. 業種・用途特化パック" },
  government: { letter: "F", label: "自治体・公務員向け商品", reviewSection: "F. 自治体・公務員向け商品" },
  media: { letter: "G", label: "メディア・クリエイター向け商品", reviewSection: "G. メディア・クリエイター向け商品" },
  education: { letter: "H", label: "教育・学習向け商品", reviewSection: "H. 教育・学習向け商品" },
  consumer: { letter: "I", label: "個人の生活意思決定向け商品", reviewSection: "I. 個人の生活意思決定向け商品" },
  service: { letter: "J", label: "サービス型商品", reviewSection: "J. サービス型商品" },
  license: { letter: "K", label: "更新・ライセンス違いの商品", reviewSection: "K. 更新・ライセンス違いの商品" },
  entry: { letter: "L", label: "無料・低価格の入口商品", reviewSection: "L. 無料・低価格の入口商品" },
} as const;

/**
 * 価格 0 を許容する family。
 * entry (L)=無料入口 / license (K)=契約形態 / service (J)=個別見積りの役務 (例 J-12「定期更新代行」)。
 */
export const ZERO_PRICE_FAMILIES: ReadonlySet<ProductFamily> = new Set<ProductFamily>([
  "entry",
  "license",
  "service",
]);

/**
 * 期待 ID 集合を family 別件数から決定的に生成する。
 * 例: A → A-01 .. A-18。並びは letter 昇順 → 連番昇順。
 */
export function expectedIds(): readonly string[] {
  const ids: string[] = [];
  for (const letter of Object.keys(EXPECTED_FAMILY_COUNTS).sort()) {
    const count = EXPECTED_FAMILY_COUNTS[letter];
    for (let n = 1; n <= count; n += 1) {
      ids.push(`${letter}-${String(n).padStart(2, "0")}`);
    }
  }
  return ids;
}
