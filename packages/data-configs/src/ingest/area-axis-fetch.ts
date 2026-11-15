import { assertLiveEstatAllowed } from "../../scripts/lib/estat-table-reader.js";
import { hasExpectedCoverage, resolveAreaAxis, surveyYearFromDate, type AreaAxisMember } from "../area-axis.js";
import type { SourceConfig } from "../types.js";
import { readAppId } from "./batch-context.js";
import { fetchEstatData, type EstatAxisName, type EstatFetchResult, type EstatValue } from "./estat-fetch.js";
import { ESTAT_API, ESTAT_ENDPOINTS } from "../../../estat-api/src/ingest";


/**
 * getMetaInfo で分類軸のメンバー一覧と調査年を取る (areaAxis 用)。
 *
 * 調査年も一緒に返すのは、都道府県を cat 軸に持つ表が **time 軸を持たない**ため
 * (応答の値に `@time` が付かない)。年は `TABLE_INF.SURVEY_DATE` から採る。
 */
export async function fetchAxisMembers(
  appId: string,
  statsDataId: string,
  axis: EstatAxisName,
): Promise<{ members: AreaAxisMember[]; surveyYear: string | null; hasTimeAxis: boolean }> {
  assertLiveEstatAllowed(statsDataId);
  const params = new URLSearchParams({ appId: appId || readAppId(), lang: "J", statsDataId });
  const res = await fetch(`${ESTAT_API.BASE_URL}${ESTAT_ENDPOINTS.GET_META_INFO}?${params}`);
  if (!res.ok) throw new Error(`e-Stat getMetaInfo HTTP ${res.status}`);
  const json = (await res.json()) as Record<string, any>;
  return axisMembersFromMeta(json, statsDataId, axis);
}

/** getMetaInfo の応答 (live でもカタログの写しでも同じ形) から軸のメンバーと調査年を読む。 */
export function axisMembersFromMeta(
  json: Record<string, any>,
  statsDataId: string,
  axis: EstatAxisName,
): { members: AreaAxisMember[]; surveyYear: string | null; hasTimeAxis: boolean; updatedDate: string | null } {
  const metadata = json?.GET_META_INFO?.METADATA_INF;
  const objs = metadata?.CLASS_INF?.CLASS_OBJ;
  const list = Array.isArray(objs) ? objs : objs ? [objs] : [];
  const target = list.find((o: any) => String(o["@id"]) === axis);
  if (!target) throw new Error(`getMetaInfo に軸 ${axis} が無い (statsDataId=${statsDataId})`);
  const cls = Array.isArray(target.CLASS) ? target.CLASS : target.CLASS ? [target.CLASS] : [];
  const updated = metadata?.TABLE_INF?.UPDATED_DATE;
  return {
    members: cls.map((c: any) => ({ code: String(c["@code"]), name: String(c["@name"]) })),
    surveyYear: surveyYearFromDate(metadata?.TABLE_INF?.SURVEY_DATE),
    hasTimeAxis: list.some((o: any) => String(o["@id"]) === "time"),
    updatedDate: typeof updated === "string" ? updated : typeof updated?.$ === "string" ? updated.$ : null,
  };
}

/**
 * 値を表の写しから読んだときは、分類軸のメンバーも同じ版のカタログの目録 (estat-catalog/meta) から読む。
 * 目録の版 (UPDATED_DATE) が写しの版と違えば、別の版の名前で写像しないよう止める。
 */
export async function catalogAxisMembers(statsDataId: string, axis: EstatAxisName, catalogVersion: string | null) {
  const { SITE } = await import("@stats47/types");
  const res = await fetch(`${SITE.r2PublicBaseUrl.replace(/\/+$/, "")}/estat-catalog/meta/${statsDataId}.json`, { redirect: "error" });
  if (!res.ok) throw new Error(`Catalog meta ${statsDataId}: HTTP ${res.status}`);
  const envelope = (await res.json()) as { response?: Record<string, any> };
  const result = axisMembersFromMeta(envelope.response ?? {}, statsDataId, axis);
  if (catalogVersion !== null && result.updatedDate !== catalogVersion) {
    throw new Error(`Catalog meta ${statsDataId} version ${result.updatedDate} differs from snapshot ${catalogVersion}`);
  }
  return result;
}

/**
 * 都道府県が area 軸ではなく cat 軸に入っている表を取り込む。
 *
 * その軸を **pin せずに**取得し、応答の `@cat0N` を都道府県コードに写して `@area` に置く。
 * 写像は必ず getMetaInfo の CLASS 名で検証し、47 県そろわなければ **fail** する
 * (黙って 40 県で配信すると、形状ゲートのカバレッジ検査に頼ることになり、
 * 「そもそも写像が間違っている」のか「その県にデータが無い」のか区別できなくなる)。
 */
export async function fetchEstatAreaAxis(
  appId: string,
  config: Extract<SourceConfig, { kind: "estat" }>,
  areaAxis: NonNullable<Extract<SourceConfig, { kind: "estat" }>["areaAxis"]>,
): Promise<EstatFetchResult> {
  // 対象軸は pin せずに取得する (pin すると 1 県分しか返らない)。写しがあれば写しから読む
  const fetched = await fetchEstatData(appId, { ...config, areaAxis: undefined });
  const snapshotSource = fetched.sources.find((source) => source.kind === "estat-table-snapshot");
  const { members, surveyYear, hasTimeAxis } = snapshotSource?.catalogVersion
    ? await catalogAxisMembers(config.statsDataId, areaAxis.axis, snapshotSource.catalogVersion)
    : await fetchAxisMembers(appId, config.statsDataId, areaAxis.axis);
  const mapping = resolveAreaAxis(members, areaAxis.scheme);

  // time 軸が無い表は値に @time が付かないので、調査年をメタから補う。
  // 推測はしない — 取り出せなければ fail する (年が違えば別の統計になってしまう)。
  if (!hasTimeAxis && !surveyYear) {
    throw new Error(
      `time 軸が無く TABLE_INF.SURVEY_DATE からも年を決められません (statsDataId=${config.statsDataId})`,
    );
  }

  if (!hasExpectedCoverage(mapping.missingPrefectures, areaAxis.coverage)) {
    throw new Error(
      `areaAxis (${areaAxis.axis}/${areaAxis.scheme}) が ${mapping.byCode.size} 県しか解決できません。` +
        `未解決: ${mapping.missingPrefectures.slice(0, 5).join(",")}${mapping.missingPrefectures.length > 5 ? "…" : ""}` +
        (mapping.unresolved.length > 0
          ? ` / 名前が一致しないメンバー: ${mapping.unresolved.slice(0, 3).map((m) => `${m.code}=${m.name}`).join(", ")}`
          : ""),
    );
  }

  const attr = `@${areaAxis.axis}` as const;

  const values: EstatValue[] = [];
  for (const v of fetched.values) {
    const axisCode = (v as Record<string, unknown>)[attr];
    if (typeof axisCode !== "string") continue;
    const areaCode = mapping.byCode.get(axisCode);
    if (!areaCode) continue; // 全国・地域ブロック等
    values.push({
      ...v,
      "@area": areaCode,
      "@time": v["@time"] ?? `${surveyYear}000000`,
    });
  }

  return { values, raw: fetched.raw, sources: fetched.sources };
}

