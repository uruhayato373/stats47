import { AreaBannerAd, FurusatoNozeiCard } from "@/features/ads/server";

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
      <FurusatoNozeiCard areaCode={areaCode} />
      {ADSENSE_DISPLAY_ENABLED && (
        <div className="mt-8">
          <AdSenseAd format={CONTENT_FOOTER.format} slotId={CONTENT_FOOTER.slotId} />
        </div>
      )}
    </>
  );
}
