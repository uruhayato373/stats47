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
  if (!isPlainObject(value) || !Array.isArray(value.requests)) {
    throw new Error("dependency mirror must contain requests[]");
  }
  if (!Number.isSafeInteger(value.distinctRequests) || value.distinctRequests < 0) {
    throw new Error("dependency mirror distinctRequests must be a non-negative integer");
  }

  const seen = new Set();
  const requests = value.requests.map((candidate, index) => {
    if (!isPlainObject(candidate)) throw new Error(`requests[${index}] must be an object`);
    const statsDataId = requireNonEmptyString(candidate.statsDataId, `requests[${index}].statsDataId`);
    const theme = requireNonEmptyString(candidate.themeKey, `requests[${index}].themeKey`);
    const componentKey = requireNonEmptyString(
      candidate.componentKey,
      `requests[${index}].componentKey`,
    );
    const componentType = requireNonEmptyString(
      candidate.componentType,
      `requests[${index}].componentType`,
    );
    const filters = candidate.filters ?? {};
    if (!isPlainObject(filters)) throw new Error(`requests[${index}].filters must be an object`);
    for (const [key, filter] of Object.entries(filters)) {
      if (!FILTER_AXIS.test(key) || typeof filter !== "string" || filter === "") {
        throw new Error(`requests[${index}].filters.${key} is invalid`);
      }
    }
    const key = requestKey(statsDataId, filters);
    if (candidate.key !== key) throw new Error(`requests[${index}].key does not match its request`);
    if (seen.has(key)) throw new Error(`duplicate request key: ${key}`);
    seen.add(key);
    return {
      key,
      theme,
      componentKey,
      componentType,
      params: { statsDataId, ...filters },
    };
  });

  if (seen.size !== value.distinctRequests) {
    throw new Error(
      `dependency mirror count mismatch: declared ${value.distinctRequests} / actual ${seen.size}`,
    );
  }

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
  const declaredMetricCount = value.distinctMetricRefs ?? metrics.length;
  if (!Number.isSafeInteger(declaredMetricCount) || declaredMetricCount < 0) {
    throw new Error("dependency mirror distinctMetricRefs must be a non-negative integer");
  }
  if (seenMetrics.size !== declaredMetricCount) {
    throw new Error(
      `dependency mirror metric count mismatch: declared ${declaredMetricCount} / actual ${seenMetrics.size}`,
    );
  }
  return { requests, metrics, distinctExpected: seen.size + seenMetrics.size };
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
