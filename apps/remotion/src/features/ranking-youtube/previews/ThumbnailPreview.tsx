import { type RankingEntry, type RankingMeta, type ThemeName, resolveRankingData } from "@/shared";
import { ThumbHookMap } from "../ThumbHookMap";
import { ThumbVsSplit } from "../ThumbVsSplit";
import React from "react";

/** プレビューで表示するサムネイルの種類 */
type ThumbnailType = "hero" | "vs";

interface ThumbnailPreviewProps {
  variant?: ThumbnailType;
  theme?: ThemeName;
  meta?: RankingMeta;
  allEntries?: RankingEntry[];
  /** サムネイル用短縮タイトル（displayTitle から渡す） */
  displayTitle?: string;
  /** フックテキスト（15文字以内、サムネイルのメイン文字） */
  hookText?: string;
}

/**
 * YouTubeサムネイルのプレビュー用コンポジション
 *
 * Remotion Studio の Props パネルから variant を切り替えて確認できる。
 */
export const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({
  variant = "hero",
  theme = "dark",
  meta,
  allEntries,
  displayTitle,
  hookText,
}) => {
  const { meta: resolved, entries } = resolveRankingData({ meta, allEntries });
  const top1 = entries[0];
  const last = [...entries].sort((a, b) => a.rank - b.rank).pop() || entries[0];

  if (variant === "vs") {
    return (
      <ThumbVsSplit
        title={displayTitle || `${resolved.title}ランキング`}
        left={{
          areaName: top1.areaName,
          value: top1.value.toLocaleString(),
          unit: resolved.unit,
          rank: top1.rank,
        }}
        right={{
          areaName: last.areaName,
          value: last.value.toLocaleString(),
          unit: resolved.unit,
          rank: last.rank,
        }}
        theme={theme}
      />
    );
  }

  // サブタイトル構築
  const subtitleParts: string[] = [];
  subtitleParts.push(`${resolved.yearName || "最新"} 都道府県ランキング`);
  if (resolved.subtitle) subtitleParts.push(resolved.subtitle);

  return (
    <ThumbHookMap
      hookText={hookText || resolved.title}
      title={hookText ? (displayTitle || resolved.title) : ""}
      subtitle={subtitleParts.join("・")}
      entries={entries}
      theme={theme}
    />
  );
};
