import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import {
  assertGeoLowElevationConservation,
  parseGeoLowElevationManifest,
  parseGeoLowElevationPrefDetail,
} from "../low-elevation-population";

// 生成物 (.local/r2/app/geo/population-low-elevation/) に対する契約。生成物はリポジトリに無いので
// 通常のテスト実行からは外れる (*.integration.test.ts は vitest.config の exclude 対象)。
// 公開前の正準の監査は `npm run geo:audit-low-elevation` で、このファイルはその補助。
const ROOT = fileURLToPath(new URL("../../../../../.local/r2/", import.meta.url));
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

describe("ローカル生成物(.local/r2)の契約", () => {
  const read = (key: string) => JSON.parse(readFileSync(`${ROOT}${key}`, "utf8")) as Record<string, any>;

  test("manifestが承認済み入力集合・4段階・47県と一致する", () => {
    const manifest = read("app/geo/population-low-elevation/manifest.json");
    expect(parseGeoLowElevationManifest(manifest)).not.toBeNull();
    // 入力集合の欠落・差し替え・段階の取り違え・原典表示の改変を拒否する
    const drop = clone(manifest); drop.inputs.splice(10, 1);
    const swap = clone(manifest); swap.inputs[3].sha256 = "0".repeat(64);
    const stage = clone(manifest); [stage.stages[0], stage.stages[1]] = [stage.stages[1], stage.stages[0]];
    const attribution = clone(manifest); attribution.attribution["G04-a"] = [];
    const context = clone(manifest); context.contextLayers = [{ layerId: "x" }];
    const quality = clone(manifest); quality.quality.populatedMeshes += 1;
    const detailSha = clone(manifest); detailSha.stages[2].outputs[0].sha256 = "1".repeat(64);
    for (const bad of [drop, swap, stage, attribution, context, quality, detailSha])
      expect(parseGeoLowElevationManifest(bad)).toBeNull();
  });

  test("47県すべてが検証を通り、manifestのSHA・件数・国勢調査人口と集計行に一致する", () => {
    const manifest = read("app/geo/population-low-elevation/manifest.json");
    const item = read("app/geo/population-low-elevation/item.json");
    const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");
    expect(sha(readFileSync(`${ROOT}app/geo/population-low-elevation/item.json`))).toBe(manifest.aggregate.sha256);
    let meshes = 0;
    for (const out of manifest.stages[0].outputs) {
      const body = readFileSync(`${ROOT}${out.key}`);
      expect(sha(body)).toBe(out.sha256);
      expect(body.byteLength).toBe(out.bytes);
      const detail = parseGeoLowElevationPrefDetail(JSON.parse(body.toString("utf8")), out.areaCode)!;
      expect(detail, out.key).not.toBeNull();
      expect(detail.meshes.length).toBe(out.recordCount);
      expect(detail.summary.conservation.censusPopulation2020).toBe(manifest.censusReference.populationByArea[out.areaCode]);
      assertGeoLowElevationConservation(detail, item.rows.find((r: { areaCode: string }) => r.areaCode === out.areaCode));
      meshes += detail.meshes.length;
    }
    expect(meshes).toBe(manifest.quality.populatedMeshes);
  });
});
