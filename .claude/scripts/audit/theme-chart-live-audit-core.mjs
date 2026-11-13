const FILTER_AXIS = /^cd([A-Z][A-Za-z0-9]*)$/;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

export function parseAuditLimit(raw) {
  if (raw === undefined) return null;
  const limit = Number(raw);
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new Error("--limit must be a positive integer");
  }
  return limit;
}

export function requestKey(statsDataId, filters = {}) {
  const suffix = Object.entries(filters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return suffix === "" ? statsDataId : `${statsDataId}?${suffix}`;
}

export function parseDependencyMirror(value) {
  if (!isPlainObject(value) || !Array.isArray(value.metrics) || 'requests' in value) throw new Error('dependency mirror must contain metrics[] only');
  const rawMetrics = value.metrics ?? [];
  if (!Array.isArray(rawMetrics)) throw new Error("dependency mirror metrics must be an array");
  const seenMetrics = new Set();
  const metrics = rawMetrics.map((candidate, index) => {
    if (!isPlainObject(candidate)) throw new Error(`metrics[${index}] must be an object`);
    const metricKey = requireNonEmptyString(candidate.metricKey, `metrics[${index}].metricKey`);
    const expectedUnit = requireNonEmptyString(
      candidate.expectedUnit,
      `metrics[${index}].expectedUnit`,
    );
    const expectedConfigHash = requireNonEmptyString(
      candidate.expectedConfigHash,
      `metrics[${index}].expectedConfigHash`,
    );
    if (!/^[0-9a-f]{16}$/.test(expectedConfigHash)) {
      throw new Error(`metrics[${index}].expectedConfigHash is invalid`);
    }
    if (seenMetrics.has(metricKey)) throw new Error(`duplicate metric key: ${metricKey}`);
    seenMetrics.add(metricKey);
    return {
      key: `r2:${metricKey}`,
      metricKey,
      expectedUnit,
      expectedConfigHash,
      theme: requireNonEmptyString(candidate.themeKey, `metrics[${index}].themeKey`),
      componentKey: requireNonEmptyString(
        candidate.componentKey,
        `metrics[${index}].componentKey`,
      ),
      componentType: requireNonEmptyString(
        candidate.componentType,
        `metrics[${index}].componentType`,
      ),
    };
  });
  const declaredMetricCount = value.distinctMetricRefs;
  if (!Number.isSafeInteger(declaredMetricCount) || declaredMetricCount < 0) {
    throw new Error("dependency mirror distinctMetricRefs must be a non-negative integer");
  }
  if (seenMetrics.size !== declaredMetricCount) {
    throw new Error(
      `dependency mirror metric count mismatch: declared ${declaredMetricCount} / actual ${seenMetrics.size}`,
    );
  }
  return { metrics, distinctExpected: seenMetrics.size };
}

/**
 * 依存ミラーの「推移」と題した図の一覧と最低点数を読む。
 * 一覧が無いミラーを黙って受け入れると、推移の点数の検査が空になるので、無ければ落とす。
 * 最低点数の正典は packages/data-configs の MIN_TREND_YEARS (ミラー生成時に写す)。
 */
export function parseTrendChartMirror(value) {
  if (!isPlainObject(value)) throw new Error("dependency mirror must be an object");
  const minTrendYears = value.minTrendYears;
  if (!Number.isSafeInteger(minTrendYears) || minTrendYears < 1) {
    throw new Error("dependency mirror minTrendYears must be a positive integer");
  }
  if (!Array.isArray(value.trendCharts)) {
    throw new Error("dependency mirror trendCharts must be an array");
  }
  const trendCharts = value.trendCharts.map((candidate, index) => {
    if (!isPlainObject(candidate)) throw new Error(`trendCharts[${index}] must be an object`);
    if (!Array.isArray(candidate.metricKeys) || candidate.metricKeys.length === 0) {
      throw new Error(`trendCharts[${index}].metricKeys must be a non-empty array`);
    }
    return {
      themeKey: requireNonEmptyString(candidate.themeKey, `trendCharts[${index}].themeKey`),
      componentKey: requireNonEmptyString(candidate.componentKey, `trendCharts[${index}].componentKey`),
      title: requireNonEmptyString(candidate.title, `trendCharts[${index}].title`),
      metricKeys: candidate.metricKeys.map((key, i) =>
        requireNonEmptyString(key, `trendCharts[${index}].metricKeys[${i}]`),
      ),
    };
  });
  return { minTrendYears, trendCharts };
}

/**
 * 「推移」と題した図が描く指標のうち、観測年が最低点数に満たないものを返す。
 * 取得に失敗した指標や検査していない指標は年数を知らないので、ここでは数えない
 * (取得の失敗は別の status として報告される)。
 */
export function inspectTrendYears({ trendCharts, minTrendYears, results }) {
  const yearCounts = new Map();
  for (const result of results) {
    if (result.status === "ok" && Number.isFinite(result.yearCount)) {
      yearCounts.set(result.metricKey, result.yearCount);
    }
  }
  const violations = [];
  for (const chart of trendCharts) {
    for (const metricKey of chart.metricKeys) {
      const yearCount = yearCounts.get(metricKey);
      if (yearCount === undefined || yearCount >= minTrendYears) continue;
      violations.push({
        where: `${chart.themeKey}/${chart.componentKey}`,
        title: chart.title,
        metricKey,
        yearCount,
        minTrendYears,
      });
    }
  }
  return violations;
}

/** R2 `app/stats/<metric>/values.json` の表示契約を検査する。 */
export function inspectStatsPayload(payload, metric) {
  if (!isPlainObject(payload)) return { status: "malformed-json", detail: "root is not an object" };
  if (payload.metricKey !== metric.metricKey) {
    return { status: "wrong-metric-key", detail: String(payload.metricKey ?? "missing") };
  }
  if (payload.entityKind !== "prefecture") {
    return { status: "wrong-entity-kind", detail: String(payload.entityKind ?? "missing") };
  }
  if (!Array.isArray(payload.rows)) {
    return { status: "malformed-json", detail: "rows[] is missing" };
  }
  if (payload.rows.length === 0) return { status: "no-rows", detail: "0 rows" };
  if (payload.rows.some((row) => !isPlainObject(row))) {
    return { status: "malformed-json", detail: "rows contains a non-object row" };
  }
  if (payload.rows.some((row) => typeof row.areaCode !== "string" || row.areaCode === "")) {
    return { status: "malformed-json", detail: "rows contains a row without areaCode" };
  }
  const rowAreaCount = new Set(payload.rows.map((row) => row.areaCode)).size;
  const metaAreaCount = payload.meta?.areaCount;
  if (!Number.isSafeInteger(metaAreaCount) || metaAreaCount < 0) {
    return { status: "area-meta-missing", detail: "meta.areaCount is missing or invalid" };
  }
  if (metaAreaCount !== rowAreaCount) {
    return {
      status: "area-meta-mismatch",
      detail: `meta ${metaAreaCount} / actual ${rowAreaCount}`,
    };
  }
  const finiteRows = payload.rows.filter(
    (row) => typeof row.value === "number" && Number.isFinite(row.value),
  );
  if (finiteRows.length === 0) return { status: "no-values", detail: "finite values 0" };
  const units = new Set(finiteRows.map((row) => row.unit).filter((unit) => typeof unit === "string"));
  if (units.size !== 1 || !units.has(metric.expectedUnit)) {
    return {
      status: "unit-mismatch",
      detail: `expected ${metric.expectedUnit} / actual ${[...units].join(",") || "missing"}`,
    };
  }
  if (finiteRows.some((row) => typeof row.yearCode !== "string" || row.yearCode === "")) {
    return { status: "year-missing", detail: "finite row without yearCode" };
  }
  const areaCount = new Set(finiteRows.map((row) => row.areaCode)).size;
  const bakedHash = payload.meta?.recipe?.configHash;
  if (typeof bakedHash !== "string") {
    return { status: "recipe-unbaked", detail: "meta.recipe.configHash is missing" };
  }
  if (bakedHash !== metric.expectedConfigHash) {
    return {
      status: "recipe-drift",
      detail: `expected ${metric.expectedConfigHash} / actual ${bakedHash}`,
    };
  }
  return {
    status: "ok",
    rows: finiteRows.length,
    areaCount,
    yearCount: new Set(finiteRows.map((row) => row.yearCode)).size,
    unit: metric.expectedUnit,
    ...(areaCount < 47
      ? {
          areaCoverageWarning:
            `47 prefectures are not present in finite observations (actual ${areaCount}); ` +
            "warn-only by shape-gate SSOT",
        }
      : {}),
  };
}

export function isFiniteEstatValue(raw) {
  if (raw === undefined || raw === null) return false;
  const normalized = String(raw).trim().replace(/,/g, "");
  return normalized !== "" && Number.isFinite(Number(normalized));
}

export function classifyNational(values) {
  const rows = values.filter((value) => value?.["@area"] === "00000");
  if (rows.length === 0) return { hasNationalRow: false, hasNational: false };
  return {
    hasNationalRow: true,
    hasNational: rows.some((value) => isFiniteEstatValue(value?.$)),
  };
}

function axisForFilter(filter) {
  const match = filter.match(FILTER_AXIS);
  return match ? `@${match[1][0].toLowerCase()}${match[1].slice(1)}` : null;
}

export function findWrongFilterRows(values, params) {
  const filters = Object.entries(params).filter(([key]) => key !== "statsDataId");
  return values.filter((row) =>
    filters.some(([filter, expected]) => {
      const axis = axisForFilter(filter);
      return axis !== null && String(row?.[axis] ?? "") !== String(expected);
    }),
  );
}

export function inspectEstatPayload(payload, params) {
  if (!isPlainObject(payload)) return { status: "malformed-json", detail: "root is not an object" };
  const root = payload.GET_STATS_DATA;
  if (!isPlainObject(root)) return { status: "malformed-json", detail: "GET_STATS_DATA is missing" };
  const resultStatus = root.RESULT?.STATUS;
  if (resultStatus !== 0 && resultStatus !== "0") {
    return {
      status: "api-error",
      detail: String(root.RESULT?.ERROR_MSG ?? `status ${String(resultStatus)}`).slice(0, 120),
    };
  }
  const statistical = root.STATISTICAL_DATA;
  if (!isPlainObject(statistical)) {
    return { status: "malformed-json", detail: "STATISTICAL_DATA is missing" };
  }
  const rawValues = statistical.DATA_INF?.VALUE;
  const values = rawValues === undefined ? [] : Array.isArray(rawValues) ? rawValues : [rawValues];
  if (values.length === 0) return { status: "no-rows", detail: "0 rows" };
  if (values.some((row) => !isPlainObject(row))) {
    return { status: "malformed-json", detail: "VALUE contains a non-object row" };
  }
  const wrongRows = findWrongFilterRows(values, params);
  if (wrongRows.length > 0) {
    return {
      status: "wrong-filter",
      detail: `${wrongRows.length}/${values.length} rows do not match requested filters`,
    };
  }
  const { hasNationalRow, hasNational } = classifyNational(values);
  return {
    status: "ok",
    rows: values.length,
    hasNationalRow,
    hasNational,
    tableTitle: String(statistical.TABLE_INF?.TITLE?.$ ?? statistical.TABLE_INF?.TITLE ?? "").slice(
      0,
      80,
    ),
  };
}

export function summarizeAudit({ distinctExpected, requested, results, isPartial }) {
  const actualKeys = new Set(results.map((result) => result.key));
  const hasDuplicateResults = actualKeys.size !== results.length;
  const coverageOk =
    !isPartial &&
    !hasDuplicateResults &&
    requested === distinctExpected &&
    results.length === distinctExpected;
  const errorCount = results.filter((result) => result.status !== "ok").length;
  return {
    status: isPartial ? "partial" : coverageOk && errorCount === 0 ? "complete" : "failed",
    coverageOk,
    errorCount,
    audited: results.length,
  };
}
