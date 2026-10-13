/** Decorative / figure inputs for note covers. Neutral map carries no values; swatches come from d3-scale-chromatic. */
import fs from 'node:fs';
import path from 'node:path';
import { geoArea, geoMercator, geoPath } from 'd3-geo';
import * as chromatic from 'd3-scale-chromatic';
import { feature } from 'topojson-client';
import sharp from 'sharp';

export async function neutralJapanMap(root: string) {
  const topo = JSON.parse(fs.readFileSync(path.join(root, 'apps/remotion/public/prefecture.topojson'), 'utf8'));
  const fc = feature(topo, topo.objects.pref) as any;
  const largest = (f: any) => f.geometry.type === 'MultiPolygon'
    ? { ...f, geometry: { type: 'Polygon', coordinates: f.geometry.coordinates.reduce((best: any, part: any) =>
      geoArea({ type: 'Polygon', coordinates: part } as any) > geoArea({ type: 'Polygon', coordinates: best } as any) ? part : best) } }
    : f;
  const main = fc.features.filter((f: any) => f.properties.N03_007 !== '47').map(largest);
  const okinawa = largest(fc.features.find((f: any) => f.properties.N03_007 === '47'));
  const collection = { type: 'FeatureCollection' as const, features: main };
  const projection = geoMercator().fitHeight(575, collection);
  const bounds = geoPath(projection).bounds(collection);
  const [tx, ty] = projection.translate();
  projection.translate([tx + 1226 - bounds[1][0], ty + 18 - bounds[0][1]]);
  const mapPath = geoPath(projection);
  const inset = geoPath(geoMercator().fitExtent([[1045, 462], [1190, 533]], okinawa));
  const style = 'fill="#dfe6ee" stroke="#b7c4d3" stroke-width="1.4"';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="670">${main
    .map((f: any) => `<path d="${mapPath(f)}" ${style}/>`).join('')}<path d="${inset(okinawa)}" ${style}/></svg>`;
  return `data:image/png;base64,${(await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64')}`;
}

type SwatchRow = { name: string; kind: 'continuous' | 'categorical' };
const stops = (name: string, kind: SwatchRow['kind']): string[] => {
  const scheme = (chromatic as any)[`scheme${name}`];
  if (kind === 'categorical') {
    if (!Array.isArray(scheme) || typeof scheme[0] !== 'string') throw Error('unknown categorical scheme ' + name);
    return scheme;
  }
  const interpolate = (chromatic as any)[`interpolate${name}`];
  if (typeof interpolate !== 'function') throw Error('unknown continuous scheme ' + name);
  return Array.from({ length: 24 }, (_, i) => interpolate(i / 23));
};

/** 560x470 panel: one labelled bar per scheme. Labels are the D3 scheme names (ASCII). */
export async function swatchPanel(rows: SwatchRow[]) {
  const width = 560, height = 470, left = 120, barWidth = 420;
  const rowHeight = Math.floor(height / rows.length);
  const bar = Math.min(44, rowHeight - 14);
  const body = rows.map((row, index) => {
    const colors = stops(row.name, row.kind);
    const y = index * rowHeight + Math.floor((rowHeight - bar) / 2);
    const step = barWidth / colors.length;
    return `<text x="0" y="${y + bar / 2 + 7}" font-family="Helvetica, Arial" font-size="20" font-weight="700" fill="#33445e">${row.name}</text>` +
      colors.map((c, i) => `<rect x="${(left + i * step).toFixed(2)}" y="${y}" width="${(step + (row.kind === 'continuous' ? 0.6 : -3)).toFixed(2)}" height="${bar}" rx="${row.kind === 'categorical' ? 5 : 0}" fill="${c}"/>`).join('');
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`;
  return `data:image/png;base64,${(await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64')}`;
}

/** Article figure → PNG data URL, returns aspect ratio for layout. */
export async function figureImage(buffer: Buffer) {
  const png = await sharp(buffer).flatten({ background: '#ffffff' }).png().toBuffer();
  const meta = await sharp(png).metadata();
  if (!meta.width || !meta.height) throw Error('figure has no dimensions');
  return { image: `data:image/png;base64,${png.toString('base64')}`, aspect: meta.width / meta.height };
}

/** 560x470 prefecture choropleth from 47 verified values (YlOrRd, linear). `invert` darkens the lowest values. */
export async function choroplethPanel(root: string, values: Map<string, number>, invert = false) {
  const topo = JSON.parse(fs.readFileSync(path.join(root, 'apps/remotion/public/prefecture.topojson'), 'utf8'));
  const fc = feature(topo, topo.objects.pref) as any;
  if (fc.features.length !== 47 || fc.features.some((f: any) => !values.has(f.properties.N03_007)))
    throw Error('choropleth needs all 47 prefectures');
  const nums = [...values.values()];
  const [min, max] = [Math.min(...nums), Math.max(...nums)];
  const color = (v: number) => chromatic.interpolateYlOrRd(0.08 + 0.84 * ((invert ? max - v : v - min) / (max - min || 1)));
  const main = fc.features.filter((f: any) => f.properties.N03_007 !== '47');
  const raw = fc.features.find((f: any) => f.properties.N03_007 === '47');
  const okinawa = raw.geometry.type === 'MultiPolygon'
    ? { ...raw, geometry: { type: 'Polygon', coordinates: raw.geometry.coordinates.reduce((best: any, part: any) =>
      geoArea({ type: 'Polygon', coordinates: part } as any) > geoArea({ type: 'Polygon', coordinates: best } as any) ? part : best) } }
    : raw;
  const projection = geoMercator().fitExtent([[150, 10], [550, 460]], { type: 'FeatureCollection', features: main } as any);
  const p = geoPath(projection);
  const inset = geoPath(geoMercator().fitExtent([[20, 330], [150, 450]], okinawa));
  const paths = main.map((f: any) => `<path d="${p(f)}" fill="${color(values.get(f.properties.N03_007)!)}" stroke="#ffffff" stroke-width="0.8"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="470">${paths}<rect x="14" y="324" width="142" height="132" rx="8" fill="none" stroke="#cfd6df"/><path d="${inset(okinawa)}" fill="${color(values.get('47')!)}" stroke="#ffffff" stroke-width="0.8"/></svg>`;
  return { image: `data:image/png;base64,${(await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64')}`, aspect: 560 / 470 };
}
