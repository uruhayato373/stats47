import { SubcategoryRankingPage } from "@/components/templates/SubcategoryRankingPage";
import { RankingService } from "@/lib/ranking/ranking-service";
import { validateSubcategoryOrThrow } from "@/lib/taxonomy/category";
import { redirect } from "next/navigation";

/**
 * ランキングページのProps型定義
 */
interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
}

/**
 * ランキング統計データ表示ページ
 *
 * このページは、特定のカテゴリとサブカテゴリの統計データを
 * 都道府県別ランキングとして表示します。
 *
 * ルート構造: /[category]/[subcategory]/ranking
 * 例: /population/basic-population/ranking (総人口の都道府県ランキング)
 * 例: /laborwage/wages-working-conditions/ranking (賃金の都道府県ランキング)
 *
 * デフォルトランキングキーが設定されている場合は、そのランキング項目にリダイレクトします。
 *
 * @param props - ページのProps
 * @param props.params - 動的ルートパラメータ
 *   - category: カテゴリID (例: "population", "laborwage")
 *   - subcategory: サブカテゴリID (例: "basic-population", "wages-working-conditions")
 *
 * @returns ランキング統計データ表示コンポーネント
 *
 * @throws {notFound} カテゴリまたはサブカテゴリが存在しない場合
 *
 * @example
 * // 総人口の都道府県ランキングを表示
 * <RankingPage
 *   params={{category: "population", subcategory: "basic-population"}}
 * />
 *
 * @example
 * // 賃金の都道府県ランキングを表示
 * <RankingPage
 *   params={{category: "laborwage", subcategory: "wages-working-conditions"}}
 * />
 *
 * @since 2.0.0
 * @version 2.1.0
 */
export default async function RankingPage({ params }: PageProps) {
  // 動的ルートパラメータを取得
  const { category: categoryId, subcategory: subcategoryId } = await params;

  // サブカテゴリのバリデーション（無効な場合は404エラーを発生）
  const subcategoryData = validateSubcategoryOrThrow(categoryId, subcategoryId);

  // デフォルトランキングキーを取得
  const defaultRankingKey = await RankingService.getDefaultRankingKey(
    subcategoryId
  );

  // デフォルトランキングキーが存在する場合はリダイレクト
  if (defaultRankingKey) {
    redirect(`/${categoryId}/${subcategoryId}/ranking/${defaultRankingKey}`);
  }

  // サブカテゴリランキングページコンポーネントをレンダリング
  // CategoryDataとの型互換性のため必須フィールドにデフォルト値を設定
  return (
    <SubcategoryRankingPage
      category={{
        ...subcategoryData.category,
        description: subcategoryData.category.description || "",
        icon: subcategoryData.category.icon || "",
        displayOrder: subcategoryData.category.displayOrder || 0,
        subcategories: (subcategoryData.category.subcategories || []) as any,
      }}
      subcategory={subcategoryData.subcategory as any}
    />
  );
}
