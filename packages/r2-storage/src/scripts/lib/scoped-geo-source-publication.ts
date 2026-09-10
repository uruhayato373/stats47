import { createHash } from 'node:crypto';

import { LANDSLIDE_EXPOSURE_SOURCE as LANDSLIDE } from '../../../../data-configs/src/theme-catalog/landslide-exposure-source';
import { TSUNAMI_EXPOSURE_SOURCE as TSUNAMI } from '../../../../data-configs/src/theme-catalog/tsunami-exposure-source';
import { assertLandslideSourcePublication } from '../../../../gis/src/geo-analysis/landslide-exposure';

const SHA256 = /^[a-f0-9]{64}$/;

export interface ScopedGeoSourcePin {
  key: string;
  sha256: string;
  bytes: number;
  permissionEvidence: readonly { url: string; sha256: string }[];
}

/** This boundary is intentionally limited to the reviewed source families. */
export function isScopedGeoSourceKey(key: string): boolean {
  return (
    key.startsWith('gis/mlit-ksj/A33/') ||
    key.startsWith('gis/mlit-ksj/A40/') ||
    key.startsWith('gis/tokushima/tsunami-inundation/')
  );
}

/** Source policy remains authored SSOT, never a CLI override or caller allowlist. */
export function scopedGeoSourcePin(key: string): ScopedGeoSourcePin {
  const landslideMatch = /^gis\/mlit-ksj\/A33\/25\/(\d{2})\.zip$/.exec(key);
  if (landslideMatch) {
    const pref = landslideMatch[1];
    const source = LANDSLIDE.prefectures.find(
      (entry) => entry.areaCode === `${pref}000`
    );
    if (
      source &&
      'sha256' in source &&
      source.version === LANDSLIDE.a33.version &&
      source.publication === 'allowed-with-attribution' &&
      source.attribution.trim() &&
      SHA256.test(LANDSLIDE.a33.permissions.sha256)
    ) {
      assertLandslideSourcePublication(
        pref,
        source.sha256,
        LANDSLIDE.a33.permissions.sha256
      );
      return {
        key,
        sha256: source.sha256,
        bytes: source.bytes,
        permissionEvidence: [LANDSLIDE.a33.permissions],
      };
    }
  }

  const source = TSUNAMI.inputs.find(
    (entry) => entry.publicKey === key && entry.kind === 'hazard'
  ) as
    | ((typeof TSUNAMI.inputs)[number] & {
        redistributionAllowed?: boolean;
        licenseEvidence?: readonly { url: string; sha256: string }[];
      })
    | undefined;
  if (source) {
    const a40 = /^gis\/mlit-ksj\/A40\/(\d{2})\/(\d{2})\.zip$/.exec(key);
    const isA40 = Boolean(
      a40 &&
      source.provider === 'MLIT KSJ' &&
      source.pref === a40[2] &&
      source.version === `A40-${a40[1]}` &&
      source.url.startsWith(
        `https://nlftp.mlit.go.jp/ksj/gml/data/A40/A40-${a40[1]}/`
      )
    );
    const isTokushima = Boolean(
      key.startsWith('gis/tokushima/tsunami-inundation/') &&
      source.provider === 'Tokushima Prefecture' &&
      source.url.startsWith('https://opendata.pref.tokushima.lg.jp/')
    );
    const evidence = source.licenseEvidence;
    if (
      (isA40 || isTokushima) &&
      source.redistributionAllowed === true &&
      source.license.trim() &&
      evidence &&
      evidence.length > 0 &&
      evidence.every(
        (entry) =>
          SHA256.test(entry.sha256) &&
          TSUNAMI.evidence.some(
            (pin) => pin.url === entry.url && pin.sha256 === entry.sha256
          )
      ) &&
      (isA40
        ? evidence.some((entry) =>
            entry.url.startsWith(
              'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A40'
            )
          )
        : evidence.some(
            (entry) =>
              entry.url === 'https://opendata.pref.tokushima.lg.jp/kiyaku.html'
          ))
    ) {
      return {
        key,
        sha256: source.sha256,
        bytes: source.bytes,
        permissionEvidence: evidence.map(({ url, sha256 }) => ({
          url,
          sha256,
        })),
      };
    }
  }
  throw new Error(`未承認のGeo原典key・版・許諾: ${key}`);
}

export function assertScopedGeoSourcePublication(
  key: string,
  body: Buffer
): void {
  const pin = scopedGeoSourcePin(key);
  if (
    !SHA256.test(pin.sha256) ||
    body.length !== pin.bytes ||
    createHash('sha256').update(body).digest('hex') !== pin.sha256
  ) {
    throw new Error(`Geo原典の承認済みbyte/SHA不一致: ${key}`);
  }
}
