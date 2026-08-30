import React from 'react';
import { AbsoluteFill } from 'remotion';

import type { BuzzMapGeo } from '@/features/buzz-map/geo';
import {
  BUZZ_MAP_FONT,
  BUZZ_MAP_RAMPS,
  buzzMapColors,
} from '@/features/buzz-map/tokens';
import { useBuzzMapFonts } from '@/features/buzz-map/useBuzzMapFonts';
import type { RankingEntry } from '@/shared';

import { GEO_X_LAYOUT, GEO_X_MAP_TRANSFORMS } from './layout';

export type GeoInsightRole =
  | 'baseline'
  | 'cross-analysis'
  | 'method'
  | 'decision';
export type GeoInsightPanelKind =
  | 'selected-values'
  | 'statement'
  | 'method'
  | 'layers';

export interface GeoInsightCardProps extends Record<string, unknown> {
  title: string;
  description: string;
  geoRole: GeoInsightRole;
  analysisLabel: string;
  layerLabels: string[];
  operationLabels: string[];
  sourceLabels: string[];
  metricLabel: string;
  metricUnit: string;
  metricFormat: string;
  mapMode: 'baseline-choropleth' | 'derived-choropleth' | 'focus';
  highlightAreaCodes: string[];
  panelKind: GeoInsightPanelKind;
  panelLabel: string;
  panelItems?: string[];
  allEntries: RankingEntry[];
  mapGeo?: BuzzMapGeo;
}

const COLORS = buzzMapColors('blue');
const HIGHLIGHT_COLORS = [
  COLORS.accentSocial,
  COLORS.accentInfra,
  '#e07b39',
  '#805ad5',
];
function normalizePrefCode(code: string): string {
  return code.length === 5 ? code : `${code.padStart(2, '0')}000`;
}

function formatValue(value: number, unit: string, format: string): string {
  if (format === 'integer') return `${Math.round(value).toLocaleString('ja-JP')}${unit}`;
  const decimals = format.includes('2') ? 2 : 1;
  const sign = format.toLowerCase().includes('signed') && value > 0 ? '+' : '';
  if (unit === '%') return `${sign}${value.toFixed(decimals)}%`;
  return `${sign}${value.toFixed(decimals)}${unit}`;
}

function selectedEntries(
  entries: RankingEntry[],
  areaCodes: readonly string[]
): RankingEntry[] {
  const byCode = new Map(entries.map((entry) => [entry.areaCode, entry]));
  return areaCodes
    .map((areaCode) => byCode.get(areaCode))
    .filter((entry): entry is RankingEntry => entry !== undefined);
}

function continuousFill(value: number | undefined, min: number, max: number): string {
  if (value === undefined) return COLORS.land;
  const ramp = BUZZ_MAP_RAMPS.blue;
  if (min < 0 && max > 0) {
    if (value >= 0) return COLORS.accentSocial;
    const ratio = Math.min(1, Math.abs(value) / Math.abs(min));
    return ramp[Math.round(ratio * (ramp.length - 1))];
  }
  const ratio = max === min ? 0.5 : (value - min) / (max - min);
  return ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(ratio * (ramp.length - 1))))];
}

function PanelShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        width: GEO_X_LAYOUT.insight.width,
        height: GEO_X_LAYOUT.insight.height,
        boxSizing: 'border-box',
        border: `2px solid ${COLORS.legendBorder}`,
        borderRadius: 14,
        background: 'rgba(255,255,255,.96)',
        padding: '14px 22px 16px',
      }}
    >
      <div
        style={{
          marginBottom: 10,
          borderBottom: `1px solid ${COLORS.legendBorder}`,
          paddingBottom: 8,
          color: COLORS.ink2,
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '.03em',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function ValueRow({
  entry,
  color,
  unit,
  format,
}: {
  entry: RankingEntry;
  color: string;
  unit: string;
  format: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        minWidth: 0,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 25, fontWeight: 700 }}>
        <span style={{ width: 16, height: 16, background: color }} />
        {entry.areaName}
      </span>
      <span
        style={{
          fontFamily: BUZZ_MAP_FONT.familyNum,
          fontSize: 24,
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        {formatValue(entry.value, unit, format)}
      </span>
    </div>
  );
}

function DataPanel({
  kind,
  label,
  items,
  highlighted,
  metricUnit,
  metricFormat,
}: {
  kind: GeoInsightPanelKind;
  label: string;
  items?: string[];
  highlighted: RankingEntry[];
  metricUnit: string;
  metricFormat: string;
}) {
  if (kind === 'selected-values') {
    return (
      <PanelShell label={label}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, highlighted.length)}, minmax(0, 1fr))`, gap: 28 }}>
          {highlighted.map((entry, index) => (
            <ValueRow
              key={entry.areaCode}
              entry={entry}
              color={HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length]}
              unit={metricUnit}
              format={metricFormat}
            />
          ))}
        </div>
      </PanelShell>
    );
  }

  const authoredItems = items ?? [];
  return (
    <PanelShell label={label}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(4, Math.max(1, authoredItems.length))}, minmax(0, 1fr))`,
          gap: 22,
        }}
      >
        {authoredItems.map((item) => (
          <div
            key={item}
            style={{
              display: 'flex',
              alignItems: 'center',
              minWidth: 0,
              borderLeft: `3px solid ${kind === 'layers' ? COLORS.accentInfra : COLORS.accentSocial}`,
              paddingLeft: 12,
              fontSize: kind === 'layers' ? 22 : 24,
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function JapanMap({
  geo,
  entries,
  mapMode,
  highlightAreaCodes,
}: {
  geo: BuzzMapGeo;
  entries: RankingEntry[];
  mapMode: GeoInsightCardProps['mapMode'];
  highlightAreaCodes: readonly string[];
}) {
  const mainlandTransform = GEO_X_MAP_TRANSFORMS.mainland;
  const insetTransform = GEO_X_MAP_TRANSFORMS.inset;
  const byCode = new Map(entries.map((entry) => [entry.areaCode, entry.value]));
  const values = entries.map((entry) => entry.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const highlightIndex = new Map(
    highlightAreaCodes.map((areaCode, index) => [areaCode, index])
  );
  const fillFor = (code: string) => {
    const normalized = normalizePrefCode(code);
    const selectedIndex = highlightIndex.get(normalized);
    if (mapMode === 'focus') {
      return selectedIndex === undefined
        ? COLORS.land
        : HIGHLIGHT_COLORS[selectedIndex % HIGHLIGHT_COLORS.length];
    }
    return continuousFill(byCode.get(normalized), min, max);
  };
  const drawPath = (item: { code: string; d: string }, prefix: string) => {
    const selected = highlightIndex.has(normalizePrefCode(item.code));
    return (
      <path
        key={`${prefix}-${item.code}`}
        d={item.d}
        fill={fillFor(item.code)}
        stroke={selected ? COLORS.ink : COLORS.landLine}
        strokeWidth={selected ? 3.5 : 1.35}
        strokeLinejoin="round"
      />
    );
  };

  return (
    <svg
      width={geo.width}
      height={geo.height}
      viewBox={`0 0 ${geo.width} ${geo.height}`}
      style={{
        position: 'absolute',
        left: GEO_X_LAYOUT.mapStage.x,
        top: GEO_X_LAYOUT.mapStage.y,
        clipPath: `inset(0 0 ${geo.height - GEO_X_LAYOUT.mapStage.height}px 0)`,
      }}
    >
      <g
        transform={`translate(${mainlandTransform.translateX} ${mainlandTransform.translateY}) scale(${mainlandTransform.scale})`}
      >
        {geo.mainland.map((item) => drawPath(item, 'main'))}
      </g>
      {geo.insetBox ? (
        <g
          transform={`translate(${insetTransform.translateX} ${insetTransform.translateY}) scale(${insetTransform.scale})`}
        >
          <rect
            x={geo.insetBox.x - 6}
            y={geo.insetBox.y - 6}
            width={geo.insetBox.width + 12}
            height={geo.insetBox.height + 12}
            rx={6}
            fill="none"
            stroke={COLORS.landLine}
            strokeWidth={1.5}
          />
          <text
            x={geo.insetBox.x + 14}
            y={geo.insetBox.y + 28}
            fontSize={42}
            fill={COLORS.ink2}
          >
            沖縄県
          </text>
          {geo.inset?.map((item) => drawPath(item, 'inset'))}
        </g>
      ) : null}
    </svg>
  );
}

function MapLegend({
  mapMode,
  entries,
  highlighted,
  metricLabel,
  metricUnit,
  metricFormat,
}: {
  mapMode: GeoInsightCardProps['mapMode'];
  entries: RankingEntry[];
  highlighted: RankingEntry[];
  metricLabel: string;
  metricUnit: string;
  metricFormat: string;
}) {
  if (mapMode === 'focus') {
    return (
      <div style={{ display: 'flex', maxWidth: 540, flexWrap: 'wrap', gap: '8px 18px', fontSize: 21, fontWeight: 700 }}>
        {highlighted.map((entry, index) => (
          <span key={entry.areaCode} style={{ whiteSpace: 'nowrap' }}>
            <span style={{ color: HIGHLIGHT_COLORS[index] }}>■</span> {entry.areaName}{' '}
            {formatValue(entry.value, metricUnit, metricFormat)}
          </span>
        ))}
      </div>
    );
  }
  const min = Math.min(...entries.map((entry) => entry.value));
  const max = Math.max(...entries.map((entry) => entry.value));
  return (
    <div style={{ width: 500, color: COLORS.ink2, fontSize: 20 }}>
      <div style={{ marginBottom: 7, fontWeight: 700 }}>{metricLabel}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>{formatValue(min, metricUnit, metricFormat)}</span>
        <div
          style={{
            width: 230,
            height: 14,
            border: `1px solid ${COLORS.legendBorder}`,
            borderRadius: 7,
            background: `linear-gradient(90deg, ${BUZZ_MAP_RAMPS.blue.join(',')}, ${COLORS.accentSocial})`,
          }}
        />
        <span>{formatValue(max, metricUnit, metricFormat)}</span>
      </div>
    </div>
  );
}

function LayerContract({
  analysisLabel,
  layers,
  operations,
}: {
  analysisLabel: string;
  layers: string[];
  operations: string[];
}) {
  const geometries = [...new Set(
    layers
      .map((layer) => layer.match(/［([^］]+)］/)?.[1])
      .filter((geometry): geometry is string => Boolean(geometry))
  )];
  const isMultiAnalysis = layers.length > 2;
  const finalOperation = operations[operations.length - 1];
  return (
    <div
      style={{
        position: 'absolute',
        top: 218,
        left: GEO_X_LAYOUT.header.x,
        width: GEO_X_LAYOUT.header.width,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderTop: `1px solid ${COLORS.legendBorder}`,
        paddingTop: 9,
        color: COLORS.ink2,
        fontSize: 17,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {isMultiAnalysis ? (
        <>
          <span>{analysisLabel}</span>
          <span style={{ color: COLORS.accentSocial }}>·</span>
          <span>{layers.length}レイヤー（{geometries.join(' / ')}）</span>
          <span style={{ color: COLORS.accentInfra }}>→</span>
          <span>空間処理 {operations.length}工程</span>
        </>
      ) : (
        <>
          {layers.map((layer, index) => (
            <React.Fragment key={layer}>
              {index > 0 ? <span style={{ color: COLORS.accentSocial }}>×</span> : null}
              <span>{layer}</span>
            </React.Fragment>
          ))}
          {finalOperation ? (
            <>
              <span style={{ color: COLORS.accentInfra }}>→</span>
              <span>{finalOperation}</span>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

export const GeoInsightCard: React.FC<GeoInsightCardProps> = ({
  title,
  description,
  analysisLabel,
  layerLabels,
  operationLabels,
  sourceLabels,
  metricLabel,
  metricUnit,
  metricFormat,
  mapMode,
  highlightAreaCodes,
  panelKind,
  panelLabel,
  panelItems,
  allEntries,
  mapGeo,
}) => {
  useBuzzMapFonts();
  const highlighted = selectedEntries(allEntries, highlightAreaCodes);
  const titleSize = title.length > 18 ? 46 : title.length > 16 ? 50 : title.length > 14 ? 54 : 60;

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: COLORS.sea,
        color: COLORS.ink,
        fontFamily: BUZZ_MAP_FONT.family,
      }}
    >
      {mapGeo ? (
        <JapanMap
          geo={mapGeo}
          entries={allEntries}
          mapMode={mapMode}
          highlightAreaCodes={highlightAreaCodes}
        />
      ) : null}

      <header style={{ position: 'absolute', top: 34, left: 48, width: 984 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 42,
            marginBottom: 10,
            color: COLORS.ink2,
            fontSize: 17,
            fontWeight: 700,
          }}
        >
          <span style={{ width: 180, flexShrink: 0, color: COLORS.ink, fontSize: 20 }}>GeoAI地域分析</span>
          <span style={{ width: 650, flexShrink: 0, textAlign: 'right', fontSize: 12, lineHeight: 1.35 }}>
            {analysisLabel} ・ {sourceLabels.length === 1 ? sourceLabels[0] : `公式出典${sourceLabels.length}件`}
          </span>
        </div>
        <h1
          style={{
            margin: 0,
            maxWidth: 976,
            fontSize: titleSize,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: '8px 0 0',
            maxWidth: 960,
            color: COLORS.ink2,
            fontSize: 23,
            lineHeight: 1.36,
          }}
        >
          {description}
        </p>
      </header>

      <LayerContract
        analysisLabel={analysisLabel}
        layers={layerLabels}
        operations={operationLabels}
      />

      <div style={{ position: 'absolute', left: GEO_X_LAYOUT.insight.x, top: GEO_X_LAYOUT.insight.y }}>
        <DataPanel
          kind={panelKind}
          label={panelLabel}
          items={panelItems}
          highlighted={highlighted}
          metricUnit={metricUnit}
          metricFormat={metricFormat}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: GEO_X_LAYOUT.legend.x,
          top: GEO_X_LAYOUT.legend.y,
          display: 'flex',
          height: GEO_X_LAYOUT.legend.height,
          alignItems: 'center',
        }}
      >
        <MapLegend
          mapMode={mapMode}
          entries={allEntries}
          highlighted={highlighted}
          metricLabel={metricLabel}
          metricUnit={metricUnit}
          metricFormat={metricFormat}
        />
      </div>

      <footer
        style={{
          position: 'absolute',
          left: GEO_X_LAYOUT.footer.x,
          top: GEO_X_LAYOUT.footer.y,
          display: 'flex',
          alignItems: 'baseline',
          gap: 13,
          color: COLORS.ink2,
          fontSize: 18,
          letterSpacing: '.04em',
        }}
      >
        <span style={{ color: COLORS.ink, fontSize: 24, fontWeight: 700 }}>stats47.jp</span>
        <span>地図で重ねて、地域の選択肢を読む。</span>
        <span style={{ marginLeft: 'auto', fontSize: 14 }}>公式データをstats47.jpで加工</span>
      </footer>
    </AbsoluteFill>
  );
};
