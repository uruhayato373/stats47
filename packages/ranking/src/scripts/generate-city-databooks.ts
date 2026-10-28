#!/usr/bin/env tsx
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildMunicipalityEntityPolicy } from '@stats47/area';
import { getMetricConfig } from '@stats47/data-configs';
import { classifyMetric } from '@stats47/data-configs/display-semantics';
import {
  CITY_DATABOOK_LAYOUT,
  CITY_DATABOOK_POPULATION_METRIC_KEY,
  KNOWN_MUNICIPALITY_RANKING_KEYS,
  getMunicipalityMetricAvailability,
  listCityDatabookThemes,
  validateCityDatabookLayout,
} from '@stats47/data-configs/geo-scope';

import { buildCityDatabooks, buildWardBreakdowns } from '../municipalities/build-city-databooks';
import { cityDatabookKeyPath } from '../types/city-databook';
import {
  municipalityRankingItemKeyPath,
  municipalityRankingValuesKeyPath,
} from '../types/municipality-snapshot';
import { parseCityDatabookSnapshot, parseMunicipalityRankingItemSnapshot, parseMunicipalityRankingValuesSnapshot } from '../repositories/schemas/municipality-ranking.schemas';
import { fetchCitiesPayload } from './generate-municipality-ranking';

import type { CityPopulationHistoryRow } from '../municipalities/build-city-databooks';
import type {
  MunicipalityRankingItemSnapshot,
  MunicipalityRankingValuesSnapshot,
} from '../types/municipality-snapshot';

/**
 * 市区町村ページのデータブック (`app/areas/<県>/cities/<市区町村>/databook.json`) を生成する。
 *
 * 入力は市区町村ランキングの配信値。`--input-root` (既定 `.local/r2`) に同じ run で生成した版があればそれを、
 * 無ければ配信中の版 (`--source-base`) を読む。どちらを読んでも、反映後に R2 にある版と同じ値になる
 * (同じ run でランキングの生成に失敗した key は R2 へ送られず、配信中の版が残るため)。
 * 人口の前回の値だけは `app/stats/total-population/cities.json` の全年から取る。
 *
 * 公開対象の市区町村のうちデータブックを作れなかったもの (人口の値が無い) は名前を出して失敗にする
 * (ページが title に使う人口が無いまま公開しないため)。生成時刻は持たないので、中身が同じなら同じバイト列になる。
 */
const REPO_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));
const MAX_DATABOOK_BYTES = 128 * 1024;

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function readSnapshot(key: string, inputRoot: string, sourceBase: string): Promise<unknown> {
  const local = path.join(inputRoot, ...key.split('/'));
  if (existsSync(local)) return JSON.parse(await readFile(local, 'utf8'));
  return fetchCitiesPayload(`${sourceBase}/${key}`);
}

async function readRankings(
  inputRoot: string,
  sourceBase: string
): Promise<Map<string, { item: MunicipalityRankingItemSnapshot; values: MunicipalityRankingValuesSnapshot }>> {
  const keys = [...KNOWN_MUNICIPALITY_RANKING_KEYS].sort();
  const entries = await Promise.all(
    keys.map(async (key) => {
      const [item, values] = await Promise.all([
        readSnapshot(municipalityRankingItemKeyPath(key), inputRoot, sourceBase),
        readSnapshot(municipalityRankingValuesKeyPath(key), inputRoot, sourceBase),
      ]);
      return [
        key,
        { item: parseMunicipalityRankingItemSnapshot(item), values: parseMunicipalityRankingValuesSnapshot(values) },
      ] as const;
    })
  );
  return new Map(entries);
}

async function main(): Promise<void> {
  const sourceBase = (argValue('--source-base') ?? process.env.R2_PUBLIC_FETCH_URL ?? 'http://127.0.0.1:4777').replace(/\/$/, '');
  const inputRoot = path.resolve(argValue('--input-root') ?? path.join(REPO_ROOT, '.local', 'r2'));
  const outputRoot = path.resolve(argValue('--output-root') ?? path.join(REPO_ROOT, '.local', 'r2'));

  const layoutErrors = validateCityDatabookLayout();
  if (layoutErrors.length > 0) throw new Error(`city databook layout is invalid:\n${layoutErrors.join('\n')}`);

  const [rankings, population] = await Promise.all([
    readRankings(inputRoot, sourceBase),
    fetchCitiesPayload(`${sourceBase}/app/stats/${CITY_DATABOOK_POPULATION_METRIC_KEY}/cities.json`) as Promise<{
      rows: CityPopulationHistoryRow[];
    }>,
  ]);

  const policy = buildMunicipalityEntityPolicy();
  const entities = policy.entities.filter((entity) => entity.disposition === 'publishable');

  // 政令指定都市の行政区の内訳 (MUNI-DESIGNATED-CITY-WARDS-01): 見出しの指標の e-Stat の観測値から行政区の行を取る
  const wardsByCity = new Map<string, Array<{ code: string; name: string }>>();
  for (const entity of policy.entities) {
    if (entity.disposition !== 'excluded' || entity.kind !== 'administrative-ward' || !entity.parentMunicipalityCode) continue;
    wardsByCity.set(entity.parentMunicipalityCode, [
      ...(wardsByCity.get(entity.parentMunicipalityCode) ?? []),
      { code: entity.code, name: entity.name },
    ]);
  }
  const headlineObservations = new Map<string, CityPopulationHistoryRow[]>([[CITY_DATABOOK_POPULATION_METRIC_KEY, population.rows]]);
  for (const key of CITY_DATABOOK_LAYOUT.headlineMetricKeys) {
    if (headlineObservations.has(key)) continue;
    const payload = (await fetchCitiesPayload(`${sourceBase}/app/stats/${key}/cities.json`)) as { rows: CityPopulationHistoryRow[] };
    headlineObservations.set(key, payload.rows);
  }
  const wardBreakdowns = buildWardBreakdowns({
    wardsByCity,
    headlineMetricKeys: CITY_DATABOOK_LAYOUT.headlineMetricKeys,
    rankings,
    observations: headlineObservations,
    valuePolicyOf: (key) => {
      const availability = getMunicipalityMetricAvailability(key);
      return availability.status === 'published' ? availability.valuePolicy : undefined;
    },
  });
  if (wardBreakdowns.size !== wardsByCity.size) {
    const lacking = [...wardsByCity.keys()].filter((code) => !wardBreakdowns.has(code));
    throw new Error(`designated cities without ward breakdown: ${lacking.join(', ')}`);
  }

  const databooks = buildCityDatabooks({
    entities,
    themes: listCityDatabookThemes(),
    headlineMetricKeys: CITY_DATABOOK_LAYOUT.headlineMetricKeys,
    populationMetricKey: CITY_DATABOOK_POPULATION_METRIC_KEY,
    rankings,
    basisOf: (key) => {
      const metric = getMetricConfig(key);
      if (!metric) throw new Error(`MetricConfig not found: ${key}`);
      return classifyMetric(metric).basis;
    },
    populationHistory: population.rows,
    wardBreakdowns,
  });

  const missing = entities.filter((entity) => !databooks.has(entity.code));
  if (missing.length > 0) {
    throw new Error(
      `publishable municipalities without population: ${missing.map((entity) => `${entity.code} ${entity.name}`).join(', ')}`
    );
  }

  let largest = 0;
  for (const databook of databooks.values()) {
    const body = JSON.stringify(parseCityDatabookSnapshot(databook));
    const bytes = Buffer.byteLength(body);
    if (bytes > MAX_DATABOOK_BYTES) throw new Error(`city databook exceeds ${MAX_DATABOOK_BYTES} bytes: ${databook.areaCode} ${bytes}`);
    largest = Math.max(largest, bytes);
    const target = path.join(outputRoot, ...cityDatabookKeyPath(databook.prefectureCode, databook.areaCode).split('/'));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body, 'utf8');
  }

  console.log(
    JSON.stringify(
      { outputRoot, databooks: databooks.size, rankings: rankings.size, wardBreakdowns: wardBreakdowns.size, largestBytes: largest },
      null,
      2
    )
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
