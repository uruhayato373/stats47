/**
 * データ集の地図に使う都道府県境界 (e-Stat「令和 2 年国勢調査 町丁・字等別境界データ」を都道府県で結合したもの)。
 *
 * 2026-11-22 オーナー決定: 売る地図の境界は国土数値情報 (N03 系 `apps/remotion/public/prefecture.topojson`) をやめ、
 * e-Stat の境界へ替える。生成は `scripts/build-prefecture-boundary.mts`、置き場は `.local/data-packs/_boundary/`
 * (git 管理外・派生物。無ければ生成スクリプトを案内して止まる)。ここは出どころの記述と、生成物の検査 (純粋関数) だけを持つ。
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { SourceRow } from "../data/sources";

const here = dirname(fileURLToPath(import.meta.url)); // packages/product-factory/src/maps
const REPO_ROOT = resolve(here, "../../../..");

/** 境界の置き場 (登録済みの `.local/data-packs` 配下)。 */
export const PREFECTURE_BOUNDARY_DIR = resolve(REPO_ROOT, ".local/data-packs/_boundary");
export const PREFECTURE_BOUNDARY_FILE = "prefecture-r2census-2020.geojson";
export const PREFECTURE_BOUNDARY_META_FILE = "prefecture-r2census-2020.meta.json";
export const PREFECTURE_BOUNDARY_PATH = resolve(PREFECTURE_BOUNDARY_DIR, PREFECTURE_BOUNDARY_FILE);
export const PREFECTURE_BOUNDARY_META_PATH = resolve(PREFECTURE_BOUNDARY_DIR, PREFECTURE_BOUNDARY_META_FILE);

/** 境界から省く離島の面積 (km²)。生成スクリプトの既定値で、README にも書く。 */
export const PREFECTURE_BOUNDARY_MIN_ISLAND_KM2 = 1;

/** README・LICENSE-ja.txt に書く境界の出どころ。生成物の meta.json にも同じ事実を残す。 */
export const PREFECTURE_BOUNDARY_SOURCE = {
  surveyName: "令和2年国勢調査 町丁・字等別境界データ",
  provider: "総務省統計局 (政府統計の総合窓口 e-Stat・統計GIS)",
  dlserveyId: "A002005212020",
  catalogUrl: "https://www.e-stat.go.jp/gis",
  downloadUrlTemplate:
    "https://www.e-stat.go.jp/gis/statmap-search/data?dlserveyId=A002005212020&code=<都道府県コード2桁>&coordSys=1&format=shape&downloadType=5&datum=2011",
  datum: "世界測地系 (JGD2011)・経緯度",
  referenceDate: "2020-10-01",
  transform:
    `町丁・字等の形を都道府県コードで結合し (水面調査区は除く)、頂点を間引き、${PREFECTURE_BOUNDARY_MIN_ISLAND_KM2} km² 未満の離島を省いた`,
} as const;

export const PREFECTURE_BOUNDARY_NOTICE = `${PREFECTURE_BOUNDARY_SOURCE.provider}「${PREFECTURE_BOUNDARY_SOURCE.surveyName}」(${PREFECTURE_BOUNDARY_SOURCE.referenceDate} 時点) を加工して作成`;

/** 図の下部に書く短い境界の出典。 */
export const PREFECTURE_BOUNDARY_SHORT = `境界：e-Stat「${PREFECTURE_BOUNDARY_SOURCE.surveyName}」を加工`;

export type PrefectureBoundaryFeature = Feature<Polygon | MultiPolygon, { code: string; name: string }>;
export type PrefectureBoundary = FeatureCollection<Polygon | MultiPolygon, { code: string; name: string }>;

export function prefectureBoundaryExists(): boolean {
  return existsSync(PREFECTURE_BOUNDARY_PATH);
}

/** SOURCES.csv に足す、境界の 1 行。取得日は生成物の meta.json (ダウンロードした日・無ければ作成日) から読む。 */
export function prefectureBoundarySourceRow(): SourceRow {
  let retrievedAt = "不明";
  if (existsSync(PREFECTURE_BOUNDARY_META_PATH)) {
    const meta = JSON.parse(readFileSync(PREFECTURE_BOUNDARY_META_PATH, "utf8")) as {
      builtAt?: string;
      sourceFiles?: { zipFetchedOn?: string }[];
    };
    const fetched = (meta.sourceFiles ?? []).map((f) => f.zipFetchedOn).filter((d): d is string => typeof d === "string").sort();
    retrievedAt = fetched[fetched.length - 1] ?? meta.builtAt?.slice(0, 10) ?? "不明";
  }
  return {
    surveyName: PREFECTURE_BOUNDARY_SOURCE.surveyName,
    tableName: `境界データ（shapefile・都道府県ごと・調査の識別子 ${PREFECTURE_BOUNDARY_SOURCE.dlserveyId}）`,
    statsDataId: "-",
    url: PREFECTURE_BOUNDARY_SOURCE.catalogUrl,
    year: PREFECTURE_BOUNDARY_SOURCE.referenceDate.slice(0, 4),
    retrievedAt,
    unit: "-",
    transform: PREFECTURE_BOUNDARY_SOURCE.transform,
    notes: `地図（塗り分け地図の PowerPoint・SVG）の図形にだけ使った境界で、指標の値ではありません。${PREFECTURE_BOUNDARY_SOURCE.provider}の作成物を stats47 が加工しました。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。`,
    origin: "estat",
  };
}

/** 生成物の検査結果。problems が空なら合格。 */
export interface BoundaryCheck {
  readonly features: number;
  readonly polygons: number;
  readonly vertices: number;
  readonly problems: readonly string[];
}

const JAPAN_BBOX = { lonMin: 122, lonMax: 154.1, latMin: 20, latMax: 46 } as const;

function ringsOf(g: Polygon | MultiPolygon): number[][][] {
  return g.type === "Polygon" ? g.coordinates : g.coordinates.flat();
}

/**
 * 形の検査 (純粋関数): 47 件・県コードの集合・重複・空の形・閉じていない輪・非有限座標・範囲外。
 * 面積・人口・重なりの検査は mapshaper の出力が要るので生成スクリプト側にある。
 * @param expectedCodes 期待する 2 桁県コード (47 個)
 */
export function checkBoundaryShape(boundary: PrefectureBoundary, expectedCodes: readonly string[]): BoundaryCheck {
  const problems: string[] = [];
  const seen = new Map<string, number>();
  let polygons = 0;
  let vertices = 0;
  for (const f of boundary.features) {
    const code = f.properties?.code ?? "";
    seen.set(code, (seen.get(code) ?? 0) + 1);
    const g = f.geometry;
    if (!g || (g.type !== "Polygon" && g.type !== "MultiPolygon")) {
      problems.push(`${code}: 形が Polygon/MultiPolygon ではない`);
      continue;
    }
    polygons += g.type === "Polygon" ? 1 : g.coordinates.length;
    for (const ring of ringsOf(g)) {
      vertices += ring.length;
      if (ring.length < 4) problems.push(`${code}: 点が 4 つ未満の輪`);
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first && last && (first[0] !== last[0] || first[1] !== last[1])) problems.push(`${code}: 閉じていない輪`);
      for (const p of ring) {
        const [lon, lat] = p;
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
          problems.push(`${code}: 非有限の座標`);
          break;
        }
        if (lon < JAPAN_BBOX.lonMin || lon > JAPAN_BBOX.lonMax || lat < JAPAN_BBOX.latMin || lat > JAPAN_BBOX.latMax) {
          problems.push(`${code}: 日本の範囲外の座標 (${lon}, ${lat})`);
          break;
        }
      }
    }
  }
  for (const [code, n] of seen) if (n > 1) problems.push(`${code}: ${n} 件の重複`);
  const missing = expectedCodes.filter((c) => !seen.has(c));
  const extra = [...seen.keys()].filter((c) => !expectedCodes.includes(c));
  if (missing.length) problems.push(`欠けた県コード: ${missing.join(",")}`);
  if (extra.length) problems.push(`想定外の県コード: ${extra.join(",")}`);
  if (boundary.features.length !== expectedCodes.length) {
    problems.push(`形の数 ${boundary.features.length} ≠ ${expectedCodes.length}`);
  }
  return { features: boundary.features.length, polygons, vertices, problems };
}
