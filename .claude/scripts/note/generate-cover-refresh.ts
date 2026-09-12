/** 公開カバーの棚卸し入力から、既存GIS+検証済みデータで派生画像を制作する。note書込なし。 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import sharp from 'sharp';
import satori from 'satori';
import {
  buildEditorialNoteCoverElement,
  type EditorialNoteCover,
} from '../../../apps/web/scripts/lib/note-cover-render';
import { loadFonts } from '../../../apps/web/scripts/lib/satori-image-render';
import {
  KEEP_EXISTING_COVER_KEYS,
  NOTE_COVER_COPY,
  NOTE_COVER_REFRESH_VERSION,
} from './catalog/cover-designs';
import { NOTE_ARTICLES } from './catalog';
async function main() {
  const ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../..'
  );
  const OUT = path.join(ROOT, '.local/note-cover-refresh/2026-09-12');
  const inventory = JSON.parse(
    fs.readFileSync(path.join(OUT, 'inventory.json'), 'utf8')
  );
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
  const japanSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="438" height="410">${fc.features.map((f: any) => `<path d="${project(f)}" fill="#367c9e" stroke="#e4eef0" stroke-width="1.4"/>`).join('')}</svg>`;
  const japan = `data:image/png;base64,${(await sharp(Buffer.from(japanSvg)).png().toBuffer()).toString('base64')}`;
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
  async function jsonSource(url: string, name: string) {
    const p = path.join(OUT, 'sources', name);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    if (!fs.existsSync(p)) {
      const r = await fetch(url);
      if (!r.ok) throw Error(`${url}: ${r.status}`);
      fs.writeFileSync(p, Buffer.from(await r.arrayBuffer()));
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
      const n = [...chunk].reduce(
        (s, c) => s + (/^[\x00-\x7f]$/.test(c) ? 0.55 : 1),
        0
      );
      if (units + n > max && line) {
        lines.push(line);
        line = '';
        units = 0;
      }
      line += chunk;
      units += n;
    }
    if (line) lines.push(line);
    return lines.join('\n');
  }
  function general(a: any): EditorialNoteCover {
    const override = NOTE_COVER_COPY[a.catalogKey];
    if (override) {
      const guide = /公務員/.test(override.kicker);
      return {
        ...override,
        mapImage: guide ? guideImage : japan,
        ...(guide ? { footnote: '内容・対象・手順は記事本文へ' } : {}),
      };
    }
    let title = a.title
      .replace(/^【[^】]+】\s*/, '')
      .replace(/\s*[｜|]\s*都道府県ランキング\s*$/, '');
    const year = a.title.match(/20\d{2}年度?/);
    const bracket = a.title
      .match(/^【(20\d{2}[^】]*)】/)?.[1]
      ?.replace('年版', '年');
    let subline = '都道府県の違いを、データから読む';
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
    const max = title.length > 28 ? 14 : 12;
    return {
      kicker: bracket
        ? `${bracket}・都道府県`
        : year
          ? `${year[0]}の都道府県データ`
          : a.vertical.startsWith('koumuin')
            ? '公務員のための実務ガイド'
            : '都道府県のデータを読む',
      headline: wrap(title, max),
      subline,
      mapImage: japan,
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
    const colored = original
      .replace(/fill="[^"]*"/g, '')
      .replace(/stroke="[^"]*"/g, '')
      .replace('<path ', '<path fill="#367c9e" ');
    const png = await sharp(Buffer.from(colored))
      .resize(438, 410, {
        fit: 'contain',
        background: { r: 228, g: 238, b: 240, alpha: 0 },
      })
      .png()
      .toBuffer();
    const city = code === '13000' ? '東京都区部' : pref.cityName;
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
  for (const a of inventory) {
    const meta = metadata.get(a.catalogKey);
    if (!meta || meta.noteUrl !== a.noteUrl)
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
    if (KEEP_EXISTING_COVER_KEYS.has(a.catalogKey)) {
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
          : 'published title',
        title: a.title,
        originalCoverSha256: base.beforeSha256,
      };
    if (a.catalogKey.startsWith('a-kakei-'))
      ({ design, evidence } = await household(a));
    let element;
    try {
      element = buildEditorialNoteCoverElement(design);
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
        if (typeof n.props.children === 'string')
          textBoxes.push({ ...n, text: n.props.children, props: undefined });
      },
    });
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
    const { mapImage, ...copy } = design;
    reports.push({
      ...base,
      action: a.cover.status === 'missing' ? 'create' : 'improve',
      reason:
        a.cover.status === 'missing'
          ? '記事詳細のカバー未設定'
          : '小さい文字・全文詰め込み・主題の弱さを大きな文字組みと地図で改善',
      version: NOTE_COVER_REFRESH_VERSION,
      file,
      sha256: sha(fs.readFileSync(file)),
      copy,
      evidence,
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
  }
  fs.writeFileSync(
    path.join(OUT, 'production-manifest.json'),
    JSON.stringify(
      {
        version: NOTE_COVER_REFRESH_VERSION,
        generatedAt: new Date().toISOString(),
        account: 'stats47',
        articles: reports,
      },
      null,
      2
    ) + '\n'
  );
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
