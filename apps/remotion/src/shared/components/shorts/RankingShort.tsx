import React, { useEffect, useMemo, useState } from "react";
import { Audio, Sequence, continueRender, delayRender, staticFile } from "remotion";
import type { Topology } from "topojson-specification";

import {
  RankingTable,
  ReelLastPage,
  SafetyZoneOverlay,
  computePrefectureSilhouette,
  type PrefectureSilhouette,
  type RankingEntry,
  type RankingMeta,
  type ThemeName,
} from "@/shared";
import { SCENE_DURATION } from "@/utils/constants";
import { resolveRankingData } from "@/shared/utils/mock-data";
import { TileGridMapScene } from "../maps/TileGridMapScene";
import { RankCard } from "./RankCard";
import { RankingTitle } from "./RankingTitle";

/**
 * ショート動作用 Props — React コンポーネントを直接レンダリング
 */
export interface RankingShortProps {
  meta?: RankingMeta;
  /** 上位5件（rank 1-5）のデータ */
  topEntries?: Array<
    RankingEntry & {
      /** 都道府県 SVG パスデータ */
      mapPath?: string;
      mapViewBox?: { x: number; y: number; width: number; height: number };
    }
  >;
  /** 全47都道府県のランキングデータ */
  allEntries?: RankingEntry[];
  musicPath?: string;
  /** テーマ */
  theme?: ThemeName;
  /** プラットフォーム別のバリアント */
  variant?: "youtube" | "youtube-short" | "youtube-short-full" | "instagram" | "tiktok";
  /** SNS セーフエリアを表示するか */
  showSafeAreas?: boolean;
  /** AI 生成フックテキスト（15文字以内）。冒頭シーンの赤帯テロップに反映 */
  hookText?: string;
  /** 表示用タイトル。指定時は meta.title を上書きする */
  displayTitle?: string;
  /** D3 カラースキーム名 */
  colorScheme?: string;
  /** カラースキームの種類 */
  colorSchemeType?: "sequential" | "diverging";
  /** diverging スケールの中間値 */
  divergingMidpointValue?: number;
  /** GES背景動画を使用するか */
  gesBackground?: boolean;
}

/**
 * 構成と持続時間を動的に取得するヘルパー
 */
export const getShortTimeline = (variant: "youtube" | "youtube-short" | "youtube-short-full" | "instagram" | "tiktok" = "youtube", entryCount = 47) => {
  const isTikTok = variant === "tiktok";
  const isInstagram = variant === "instagram";
  const isYouTubeShort = variant === "youtube-short";
  const isYouTubeShortFull = variant === "youtube-short-full";
  // youtube-short: 上位5件 + テーブル（~32秒）
  // youtube-short-full: 全47件を高速表示（~55秒）
  const isFullRanking = !isInstagram && !isYouTubeShort; // youtube-short-full は全件

  // 1. 表示するエントリ数（Instagram/YouTube Short: 上位5件、それ以外: 全件）
  const count = (isFullRanking || isYouTubeShortFull) ? entryCount : 5;

  // 2. 各エントリの持続時間 (fps=30)
  const getDurationByIndex = (idx: number) => {
    if (!isFullRanking && !isYouTubeShortFull) return 90; // 3.0s (Instagram / YouTube Short)
    const posFromTop = (isYouTubeShortFull ? entryCount : count) - 1 - idx;
    if (isYouTubeShortFull) {
      // YouTube Short Full: 全47件を55秒以内に収める高速表示
      if (posFromTop >= 10) return 24;   // 0.8s (11位以下)
      if (posFromTop >= 3) return 36;    // 1.2s (10-4位)
      return 48;                         // 1.6s (3-1位)
    }
    if (posFromTop >= 10) return 60;   // 2.0s (11位以下)
    if (posFromTop >= 3) return 75;    // 2.5s (10-4位)
    return 90;                         // 3.0s (3-1位)
  };

  // 3. カウントアップアニメーションを有効にするか
  const shouldAnimateByIndex = (idx: number) => {
    if (isYouTubeShortFull) return false; // Full: 全件モーション無効（即表示）
    if (!isFullRanking) return true;
    const posFromTop = count - 1 - idx;
    return posFromTop <= 9;
  };

  const indices = Array.from({ length: count }, (_, i) => i);
  const sceneDurations = indices.map(i => getDurationByIndex(i));

  // 4. 各シーンの開始オフセット計算
  let currentOffset = SCENE_DURATION.intro;
  const starts = indices.map((_, i) => {
    const start = currentOffset;
    currentOffset += sceneDurations[i];
    return start;
  });

  // マップシーンの計算
  // YouTube/Instagram: RankCards の後に静的マップを追加
  // TikTok: RankCards をプログレッシブマップに置き換え（starts/sceneDurations はマップ内スケジュールとして流用）
  const mapStart = isTikTok ? SCENE_DURATION.intro : currentOffset;
  const mapDuration = isTikTok
    ? sceneDurations.reduce((a, b) => a + b, 0)
    : SCENE_DURATION.mapStatic;

  // テーブルシーン: youtube-short のみ有効（上位5件 → 全47件テーブル）
  const showTable = isYouTubeShort;
  const tableStart = isTikTok
    ? mapStart + mapDuration
    : currentOffset + SCENE_DURATION.mapStatic;
  const lastStart = showTable
    ? tableStart + SCENE_DURATION.table
    : tableStart;
  const totalDuration = lastStart + SCENE_DURATION.last;

  return {
    count,
    sceneDurations,
    starts,
    mapStart,
    mapDuration,
    showTable,
    tableStart,
    lastStart,
    totalDuration,
    shouldAnimateByIndex,
  };
};

/**
 * ランキングショート動画 (1080x1920, 9:16)
 *
 * シーン構成:
 * 1. RankingTitle（イントロフック）
 * 2. RankCard 47位〜1位 または 5位〜1位 (バリアント別)
 * 3. RankingTable（全体テーブル）
 * 4. CTASlide（エンディング）
 */
export const RankingShort: React.FC<RankingShortProps> = ({
  meta: propsMeta,
  topEntries: propsTopEntries,
  allEntries: propsAllEntries,
  musicPath,
  theme = "dark",
  variant = "youtube",
  showSafeAreas = false,
  hookText,
  displayTitle,
  colorScheme,
  colorSchemeType,
  divergingMidpointValue,
  gesBackground = false,
}) => {
  const { meta, entries, precision } = resolveRankingData({ meta: propsMeta, allEntries: propsAllEntries });
  const title = displayTitle || meta.title;

  const finalAllEntries = entries;
  const bgmPath = musicPath || staticFile("music/bgm.mp3");

  const isTikTok = variant === "tiktok";
  const isInstagram = variant === "instagram";

  // rank 降順（47位→1位）に並べた全件
  const sortedAllEntries = useMemo(
    () => [...entries].sort((a, b) => b.rank - a.rank || b.value - a.value),
    [entries],
  );

  // Instagram: 上位5件のみ（5位→1位の順）
  const top5Entries = useMemo(
    () => [...entries].sort((a, b) => a.rank - b.rank || b.value - a.value).slice(0, 5).reverse(),
    [entries],
  );

  const isYouTubeShortVariant = variant === "youtube-short";

  // RankCard で表示するエントリ一覧
  // TikTok: マップ表示なので空
  // Instagram / YouTube Short: 上位5件
  // YouTube / その他: 全件
  const rankCardEntries = useMemo(
    () => (isTikTok ? [] : (isInstagram || isYouTubeShortVariant) ? top5Entries : sortedAllEntries),
    [isTikTok, isInstagram, isYouTubeShortVariant, top5Entries, sortedAllEntries],
  );

  // タイムライン計算
  const usesTop5Only = isInstagram || isYouTubeShortVariant;
  const {
    count,
    sceneDurations,
    starts,
    mapStart,
    mapDuration,
    showTable,
    tableStart,
    lastStart,
    shouldAnimateByIndex,
  } = getShortTimeline(variant, usesTop5Only ? 5 : sortedAllEntries.length);

  // 都道府県シルエット（YouTube/Instagram のみ — RankCard を使うバリアント）
  const usesSilhouette = !isTikTok;
  const [silhouetteHandle] = useState(() =>
    usesSilhouette ? delayRender("Loading TopoJSON for silhouettes") : null
  );
  const [silhouetteMap, setSilhouetteMap] = useState<Map<string, PrefectureSilhouette>>(new Map());

  useEffect(() => {
    if (!usesSilhouette || silhouetteHandle === null) return;
    const handle = silhouetteHandle as number; // narrowed above

    let cancelled = false;

    async function loadSilhouettes() {
      try {
        const url = staticFile("prefecture.topojson");
        const res = await fetch(url);
        const topology = (await res.json()) as Topology;

        if (cancelled) return;

        const map = new Map<string, PrefectureSilhouette>();
        for (const entry of rankCardEntries) {
          if (map.has(entry.areaCode)) continue;
          const sil = computePrefectureSilhouette(topology, entry.areaCode);
          if (sil) map.set(entry.areaCode, sil);
        }

        setSilhouetteMap(map);
        continueRender(handle);
      } catch (err) {
        console.error("Failed to load TopoJSON for silhouettes:", err);
        continueRender(handle);
      }
    }

    loadSilhouettes();
    return () => { cancelled = true; };
  }, [usesSilhouette, silhouetteHandle, rankCardEntries]);

  return (
    <>
      <Audio src={bgmPath} />

      {/* 冒頭フック: RankingTitle */}
      <Sequence
        from={0}
        durationInFrames={SCENE_DURATION.intro}
        name="Intro"
      >
        <RankingTitle
          titleMain={title}
          titleSub={`${meta.yearName || "最新"} 都道府県ランキング`}
          catchphrase1="1位はあの県...⁉︎"
          catchphrase2="あなたの地元は何位？"
          theme={theme}
          hookText={hookText}
        />
      </Sequence>

      {/* ランク発表 + マップシーン */}
      {isTikTok ? (
        /* TikTok: プログレッシブタイルマップ（RankCard の代替） */
        <Sequence from={mapStart} durationInFrames={mapDuration} name="TileGridMap">
          <TileGridMapScene
            entries={sortedAllEntries}
            meta={meta}
            theme={theme}
            mode="progressive"
            precision={precision}
            colorScheme={colorScheme}
            colorSchemeType={colorSchemeType}
            divergingMidpointValue={divergingMidpointValue}
            gesBackground={gesBackground}
            displayTitle={displayTitle}
            revealSchedule={starts.map((s, i) => ({
              startFrame: s - mapStart,
              duration: sceneDurations[i],
            }))}
          />
        </Sequence>
      ) : (
        <>
          {/* YouTube/Instagram: RankCard で順位発表 */}
          {rankCardEntries.map((entry, i) => (
            <Sequence
              key={entry.areaCode}
              from={starts[i]}
              durationInFrames={sceneDurations[i]}
              name={`Rank ${entry.rank}`}
            >
              <RankCard
                title={title}
                rank={entry.rank}
                areaName={entry.areaName}
                value={entry.value}
                unit={meta.unit}
                precision={precision}
                totalCount={entries.length}
                theme={theme}
                animated={shouldAnimateByIndex(i)}
                prefSilhouette={silhouetteMap.get(entry.areaCode)}
                areaCode={entry.areaCode}
                gesBackground={gesBackground}
              />
            </Sequence>
          ))}

          {/* 静的タイルマップシーン */}
          <Sequence from={mapStart} durationInFrames={mapDuration} name="TileGridMap">
            <TileGridMapScene
              entries={finalAllEntries}
              meta={meta}
              theme={theme}
              mode="static"
              precision={precision}
              hookText={hookText}
              colorScheme={colorScheme}
              colorSchemeType={colorSchemeType}
              divergingMidpointValue={divergingMidpointValue}
            />
          </Sequence>
        </>
      )}

      {/* テーブル全体（Instagram では除外：サイト誘導を優先） */}
      {showTable && (
        <Sequence
          from={tableStart}
          durationInFrames={SCENE_DURATION.table}
          name="Table"
        >
          <RankingTable
            meta={meta}
            entries={finalAllEntries}
            tableStyle="neon"
            theme={theme}
            displayTitle={title}
          />
        </Sequence>
      )}

      {/* エンディング */}
      <Sequence
        from={lastStart}
        durationInFrames={SCENE_DURATION.last}
        name="CTA"
      >
        <ReelLastPage theme={theme} variant={variant} />
      </Sequence>

      {/* セーフエリア表示 (開発用) */}
      {showSafeAreas && <SafetyZoneOverlay />}
    </>
  );
};
