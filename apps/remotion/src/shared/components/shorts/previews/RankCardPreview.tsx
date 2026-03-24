import {
  computePrefectureSilhouette,
  type PrefectureSilhouette,
  type RankingEntry,
  type RankingMeta,
  type ThemeName,
  resolveRankingData,
} from "@/shared";
import { RankCard } from "../RankCard";
import React, { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import type { Topology } from "topojson-specification";

interface RankCardPreviewProps {
  title?: string;
  rank?: number;
  theme?: ThemeName;
  meta?: RankingMeta;
  allEntries?: RankingEntry[];
  totalCount?: number;
  showSafeAreas?: boolean;
}

/**
 * ランクカードのプレビュー用コンポジション
 */
export const RankCardPreview: React.FC<RankCardPreviewProps> = ({
  title,
  rank = 1,
  theme = "dark",
  meta,
  allEntries,
  totalCount,
  showSafeAreas = false,
}) => {
  const { meta: resolved, entries } = resolveRankingData({ meta, allEntries });
  const data = entries.find(e => e.rank === rank) || entries[0];

  const [handle] = useState(() => delayRender("Loading TopoJSON for silhouette"));
  const [silhouette, setSilhouette] = useState<PrefectureSilhouette | undefined>();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const url = staticFile("prefecture.topojson");
        const res = await fetch(url);
        const topology = (await res.json()) as Topology;

        if (cancelled) return;

        const sil = computePrefectureSilhouette(topology, data.areaCode);
        setSilhouette(sil ?? undefined);
        continueRender(handle);
      } catch (err) {
        console.error("Failed to load TopoJSON for silhouette:", err);
        continueRender(handle);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [data.areaCode, handle]);

  return (
    <RankCard
      title={title || resolved.title}
      rank={rank}
      areaName={data.areaName}
      value={data.value}
      unit={resolved.unit}
      totalCount={totalCount || entries.length}
      theme={theme}
      showSafeAreas={showSafeAreas}
      prefSilhouette={silhouette}
    />
  );
};
