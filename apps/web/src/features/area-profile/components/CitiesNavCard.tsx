import { municipalityLeafName } from "@stats47/ranking";

import { RailNavRow, SectionCard } from "@/components/surface";

import { listPublishableCitiesInPrefecture } from "../constants/publishable-cities";

/** 最初から並べる件数。旧版の固定の高さ (4 列 × 約 10 行) と同じ量。超える県だけ残りを「すべて見る」で開く */
const VISIBLE_CITIES = 40;

interface CitiesNavCardProps {
  areaCode: string;
  areaName: string;
  /** ハイライト表示する市区町村コード (現在ページに対応) */
  activeCityCode?: string;
}

/**
 * 都道府県内の市区町村ナビゲーションカード。
 *
 * サイドバーがデフォルト閉じになったため、main column にも配置するための共通コンポーネント。
 * 並べるのは市区町村ページの公開対象 (東京は 23 区を区ごとに並べ、「特別区部」の集約行は出さない)。
 * 固定の高さでスクロールさせると続きがあると気づけない (北海道 179 件で顕著) ため、
 * 先頭だけ並べて残りは <details> で開く。現在の市区町村が残り側にあるときは最初から開いておく。
 */
export function CitiesNavCard({
  areaCode,
  areaName,
  activeCityCode,
}: CitiesNavCardProps) {
  const cities = listPublishableCitiesInPrefecture(areaCode);
  if (cities.length === 0) return null;

  const visible = cities.slice(0, VISIBLE_CITIES);
  const hidden = cities.slice(VISIBLE_CITIES);
  const activeInHidden = hidden.some((city) => city.code === activeCityCode);

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
      <nav aria-label={`${areaName}の市区町村`}>
        <CityGrid cities={visible} areaCode={areaCode} activeCityCode={activeCityCode} />
        {hidden.length > 0 && (
          <details open={activeInHidden} className="mt-1 border-t border-dashed border-border">
            <summary className="cursor-pointer py-2 text-[11.5px] text-primary hover:underline">
              すべて見る（残り {hidden.length} 件）
            </summary>
            <CityGrid cities={hidden} areaCode={areaCode} activeCityCode={activeCityCode} />
          </details>
        )}
      </nav>
    </SectionCard>
  );
}

function CityGrid({
  cities,
  areaCode,
  activeCityCode,
}: {
  cities: ReturnType<typeof listPublishableCitiesInPrefecture>;
  areaCode: string;
  activeCityCode?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 sm:grid-cols-3 md:grid-cols-4">
      {cities.map((city) => (
        <RailNavRow
          key={city.code}
          href={`/areas/${areaCode}/cities/${city.code}`}
          active={city.code === activeCityCode}
          chevron={false}
        >
          {municipalityLeafName(city.name)}
        </RailNavRow>
      ))}
    </div>
  );
}
