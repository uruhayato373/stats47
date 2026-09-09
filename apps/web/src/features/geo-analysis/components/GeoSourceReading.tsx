import { GIS_DATASETS_BY_ID } from '@stats47/gis/mlit-ksj';

import { ContentDisclosure } from '@/components/content';
import { SurfaceCard } from '@/components/surface';

import { findGeoSourceThumbnail } from '../lib/geo-source-thumbnail';

import { GeoSourceLinkCard } from './GeoSourceLinkCard';

import type { GeoSourcePageContent } from '@stats47/data-configs/business-plan';

export function GeoSourceReading({
  content,
}: {
  content: GeoSourcePageContent;
}) {
  return (
    <SurfaceCard
      className="mt-3 space-y-3 p-3"
      data-geo-reading={content.dataId}
    >
      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold">データの時点</dt>
          <dd className="mt-1 leading-relaxed text-muted-foreground">
            {content.period}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">対象範囲</dt>
          <dd className="mt-1 leading-relaxed text-muted-foreground">
            {content.coverage}
          </dd>
        </div>
      </dl>
      <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2 sm:gap-4">
        <section>
          <h2 className="mb-1 text-sm font-semibold">この地図で分かること</h2>
          <p className="text-sm leading-relaxed">{content.reading}</p>
        </section>
        <section>
          <h2 className="mb-1 text-sm font-semibold">読み方の注意</h2>
          <p className="text-sm leading-relaxed">{content.limitations}</p>
        </section>
      </div>
      <ContentDisclosure
        title="地図で確認できる主な属性"
        meta={
          <span className="text-xs font-normal text-muted-foreground">
            {content.fields.length}項目
          </span>
        }
        bordered={false}
      >
        <dl className="divide-y divide-border text-sm">
          {content.fields.map((field) => (
            <div
              key={field.key}
              className="grid gap-x-4 gap-y-1 py-2 first:pt-0 last:pb-0 sm:grid-cols-[9rem_minmax(0,1fr)]"
            >
              <dt className="font-medium">{field.label}</dt>
              <dd className="leading-relaxed text-muted-foreground">
                {field.description}
              </dd>
            </div>
          ))}
        </dl>
      </ContentDisclosure>
      <section className="border-t border-border pt-3">
        <h2 className="text-sm font-semibold">あわせて見るGIS</h2>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {content.relatedIds.map((id) => {
            const meta = GIS_DATASETS_BY_ID.get(id);
            return meta ? (
              <li key={id}>
                <GeoSourceLinkCard
                  dataId={id}
                  name={meta.name}
                  version={meta.latestVersion ?? ''}
                  label={findGeoSourceThumbnail(id, meta.latestVersion)?.label}
                  compact
                />
              </li>
            ) : null;
          })}
        </ul>
      </section>
    </SurfaceCard>
  );
}
