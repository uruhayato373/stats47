"use client";

import Image from "next/image";
import { cn } from "@stats47/components";
import { useState } from "react";

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
 * ランキングのサムネイル画像を表示するクライアントコンポーネント
 * 画像の読み込み失敗をハンドリングします。
 * baseSrcを指定することで、CSSレベルでのdark/light切替を自動で行います。
 * Tailwind の class-based dark mode に対応（dark: クラスで切替）。
 */
export function RankingThumbnail({ baseSrc, lightSrc, darkSrc, src, alt, className }: RankingThumbnailProps) {
    const [error, setError] = useState(false);

    const resolvedLight = lightSrc || (baseSrc ? `${baseSrc}-light.png` : src);
    const resolvedDark = darkSrc || (baseSrc ? `${baseSrc}-dark.png` : undefined);

    if (error || (!resolvedLight && !resolvedDark)) {
        return <div className={cn("bg-muted w-full h-full flex items-center justify-center text-muted-foreground/50 text-[10px]", className)}>No Image</div>;
    }

    const imgClassName = cn(
        "object-cover w-full h-full transition-transform duration-500 group-hover:scale-105",
        className
    );

    if (resolvedDark && resolvedLight) {
        return (
            <>
                <Image
                    src={resolvedLight}
                    alt={alt}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className={cn(imgClassName, "dark:hidden")}
                    onError={() => setError(true)}
                    unoptimized
                />
                <Image
                    src={resolvedDark}
                    alt={alt}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className={cn(imgClassName, "hidden dark:block")}
                    onError={() => setError(true)}
                    unoptimized
                />
            </>
        );
    }

    return (
        <Image
            src={resolvedLight || resolvedDark || ""}
            alt={alt}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={imgClassName}
            onError={() => setError(true)}
            unoptimized
        />
    );
}
