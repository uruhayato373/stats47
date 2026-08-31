#!/usr/bin/env tsx

import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { fetchPrefectures } from '@stats47/area';

import {
  assertFloodConservation,
  assertLandPriceConservation,
} from '../../geo-analysis/content-details';
import { assertStationAccessConservation } from '../../geo-analysis/station-access';
import {
  GEO_STATION_ACCESS_MANIFEST_KEY,
  geoAnalysisManifestKey,
  geoAnalysisPrefKey,
  geoStationAccessPrefKey,
} from '../../geo-analysis/snapshot';

import type {
  GeoAnalysisArtifactEvidence,
  GeoAnalysisEvidenceManifest,
  GeoAnalysisSnapshot,
  GeoFloodPrefDetail,
  GeoLandPricePrefDetail,
  GeoStationAccessPrefDetail,
} from '../../geo-analysis/snapshot';

const LOCAL_R2_ROOT = path.resolve('.local/r2');

function readArtifact<T>(key: string): { value: T; body: Buffer } {
  const filePath = path.join(LOCAL_R2_ROOT, key);
  if (!fs.existsSync(filePath)) throw new Error(`artifact欠落: ${key}`);
  const body = fs.readFileSync(filePath);
  return { value: JSON.parse(body.toString('utf8')) as T, body };
}

function assertArtifactEvidence(
  evidence: GeoAnalysisArtifactEvidence,
  body: Buffer
): void {
  const actualSha256 = createHash('sha256').update(body).digest('hex');
  if (evidence.bytes !== body.byteLength) {
    throw new Error(
      `${evidence.key}: bytes不一致 manifest=${evidence.bytes} actual=${body.byteLength}`
    );
  }
  if (evidence.sha256 !== actualSha256) {
    throw new Error(`${evidence.key}: sha256不一致`);
  }
}

function assertDetailShape(
  value: GeoStationAccessPrefDetail,
  areaCode: string
): void {
  if (
    value.schemaVersion !== 1 ||
    value.slug !== 'population-station-access' ||
    value.areaCode !== areaCode ||
    value.accessRadiusMeters !== 800 ||
    value.meshMethod !== 'center-point' ||
    !Array.isArray(value.meshes) ||
    !Array.isArray(value.stations) ||
    value.meshes.length === 0
  ) {
    throw new Error(`${areaCode}: detail schema不良`);
  }
  const meshIds = new Set(value.meshes.map((mesh) => mesh[0]));
  if (meshIds.size !== value.meshes.length) {
    throw new Error(`${areaCode}: meshId重複`);
  }
}

function stageOutput(
  manifest: GeoAnalysisEvidenceManifest,
  stageId: string,
  key: string
): GeoAnalysisArtifactEvidence {
  const stage = manifest.stages.find((current) => current.id === stageId);
  const output = stage?.outputs.find((current) => current.key === key);
  if (!stage || !output) {
    throw new Error(`${stageId}: output欠落 ${key}`);
  }
  return output;
}

function assertManifestBase(
  manifest: GeoAnalysisEvidenceManifest,
  expectedSlug: string
): void {
  if (
    manifest.schemaVersion !== 1 ||
    manifest.slug !== expectedSlug ||
    manifest.quality.expectedAreas !== 47 ||
    manifest.quality.detailAreas !== 47 ||
    manifest.quality.conservationChecks !== 47 ||
    manifest.quality.sourceRecords <= 0 ||
    manifest.quality.derivedRecords <= 0
  ) {
    throw new Error(`${expectedSlug}: manifest schema/quality不良`);
  }
  for (const input of manifest.inputs) {
    if (
      (input.role === 'context-only' && input.usedInCalculation) ||
      (input.role === 'calculation-input' && !input.usedInCalculation)
    ) {
      throw new Error(`${input.layerId}: layer roleと計算利用フラグが不一致`);
    }
  }
}

function auditLandPrice(): void {
  const { value: manifest } = readArtifact<GeoAnalysisEvidenceManifest>(
    geoAnalysisManifestKey('population-land-price')
  );
  assertManifestBase(manifest, 'population-land-price');
  const { value: aggregate, body: aggregateBody } =
    readArtifact<GeoAnalysisSnapshot>(manifest.aggregate.key);
  assertArtifactEvidence(manifest.aggregate, aggregateBody);
  if (aggregate.rows.length !== 47) {
    throw new Error(`population-land-price: aggregate coverage ${aggregate.rows.length}/47`);
  }
  let maxDetailBytes = 0;
  let populatedMeshes = 0;
  let sourceRecords = 0;
  for (const prefecture of fetchPrefectures()) {
    const key = geoAnalysisPrefKey(
      'population-land-price',
      prefecture.prefCode.slice(0, 2)
    );
    const { value: detail, body } = readArtifact<GeoLandPricePrefDetail>(key);
    if (
      detail.schemaVersion !== 1 ||
      detail.slug !== 'population-land-price' ||
      detail.areaCode !== prefecture.prefCode ||
      detail.meshes.length === 0 ||
      detail.landPricePoints.length === 0 ||
      new Set(detail.meshes.map((mesh) => mesh[0])).size !== detail.meshes.length ||
      new Set(detail.landPricePoints.map((point) => point[0])).size !==
        detail.landPricePoints.length
    ) {
      throw new Error(`${key}: detail schema不良`);
    }
    for (const stageId of ['population-mesh', 'residential-land-price-points']) {
      assertArtifactEvidence(stageOutput(manifest, stageId, key), body);
    }
    const aggregateRow = aggregate.rows.find(
      (row) => row.areaCode === prefecture.prefCode
    );
    if (!aggregateRow) throw new Error(`${prefecture.prefCode}: aggregate欠落`);
    assertLandPriceConservation(detail, aggregateRow);
    maxDetailBytes = Math.max(maxDetailBytes, body.byteLength);
    populatedMeshes += detail.meshes.length;
    sourceRecords += detail.meshes.length + detail.landPricePoints.length;
  }
  if (
    manifest.quality.maxDetailBytes !== maxDetailBytes ||
    manifest.quality.populatedMeshes !== populatedMeshes ||
    manifest.quality.sourceRecords !== sourceRecords ||
    manifest.quality.derivedRecords !== 47
  ) {
    throw new Error('population-land-price: manifest quality集計不一致');
  }
  console.log(
    `✅ population-land-price: 47/47 areas / conservation 47/47 / max ${(maxDetailBytes / 1_000_000).toFixed(2)} MB`
  );
}

function auditFlood(): void {
  const { value: manifest } = readArtifact<GeoAnalysisEvidenceManifest>(
    geoAnalysisManifestKey('population-flood-risk')
  );
  assertManifestBase(manifest, 'population-flood-risk');
  const { value: aggregate, body: aggregateBody } =
    readArtifact<GeoAnalysisSnapshot>(manifest.aggregate.key);
  assertArtifactEvidence(manifest.aggregate, aggregateBody);
  if (aggregate.rows.length !== 47) {
    throw new Error(`population-flood-risk: aggregate coverage ${aggregate.rows.length}/47`);
  }
  const floodSourceStage = manifest.stages.find(
    (stage) => stage.id === 'flood-maximum-polygons'
  );
  if (!floodSourceStage || floodSourceStage.outputs.length !== 94) {
    throw new Error('population-flood-risk: 洪水入力94ファイルのlineageがありません');
  }
  for (const evidence of floodSourceStage.outputs) {
    const filePath = path.join(LOCAL_R2_ROOT, evidence.key);
    if (!fs.existsSync(filePath)) throw new Error(`artifact欠落: ${evidence.key}`);
    const body = fs.readFileSync(filePath);
    assertArtifactEvidence(evidence, body);
  }
  let maxDetailBytes = 0;
  let populatedMeshes = 0;
  let exposedMeshes = 0;
  for (const prefecture of fetchPrefectures()) {
    const key = geoAnalysisPrefKey(
      'population-flood-risk',
      prefecture.prefCode.slice(0, 2)
    );
    const { value: detail, body } = readArtifact<GeoFloodPrefDetail>(key);
    if (
      detail.schemaVersion !== 1 ||
      detail.slug !== 'population-flood-risk' ||
      detail.areaCode !== prefecture.prefCode ||
      detail.meshMethod !== 'center-point' ||
      detail.meshes.length === 0 ||
      new Set(detail.meshes.map((mesh) => mesh[0])).size !== detail.meshes.length
    ) {
      throw new Error(`${key}: detail schema不良`);
    }
    for (const stageId of ['population-mesh', 'flood-center-point-containment']) {
      assertArtifactEvidence(stageOutput(manifest, stageId, key), body);
    }
    const aggregateRow = aggregate.rows.find(
      (row) => row.areaCode === prefecture.prefCode
    );
    if (!aggregateRow) throw new Error(`${prefecture.prefCode}: aggregate欠落`);
    assertFloodConservation(detail, aggregateRow);
    maxDetailBytes = Math.max(maxDetailBytes, body.byteLength);
    populatedMeshes += detail.meshes.length;
    exposedMeshes += detail.summary.exposedMeshCount;
  }
  const sourceRecords =
    populatedMeshes +
    floodSourceStage.outputs.reduce((sum, output) => sum + output.recordCount, 0);
  if (
    manifest.quality.maxDetailBytes !== maxDetailBytes ||
    manifest.quality.populatedMeshes !== populatedMeshes ||
    manifest.quality.exposedMeshes !== exposedMeshes ||
    manifest.quality.derivedRecords !== exposedMeshes ||
    manifest.quality.sourceRecords !== sourceRecords
  ) {
    throw new Error('population-flood-risk: manifest quality集計不一致');
  }
  console.log(
    `✅ population-flood-risk: 47/47 areas / conservation 47/47 / max ${(maxDetailBytes / 1_000_000).toFixed(2)} MB`
  );
}

function main(): void {
  auditLandPrice();
  auditFlood();
  const { value: manifest } = readArtifact<GeoAnalysisEvidenceManifest>(
    GEO_STATION_ACCESS_MANIFEST_KEY
  );
  assertManifestBase(manifest, 'population-station-access');
  const contextStage = manifest.stages.find(
    (stage) => stage.id === 'station-passenger-context'
  );
  if (
    contextStage?.role !== 'context-only' ||
    !contextStage.outputs.every((output) => output.recordCount > 0)
  ) {
    throw new Error('駅別乗降客数contextの契約不良');
  }

  const { value: aggregate, body: aggregateBody } =
    readArtifact<GeoAnalysisSnapshot>(manifest.aggregate.key);
  assertArtifactEvidence(manifest.aggregate, aggregateBody);
  if (aggregate.rows.length !== 47) {
    throw new Error(`aggregate coverage不良: ${aggregate.rows.length}/47`);
  }

  let maxDetailBytes = 0;
  let accessibleMeshes = 0;
  for (const prefecture of fetchPrefectures()) {
    const prefCode2 = prefecture.prefCode.slice(0, 2);
    const key = geoStationAccessPrefKey(prefCode2);
    const { value: detail, body } =
      readArtifact<GeoStationAccessPrefDetail>(key);
    assertDetailShape(detail, prefecture.prefCode);

    const populationEvidence = stageOutput(manifest, 'population-mesh', key);
    const stationEvidence = stageOutput(
      manifest,
      'station-representative-points',
      key
    );
    const accessEvidence = stageOutput(manifest, 'station-access-800m', key);
    assertArtifactEvidence(populationEvidence, body);
    assertArtifactEvidence(stationEvidence, body);
    assertArtifactEvidence(accessEvidence, body);
    if (
      populationEvidence.recordCount !== detail.meshes.length ||
      stationEvidence.recordCount !== detail.stations.length ||
      accessEvidence.recordCount !== detail.summary.accessibleMeshCount
    ) {
      throw new Error(`${key}: stage recordCount不一致`);
    }

    const aggregateRow = aggregate.rows.find(
      (row) => row.areaCode === prefecture.prefCode
    );
    if (!aggregateRow) throw new Error(`${prefecture.prefCode}: aggregate欠落`);
    assertStationAccessConservation(detail, aggregateRow);
    maxDetailBytes = Math.max(maxDetailBytes, body.byteLength);
    accessibleMeshes += detail.summary.accessibleMeshCount;
  }

  if (
    manifest.quality.detailAreas !== 47 ||
    manifest.quality.conservationChecks !== 47 ||
    manifest.quality.maxDetailBytes !== maxDetailBytes ||
    manifest.quality.accessibleMeshes !== accessibleMeshes
  ) {
    throw new Error('manifest quality集計不一致');
  }

  console.log(
    `✅ Geo分析artifact: 47/47 areas / conservation 47/47 / max ${(maxDetailBytes / 1_000_000).toFixed(2)} MB`
  );
}

main();
