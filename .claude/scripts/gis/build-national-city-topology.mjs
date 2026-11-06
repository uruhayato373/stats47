#!/usr/bin/env node
/**
 * 全国の市区町村地図の軽い形データを作る (npm run gis:national-city-topology)。
 *
 * 元の jp_city_dc.topojson は約 6MB で、全国を 1 枚で見るには細かすぎる。海岸線を簡略化し、
 * 色塗りに要るコードと名前だけを残して apps/web/public/ へ置く。ページは地図が画面に入ってから読む。
 * 境界の出典は国土数値情報。形が更新されたらこのスクリプトで作り直す。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import { quantize } from "topojson-client";
import { presimplify, quantile, simplify } from "topojson-simplify";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../../..");
const { R2_PUBLIC_BASE_URL } = createRequire(import.meta.url)("../lib/site-config.cjs");
const SOURCE = `${R2_PUBLIC_BASE_URL}/gis/mlit/20240101/jp_city_dc.topojson`;
const OUT = "apps/web/public/municipalities.topojson";
/** 残す点の割合。2026-11-06 に 0.05 で 722KB (gzip 183KB)、全 1,731 自治体が残ることを確かめた */
const KEEP = 0.05;

const local = process.argv[2];
const topology = local ? JSON.parse(readFileSync(local, "utf8")) : await (await fetch(SOURCE)).json();
const pre = presimplify(topology);
const simplified = simplify(pre, quantile(pre, KEEP));
simplified.arcs = simplified.arcs.map((arc) => arc.map(([x, y]) => [x, y]));
// 差分と整数へ戻す。全国の地図は 1 万段階の解像度で足りる
const thin = quantize(simplified, 1e4);
for (const geometry of Object.values(thin.objects).flatMap((o) => o.geometries)) {
  const { N03_001, N03_004, MERGED_CODE, N03_007 } = geometry.properties;
  geometry.properties = { N03_001, N03_004, MERGED_CODE, N03_007 };
}
const body = JSON.stringify(thin);
writeFileSync(resolve(ROOT, OUT), body);
console.log(`${OUT}: ${Math.round(body.length / 1024)}KB / gzip ${Math.round(gzipSync(body).length / 1024)}KB (keep ${KEEP}, ${Object.values(thin.objects)[0].geometries.length} 自治体)`);
