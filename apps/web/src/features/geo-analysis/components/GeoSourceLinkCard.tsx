import { SurfaceLinkCard } from '@/components/surface';

import { GeoSourceThumbnail } from './GeoSourceThumbnail';

export function GeoSourceLinkCard({
  dataId,
  name,
  version,
  label,
  description,
  compact = false,
}: {
  dataId: string;
  name: string;
  version: string;
  label?: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <SurfaceLinkCard
      prefetch={false}
      href={`/geo/datasets/${dataId}`}
      data-geo-source-card={dataId}
      className={`group flex h-full min-w-0 overflow-hidden p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${compact ? '' : 'sm:flex-col'}`}
    >
      {label && (
        <div
          className={`w-24 shrink-0 self-start overflow-hidden bg-muted ${compact ? '' : 'sm:w-full'}`}
        >
          <GeoSourceThumbnail
            key={`${dataId}-${version}`}
            dataId={dataId}
            version={version}
            label={label}
            compact={compact}
          />
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-1 p-3">
        <span className="block text-sm font-semibold leading-snug group-hover:text-primary">
          {name}
        </span>
        {description && (
          <span className="block text-xs text-muted-foreground">
            {description}
          </span>
        )}
        {label && (
          <span className="block text-xs leading-relaxed text-muted-foreground">
            表示例：{label}
          </span>
        )}
        <span className="block text-xs text-primary">地図を見る →</span>
      </div>
    </SurfaceLinkCard>
  );
}
