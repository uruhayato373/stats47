import { describe, expect, it } from "vitest";

import {
  getDatasetsBySource,
  getOpenDataSource,
  getOpenDataset,
  OPEN_DATA_SOURCES,
  OPEN_DATASETS,
} from "..";

// DPF の ID はテンプレートで作っていたが、台帳に書き出した値を固定している (作り直さない)
const DPF_DATASET_IDS = [
  'mlit-dpf-nlni-ksj',
  'mlit-dpf-dpf-statistical-data',
  'mlit-dpf-dpf-area-data',
  'mlit-dpf-ipf',
  'mlit-dpf-msil',
  'mlit-dpf-dhb',
  'mlit-dpf-hwq',
  'mlit-dpf-ffd',
  'mlit-dpf-qol',
  'mlit-dpf-gtfs',
  'mlit-dpf-rdpf',
  'mlit-dpf-rsdb',
  'mlit-dpf-mlit-plateau',
  'mlit-dpf-rtc',
  'mlit-dpf-ngi',
  'mlit-dpf-ndm',
  'mlit-dpf-sip4d',
  'mlit-dpf-dimaps',
  'mlit-dpf-lpfs',
  'mlit-dpf-crtc',
  'mlit-dpf-alpc',
  'mlit-dpf-ntrack',
  'mlit-dpf-psc',
  'mlit-dpf-cyport',
  'mlit-dpf-karte',
  'mlit-dpf-mcc',
  'mlit-dpf-nvpf',
  'mlit-dpf-mms',
  'mlit-dpf-imm',
  'mlit-dpf-jyubunpc',
  'mlit-dpf-kkd',
  'mlit-dpf-nxc',
  'mlit-dpf-tcd',
  'mlit-dpf-cals-fukushima',
  'mlit-dpf-dobox',
  'mlit-dpf-sample',
];

describe("公開データの台帳 (open-data.sources / open-data.datasets) と読み込み口", () => {
  it("提供元56件とデータセット136件を台帳の並びのまま出す", () => {
    expect(OPEN_DATA_SOURCES).toHaveLength(56);
    expect(OPEN_DATASETS).toHaveLength(136);
    expect(OPEN_DATA_SOURCES.map((source) => source.id)).toEqual([
      'fdma-heatstroke',
      'mhlw-medical-info',
      'mlit-reinfolib',
      'mlit-dpf',
      'gsi-hazard',
      'digital-agency-municipal-ods',
      'maff-regional-db',
      'egov-data-portal',
      'mlit-ksj',
      'mlit-plateau',
      'gsi-fgd',
      'mhlw-ndb-open',
      'env-biodiversity-gis',
      'resas',
      'jflec-financial-literacy',
      'nier-gakuryoku-chousa',
      'jma-weather',
      'jma-bousai-xml',
      'nied-bosai',
      'aist-gsj',
      'mlit-kunijiban',
      'mlit-water-info',
      'nies-kankyo-tenbo',
      'env-eadas',
      'mext-fooddb',
      'nta-houjin-bangou',
      'meti-gbizinfo',
      'fsa-edinet',
      'stat-dashboard',
      'digital-p-portal',
      'cao-keiki-watcher',
      'boj-stat-search',
      'jihs-idwr',
      'mhlw-covid19-open',
      'mext-school-code',
      'yokohama-opendata',
      'osaka-odpo',
      'tokyo-open-data-api',
      'e-gov-law-api',
      'ndl-search',
      'japansearch',
      'niad-university-portrait',
      'mlit-isj',
      'gsi-maps',
      'digital-abr',
      'mlit-city-planning-gis',
      'jartic-open-traffic',
      'npa-statistics',
      'mlit-road-census',
      'jaxa-earth-api',
      'nii-scholarly',
      'bunka-madb',
      'bunka-heritage-online',
      'jpn-archives-da',
      'artmuseums-union-catalog',
      'ndl-digital-collections',
    ]);
    expect(new Set(OPEN_DATASETS.map((dataset) => dataset.id)).size).toBe(136);
  });

  it("DPFの36件のIDを固定している", () => {
    expect(getDatasetsBySource("mlit-dpf").map((dataset) => dataset.id)).toEqual(DPF_DATASET_IDS);
  });

  it("提供元のdatasetIdsはデータセットのsourceIdから導き、台帳の並びに従う", () => {
    for (const source of OPEN_DATA_SOURCES) {
      expect(source.datasetIds, source.id).toEqual(
        OPEN_DATASETS.filter((dataset) => dataset.sourceId === source.id).map((dataset) => dataset.id),
      );
    }
    expect(OPEN_DATA_SOURCES.reduce((sum, source) => sum + source.datasetIds.length, 0)).toBe(136);
  });

  it("IDで引け、無いIDは空で返す", () => {
    expect(getOpenDataSource("mlit-dpf")?.datasetIds).toHaveLength(36);
    expect(getOpenDataset(DPF_DATASET_IDS[0])?.sourceId).toBe("mlit-dpf");
    expect(getOpenDataSource("zzz")).toBeUndefined();
    expect(getOpenDataset("zzz")).toBeUndefined();
    expect(getDatasetsBySource("zzz")).toEqual([]);
  });
});
