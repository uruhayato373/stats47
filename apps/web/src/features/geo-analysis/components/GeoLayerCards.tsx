import { GEO_LAYERS } from '@stats47/data-configs/business-plan';

import { SurfaceLinkCard } from '@/components/surface';

import { getTokyoMainlandGeography } from '../lib/geo-card-geography';
import { buildGeoCardPreview } from '../lib/geo-card-preview';
import { loadGeoAnalysisPrefBundle } from '../lib/load-geo-analysis-evidence';

export async function GeoLayerCards() {
  const geography = getTokyoMainlandGeography();
  const cards = await Promise.all(
    GEO_LAYERS.map(async (layer) => ({
      layer,
      bundle: await loadGeoAnalysisPrefBundle(layer.sourceAnalysis, '13'),
    }))
  );
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {cards.map(({ layer, bundle }) => {
        const preview = bundle
          ? buildGeoCardPreview(bundle.detail, geography, [], layer.kind)
          : null;
        return (
          <SurfaceLinkCard
            key={layer.slug}
            href={`/geo/layers/${layer.slug}`}
            className="min-w-0 overflow-hidden p-0"
          >
            <div className="relative aspect-video overflow-hidden bg-muted">
              {preview ? (
                <svg
                  viewBox="0 0 640 360"
                  role="img"
                  aria-label={`${layer.name}・東京都本土の表示例`}
                  className="absolute inset-0 h-full w-full bg-slate-50"
                >
                  <path
                    d={preview.boundary}
                    fill="#f1f5f9"
                    fillRule="evenodd"
                  />
                  {preview.paths.map((p) => (
                    <path
                      key={p.color}
                      d={p.d}
                      fill={p.color}
                      stroke="#fff"
                      strokeWidth="0.5"
                    />
                  ))}
                  {preview.points.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r="3"
                      fill={p.color}
                      stroke="#475569"
                      strokeWidth="0.8"
                    />
                  ))}
                  <path
                    d={preview.boundary}
                    fill="none"
                    stroke="#475569"
                    strokeWidth="2"
                  />
                </svg>
              ) : (
                <p className="p-5 text-sm">プレビューを取得できませんでした</p>
              )}
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              <h3 className="text-lg font-bold">{layer.name}</h3>
              <p className="text-sm">{layer.description}</p>
              <p className="text-xs text-muted-foreground">
                {layer.representation}
              </p>
              <p className="text-xs text-muted-foreground">
                {layer.kind === 'population'
                  ? '2050年推計人口：青が濃いほど多い'
                  : layer.kind === 'land-price'
                    ? '紫の点：住宅地の標準地点'
                    : '白い点：駅代表点'}
              </p>
              <p className="pt-2 text-sm font-semibold text-primary">
                単体の地図を見る →
              </p>
            </div>
          </SurfaceLinkCard>
        );
      })}
    </div>
  );
}
