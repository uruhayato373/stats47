"use client";

import Image, { type ImageProps } from "next/image";

import { useTheme } from "next-themes";

interface ThemeAwareImageProps extends Omit<ImageProps, "src"> {
  lightSrc: string;
  darkSrc: string;
}

/**
 * テーマに応じて light/dark 画像を1枚だけレンダリングする。
 * CSS hidden/block による二重読み込みを防止。
 *
 * SSR 時は resolvedTheme が undefined のため lightSrc にフォールバック。
 * hydration 後にテーマが確定し dark の場合は darkSrc に切り替わる。
 * suppressHydrationWarning で hydration mismatch 警告を抑制。
 * Cloudflare Workers では /_next/image が利用不可のため unoptimized で直接配信。
 *
 * CLS 防止: このコンポーネントを fill で使う場合は必ず実画像の生成契約と同じ
 * aspect-ratio でロックした `relative` コンテナ内に配置すること
 * (ブログは 1200×630、ranking カードは 640×360)。
 * `sizes` prop も呼び出し元で必ず指定することで不要な帯域を削減できる。
 */
export function ThemeAwareImage({
  lightSrc,
  darkSrc,
  alt,
  ...props
}: ThemeAwareImageProps) {
  const { resolvedTheme } = useTheme();
  const src = resolvedTheme === "dark" ? darkSrc : lightSrc;

  return <Image src={src} alt={alt} unoptimized suppressHydrationWarning {...props} />;
}
