import {
    fetchPrefectures,
    PREFECTURE_TO_REGION_MAP,
    REGIONS,
} from "@stats47/area";
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuSubButton,
} from "@stats47/components/atoms/ui/sidebar";
import { hrefFor } from "@stats47/data-configs/content/href";

import Link from "@/components/atoms/SiteLink";
import { RailCard } from "@/components/surface";

interface Props {
    areaCode: string;
}

export function RelatedAreas({ areaCode }: Props) {
    const regionCode = PREFECTURE_TO_REGION_MAP[areaCode];
    if (!regionCode) return null;

    const region = REGIONS.find((r) => r.regionCode === regionCode);
    if (!region) return null;

    const prefectures = fetchPrefectures();
    const relatedPrefs = region.prefectures
        .filter((code) => code !== areaCode)
        .map((code) => {
            const pref = prefectures.find((p) => p.prefCode === code);
            return pref ? { code, name: pref.prefName } : null;
        })
        .filter(Boolean) as { code: string; name: string }[];

    if (relatedPrefs.length === 0) return null;

    // 行はテンプレートの SidebarMenu で描く。SidebarMenuButton は SidebarProvider の context を
    // 必須にするため、context を読まない Sub 版を使う。
    return (
        <RailCard title={`${region.regionName}の都道府県`} bodyClassName="p-0">
            <SidebarGroup className="p-2">
                <nav aria-label={`${region.regionName}の都道府県`}>
                    <SidebarMenu>
                        {relatedPrefs.map((pref) => (
                            <SidebarMenuItem key={pref.code}>
                                <SidebarMenuSubButton
                                    className="h-auto min-h-11 translate-x-0 py-1.5 sm:min-h-8"
                                    render={<Link href={hrefFor("area", { areaCode: pref.code })} />}
                                >
                                    <span>{pref.name}</span>
                                </SidebarMenuSubButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </nav>
            </SidebarGroup>
        </RailCard>
    );
}
