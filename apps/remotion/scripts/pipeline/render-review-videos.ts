#!/usr/bin/env tsx
/**
 * 型の最終確認の画面 (/ops/image-templates/review) で再生する動画の見本を作る。
 *
 * 残している 2 種類 (ランキングのショート・バーチャートレース) を、公開 R2 の実データで半分の大きさに描く。
 * R2 へは書かない。出力は .local/video-review/ (git に置かない)。
 *
 *   npm run review-videos --workspace remotion
 */
import fs from 'node:fs';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { openBrowser, renderMedia, selectComposition } from '@remotion/renderer';
import { SITE } from '@stats47/types';
import { getBarChartRaceTimeline } from '../../src/shared/utils/bar-chart-race';
import { makeWebpackOverride } from '../../src/webpack-override';

const ROOT = path.resolve(__dirname, '../../../..');
const OUT = path.join(ROOT, '.local/video-review');
const R2 = process.env.R2_PUBLIC_FETCH_URL || SITE.r2PublicBaseUrl;
const RANKING_KEY = 'maximum-temperature';
const RACE_KEY = 'fiscal-strength-index-prefecture';
const REVIEW_SCALE = 0.5;
// The Chrome already on a Windows PC, so a render needs no browser download through the proxy.
const WINDOWS_CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

type Json = Record<string, unknown>;
const json = async (key: string, optional = false): Promise<Json> => {
  const res = await fetch(`${R2}/${key}`);
  if (res.ok) return (await res.json()) as Json;
  if (optional) return {};
  throw new Error(`${key}: HTTP ${res.status}`);
};

async function rankingProps(variant: string) {
  const [data, stored, caption] = [await json(`sns/ranking/${RANKING_KEY}/data.json`), await json(`app/ranking/${RANKING_KEY}/item.json`), await json(`sns/ranking/${RANKING_KEY}/instagram/caption.json`, true)];
  const item = stored.item as Json;
  return {
    theme: 'dark', variant, showSafeAreas: false, gesBackground: false, hookText: caption.hookText ?? '', displayTitle: caption.displayTitle ?? '',
    meta: { title: item.title, subtitle: item.subtitle, unit: data.unit, yearName: data.yearName, presentation: item.visualization },
    allEntries: (data.data as Json[]).map(({ rank, areaCode, areaName, value }) => ({ rank, areaCode, areaName, value })),
  };
}

async function raceProps(variant: string) {
  const [config, data] = [await json(`sns/bar-chart-race/${RACE_KEY}/config.json`), await json(`sns/bar-chart-race/${RACE_KEY}/data.json`)];
  return { theme: 'dark', variant, topN: 15, showSafeAreas: false, frames: data.frames, title: config.title, unit: config.unit, hookText: config.hookText, eventLabels: config.eventLabels, enableSpoilerHook: config.enableSpoilerHook ?? false, colorScheme: config.colorScheme };
}

const raceDuration = (props: Awaited<ReturnType<typeof raceProps>>) =>
  getBarChartRaceTimeline({ frameCount: (props.frames as unknown[]).length, enableSpoilerHook: props.enableSpoilerHook as boolean }).totalDuration;

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const [ranking, race] = [await rankingProps('instagram'), await raceProps('instagram')];
  const jobs = [
    { id: 'RankingInstagram-Reel', file: 'ranking-reel', label: 'ランキングのショート (Instagram)', source: RANKING_KEY, props: ranking as Json },
    { id: 'RankingYouTube-Short', file: 'ranking-short', label: 'ランキングのショート (YouTube)', source: RANKING_KEY, props: await rankingProps('youtube-short') as Json },
    { id: 'BarChartRace-InstagramReel', file: 'race-reel', label: 'バーチャートレース (Instagram)', source: RACE_KEY, props: race as Json, frames: raceDuration(race) },
    { id: 'BarChartRace-YouTubeShort', file: 'race-short', label: 'バーチャートレース (YouTube)', source: RACE_KEY, props: await raceProps('youtube') as Json, frames: raceDuration(race) },
  ];
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'apps/remotion/src/index.ts'), webpackOverride: makeWebpackOverride(path.join(ROOT, 'apps/remotion/src')), publicDir: path.join(ROOT, 'apps/remotion/public') });
  const browserExecutable = process.platform === 'win32' && fs.existsSync(WINDOWS_CHROME) ? WINDOWS_CHROME : null;
  const browser = await openBrowser('chrome', { browserExecutable });
  const videos = [];
  for (const job of jobs) {
    console.log(`🎬 ${job.id}`);
    const composition = await selectComposition({ serveUrl, id: job.id, inputProps: job.props, puppeteerInstance: browser });
    if (job.frames) composition.durationInFrames = job.frames;
    const file = `${job.file}.mp4`;
    await renderMedia({ serveUrl, composition, outputLocation: path.join(OUT, file), inputProps: job.props, codec: 'h264', scale: REVIEW_SCALE, puppeteerInstance: browser });
    videos.push({ id: job.id, label: job.label, file, source: job.source, seconds: Math.round(composition.durationInFrames / composition.fps) });
  }
  await browser.close({ silent: true });
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), videos }, null, 2));
  console.log(`${videos.length} 本を ${OUT} へ書いた`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
