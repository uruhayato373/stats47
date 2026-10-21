import { municipalityLeafName } from "@stats47/ranking";

import { RailNavRow, SectionCard } from "@/components/surface";

import { listPublishableCitiesInPrefecture } from "../constants/publishable-cities";

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
 * 並べるのは市区町村ページの公開対象 (東京は 23 区を区ごとに並べ、「特別区部」の集約行は出さない)。
 */
export function CitiesNavCard({
  areaCode,
  areaName,
  maxHeightClassName = "max-h-72",
  activeCityCode,
}: CitiesNavCardProps) {
  const cities = listPublishableCitiesInPrefecture(areaCode);
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
          const isActive = city.code === activeCityCode;
          return (
            <RailNavRow
              key={city.code}
              href={`/areas/${areaCode}/cities/${city.code}`}
              active={isActive}
              chevron={false}
            >
              {municipalityLeafName(city.name)}
            </RailNavRow>
          );
        })}
      </nav>
    </SectionCard>
  );
}
