"use server";

import { unstable_cache } from "next/cache";

const API_KEY = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
const BASE_URL = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData";
const META_URL = "https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo";
const STATS_DATA_ID = "0003130691"; // 甲種港湾 品種別都道府県別表

/** 品種コードのメタ情報 */
export interface CommodityMeta {
  code: string;
  name: string;
  level: number;
  parentCode: string | null;
}

/** 品種別貨物データ */
export interface CommodityDataPoint {
  commodityCode: string;
  commodityName: string;
  level: number;
  parentCode: string | null;
  direction: "export" | "import" | "coastalOut" | "coastalIn";
  value: number;
}

/** 階層データノード（TreemapChart / SunburstChart 用） */
export interface HierarchyNode {
  name: string;
  value?: number;
  children?: HierarchyNode[];
}

const DIRECTION_MAP: Record<string, CommodityDataPoint["direction"]> = {
  "110": "export",
  "120": "import",
  "130": "coastalOut",
  "140": "coastalIn",
};

const DIRECTION_LABELS: Record<string, string> = {
  "110": "輸出",
  "120": "輸入",
  "130": "移出",
  "140": "移入",
};

/** 品種メタデータをキャッシュ付きで取得 */
const fetchCommodityMeta = unstable_cache(
  async (): Promise<CommodityMeta[]> => {
    const url = `${META_URL}?appId=${API_KEY}&statsDataId=${STATS_DATA_ID}&lang=J`;
    const res = await fetch(url);
    const json = await res.json();
    const classObjs = json.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ;
    const cat01 = classObjs?.find((c: any) => c["@id"] === "cat01");
    const items: any[] = Array.isArray(cat01?.CLASS)
      ? cat01.CLASS
      : [cat01?.CLASS];

    return items
      .filter((it: any) => it["@code"] !== "00001") // 「計」を除外
      .map((it: any) => ({
        code: it["@code"],
        name: it["@name"],
        level: Number(it["@level"]),
        parentCode: it["@parentCode"] ?? null,
      }));
  },
  ["commodity-meta"],
  { revalidate: 86400 * 30 }
);

/**
 * 都道府県の品種別貨物データを取得
 * @param areaCode 5桁の都道府県コード（例: "23000"）
 * @param year 年度（例: "2023"）
 */
export async function fetchCommodityDataAction(
  areaCode: string,
  year: string
): Promise<{
  data: CommodityDataPoint[];
  hierarchy: Record<string, HierarchyNode>;
}> {
  const [meta, rawData] = await Promise.all([
    fetchCommodityMeta(),
    fetchCommodityRaw(areaCode, year),
  ]);

  const metaMap = new Map(meta.map((m) => [m.code, m]));

  // フラットデータに変換
  const data: CommodityDataPoint[] = [];
  for (const row of rawData) {
    const commodityCode = row["@cat01"];
    const dirCode = row["@cat02"];
    const val = parseFloat(row["$"]);
    if (isNaN(val) || val <= 0) continue;
    if (commodityCode === "00001") continue; // 合計をスキップ

    const m = metaMap.get(commodityCode);
    if (!m) continue;

    const direction = DIRECTION_MAP[dirCode];
    if (!direction) continue;

    data.push({
      commodityCode,
      commodityName: m.name,
      level: m.level,
      parentCode: m.parentCode,
      direction,
      value: val,
    });
  }

  // 方向別に階層データを構築
  const hierarchy: Record<string, HierarchyNode> = {};
  for (const dirCode of ["110", "120", "130", "140"]) {
    const dir = DIRECTION_MAP[dirCode]!;
    const label = DIRECTION_LABELS[dirCode]!;
    const dirData = data.filter((d) => d.direction === dir);
    hierarchy[dir] = buildHierarchy(dirData, meta, label);
  }

  // 全方向合計の階層も作成
  const allData = data.reduce((acc, d) => {
    const existing = acc.find(
      (a) => a.commodityCode === d.commodityCode && a.level === d.level
    );
    if (existing) {
      existing.value += d.value;
    } else {
      acc.push({ ...d, direction: "export" }); // direction はダミー
    }
    return acc;
  }, [] as CommodityDataPoint[]);
  hierarchy["total"] = buildHierarchy(allData, meta, "合計");

  return { data, hierarchy };
}

function buildHierarchy(
  data: CommodityDataPoint[],
  meta: CommodityMeta[],
  rootLabel: string
): HierarchyNode {
  // Level 3（中分類）のデータを Level 2（大分類）でグループ化
  const level2Map = new Map<string, HierarchyNode>();

  for (const m of meta.filter((m) => m.level === 2)) {
    level2Map.set(m.code, { name: m.name, children: [] });
  }

  for (const d of data) {
    if (d.level === 3 && d.parentCode) {
      const parent = level2Map.get(d.parentCode);
      if (parent) {
        parent.children!.push({ name: d.commodityName, value: d.value });
      }
    } else if (d.level === 2) {
      // Level 2 しかない場合（分類不能のもの等）
      const existing = level2Map.get(d.commodityCode);
      if (existing && existing.children!.length === 0) {
        existing.value = d.value;
        delete existing.children;
      }
    }
  }

  // 空のカテゴリを除外
  const children = Array.from(level2Map.values()).filter(
    (n) => n.value !== undefined || (n.children && n.children.length > 0)
  );

  return { name: rootLabel, children };
}

async function fetchCommodityRaw(
  areaCode: string,
  year: string
): Promise<any[]> {
  const params = new URLSearchParams({
    appId: API_KEY!,
    statsDataId: STATS_DATA_ID,
    lang: "J",
    metaGetFlg: "N",
    cntGetFlg: "N",
    cdTime: `${year}000000`,
    cdArea: areaCode,
  });
  const res = await fetch(`${BASE_URL}?${params}`);
  const json = await res.json();
  const status = json.GET_STATS_DATA?.RESULT?.STATUS;
  if (status !== 0) return [];
  const values = json.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE;
  return Array.isArray(values) ? values : values ? [values] : [];
}
