"use client";

import { useState } from "react";

import { cn } from "@stats47/components";

import { ThemeAwareImage } from "@/components/atoms/ThemeAwareImage";

interface RankingThumbnailProps {
    /** オプション: ベースとなる画像パス（拡張子とテーマサフィックスを除く） */
    baseSrc?: string;
    /** オプション: 個別のライトテーマ用画像パス */
    lightSrc?: string;
    /** オプション: 個別のダークテーマ用画像パス */
    darkSrc?: string;
    /** 直接画像パスを指定する場合（従来の src と互換用・優先度低） */
    src?: string;
    alt: string;
    className?: string;
}

/**
 * ランキングのサムネイル画像を表示するクライアントコンポーネント。
 * ThemeAwareImage を利用して light/dark を CSS hidden ではなく
 * 1 枚だけ描画する（二重ダウンロード防止）。
 * baseSrc を指定すると -light.png / -dark.png を自動解決する。
 */
export function RankingThumbnail({ baseSrc, lightSrc, darkSrc, src, alt, className }: RankingThumbnailProps) {
    const [error, setError] = useState(false);

    const resolvedLight = lightSrc || (baseSrc ? `${baseSrc}-light.png` : src);
    const resolvedDark = darkSrc || (baseSrc ? `${baseSrc}-dark.png` : undefined);

    if (error || (!resolvedLight && !resolvedDark)) {
        return (
            <div className={cn("bg-muted w-full h-full flex items-center justify-center text-muted-foreground/50 text-[10px]", className)}>
                No Image
            </div>
        );
    }

    const imgClass = cn(
        "object-cover w-full h-full transition-transform duration-300 group-hover:scale-105",
        className
    );

    if (resolvedDark && resolvedLight) {
        // ThemeAwareImage: 1 枚だけ描画（dark/light を CSS hidden で重複させない）
        return (
            <ThemeAwareImage
                lightSrc={resolvedLight}
                darkSrc={resolvedDark}
                alt={alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className={imgClass}
                onError={() => setError(true)}
            />
        );
    }

    // single source（dark なし）
    return (
        <ThemeAwareImage
            lightSrc={resolvedLight || resolvedDark || ""}
            darkSrc={resolvedLight || resolvedDark || ""}
            alt={alt}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={imgClass}
            onError={() => setError(true)}
        />
    );
}
