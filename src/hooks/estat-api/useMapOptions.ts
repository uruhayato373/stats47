"use client";

import { useEffect, useState } from "react";

// 型定義を直接定義
export interface MapVisualizationOptions {
  colorScheme: string;
  divergingMidpoint: "zero" | "mean" | "median" | number;
}

interface UseMapOptionsOptions {
  initialColorScheme?: string;
  initialDivergingMidpoint?: string | number;
}

export function useMapOptions({
  initialColorScheme = "interpolateBlues",
  initialDivergingMidpoint = "zero",
}: UseMapOptionsOptions = {}) {
  const [mapOptions, setMapOptions] = useState<MapVisualizationOptions>({
    colorScheme: initialColorScheme,
    divergingMidpoint: initialDivergingMidpoint as
      | "zero"
      | "mean"
      | "median"
      | number,
  });

  // 初期値が変更されたときに更新
  useEffect(() => {
    setMapOptions({
      colorScheme: initialColorScheme,
      divergingMidpoint: initialDivergingMidpoint as
        | "zero"
        | "mean"
        | "median"
        | number,
    });
  }, [initialColorScheme, initialDivergingMidpoint]);

  return {
    mapOptions,
    setMapOptions,
  };
}
