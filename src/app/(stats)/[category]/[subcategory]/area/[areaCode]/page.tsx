import {
  MunicipalityDashboard,
  NationalDashboard,
  PrefectureDashboard,
} from "@/components/organisms/area";

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
export default async function AreaDetailPage({ params }: PageProps) {
  const { category, subcategory, areaCode } = await params;

  // 地域コードから地域タイプを判定
  const getAreaType = (
    code: string
  ): "country" | "prefecture" | "municipality" => {
    if (code === "00000") return "country";
    if (code.endsWith("000")) return "prefecture";
    return "municipality";
  };

  const areaType = getAreaType(areaCode);

  // ダッシュボードコンポーネントを選択
  const renderDashboard = () => {
    if (areaType === "country") {
      return <NationalDashboard areaCode={areaCode} />;
    } else if (areaType === "prefecture") {
      return <PrefectureDashboard areaCode={areaCode} />;
    } else {
      return <MunicipalityDashboard areaCode={areaCode} />;
    }
  };

  return <div>{renderDashboard()}</div>;
}
