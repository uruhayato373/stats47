'use client';

import { useState } from 'react';

import { Map } from 'lucide-react';

import { ogpImageUrl } from '@/lib/metadata/ogp-image';

import {
  GEO_THUMBNAIL_REVISION,
  geoThumbnailKey,
} from '../lib/geo-source-thumbnail';

/** Both variants refit the same geographic excerpt; CSS never crops the map. */
export function GeoSourceThumbnail({
  dataId,
  version,
  label,
  compact = false,
}: {
  dataId: string;
  version: string;
  label: string;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const url = (variant: 'wide' | 'square') =>
    process.env.NODE_ENV === 'development'
      ? `/api/geo/thumbnail/${dataId}/${variant}?v=${GEO_THUMBNAIL_REVISION}`
      : `${ogpImageUrl(geoThumbnailKey(dataId, version, variant))}?v=${GEO_THUMBNAIL_REVISION}`;
  if (failed)
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground ${compact ? 'aspect-square' : 'aspect-square sm:aspect-video'}`}
        aria-label="画像を取得できませんでした"
      >
        <Map aria-hidden="true" className="size-8" />
      </div>
    );
  return (
    <picture className="block">
      {!compact && (
        <source
          media="(min-width: 640px)"
          srcSet={url('wide')}
          width={640}
          height={360}
        />
      )}
      {/* Pre-encoded static WebP; native picture selects one geographic composition. */}
      <img
        src={url('square')}
        alt={`表示例：${label}`}
        width={256}
        height={256}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={
          compact
            ? 'aspect-square w-full object-contain'
            : 'aspect-square w-full object-contain sm:aspect-video'
        }
      />
    </picture>
  );
}
