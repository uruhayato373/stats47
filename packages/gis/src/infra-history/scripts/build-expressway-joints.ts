/**
 * 主題 expressway-joints (高速道路のインターチェンジ・ジャンクション) の地図データを作る。
 *
 * 高速道路時系列 (N06) の ZIP には区間 (HighwaySection) と別に接合部 (Joint) の層がある。区間と同じ台帳の
 * ZIP (SHA・bytes を照合) から接合部を読み、区分は主題の台帳 (`data/geo/subjects/subjects.json`) のまとめ方で付ける。
 * 出力は `.local/r2/app/geo/history/expressway/joints.topojson` の 1 ファイル (全国。点だけなので簡略化しない)。
 * R2 へは書かない。
 *
 *   node --import tsx packages/gis/src/infra-history/scripts/build-expressway-joints.ts
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import * as topojsonServer from "topojson-server";
import unzipper from "unzipper";

import { findGeoSubject, geoSubjectClassOf } from "../../subjects";
import { UNKNOWN_YEAR, parseSourceYear } from "../core";
import { infraHistoryKeys } from "../keys";
import { findInfraNetwork } from "../networks";

const ROOT = path.resolve(__dirname, "../../../../..");
const SOURCE_DIR = path.join(ROOT, ".local/infra-history/src");
const OUT_ROOT = path.join(ROOT, ".local/r2");
/** 点の座標の量子化 (約 1m)。点だけの TopoJSON は簡略化・再量子化しない (二重に量子化されるため) */
const QUANTIZATION = 1e5;

/**
 * 接合部の属性 (2026-10-29 に公式ページの属性表で確認)。原典の事実なので、原典台帳
 * (GIS-ATTRIBUTE-LEDGER-01 の data/geo/attributes/N06.json) ができたらそこから引く
 */
const JOINT_ATTRIBUTES = {
  /** 設置期間の開始年 */
  start: "N06_013",
  /** 設置期間の終了年 (今もあるものは 9999) */
  end: "N06_014",
  /** 地点名 */
  name: "N06_018",
  /** 接合部種別コード (HighwayConCd) */
  category: "N06_019",
} as const;

async function main(): Promise<void> {
  const network = findInfraNetwork("expressway");
  const subject = findGeoSubject("expressway-joints");
  if (!network || !subject || subject.source.kind !== "ksj") throw new Error("台帳に expressway / expressway-joints が無い");
  const { source } = network;
  const file = path.join(SOURCE_DIR, `${source.dataId}-${source.version}.zip`);
  const buffer = fs.readFileSync(file);
  const sha = createHash("sha256").update(buffer).digest("hex");
  if (buffer.length !== source.archiveBytes || sha !== source.archiveSha256) {
    throw new Error(`原典 ZIP が台帳と一致しません: ${file} (bytes ${buffer.length}/${source.archiveBytes}, sha ${sha})`);
  }
  const entryPath = `UTF-8/${source.dataId}-${source.version}_${subject.source.featureType}.geojson`;
  const directory = await unzipper.Open.buffer(buffer);
  const entry = directory.files.find((item: { path: string }) => item.path === entryPath);
  if (!entry) throw new Error(`ZIP に ${entryPath} がありません`);
  const geojson = JSON.parse((await entry.buffer()).toString("utf8")) as {
    features: Array<{ geometry: { type: string; coordinates: [number, number] } | null; properties: Record<string, unknown> }>;
  };

  const problems: string[] = [];
  const unknownYear: string[] = [];
  const points: Array<{ type: "Feature"; geometry: { type: "Point"; coordinates: [number, number] }; properties: { s: number; e: number; c: string; n: string } }> = [];
  geojson.features.forEach((feature, index) => {
    const start = parseSourceYear(feature.properties[JOINT_ATTRIBUTES.start]);
    const end = parseSourceYear(feature.properties[JOINT_ATTRIBUTES.end]);
    const name = String(feature.properties[JOINT_ATTRIBUTES.name] ?? "").trim();
    const klass = geoSubjectClassOf(subject, feature.properties[JOINT_ATTRIBUTES.category]);
    if (start === UNKNOWN_YEAR || end === UNKNOWN_YEAR) unknownYear.push(name);
    else if (start === null || end === null || end < start) problems.push(`#${index} 年が不正 (${start}-${end})`);
    else if (!klass) problems.push(`#${index} 主題の台帳に無い種別 ${String(feature.properties[JOINT_ATTRIBUTES.category])}`);
    else if (feature.geometry?.type !== "Point") problems.push(`#${index} 点でない形状 ${feature.geometry?.type}`);
    else points.push({ type: "Feature", geometry: { type: "Point", coordinates: feature.geometry.coordinates }, properties: { s: start, e: end, c: klass.code, n: name } });
  });
  if (problems.length > 0) throw new Error(`接合部を ${problems.length} 件解釈できません:\n${problems.slice(0, 20).join("\n")}`);

  const topology = topojsonServer.topology({ points: { type: "FeatureCollection", features: points } as never }, QUANTIZATION);
  const outFile = path.join(OUT_ROOT, infraHistoryKeys.joints("expressway"));
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const text = `${JSON.stringify(topology)}\n`;
  fs.writeFileSync(outFile, text);

  const byClass = new Map<string, number>();
  for (const point of points) byClass.set(point.properties.c, (byClass.get(point.properties.c) ?? 0) + 1);
  console.log(`[expressway-joints] ${source.dataId}-${source.version} ${subject.source.featureType}`);
  console.log(`  記録 ${geojson.features.length} 件 / 出力 ${points.length} 件 / 年不明で除外 ${unknownYear.length} 件`);
  console.log(`  区分 ${[...byClass].map(([code, count]) => `${code}=${count}`).join(" ")}`);
  console.log(`  ${path.relative(ROOT, outFile)} ${(Buffer.byteLength(text) / 1024).toFixed(0)} KB`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
