import { ImageResponse } from "next/og";

import { isOk } from "@stats47/types";

import { getAreaProfileAction } from "@/features/area-profile/server";
import { AreaCatOgp, type AreaCatOgpData } from "@/features/ogp/AreaCatOgp";
import { loadOgpFonts } from "@/features/ogp/font-loader";
import { findCategoryByKey } from "@/features/category/server";

export const alt = "地域×カテゴリ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 604800; // 7d

export default async function OGImage({
  params,
}: {
  params: Promise<{ areaCode: string; categoryKey: string }>;
}) {
  const { areaCode, categoryKey } = await params;

  const [profile, category] = await Promise.all([
    getAreaProfileAction(areaCode).catch(() => null),
    findCategoryByKey(categoryKey).catch(() => null),
  ]);

  const prefCode = parseInt(areaCode.slice(0, 2), 10);
  const categoryData = category && isOk(category) ? category.data : null;

  const data: AreaCatOgpData = {
    prefCode,
    areaName: profile?.areaName ?? "地域",
    categoryName: categoryData?.categoryName ?? categoryKey,
    categoryEn: categoryKey.toUpperCase(),
  };

  return new ImageResponse(<AreaCatOgp data={data} />, {
    ...size,
    fonts: await loadOgpFonts(),
  });
}
