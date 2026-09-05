import { pipeline } from 'node:stream/promises';
import type { Readable } from 'node:stream';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { pick } from 'stream-json/filters/pick.js';
import { streamArray } from 'stream-json/streamers/stream-array.js';

/** ZIP entryを地物単位で読む。巨大GeoJSON全体をbuffer/JSON.parseしない。 */
export async function readFloodFeatures(
  source: Readable,
  visit: (
    feature: Feature<Polygon | MultiPolygon, Record<string, unknown>>
  ) => void
): Promise<number> {
  let count = 0;
  await pipeline(
    source,
    // 完成値だけで地物を組み立てる。座標ごとの部分文字列tokenを二重処理しない。
    pick.withParserAsStream({ filter: 'features', streamValues: false }),
    streamArray.asStream(),
    async (features) => {
      for await (const { value } of features) {
        if (
          value?.type !== 'Feature' ||
          !['Polygon', 'MultiPolygon'].includes(value.geometry?.type) ||
          !Array.isArray(value.geometry?.coordinates)
        ) {
          throw new Error('洪水GeoJSONに不正な地物があります');
        }
        visit(value);
        count += 1;
      }
    }
  );
  if (count === 0) throw new Error('洪水GeoJSONのfeaturesがありません');
  return count;
}
