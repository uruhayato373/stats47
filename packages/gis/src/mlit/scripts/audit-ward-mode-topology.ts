/**
 * 47 都道府県で「政令指定都市の見せ方 (WardMode) の地域」と「地図の形」が 1 対 1 に対応するかを検査する
 * (MUNI-DESIGNATED-CITY-WARDS-01)。
 *
 * 東京都の地図で 23 区が灰色になった不具合 (統合版の地図が 23 区を「特別区部」1 つにまとめていた) は、
 * 地域の集合と地図の形が別々に決まっていたことが原因だった。地域は `@stats47/area` の resolveWardModeAreas、
 * 地図は R2 の分割版から deriveWardModeTopology で作り、両者のコードの集合を突き合わせる。
 *
 *   npm run audit:ward-mode-topology --workspace=@stats47/gis          # 食い違いがあれば exit 1
 *
 * R2 は公開 URL (R2_PUBLIC_FETCH_URL、既定は SITE.r2PublicBaseUrl) から読むだけで書かない。
 * 県全体の行 (`<県>000`。N03 の「所属未定地」) は地域ではないので数えない。
 */
import { buildMunicipalityEntityPolicy, resolveWardModeAreas, type WardMode } from "@stats47/area";

import { buildMlitR2Path } from "../utils/mlit-r2-path";
import { deriveWardModeTopology } from "../utils/ward-mode-topology";

import { SITE, type TopoJSONTopology } from "@stats47/types";

const BASE_URL = process.env.R2_PUBLIC_FETCH_URL ?? SITE.r2PublicBaseUrl;
const MODES: readonly WardMode[] = ["merged", "split"];
/**
 * 地図に形はあるが統計の地域に無いもの (理由付きの固定の例外)。
 * 北方領土の 6 村 (色丹村・泊村・留夜別村・留別村・紗那村・蘂取村) は国土数値情報の行政区域にあるが、
 * e-Stat の市区町村の統計には無いので、地図では「データなし」の灰色で描く (2026-10-28 に 47 県で実測した食い違いはこれだけ)。
 */
const SHAPES_WITHOUT_STATISTICS: ReadonlySet<string> = new Set(["01695", "01696", "01697", "01698", "01699", "01700"]);

interface Mismatch {
  prefCode: string;
  mode: WardMode;
  /** 地域にあるのに地図に形が無い (灰色にもならず消える・または色が付かない) */
  missingShapes: string[];
  /** 地図に形があるのに地域に無い (値が来ないので灰色になる) */
  extraShapes: string[];
}

function shapeCodes(topology: TopoJSONTopology): Set<string> {
  const codes = new Set<string>();
  for (const collection of Object.values(topology.objects)) {
    for (const geometry of collection.geometries) {
      const code = String(geometry.properties?.N03_007 ?? "");
      if (/^\d{2}000$/.test(code) || code === "" || SHAPES_WITHOUT_STATISTICS.has(code)) continue;
      codes.add(code);
    }
  }
  return codes;
}

async function main(): Promise<void> {
  const policy = buildMunicipalityEntityPolicy();
  const prefectureOf = new Map(policy.entities.map((entity) => [entity.code, entity.prefectureCode]));
  const areas = Object.fromEntries(MODES.map((mode) => [mode, resolveWardModeAreas(policy, mode)]));
  const mismatches: Mismatch[] = [];

  for (let n = 1; n <= 47; n++) {
    const pref2 = String(n).padStart(2, "0");
    const url = `${BASE_URL}/${buildMlitR2Path({ type: "city", prefCode: pref2, wardMode: "split" })}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`分割版の地図を読めない: ${url} (${response.status})`);
    const split = (await response.json()) as TopoJSONTopology;

    for (const mode of MODES) {
      const { codes, mergeGroups } = areas[mode]!;
      const topology = mode === "merged" ? deriveWardModeTopology(split, mergeGroups) : split;
      const shapes = shapeCodes(topology);
      const expected = [...codes].filter((code) => prefectureOf.get(code)?.startsWith(pref2));
      const missingShapes = expected.filter((code) => !shapes.has(code)).sort();
      const extraShapes = [...shapes].filter((code) => !codes.has(code)).sort();
      if (missingShapes.length > 0 || extraShapes.length > 0) {
        mismatches.push({ prefCode: pref2, mode, missingShapes, extraShapes });
      }
    }
  }

  for (const m of mismatches) {
    console.log(
      `✗ ${m.prefCode} ${m.mode}: 地図に無い地域 ${m.missingShapes.join(",") || "-"} / 地域に無い形 ${m.extraShapes.join(",") || "-"}`
    );
  }
  if (mismatches.length > 0) {
    console.error(`✗ 地域と地図の形が食い違う 県×見せ方 が ${mismatches.length} 件`);
    process.exit(1);
  }
  console.log("✓ 47 都道府県 × merged / split で、地域と地図の形が 1 対 1 に対応している");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
