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
      <CitiesNavCard
        areaCode={areaCode}
        areaName={prefName}
        activeCityCode={activeCityCode}
      />
      <AreaBannerAd />
      <FurusatoNozeiCard areaCode={areaCode} position="city-furusato-content" layout="content" />
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
    </>
  );
}
