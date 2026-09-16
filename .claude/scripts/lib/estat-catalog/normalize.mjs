// e-Stat カタログの純粋関数群 (getStatsList / getMetaInfo 生レスポンス → 索引行)。
// ネットワーク・fs に触れない。テスト: .claude/scripts/lib/__tests__/estat-catalog.test.mjs
import { extractYearCode } from "../../../../packages/estat-api/src/stats-data/utils/extract-year-code.ts";

/** 都道府県 5 桁コード (01000〜47000)。estat-api.md の地域コード規約に準拠 */
export const PREFECTURE_CODES = Array.from({ length: 47 }, (_, i) =>
  String(i + 1).padStart(2, "0") + "000",
);
const PREFECTURE_CODE_SET = new Set(PREFECTURE_CODES);

/** 都道府県一致とみなす下限 (欠測県が数県あっても都道府県軸と判定する) */
const PREF_MATCH_THRESHOLD = 40;

export function pickString(node) {
  if (typeof node === "string") return node;
  if (node && typeof node === "object" && "$" in node) return String(node.$);
  return null;
}

export function pickCode(node) {
  if (node && typeof node === "object" && "@code" in node) return String(node["@code"]);
  return null;
}

export function asArray(x) {
  if (x === undefined || x === null) return [];
  return Array.isArray(x) ? x : [x];
}

/**
 * getStatsList の TABLE_INF 項目、または getMetaInfo の METADATA_INF.TABLE_INF を
 * 共通の表行に正規化する (両者はフィールド名が一致するため 1 関数で扱える)。
 */
export function normalizeTableRow(raw, fallbackCollectArea = null) {
  return {
    statsDataId: String(raw["@id"]),
    statCode: pickCode(raw.STAT_NAME),
    statName: pickString(raw.STAT_NAME) ?? "",
    title: pickString(raw.TITLE) ?? pickString(raw.STATISTICS_NAME) ?? "",
    govOrg: pickString(raw.GOV_ORG),
    cycle: pickString(raw.CYCLE) ?? raw.CYCLE ?? null,
    surveyDate: raw.SURVEY_DATE != null ? String(raw.SURVEY_DATE) : null,
    openDate: raw.OPEN_DATE ?? null,
    updatedDate: raw.UPDATED_DATE ?? null,
    collectArea: raw.COLLECT_AREA ?? fallbackCollectArea ?? null,
    mainCategory: raw.MAIN_CATEGORY
      ? { code: raw.MAIN_CATEGORY["@no"] ?? null, name: pickString(raw.MAIN_CATEGORY) }
      : null,
    subCategory: raw.SUB_CATEGORY
      ? { code: raw.SUB_CATEGORY["@no"] ?? null, name: pickString(raw.SUB_CATEGORY) }
      : null,
  };
}

/** @name の末尾から年次/年度/月次を推定する (e-Stat の time コードは体系が表ごとに異なるため名称で判定) */
export function classifyTimeKind(name) {
  if (!name) return "other";
  if (/年度$/.test(name)) return "fiscal-year";
  if (/年$/.test(name)) return "calendar-year";
  if (/月$/.test(name)) return "month";
  return "other";
}

function classObjs(metaInfoResponse) {
  const metadataInf = metaInfoResponse?.GET_META_INFO?.METADATA_INF ?? metaInfoResponse;
  return asArray(metadataInf?.CLASS_INF?.CLASS_OBJ);
}

/**
 * 1 テーブルの次元構造を要約する。
 * - dims: 全軸の {id,name,count,unit}
 * - years/timeKind: time 軸 (無ければ最有力候補) から抽出
 * - prefDim/has47Pref/areaKind/areaCount: 全軸を走査し都道府県軸を特定
 *   (area 以外の catNN に都道府県が入る表があるため、id="area" 固定にしない)
 */
export function summarizeMeta(metaInfoResponse) {
  const metadataInf = metaInfoResponse?.GET_META_INFO?.METADATA_INF ?? metaInfoResponse;
  const objs = classObjs(metaInfoResponse);

  const dims = objs.map((co) => {
    const values = asArray(co.CLASS);
    const unit = values.map((v) => v["@unit"]).find((u) => u != null) ?? null;
    return { id: co["@id"], name: co["@name"] ?? null, count: values.length, unit };
  });

  // time 軸
  let years = [];
  let timeKind = "other";
  const timeObj = objs.find((co) => co["@id"] === "time") ?? null;
  if (timeObj) {
    const values = asArray(timeObj.CLASS);
    const yearSet = new Set();
    const kindCounts = {};
    for (const v of values) {
      const code = v["@code"] != null ? String(v["@code"]) : null;
      if (code) yearSet.add(extractYearCode(code));
      const kind = classifyTimeKind(v["@name"]);
      kindCounts[kind] = (kindCounts[kind] ?? 0) + 1;
    }
    years = [...yearSet].filter(Boolean).sort();
    timeKind = Object.entries(kindCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "other";
  }

  // 都道府県軸の特定 (area 軸に限らず全軸を走査)
  let prefDim = null;
  let bestMatch = 0;
  let areaKind = "unknown";
  let areaCount = 0;
  for (const co of objs) {
    const values = asArray(co.CLASS);
    const codes = values.map((v) => (v["@code"] != null ? String(v["@code"]) : null));
    const match = codes.filter((c) => c && PREFECTURE_CODE_SET.has(c)).length;
    if (match > bestMatch) {
      bestMatch = match;
      prefDim = co["@id"];
      areaCount = values.length;
    }
  }
  const has47Pref = bestMatch >= PREF_MATCH_THRESHOLD;
  if (has47Pref) {
    areaKind = "prefecture";
  } else {
    const areaObj = objs.find((co) => co["@id"] === "area");
    if (areaObj) {
      const values = asArray(areaObj.CLASS);
      const codes = values.map((v) => (v["@code"] != null ? String(v["@code"]) : null)).filter(Boolean);
      const municipalityLike = codes.filter(
        (c) => /^\d{5}$/.test(c) && c !== "00000" && !PREFECTURE_CODE_SET.has(c),
      );
      if (municipalityLike.length > 0) {
        areaKind = "municipality";
        areaCount = values.length;
      } else if (codes.length > 0) {
        areaKind = "national";
        areaCount = values.length;
      }
      prefDim = prefDim ?? (areaObj["@id"] ?? null);
    } else {
      prefDim = null;
      areaCount = 0;
    }
  }

  return {
    tableRow: normalizeTableRow(metadataInf.TABLE_INF, metadataInf.TABLE_INF?.COLLECT_AREA ?? null),
    sourceUpdatedDate: metadataInf.TABLE_INF?.UPDATED_DATE ?? null,
    dims,
    years,
    timeKind,
    prefDim,
    has47Pref,
    areaKind,
    areaCount,
  };
}

/**
 * 分類行 (tab/cat01..catN) を抽出する。area/time は表行の要約に持つため除外する。
 */
export function classRows(metaInfoResponse, statsDataId) {
  const objs = classObjs(metaInfoResponse);
  const rows = [];
  for (const co of objs) {
    if (co["@id"] === "area" || co["@id"] === "time") continue;
    for (const v of asArray(co.CLASS)) {
      rows.push({
        statsDataId,
        dim: co["@id"],
        code: v["@code"] != null ? String(v["@code"]) : null,
        name: v["@name"] ?? null,
        unit: v["@unit"] ?? null,
        level: v["@level"] ?? null,
        parentCode: v["@parentCode"] ?? null,
      });
    }
  }
  return rows;
}
