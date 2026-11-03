import { AdCell } from "@/features/ads";
import { AreaBannerAd, FurusatoNozeiCard } from "@/features/ads/server";

import { adSlotBox } from "@/lib/ad-placements";
import {
  ADSENSE_DISPLAY_ENABLED,
  AdSenseAd,
  CONTENT_FOOTER,
} from "@/lib/google-adsense";

import { CitiesNavCard } from "./CitiesNavCard";

interface CityPageFooterProps {
  areaCode: string;
  prefName: string;
  activeCityCode: string;
}

export function CityPageFooter({
  areaCode,
  prefName,
  activeCityCode,
}: CityPageFooterProps) {
  return (
    <>
      {/* AdSense は市区町村の一覧の前に置き、後ろの PR (県のバナー・返礼品) と隣り合わせにしない (2026-11-03) */}
      {ADSENSE_DISPLAY_ENABLED && (
        // 本文の広告のセル。箱は広告の枠の台帳の「ページ末の関連コンテンツ型」(デスクトップ 780×466 を上限に中央・モバイル 242px)
        <AdCell label="広告">
          <AdSenseAd
            format={CONTENT_FOOTER.format}
            slotId={CONTENT_FOOTER.slotId}
            showLabel={false}
            slotBox={adSlotBox("adsense-footer")}
          />
        </AdCell>
      )}
      <CitiesNavCard
        areaCode={areaCode}
        areaName={prefName}
        activeCityCode={activeCityCode}
      />
      <AreaBannerAd />
      <FurusatoNozeiCard areaCode={areaCode} position="city-furusato-content" layout="content" />
    </>
  );
}
