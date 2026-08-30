import { CANVAS, getBarChartRaceTimeline } from '@/shared';
import { RankingShort, getShortTimeline } from '@/shared';
import React from 'react';
import { Composition, Folder } from 'remotion';
import { z } from 'zod';
// Shorts (shared)
import { BarChartRaceShortPreview } from './shared/components/shorts/previews/BarChartRaceShortPreview';
import { RankCardPreview } from './shared/components/shorts/previews/RankCardPreview';
import { RankingTablePreview } from './shared/components/shorts/previews/RankingTablePreview';
import { RankingTitlePreview } from './shared/components/shorts/previews/RankingTitlePreview';
import { ReelLastPagePreview } from './shared/components/shorts/previews/ReelLastPagePreview';
// Maps (shared)
import { TileGridMapScenePreview } from './shared/components/maps/previews/TileGridMapScenePreview';
// ranking-youtube-ges
import { RankingShortGes } from './features/ranking-youtube-ges/RankingShortGes';
import { RankCardGesPreview } from './features/ranking-youtube-ges/previews/RankCardGesPreview';
// Layouts
import { LandscapePreview } from './features/layouts/previews/LandscapePreview';
import { PortraitPreview } from './features/layouts/previews/PortraitPreview';
// ranking-instagram
import { CarouselPreview } from './features/ranking-instagram/previews/CarouselPreview';
import { RankingTableSlidePreview } from './features/ranking-instagram/previews/RankingTableSlidePreview';
// buzz-map (バズ地図カード)
import { BuzzMapStillPreview } from './features/buzz-map/previews/BuzzMapStillPreview';
import {
  BuzzMapReelPreview,
  calculateBuzzMapReelMetadata,
} from './features/buzz-map/previews/BuzzMapReelPreview';
import { BUZZ_MAP_RATIOS, BUZZ_MAP_REEL_DEFAULTS } from './features/buzz-map/tokens';
// ranking-x
import { ChoroplethMapStillPreview } from './features/ranking-x/previews/ChoroplethMapStillPreview';
import { RankingBoxplotPreview } from './features/ranking-x/previews/RankingBoxplotPreview';
import { RankingChartXPreview } from './features/ranking-x/previews/RankingChartXPreview';
import { GeoInsightCardPreview } from './features/geo-x/previews/GeoInsightCardPreview';
import type { GeoInsightCardProps } from './features/geo-x/GeoInsightCard';
// ranking-youtube
import { ThumbnailPreview } from './features/ranking-youtube/previews/ThumbnailPreview';
import { RankingNormalPreview } from './features/ranking-youtube/previews/RankingNormalPreview';
import { RankingHorizontalBarPreview } from './features/ranking-youtube/previews/RankingHorizontalBarPreview';
import { RankingCountdownPreview } from './features/ranking-youtube/previews/RankingCountdownPreview';
import { StaticRankingPreview } from './features/ranking-youtube/previews/StaticRankingPreview';
import { RankingMigrationPreview } from './features/ranking-youtube/previews/RankingMigrationPreview';
import { RankingScrollGesPreview } from './features/ranking-youtube/previews/RankingScrollGesPreview';
import { BarChartRaceNormalPreview } from './features/ranking-youtube/previews/BarChartRaceNormalPreview';
// ranking-note
import { NoteCoverPreview } from './features/ranking-note/previews/NoteCoverPreview';
// kazu-note
import { KazuNoteCoverPreview } from './features/kazu-note/previews/KazuNoteCoverPreview';
// compare-instagram
import { ComparisonCarouselPreview } from './features/compare-instagram/previews/ComparisonCarouselPreview';
// compare-short
import { ComparisonShortPreview } from './features/compare-short/previews/ComparisonShortPreview';
import { getComparisonShortTimeline } from './features/compare-short/ComparisonShort';
// area-profile-instagram
import { AreaProfileCarouselPreview } from './features/area-profile-instagram/previews/AreaProfileCarouselPreview';
// population-choropleth
import { CompareChoroplethStillPreview } from './features/population-choropleth/previews/CompareChoroplethStillPreview';
import { ChoroplethProgressiveReelPreview } from './features/population-choropleth/previews/ChoroplethProgressiveReelPreview';
import { ChoroplethBarChartReelPreview } from './features/population-choropleth/previews/ChoroplethBarChartReelPreview';
import { ChoroplethStaticReelPreview } from './features/population-choropleth/previews/ChoroplethStaticReelPreview';
import { BAR_CHART_REEL_DURATION } from './features/population-choropleth/ChoroplethBarChartReel';
import { STATIC_REEL_DURATION } from './features/population-choropleth/ChoroplethStaticReel';
// population-yoy-47
import {
  PopulationYoy47Landscape,
  PopulationYoy47Portrait,
  getPopulationYoy47Duration,
} from './features/population-yoy-47/PopulationYoy47Scene';
// migration-flow
import { MigrationFlowReelPreview } from './features/migration-flow/previews/MigrationFlowReelPreview';
import { MigrationFlowCoverPreview } from './features/migration-flow/MigrationFlowCoverPreview';
import { MIGRATION_FLOW_DURATION, COVER_WIDTH, COVER_HEIGHT } from '@stats47/migration-flow';
// station-passengers
import { StationPassengersReelPreview } from './features/station-passengers/previews/StationPassengersReelPreview';
import { STATION_PASSENGERS_DURATION } from './features/station-passengers';
import { MigrationIntro, MIGRATION_INTRO_DURATION } from './features/migration-flow/MigrationIntro';
import { MigrationSegmentTelop, MIGRATION_TELOP_DURATION } from './features/migration-flow/MigrationSegmentTelop';
import { MigrationThumbnail } from './features/migration-flow/MigrationThumbnail';
// Charts (shared)
import { BarChartRaceScenePreview } from './shared/components/charts/previews/BarChartRaceScenePreview';
// Utils
import { SCENE_DURATION, VIDEO_CONFIG } from './utils/constants';
import { barChartRacePreviewData } from './utils/preview-data-bar-chart-race';
import {
  KazuNoteCoverSchema,
  AreaProfileCarouselSchema,
  BarChartRaceShortSchema,
  CarouselPreviewSchema,
  CommonPreviewSchema,
  ComparisonCarouselSchema,
  ComparisonShortSchema,
  PopulationChoroplethSchema,
  MigrationFlowSchema,
  StationPassengersSchema,
  LayoutPreviewSchema,
  RankCardPreviewSchema,
  RankingShortSchema,
  RankingTablePreviewSchema,
  ThumbnailPreviewSchema,
  TileGridMapScenePreviewSchema,
} from './utils/schema';

export const RemotionRoot: React.FC = () => {

  return (
    <>
      <Folder name="GeoAI">
        <Folder name="X">
          <Composition<any, GeoInsightCardProps>
            id="GeoX-InsightCard"
            component={GeoInsightCardPreview}
            width={BUZZ_MAP_RATIOS['45'].width}
            height={BUZZ_MAP_RATIOS['45'].height}
            fps={1}
            durationInFrames={1}
            defaultProps={{
              title: '人口増が見込まれるのは東京だけ',
              description: '47都道府県を同じ色尺度で比較します。',
              geoRole: 'baseline' as const,
              analysisLabel: '2050年将来人口',
              layerLabels: ['都道府県別将来人口［prefecture］'],
              operationLabels: ['2020年基準の2050年増減率を算出'],
              sourceLabels: ['国立社会保障・人口問題研究所'],
              metricLabel: '2050年人口増減率',
              metricUnit: '%',
              metricFormat: 'signedPercent2',
              mapMode: 'baseline-choropleth' as const,
              highlightAreaCodes: ['13000'],
              panelKind: 'statement' as const,
              panelLabel: '2020年 → 2050年',
              panelItems: ['人口増加：1都', '人口減少：46道府県'],
              allEntries: [],
            }}
          />
        </Folder>
      </Folder>

      <Folder name="Ranking">
        <Folder name="X">
          {/* X用チャート (1200x630) */}
          <Composition
            id="RankingX-Chart"
            component={RankingChartXPreview}
            width={CANVAS.ogp.width}
            height={CANVAS.ogp.height}
            fps={1}
            durationInFrames={1}
            schema={CommonPreviewSchema}
            defaultProps={{
              theme: 'light' as const,
              showGuides: false,
              showSafeAreas: false,
            }}
          />

          {/* コロプレス地図 (1080x1080) */}
          <Composition
            id="RankingX-ChoroplethMap"
            component={ChoroplethMapStillPreview}
            width={CANVAS.square.width}
            height={CANVAS.square.height}
            fps={1}
            durationInFrames={1}
            schema={CommonPreviewSchema}
            defaultProps={{
              theme: 'light' as const,
              showGuides: false,
              showSafeAreas: false,
              hookText: '',
            }}
          />
        </Folder>

        <Folder name="Instagram">
          {/* Instagram Reels 用ショート動画（テーブル除外：サイト誘導優先） */}
          <Composition
            id="RankingInstagram-Reel"
            component={RankingShort}
            durationInFrames={getShortTimeline("instagram").totalDuration}
            fps={VIDEO_CONFIG.fps}
            width={VIDEO_CONFIG.width}
            height={VIDEO_CONFIG.height}
            schema={RankingShortSchema}
            defaultProps={{
              theme: "dark",
              variant: "instagram",
              showSafeAreas: false,
              hookText: '',
              displayTitle: '',
              gesBackground: true,
            } as any}
          />

          {/* カルーセル表紙 (4:5) */}
          <Composition
            id="RankingInstagram-Cover"
            component={CarouselPreview}
            width={CANVAS.carousel.width}
            height={CANVAS.carousel.height}
            fps={1}
            durationInFrames={1}
            schema={CarouselPreviewSchema}
            defaultProps={{
              slide: 'cover' as const,
              theme: 'dark' as const,
              showGuides: false,
              showSafeAreas: false,
              displayTitle: '',
              hookText: '',
            }}
          />

          {/* カルーセル テーブルスライド (4:5) */}
          <Composition
            id="RankingInstagram-Table"
            component={RankingTableSlidePreview}
            width={CANVAS.carousel.width}
            height={CANVAS.carousel.height}
            fps={1}
            durationInFrames={1}
            schema={CarouselPreviewSchema}
            defaultProps={{
              theme: 'light' as const,
              showGuides: false,
              showSafeAreas: false,
              displayTitle: '',
            }}
          />

          {/* カルーセル CTA (4:5) */}
          <Composition
            id="RankingInstagram-CTA"
            component={CarouselPreview}
            width={CANVAS.carousel.width}
            height={CANVAS.carousel.height}
            fps={1}
            durationInFrames={1}
            schema={CarouselPreviewSchema}
            defaultProps={{
              slide: 'cta' as const,
              theme: 'dark' as const,
              showGuides: false,
              showSafeAreas: false,
            }}
          />
        </Folder>

        <Folder name="YouTube">
          <Folder name="Shorts">
            {/* YouTube Shorts A: 上位5件 + 全47件テーブル（~32秒） */}
            <Composition
              id="RankingYouTube-Short"
              component={RankingShort}
              durationInFrames={getShortTimeline("youtube-short").totalDuration}
              fps={VIDEO_CONFIG.fps}
              width={VIDEO_CONFIG.width}
              height={VIDEO_CONFIG.height}
              schema={RankingShortSchema}
              defaultProps={{
                theme: "dark",
                variant: "youtube-short",
                showSafeAreas: false,
                hookText: '',
                displayTitle: '',
                gesBackground: true,
              } as any}
            />
            {/* YouTube Shorts B: 全47件を高速表示・モーション無し（~55秒） */}
            <Composition
              id="RankingYouTube-Short-Full"
              component={RankingShort}
              durationInFrames={getShortTimeline("youtube-short-full").totalDuration}
              fps={VIDEO_CONFIG.fps}
              width={VIDEO_CONFIG.width}
              height={VIDEO_CONFIG.height}
              schema={RankingShortSchema}
              defaultProps={{
                theme: "dark",
                variant: "youtube-short-full",
                showSafeAreas: false,
                hookText: '',
                displayTitle: '',
                gesBackground: true,
              } as any}
            />
            {/* YouTube Shorts C: 6秒静止画ランキング TOP15（競合「ランクの森」フォーマット） */}
            <Composition
              id="RankingYouTube-Static"
              component={StaticRankingPreview}
              durationInFrames={180}
              fps={VIDEO_CONFIG.fps}
              width={VIDEO_CONFIG.width}
              height={VIDEO_CONFIG.height}
              schema={CommonPreviewSchema}
              defaultProps={{
                theme: "dark" as const,
                showSafeAreas: false,
                displayTitle: '',
              }}
            />
          </Folder>

          <Folder name="Normal">
            {/* YouTube 通常動画 (16:9 Full HD 1920×1080) */}
            <Composition
              id="RankingYouTube-Normal"
              component={RankingNormalPreview}
              width={CANVAS.youtube16x9.width}
              height={CANVAS.youtube16x9.height}
              fps={VIDEO_CONFIG.fps}
              durationInFrames={120 + VIDEO_CONFIG.fps * 4 * 47 + 120} // イントロ4秒 + 4秒*47県 + アウトロ4秒
              schema={CommonPreviewSchema.extend({
                framesPerPref: z.number().optional(),
                precision: z.number().optional(),
                musicPath: z.string().optional(),
                hookText: z.string().optional(),
              })}
              defaultProps={{
                theme: 'dark' as const,
                showSafeAreas: false,
                framesPerPref: VIDEO_CONFIG.fps * 4,
              }}
            />

            {/* YouTube 横棒グラフ動画 (16:9 Full HD 1920×1080) — 競合風スタイル */}
            <Composition
              id="RankingYouTube-HorizontalBar"
              component={RankingHorizontalBarPreview}
              width={CANVAS.youtube16x9.width}
              height={CANVAS.youtube16x9.height}
              fps={VIDEO_CONFIG.fps}
              durationInFrames={120 + 150 * 47 + 120} // イントロ4秒 + 5秒*47県 + アウトロ4秒
              schema={CommonPreviewSchema.extend({
                framesPerPref: z.number().optional(),
                precision: z.number().optional(),
                musicPath: z.string().optional(),
                hookText: z.string().optional(),
              })}
              defaultProps={{
                theme: 'dark' as const,
                showSafeAreas: false,
                framesPerPref: 150,
              }}
            />

            {/* YouTube GES背景 横スクロール動画 (16:9 Full HD 1920×1080) */}
            <Composition
              id="RankingYouTube-ScrollGes"
              component={RankingScrollGesPreview}
              width={CANVAS.youtube16x9.width}
              height={CANVAS.youtube16x9.height}
              fps={VIDEO_CONFIG.fps}
              durationInFrames={120 + (90 * 37 + 120 * 7 + 180 * 3) + 120}
              schema={CommonPreviewSchema.extend({
                precision: z.number().optional(),
                musicPath: z.string().optional(),
                hookText: z.string().optional(),
              })}
              defaultProps={{
                theme: 'dark' as const,
              }}
            />

            {/* YouTube 人口移動推移動画 (16:9 Full HD 1920×1080) */}
            <Composition
              id="RankingYouTube-Migration"
              component={RankingMigrationPreview}
              width={CANVAS.youtube16x9.width}
              height={CANVAS.youtube16x9.height}
              fps={VIDEO_CONFIG.fps}
              durationInFrames={120 + VIDEO_CONFIG.fps * 4 * 47}
              schema={CommonPreviewSchema.extend({
                framesPerPref: z.number().optional(),
                precision: z.number().optional(),
              })}
              defaultProps={{
                theme: 'light' as const,
                showSafeAreas: false,
                framesPerPref: VIDEO_CONFIG.fps * 4,
                precision: 1,
              }}
            />

            {/* YouTube カウントダウン動画 (16:9 Full HD 1920×1080) */}
            <Composition
              id="RankingYouTube-Countdown"
              component={RankingCountdownPreview}
              width={CANVAS.youtube16x9.width}
              height={CANVAS.youtube16x9.height}
              fps={VIDEO_CONFIG.fps}
              durationInFrames={VIDEO_CONFIG.fps * 300} // 約5分 (可変対応予定)
              schema={CommonPreviewSchema.extend({
                precision: z.number().optional(),
              })}
              defaultProps={{
                theme: 'dark' as const,
                showSafeAreas: false,
              }}
            />
            {/* YouTube サムネイル: 衝撃数字型 (16:9) */}
            <Composition
              id="RankingYouTube-Thumb-Hero"
              component={ThumbnailPreview}
              width={CANVAS.youtube.width}
              height={CANVAS.youtube.height}
              fps={1}
              durationInFrames={1}
              schema={ThumbnailPreviewSchema}
              defaultProps={{
                variant: 'hero' as const,
                theme: 'dark' as const,
                showGuides: false,
                showSafeAreas: false,
              }}
            />
          </Folder>
        </Folder>

        <Folder name="TikTok">
          {/* TikTok 版 (収益化対応・全47都道府県) */}
          <Composition
            id="RankingTikTok-Short"
            component={RankingShort}
            durationInFrames={getShortTimeline("tiktok").totalDuration}
            fps={VIDEO_CONFIG.fps}
            width={VIDEO_CONFIG.width}
            height={VIDEO_CONFIG.height}
            schema={RankingShortSchema}
            defaultProps={{
              theme: "dark",
              variant: "tiktok",
              showSafeAreas: false,
              hookText: '',
              displayTitle: '',
              gesBackground: true,
            } as any}
          />

        </Folder>

        <Folder name="YouTube-GES">
          {/* GES 背景版 (縦型) */}
          <Composition
            id="RankingYouTubeGES-Short"
            component={RankingShortGes as any}
            durationInFrames={getShortTimeline("youtube").totalDuration}
            fps={VIDEO_CONFIG.fps}
            width={VIDEO_CONFIG.width}
            height={VIDEO_CONFIG.height}
            schema={RankingShortSchema}
            defaultProps={{
              theme: "dark",
              meta: {
                title: "都道府県別 年収ランキング",
                subtitle: "2024年最新データ",
                unit: "円"
              },
              topEntries: [
                { rank: 1, areaCode: "13000", areaName: "東京都", value: 6200000 },
                { rank: 2, areaCode: "14000", areaName: "神奈川県", value: 5800000 },
                { rank: 3, areaCode: "23000", areaName: "愛知県", value: 5600000 },
                { rank: 4, areaCode: "27000", areaName: "大阪府", value: 5500000 },
                { rank: 5, areaCode: "11000", areaName: "埼玉県", value: 5400000 },
              ],
              allEntries: [],
              showSafeAreas: false,
            } as any}
          />

          {/* GES 背景版 全47県 (RankingShort + gesBackground) */}
          <Composition
            id="RankingYouTubeGES-Full"
            component={RankingShort}
            durationInFrames={getShortTimeline("youtube").totalDuration}
            fps={VIDEO_CONFIG.fps}
            width={VIDEO_CONFIG.width}
            height={VIDEO_CONFIG.height}
            schema={RankingShortSchema}
            defaultProps={{
              theme: "dark",
              variant: "youtube",
              showSafeAreas: false,
              hookText: '',
              displayTitle: '',
              gesBackground: true,
            } as any}
          />

          {/* GES ランクカード (9:16) */}
          <Composition
            id="RankingYouTubeGES-RankCard"
            component={RankCardGesPreview as any}
            width={CANVAS.portrait.width}
            height={CANVAS.portrait.height}
            fps={VIDEO_CONFIG.fps}
            durationInFrames={90}
            schema={RankCardPreviewSchema}
            defaultProps={{
              rank: 1,
              theme: 'dark' as const,
              showGuides: false,
              showSafeAreas: false,
            }}
          />
        </Folder>
      </Folder>

      <Folder name="BarChartRace">
        {/* Bar Chart Race: YouTube Shorts */}
        <Composition
          id="BarChartRace-YouTubeShort"
          component={BarChartRaceShortPreview}
          durationInFrames={getBarChartRaceTimeline({ frameCount: barChartRacePreviewData.frames.length }).totalDuration}
          fps={VIDEO_CONFIG.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
          schema={BarChartRaceShortSchema}
          defaultProps={{
            theme: "dark",
            variant: "youtube",
            topN: 15,
            showSafeAreas: false,
            frames: barChartRacePreviewData.frames,
            title: barChartRacePreviewData.title,
            unit: barChartRacePreviewData.unit,
            eventLabels: barChartRacePreviewData.eventLabels,
            hookText: barChartRacePreviewData.hookText,
            enableSpoilerHook: barChartRacePreviewData.enableSpoilerHook,
          } as any}
        />

        {/* Bar Chart Race: Instagram Reel */}
        <Composition
          id="BarChartRace-InstagramReel"
          component={BarChartRaceShortPreview}
          durationInFrames={getBarChartRaceTimeline({ frameCount: barChartRacePreviewData.frames.length }).totalDuration}
          fps={VIDEO_CONFIG.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
          schema={BarChartRaceShortSchema}
          defaultProps={{
            theme: "dark",
            variant: "instagram",
            showSafeAreas: false,
            frames: barChartRacePreviewData.frames,
            title: barChartRacePreviewData.title,
            unit: barChartRacePreviewData.unit,
            eventLabels: barChartRacePreviewData.eventLabels,
          } as any}
        />

        {/* Bar Chart Race: TikTok */}
        <Composition
          id="BarChartRace-TikTok"
          component={BarChartRaceShortPreview}
          durationInFrames={getBarChartRaceTimeline({ frameCount: barChartRacePreviewData.frames.length }).totalDuration}
          fps={VIDEO_CONFIG.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
          schema={BarChartRaceShortSchema}
          defaultProps={{
            theme: "dark",
            variant: "tiktok",
            showSafeAreas: false,
            frames: barChartRacePreviewData.frames,
            title: barChartRacePreviewData.title,
            unit: barChartRacePreviewData.unit,
            eventLabels: barChartRacePreviewData.eventLabels,
          } as any}
        />

        {/* Bar Chart Race Scene のみ（コンポーネント単体プレビュー） */}
        <Composition
          id="BarChartRace-Scene"
          component={BarChartRaceScenePreview}
          durationInFrames={Math.max(0, barChartRacePreviewData.frames.length - 1) * 36}
          fps={VIDEO_CONFIG.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
          schema={BarChartRaceShortSchema}
          defaultProps={{
            theme: "dark",
            frames: barChartRacePreviewData.frames,
            title: barChartRacePreviewData.title,
            unit: barChartRacePreviewData.unit,
            eventLabels: barChartRacePreviewData.eventLabels,
          } as any}
        />

        {/* Bar Chart Race 通常動画 (16:9 Full HD 1920x1080) */}
        <Composition
          id="BarChartRace-Normal"
          component={BarChartRaceNormalPreview}
          durationInFrames={getBarChartRaceTimeline({ frameCount: barChartRacePreviewData.frames.length }).totalDuration}
          fps={VIDEO_CONFIG.fps}
          width={CANVAS.youtube16x9.width}
          height={CANVAS.youtube16x9.height}
          schema={BarChartRaceShortSchema}
          defaultProps={{
            theme: "dark",
            topN: 47,
            frames: barChartRacePreviewData.frames,
            title: barChartRacePreviewData.title,
            unit: barChartRacePreviewData.unit,
            hookText: barChartRacePreviewData.hookText,
            eventLabels: barChartRacePreviewData.eventLabels,
            enableSpoilerHook: barChartRacePreviewData.enableSpoilerHook,
          } as any}
        />
      </Folder>

      <Folder name="Note">
          {/* note カバー画像 (1280x670) */}
          <Composition
            id="RankingNote-Cover"
            component={NoteCoverPreview}
            width={CANVAS.noteCover.width}
            height={CANVAS.noteCover.height}
            fps={1}
            durationInFrames={1}
            schema={CommonPreviewSchema}
            defaultProps={{
              theme: 'dark' as const,
              showGuides: false,
              showSafeAreas: false,
            }}
          />

          {/* コロプレス地図 (1080x1080) — note 記事用 */}
          <Composition
            id="RankingNote-ChoroplethMap"
            component={ChoroplethMapStillPreview}
            width={CANVAS.square.width}
            height={CANVAS.square.height}
            fps={1}
            durationInFrames={1}
            schema={CommonPreviewSchema}
            defaultProps={{
              theme: 'light' as const,
              showGuides: false,
              showSafeAreas: false,
            }}
          />

          {/* チャート画像 (1200x630) — note 記事用 */}
          <Composition
            id="RankingNote-Chart"
            component={RankingChartXPreview}
            width={CANVAS.ogp.width}
            height={CANVAS.ogp.height}
            fps={1}
            durationInFrames={1}
            schema={CommonPreviewSchema}
            defaultProps={{
              theme: 'light' as const,
              showGuides: false,
              showSafeAreas: false,
            }}
          />

          {/* 箱ひげ図 (1200x630) — note 記事用 */}
          <Composition
            id="RankingNote-Boxplot"
            component={RankingBoxplotPreview}
            width={CANVAS.ogp.width}
            height={CANVAS.ogp.height}
            fps={1}
            durationInFrames={1}
            schema={CommonPreviewSchema}
            defaultProps={{
              theme: 'light' as const,
              showGuides: false,
              showSafeAreas: false,
            }}
          />
      </Folder>


      <Folder name="Compare">
        <Folder name="Instagram">
          {/* 比較カルーセル (1080x1350) */}
          <Composition
            id="CompareInstagram-Carousel"
            component={ComparisonCarouselPreview}
            width={CANVAS.carousel.width}
            height={CANVAS.carousel.height}
            fps={1}
            durationInFrames={1}
            schema={ComparisonCarouselSchema}
            defaultProps={{
              slide: 'cover' as const,
              theme: 'dark' as const,
              showGuides: false,
              showSafeAreas: false,
            }}
          />
        </Folder>

        <Folder name="Short">
          {/* 比較ショート動画 (1080x1920, 9:16) */}
          <Composition
            id="CompareShort"
            component={ComparisonShortPreview}
            durationInFrames={getComparisonShortTimeline(7).totalDuration}
            fps={VIDEO_CONFIG.fps}
            width={VIDEO_CONFIG.width}
            height={VIDEO_CONFIG.height}
            schema={ComparisonShortSchema}
            defaultProps={{
              theme: 'dark' as const,
              showSafeAreas: false,
              hookText: 'どっちが上？',
            }}
          />
        </Folder>
      </Folder>

      <Folder name="AreaProfile">
        <Folder name="Instagram">
          {/* 地域プロファイル カルーセル (1080x1350) */}
          <Composition
            id="AreaProfileInstagram-Carousel"
            component={AreaProfileCarouselPreview}
            width={CANVAS.carousel.width}
            height={CANVAS.carousel.height}
            fps={1}
            durationInFrames={1}
            schema={AreaProfileCarouselSchema}
            defaultProps={{
              slide: 'cover' as const,
              theme: 'dark' as const,
              showGuides: false,
              showSafeAreas: false,
            }}
          />
        </Folder>
      </Folder>

      <Folder name="KazuNote">
          {/* kazu-note カバー画像 (1280x670) */}
          <Composition
            id="KazuNote-Cover"
            component={KazuNoteCoverPreview}
            width={CANVAS.noteCover.width}
            height={CANVAS.noteCover.height}
            fps={1}
            durationInFrames={1}
            schema={KazuNoteCoverSchema}
            defaultProps={{
              series: 'ソバーキュリアス' as const,
              day: 15,
              subtitle: '自分を馬鹿にしていたのは、自分だった',
            }}
          />
      </Folder>

      <Folder name="Layouts">
        {/* プレビュー: 縦型レイアウト (リール / SNSカード) */}
        <Composition
          id="LayoutPreview-Portrait"
          component={PortraitPreview}
          width={CANVAS.portrait.width}
          height={CANVAS.portrait.height}
          fps={1}
          durationInFrames={1}
          schema={LayoutPreviewSchema}
          defaultProps={{
            theme: 'dark' as const,
            showGuides: true,
          }}
        />

        {/* プレビュー: 横型レイアウト (OGP) */}
        <Composition
          id="LayoutPreview-OGP"
          component={LandscapePreview}
          width={CANVAS.ogp.width}
          height={CANVAS.ogp.height}
          fps={1}
          durationInFrames={1}
          schema={LayoutPreviewSchema}
          defaultProps={{
            theme: 'light' as const,
            showGuides: true,
          }}
        />

        {/* プレビュー: 横型レイアウト (YouTube サムネイル) */}
        <Composition
          id="LayoutPreview-YouTube"
          component={LandscapePreview}
          width={CANVAS.youtube.width}
          height={CANVAS.youtube.height}
          fps={1}
          durationInFrames={1}
          schema={LayoutPreviewSchema}
          defaultProps={{
            theme: 'dark' as const,
            showGuides: true,
          }}
        />
      </Folder>

      <Folder name="population-choropleth">
        {/* 横並び比較スチル (1200x630, OGP) */}
        <Composition
          id="PopChoropleth-CompareStill"
          component={CompareChoroplethStillPreview}
          width={CANVAS.ogp.width}
          height={CANVAS.ogp.height}
          fps={1}
          durationInFrames={1}
          schema={PopulationChoroplethSchema}
          defaultProps={{
            theme: 'dark' as const,
            showGuides: false,
          }}
        />

        {/* Progressive Reveal リール (1080x1920) */}
        <Composition
          id="PopChoropleth-ProgressiveReel"
          component={ChoroplethProgressiveReelPreview}
          width={CANVAS.portrait.width}
          height={CANVAS.portrait.height}
          fps={VIDEO_CONFIG.fps}
          durationInFrames={2550}
          schema={PopulationChoroplethSchema}
          defaultProps={{
            theme: 'dark' as const,
          }}
        />

        {/* 横棒チャートリール (1080x1920) */}
        <Composition
          id="PopChoropleth-BarChartReel"
          component={ChoroplethBarChartReelPreview}
          width={CANVAS.portrait.width}
          height={CANVAS.portrait.height}
          fps={VIDEO_CONFIG.fps}
          durationInFrames={BAR_CHART_REEL_DURATION}
          schema={PopulationChoroplethSchema}
          defaultProps={{
            theme: 'dark' as const,
          }}
        />

        {/* Static + テキストオーバーレイ リール (1080x1920) */}
        <Composition
          id="PopChoropleth-StaticReel"
          component={ChoroplethStaticReelPreview}
          width={CANVAS.portrait.width}
          height={CANVAS.portrait.height}
          fps={VIDEO_CONFIG.fps}
          durationInFrames={STATIC_REEL_DURATION}
          schema={PopulationChoroplethSchema}
          defaultProps={{
            theme: 'dark' as const,
          }}
        />
      </Folder>

      {/* 47都道府県 × 1976-2024 年次前年度比 コロプレス時系列 */}
      <Folder name="population-yoy-47">
        {/* 横 16:9 (YouTube 1920x1080) */}
        <Composition
          id="PopulationYoy47-Landscape"
          component={PopulationYoy47Landscape}
          width={CANVAS.youtube16x9.width}
          height={CANVAS.youtube16x9.height}
          fps={VIDEO_CONFIG.fps}
          durationInFrames={getPopulationYoy47Duration()}
          schema={z.object({
            theme: z.enum(['light', 'dark']).optional(),
          })}
          defaultProps={{
            theme: 'dark' as const,
          }}
        />

        {/* 縦 9:16 (Reels / Shorts 1080x1920) */}
        <Composition
          id="PopulationYoy47-Portrait"
          component={PopulationYoy47Portrait}
          width={CANVAS.portrait.width}
          height={CANVAS.portrait.height}
          fps={VIDEO_CONFIG.fps}
          durationInFrames={getPopulationYoy47Duration()}
          schema={z.object({
            theme: z.enum(['light', 'dark']).optional(),
          })}
          defaultProps={{
            theme: 'dark' as const,
          }}
        />
      </Folder>

      {/* 都道府県間 人口移動フロー (YouTube 16:9) */}
      <Folder name="MigrationFlow">
        <Composition
          id="MigrationFlow-Reel"
          component={MigrationFlowReelPreview}
          width={CANVAS.youtube16x9.width}
          height={CANVAS.youtube16x9.height}
          fps={VIDEO_CONFIG.fps}
          durationInFrames={MIGRATION_FLOW_DURATION}
          schema={MigrationFlowSchema}
          defaultProps={{
            theme: 'light' as const,
            focusPrefCode: '28',
          }}
        />

        {/* IG Reels サムネ用 portrait 静止画 (1080x1920) */}
        <Composition
          id="MigrationFlow-Cover"
          component={MigrationFlowCoverPreview}
          width={COVER_WIDTH}
          height={COVER_HEIGHT}
          fps={1}
          durationInFrames={1}
          schema={MigrationFlowSchema}
          defaultProps={{
            focusPrefCode: '13',
          }}
        />

        {/* IG Reels / TikTok / YouTube Shorts 用 portrait 動画 (1080x1920) */}
        <Composition
          id="MigrationFlow-Reel-Portrait"
          component={MigrationFlowReelPreview}
          width={1080}
          height={1920}
          fps={VIDEO_CONFIG.fps}
          durationInFrames={MIGRATION_FLOW_DURATION}
          schema={MigrationFlowSchema}
          defaultProps={{
            theme: 'light' as const,
            focusPrefCode: '13',
            format: 'portrait' as const,
          }}
        />

        {/* イントロ: タイトル + 全国コロプレス地図 */}
        <Composition
          id="MigrationFlow-Intro"
          component={MigrationIntro}
          width={CANVAS.youtube16x9.width}
          height={CANVAS.youtube16x9.height}
          fps={VIDEO_CONFIG.fps}
          durationInFrames={MIGRATION_INTRO_DURATION}
          schema={z.object({ theme: z.enum(['light', 'dark']).optional() })}
          defaultProps={{ theme: 'light' as const }}
        />

        {/* 区切りテロップ（県ごとに props 差し替えでレンダー） */}
        <Composition
          id="MigrationFlow-Telop"
          component={MigrationSegmentTelop}
          width={CANVAS.youtube16x9.width}
          height={CANVAS.youtube16x9.height}
          fps={VIDEO_CONFIG.fps}
          durationInFrames={MIGRATION_TELOP_DURATION}
          schema={z.object({
            position: z.number().optional(),
            prefName: z.string().optional(),
            net: z.number().optional(),
            theme: z.enum(['light', 'dark']).optional(),
          })}
          defaultProps={{
            position: 1,
            prefName: '広島県',
            net: -9921,
            theme: 'light' as const,
          }}
        />

        {/* YouTube サムネイル (1280×720) */}
        <Composition
          id="MigrationFlow-Thumbnail"
          component={MigrationThumbnail}
          width={CANVAS.youtube.width}
          height={CANVAS.youtube.height}
          fps={1}
          durationInFrames={1}
          schema={z.object({})}
          defaultProps={{}}
        />
      </Folder>

      {/* 駅別乗降客数バブルマップ (国土数値情報 S12) */}
      <Folder name="StationPassengers">
        {/* YouTube・X 用 16:9 */}
        <Composition
          id="StationPassengers-Reel"
          component={StationPassengersReelPreview}
          width={CANVAS.youtube16x9.width}
          height={CANVAS.youtube16x9.height}
          fps={VIDEO_CONFIG.fps}
          durationInFrames={STATION_PASSENGERS_DURATION}
          schema={StationPassengersSchema}
          defaultProps={{
            prefCode: '22',
            format: 'landscape' as const,
          }}
        />

        {/* Instagram Reels・YouTube Shorts・TikTok 用 9:16 */}
        <Composition
          id="StationPassengers-Reel-Portrait"
          component={StationPassengersReelPreview}
          width={CANVAS.portrait.width}
          height={CANVAS.portrait.height}
          fps={VIDEO_CONFIG.fps}
          durationInFrames={STATION_PASSENGERS_DURATION}
          schema={StationPassengersSchema}
          defaultProps={{
            prefCode: '22',
            format: 'portrait' as const,
          }}
        />

        {/* Instagram フィード用 1:1 */}
        <Composition
          id="StationPassengers-Reel-Square"
          component={StationPassengersReelPreview}
          width={CANVAS.square.width}
          height={CANVAS.square.height}
          fps={VIDEO_CONFIG.fps}
          durationInFrames={STATION_PASSENGERS_DURATION}
          schema={StationPassengersSchema}
          defaultProps={{
            prefCode: '22',
            format: 'square' as const,
          }}
        />
      </Folder>

      {/* パイプライン用据え置きコンポジション */}
      <Folder name="pipeline-stills">
        {/* ランクカード (9:16) */}
        <Composition
          id="RankCard"
          component={RankCardPreview}
          width={CANVAS.portrait.width}
          height={CANVAS.portrait.height}
          fps={VIDEO_CONFIG.fps}
          durationInFrames={SCENE_DURATION.rank5}
          schema={RankCardPreviewSchema.extend({
            title: z.string().optional(),
            totalCount: z.number().optional(),
          })}
          defaultProps={{
            rank: 1,
            theme: 'dark' as const,
            showGuides: false,
            showSafeAreas: false,
          }}
        />

        {/* タイルグリッドマップ — static (9:16) */}
        <Composition
          id="TileGridMap-Static"
          component={TileGridMapScenePreview}
          width={CANVAS.portrait.width}
          height={CANVAS.portrait.height}
          fps={VIDEO_CONFIG.fps}
          durationInFrames={SCENE_DURATION.mapStatic}
          schema={TileGridMapScenePreviewSchema}
          defaultProps={{
            mode: 'static' as const,
            theme: 'dark' as const,
            showGuides: false,
            showSafeAreas: true,
            hookText: '',
          }}
        />

        {/* タイルグリッドマップ — progressive (9:16) */}
        <Composition
          id="TileGridMap-Progressive"
          component={TileGridMapScenePreview}
          width={CANVAS.portrait.width}
          height={CANVAS.portrait.height}
          fps={VIDEO_CONFIG.fps}
          durationInFrames={25 * 60}
          schema={TileGridMapScenePreviewSchema}
          defaultProps={{
            mode: 'progressive' as const,
            theme: 'dark' as const,
            showGuides: false,
            showSafeAreas: true,
          }}
        />

        {/* ランキングテーブル (9:16) */}
        <Composition
          id="RankingTable"
          component={RankingTablePreview}
          width={CANVAS.portrait.width}
          height={CANVAS.portrait.height}
          fps={1}
          durationInFrames={1}
          schema={RankingTablePreviewSchema}
          defaultProps={{
            tableStyle: 'neon' as const,
            theme: 'dark' as const,
            showGuides: false,
            showSafeAreas: false,
          }}
        />

        {/* Reels ラストページ (1080x1920) */}
        <Composition
          id="ReelLastPage"
          component={ReelLastPagePreview}
          width={CANVAS.portrait.width}
          height={CANVAS.portrait.height}
          fps={1}
          durationInFrames={1}
          schema={z.object({ theme: z.enum(["light", "dark"]).optional() })}
          defaultProps={{
            theme: 'dark' as const,
          }}
        />

        {/* イントロフック: RankingTitle (1080x1920) */}
        <Composition
          id="RankingTitle"
          component={RankingTitlePreview}
          width={CANVAS.portrait.width}
          height={CANVAS.portrait.height}
          fps={VIDEO_CONFIG.fps}
          durationInFrames={SCENE_DURATION.intro}
          schema={CommonPreviewSchema.extend({
            catchphrase1: z.string().optional(),
            catchphrase2: z.string().optional(),
          })}
          defaultProps={{
            theme: 'dark' as const,
            showGuides: false,
            showSafeAreas: false,
          }}
        />
      </Folder>

      {/* ===== buzz-map (バズ地図カード。規約: .claude/rules/buzz-map-standards.md) ===== */}
      <Folder name="buzz-map">
        {/* 型A 静止画 (4:5 = X/IG フィード標準) */}
        <Composition
          id="BuzzMap-Still-45"
          component={BuzzMapStillPreview}
          width={BUZZ_MAP_RATIOS['45'].width}
          height={BUZZ_MAP_RATIOS['45'].height}
          fps={1}
          durationInFrames={1}
          defaultProps={{ ratio: '45' as const }}
        />
        {/* 型A 静止画 (1:1) */}
        <Composition
          id="BuzzMap-Still-11"
          component={BuzzMapStillPreview}
          width={BUZZ_MAP_RATIOS['11'].width}
          height={BUZZ_MAP_RATIOS['11'].height}
          fps={1}
          durationInFrames={1}
          defaultProps={{ ratio: '11' as const }}
        />
        {/* 型A 静止画 (16:9 OGP/YouTube。本土トリム・沖縄インセットなし) */}
        <Composition
          id="BuzzMap-Still-169"
          component={BuzzMapStillPreview}
          width={BUZZ_MAP_RATIOS['169'].width}
          height={BUZZ_MAP_RATIOS['169'].height}
          fps={1}
          durationInFrames={1}
          defaultProps={{ ratio: '169' as const }}
        />
        {/* 型A 静止画 (9:16 リール表紙等) */}
        <Composition
          id="BuzzMap-Still-916"
          component={BuzzMapStillPreview}
          width={BUZZ_MAP_RATIOS['916'].width}
          height={BUZZ_MAP_RATIOS['916'].height}
          fps={1}
          durationInFrames={1}
          defaultProps={{ ratio: '916' as const }}
        />
        {/* 型B 時系列アニメ (1:1 = X 動画)。尺は spec の speed/hold から自動算出 */}
        <Composition
          id="BuzzMap-Reel-11"
          component={BuzzMapReelPreview}
          width={BUZZ_MAP_RATIOS['11'].width}
          height={BUZZ_MAP_RATIOS['11'].height}
          fps={BUZZ_MAP_REEL_DEFAULTS.fps}
          durationInFrames={900}
          calculateMetadata={calculateBuzzMapReelMetadata}
          defaultProps={{ ratio: '11' as const }}
        />
        {/* 型B 時系列アニメ (9:16 = IG リール/TikTok) */}
        <Composition
          id="BuzzMap-Reel-916"
          component={BuzzMapReelPreview}
          width={BUZZ_MAP_RATIOS['916'].width}
          height={BUZZ_MAP_RATIOS['916'].height}
          fps={BUZZ_MAP_REEL_DEFAULTS.fps}
          durationInFrames={900}
          calculateMetadata={calculateBuzzMapReelMetadata}
          defaultProps={{ ratio: '916' as const }}
        />
      </Folder>

      {/* ===== Site Intro ===== */}
      <Folder name="SiteIntro">
        <Composition
          id="SiteIntro"
          component={React.lazy(() => import('./features/site-intro/SiteIntro').then(m => ({ default: m.SiteIntro })))}
          width={CANVAS.youtube16x9.width}
          height={CANVAS.youtube16x9.height}
          fps={VIDEO_CONFIG.fps}
          durationInFrames={1170}
          schema={z.object({
            bgmPath: z.string().optional(),
          })}
          defaultProps={{}}
        />
      </Folder>
    </>
  );
};
