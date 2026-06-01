/**
 * 通勤フロー O-D 取り込み (DBレス・自己完結)。
 *
 * e-Stat「従業地・通学地集計」(statsDataId 0003454526, 国勢調査2020) から
 * 常住地都道府県 × 従業地都道府県 の通勤者数 O-D を取得し、47県分の per-prefecture JSON
 * (移動フローと同 schema) を `apps/web/public/commute-flow/{NN}.json` に出力する。
 *
 * 次元コードは未検証のため CLASS_INF を名称から自動検出する (ログ出力)。
 *
 * 実行 (CI、要 NEXT_PUBLIC_ESTAT_APP_ID):
 *   npx tsx packages/data-configs/scripts/ingest-commute-flow.ts --dry-run   # 検出のみ
 *   npx tsx packages/data-configs/scripts/ingest-commute-flow.ts             # JSON 出力
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const STATS_DATA_ID = "0003454526";
const REPO_ROOT = resolve(__dirname, "../../..");
// R2 SSOT: ローカル R2 FS tier に出力 → diff-push-r2 --prefix app/commute-flow で R2 反映
const OUT_DIR = resolve(REPO_ROOT, ".local/r2/app/commute-flow");
const DRY_RUN = process.argv.includes("--dry-run");

interface ClassItem {
  "@code": string;
  "@name": string;
  "@level"?: string;
  "@unit"?: string;
}
interface ClassObj {
  "@id": string;
  "@name": string;
  CLASS: ClassItem | ClassItem[];
}
type EstatRow = Record<string, string>; // @tab/@cat0N/@area/@time/$ など

interface EstatResponse {
  GET_STATS_DATA?: {
    STATISTICAL_DATA?: {
      CLASS_INF: { CLASS_OBJ: ClassObj | ClassObj[] };
      DATA_INF?: { VALUE?: EstatRow[] };
    };
    RESULT?: { ERROR_MSG?: string };
  };
}

function asArray<T>(x: T | T[]): T[] {
  return Array.isArray(x) ? x : [x];
}

// ---- 県マスタ (5桁 → 名称) ----
function loadPrefNames(): Map<string, string> {
  const raw = JSON.parse(
    readFileSync(resolve(REPO_ROOT, "packages/area/src/data/prefectures.json"), "utf8"),
  ) as Array<{ prefCode: string; prefName: string }>;
  return new Map(raw.map((p) => [p.prefCode, p.prefName]));
}

function isPref5(code: string): boolean {
  if (!/^\d{2}000$/.test(code)) return false;
  const n = Number(code.slice(0, 2));
  return n >= 1 && n <= 47;
}

async function fetchStatsData(appId: string): Promise<{
  classObjs: ClassObj[];
  values: EstatRow[];
}> {
  const params = new URLSearchParams({
    appId,
    statsDataId: STATS_DATA_ID,
    limit: "100000", // e-Stat getStatsData の上限
  });
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`e-Stat HTTP ${res.status}`);
  const json = (await res.json()) as EstatResponse;
  const sd = json.GET_STATS_DATA?.STATISTICAL_DATA;
  if (!sd) {
    const msg = json.GET_STATS_DATA?.RESULT?.ERROR_MSG ?? "no STATISTICAL_DATA";
    throw new Error(`e-Stat response invalid: ${msg}`);
  }
  const classObjs = asArray(sd.CLASS_INF.CLASS_OBJ);
  const values = sd.DATA_INF?.VALUE ?? [];
  return { classObjs, values };
}

interface DimResolution {
  originDimKey: string; // VALUE のキー (@area など)
  partnerDimKey: string; // VALUE のキー (@cat01 など)
  commuteDimKey: string | null;
  commuteCode: string | null; // 通勤者 の code
  sexDimKey: string | null;
  sexCode: string | null; // 総数 の code
  tabDimKey: string | null;
}

/** CLASS_INF を名称から解析し、各次元の役割とフィルタ code を自動検出 */
function resolveDimensions(classObjs: ClassObj[]): DimResolution {
  // @id → { name, items, prefLike }
  const dims = classObjs.map((c) => {
    const items = asArray(c.CLASS);
    const prefCount = items.filter((i) => isPref5(i["@code"])).length;
    return {
      key: `@${c["@id"]}`,
      id: c["@id"],
      name: c["@name"] ?? "",
      items,
      prefLike: prefCount >= 40, // 47 県が入っている次元
    };
  });

  const prefDims = dims.filter((d) => d.prefLike);
  // origin = 常住地, partner = 従業/通学地。名称で判定。
  const origin =
    prefDims.find((d) => /常住地|現住地/.test(d.name)) ??
    prefDims.find((d) => d.id === "area") ??
    prefDims[0];
  const partner =
    prefDims.find((d) => /従業|通学地/.test(d.name) && d !== origin) ??
    prefDims.find((d) => d !== origin);

  const commuteDim = dims.find((d) => /通勤|通学/.test(d.name) && !d.prefLike);
  const commuteItem = commuteDim?.items.find((i) => /通勤/.test(i["@name"]) && !/通学/.test(i["@name"]));

  const sexDim = dims.find((d) => /男女|性別/.test(d.name));
  const sexItem =
    sexDim?.items.find((i) => /総数/.test(i["@name"])) ??
    sexDim?.items.find((i) => i["@code"] === "0");

  const tabDim = dims.find((d) => d.id === "tab");

  if (!origin || !partner) {
    throw new Error("origin/partner 県次元を検出できません (CLASS_INF を確認)");
  }
  return {
    originDimKey: origin.key,
    partnerDimKey: partner.key,
    commuteDimKey: commuteDim?.key ?? null,
    commuteCode: commuteItem?.["@code"] ?? null,
    sexDimKey: sexDim?.key ?? null,
    sexCode: sexItem?.["@code"] ?? null,
    tabDimKey: tabDim?.key ?? null,
  };
}

function logResolution(classObjs: ClassObj[], r: DimResolution): void {
  console.log("=== CLASS_INF 次元 ===");
  for (const c of classObjs) {
    const items = asArray(c.CLASS);
    const sample = items.slice(0, 4).map((i) => `${i["@code"]}:${i["@name"]}`).join(" / ");
    console.log(`  @${c["@id"]} "${c["@name"]}" (${items.length}件) 例: ${sample}`);
  }
  console.log("=== 自動検出 ===");
  console.log(`  origin(常住地)   = ${r.originDimKey}`);
  console.log(`  partner(従業地)  = ${r.partnerDimKey}`);
  console.log(`  commute filter   = ${r.commuteDimKey} == ${r.commuteCode} (通勤者)`);
  console.log(`  sex filter       = ${r.sexDimKey} == ${r.sexCode} (総数)`);
}

interface FocusFile {
  focusCode: string;
  focusName: string;
  year: number;
  source: string;
  partners: { code: string; name: string; inflow: number; outflow: number; net: number }[];
  totals: { inflow: number; outflow: number; net: number };
}

async function main(): Promise<void> {
  const appId = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
  if (!appId) throw new Error("NEXT_PUBLIC_ESTAT_APP_ID 未設定 (CI で実行してください)");

  console.log(`fetching e-Stat ${STATS_DATA_ID} …`);
  const { classObjs, values } = await fetchStatsData(appId);
  console.log(`  VALUE rows: ${values.length}`);
  const r = resolveDimensions(classObjs);
  logResolution(classObjs, r);

  // フィルタ: 通勤者 × 男女総数
  const filtered = values.filter((v) => {
    if (r.commuteDimKey && r.commuteCode && v[r.commuteDimKey] !== r.commuteCode) return false;
    if (r.sexDimKey && r.sexCode && v[r.sexDimKey] !== r.sexCode) return false;
    const o = v[r.originDimKey];
    const p = v[r.partnerDimKey];
    return isPref5(o) && isPref5(p) && o !== p; // 県内通勤(自県)は除外
  });
  console.log(`  filtered O-D rows (県間・通勤・総数): ${filtered.length}`);

  // od[origin][partner] = 通勤者数 (origin 常住 → partner 従業)
  const od = new Map<string, Map<string, number>>();
  let year = 2020;
  for (const v of filtered) {
    const o = v[r.originDimKey];
    const p = v[r.partnerDimKey];
    const val = Number(v["$"]);
    if (!Number.isFinite(val)) continue;
    if (v["@time"]) year = Number(String(v["@time"]).slice(0, 4)) || year;
    if (!od.has(o)) od.set(o, new Map());
    od.get(o)!.set(p, val);
  }

  if (DRY_RUN) {
    const tokyoIn = [...od.entries()]
      .map(([o, m]) => ({ o, v: m.get("13000") ?? 0 }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v)
      .slice(0, 5);
    console.log("=== dry-run sample: 東京(13000)へ通勤してくる上位5 ===");
    for (const t of tokyoIn) console.log(`  ${t.o} → 東京: ${t.v.toLocaleString()}人`);
    console.log(`(year=${year}) dry-run: JSON は書き出しません`);
    return;
  }

  const prefNames = loadPrefNames();
  mkdirSync(OUT_DIR, { recursive: true });
  let written = 0;
  for (let i = 1; i <= 47; i++) {
    const code = String(i).padStart(2, "0");
    const area = `${code}000`;
    const partners: FocusFile["partners"] = [];
    for (let j = 1; j <= 47; j++) {
      if (j === i) continue;
      const pCode = String(j).padStart(2, "0");
      const pArea = `${pCode}000`;
      const inflow = od.get(pArea)?.get(area) ?? 0; // partner常住 → focus従業
      const outflow = od.get(area)?.get(pArea) ?? 0; // focus常住 → partner従業
      if (inflow === 0 && outflow === 0) continue;
      partners.push({ code: pCode, name: prefNames.get(pArea) ?? "", inflow, outflow, net: inflow - outflow });
    }
    const ti = partners.reduce((s, p) => s + p.inflow, 0);
    const to = partners.reduce((s, p) => s + p.outflow, 0);
    const payload: FocusFile = {
      focusCode: code,
      focusName: prefNames.get(area) ?? area,
      year,
      source: `e-Stat 国勢調査${year} 従業地・通学地集計 (統計表 ${STATS_DATA_ID})`,
      partners: partners.sort((a, b) => b.inflow - a.inflow),
      totals: { inflow: ti, outflow: to, net: ti - to },
    };
    writeFileSync(resolve(OUT_DIR, `${code}.json`), JSON.stringify(payload));
    written++;
  }
  console.log(`✅ wrote ${written} files to ${OUT_DIR} (year=${year})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
