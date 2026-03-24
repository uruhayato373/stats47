"use server";

export interface ManufacturingCompositionItem {
  name: string;
  value: number;
  color: string;
}

/**
 * 産業中分類コード → 表示名・色のマッピング
 */
const INDUSTRY_MAP: Record<string, { name: string; color: string }> = {
  "09": { name: "食料品", color: "#22c55e" },
  "10": { name: "飲料・たばこ", color: "#86efac" },
  "11": { name: "繊維", color: "#a78bfa" },
  "12": { name: "木材・木製品", color: "#92400e" },
  "13": { name: "家具・装備品", color: "#d97706" },
  "14": { name: "パルプ・紙", color: "#fbbf24" },
  "15": { name: "印刷", color: "#6b7280" },
  "16": { name: "化学", color: "#ef4444" },
  "17": { name: "石油・石炭", color: "#1e293b" },
  "18": { name: "プラスチック", color: "#06b6d4" },
  "19": { name: "ゴム", color: "#475569" },
  "20": { name: "皮革", color: "#78716c" },
  "21": { name: "窯業・土石", color: "#a3a3a3" },
  "22": { name: "鉄鋼", color: "#64748b" },
  "23": { name: "非鉄金属", color: "#94a3b8" },
  "24": { name: "金属製品", color: "#3b82f6" },
  "25": { name: "はん用機械", color: "#2563eb" },
  "26": { name: "生産用機械", color: "#1d4ed8" },
  "27": { name: "業務用機械", color: "#7c3aed" },
  "28": { name: "電子部品", color: "#8b5cf6" },
  "29": { name: "電気機械", color: "#a855f7" },
  "30": { name: "情報通信機械", color: "#c084fc" },
  "31": { name: "輸送用機械", color: "#f59e0b" },
  "32": { name: "その他", color: "#d4d4d4" },
};

/**
 * 経済センサス（0004012040）から都道府県の製造業産業構成（出荷額ベース）を取得
 *
 * cat01: 202104010050（製造品出荷額等）
 * cat02: 年×産業×地域の結合コード — name をパースして産業・地域を抽出
 */
export async function fetchManufacturingCompositionAction(
  prefCode: string,
): Promise<ManufacturingCompositionItem[] | null> {
  try {
    const prefNum = parseInt(prefCode, 10);
    if (isNaN(prefNum) || prefNum < 1 || prefNum > 47) return null;
    const prefStr = String(prefNum).padStart(2, "0");

    const appId = process.env.NEXT_PUBLIC_ESTAT_APP_ID;
    if (!appId) return null;

    const url = new URL("https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData");
    url.searchParams.set("appId", appId);
    url.searchParams.set("statsDataId", "0004012040");
    url.searchParams.set("cdCat01", "202104010050"); // 製造品出荷額等
    url.searchParams.set("metaGetFlg", "N");
    url.searchParams.set("cntGetFlg", "N");

    const res = await fetch(url.toString());
    const json = await res.json();

    const values = json.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE;
    if (!values || !Array.isArray(values)) return null;

    const items: ManufacturingCompositionItem[] = [];

    for (const v of values) {
      const cat02 = v["@cat02"];
      const val = parseFloat(v["$"]);
      if (isNaN(val) || val <= 0) continue;

      // cat02 の @name は getMetaInfo でしか取れないので、@code からパースする
      // コードの末尾パターンで地域と産業を特定するため、別方法を使う
      // → getMetaInfo を先にキャッシュする代わりに、全データをフェッチして
      //   CLASS_INF のマッピングを使う
      // 簡易的に: cat02 コードと VALUE の組を収集し、後で meta とマッチ
      items.push({ name: cat02, value: val, color: "" });
    }

    // メタ情報も取得して cat02 コード → name のマッピングを作成
    const metaUrl = new URL("https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo");
    metaUrl.searchParams.set("appId", appId);
    metaUrl.searchParams.set("statsDataId", "0004012040");

    const metaRes = await fetch(metaUrl.toString());
    const metaJson = await metaRes.json();
    const classObjs = metaJson.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ;
    const cat02Obj = classObjs?.find((o: { "@id": string }) => o["@id"] === "cat02");
    const cat02Classes = Array.isArray(cat02Obj?.CLASS) ? cat02Obj.CLASS : [];

    // コード → name のマップ
    const codeNameMap = new Map<string, string>();
    for (const c of cat02Classes) {
      codeNameMap.set(c["@code"], c["@name"]);
    }

    // name パターン: "2020000000_2020_XX_産業名_YY_都道府県名"
    // XX = 産業コード, YY = 都道府県コード
    const result: ManufacturingCompositionItem[] = [];

    for (const item of items) {
      const name = codeNameMap.get(item.name);
      if (!name) continue;

      const parts = name.split("_");
      // parts: ["2020000000", "2020", "XX", "産業名", "YY", "都道府県名"]
      if (parts.length < 6) continue;

      const industryCode = parts[2];
      const areaCode = parts[4];

      // 指定都道府県のみ
      if (areaCode !== prefStr) continue;
      // 製造業計（00）はスキップ
      if (industryCode === "00") continue;

      const industry = INDUSTRY_MAP[industryCode];
      if (!industry) continue;

      result.push({
        name: industry.name,
        value: item.value,
        color: industry.color,
      });
    }

    if (result.length === 0) return null;

    // 出荷額降順ソート、上位9産業 + その他
    result.sort((a, b) => b.value - a.value);

    if (result.length <= 10) return result;

    const top = result.slice(0, 9);
    const otherValue = result.slice(9).reduce((sum, i) => sum + i.value, 0);
    top.push({ name: "その他", value: otherValue, color: "#d4d4d4" });
    return top;
  } catch {
    return null;
  }
}
