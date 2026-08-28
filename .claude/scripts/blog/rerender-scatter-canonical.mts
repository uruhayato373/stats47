#!/usr/bin/env -S npx tsx
/**
 * rerender-scatter-canonical.mts — scatter カタログの正方形・単色統一 (720×720)。
 *
 * 既存の検証済み scatter json (status=both) から、svg-builder の generateScatterSvg(W=720,H=720 固定)
 * で SVG を再描画し、横長キャンバスと地域色分けを是正する。
 * 欠損が判明している2件だけは、記録済みの一次ソースから標準 points schema を復元する。
 * generate-article-charts の genScatterChartSvg アダプタを再現する。
 *
 * - 生成結果と同一の SVG はスキップ (no-op)。
 * - title/xLabel/yLabel/xUnit/yUnit は json から継承。
 *
 * 出力: staging .local/r2/app/blog/<slug>/data/<base>.{svg,json,source.json}
 * R2 反映: key file を push-exact-r2-assets.ts に渡す（CIのみ）
 *
 *   npx tsx .claude/scripts/blog/rerender-scatter-canonical.mts --probe-only
 *   npx tsx .claude/scripts/blog/rerender-scatter-canonical.mts \
 *     --probe-only --require-canonical --verify-sources
 *   npx tsx .claude/scripts/blog/rerender-scatter-canonical.mts \
 *     --key-file .local/generated-blog-svg-keys.txt
 */
import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateScatterSvg } from '../../../packages/svg-builder/src/charts/scatter.ts';
import { inspectChartSourceManifest } from '../lib/chart-provenance.mjs';
import { stripProvenance, withProvenance } from '../lib/svg-provenance.mjs';
import {
  lintScatterData,
  lintScatterParity,
  lintScatterQuality,
} from '../lib/svg-lint.mjs';

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);
const R2 = process.env.R2_PUBLIC_FETCH_URL || 'https://storage.stats47.jp';
const STAGE = path.join(PROJECT_ROOT, '.local/r2/app/blog');

// provenance の扱いは lib に一本化 (テスト付き: __tests__/svg-provenance.test.mjs)。
// ここに書き写すと二重実装になり、片方だけ直る事故を生む。
const args = process.argv.slice(2);
const PROBE_ONLY = args.includes('--probe-only');
const REQUIRE_CANONICAL = args.includes('--require-canonical');
const VERIFY_SOURCES = args.includes('--verify-sources');
const BASE_ARG = (() => {
  const i = args.indexOf('--base');
  return i >= 0 ? args[i + 1] : null;
})();
const KEY_FILE_ARG = (() => {
  const i = args.indexOf('--key-file');
  return i >= 0 ? args[i + 1] : null;
})();
const ESTAT_APP_ID = process.env.NEXT_PUBLIC_ESTAT_APP_ID || '';
const LODGING_2024_XLSX =
  'https://www.mlit.go.jp/kankocho/content/001905499.xlsx';
const CHINA_SCATTER =
  'inbound-by-nationality-regional-preference/resident-vs-guest-china-scatter';
const SEMICONDUCTOR_SCATTER =
  'semiconductor-electronics-regional-map/semiconductor-dependency-scatter';
const COMMUNICATION_SCATTER = 'communication-cost-burden/comm-cost-scatter';
const NURSE_SCATTER = 'nurse-income-prefecture-gap/nurse-vs-govwage-scatter';
const TRAVEL_GENDER_SCATTER =
  'travel-behavior-gender-gap/travel-gender-scatter';
const URBAN_PARK_SCATTER =
  'urban-parks-green-infrastructure/park-area-vs-count-scatter';
const VACANT_LAND_SCATTER =
  'vacant-housing-vs-land-price/vacant-vs-land-price-scatter';

function noCache(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}__scatter=${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function fetchOk(url: string): Promise<Response> {
  const r = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
  return r;
}

async function fj(u: string): Promise<any> {
  return (await fetchOk(noCache(u))).json();
}
async function ft(u: string): Promise<string> {
  return (await fetchOk(noCache(u))).text();
}
function viewBoxOf(svg: string): string {
  const m = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  return m ? `${m[1]}x${m[2]}` : '?';
}
function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

type CanonicalPoint = {
  areaCode: string;
  areaName: string;
  label: string;
  x: number;
  y: number;
};

type Repair = {
  json: any;
  source: any;
};

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function canonicalPointCount(data: any): number {
  const raw = data?.points || data?.data || [];
  return raw.filter(
    (p: any) => typeof p.x === 'number' && typeof p.y === 'number'
  ).length;
}

function pointFingerprint(data: any): string {
  const raw = data?.points || data?.data || [];
  return JSON.stringify(
    raw
      .filter(
        (point: any) =>
          point &&
          typeof point === 'object' &&
          Number.isFinite(point.x) &&
          Number.isFinite(point.y)
      )
      .map((point: any) => ({
        x: point.x,
        y: point.y,
      }))
      .sort((a: any, b: any) => a.x - b.x || a.y - b.y)
  );
}

async function fetchEstatValues(params: Record<string, string>): Promise<any> {
  if (!ESTAT_APP_ID) {
    throw new Error(
      'NEXT_PUBLIC_ESTAT_APP_ID が未設定のため欠損scatterを一次ソースから復元できません'
    );
  }
  const url = new URL(
    'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData'
  );
  for (const [key, value] of Object.entries({
    appId: ESTAT_APP_ID,
    lang: 'J',
    metaGetFlg: 'Y',
    cntGetFlg: 'N',
    ...params,
  })) {
    url.searchParams.set(key, value);
  }
  const json = await (await fetchOk(url.toString())).json();
  const result = json?.GET_STATS_DATA?.RESULT;
  if (result?.STATUS !== 0) {
    throw new Error(
      `e-Stat ${params.statsDataId}: ${result?.ERROR_MSG || 'unknown error'}`
    );
  }
  const data = json?.GET_STATS_DATA?.STATISTICAL_DATA;
  if (!data)
    throw new Error(
      `e-Stat ${params.statsDataId}: STATISTICAL_DATA がありません`
    );
  return data;
}

function prefectureValueMap(
  statisticalData: any
): Map<string, { areaName: string; value: number }> {
  const areaClass = asArray<any>(statisticalData?.CLASS_INF?.CLASS_OBJ).find(
    (obj) => obj?.['@id'] === 'area'
  );
  const names = new Map(
    asArray<any>(areaClass?.CLASS).map((item) => [
      String(item['@code']),
      String(item['@name']),
    ])
  );
  const values = new Map<string, { areaName: string; value: number }>();
  for (const item of asArray<any>(statisticalData?.DATA_INF?.VALUE)) {
    const areaCode = String(item?.['@area'] || '');
    if (!/^(?:0[1-9]|[1-3]\d|4[0-7])000$/.test(areaCode)) continue;
    const value = Number(item?.['$']);
    const areaName = names.get(areaCode);
    if (!areaName || !Number.isFinite(value)) continue;
    values.set(areaCode, { areaName, value });
  }
  return values;
}

async function rankingValueMap(
  rankingKey: string,
  yearCode: string
): Promise<Map<string, { areaName: string; value: number }>> {
  const ranking = await fj(`${R2}/app/ranking/${rankingKey}/values.json`);
  const partition = asArray<any>(ranking?.partitions).find(
    (item) => String(item?.yearCode) === yearCode
  );
  const values = new Map<string, { areaName: string; value: number }>(
    asArray<any>(partition?.values).flatMap((item) => {
      const value = Number(item?.value);
      const areaCode = String(item?.areaCode || '');
      const areaName = String(item?.areaName || '');
      return areaCode && areaName && Number.isFinite(value)
        ? [[areaCode, { areaName, value }]]
        : [];
    })
  );
  if (values.size !== 47) {
    throw new Error(
      `${rankingKey} (${yearCode}) の都道府県数が不正です: ${values.size}`
    );
  }
  return values;
}

function joinValueMaps(
  xValues: Map<string, { areaName: string; value: number }>,
  yValues: Map<string, { areaName: string; value: number }>,
  transformX: (value: number) => number = (value) => value,
  transformY: (value: number) => number = (value) => value
): CanonicalPoint[] {
  const points = [...xValues.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([areaCode, x]) => {
      const y = yValues.get(areaCode);
      if (!y) return [];
      return [
        {
          areaCode,
          areaName: x.areaName,
          label: x.areaName,
          x: transformX(x.value),
          y: transformY(y.value),
        },
      ];
    });
  if (points.length !== 47) {
    throw new Error(`2系列の都道府県結合件数が不正です: ${points.length}`);
  }
  return points;
}

function rankingJoinSource(
  target: { slug: string; base: string },
  xRankingKey: string,
  xYear: string,
  yRankingKey: string,
  yYear: string,
  formula: string
): any {
  return {
    kind: 'ranking-join',
    expectedPointCount: 47,
    xRankingKey,
    xYear,
    yRankingKey,
    yYear,
    formula,
    restore: `npx tsx .claude/scripts/blog/rerender-scatter-canonical.mts --base ${target.slug}/${target.base}`,
  };
}

function rebuiltJson(template: any, points: CanonicalPoint[]): any {
  const copy = { ...template, expectedPointCount: 47 };
  if (Array.isArray(template?.data) && !Array.isArray(template?.points)) {
    copy.data = points;
  } else {
    copy.points = points;
  }
  return copy;
}

async function repairChinaScatter(): Promise<Repair> {
  const residents = prefectureValueMap(
    await fetchEstatValues({
      statsDataId: '0003445244',
      cdCat01: '0',
      cdCat02: '102',
      cdTime: '2020000000',
      lvArea: '2',
    })
  );

  const workbook = new ExcelJS.Workbook();
  const xlsx = await (await fetchOk(LODGING_2024_XLSX)).arrayBuffer();
  await workbook.xlsx.load(xlsx);
  const sheet = workbook.getWorksheet('参考第1表(年計)');
  if (!sheet) throw new Error('観光庁Excelに「参考第1表(年計)」がありません');

  const guests = new Map<string, { areaName: string; value: number }>();
  for (let rowNumber = 8; rowNumber <= 54; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const areaText = String(row.getCell(1).value || '').trim();
    const match = areaText.match(/^(\d{2})(.+)$/u);
    const value = Number(row.getCell(4).value);
    if (!match || !Number.isFinite(value)) {
      throw new Error(
        `観光庁Excel ${rowNumber}行目を都道府県データとして解釈できません`
      );
    }
    guests.set(`${match[1]}000`, { areaName: match[2].trim(), value });
  }

  if (residents.size !== 47 || guests.size !== 47) {
    throw new Error(
      `中国scatterの都道府県数が不正です: residents=${residents.size}, guests=${guests.size}`
    );
  }

  const points: CanonicalPoint[] = [...residents.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([areaCode, resident]) => {
      const guest = guests.get(areaCode);
      if (!guest)
        throw new Error(`宿泊値がありません: ${areaCode} ${resident.areaName}`);
      return {
        areaCode,
        areaName: resident.areaName,
        label: resident.areaName,
        x: resident.value,
        y: guest.value,
      };
    });

  return {
    json: {
      title: '在留中国人数 × 中国人延べ宿泊者数',
      label: '在留中国人数 vs 中国人延べ宿泊者数',
      xLabel: '在留中国人数',
      yLabel: '中国人延べ宿泊者数',
      xUnit: '人',
      yUnit: '人泊',
      yearX: '2020',
      yearY: '2024',
      expectedPointCount: 47,
      points,
    },
    source: {
      kind: 'calculated',
      expectedPointCount: 47,
      inputs: [
        {
          statsDataId: '0003445244',
          params: {
            cdCat01: '0',
            cdCat02: '102',
            cdTime: '2020000000',
            lvArea: '2',
          },
          year: '2020',
          label: '中国籍人口',
        },
        {
          url: LODGING_2024_XLSX,
          sheet: '参考第1表(年計)',
          column: '中国',
          rows: '8-54',
          year: '2024',
          label: '中国人延べ宿泊者数（従業者数10人以上の施設）',
        },
      ],
      formula:
        'x=中国籍人口(2020), y=中国人延べ宿泊者数(2024) を都道府県コードで内部結合',
      source: '国勢調査2020（e-Stat） + 宿泊旅行統計調査2024年確定値（観光庁）',
      year: '2020/2024',
      label: '在留中国人数 vs 中国人延べ宿泊者数',
      note: '年が異なる2系列の相関。宿泊値は従業者数10人以上の施設。',
      restore:
        'npx tsx .claude/scripts/blog/rerender-scatter-canonical.mts --base inbound-by-nationality-regional-preference/resident-vs-guest-china-scatter',
    },
  };
}

async function repairSemiconductorScatter(): Promise<Repair> {
  const ranking = await fj(
    `${R2}/app/ranking/manufacturing-shipment-amount/values.json`
  );
  const partition = asArray<any>(ranking?.partitions).find(
    (item) => String(item?.yearCode) === '2023'
  );
  const manufacturing = new Map<string, { areaName: string; value: number }>(
    asArray<any>(partition?.values).map((item) => [
      String(item.areaCode),
      { areaName: String(item.areaName), value: Number(item.value) },
    ])
  );
  const electronics = prefectureValueMap(
    await fetchEstatValues({
      statsDataId: '0003448099',
      cdCat01: '28',
      cdCat02: '01020',
    })
  );
  if (manufacturing.size !== 47 || electronics.size !== 45) {
    throw new Error(
      `半導体scatterの都道府県数が不正です: manufacturing=${manufacturing.size}, electronics=${electronics.size}`
    );
  }

  const points: CanonicalPoint[] = [...manufacturing.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([areaCode, total]) => {
      const electronic = electronics.get(areaCode);
      // e-Stat 原表で高知県・沖縄県は秘匿値「X」。0 とみなさず散布図から除外する。
      if (!electronic) return [];
      return [
        {
          areaCode,
          areaName: total.areaName,
          label: total.areaName,
          x: total.value / 1_000_000,
          y: (electronic.value / total.value) * 100,
        },
      ];
    });
  if (points.length !== 45)
    throw new Error(`半導体scatterの描画点数が不正です: ${points.length}`);

  return {
    json: {
      title: '製造業規模 × 半導体依存度',
      label: '半導体依存度（電子部品出荷額2020 ÷ 製造品出荷額等2023）',
      xLabel: '製造品出荷額等',
      yLabel: '半導体依存度',
      xUnit: '兆円',
      yUnit: '%',
      yearX: '2023',
      yearY: '2020/2023',
      expectedPointCount: 45,
      note: '電子部品は2020年、製造品出荷額等は2023年度。高知県・沖縄県は電子部品出荷額が秘匿値(X)のため除外。年次が異なるため依存度は目安。',
      points,
    },
    source: {
      kind: 'calculated',
      expectedPointCount: 45,
      inputs: [
        {
          rankingKey: 'manufacturing-shipment-amount',
          source: 'r2:app/ranking/manufacturing-shipment-amount/values.json',
          year: '2023',
          label: '製造品出荷額等',
        },
        {
          statsDataId: '0003448099',
          params: { cdCat01: '28', cdCat02: '01020' },
          year: '2020',
          label: '電子部品・デバイス・電子回路製造業 出荷額',
        },
      ],
      formula:
        'x=製造品出荷額等(百万円)/1,000,000; y=電子部品出荷額(百万円)/製造品出荷額等(百万円)*100',
      year: '2020/2023',
      unit: '%',
      label: '半導体依存度（電子部品出荷額2020 ÷ 製造品出荷額等2023）',
      excludedAreas: ['高知県', '沖縄県'],
      exclusionReason: 'e-Stat原表の電子部品出荷額が秘匿値(X)のため',
      restore:
        'npx tsx .claude/scripts/blog/rerender-scatter-canonical.mts --base semiconductor-electronics-regional-map/semiconductor-dependency-scatter',
    },
  };
}

async function rebuildRankingJoinScatter(
  target: { slug: string; base: string },
  template: any,
  xRankingKey: string,
  xYear: string,
  yRankingKey: string,
  yYear: string,
  formula: string
): Promise<Repair> {
  const [xValues, yValues] = await Promise.all([
    rankingValueMap(xRankingKey, xYear),
    rankingValueMap(yRankingKey, yYear),
  ]);
  return {
    json: rebuiltJson(template, joinValueMaps(xValues, yValues)),
    source: rankingJoinSource(
      target,
      xRankingKey,
      xYear,
      yRankingKey,
      yYear,
      formula
    ),
  };
}

async function rebuildNurseScatter(
  target: { slug: string; base: string },
  template: any
): Promise<Repair> {
  const [salary, nurseMonthly, nurseBonus] = await Promise.all([
    rankingValueMap('avg-salary-all-prefecture', '2023'),
    fetchEstatValues({
      statsDataId: '0003445758',
      cdTab: '40',
      cdCat01: '01',
      cdCat02: '1133',
      cdTime: '2023000000',
    }).then(prefectureValueMap),
    fetchEstatValues({
      statsDataId: '0003445758',
      cdTab: '44',
      cdCat01: '01',
      cdCat02: '1133',
      cdTime: '2023000000',
    }).then(prefectureValueMap),
  ]);
  if (nurseMonthly.size !== 47 || nurseBonus.size !== 47) {
    throw new Error(
      `看護師賃金の都道府県数が不正です: monthly=${nurseMonthly.size}, bonus=${nurseBonus.size}`
    );
  }
  const nurseAnnual = new Map(
    [...nurseMonthly.entries()].map(([areaCode, monthly]) => {
      const bonus = nurseBonus.get(areaCode);
      if (!bonus) throw new Error(`看護師賞与がありません: ${areaCode}`);
      return [
        areaCode,
        {
          areaName: monthly.areaName,
          value: Math.round(monthly.value * 12 + bonus.value) / 10,
        },
      ];
    })
  );
  return {
    json: rebuiltJson(
      template,
      joinValueMaps(
        salary,
        nurseAnnual,
        (value) => Math.round(value / 1_000) / 10
      )
    ),
    source: {
      kind: 'calculated',
      expectedPointCount: 47,
      inputs: [
        {
          rankingKey: 'avg-salary-all-prefecture',
          year: '2023',
          source: 'r2:app/ranking/avg-salary-all-prefecture/values.json',
        },
        {
          statsDataId: '0003445758',
          params: {
            cdTab: ['40', '44'],
            cdCat01: '01',
            cdCat02: '1133',
            cdTime: '2023000000',
          },
          year: '2023',
          source: '賃金構造基本統計調査',
        },
      ],
      formula:
        'x=地方公務員平均給与月額(円)/10,000を小数1桁丸め; y=(看護師きまって支給する現金給与額(千円)*12+年間賞与(千円))/10を小数1桁丸め; areaCodeで結合',
      restore: `npx tsx .claude/scripts/blog/rerender-scatter-canonical.mts --base ${target.slug}/${target.base}`,
    },
  };
}

async function rebuildTravelGenderScatter(
  target: { slug: string; base: string },
  template: any
): Promise<Repair> {
  const [male, female] = await Promise.all([
    fetchEstatValues({
      statsDataId: '0003456093',
      cdCat01: '1',
      cdCat02: '0',
      cdCat03: '2',
      cdTime: '2021000000',
    }).then(prefectureValueMap),
    fetchEstatValues({
      statsDataId: '0003456093',
      cdCat01: '2',
      cdCat02: '0',
      cdCat03: '2',
      cdTime: '2021000000',
    }).then(prefectureValueMap),
  ]);
  return {
    json: rebuiltJson(
      template,
      joinValueMaps(male, female, Math.round, Math.round)
    ),
    source: {
      kind: 'calculated',
      expectedPointCount: 47,
      inputs: [
        {
          statsDataId: '0003456093',
          params: {
            cdCat01: '1',
            cdCat02: '0',
            cdCat03: '2',
            cdTime: '2021000000',
          },
          label: '男性 旅行（1泊2日以上）行動者率',
        },
        {
          statsDataId: '0003456093',
          params: {
            cdCat01: '2',
            cdCat02: '0',
            cdCat03: '2',
            cdTime: '2021000000',
          },
          label: '女性 旅行（1泊2日以上）行動者率',
        },
      ],
      formula: '男女別行動者率をareaCodeで結合し、表示値を整数丸め',
      restore: `npx tsx .claude/scripts/blog/rerender-scatter-canonical.mts --base ${target.slug}/${target.base}`,
    },
  };
}

async function rebuildKnownScatter(
  target: { slug: string; base: string },
  template: any = {}
): Promise<Repair | null> {
  const id = `${target.slug}/${target.base}`;
  if (id === CHINA_SCATTER) return repairChinaScatter();
  if (id === SEMICONDUCTOR_SCATTER) return repairSemiconductorScatter();
  if (id === COMMUNICATION_SCATTER) {
    return rebuildRankingJoinScatter(
      target,
      template,
      'mobile-phone-contract-count-per-1000',
      '2023',
      'transport-communication-expenditure-ratio-multi-person-households',
      '2024',
      'x=携帯電話契約数(2023); y=交通・通信費割合(2024); areaCodeで結合'
    );
  }
  if (id === NURSE_SCATTER) return rebuildNurseScatter(target, template);
  if (id === TRAVEL_GENDER_SCATTER) {
    return rebuildTravelGenderScatter(target, template);
  }
  if (id === URBAN_PARK_SCATTER) {
    return rebuildRankingJoinScatter(
      target,
      template,
      'urban-park-area-per-person',
      '2023',
      'urban-park-count-per-100km2',
      '2023',
      'x=1人当たり都市公園面積(2023); y=面積100km²当たり都市公園数(2023); areaCodeで結合'
    );
  }
  if (id === VACANT_LAND_SCATTER) {
    return rebuildRankingJoinScatter(
      target,
      template,
      'vacant-housing-rate',
      '2023',
      'standard-price-change-rate-commercial',
      '2024',
      'x=空き家率(2023); y=商業地の標準価格対前年平均変動率(2024); areaCodeで結合'
    );
  }
  return null;
}

async function repairIfNeeded(
  target: { slug: string; base: string },
  data: any
): Promise<Repair | null> {
  if (canonicalPointCount(data) > 0) return null;
  return rebuildKnownScatter(target, data);
}

async function repairedArticle(
  id: string,
  slug: string
): Promise<string | null> {
  if (id !== CHINA_SCATTER && id !== SEMICONDUCTOR_SCATTER) return null;
  const article = await ft(`${R2}/app/blog/${slug}/article.md`);
  if (id === CHINA_SCATTER) {
    const corrected = article
      .replace(
        '[宿泊旅行統計調査（e-Stat）](https://www.e-stat.go.jp/stat-search/files?stat_infid=000040199338)',
        '[宿泊旅行統計調査（観光庁）](https://www.mlit.go.jp/kankocho/tokei_hakusyo/shukuhakutokei.html)'
      )
      .replace(
        '[国勢調査（e-Stat）](https://www.e-stat.go.jp/stat-search/files?stat_infid=000032142404)',
        '[国勢調査（e-Stat）](https://www.e-stat.go.jp/dbview?sid=0003445244)'
      );
    if (corrected === article)
      throw new Error(`${slug}/article.md の誤った出典リンクを特定できません`);
    return corrected;
  }
  const corrected = article.replace(
    '縦軸に半導体依存度をとって47都道府県をプロットしたのが次の散布図です。',
    '縦軸に半導体依存度をとって、公表値のある45都道府県をプロットしたのが次の散布図です（高知県・沖縄県は電子部品出荷額が秘匿値のため除外）。'
  );
  if (corrected === article)
    throw new Error(`${slug}/article.md の散布図対象数を特定できません`);
  return corrected;
}

/** scatter json → generateScatterSvg (genScatterChartSvg と同等) */
function renderScatter(data: any): string {
  const title = data.title ?? '散布図';
  const xLabel = data.xLabel ?? 'X';
  const yLabel = data.yLabel ?? 'Y';
  const raw = data.points || data.data || [];
  const points = raw
    .filter((p: any) => typeof p.x === 'number' && typeof p.y === 'number')
    .map((p: any) => ({
      name: p.label || p.pref || p.areaName || '',
      code: p.code || '',
      x: p.x,
      y: p.y,
    }));
  if (!points.length) return '';
  return generateScatterSvg(points, {
    title,
    xLabel: data.xUnit ? `${xLabel}（${data.xUnit}）` : xLabel,
    yLabel: data.yUnit ? `${yLabel}（${data.yUnit}）` : yLabel,
  });
}

function loadTargets(): { slug: string; base: string }[] {
  const q = JSON.parse(
    fs.readFileSync(
      path.join(PROJECT_ROOT, '.claude/state/blog/svg-lineage-queue.json'),
      'utf8'
    )
  );
  let entries = q.entries
    .filter((e: any) => e.status === 'both' && e.chartType === 'scatter')
    .map((e: any) => ({ slug: e.slug, base: e.base }));
  if (BASE_ARG) {
    const [s, b] = BASE_ARG.split('/');
    entries = entries.filter((e: any) => e.slug === s && e.base === b);
  }
  return entries;
}

async function pMap<T, R>(
  items: T[],
  fn: (t: T) => Promise<R>,
  c: number
): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  const w = async () => {
    while (i < items.length) {
      const k = i++;
      try {
        out[k] = await fn(items[k]);
      } catch (e: any) {
        out[k] = {
          ...(typeof items[k] === 'object' && items[k] !== null
            ? items[k]
            : {}),
          result: 'error',
          err: String(e.message || e),
        } as any;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(c, items.length) }, w));
  return out;
}

async function main() {
  if (REQUIRE_CANONICAL && !PROBE_ONLY) {
    throw new Error('--require-canonical は --probe-only と併用してください');
  }
  const targets = loadTargets();
  console.error(
    `[rerender-scatter] ${targets.length} both-scatter を ${PROBE_ONLY ? 'probe' : '再描画'}`
  );
  const results = await pMap(
    targets,
    async (t) => {
      const rec: any = { slug: t.slug, base: t.base };
      let json: any;
      try {
        json = await fj(`${R2}/app/blog/${t.slug}/data/${t.base}.json`);
      } catch (e: any) {
        rec.result = 'json-fail';
        rec.err = String(e.message || e);
        return rec;
      }
      let source: any;
      try {
        source = await fj(
          `${R2}/app/blog/${t.slug}/data/${t.base}.source.json`
        );
      } catch (e: any) {
        rec.result = 'source-fail';
        rec.err = String(e.message || e);
        return rec;
      }
      const repair = await repairIfNeeded(t, json);
      let rebuiltKnown = repair;
      let sourceRepair: any = null;
      if (repair) {
        json = repair.json;
        source = repair.source;
        rec.repaired = true;
      }
      let sourceInspection = inspectChartSourceManifest(source);
      if (sourceInspection.verdict === 'invalid' && !repair) {
        rebuiltKnown = await rebuildKnownScatter(t, json);
        if (
          rebuiltKnown &&
          pointFingerprint(rebuiltKnown.json) === pointFingerprint(json)
        ) {
          const rebuiltInspection = inspectChartSourceManifest(
            rebuiltKnown.source
          );
          if (rebuiltInspection.verdict !== 'invalid') {
            sourceRepair = rebuiltKnown.source;
            source = sourceRepair;
            sourceInspection = rebuiltInspection;
            rec.sourceRepaired = true;
            rec.sourceVerified = true;
          }
        }
      }
      if (sourceInspection.verdict === 'invalid') {
        rec.result = 'source-invalid';
        rec.err = sourceInspection.detail;
        return rec;
      }
      const dataLint = lintScatterData(`${t.base}.svg`, json, source);
      if (dataLint.errors.length > 0) {
        rec.result = 'data-invalid';
        rec.err = dataLint.errors.join(' | ');
        return rec;
      }
      if (VERIFY_SOURCES) {
        try {
          const rebuilt = rebuiltKnown || (await rebuildKnownScatter(t, json));
          if (rebuilt) {
            const rebuiltSourceInspection = inspectChartSourceManifest(
              rebuilt.source
            );
            const rebuiltDataLint = lintScatterData(
              `${t.base}.svg`,
              rebuilt.json,
              rebuilt.source
            );
            if (
              rebuiltSourceInspection.verdict === 'invalid' ||
              rebuiltDataLint.errors.length > 0
            ) {
              rec.result = 'source-rebuild-invalid';
              rec.err = [
                rebuiltSourceInspection.verdict === 'invalid'
                  ? rebuiltSourceInspection.detail
                  : '',
                ...rebuiltDataLint.errors,
              ]
                .filter(Boolean)
                .join(' | ');
              return rec;
            }
            if (pointFingerprint(rebuilt.json) !== pointFingerprint(json)) {
              rec.result = 'source-drift';
              rec.err = '公開JSONが一次ソースから再計算した点集合と一致しない';
              return rec;
            }
            rec.sourceVerified = true;
          }
        } catch (e: any) {
          rec.result = 'source-verify-fail';
          rec.err = String(e.message || e);
          return rec;
        }
      }
      let oldSvg = '';
      try {
        oldSvg = await ft(`${R2}/app/blog/${t.slug}/data/${t.base}.svg`);
      } catch {}
      rec.oldSize = oldSvg ? viewBoxOf(oldSvg) : 'none';
      const newSvg = renderScatter(json);
      if (!newSvg) {
        rec.result = 'empty';
        return rec;
      }
      const lint = lintScatterQuality(`${t.base}.svg`, newSvg, json);
      const parity = lintScatterParity(`${t.base}.svg`, newSvg, json);
      if (lint.errors.length || parity.errors.length) {
        rec.result = 'lint-fail';
        rec.err = [...lint.errors, ...parity.errors].join(' | ');
        return rec;
      }
      rec.newSize = viewBoxOf(newSvg);
      // ★比較は provenance コメントを外して行う (2026-08-12)。
      //
      //   `generate-article-charts.ts` は冒頭に
      //   `<!-- data-source: <json> | generated: <ISO日時> -->` を埋める。日時は実行のたびに
      //   変わるので、生バイト比較だと**内容が同一でも必ず「不一致」**になる。実測では
      //   公開 78 枚のうち provenance 付き 9 枚だけが恒久的に rerender 判定になっており、
      //   その 9 枚を上書きすると provenance が消えて劣化する (この gate は日次 cron に
      //   配線されているので、放置すると毎日 9 枚を劣化させ続ける)。
      //   gate の役目は「点や軸が変わったか」= 内容ドリフトの検出なので、metadata は外す。
      if (stripProvenance(oldSvg) === stripProvenance(newSvg) && !repair && !sourceRepair) {
        rec.result = 'already-canonical';
        return rec;
      }
      rec.result = repair
        ? 'repair-and-rerender'
        : sourceRepair
          ? 'source-repair'
          : 'rerender';
      if (!PROBE_ONLY) {
        const dir = path.join(STAGE, t.slug, 'data');
        fs.mkdirSync(dir, { recursive: true });
        rec.keys = [];
        if (stripProvenance(oldSvg) !== stripProvenance(newSvg)) {
          // provenance は落とさない (元にあれば引き継ぐ)。gate の比較対象からは外してある。
          fs.writeFileSync(
            path.join(dir, `${t.base}.svg`),
            withProvenance(newSvg, oldSvg, `${t.base}.json`)
          );
          rec.keys.push(`app/blog/${t.slug}/data/${t.base}.svg`);
        }
        if (repair) {
          writeJson(path.join(dir, `${t.base}.json`), repair.json);
          writeJson(path.join(dir, `${t.base}.source.json`), repair.source);
          rec.keys.push(
            `app/blog/${t.slug}/data/${t.base}.json`,
            `app/blog/${t.slug}/data/${t.base}.source.json`
          );
          const article = await repairedArticle(`${t.slug}/${t.base}`, t.slug);
          if (article) {
            fs.writeFileSync(path.join(STAGE, t.slug, 'article.md'), article);
            rec.keys.push(`app/blog/${t.slug}/article.md`);
          }
        } else if (sourceRepair) {
          writeJson(path.join(dir, `${t.base}.source.json`), sourceRepair);
          rec.keys.push(`app/blog/${t.slug}/data/${t.base}.source.json`);
        }
      }
      return rec;
    },
    4
  );
  const by: Record<string, number> = {};
  for (const r of results) by[r.result] = (by[r.result] || 0) + 1;
  console.error(`[rerender-scatter] ${JSON.stringify(by)}`);
  const changed = results.filter(
    (r) =>
      r.result === 'rerender' ||
      r.result === 'repair-and-rerender' ||
      r.result === 'source-repair'
  );
  if (changed.length)
    console.error(
      '再描画:',
      changed.map((r) => `${r.oldSize}→${r.newSize} ${r.base}`).join('\n  ')
    );
  const failed = results.filter((r) =>
    [
      'json-fail',
      'source-fail',
      'source-invalid',
      'source-rebuild-invalid',
      'source-drift',
      'source-verify-fail',
      'data-invalid',
      'empty',
      'lint-fail',
      'error',
    ].includes(r.result)
  );
  if (REQUIRE_CANONICAL) failed.push(...changed);
  if (KEY_FILE_ARG && !PROBE_ONLY) {
    const keyFile = path.resolve(PROJECT_ROOT, KEY_FILE_ARG);
    fs.mkdirSync(path.dirname(keyFile), { recursive: true });
    const keys = [...new Set(results.flatMap((r) => r.keys || []))].sort();
    fs.writeFileSync(keyFile, keys.length ? `${keys.join('\n')}\n` : '');
  }
  console.log(
    JSON.stringify({
      by,
      total: results.length,
      changed: changed.length,
      sourceVerified: results.filter((result) => result.sourceVerified).length,
      keyCount: results.flatMap((r) => r.keys || []).length,
      probeOnly: PROBE_ONLY,
      requireCanonical: REQUIRE_CANONICAL,
      verifySources: VERIFY_SOURCES,
    })
  );
  if (failed.length) {
    console.error(
      failed
        .map(
          (r) =>
            `[${r.result}] ${r.slug}/${r.base}: ${
              r.err ||
              (REQUIRE_CANONICAL && changed.includes(r)
                ? '公開R2が正規生成結果と一致しない'
                : 'no canonical points')
            }`
        )
        .join('\n')
    );
    process.exitCode = 1;
  }
}
main();
