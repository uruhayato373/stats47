#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';
import { getMetricConfig } from '@stats47/data-configs';
import { KNOWN_MUNICIPALITY_RANKING_KEYS } from '@stats47/data-configs/geo-scope';
import {
  parseRankingItemSnapshot,
  parseRankingItemsSnapshot,
} from '../repositories/schemas/ranking-item.schemas';
import {
  parseMunicipalityRankingItemSnapshot,
  parseMunicipalityRankingValuesSnapshot,
} from '../repositories/schemas/municipality-ranking.schemas';

const root = path.resolve(process.argv[2] ?? '.local/r2');
const read = (key: string): unknown =>
  JSON.parse(fs.readFileSync(path.join(root, key), 'utf8'));
function checkPresentation(key: string, presentation: unknown): void {
  const config = getMetricConfig(key);
  if (
    !config ||
    JSON.stringify(presentation) !== JSON.stringify(config.visualization)
  )
    throw new Error(
      `Snapshot presentation differs from canonical metric: ${key}`
    );
}
const all = parseRankingItemsSnapshot(read('app/ranking-items/all.json'));
let prefectures = 0;
for (const dir of fs.readdirSync(path.join(root, 'app/ranking'), {
  withFileTypes: true,
})) {
  if (!dir.isDirectory()) continue;
  const { item } = parseRankingItemSnapshot(
    read(`app/ranking/${dir.name}/item.json`)
  );
  if (item.rankingKey !== dir.name)
    throw new Error(`Ranking identity mismatch: ${dir.name}`);
  checkPresentation(item.rankingKey, item.visualization);
  prefectures++;
}
for (const item of all.items) {
  checkPresentation(item.rankingKey, item.visualization);
  const individual = parseRankingItemSnapshot(
    read(`app/ranking/${item.rankingKey}/item.json`)
  ).item;
  if (JSON.stringify(item) !== JSON.stringify(individual))
    throw new Error(
      `Ranking aggregate differs from individual snapshot: ${item.rankingKey}`
    );
}
let municipalities = 0;
for (const key of KNOWN_MUNICIPALITY_RANKING_KEYS) {
  const item = parseMunicipalityRankingItemSnapshot(
    read(`app/municipalities/ranking/${key}/item.json`)
  );
  const values = parseMunicipalityRankingValuesSnapshot(
    read(`app/municipalities/ranking/${key}/values.json`)
  );
  checkPresentation(key, item.visualization);
  if (
    item.rankingKey !== key ||
    values.rankingKey !== key ||
    item.valueCount !== values.count ||
    item.latestYear.yearCode !== values.yearCode ||
    item.unit !== values.unit
  )
    throw new Error(`Municipality item/values mismatch: ${key}`);
  municipalities++;
}
console.log(
  `Metric snapshots PASS: ${prefectures} prefecture items, ${all.count} aggregate items, ${municipalities} municipality item/values pairs.`
);
