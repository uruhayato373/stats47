import { ImageResponse } from 'next/og';

import { DefaultOgp } from '@/features/ogp/DefaultOgp';
import { loadOgpFonts } from '@/features/ogp/font-loader';

export const alt = 'stats47 — 47都道府県をデータで読み解く';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 2592000; // 30d
export const dynamic = 'force-dynamic';

export default async function OGImage() {
  return new ImageResponse(<DefaultOgp />, {
    ...size,
    fonts: await loadOgpFonts(),
  });
}
