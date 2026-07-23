import { MapPin } from "lucide-react";

import { PortalNavCard } from "./PortalNavCard";

/**
 * 「都道府県から探す」= `/areas` への軽量な単一入口 (仕様 §10)。
 * home に 47 県一覧を複製せず、重い D3 地図も読まない。県選択の本体は `/areas` が担う。
 */
export function PortalAreaEntry() {
  return (
    <PortalNavCard
      href="/areas"
      label="都道府県から探す"
      description="47都道府県の全国順位・地域の強み弱みを、検索・地方別一覧・タイル地図から確認できます。"
      icon={<MapPin className="h-5 w-5" />}
      surface="home_area"
    />
  );
}
