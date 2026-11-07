import { DataCardCompositions } from './features/data-cards/Compositions';
import { CANVAS, getBarChartRaceTimeline } from '@/shared';
import { RankingShort, getShortTimeline } from '@/shared';
import React from 'react';
import { Composition, Folder } from 'remotion';
import { z } from 'zod';
// Shorts (shared)
import { BarChartRaceShortPreview } from './shared/components/shorts/previews/BarChartRaceShortPreview';
import { RankingTablePreview } from './shared/components/shorts/previews/RankingTablePreview';
import { ReelLastPagePreview } from './shared/components/shorts/previews/ReelLastPagePreview';
// Maps (shared)
// ranking-youtube-ges
// Layouts
import { LandscapePreview } from './features/layouts/previews/LandscapePreview';
import { PortraitPreview } from './features/layouts/previews/PortraitPreview';
// ranking-instagram
import { CarouselPreview } from './features/ranking-instagram/previews/CarouselPreview';
import { RankingTableSlidePreview } from './features/ranking-instagram/previews/RankingTableSlidePreview';
// ranking-quiz-instagram
import { RankingQuizCarouselPreview } from './features/ranking-quiz-instagram/previews/RankingQuizCarouselPreview';
// area-instagram (地域カルーセル・火/土枠)
import { AreaInstagramCarouselPreview } from './features/area-instagram/previews/AreaInstagramCarouselPreview';
// correlation-instagram (相関カルーセル・水枠)
import { CorrelationInstagramCarouselPreview } from './features/correlation-instagram/previews/CorrelationInstagramCarouselPreview';
// buzz-map (バズ地図カード)
import { BuzzMapStillPreview } from './features/buzz-map/previews/BuzzMapStillPreview';
import { BUZZ_MAP_RATIOS } from './features/buzz-map/tokens';
// ranking-x
import { ChoroplethMapStillPreview } from './features/ranking-x/previews/ChoroplethMapStillPreview';
import { RankingChartXPreview } from './features/ranking-x/previews/RankingChartXPreview';
import { GeoInsightCardPreview } from './features/geo-x/previews/GeoInsightCardPreview';
import type { GeoInsightCardProps } from './features/geo-x/GeoInsightCard';
// ranking-youtube
import { ThumbnailPreview } from './features/ranking-youtube/previews/ThumbnailPreview';
// ranking-note
import { NoteCoverPreview } from './features/ranking-note/previews/NoteCoverPreview';
// kazu-note
import { KazuNoteCoverPreview } from './features/kazu-note/previews/KazuNoteCoverPreview';
// compare-instagram
import { ComparisonCarouselPreview } from './features/compare-instagram/previews/ComparisonCarouselPreview';
// compare-carousel-instagram (ig-series 共通デザイン・県どうしの比較)
import { CompareCarouselInstagramPreview } from './features/compare-carousel-instagram/previews/CompareCarouselInstagramPreview';
// map-carousel-instagram (ig-series 共通デザイン・地図)
import { MapCarouselInstagramPreview } from './features/map-carousel-instagram/previews/MapCarouselInstagramPreview';
// area-profile-instagram
import { AreaProfileCarouselPreview } from './features/area-profile-instagram/previews/AreaProfileCarouselPreview';
// Charts (shared)
// Utils
import { VIDEO_CONFIG } from './utils/constants';
import { barChartRacePreviewData } from './utils/preview-data-bar-chart-race';
import { KazuNoteCoverSchema, AreaProfileCarouselSchema, BarChartRaceShortSchema, CarouselPreviewSchema, CommonPreviewSchema, CompareCarouselInstagramSchema, ComparisonCarouselSchema, MapCarouselInstagramSchema, LayoutPreviewSchema, RankingShortSchema, RankingQuizCarouselSchema, AreaInstagramCarouselSchema, CorrelationInstagramCarouselSchema, RankingTablePreviewSchema, ThumbnailPreviewSchema } from './utils/schema';

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
          {/* X用全47県タイル (1080x1350) */}
          <Composition
            id="RankingX-Chart"
            component={RankingChartXPreview}
            width={1080}
            height={1350}
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

          {/* 予想クイズ型カルーセル (4:5)。slide で 出題/ヒント/正解/全47県/締め を切替 */}
          <Composition
            id="RankingQuizInstagram-Carousel"
            component={RankingQuizCarouselPreview}
            width={CANVAS.carousel.width}
            height={CANVAS.carousel.height}
            fps={1}
            durationInFrames={1}
            schema={RankingQuizCarouselSchema}
            defaultProps={{
              slide: 'question' as const,
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
          </Folder>

          <Folder name="Normal">




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

          {/* 県どうしの比較カルーセル (ig-series 共通デザイン・4:5・4枚。金枠 §2-3c) */}
          <Composition
            id="CompareCarouselInstagram-Carousel"
            component={CompareCarouselInstagramPreview}
            width={CANVAS.carousel.width}
            height={CANVAS.carousel.height}
            fps={1}
            durationInFrames={1}
            schema={CompareCarouselInstagramSchema}
            defaultProps={{
              slide: 'cover' as const,
            }}
          />
        </Folder>

      </Folder>

      <Folder name="MapCarousel">
        <Folder name="Instagram">
          {/* 地図カルーセル (ig-series 共通デザイン・4:5・4枚。日枠 §2-3c) */}
          <Composition
            id="MapCarouselInstagram-Carousel"
            component={MapCarouselInstagramPreview}
            width={CANVAS.carousel.width}
            height={CANVAS.carousel.height}
            fps={1}
            durationInFrames={1}
            schema={MapCarouselInstagramSchema}
            defaultProps={{
              slide: 'cover' as const,
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

      {/* 地域カルーセル (火・土枠。正典 .claude/rules/sns-content-standards.md §2-3c) */}
      <Folder name="AreaCarousel">
        <Folder name="Instagram">
          {/* 地域カルーセル (4:5・5枚: cover/top/bottom/sources/outro) */}
          <Composition
            id="AreaInstagram-Carousel"
            component={AreaInstagramCarouselPreview}
            width={CANVAS.carousel.width}
            height={CANVAS.carousel.height}
            fps={1}
            durationInFrames={1}
            schema={AreaInstagramCarouselSchema}
            defaultProps={{
              slide: 'cover' as const,
            }}
          />
        </Folder>
      </Folder>

      {/* 相関カルーセル (水枠。正典 .claude/rules/sns-content-standards.md §2-3c) */}
      <Folder name="CorrelationCarousel">
        <Folder name="Instagram">
          {/* 相関カルーセル (4:5・5枚: cover/scatter/highlights/caution/outro) */}
          <Composition
            id="CorrelationInstagram-Carousel"
            component={CorrelationInstagramCarouselPreview}
            width={CANVAS.carousel.width}
            height={CANVAS.carousel.height}
            fps={1}
            durationInFrames={1}
            schema={CorrelationInstagramCarouselSchema}
            defaultProps={{
              slide: 'cover' as const,
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


      {/* 47都道府県 × 1976-2024 年次前年度比 コロプレス時系列 */}

      {/* 都道府県間 人口移動フロー (YouTube 16:9) */}

      {/* 駅別乗降客数バブルマップ (国土数値情報 S12) */}

      {/* パイプライン用据え置きコンポジション */}
      <Folder name="pipeline-stills">



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
      </Folder>

      <DataCardCompositions />

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
