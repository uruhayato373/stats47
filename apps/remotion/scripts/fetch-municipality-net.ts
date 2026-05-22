/**
 * e-Stat から市区町村別の転入超過数（純移動）を取得し、47 都道府県ごとに
 * public/migration-flow/municipalities/{NN}.json へ書き出す。
 * あわせて市区町村境界 topojson を public/migration-flow/city-topo/{NN}.topojson
 * にコピーする（焦点県を市区町村粒度で描くため）。
 *
 * データ源: e-Stat 0003419945
 *   「年齢（５歳階級），男女別 他市区町村からの転入者数・転出者数・転入超過数
 *    － 全国，都道府県，市区町村」
 *
 * 実行: tsx scripts/fetch-municipality-net.ts [year]
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REMOTION_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(REMOTION_ROOT, "../..");
const OUT_DIR = resolve(REMOTION_ROOT, "public/migration-flow/municipalities");
const TOPO_OUT_DIR = resolve(REMOTION_ROOT, "public/migration-flow/city-topo");
const CITY_TOPO_SRC = resolve(REPO_ROOT, ".local/r2/gis/mlit/20240101");

const STATS_DATA_ID = "0003419945";
const YEAR = Number(process.argv[2] ?? "2025");

function readAppId(): string {
  const line = readFileSync(resolve(REPO_ROOT, ".env.local"), "utf8")
    .split("\n")
    .find((l) => l.startsWith("NEXT_PUBLIC_ESTAT_APP_ID="));
  const id = line?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
  if (!id) throw new Error("NEXT_PUBLIC_ESTAT_APP_ID が見つかりません");
  return id;
}

/** 市区町村コード（5 桁・末尾 000 でない・県コード 01-47） */
function isMunicipalityCode(code: string): boolean {
  if (!/^\d{5}$/.test(code)) return false;
  if (code.endsWith("000")) return false; // 都道府県・全国
  const n = Number(code.slice(0, 2));
  return n >= 1 && n <= 47;
}

interface EstatValue {
  "@tab": string;
  "@area": string;
  "@time": string;
  $: string;
}

async function main() {
  const appId = readAppId();
  const url =
    `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData` +
    `?appId=${appId}&statsDataId=${STATS_DATA_ID}` +
    `&cdCat01=000` + // 年齢=総数
    `&cdCat02=0` + // 性別=総数
    `&cdCat03=60000` + // 国籍=移動者
    `&limit=100000`;

  console.log(`[fetch] e-Stat ${STATS_DATA_ID} 市区町村別 ...`);
  const res = await fetch(url);
  const json = (await res.json()) as Record<string, unknown>;
  const stat = (json.GET_STATS_DATA as Record<string, unknown> | undefined)
    ?.STATISTICAL_DATA as Record<string, unknown> | undefined;
  if (!stat) throw new Error(`e-Stat 応答不正: ${JSON.stringify(json).slice(0, 300)}`);

  // area 名称マップ + 時間コード解決
  const classObjs = (stat.CLASS_INF as Record<string, unknown>)
    .CLASS_OBJ as Array<Record<string, unknown>>;
  const nameByCode = new Map<string, string>();
  let timeCode = "";
  for (const cls of classObjs) {
    const items = Array.isArray(cls.CLASS) ? cls.CLASS : [cls.CLASS];
    if (cls["@id"] === "area") {
      for (const it of items as Array<Record<string, string>>) {
        nameByCode.set(it["@code"], it["@name"]);
      }
    }
    if (cls["@id"] === "time") {
      for (const it of items as Array<Record<string, string>>) {
        if (it["@name"] === `${YEAR}年`) timeCode = it["@code"];
      }
    }
  }
  if (!timeCode) throw new Error(`${YEAR}年 の time コードが見つかりません`);

  const values = (stat.DATA_INF as Record<string, unknown>).VALUE as EstatValue[];
  console.log(`[fetch] VALUE 件数: ${values.length} / 対象年コード ${timeCode}`);

  // muni[code] = { inflow, outflow, net }
  const muni = new Map<
    string,
    { inflow: number; outflow: number; net: number }
  >();
  for (const v of values) {
    if (v["@time"] !== timeCode) continue;
    const area = v["@area"];
    if (!isMunicipalityCode(area)) continue;
    const n = Number(v.$);
    if (!Number.isFinite(n)) continue;
    const m = muni.get(area) ?? { inflow: 0, outflow: 0, net: 0 };
    if (v["@tab"] === "21") m.inflow = n; // 転入者数
    else if (v["@tab"] === "22") m.outflow = n; // 転出者数
    else if (v["@tab"] === "04") m.net = n; // 転入超過数
    muni.set(area, m);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(TOPO_OUT_DIR, { recursive: true });

  let written = 0;
  for (let pref = 1; pref <= 47; pref++) {
    const pp = String(pref).padStart(2, "0");
    const municipalities = [...muni.entries()]
      .filter(([code]) => code.startsWith(pp))
      .map(([code, m]) => ({
        code,
        name: nameByCode.get(code) ?? code,
        inflow: m.inflow,
        outflow: m.outflow,
        net: m.net,
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
    if (municipalities.length === 0) continue;
    writeFileSync(
      resolve(OUT_DIR, `${pp}.json`),
      JSON.stringify({ prefCode: pp, year: YEAR, municipalities }, null, 0),
    );
    written++;

    // 市区町村境界 topojson をコピー
    const src = resolve(CITY_TOPO_SRC, pp, `${pp}_city_dc.topojson`);
    if (existsSync(src)) {
      copyFileSync(src, resolve(TOPO_OUT_DIR, `${pp}.topojson`));
    } else {
      console.warn(`[warn] city topojson 不在: ${src}`);
    }
  }

  console.log(`[done] ${written} 県分の市区町村データ + topojson を出力`);
  // 兵庫(28) 検証
  const hyogo = JSON.parse(
    readFileSync(resolve(OUT_DIR, "28.json"), "utf8"),
  ) as { municipalities: Array<{ name: string; net: number }> };
  const sorted = [...hyogo.municipalities].sort((a, b) => a.net - b.net);
  console.log(`[verify] 兵庫県 ${hyogo.municipalities.length} 市区町村`);
  console.log("  転出超過 ワースト3:", sorted.slice(0, 3).map((m) => `${m.name}(${m.net})`).join(" / "));
  console.log("  転入超過 ベスト3:", sorted.slice(-3).reverse().map((m) => `${m.name}(+${m.net})`).join(" / "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
