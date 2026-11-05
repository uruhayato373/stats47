import { chordDirected, ribbon } from 'd3-chord';
import { arc } from 'd3-shape';
import { REGIONS } from '../../../packages/area/src/constants/regions';
import { prefectureShortName } from '../../../packages/area/src/utils/prefecture-short-name';
import { LIGHT_THEME, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';
import { escapeXml, sampleFrame } from './template-sample-frame';

/** One flow matrix: `matrix[from][to]` is the amount moving from node `from` to node `to`. */
export interface ChordChart {
  title: string;
  meta: string;
  note?: string;
  source: string;
  nodes: { label: string; color: string }[];
  matrix: number[][];
}

/** A pair's movement as the R2 migration-flow file keeps it: `inflow` is the move from `fromPrefCode` to `toPrefCode`. */
export interface MigrationPair { fromPrefCode: string; toPrefCode: string; inflow: number }

const PREFECTURES = 47;
const CENTER = { x: 540, y: 770 } as const;
const RADIUS = { inner: 352, outer: 380, label: 402 } as const;
const REGION_LABEL_SIZE = 34;
const PREF_LABEL_SIZE = 23;
// Below this many nodes every label fits along the ring; above it labels turn outward and spread apart.
const RADIAL_FROM = 10;
const MIN_LABEL_GAP = (3.4 * Math.PI) / 180;
const SPREAD_PASSES = 60;

const prefIndex = (code: string) => Number(code.slice(0, 2)) - 1;
const regionIndex = (i: number) => REGIONS.findIndex((r) => r.prefectures.includes(`${String(i + 1).padStart(2, '0')}000`));

function prefectureMatrix(pairs: MigrationPair[]) {
  const matrix = Array.from({ length: PREFECTURES }, () => Array<number>(PREFECTURES).fill(0));
  for (const pair of pairs) {
    const from = prefIndex(pair.fromPrefCode), to = prefIndex(pair.toPrefCode);
    if (!(from >= 0 && from < PREFECTURES && to >= 0 && to < PREFECTURES) || !Number.isFinite(pair.inflow) || pair.inflow < 0)
      throw Error('県の組み合わせか移動の値を確認してください。');
    matrix[from][to] = pair.inflow;
  }
  return matrix;
}

/** Every prefecture pair, coloured by region. */
export function prefectureChordNodes(pairs: MigrationPair[], prefectureNames: string[]) {
  return {
    nodes: prefectureNames.map((name, i) => ({ label: prefectureShortName(name), color: REGIONS[regionIndex(i)].color })),
    matrix: prefectureMatrix(pairs),
  };
}

/** Moves between regions; moves inside a region are left out because they do not cross the ring. */
export function regionChordNodes(pairs: MigrationPair[]) {
  const matrix = REGIONS.map(() => Array<number>(REGIONS.length).fill(0));
  prefectureMatrix(pairs).forEach((row, from) => row.forEach((value, to) => {
    if (regionIndex(from) !== regionIndex(to)) matrix[regionIndex(from)][regionIndex(to)] += value;
  }));
  return { nodes: REGIONS.map((r) => ({ label: r.regionName, color: r.color })), matrix };
}

/** Push neighbouring angles apart to `gap`, each by half, so labels leave their arcs as little as possible. */
function spreadAngles(angles: number[], gap: number) {
  const placed = [...angles];
  for (let pass = 0; pass < SPREAD_PASSES; pass++)
    for (let i = 1; i < placed.length; i++) {
      const lack = placed[i - 1] + gap - placed[i];
      if (lack > 0) { placed[i - 1] -= lack / 2; placed[i] += lack / 2; }
    }
  return placed;
}

/**
 * The chord type: a ring of nodes sized by the amount leaving them, and one ribbon per pair, coloured by
 * where the move starts. The same drawing serves regions and prefectures; only the labels change with the
 * node count. Values stay in the data: ribbons show the whole of the relation, not figures to read off.
 */
export function renderChordChart(chart: ChordChart, theme: ChartTheme = LIGHT_THEME) {
  const { nodes, matrix } = chart;
  if (matrix.length !== nodes.length || matrix.some((row) => row.length !== nodes.length))
    throw Error('コード図の行列と項目の数が一致しません。');
  const dense = nodes.length > RADIAL_FROM;
  const layout = chordDirected().padAngle(dense ? 0.012 : 0.04).sortSubgroups((a, b) => b - a)(matrix);
  const groupArc = arc<{ startAngle: number; endAngle: number }>().innerRadius(RADIUS.inner).outerRadius(RADIUS.outer);
  const ribbonPath = ribbon<unknown, { startAngle: number; endAngle: number; radius: number }>() as unknown as
    (d: { source: object; target: object }) => string;
  const ribbons = [...layout].sort((a, b) => a.source.value - b.source.value).map((c) => {
    const edge = { radius: RADIUS.inner - 2 };
    const d = ribbonPath({ source: { ...c.source, ...edge }, target: { ...c.target, ...edge } });
    return `<path data-from="${c.source.index}" data-to="${c.target.index}" data-value="${c.source.value}" d="${d}" fill="${nodes[c.source.index].color}" fill-opacity="${dense ? 0.45 : 0.68}" stroke="${theme.paper}" stroke-width="0.6"/>`;
  }).join('');
  const groups = [...layout.groups].sort((a, b) => a.startAngle - b.startAngle);
  const mids = groups.map((g) => (g.startAngle + g.endAngle) / 2);
  const angles = dense ? spreadAngles(mids, MIN_LABEL_GAP) : mids;
  const rings = groups.map((g, i) => {
    const label = escapeXml(nodes[g.index].label);
    const shape = `<path d="${groupArc(g)}" fill="${nodes[g.index].color}"/>`;
    const onRight = angles[i] < Math.PI;
    if (!dense) {
      const x = Math.sin(angles[i]) * RADIUS.label, y = -Math.cos(angles[i]) * RADIUS.label;
      return shape + `<text x="${x.toFixed(1)}" y="${(y + REGION_LABEL_SIZE / 3).toFixed(1)}" text-anchor="${onRight ? 'start' : 'end'}" font-size="${REGION_LABEL_SIZE}" font-weight="700">${label}</text>`;
    }
    // A short leader from the arc to its label, then the label turned outward from the ring.
    const point = (angle: number, radius: number) => `${(Math.sin(angle) * radius).toFixed(1)},${(-Math.cos(angle) * radius).toFixed(1)}`;
    const degrees = (angles[i] * 180) / Math.PI - 90;
    const turned = onRight ? `rotate(${degrees.toFixed(2)}) translate(${RADIUS.label + 6},${PREF_LABEL_SIZE / 3})` : `rotate(${(degrees + 180).toFixed(2)}) translate(${-(RADIUS.label + 6)},${PREF_LABEL_SIZE / 3})`;
    return shape + `<polyline points="${point(mids[i], RADIUS.outer)} ${point(angles[i], RADIUS.label)}" fill="none" stroke="${theme.line}" stroke-width="1.5"/><text transform="${turned}" text-anchor="${onRight ? 'start' : 'end'}" font-size="${PREF_LABEL_SIZE}">${label}</text>`;
  }).join('');
  return sampleFrame({
    title: chart.title, meta: chart.meta, note: chart.note, source: chart.source,
    attributes: `data-image-template="chord" data-nodes="${nodes.length}"`,
    body: `<g transform="translate(${CENTER.x},${CENTER.y})">${ribbons}${rings}</g>`,
    theme,
  });
}
