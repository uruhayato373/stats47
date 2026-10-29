import { INFRA_SCOPE_REGIONS } from '@stats47/gis/infra-history';
import { GEO_SUBJECTS } from '@stats47/gis/subjects';

import { ExternalAnchor } from '@/components/atoms/ExternalAnchor';
import Link from '@/components/atoms/SiteLink';
import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { PanelGrid } from '@/components/layout/PageShell';
import { LinkRowFrame, LinkRowNav, linkRowItemClass } from '@/components/navigation/StatisticsScopeNav';
import { SurfaceCard } from '@/components/surface';

import { DROP_REASON_TEXT, geoMapHref, prefName, type GeoMapSelection } from '../lib/geo-map-selection';
import { loadGeoMapLayers, type GeoMapLayer, type GeoMapUnavailable } from '../lib/load-geo-map';

import { GeoSubjectMap } from './GeoSubjectMap';

const UNAVAILABLE_TEXT: Record<GeoMapUnavailable['reason'], string> = {
  'not-built': '地図用のデータを準備中',
  'not-published': '公開の了承を確認中',
  'load-failed': 'データを読み込めませんでした',
};

function yearRangeOf(layer: GeoMapLayer): [number, number] {
  return layer.kind === 'features' ? [layer.firstYear, layer.lastYear] : [layer.years[0], layer.years[layer.years.length - 1]];
}

/**
 * スライダーの期間。背景 (塗り分け) を選んだら、全主題に値がある期間に絞る (背景が空の年を出さない)。
 * 共通の期間が無いときと背景が無いときは、全主題の期間を合わせる
 */
function sliderRange(layers: readonly GeoMapLayer[]): { first: number; last: number; narrowedBy: GeoMapLayer | null } {
  const ranges = layers.map(yearRangeOf);
  const union = { first: Math.min(...ranges.map((r) => r[0])), last: Math.max(...ranges.map((r) => r[1])) };
  const base = layers.find((layer) => layer.kind === 'municipal') ?? null;
  if (!base) return { ...union, narrowedBy: null };
  const first = Math.max(...ranges.map((r) => r[0]));
  const last = Math.min(...ranges.map((r) => r[1]));
  if (first > last) return { ...union, narrowedBy: null };
  return { first, last, narrowedBy: first !== union.first || last !== union.last ? base : null };
}

/** 範囲の切り替え: 全国・9 区分 (1 道県の区分は県)・選んだ地方の県 */
function scopeNavItems(selection: GeoMapSelection, baseId: string | null, overlayIds: readonly string[]) {
  const { scope } = selection;
  const regionOfScope = INFRA_SCOPE_REGIONS.find((region) =>
    scope.kind === 'region' ? region.code === scope.slug : scope.kind === 'prefecture' && region.prefCodes.includes(scope.slug),
  );
  const top = [
    { key: 'national', label: '全国', slug: 'national' },
    ...INFRA_SCOPE_REGIONS.map((region) => ({
      key: region.code,
      label: region.name,
      slug: region.prefCodes.length === 1 ? region.prefCodes[0] : region.code,
    })),
  ].map((item) => ({
    key: item.key,
    label: item.label,
    href: geoMapHref(baseId, overlayIds, item.slug),
    current: item.slug === scope.slug || (scope.kind === 'prefecture' && regionOfScope?.code === item.key && regionOfScope.prefCodes.length > 1),
  }));
  return { top, region: regionOfScope && regionOfScope.prefCodes.length > 1 ? regionOfScope : null };
}

export async function GeoMapPage({ selection }: { selection: GeoMapSelection }) {
  const { scope, base, overlays, dropped } = selection;
  const baseId = base?.id ?? null;
  const overlayIds = overlays.map((subject) => subject.id);
  const { layers, unavailable, sources } = await loadGeoMapLayers(base ? [base, ...overlays] : overlays, scope);
  const range = layers.length > 0 ? sliderRange(layers) : null;
  const scopeNav = scopeNavItems(selection, baseId, overlayIds);
  const inScope = GEO_SUBJECTS.filter((subject) => subject.scopes.includes(scope.kind));
  const baseChoices = inScope.filter((subject) => subject.geometry === 'area');
  const overlayChoices = inScope.filter((subject) => subject.geometry !== 'area');

  return (
    <PageShell
      header={
        <>
          <Breadcrumbs
            items={[
              { label: 'ホーム', href: '/' },
              { label: '地域分析', href: '/geo' },
              { label: '地図を重ねて見る' },
            ]}
          />
          <PageHeader
            title={`地図を重ねて見る（${scope.name}）`}
            description="市区町村の人口などを背景に塗り分け、交通網などを重ねて、年を動かして見比べます。重ねるだけで、関係の有無は判断していません。"
          />
        </>
      }
    >
      <PanelGrid>
        <div className="space-y-1">
          <LinkRowNav label="表示する範囲" items={scopeNav.top} />
          {scopeNav.region && (
            <LinkRowNav
              label={`${scopeNav.region.name}の県`}
              items={scopeNav.region.prefCodes.map((code) => ({
                key: code,
                label: prefName(code),
                href: geoMapHref(baseId, overlayIds, code),
                current: scope.slug === code,
              }))}
            />
          )}
          {/* 背景 (塗り分け) は 1 つだけ選ぶ。全国では市区町村の塗り分けを描かないので選択肢が出ない */}
          {baseChoices.length > 0 && (
            <LinkRowNav
              label="背景"
              items={[
                { key: 'none', label: '背景なし', href: geoMapHref(null, overlayIds, scope.slug), current: base === null },
                ...baseChoices.map((subject) => ({
                  key: subject.id,
                  label: subject.label,
                  href: geoMapHref(subject.id, overlayIds, scope.slug),
                  current: subject.id === baseId,
                })),
              ]}
            />
          )}
          {/* 重ねるもの (線・点) は押すたびに足す・外す。表示中かどうかは見た目と読み上げの両方で示す */}
          <LinkRowFrame label="重ねるもの">
            {overlayChoices.map((subject) => {
              const isSelected = overlayIds.includes(subject.id);
              const next = isSelected ? overlayIds.filter((id) => id !== subject.id) : [...overlayIds, subject.id];
              return (
                <Link key={subject.id} href={geoMapHref(baseId, next, scope.slug)} data-slot="button" className={linkRowItemClass(isSelected)}>
                  {subject.label}
                  <span className="sr-only">{isSelected ? '（表示中。押すと外す）' : '（押すと重ねる）'}</span>
                </Link>
              );
            })}
          </LinkRowFrame>
        </div>

        {(dropped.length > 0 || unavailable.length > 0) && (
          <p className="px-4 py-2 text-xs leading-relaxed text-muted-foreground">
            {[
              ...dropped.map((item) => `${item.id}（${DROP_REASON_TEXT[item.reason]}）`),
              ...unavailable.map((item) => `${item.label}（${UNAVAILABLE_TEXT[item.reason]}）`),
            ].join('、')}
            は表示していません。
          </p>
        )}

        {layers.length > 0 && range ? (
          <GeoSubjectMap
            scopeName={scope.name}
            prefCodes={scope.prefCodes}
            isNational={scope.kind === 'national'}
            layers={layers}
            firstYear={range.first}
            lastYear={range.last}
            rangeNote={
              range.narrowedBy
                ? `${range.narrowedBy.label}に値がある ${range.first}〜${range.last}年に絞っています。背景なしにすると、重ねるものの全期間を見られます。`
                : null
            }
          />
        ) : (
          <SurfaceCard>
            <p>背景か重ねるものを上から選んでください。</p>
          </SurfaceCard>
        )}

        {sources.length > 0 && (
          <p className="px-4 py-2 text-xs leading-relaxed text-muted-foreground">
            出典：
            {sources.map((source, i) => (
              <span key={source.label}>
                {i > 0 && '、'}
                {source.href ? (
                  <ExternalAnchor href={source.href} className="underline">
                    {source.label}
                  </ExternalAnchor>
                ) : (
                  source.label
                )}
              </span>
            ))}
            、国土交通省「国土数値情報 行政区域」を stats47 が加工。
          </p>
        )}
      </PanelGrid>
    </PageShell>
  );
}
