/** 公開カバーの棚卸し入力から、既存GIS+検証済みデータで派生画像を制作する。note書込なし。 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { geoArea, geoMercator, geoPath } from 'd3-geo';
import { scaleSequential } from 'd3-scale';
import { interpolateYlOrRd } from 'd3-scale-chromatic';
import { feature } from 'topojson-client';
import type { Feature, Geometry } from 'geojson';
import sharp from 'sharp';
import satori from 'satori';
import {
  buildBoldNoteCoverElement,
  type EditorialNoteCover,
} from '../../../apps/web/scripts/lib/note-cover-render';
import { loadFonts } from '../../../apps/web/scripts/lib/satori-image-render';
import {
  KEEP_EXISTING_COVER_KEYS,
  BOLD_COVER_HEADLINES,
  NOTE_COVER_COPY,
} from './catalog/cover-designs';
import { NOTE_ARTICLES } from './catalog';
import { noteCoverCategory } from './catalog/cover-categories';
import { freezeQuestionRankingData, questionRankingIdentity, questionRankingCopy } from './lib/question-cover-data.mjs';
async function main() {
  const { fetchCoverSource, createCoverStore } = await import('./lib/cover-storage.mjs');
  const { registerCoverCandidate } = await import('./lib/cover-ingest.mjs');
  const ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../..'
  );
  const args = process.argv.slice(2);
  if (args.length !== 4 || args[0] !== '--output' || args[2] !== '--version' || !/^[\w-]+$/.test(args[3]))
    throw Error('Usage: generate-cover-refresh.ts --output TEMP_INPUT_DIR --version VERSION (prepare with note:assets first)');
  const OUT = path.resolve(args[1]);
  const version = args[3];
  const isTemporary = [os.tmpdir(), 'C:/tmp', '/tmp'].some((dir) => {
    const relative = path.relative(path.resolve(dir), OUT);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  });
  const relativeRoot = path.relative(ROOT, OUT);
  if (!isTemporary || (!relativeRoot.startsWith('..') && !path.isAbsolute(relativeRoot)))
    throw Error('generation input/output must be a temporary subdirectory outside the repository');
  if (!fs.existsSync(path.join(OUT, '.note-cover-temporary-input')) || fs.readFileSync(path.join(OUT, '.note-cover-temporary-input'), 'utf8') !== 'stats47')
    throw Error('unowned temporary directory');
  const inventory = JSON.parse(
    fs.readFileSync(path.join(OUT, 'inventory.json'), 'utf8')
  );
  if (!Array.isArray(inventory) || new Set(inventory.map(a => a.catalogKey)).size !== inventory.length)
    throw Error('duplicate/invalid cover inventory');
  const fonts = loadFonts(ROOT);
  const sha = (data: Buffer | string) =>
    createHash('sha256').update(data).digest('hex');
  const metadata = new Map(NOTE_ARTICLES.map((a) => [a.key, a]));
  const capitals = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, '.claude/scripts/note/data/kakei-capital-cities.json'),
      'utf8'
    )
  );
  const topo = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, 'apps/remotion/public/prefecture.topojson'),
      'utf8'
    )
  );
  const fc = feature(topo, topo.objects.pref) as any;
  const projection = geoMercator().fitExtent(
    [
      [15, 10],
      [423, 400],
    ],
    fc
  );
  const project = geoPath(projection);
  const largestPolygon = (f: any) => f.geometry.type === 'MultiPolygon'
    ? { ...f, geometry: { type: 'Polygon', coordinates: f.geometry.coordinates.reduce((best: any, part: any) =>
      geoArea({ type: 'Polygon', coordinates: part } as any) >
      geoArea({ type: 'Polygon', coordinates: best } as any) ? part : best) } }
    : f;
  const mainFeatures = fc.features.filter((f: any) => f.properties.N03_007 !== '47').map(largestPolygon);
  const okinawa = largestPolygon(fc.features.find((f: any) => f.properties.N03_007 === '47'));
  const rankColors = ['#dce9fb', '#accbf3', '#75a7e5', '#397cc9', '#10448f'];
  async function horizontalMap(ranks?: Map<string, number>) {
    const color = (code: string) => ranks
      ? rankColors[4 - Math.min(4, Math.floor(((ranks.get(code) ?? 47) - 1) / 10))]
      : '#7fa8eb';
    const stroke = (code: string) => ranks?.get(code) === 1 ? '#ed623d' : '#3566b2';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="438" height="410">${mainFeatures.map((f: any) => {
      const code = f.properties.N03_007;
      return `<path d="${project(f)}" fill="${color(code)}" stroke="${stroke(code)}" stroke-width="${ranks?.get(code) === 1 ? 3 : 1.2}"/>`;
    }).join('')}</svg>`;
    const main = await sharp(Buffer.from(svg)).resize(1752, 1640)
      .rotate(55, { background: '#00000000' }).trim()
      .resize(850, 490, { fit: 'contain', background: '#00000000' }).png().toBuffer();
    const insetPath = geoPath(geoMercator().fitExtent([[8, 8], [137, 77]], okinawa));
    const inset = `<svg xmlns="http://www.w3.org/2000/svg" width="145" height="85"><path d="${insetPath(okinawa)}" fill="${color('47')}" stroke="${stroke('47')}" stroke-width="${ranks?.get('47') === 1 ? 3 : 1.5}"/></svg>`;
    return {
      mapImage: `data:image/png;base64,${main.toString('base64')}`,
      mapInsetImage: `data:image/png;base64,${(await sharp(Buffer.from(inset)).png().toBuffer()).toString('base64')}`,
      mapLayout: 'horizontal' as const,
    };
  }
  const genericMap = await horizontalMap();
  const guideSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="438" height="410"><rect x="76" y="34" width="300" height="330" rx="12" fill="#bbd3db"/><rect x="52" y="58" width="300" height="330" rx="12" fill="#fff"/><rect x="84" y="100" width="154" height="24" rx="4" fill="#367c9e"/>' +
    [165, 225, 285]
      .map(
        (y) =>
          `<rect x="84" y="${y}" width="24" height="24" rx="4" fill="#ed623d"/><path d="M128 ${y + 10}h177m-177 20h136" stroke="#bbd3db" stroke-width="8"/>`
      )
      .join('') +
    '</svg>';
  const guideImage = `data:image/png;base64,${(await sharp(Buffer.from(guideSvg)).png().toBuffer()).toString('base64')}`;
  const categories: Record<string, string> = {
    食料: 'food-expenditure-total',
    住居: 'housing-expenditure-total',
    '光熱・水道': 'utilities-expenditure-total',
    '家具・家事用品': 'furniture-household-expenditure-total',
    被服及び履物: 'clothing-footwear-expenditure-total',
    保健医療: 'health-medical-expenditure-total',
    '交通・通信': 'transport-communication-expenditure-total',
    教育: 'education-expenditure-total',
    教養娯楽: 'culture-recreation-expenditure-total',
    その他の消費支出: 'other-living-expenditure-total',
  };
  const cached = new Map<string, any>();
  const capturedSourcePath = path.join(OUT, 'sources', 'question-source-inventory.json');
  const capturedSources = fs.existsSync(capturedSourcePath)
    ? JSON.parse(fs.readFileSync(capturedSourcePath, 'utf8')) : null;
  async function jsonSource(url: string, name: string) {
    const p = path.join(OUT, 'sources', name);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    if (!fs.existsSync(p)) {
      fs.writeFileSync(p, await fetchCoverSource(url));
    }
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  function wrap(text: string, max = 12) {
    const chunks = [
      ...new Intl.Segmenter('ja', { granularity: 'word' }).segment(text),
    ].map((s) => s.segment);
    const lines: string[] = [];
    let line = '',
      units = 0;
    for (const chunk of chunks) {
      for (const ch of chunk) {
        const n = /^[\x00-\x7f]$/.test(ch) ? 0.55 : 1;
        if (units + n > max && line) {
          lines.push(line.trim());
          line = '';
          units = 0;
        }
        line += ch;
        units += n;
      }
    }
    if (line) lines.push(line);
    return lines.join('\n');
  }
  function general(a: any): EditorialNoteCover {
    const colorGuide = new Set([
      'paid-n823d76c5cbac', 'paid-n79fefdbd4d4c',
      'paid-n02da130aae01', 'paid-nfe2c65e669a8', 'paid-n66ffb10aa41b',
    ]).has(a.catalogKey);
    const override = NOTE_COVER_COPY[a.catalogKey];
    const isGuide = a.vertical.startsWith('koumuin') || colorGuide ||
      /公務員|自治体/.test(override?.kicker ?? '');
    if (override) {
      return {
        ...override,
        headline: BOLD_COVER_HEADLINES[a.catalogKey] ?? override.headline,
        ...(isGuide ? { mapImage: guideImage } : genericMap),
        ...(isGuide ? { badge: override.badge ?? (colorGuide ? '配色ガイド' : '自治体実務ガイド'),
          footnote: '内容・対象・手順は記事本文へ' } : {}),
      };
    }
    let title = a.title
      .replace(/^【[^】]+】\s*/, '')
      .replace(/\s*[｜|]\s*都道府県ランキング\s*$/, '');
    const year = a.title.match(/20\d{2}年度?/);
    const bracket = a.title
      .match(/^【(20\d{2}[^】]*)】/)?.[1]
      ?.replace('年版', '年');
    let subline = a.vertical.startsWith('koumuin')
      ? '自治体実務の手順を解説'
      : '都道府県の違いを、データから読む';
    const winner = title.match(/\s*[？?]\s*[1１]位は(.+?)(?:[｜|]|$)/);
    if (winner) {
      subline = `1位は${winner[1]}`;
      title = title
        .slice(0, winner.index)
        .replace(/が最も(?:多い|高い|長い)県は$/, '')
        .replace(/最も(.+?)が多い県は$/, '$1');
    } else {
      const split = title.split(/\s*(?:──|—|｜|\|)\s*/);
      if (split.length > 1) {
        title = split[0];
        subline = split.slice(1).join('・');
      }
    }
    title = title
      .replace(/[！!].*$/, '')
      .replace(/都道府県[「『](.+?)[」』]ランキング/, '$1')
      .replace(/都道府県「(.+?)」ランキング/, '$1')
      .replace(/ランキング(?:[、，].*)?$/, '')
      .trim();
    if (title.length > 46) {
      const m = title.match(/^(.+?)(?:[！!？?]|、あなた)/);
      if (m) title = m[1];
    }
    if (subline.length > 48) subline = '都道府県の違いを、データから読む';
    if (winner && /県は$/.test(title)) title += '？';
    const activity = title.match(/^(.*?)を(?:した|する)人が多い県は/);
    if (activity && !BOLD_COVER_HEADLINES[a.catalogKey]) {
      return {
        kicker: `${year?.[0] ?? '都道府県'}・行動者率`,
        headline: wrap(activity[1].replace(/^趣味としての/, ''), 8),
        subline: 'した人が多い県は？',
        ...genericMap,
      };
    }
    const max = title.length > 28 ? 14 : 12;
    return {
      kicker: colorGuide
        ? 'データ可視化の配色'
        : bracket
        ? `${year?.[0] ?? bracket.slice(0, 7)}・都道府県`
        : year
          ? `${year[0]}の都道府県データ`
          : a.vertical.startsWith('koumuin')
            ? '公務員のための実務ガイド'
            : '都道府県のデータを読む',
      headline: BOLD_COVER_HEADLINES[a.catalogKey] ?? wrap(title, max),
      subline: colorGuide ? '配色の使い方を解説' : subline,
      ...(isGuide ? { mapImage: guideImage } : genericMap),
      ...(isGuide ? { badge: colorGuide ? '配色ガイド' : '自治体実務ガイド' } : {}),
    };
  }
  async function questionRanking(article: (typeof NOTE_ARTICLES)[number]) {
    const { rankingKey, year } = questionRankingIdentity(article);
    const valuesSource = `https://storage.stats47.jp/app/ranking/${rankingKey}/values.json`;
    const sourceName = `ranking-${rankingKey}.json`;
    const source = await jsonSource(valuesSource, sourceName);
    const fixedChartUrl = `https://storage.stats47.jp/${article.r2Path}/chart-data.json`;
    const captured = capturedSources?.articles?.[article.key];
    if (capturedSources && (!captured || !Number.isFinite(Date.parse(capturedSources.observedAt)) ||
      captured.valuesSource !== valuesSource || captured.fixedChartSource !== fixedChartUrl ||
      captured.valuesSha256 !== sha(fs.readFileSync(path.join(OUT, 'sources', sourceName))) ||
      ![200, 404].includes(captured.fixedChartStatus)))
      throw Error('captured question source mismatch ' + article.key);
    let fixed = null;
    if (captured?.fixedChartStatus !== 404) {
      try { fixed = await jsonSource(fixedChartUrl, `${article.key}-article-chart.json`); }
      catch (error) { if (!(error instanceof Error) || error.message !== 'cover source HTTP 404') throw error; }
      if (captured && (!fixed || captured.fixedChartSha256 !==
        sha(fs.readFileSync(path.join(OUT, 'sources', `${article.key}-article-chart.json`)))))
        throw Error('captured question fixed chart mismatch ' + article.key);
    }
    const frozen = freezeQuestionRankingData(article, source, fixed);
    const copy = questionRankingCopy(article, frozen.winners, year);
    const values = new Map<string, number>(frozen.chartData.data.map((r: { area_code: string; value: number }) =>
      [r.area_code.slice(0, 2), r.value]));
    if (fc.features.some((f: { properties: { N03_007: string } }) => !values.has(f.properties.N03_007)))
      throw Error('question choropleth geography mismatch ' + article.key);
    const domain: [number, number] = [Math.min(...values.values()), Math.max(...values.values())];
    const scale = scaleSequential(domain, (t) => interpolateYlOrRd(0.15 + 0.70 * t));
    const collection = { type: 'FeatureCollection' as const, features: mainFeatures };
    const mapProjection = geoMercator().fitHeight(575, collection);
    const bounds = geoPath(mapProjection).bounds(collection);
    const translation = mapProjection.translate();
    mapProjection.translate([translation[0] + 1226 - bounds[1][0], translation[1] + 18 - bounds[0][1]]);
    const mapPath = geoPath(mapProjection);
    const insetPath = geoPath(geoMercator().fitExtent([[1045, 462], [1190, 533]], okinawa));
    const color = (code: string) => scale(values.get(code)!);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="670">${mainFeatures.map((f: Feature<Geometry, { N03_007: string }>) =>
      `<path d="${mapPath(f)}" fill="${color(f.properties.N03_007)}" stroke="#ba8d70" stroke-width="1.5"/>`).join('')}<path d="${insetPath(okinawa)}" fill="${color('47')}" stroke="#ba8d70" stroke-width="1.5"/></svg>`;
    const map = await sharp(Buffer.from(svg)).png().toBuffer();
    return {
      design: { kicker: copy.kicker, headline: '', subline: '',
        mapImage: `data:image/png;base64,${map.toString('base64')}`, questionRanking: copy },
      evidence: { renderer: 'question-ranking-note-cover-v1', articleKey: article.key, noteUrl: article.noteUrl,
        title: article.title, rankingKey, year, winners: frozen.winners, chartData: frozen.chartData,
        fixedCopyCreated: frozen.fixedCopyCreated, unitRepaired: frozen.unitRepaired,
        sourceObservation: captured ? { observedAt: capturedSources.observedAt,
          fixedChartStatus: captured.fixedChartStatus } : null,
        valuesSource, valuesSha256: sha(fs.readFileSync(path.join(OUT, 'sources', sourceName))),
        fixedChartSource: fixed ? fixedChartUrl : null,
        fixedChartSha256: fixed ? sha(fs.readFileSync(path.join(OUT, 'sources', `${article.key}-article-chart.json`))) : null,
        mapSource: 'apps/remotion/public/prefecture.topojson',
        mapSha256: sha(fs.readFileSync(path.join(ROOT, 'apps/remotion/public/prefecture.topojson'))),
        rendererSha256: sha(Buffer.concat(['.claude/scripts/note/generate-cover-refresh.ts',
          '.claude/scripts/note/lib/question-cover-data.mjs', 'apps/web/scripts/lib/note-cover-render.ts']
          .map(file => fs.readFileSync(path.join(ROOT, file))))),
        fonts: fonts.map(font => ({ name: font.name, weight: font.weight, sha256: sha(Buffer.from(font.data)) })),
        copy, renderSpec: { version, palette: 'YlOrRd', paletteRange: [0.15, 0.85], domain, scale: 'linear',
          background: '#faf9f5', mapOpacity: 0.52, mapHeight: 575, mapAnchor: [1226, 18],
          legend: false, size: [1280, 670] } },
    };
  }
  async function household(a: any) {
    const slug = a.catalogKey;
    const prefEntry = Object.entries(capitals).find(
      ([, p]: any) => `a-kakei-${p.slug}` === slug
    ) as [string, any];
    if (!prefEntry) throw Error('unknown prefecture ' + slug);
    const [code, pref] = prefEntry;
    const local = path.join(
      ROOT,
      'docs/31_note記事原稿',
      slug,
      'chart-data.json'
    );
    const chart = fs.existsSync(local)
      ? JSON.parse(fs.readFileSync(local, 'utf8'))
      : await jsonSource(
          `https://storage.stats47.jp/note/stats47-note/${slug}/chart-data.json`,
          `${slug}.json`
        );
    if (
      chart._meta.prefName !== pref.prefName ||
      chart._meta.year !== 2024 ||
      !chart._meta.reference.includes('単純平均')
    )
      throw Error('kakei metadata ' + slug);
    const sourceNote = JSON.parse(
      fs.readFileSync(path.join(OUT, 'before', a.noteKey + '.json'), 'utf8')
    );
    const candidate = chart.categoryBreakdown.filter(
      (c: any) =>
        c.catName !== 'その他の消費支出' &&
        Number.isFinite(c.ratio) &&
        c.ratio > 0
    );
    const named = candidate.filter((c: any) =>
      a.title.includes(c.catName.split('・')[0])
    );
    const c = (named.length ? named : candidate).sort(
      (x: any, y: any) =>
        Math.abs(Math.log(y.ratio)) - Math.abs(Math.log(x.ratio))
    )[0];
    if (!sourceNote.body.includes(c.catName.split('・')[0]))
      throw Error('category absent from article ' + slug);
    const metric = categories[c.catName];
    if (!cached.has(metric))
      cached.set(
        metric,
        await jsonSource(
          `https://storage.stats47.jp/app/stats/${metric}/values.json`,
          metric + '.json'
        )
      );
    const v = cached.get(metric);
    const rows = (Array.isArray(v) ? v : v.rows).filter(
      (r: any) =>
        String(r.yearCode) === '2024' &&
        /^\d{2}000$/.test(r.areaCode) &&
        r.areaCode !== '00000' &&
        r.value != null
    );
    const unique = new Map<string, number>(
      rows.map((r: any) => [r.areaCode, Number(r.value)])
    );
    if (unique.size !== 47) throw Error('not 47 capital city rows ' + metric);
    const mean = [...unique.values()].reduce((s, v) => s + v, 0) / 47;
    const amount = unique.get(code)!;
    const ratio = amount / mean;
    if (Math.abs(ratio - c.ratio) > 1e-6) throw Error('ratio drift ' + slug);
    const pct = Math.round(Math.abs(ratio - 1) * 100);
    if (!pct) throw Error('no informative difference ' + slug);
    const mapPath = path.join(
      ROOT,
      'packages/gis/data/geoshape/svg',
      `${code.slice(0, 2)}_${pref.prefName}.svg`
    );
    const original = fs.readFileSync(mapPath, 'utf8');
    const prefFeature = fc.features.find((f: any) => f.properties.N03_007 === code.slice(0, 2));
    if (!prefFeature) throw Error('prefecture shape missing ' + code);
    const city = code === '13000' ? '東京都区部' : pref.cityName;
    const municipalityTopo = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/remotion/public/buzz-map/municipalities.topojson'), 'utf8'));
    const municipalities = feature(municipalityTopo, municipalityTopo.objects[Object.keys(municipalityTopo.objects)[0]]) as any;
    const cityFeatures = municipalities.features.filter((f: any) =>
      f.properties.N03_001 === pref.prefName &&
      (code === '13000' ? /^131\d{2}$/.test(f.properties.N03_007) :
        f.properties.N03_003 === city || f.properties.N03_004 === city));
    if (!cityFeatures.length) throw Error('city shape missing ' + city);
    const focusGeometry = ['13', '47'].includes(code.slice(0, 2)) &&
      prefFeature.geometry.type === 'MultiPolygon'
      ? {
          type: 'Polygon',
          coordinates: prefFeature.geometry.coordinates.reduce((largest: any, part: any) =>
            geoArea({ type: 'Polygon', coordinates: part } as any) >
            geoArea({ type: 'Polygon', coordinates: largest } as any) ? part : largest),
        }
      : prefFeature;
    const focus = geoMercator().fitExtent([[15, 10], [423, 400]], focusGeometry as any);
    const focusPath = geoPath(focus);
    const colored = `<svg xmlns="http://www.w3.org/2000/svg" width="438" height="410"><path d="${focusPath(prefFeature)}" fill="#bfd3f7" stroke="#5d8bdc" stroke-width="2.5"/>${cityFeatures.map((f: any) => `<path d="${focusPath(f)}" fill="#275fcf" stroke="#fff" stroke-width="1.5"/>`).join('')}</svg>`;
    const png = await sharp(Buffer.from(colored))
      .resize(438, 410, {
        fit: 'contain',
        background: { r: 247, g: 249, b: 254, alpha: 0 },
      })
      .png()
      .toBuffer();
    const design: EditorialNoteCover = {
      kicker: '地図で読む、県別の家計',
      headline: '',
      subline: '',
      mapImage: `data:image/png;base64,${png.toString('base64')}`,
      household: {
        prefecture: pref.prefName,
        city,
        category: c.catName,
        comparison: '47都市の単純平均より',
        value: `${pct}%${ratio >= 1 ? '多い' : '少ない'}`,
      },
      footnote: '2024年／二人以上の世帯／総務省「家計調査」',
    };
    return {
      design,
      evidence: {
        metric,
        year: 2024,
        areaCode: code,
        city,
        amount,
        mean,
        ratio,
        reference: '47都市の単純平均',
        valuesSource: `https://storage.stats47.jp/app/stats/${metric}/values.json`,
        valuesSha256: sha(
          fs.readFileSync(path.join(OUT, 'sources', metric + '.json'))
        ),
        chartSha256: sha(JSON.stringify(chart)),
        mapSource: path.relative(ROOT, mapPath),
        mapSha256: sha(original),
      },
    };
  }
  const reports: Array<
    { action: 'keep' | 'create' | 'improve' } & Record<string, unknown>
  > = [];
  const errors: string[] = [];
  for (const a of inventory) {
    try {
    const meta = metadata.get(a.catalogKey);
    if (!meta || (meta.noteUrl ?? null) !== a.noteUrl)
      throw Error('catalog mismatch ' + a.catalogKey);
    const beforePath = a.cover.url
      ? path.join(OUT, 'before', a.noteKey + '.image')
      : null;
    const base = {
      noteId: a.noteKey,
      key: a.catalogKey,
      title: a.title,
      noteUrl: a.noteUrl,
      vertical: a.vertical,
      isPaid: a.price > 0,
      beforeCover: a.cover,
      beforeSha256: beforePath ? sha(fs.readFileSync(beforePath)) : null,
    };
    const isQuestionRanking = /[？?]\s*1位は/.test(a.title) && noteCoverCategory(meta) === 'ranking-question';
    if (KEEP_EXISTING_COVER_KEYS.has(a.catalogKey) && !isQuestionRanking) {
      if (a.cover.status !== 'configured')
        throw Error('cannot keep missing cover ' + a.catalogKey);
      reports.push({
        ...base,
        action: 'keep',
        reason: '320pxで主題と構図を確認。既存デザイン維持（CTA観測中を含む）',
      });
      continue;
    }
    let design = general(a),
      evidence: any = {
        source: NOTE_COVER_COPY[a.catalogKey]
          ? 'published title, article and original cover'
          : a.noteUrl ? 'published title' : 'draft catalog title',
        title: a.title,
        originalCoverSha256: base.beforeSha256,
      };
    if (isQuestionRanking) ({ design, evidence } = await questionRanking(meta));
    if (a.catalogKey.startsWith('a-kakei-'))
      ({ design, evidence } = await household(a));
    let element;
    try {
      element = buildBoldNoteCoverElement(design);
    } catch (error) {
      throw Error(
        a.catalogKey + ' ' + JSON.stringify(design.headline) + ' ' + error
      );
    }
    const textBoxes: any[] = [];
    const svg = await satori(element, {
      width: 1280,
      height: 670,
      fonts,
      onNodeDetected: (n) => {
        if (typeof n.textContent === 'string')
          textBoxes.push({ ...n, text: n.textContent, props: undefined });
      },
    });
    if (!textBoxes.length) throw Error('layout inspection returned no text nodes ' + a.catalogKey);
    for (const b of textBoxes)
      if (
        b.left < 48 ||
        b.top < 40 ||
        b.left + b.width > 1232 ||
        b.top + b.height > 622
      )
        throw Error('text bounds ' + a.catalogKey + ' ' + JSON.stringify(b));
    for (let i = 0; i < textBoxes.length; i++)
      for (let j = i + 1; j < textBoxes.length; j++) {
        const x = textBoxes[i],
          y = textBoxes[j];
        if (
          Math.min(x.left + x.width, y.left + y.width) -
            Math.max(x.left, y.left) >
            4 &&
          Math.min(x.top + x.height, y.top + y.height) -
            Math.max(x.top, y.top) >
            4
        )
          throw Error(
            'text overlap ' + a.catalogKey + ' ' + x.text + ' / ' + y.text
          );
      }
    const file = path.join(OUT, 'after', a.catalogKey + '.png');
    fs.writeFileSync(file.replace(/\.png$/, '.svg'), svg);
    await sharp(Buffer.from(svg)).png().toFile(file);
    const m = await sharp(file).metadata();
    if (m.width !== 1280 || m.height !== 670) throw Error('dimensions');
    const { mapImage, mapInsetImage, ...copy } = design;
    reports.push({
      ...base,
      action: a.cover.status === 'missing' ? 'create' : 'improve',
      reason:
        a.cover.status === 'missing'
          ? '記事詳細のカバー未設定'
          : '小さい文字・全文詰め込み・主題の弱さを大きな文字組みと地図で改善',
      version,
      file,
      sha256: sha(fs.readFileSync(file)),
      copy,
      evidence: { ...evidence, layout: textBoxes.map(({ left, top, width, height, text }) => ({ left, top, width, height, text })) },
      quality: {
        width: m.width,
        height: m.height,
        textBounds: 'pass',
        textOverlap: 'pass',
        textBoxes: textBoxes.length,
        visualReview: 'pending',
      },
    });
    if (reports.length % 25 === 0) console.log('processed', reports.length);
    } catch (error) {
      errors.push(`${a.catalogKey}: ${String(error)}`);
    }
  }
  if (errors.length) throw Error(`cover generation failed (${errors.length}):\n${errors.join('\n')}`);
  fs.writeFileSync(
    path.join(OUT, 'production-manifest.json'),
    JSON.stringify(
      {
        version,
        generatedAt: new Date().toISOString(),
        account: 'stats47',
        articles: reports,
      },
      null,
      2
    ) + '\n'
  );
  const store = createCoverStore();
  for (const report of reports.filter((r) => r.action !== 'keep')) {
    if (typeof report.file !== 'string') throw Error('candidate file missing');
    await registerCoverCandidate(report, fs.readFileSync(report.file), version, store);
    console.log('Remote cover + input verified:', report.key);
  }
  // Temporary input/render files are removed after every image is verified remotely.
  // OUT is confined to an owned temporary subdirectory above; remove after remote registration.
  if (fs.readdirSync(OUT).some(name => !['before', 'after', 'sources', 'inventory.json', 'production-manifest.json', '.note-cover-temporary-input'].includes(name)))
    throw Error('remote assets saved; unknown temporary files prevent automatic cleanup');
  fs.rmSync(OUT, { recursive: true, force: true });
  console.log('Remote revisions registered; temporary generation inputs removed');
  console.log(
    JSON.stringify(
      reports.reduce(
        (s: any, a: any) => ((s[a.action] = (s[a.action] || 0) + 1), s),
        {}
      )
    )
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
