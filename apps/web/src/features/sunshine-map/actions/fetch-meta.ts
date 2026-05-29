"use server";

import {
  loadSunshineMapMeta,
  type SunshineMapMeta,
} from "@/features/sunshine-map/server";

/**
 * 日照地図メタ (凡例・値域・メッシュ数) を取得する server action。
 *
 * 旧 /gis-cross/sunshine-map の page.tsx が server で行っていた読み込みを、
 * 気候テーマ section (client + IntersectionObserver lazy) から呼べるよう action 化したもの。
 * raster.png 自体は SunshineMapLeaflet が NEXT_PUBLIC_R2_PUBLIC_URL から直接読み込む。
 */
export async function fetchSunshineMapMeta(): Promise<SunshineMapMeta | null> {
  return loadSunshineMapMeta();
}
