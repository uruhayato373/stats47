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
 */
export function ThemeAwareImage({
  lightSrc,
  darkSrc,
  alt,
  ...props
}: ThemeAwareImageProps) {
  const { resolvedTheme } = useTheme();
  const src = resolvedTheme === "dark" ? darkSrc : lightSrc;

  return <Image src={src} alt={alt} {...props} />;
}
