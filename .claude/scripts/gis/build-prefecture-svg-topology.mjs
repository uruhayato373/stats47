#!/usr/bin/env node
/**
 * 都道府県ランキングの SVG 地図の軽い形データを作る (npm run gis:prefecture-svg-topology)。
 *
 * prefecture.topojson は約 1MB・11 万点で、SVG へそのまま描くには細かすぎる。海岸線を簡略化し、
 * 東京都の小笠原諸島・南鳥島・沖ノ鳥島 (北緯 31 度より南) と、沖縄本島周辺より外の沖縄県 (宮古・八重山・大東) を
 * 落とす。県の色は 1 色なので、沖縄の別枠は本島が見えれば足りる。ランキングの地図は全国の濃淡を見せるもので、遠い島は日本や沖縄の別枠を小さくするだけなので
 * 描かない。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { feature, quantize } from "topojson-client";
import { presimplify, quantile, simplify } from "topojson-simplify";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../../..");
const SOURCE = "apps/web/public/prefecture.topojson";
const OUT = "apps/web/public/prefecture-simple.topojson";
/** 残す点の割合 */
const KEEP = 0.04;
const TOKYO = "13";
const FAR_ISLAND_LATITUDE = 31;
const OKINAWA = "47";
const OKINAWA_MAIN_LONGITUDE = [126.5, 128.5];

const topology = JSON.parse(readFileSync(resolve(ROOT, SOURCE), "utf8"));
const [name] = Object.keys(topology.objects);
const object = topology.objects[name];
const keepLand = (code, isNear) => {
  const geometry = object.geometries.find((g) => String(g.properties.N03_007) === code);
  const parts = feature(topology, geometry).geometry.coordinates;
  geometry.arcs = geometry.arcs.filter((_, index) => parts[index][0].some(isNear));
  return `${geometry.arcs.length}/${parts.length}`;
};
const tokyo = keepLand(TOKYO, ([, latitude]) => latitude >= FAR_ISLAND_LATITUDE);
const okinawa = keepLand(OKINAWA, ([longitude]) => longitude >= OKINAWA_MAIN_LONGITUDE[0] && longitude <= OKINAWA_MAIN_LONGITUDE[1]);

const pre = presimplify(topology);
const simplified = simplify(pre, quantile(pre, KEEP));
simplified.arcs = simplified.arcs.map((arc) => arc.map(([x, y]) => [x, y]));
const thin = quantize(simplified, 1e4);
for (const geometry of Object.values(thin.objects).flatMap((o) => o.geometries)) {
  const { N03_001, N03_007 } = geometry.properties;
  geometry.properties = { N03_001, N03_007 };
}
const body = JSON.stringify(thin);
writeFileSync(resolve(ROOT, OUT), body);
const points = thin.arcs.reduce((sum, arc) => sum + arc.length, 0);
console.log(`${OUT}: ${Math.round(body.length / 1024)}KB / gzip ${Math.round(gzipSync(body).length / 1024)}KB / ${points} 点 / ${thin.objects[name].geometries.length} 県 / 東京の陸地 ${tokyo} / 沖縄の陸地 ${okinawa}`);
