/**
 * buzz-map ジオ計算
 *
 * TopoJSON（都道府県 = public/prefecture.topojson / 市区町村 = public/buzz-map/municipalities.topojson）
 * から「本土＋沖縄インセット」の SVG パス群をキャンバス実寸座標で計算する。
 *
 * - 本土は MAINLAND_BBOX（固定フレーム）に fitExtent → 小笠原・大東諸島等の外れ島は v1 では枠外（非描画扱い）
 * - 沖縄（47 / 47xxx）はインセット枠に別投影
 * - 16:9 は本土トリム（インセットなし・左寄せ）
 */

import { geoCentroid, geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

import { BUZZ_MAP_RATIOS, MAINLAND_BBOX, type BuzzMapRatio } from "./tokens";

export interface BuzzMapPathInfo {
  code: string;
  name: string;
  d: string;
}

/** 型C: 投影済みの描画点（キャンバス座標 + 凡例 rowKey） */
export interface BuzzMapProjectedPoint {
  x: number;
  y: number;
  key: string;
}

/** 型D: 投影済みの線（SVG path d + 年。年は line-timeline のフィルタ用） */
export interface BuzzMapProjectedLine {
  d: string;
  year: number | null;
}

export interface BuzzMapGeo {
  width: number;
  height: number;
  mainland: BuzzMapPathInfo[];
  /** 県境オーバーレイ（muni レベルのみ。stroke 専用） */
  prefBorders: BuzzMapPathInfo[] | null;
  inset: BuzzMapPathInfo[] | null;
  /** インセット枠の描画位置（キャンバス座標） */
  insetBox: { x: number; y: number; width: number; height: number } | null;
  /** 型C: 投影済み点（本土・沖縄インセット両方を含む） */
  points: BuzzMapProjectedPoint[] | null;
  /** 型D: 投影済み線（本土・沖縄インセット両方を含む） */
  lines: BuzzMapProjectedLine[] | null;
}

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** 比率×型ごとの地図フィット領域・インセット枠（キャンバス比率で定義） */
export function buzzMapLayout(ratio: BuzzMapRatio, type: "A" | "B" | "C" | "D" | "E") {
  const { width: W, height: H } = BUZZ_MAP_RATIOS[ratio];
  // 型B/D は右に年カウンター用の海域を空ける（時系列リールの年表示）
  const padRight = type === "B" || type === "D" ? 0.22 : 0.06;

  if (ratio === "169") {
    // 本土トリム: 左 62% に地図、右はタイトル外の余白と凡例
    return {
      W,
      H,
      region: { x0: 0.02 * W, y0: 0.12 * H, x1: 0.62 * W, y1: 0.9 * H } as Box,
      insetBox: null,
    };
  }

  const topPad = ratio === "916" ? 0.17 : 0.15;
  const botPad = ratio === "916" ? 0.16 : 0.14;
  return {
    W,
    H,
    region: {
      x0: 0.05 * W,
      y0: topPad * H,
      x1: (1 - padRight) * W,
      y1: (1 - botPad) * H,
    } as Box,
    // 沖縄インセットは本土が空ける左上の海域いっぱいに大きく取る
    // （2026-07-16 拡大: 30%×15% → 46%×32%。本家の地名プロット系レイアウト=左上海域を使い切る構成を参考。
    //   ラベルは枠内バッジ (BuzzMapCard)。大東諸島は fit から除外して弧を目一杯フィット）
    insetBox: {
      x: 0.05 * W,
      y: (topPad + 0.03) * H,
      width: 0.46 * W,
      height: ratio === "916" ? 0.2 * H : 0.32 * H,
    },
  };
}

function toFeatures(topology: Topology): Feature[] {
  const objectName = Object.keys(topology.objects)[0];
  if (!objectName) return [];
  const fc = feature(
    topology,
    topology.objects[objectName] as GeometryCollection
  ) as FeatureCollection;
  return fc.features;
}

function codeOf(f: Feature): string {
  const p = f.properties || {};
  return String(p.N03_007 ?? p.prefCode ?? p.code ?? "");
}

function nameOf(f: Feature): string {
  const p = f.properties || {};
  if (p.N03_004) {
    // 市区町村: 政令市の区は「札幌市中央区」、郡部は「石狩郡当別町」
    return `${p.N03_003 ?? ""}${p.N03_004}`;
  }
  return String(p.N03_001 ?? p.prefName ?? p.name ?? "");
}

function isOkinawa(code: string): boolean {
  return code === "47" || code.startsWith("47");
}

/**
 * 沖縄インセットの描画ドメイン（先島諸島〜沖縄本島の弧）。
 * 大東諸島（東に ~300km 離れた飛び地）を含めると fit が横に間延びして島が極小になるため
 * v1 では非描画（本土 bbox 外の小笠原と同じ扱い。正典: buzz-map-standards §3）
 */
function inInsetDomain(lon: number, lat: number): boolean {
  return lon >= 122 && lon <= 129.5 && lat >= 23.5 && lat <= 28.7;
}

/** 本土 bbox 内に重心があるか（小笠原・大東諸島等を落とす） */
function inMainland(f: Feature): boolean {
  const [lon, lat] = geoCentroid(f);
  return (
    lon >= MAINLAND_BBOX.west &&
    lon <= MAINLAND_BBOX.east &&
    lat >= MAINLAND_BBOX.south &&
    lat <= MAINLAND_BBOX.north
  );
}

function bboxPolygon(): Feature<Polygon> {
  const { west, east, south, north } = MAINLAND_BBOX;
  // d3-geo の球面ポリゴンは巻き方向で内外が決まる。逆巻きだと「箱の補集合＝ほぼ全球」に
  // フィットして日本が極小になるため、この順序（内部が箱側になる巻き）を変えないこと
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [west, south],
          [west, north],
          [east, north],
          [east, south],
          [west, south],
        ],
      ],
    },
  };
}

function fitAndRender(
  features: Feature[],
  fitTarget: Feature | FeatureCollection,
  box: Box
): BuzzMapPathInfo[] {
  const projection = geoMercator().fitExtent(
    [
      [box.x0, box.y0],
      [box.x1, box.y1],
    ],
    fitTarget as Feature
  );
  const pathGen = geoPath().projection(projection);
  return features
    .map((f) => ({ code: codeOf(f), name: nameOf(f), d: pathGen(f) || "" }))
    .filter((p) => p.d);
}

/**
 * spec.level（"pref" | "muni" | "muni:NN"）と比率から地図パス群を計算する。
 *
 * @param topology     - level に応じた TopoJSON（pref なら prefecture.topojson）
 * @param prefTopology - muni レベル時の県境オーバーレイ用（pref topojson）。不要なら null
 */
export function computeBuzzMapGeo(
  topology: Topology,
  prefTopology: Topology | null,
  opts: {
    level: string;
    ratio: BuzzMapRatio;
    type: "A" | "B" | "C" | "D" | "E";
    /** 型C: 凡例 rowKey → [lon, lat][] */
    points?: Record<string, [number, number][]>;
    /** 型D: 線フィーチャ（LineString/MultiLineString）と年属性名 */
    lineFeatures?: Feature[];
    lineYearProp?: string;
  }
): BuzzMapGeo {
  const { level, ratio, type } = opts;
  const { W, H, region, insetBox } = buzzMapLayout(ratio, type);
  const features = toFeatures(topology);

  // 県トリム（muni:NN）: その県だけに最適フィット。インセットなし
  const prefMatch = /^muni:(\d{2})$/.exec(level);
  if (prefMatch) {
    const prefCode = prefMatch[1];
    const target = features.filter((f) => codeOf(f).startsWith(prefCode));
    const fc: FeatureCollection = { type: "FeatureCollection", features: target };
    return {
      width: W,
      height: H,
      mainland: fitAndRender(target, fc, region),
      prefBorders: null,
      inset: null,
      insetBox: null,
      points: null,
      lines: null,
    };
  }

  const mainFeatures = features.filter((f) => !isOkinawa(codeOf(f)) && inMainland(f));
  const okinawaFeatures = features.filter((f) => {
    if (!isOkinawa(codeOf(f))) return false;
    const [lon, lat] = geoCentroid(f);
    return inInsetDomain(lon, lat);
  });

  const frame = bboxPolygon();
  const mainland = fitAndRender(mainFeatures, frame, region);

  // 県境オーバーレイ（muni のみ）
  let prefBorders: BuzzMapPathInfo[] | null = null;
  if (prefTopology) {
    const prefFeatures = toFeatures(prefTopology).filter(
      (f) => !isOkinawa(codeOf(f))
    );
    prefBorders = fitAndRender(prefFeatures, frame, region);
  }

  // 沖縄インセット（16:9 は本土トリムのため出さない）
  let inset: BuzzMapPathInfo[] | null = null;
  if (insetBox && okinawaFeatures.length > 0) {
    const fc: FeatureCollection = {
      type: "FeatureCollection",
      features: okinawaFeatures,
    };
    inset = fitAndRender(okinawaFeatures, fc, {
      x0: insetBox.x + 12,
      y0: insetBox.y + 12,
      x1: insetBox.x + insetBox.width - 12,
      y1: insetBox.y + insetBox.height - 12,
    });
  }

  // 型C 点 / 型D 線は本土・沖縄インセットの 2 投影を共用する
  let points: BuzzMapProjectedPoint[] | null = null;
  let lines: BuzzMapProjectedLine[] | null = null;
  if (opts.points || opts.lineFeatures) {
    const mainProj = geoMercator().fitExtent(
      [
        [region.x0, region.y0],
        [region.x1, region.y1],
      ],
      frame
    );
    let insetProj: ReturnType<typeof geoMercator> | null = null;
    if (insetBox && okinawaFeatures.length > 0) {
      const okiFc: FeatureCollection = {
        type: "FeatureCollection",
        features: okinawaFeatures,
      };
      insetProj = geoMercator().fitExtent(
        [
          [insetBox.x + 12, insetBox.y + 12],
          [insetBox.x + insetBox.width - 12, insetBox.y + insetBox.height - 12],
        ],
        okiFc
      );
    }
    const inMainland2 = (lon: number, lat: number) =>
      lon >= MAINLAND_BBOX.west &&
      lon <= MAINLAND_BBOX.east &&
      lat >= MAINLAND_BBOX.south &&
      lat <= MAINLAND_BBOX.north;

    // 型C: 点を振り分け投影（本土 bbox → main / インセットドメイン → inset / どちらでもない
    // 飛び地=大東・小笠原等は非描画。inset が無い比率=16:9 は本土投影で枠外に流す）
    if (opts.points) {
      points = [];
      for (const [key, coords] of Object.entries(opts.points)) {
        for (const [lon, lat] of coords) {
          let proj: ReturnType<typeof geoMercator> | null = null;
          if (inMainland2(lon, lat)) proj = mainProj;
          else if (inInsetDomain(lon, lat)) proj = insetProj ?? mainProj;
          if (!proj) continue;
          const xy = proj([lon, lat]);
          if (xy && Number.isFinite(xy[0]) && Number.isFinite(xy[1])) {
            points.push({ x: xy[0], y: xy[1], key });
          }
        }
      }
    }

    // 型D: 線を centroid で振り分け、geoPath で d を生成（振り分けは点と同じ 3 区分）
    if (opts.lineFeatures) {
      const mainPath = geoPath(mainProj);
      const insetPath = insetProj ? geoPath(insetProj) : null;
      lines = [];
      for (const f of opts.lineFeatures) {
        const c = geoCentroid(f);
        if (!c) continue;
        let pathGen: ReturnType<typeof geoPath> | null = null;
        if (inMainland2(c[0], c[1])) pathGen = mainPath;
        else if (inInsetDomain(c[0], c[1])) pathGen = insetPath ?? mainPath;
        if (!pathGen) continue;
        const d = pathGen(f);
        if (!d) continue;
        const raw = opts.lineYearProp ? Number(f.properties?.[opts.lineYearProp]) : NaN;
        lines.push({ d, year: Number.isFinite(raw) ? raw : null });
      }
    }
  }

  return {
    width: W,
    height: H,
    mainland,
    prefBorders,
    inset,
    insetBox: inset ? insetBox : null,
    points,
    lines,
  };
}
