"use client";

import { useState, useEffect } from "react";
import { MapVisualizationOptions } from "@/components/organisms/visualization/ColorSchemeSelector";

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
