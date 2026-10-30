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
        <div className="mt-8">
          {/* 箱は広告の枠の台帳の「ページ末の関連コンテンツ型」(本番の実測 デスクトップ 466px・モバイル 242px) */}
          <AdSenseAd
            format={CONTENT_FOOTER.format}
            slotId={CONTENT_FOOTER.slotId}
            slotBox={adSlotBox("adsense-footer")}
          />
        </div>
      )}
    </>
  );
}
