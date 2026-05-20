/**
 * 日照地図 (メッシュ日照地図) のラスター PNG を生成して R2 に出力する。
 *
 * 統計 × GIS — 日照クラスターの旗艦コンテンツ。
 * KSJ G02 平年値（気候）メッシュ 2022 の 1km メッシュ別 年日照時間 (G02_071) を
 * 全国ラスター画像に焼き、Leaflet ImageOverlay で表示する。
 *
 * 入力: /tmp/g02-sunshine-all.json (fetch-g02-sunshine.cjs の出力)
 *   { meshes: [ [meshCode8桁, G02_071(0.1h単位)], ... ] }
 *
 * 出力 (R2):
 *   app/gis-cross/sunshine-map/raster.png  — Web Mercator ラスター
 *   app/gis-cross/sunshine-map/meta.json   — bounds / 値域 / 凡例
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     apps/web/scripts/export-sunshine-map-raster.ts
 */

import fs from "node:fs";
import sharp from "sharp";

import { saveToR2 } from "@stats47/r2-storage/server";

const INPUT = "/tmp/g02-sunshine-all.json";
const RASTER_KEY = "app/gis-cross/sunshine-map/raster.png";
const META_KEY = "app/gis-cross/sunshine-map/meta.json";

const NODATA = 999999;
// 3 次メッシュ: 緯度 30 秒 = 1/120 度, 経度 45 秒 = 1/80 度
const LAT_STEP = 1 / 120;
const LON_STEP = 1 / 80;

// 色付けの基準 (0.1h 単位)。p5〜p95 ≒ 1200〜2114h を少し広げて 1200〜2300h。
const COLOR_MIN = 12000; // 1200h
const COLOR_MAX = 23000; // 2300h

/** 8 桁 3 次メッシュコード → 南西端の緯度経度 */
function meshToLatLon(code: string): { lat: number; lon: number } {
  const p1 = Number(code.slice(0, 2));
  const p2 = Number(code.slice(2, 4));
  const p3 = Number(code[4]);
  const p4 = Number(code[5]);
  const p5 = Number(code[6]);
  const p6 = Number(code[7]);
  const lat = p1 / 1.5 + p3 / (1.5 * 8) + p5 / (1.5 * 80);
  const lon = p2 + 100 + p4 / 8 + p6 / 80;
  return { lat, lon };
}

/** Web Mercator の正規化 Y (0=北極, 1=南極側)。lat は度。 */
function mercatorY(latDeg: number): number {
  const lat = (latDeg * Math.PI) / 180;
  return (1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2;
}

/** 日照値 (0.1h) → RGB。青灰(低)→黄(中)→橙赤(高) */
function colorFor(v: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, (v - COLOR_MIN) / (COLOR_MAX - COLOR_MIN)));
  // 3 ストップ: 0=(70,90,130) 0.5=(250,210,90) 1=(220,90,40)
  const stops: Array<[number, [number, number, number]]> = [
    [0, [70, 90, 130]],
    [0.5, [250, 210, 90]],
    [1, [220, 90, 40]],
  ];
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const f = (t - lo[0]) / (hi[0] - lo[0] || 1);
  return [
    Math.round(lo[1][0] + (hi[1][0] - lo[1][0]) * f),
    Math.round(lo[1][1] + (hi[1][1] - lo[1][1]) * f),
    Math.round(lo[1][2] + (hi[1][2] - lo[1][2]) * f),
  ];
}

async function main(): Promise<void> {
  if (!fs.existsSync(INPUT)) {
    throw new Error(`入力が見つかりません: ${INPUT} (fetch-g02-sunshine.cjs を先に実行)`);
  }
  const data = JSON.parse(fs.readFileSync(INPUT, "utf8")) as {
    meshes: Array<[string, number]>;
  };
  const meshes = data.meshes.filter((m) => m[1] !== NODATA && m[1] > 0);

  // 緯度経度の範囲を算出 (メッシュ南西端基準)
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const [code] of meshes) {
    const { lat, lon } = meshToLatLon(code);
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }
  // メッシュ 1 つ分の余白を北/東に足す
  maxLat += LAT_STEP;
  maxLon += LON_STEP;

  // Web Mercator 縦方向でラスター化 (緯度方向の歪みを補正)
  const mercTop = mercatorY(maxLat);
  const mercBottom = mercatorY(minLat);
  // 横は経度に線形。1px = 1 メッシュ相当の解像度になるよう width を決める
  const width = Math.round((maxLon - minLon) / LON_STEP);
  // 縦は Mercator 範囲を、横の度/px と同じ縮尺になるよう決める
  const lonPerPx = (maxLon - minLon) / width;
  // Mercator 1 単位あたりの「赤道での度」換算: 360 度 = Mercator 全幅 1 → 1 merc unit = 360 度幅
  const height = Math.round(((mercBottom - mercTop) * 360) / lonPerPx);

  console.log(`📐 raster ${width} x ${height} px`);
  console.log(`   bounds: lat ${minLat.toFixed(3)}〜${maxLat.toFixed(3)} / lon ${minLon.toFixed(3)}〜${maxLon.toFixed(3)}`);

  const buf = Buffer.alloc(width * height * 4, 0); // RGBA, 全透明初期化

  let painted = 0;
  for (const [code, v] of meshes) {
    const { lat, lon } = meshToLatLon(code);
    // メッシュ中心
    const cLat = lat + LAT_STEP / 2;
    const cLon = lon + LON_STEP / 2;
    const px = Math.floor((cLon - minLon) / lonPerPx);
    const my = mercatorY(cLat);
    const py = Math.floor(((my - mercTop) / (mercBottom - mercTop)) * height);
    if (px < 0 || px >= width || py < 0 || py >= height) continue;
    const [r, g, b] = colorFor(v);
    // メッシュは Mercator では複数 px に渡るので 2x2 で塗って隙間を埋める
    for (let dx = 0; dx <= 1; dx++) {
      for (let dy = 0; dy <= 1; dy++) {
        const x = px + dx, y = py + dy;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        const idx = (y * width + x) * 4;
        buf[idx] = r;
        buf[idx + 1] = g;
        buf[idx + 2] = b;
        buf[idx + 3] = 205; // やや透過
      }
    }
    painted++;
  }

  const png = await sharp(buf, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await saveToR2(RASTER_KEY, png, { contentType: "image/png" });

  const vals = meshes.map((m) => m[1]).sort((a, b) => a - b);
  const meta = {
    generatedAt: new Date().toISOString(),
    source: "国土数値情報 G02 平年値（気候）メッシュ 2022",
    meshCount: meshes.length,
    // ImageOverlay 用 bounds [[南,西],[北,東]]
    bounds: [
      [minLat, minLon],
      [maxLat, maxLon],
    ],
    valueRangeHours: {
      min: Math.round(vals[0] / 10),
      median: Math.round(vals[Math.floor(vals.length / 2)] / 10),
      max: Math.round(vals[vals.length - 1] / 10),
    },
    // 凡例 (色の基準。h 単位)
    legend: {
      lowHours: COLOR_MIN / 10,
      midHours: (COLOR_MIN + COLOR_MAX) / 2 / 10,
      highHours: COLOR_MAX / 10,
    },
  };
  await saveToR2(META_KEY, JSON.stringify(meta), {
    contentType: "application/json; charset=utf-8",
  });

  console.log(`✅ 完了`);
  console.log(`   raster.png: ${(png.length / 1024).toFixed(0)}KB (描画メッシュ ${painted.toLocaleString()})`);
  console.log(`   meta.json: bounds + 値域 ${meta.valueRangeHours.min}〜${meta.valueRangeHours.max}h`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
