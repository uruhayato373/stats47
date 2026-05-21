/**
 * e-Stat 都道府県間人口移動フローを取得し、47 都道府県分の
 * 流入/流出マトリクスを public/migration-flow/{NN}.json に書き出す。
 *
 * データ源: e-Stat 統計表 0003423613
 *   「男女，移動前の住所地別都道府県間移動者数」(住民基本台帳人口移動報告)
 *   cat01 = 移動前の住所地 (= from 県)、area = 地域 (= to 県)
 *
 * 実行: tsx scripts/fetch-migration-flow.ts [year]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REMOTION_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(REMOTION_ROOT, "../..");
const OUT_DIR = resolve(REMOTION_ROOT, "public/migration-flow");

const STATS_DATA_ID = "0003423613";
const YEAR = Number(process.argv[2] ?? "2025");

/** 5 桁 e-Stat コード → 2 桁県コード ("28000" → "28") */
const to2 = (code: string) => code.slice(0, 2);
/** 47 都道府県の e-Stat コードか (01000〜47000) */
function isPrefCode(code: string): boolean {
  if (!/^\d{2}000$/.test(code)) return false;
  const n = Number(code.slice(0, 2));
  return n >= 1 && n <= 47;
}

function readAppId(): string {
  const envPath = resolve(REPO_ROOT, ".env.local");
  const line = readFileSync(envPath, "utf8")
    .split("\n")
    .find((l) => l.startsWith("NEXT_PUBLIC_ESTAT_APP_ID="));
  const id = line?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
  if (!id) throw new Error("NEXT_PUBLIC_ESTAT_APP_ID が .env.local に見つかりません");
  return id;
}

interface EstatValue {
  "@cat01": string;
  "@area": string;
  "@time": string;
  $: string;
}

async function main() {
  const appId = readAppId();
  const url =
    `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData` +
    `?appId=${appId}&statsDataId=${STATS_DATA_ID}` +
    `&cdCat02=0` + // 性別=総数
    `&cdTimeFrom=${YEAR}000101&cdTimeTo=${YEAR}001212` +
    `&limit=100000`;

  console.log(`[fetch] e-Stat ${STATS_DATA_ID} ${YEAR}年 ...`);
  const res = await fetch(url);
  const json = (await res.json()) as Record<string, unknown>;
  const stat = (json.GET_STATS_DATA as Record<string, unknown> | undefined)
    ?.STATISTICAL_DATA as Record<string, unknown> | undefined;
  if (!stat) {
    throw new Error(`e-Stat 応答が不正: ${JSON.stringify(json).slice(0, 300)}`);
  }

  // 県名マップ (cat01 クラスから取得)
  const classObjs = (
    (stat.CLASS_INF as Record<string, unknown>).CLASS_OBJ as Array<
      Record<string, unknown>
    >
  );
  const nameByCode = new Map<string, string>();
  for (const cls of classObjs) {
    if (cls["@id"] !== "cat01") continue;
    const items = Array.isArray(cls.CLASS) ? cls.CLASS : [cls.CLASS];
    for (const it of items as Array<Record<string, string>>) {
      if (isPrefCode(it["@code"])) {
        nameByCode.set(to2(it["@code"]), it["@name"]);
      }
    }
  }

  const values = (stat.DATA_INF as Record<string, unknown>).VALUE as EstatValue[];
  console.log(`[fetch] VALUE 件数: ${values.length}`);

  // matrix[from2][to2] = 年間合計移動者数
  const matrix = new Map<string, Map<string, number>>();
  for (const v of values) {
    const from = v["@cat01"];
    const to = v["@area"];
    if (!isPrefCode(from) || !isPrefCode(to)) continue;
    const f2 = to2(from);
    const t2 = to2(to);
    if (f2 === t2) continue; // 県間移動のみ (同一県は対象外)
    const n = Number(v.$);
    if (!Number.isFinite(n)) continue;
    if (!matrix.has(f2)) matrix.set(f2, new Map());
    const row = matrix.get(f2)!;
    row.set(t2, (row.get(t2) ?? 0) + n);
  }

  const allCodes = Array.from({ length: 47 }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );

  mkdirSync(OUT_DIR, { recursive: true });

  for (const focus of allCodes) {
    const partners = allCodes
      .filter((c) => c !== focus)
      .map((code) => {
        const inflow = matrix.get(code)?.get(focus) ?? 0; // partner → focus
        const outflow = matrix.get(focus)?.get(code) ?? 0; // focus → partner
        return {
          code,
          name: nameByCode.get(code) ?? code,
          inflow,
          outflow,
          net: inflow - outflow,
        };
      });

    const totalInflow = partners.reduce((s, p) => s + p.inflow, 0);
    const totalOutflow = partners.reduce((s, p) => s + p.outflow, 0);

    const payload = {
      focusCode: focus,
      focusName: nameByCode.get(focus) ?? focus,
      year: YEAR,
      source: `e-Stat 住民基本台帳人口移動報告 (統計表 ${STATS_DATA_ID})`,
      partners,
      totals: {
        inflow: totalInflow,
        outflow: totalOutflow,
        net: totalInflow - totalOutflow,
      },
    };
    writeFileSync(
      resolve(OUT_DIR, `${focus}.json`),
      JSON.stringify(payload, null, 0),
    );
  }

  console.log(`[done] ${allCodes.length} 県分を ${OUT_DIR} に出力`);
  // 兵庫(28) を検証出力
  const hyogo = JSON.parse(readFileSync(resolve(OUT_DIR, "28.json"), "utf8")) as {
    totals: { inflow: number; outflow: number; net: number };
    partners: Array<{ name: string; inflow: number; outflow: number; net: number }>;
  };
  const top = [...hyogo.partners].sort((a, b) => b.inflow - a.inflow).slice(0, 5);
  console.log(
    `[verify] 兵庫県 2025: 流入計 ${hyogo.totals.inflow} / 流出計 ${hyogo.totals.outflow} / 純 ${hyogo.totals.net}`,
  );
  console.log("[verify] 流入 Top5:");
  for (const p of top) {
    console.log(`  ${p.name}: 流入 ${p.inflow} / 流出 ${p.outflow} / 純 ${p.net}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
