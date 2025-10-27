import { AreaSelectorClient } from "@/features/area/components/AreaSelectorClient";
import { fetchPrefectures } from "@/features/area/repositories/area-repository";
import { Prefecture } from "@/features/area/types";

/**
 * 地域選択ページのメインコンポーネント（Server Component）
 *
 * サーバーサイドでデータを取得し、クライアントコンポーネントに渡します。
 * これにより、SEOとパフォーマンスが向上します。
 *
 * @returns 地域選択ページのJSX要素
 */
export default async function AreaPage() {
  // サーバーサイドでデータを取得（R2から直接）
  let prefectures: Prefecture[] = [];

  try {
    prefectures = await fetchPrefectures();
  } catch (error) {
    console.error("Failed to fetch area data:", error);
    // エラーが発生しても空のデータで続行
  }

  return (
    <div className="space-y-6">
      {/* 地域選択コンポーネント（データをpropsで渡す） */}
      <AreaSelectorClient initialPrefectures={prefectures} />
    </div>
  );
}
