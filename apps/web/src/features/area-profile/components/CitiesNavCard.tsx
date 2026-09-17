import { fetchCities } from "@stats47/area";

import { RailNavRow, SectionCard } from "@/components/surface";

interface CitiesNavCardProps {
  areaCode: string;
  areaName: string;
  /** カードの最大高さクラス (デフォルト max-h-72) */
  maxHeightClassName?: string;
  /** ハイライト表示する市区町村コード (現在ページに対応) */
  activeCityCode?: string;
}

/**
 * 都道府県内の市区町村ナビゲーションカード。
 *
 * サイドバーがデフォルト閉じになったため、main column にも配置するための共通コンポーネント。
 */
export function CitiesNavCard({
  areaCode,
  areaName,
  maxHeightClassName = "max-h-72",
  activeCityCode,
}: CitiesNavCardProps) {
  const cities = fetchCities().filter((c) => c.prefCode === areaCode);
  if (cities.length === 0) return null;

  return (
    <SectionCard
      title={
        <>
          {areaName}の市区町村
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {cities.length} 件
          </span>
        </>
      }
    >
      <nav
        className={`grid grid-cols-2 gap-x-2 gap-y-0.5 overflow-y-auto sm:grid-cols-3 md:grid-cols-4 ${maxHeightClassName}`}
      >
        {cities.map((city) => {
          const isActive = city.cityCode === activeCityCode;
          return (
            <RailNavRow
              key={city.cityCode}
              href={`/areas/${areaCode}/cities/${city.cityCode}`}
              active={isActive}
              chevron={false}
            >
              {city.cityName}
            </RailNavRow>
          );
        })}
      </nav>
    </SectionCard>
  );
}
