import { createReadStream } from 'node:fs';
import { StringDecoder } from 'node:string_decoder';

export type StreamedGeoJsonFeature = {
  type: 'Feature';
  geometry: unknown;
  properties: Record<string, unknown> | null;
};

/** 巨大FeatureCollectionを単一文字列にせず、features配列を決定的なbatchへ分割する。 */
export async function* streamGeoJsonFeatureBatches(
  filePath: string,
  options: { maxFeatures: number; maxBytes: number; highWaterMark?: number }
): AsyncGenerator<StreamedGeoJsonFeature[]> {
  if (options.maxFeatures < 1 || options.maxBytes < 1) {
    throw new Error('stream limits must be positive');
  }
  const decoder = new StringDecoder('utf8');
  const stream = createReadStream(filePath, {
    highWaterMark: options.highWaterMark ?? 1024 * 1024,
  });
  let locatingFeatures = true;
  let searchBuffer = '';
  let inFeaturesArray = false;
  let objectDepth = 0;
  let inString = false;
  let escaped = false;
  let featureText = '';
  let batch: StreamedGeoJsonFeature[] = [];
  let batchBytes = 0;
  let arrayEnded = false;

  const flushFeature = (): StreamedGeoJsonFeature => {
    const parsed = JSON.parse(featureText) as StreamedGeoJsonFeature;
    if (parsed.type !== 'Feature' || !('geometry' in parsed)) {
      throw new Error(`Invalid GeoJSON feature (${filePath})`);
    }
    featureText = '';
    return parsed;
  };

  for await (const rawChunk of stream) {
    let chunk = decoder.write(rawChunk as Buffer);
    if (locatingFeatures) {
      searchBuffer += chunk;
      const keyIndex = searchBuffer.search(/"features"\s*:/u);
      if (keyIndex < 0) {
        searchBuffer = searchBuffer.slice(-64);
        continue;
      }
      const arrayIndex = searchBuffer.indexOf('[', keyIndex);
      if (arrayIndex < 0) {
        searchBuffer = searchBuffer.slice(keyIndex);
        continue;
      }
      chunk = searchBuffer.slice(arrayIndex + 1);
      searchBuffer = '';
      locatingFeatures = false;
      inFeaturesArray = true;
    }

    for (const char of chunk) {
      if (!inFeaturesArray || arrayEnded) break;
      if (objectDepth === 0) {
        if (char === '{') {
          objectDepth = 1;
          featureText = '{';
          inString = false;
          escaped = false;
        } else if (char === ']') {
          arrayEnded = true;
          inFeaturesArray = false;
        } else if (!/[\s,\u0000]/u.test(char)) {
          throw new Error(`Invalid token before GeoJSON feature (${filePath})`);
        }
        continue;
      }

      featureText += char;
      if (inString) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') inString = true;
      else if (char === '{') objectDepth += 1;
      else if (char === '}') {
        objectDepth -= 1;
        if (objectDepth === 0) {
          const featureBytes = Buffer.byteLength(featureText, 'utf8');
          if (
            batch.length > 0 &&
            (batch.length >= options.maxFeatures || batchBytes + featureBytes > options.maxBytes)
          ) {
            yield batch;
            batch = [];
            batchBytes = 0;
          }
          batch.push(flushFeature());
          batchBytes += featureBytes;
        }
      }
    }
  }
  const tail = decoder.end();
  if (tail && !arrayEnded) {
    throw new Error(`Unexpected trailing UTF-8 sequence (${filePath})`);
  }
  if (!arrayEnded || objectDepth !== 0 || inString) {
    throw new Error(`Incomplete GeoJSON FeatureCollection (${filePath})`);
  }
  if (batch.length > 0) yield batch;
}
