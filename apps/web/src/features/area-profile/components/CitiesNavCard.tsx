import Link from "next/link";

import { fetchCities } from "@stats47/area";

import { SurfaceCard } from "@/components/surface";

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
    <SurfaceCard className="p-0">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-base font-semibold">
          {areaName}の市区町村
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {cities.length} 件
          </span>
        </h3>
      </div>
      <div className="px-4 pb-4 pt-4">
        <nav
          className={`grid grid-cols-2 gap-x-2 gap-y-0.5 overflow-y-auto sm:grid-cols-3 md:grid-cols-4 ${maxHeightClassName}`}
        >
          {cities.map((city) => {
            const isActive = city.cityCode === activeCityCode;
            return (
              <Link
                key={city.cityCode}
                href={`/areas/${areaCode}/cities/${city.cityCode}`}
                className={
                  "rounded-md px-2 py-1.5 text-xs transition-colors " +
                  (isActive
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-foreground/80 hover:bg-accent/50")
                }
              >
                {city.cityName}
              </Link>
            );
          })}
        </nav>
      </div>
    </SurfaceCard>
  );
}
