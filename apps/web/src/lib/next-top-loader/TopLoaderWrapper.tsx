"use client";

import dynamic from "next/dynamic";

import { nextTopLoaderConfig } from "./config";

/**
 * NextTopLoader の Client Component ラッパー。
 * layout.tsx (Server Component) から ssr:false dynamic を使えないため分離。
 * ルート遷移時の進捗バーのみ担当し、初回バンドルには含まれない。
 */
const NextTopLoaderDynamic = dynamic(() => import("nextjs-toploader"), {
  ssr: false,
});

export function TopLoaderWrapper() {
  return <NextTopLoaderDynamic {...nextTopLoaderConfig} />;
}
