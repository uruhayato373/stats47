import { ImageResponse } from "next/og";

import { isOk } from "@stats47/types";

import { findCategoryByKey } from "@/features/category/server";
import { CategoryOgp, type CategoryOgpData } from "@/features/ogp/CategoryOgp";
import { loadOgpFonts } from "@/features/ogp/font-loader";

export const alt = "カテゴリ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 604800; // 7d

export default async function OGImage({
  params,
}: {
  params: Promise<{ categoryKey: string }>;
}) {
  const { categoryKey } = await params;

  const categoryResult = await findCategoryByKey(categoryKey).catch(() => null);
  const category = categoryResult && isOk(categoryResult) ? categoryResult.data : null;

  const data: CategoryOgpData = {
    title: category?.categoryName ?? categoryKey,
    titleEn: categoryKey.toUpperCase(),
    indicatorCount: null,
  };

  return new ImageResponse(<CategoryOgp data={data} />, {
    ...size,
    fonts: await loadOgpFonts(),
  });
}
