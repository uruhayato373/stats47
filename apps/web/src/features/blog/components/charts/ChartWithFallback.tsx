"use client";

import React, { Suspense } from "react";

import Image from "next/image";

import { ErrorBoundary } from "react-error-boundary";

interface ChartWithFallbackProps {
    fallbackImage?: string;
    alt?: string;
    children: React.ReactNode;
}

function FallbackImage({ src, alt }: { src?: string; alt?: string }) {
    if (!src) {
        return (
            <div className="flex h-64 w-full items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <p className="text-slate-500 dark:text-slate-400">チャートを表示できません</p>
            </div>
        );
    }
    return <Image src={src} alt={alt || "チャート"} width={800} height={400} className="h-auto w-full max-w-full rounded-lg" />;
}

export function ChartWithFallback({
    fallbackImage,
    alt,
    children,
}: ChartWithFallbackProps) {
    return (
        <ErrorBoundary fallback={<FallbackImage src={fallbackImage} alt={alt} />}>
            <Suspense fallback={<FallbackImage src={fallbackImage} alt={alt} />}>
                {children}
            </Suspense>
        </ErrorBoundary>
    );
}
