"use client";

import React, { Suspense } from "react";

import Image from "next/image";

import { ErrorBoundary } from "react-error-boundary";

import { ChartErrorState } from "@/components/charts/ChartState";

interface ChartWithFallbackProps {
    fallbackImage?: string;
    alt?: string;
    children: React.ReactNode;
}

function FallbackImage({ src, alt }: { src?: string; alt?: string }) {
    if (!src) {
        return <ChartErrorState message="チャートを表示できません" height={256} />;
    }
    return <Image src={src} alt={alt || "チャート"} width={800} height={400} className="h-auto w-full max-w-full" />;
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
