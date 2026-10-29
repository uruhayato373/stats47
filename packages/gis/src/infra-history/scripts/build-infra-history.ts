/**
 * 交通網の変遷 artifact の生成 (高速道路 N06 / 鉄道 N05)。
 *
 * 台帳 (`networks.ts`) の原典 ZIP を SHA で照合し、区間を県境で分割して年ごとの延長を集計、
 * 全国・7 地方・47 県の TopoJSON と summary / manifest を `.local/r2/app/geo/history/<key>/` へ書く。
 * R2 へは書かない。公開は台帳の `publication.status` が `public-approved` になってから
 * 既存の publisher で行う (非商用原典なので `ksj-publication-guard.ts` がそれまで拒否する)。
 *
 *   node --import tsx packages/gis/src/infra-history/scripts/build-infra-history.ts --network expressway
 *   node --import tsx packages/gis/src/infra-history/scripts/build-infra-history.ts --network all
 *
 * 原典 ZIP は `.local/infra-history/src/<dataId>-<version>.zip` に無ければ公式から取得する。
 */

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import * as topojsonClient from "topojson-client";
import * as topojsonServer from "topojson-server";
import * as topojsonSimplify from "topojson-simplify";
import unzipper from "unzipper";

import {
  DEFAULT_COASTLINE_TOLERANCE_KM,
  PREF_CODES,
  createPrefectureLocator,
} from "../../mlit-ksj/prefecture-assign";
import {
  buildLengthSeries,
  classifyTransitions,
  lineLengthKm,
  maxSeriesDiffKm,
  UNKNOWN_YEAR,
  parseSourceYear,
  splitLineByPrefecture,
  sumLengthSeries,
  yearRange,
  type LinePiece,
  type Position,
  type SegmentAssignment,
  type YearSpan,
} from "../core";
import { infraHistoryKeys } from "../keys";
import { INFRA_NETWORKS, infraNetworkPageUrl, infraNetworkTerms } from "../networks";
import { INFRA_REGIONS } from "../scopes";
import type {
  InfraArtifactRecord,
  InfraEventProperties,
  InfraHistoryManifest,
  InfraHistorySummary,
  InfraLengthSeries,
  InfraNetworkDefinition,
  InfraPieceProperties,
} from "../types";

const ROOT = path.resolve(__dirname, "../../../../..");
const SOURCE_DIR = path.join(ROOT, ".local/infra-history/src");
const OUT_ROOT = path.join(ROOT, ".local/r2");
const PREF_TOPOJSON = path.join(ROOT, "packages/gis/data/geoshape/prefecture.topojson");
/** 保存則の許容誤差 (km)。各値を 1m 単位に丸めるので、47 県 + 未帰属の丸め誤差を上限とする */
const CONSERVATION_TOLERANCE_KM = 0.05;
/** 座標の量子化。全国表示は粗く、県・地方表示は細かく */
const QUANTIZATION = { national: 1e4, detail: 1e5 } as const;
/** 簡略化の重み分位。この分位より小さい重みの点を落とす (全国は 1 画面に収まる粗さで十分) */
const SIMPLIFY_QUANTILE = { national: 0.95, detail: 0.5 } as const;

interface UnknownYearRecord {
  readonly index: number;
  readonly name: string;
  readonly start: number | null;
  readonly end: number | null;
  readonly km: number;
}

interface SourceFeature {
  readonly start: number;
  readonly end: number;
  readonly category: string;
  readonly name: string;
  readonly relationIds: string[];
  readonly lines: Position[][];
}

type Piece<P> = { props: P; coords: readonly Position[] };

function parseArgs(argv: readonly string[]): { networks: InfraNetworkDefinition[] } {
  const index = argv.indexOf("--network");
  const value = index >= 0 ? argv[index + 1] : undefined;
  if (!value) throw new Error("--network <expressway|railway|all> を指定してください");
  if (value === "all") return { networks: [...INFRA_NETWORKS] };
  const network = INFRA_NETWORKS.find((item) => item.key === value);
  if (!network) throw new Error(`台帳に無い路線網: ${value}`);
  return { networks: [network] };
}

function sha256(buffer: Buffer | string): string {
  return createHash("sha256").update(buffer).digest("hex");
}

async function readVerifiedArchive(network: InfraNetworkDefinition): Promise<Buffer> {
  const { source } = network;
  const file = path.join(SOURCE_DIR, `${source.dataId}-${source.version}.zip`);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(SOURCE_DIR, { recursive: true });
    console.log(`  取得: ${source.archiveUrl}`);
    const response = await fetch(source.archiveUrl);
    if (!response.ok) throw new Error(`原典の取得に失敗: HTTP ${response.status}`);
    fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  }
  const buffer = fs.readFileSync(file);
  const actual = sha256(buffer);
  if (buffer.length !== source.archiveBytes || actual !== source.archiveSha256) {
    throw new Error(
      `原典 ZIP が台帳と一致しません: ${file} (bytes ${buffer.length}/${source.archiveBytes}, sha ${actual})`,
    );
  }
  return buffer;
}

async function readSourceFeatures(
  network: InfraNetworkDefinition,
  archive: Buffer,
): Promise<{ features: SourceFeature[]; unknownYear: UnknownYearRecord[] }> {
  const directory = await unzipper.Open.buffer(archive);
  const entry = directory.files.find(
    (file: { path: string; buffer(): Promise<Buffer> }) => file.path === network.source.entry,
  );
  if (!entry) throw new Error(`ZIP に ${network.source.entry} がありません`);
  const geojson = JSON.parse((await entry.buffer()).toString("utf8")) as {
    features: Array<{ geometry: { type: string; coordinates: unknown } | null; properties: Record<string, unknown> }>;
  };
  const codes = new Set(network.categories.map((category) => category.code));
  const { attributes } = network;
  const problems: string[] = [];
  const features: SourceFeature[] = [];
  const unknownYear: UnknownYearRecord[] = [];
  geojson.features.forEach((feature, index) => {
    const start = parseSourceYear(feature.properties[attributes.start]);
    const end = parseSourceYear(feature.properties[attributes.end]);
    const category = String(feature.properties[attributes.category] ?? "");
    const name = String(feature.properties[attributes.name] ?? "").trim();
    const geometry = feature.geometry;
    const lines =
      geometry?.type === "LineString"
        ? [geometry.coordinates as Position[]]
        : geometry?.type === "MultiLineString"
          ? (geometry.coordinates as Position[][])
          : null;
    if ((start === UNKNOWN_YEAR || end === UNKNOWN_YEAR) && lines) {
      // 年不明の記録は時系列に置けない。推測せず除外し、件数と延長を manifest に残す
      unknownYear.push({ index, name, start, end, km: lines.reduce((sum, line) => sum + lineLengthKm(line), 0) });
    } else if (start === null || end === null || end < start) problems.push(`#${index} 年が不正 (${start}-${end})`);
    else if (!codes.has(category)) problems.push(`#${index} 台帳に無い種別 ${category}`);
    else if (!lines) problems.push(`#${index} 線ではない形状 ${geometry?.type}`);
    else {
      const relationIds = [
        String(feature.properties[attributes.relation] ?? ""),
        ...String(feature.properties[attributes.relationNote] ?? "").split("+"),
      ]
        .map((id) => id.trim())
        .filter((id) => id !== "");
      features.push({ start, end, category, name, relationIds, lines });
    }
  });
  if (problems.length > 0) {
    throw new Error(`原典の読み取りで ${problems.length} 件を解釈できません:\n${problems.slice(0, 20).join("\n")}`);
  }
  return { features, unknownYear };
}

function toCollection<P>(pieces: ReadonlyArray<Piece<P>>) {
  return {
    type: "FeatureCollection" as const,
    features: pieces.map((piece) => ({
      type: "Feature" as const,
      properties: piece.props,
      geometry: { type: "LineString" as const, coordinates: piece.coords.map((p) => [p[0], p[1]]) },
    })),
  };
}

/** 路線網 (`lines`) と開通・廃止の強調線 (`events`) を 1 つの TopoJSON にする */
function toTopology(
  pieces: ReadonlyArray<Piece<InfraPieceProperties>>,
  events: ReadonlyArray<Piece<InfraEventProperties>>,
  quantization: number,
  quantile: number,
): string {
  const topology = topojsonServer.topology(
    { lines: toCollection(pieces) as never, events: toCollection(events) as never },
    quantization,
  );
  const presimplified = topojsonSimplify.presimplify(topology as never);
  const minWeight = topojsonSimplify.quantile(presimplified, quantile);
  // presimplify は座標を量子化前の小数へ戻すので、簡略化の後に量子化し直す
  const simplified = topojsonClient.quantize(
    topojsonSimplify.simplify(presimplified, minWeight) as never,
    quantization,
  );
  return `${JSON.stringify(simplified)}\n`;
}

async function buildNetwork(network: InfraNetworkDefinition): Promise<void> {
  console.log(`\n[${network.key}] ${network.source.dataId}-${network.source.version}`);
  const archive = await readVerifiedArchive(network);
  const { features, unknownYear } = await readSourceFeatures(network, archive);
  const years = yearRange(network.years.first, network.years.last);
  const codes = network.categories.map((category) => category.code);

  const locator = createPrefectureLocator(JSON.parse(fs.readFileSync(PREF_TOPOJSON, "utf8")));
  const assign = (lon: number, lat: number): SegmentAssignment | null => {
    const inside = locator.locate(lon, lat);
    if (inside) return { prefCode: inside, method: "polygon" };
    const near = locator.locateNearby(lon, lat, DEFAULT_COASTLINE_TOLERANCE_KM);
    return near ? { prefCode: near, method: "coastline" } : null;
  };

  const sourceSpans: YearSpan[] = [];
  const spansByPref = new Map<string | null, YearSpan[]>();
  const piecesByPref = new Map<string, Array<Piece<InfraPieceProperties>>>();
  const nationalPieces: Array<Piece<InfraPieceProperties>> = [];
  const counts = { segments: 0, polygon: 0, coastline: 0, unassigned: 0 };

  for (const feature of features) {
    const props: InfraPieceProperties = { s: feature.start, e: feature.end, c: feature.category, n: feature.name };
    for (const line of feature.lines) {
      sourceSpans.push({ start: feature.start, end: feature.end, category: feature.category, km: lineLengthKm(line) });
      nationalPieces.push({ props, coords: line });
      const pieces: LinePiece[] = splitLineByPrefecture(line, assign);
      for (const piece of pieces) {
        counts.segments += piece.segments;
        if (piece.method === "polygon") counts.polygon += piece.segments;
        else if (piece.method === "coastline") counts.coastline += piece.segments;
        else counts.unassigned += piece.segments;
        const span = { start: feature.start, end: feature.end, category: feature.category, km: piece.km };
        spansByPref.set(piece.prefCode, [...(spansByPref.get(piece.prefCode) ?? []), span]);
        if (piece.prefCode) {
          const list = piecesByPref.get(piece.prefCode) ?? [];
          list.push({ props, coords: piece.coords });
          piecesByPref.set(piece.prefCode, list);
        }
      }
    }
  }

  // 開通・延伸・廃止・短縮 (属性だけの変更は除く)。強調線も県境で分け、県・地方の地図に入れる
  const transitions = classifyTransitions(
    features.map((feature) => ({
      start: feature.start,
      end: feature.end,
      relationIds: feature.relationIds,
      lines: feature.lines,
    })),
    network.years.first,
    network.years.last,
  );
  const nationalEvents: Array<Piece<InfraEventProperties>> = [];
  const eventsByPref = new Map<string, Array<Piece<InfraEventProperties>>>();
  const transitionTotals = {
    open: { count: 0, km: 0 },
    extend: { count: 0, km: 0 },
    close: { count: 0, km: 0 },
    shorten: { count: 0, km: 0 },
  };
  for (const event of transitions) {
    const feature = features[event.recordIndex];
    const props: InfraEventProperties = { k: event.kind, y: event.year, c: feature.category, n: feature.name };
    transitionTotals[event.kind].count += 1;
    transitionTotals[event.kind].km += event.km;
    for (const line of event.lines) {
      nationalEvents.push({ props, coords: line });
      for (const piece of splitLineByPrefecture(line, assign)) {
        if (!piece.prefCode) continue;
        eventsByPref.set(piece.prefCode, [...(eventsByPref.get(piece.prefCode) ?? []), { props, coords: piece.coords }]);
      }
    }
  }
  for (const total of Object.values(transitionTotals)) total.km = Math.round(total.km * 10) / 10;

  const prefectures: Record<string, InfraLengthSeries> = Object.fromEntries(
    PREF_CODES.map((code) => [code, buildLengthSeries(spansByPref.get(code) ?? [], years, codes)]),
  );
  const unassigned = buildLengthSeries(spansByPref.get(null) ?? [], years, codes);
  const national = buildLengthSeries(sourceSpans, years, codes);
  const regions: Record<string, InfraLengthSeries> = Object.fromEntries(
    INFRA_REGIONS.map((region) => [
      region.code,
      sumLengthSeries(
        region.prefCodes.map((code) => prefectures[code]),
        years.length,
        codes,
      ),
    ]),
  );

  const assembled = sumLengthSeries([...Object.values(prefectures), unassigned], years.length, codes);
  const maxAbsDiffKm = Math.round(maxSeriesDiffKm(assembled, national) * 1000) / 1000;
  const conservationPassed = maxAbsDiffKm <= CONSERVATION_TOLERANCE_KM;
  if (!conservationPassed) {
    throw new Error(`保存則違反: 県の合計 + 未帰属 と全国の差が最大 ${maxAbsDiffKm} km`);
  }

  const summary: InfraHistorySummary = {
    schemaVersion: 1,
    network: network.key,
    years,
    national,
    prefectures,
    regions,
    unassigned,
  };

  const outputs: Array<{ key: string; body: string; features?: number }> = [
    { key: infraHistoryKeys.summary(network.key), body: `${JSON.stringify(summary)}\n` },
    {
      key: infraHistoryKeys.national(network.key),
      body: toTopology(nationalPieces, nationalEvents, QUANTIZATION.national, SIMPLIFY_QUANTILE.national),
      features: nationalPieces.length,
    },
    ...INFRA_REGIONS.map((region) => {
      const pieces = region.prefCodes.flatMap((code) => piecesByPref.get(code) ?? []);
      const events = region.prefCodes.flatMap((code) => eventsByPref.get(code) ?? []);
      return {
        key: infraHistoryKeys.region(network.key, region.code),
        body: toTopology(pieces, events, QUANTIZATION.detail, SIMPLIFY_QUANTILE.detail),
        features: pieces.length,
      };
    }),
    ...PREF_CODES.map((code) => {
      const pieces = piecesByPref.get(code) ?? [];
      return {
        key: infraHistoryKeys.prefecture(network.key, code),
        body: toTopology(pieces, eventsByPref.get(code) ?? [], QUANTIZATION.detail, SIMPLIFY_QUANTILE.detail),
        features: pieces.length,
      };
    }),
  ];

  const records: InfraArtifactRecord[] = outputs.map((output) => ({
    key: output.key,
    bytes: Buffer.byteLength(output.body),
    sha256: sha256(output.body),
    ...(output.features === undefined ? {} : { features: output.features }),
  }));

  const definitionSha256 = sha256(
    [
      fs.readFileSync(path.join(__dirname, "../core.ts"), "utf8"),
      fs.readFileSync(__filename, "utf8"),
    ].join("\n"),
  );
  const lastIndex = years.length - 1;
  const manifest: InfraHistoryManifest = {
    schemaVersion: 1,
    network: network.key,
    generatedAt: new Date().toISOString(),
    source: { ...network.source, pageUrl: infraNetworkPageUrl(network) },
    terms: infraNetworkTerms(network),
    publication: network.publication,
    definitionSha256,
    input: {
      features: features.length,
      sourceLengthKmLastYear: national.total[lastIndex],
      excludedUnknownYear: unknownYear.map((record) => ({
        sourceIndex: record.index,
        name: record.name,
        start: record.start,
        end: record.end,
        km: Math.round(record.km * 1000) / 1000,
      })),
    },
    assignment: { ...counts, coastlineToleranceKm: DEFAULT_COASTLINE_TOLERANCE_KM },
    transitions: transitionTotals,
    conservation: { maxAbsDiffKm, toleranceKm: CONSERVATION_TOLERANCE_KM, passed: conservationPassed },
    outputs: records,
  };

  for (const output of outputs) {
    const file = path.join(OUT_ROOT, output.key);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, output.body);
  }
  const manifestFile = path.join(OUT_ROOT, infraHistoryKeys.manifest(network.key));
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);

  const totalBytes = records.reduce((sum, record) => sum + record.bytes, 0);
  console.log(`  年不明で除外 ${unknownYear.length} 件`);
  console.log(`  区間 ${features.length} 件 / 線分 ${counts.segments} (ポリゴン ${counts.polygon}・海岸線 ${counts.coastline}・未帰属 ${counts.unassigned})`);
  console.log(`  ${years[lastIndex]}年 延長 ${national.total[lastIndex].toFixed(1)} km (未帰属 ${unassigned.total[lastIndex].toFixed(1)} km)`);
  console.log(`  保存則 最大差 ${maxAbsDiffKm} km / 出力 ${records.length + 1} ファイル ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  national.topojson ${(records[1].bytes / 1024).toFixed(0)} KB`);
}

async function main(): Promise<void> {
  const { networks } = parseArgs(process.argv.slice(2));
  for (const network of networks) await buildNetwork(network);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
