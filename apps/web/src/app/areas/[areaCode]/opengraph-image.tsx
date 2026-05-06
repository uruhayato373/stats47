import { ImageResponse } from "next/og";

import { getAreaProfileAction } from "@/features/area-profile/server";
import { AreaOgp, type AreaOgpData } from "@/features/ogp/AreaOgp";
import { loadOgpFonts } from "@/features/ogp/font-loader";

export const alt = "地域の特徴";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 604800; // 7d

export default async function OGImage({
  params,
}: {
  params: Promise<{ areaCode: string }>;
}) {
  const { areaCode } = await params;
  const profile = await getAreaProfileAction(areaCode).catch(() => null);

  const prefCode = parseInt(areaCode.slice(0, 2), 10);

  const data: AreaOgpData = {
    prefCode,
    areaName: profile?.areaName ?? "地域",
    strengths: profile?.strengths.slice(0, 2).map((s) => ({
      rank: s.rank,
      indicator: s.indicator,
    })),
    weaknesses: profile?.weaknesses.slice(0, 2).map((s) => ({
      rank: s.rank,
      indicator: s.indicator,
    })),
  };

  return new ImageResponse(<AreaOgp data={data} />, {
    ...size,
    fonts: await loadOgpFonts(),
  });
}
