import Link from 'next/link';

import { GIS_DATASETS_BY_ID } from '@stats47/gis/mlit-ksj';

import { SurfaceCard } from '@/components/surface';

import type { GeoSourcePageContent } from '@stats47/data-configs/business-plan';

export function GeoSourceReading({
  content,
}: {
  content: GeoSourcePageContent;
}) {
  return (
    <div className="mt-6 space-y-6" data-geo-reading={content.dataId}>
      <SurfaceCard className="space-y-3">
        <h2 className="font-semibold">この地図で分かること</h2>
        <p className="text-sm leading-relaxed">{content.reading}</p>
        <h2 className="font-semibold">読み方の注意</h2>
        <p className="text-sm leading-relaxed">{content.limitations}</p>
      </SurfaceCard>
      <SurfaceCard>
        <h2 className="mb-3 font-semibold">地図で確認できる主な属性</h2>
        <dl className="divide-y divide-border text-sm">
          {content.fields.map((field) => (
            <div key={field.key} className="py-3 first:pt-0 last:pb-0">
              <dt className="font-medium">{field.label}</dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground">
                {field.description}
              </dd>
            </div>
          ))}
        </dl>
      </SurfaceCard>
      <SurfaceCard>
        <h2 className="mb-2 font-semibold">あわせて見るGIS</h2>
        <p className="mb-2 text-sm text-muted-foreground">
          データの粒度や対象範囲の違いを、単体の地図で比較できます。
        </p>
        <ul className="divide-y divide-border">
          {content.relatedIds.map((id) => {
            const meta = GIS_DATASETS_BY_ID.get(id);
            return meta ? (
              <li key={id}>
                <Link
                  prefetch={false}
                  href={`/geo/datasets/${id}`}
                  className="flex min-h-11 items-center py-2 text-sm text-primary underline"
                >
                  {meta.name}
                </Link>
              </li>
            ) : null;
          })}
        </ul>
      </SurfaceCard>
    </div>
  );
}
