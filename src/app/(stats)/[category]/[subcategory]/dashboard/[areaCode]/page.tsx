import { DynamicDashboard } from "@/components/organisms/dashboard/DynamicDashboard";
import { MunicipalityDashboard } from "@/components/organisms/dashboard/MunicipalityDashboard";
import { PrefectureMap } from "@/components/PrefectureMap";

import { determineAreaType } from "@/features/area";

/**
 * 地域詳細ページのProps型定義
 */
interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
    areaCode: string;
  }>;
}

/**
 * 地域詳細ページのメインコンポーネント
 *
 * 特定の地域コードの詳細ダッシュボードを表示します。
 * 地域コードから地域タイプを自動判定し、適切なダッシュボードを表示します。
 *
 * @param props - コンポーネントのProps
 * @returns 地域詳細ページのJSX要素
 */
export default async function Page({ params }: PageProps) {
  const { subcategory, areaCode } = await params;
  // categoryパラメータは削除（未使用のため）
  // const { /* category, */ subcategory, areaCode } = await params;

  // 地域コードから地域タイプを判定
  const areaType = determineAreaType(areaCode);

  // ダッシュボードコンポーネントを選択
  const renderDashboard = () => {
    if (areaType === "national") {
      return (
        <>
          <PrefectureMap areaCode="00000" width={500} height={500} />
          <DynamicDashboard
            subcategoryId={subcategory}
            areaCode={areaCode}
            areaType={areaType}
          />
        </>
      );
    } else if (areaType === "prefecture") {
      return (
        <>
          <PrefectureMap areaCode={areaCode} width={500} height={500} />
          <DynamicDashboard
            subcategoryId={subcategory}
            areaCode={areaCode}
            areaType={areaType}
          />
        </>
      );
    } else {
      return <MunicipalityDashboard areaCode={areaCode} />;
    }
  };

  return <div>{renderDashboard()}</div>;
}
