import 'server-only';
import sharp from 'sharp';
import { readVerified } from '../../../../.claude/scripts/media/lib/storage.mjs';
import { assertMinimalChartCopy } from '../../../../.claude/scripts/media/lib/image-copy.mjs';
import { renderRankingBars } from '@/lib/template-ranking-bars';
import { renderRankingTable } from '@/lib/template-ranking-table';
import { renderRankingTileMap } from '@/lib/template-ranking-tile-map';
import { RANKING_SAMPLE_SOURCE, rankingInputFromStats } from '@/lib/template-ranking-data';

// Saved real-statistic snapshot, independent of the current article/image classification.
export const RANKING_BAR_INPUT = RANKING_SAMPLE_SOURCE;
export async function rankingSamplePng(kind: 'bars' | 'table' | 'tile-map' = 'bars') {
  const bytes = await readVerified(RANKING_BAR_INPUT);
  const input = rankingInputFromStats(JSON.parse(bytes.toString('utf8')));
  const renderers = { bars: renderRankingBars, table: renderRankingTable, 'tile-map': renderRankingTileMap };
  const svg = await renderers[kind](input);
  assertMinimalChartCopy(svg);
  return sharp(Buffer.from(svg), { limitInputPixels: 40_000_000 }).png().toBuffer();
}
