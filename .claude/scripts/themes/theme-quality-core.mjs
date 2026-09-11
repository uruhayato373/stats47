/** Pure observations and comparison rules for the theme quality audit. */
const PREFECTURE_CODES = Array.from({ length: 47 }, (_, i) => `${String(i + 1).padStart(2, "0")}000`);
const PREFECTURES = new Set(PREFECTURE_CODES);
const normalized = (v) => String(v ?? "").normalize("NFKC").trim();

export function inspectThemePayload(payload, namespace) {
  let rows;
  if (namespace === "stats") {
    if (!Array.isArray(payload?.rows)) throw new Error("stats.rows must be an array");
    rows = payload.rows;
  } else {
    if (!payload?.partitions || typeof payload.partitions !== "object") throw new Error("ranking.partitions missing");
    rows = Object.values(payload.partitions).flatMap((part) => {
      const values = Array.isArray(part) ? part : part?.values ?? part?.rows;
      if (!Array.isArray(values)) throw new Error("ranking partition must contain rows");
      return values;
    });
  }
  const byYear = new Map();
  for (const row of rows) {
    if (!PREFECTURES.has(row.areaCode)) continue;
    if (!/^\d{4}$/.test(String(row.yearCode))) throw new Error("invalid observation year");
    const year = String(row.yearCode);
    if (!byYear.has(year)) byYear.set(year, { seen: new Set(), finite: new Set(), units: new Set(), duplicates: 0 });
    const y = byYear.get(year);
    if (y.seen.has(row.areaCode)) y.duplicates++;
    y.seen.add(row.areaCode);
    if (typeof row.value === "number" && Number.isFinite(row.value)) y.finite.add(row.areaCode);
    y.units.add(normalized(row.unit));
  }
  const years = [...byYear.keys()].sort();
  const latestYear = years.at(-1) ?? null;
  const latest = byYear.get(latestYear);
  return {
    status: latest?.finite.size ? "ok" : "empty",
    rowCount: rows.length,
    years,
    latestYear,
    latestCoverage: latest?.finite.size ?? 0,
    latestMissingCodes: PREFECTURE_CODES.filter((code) => !latest?.finite.has(code)),
    units: [...new Set([...byYear.values()].flatMap((y) => [...y.units]))].sort(),
    duplicateAreaYears: [...byYear.values()].reduce((n, y) => n + y.duplicates, 0),
    coverageByYear: Object.fromEntries(years.map((year) => [year, byYear.get(year).finite.size])),
  };
}

export function compareThemeObservation(previous, current) {
  if (!previous || previous.status !== "ok" || current.status !== "ok") return [];
  const changes = [];
  if (current.latestYear > previous.latestYear) changes.push({ code: "new-data-year", severity: "info", from: previous.latestYear, to: current.latestYear });
  if (current.latestYear < previous.latestYear) changes.push({ code: "year-regression", severity: "error", from: previous.latestYear, to: current.latestYear });
  const lostYears = previous.years.filter((year) => !current.years.includes(year));
  if (lostYears.length) changes.push({ code: "history-loss", severity: "error", years: lostYears });
  // Legitimate partial coverage is not an error; a decline from a previous observation is.
  for (const [year, count] of Object.entries(previous.coverageByYear ?? {})) {
    const now = current.coverageByYear?.[year];
    if (typeof now === "number" && now < count) changes.push({ code: "coverage-regression", severity: "error", year, from: count, to: now });
  }
  return changes;
}

/** Keep the last verified payload after failures; never promote an error observation into its own baseline. */
export function selectLastGoodObservations(previous = {}, observations = [], findings = []) {
  const keyOf = (observation) => `${observation.namespace}/${observation.key}`;
  const hasError = (observation, entries) => entries.some((finding) =>
    finding.severity === "error" && finding.metricKey === observation.key
    && (!finding.namespace || finding.namespace === observation.namespace));
  const valid = (observation) => observation.status === "ok"
    && !(observation.duplicateAreaYears > 0) && observation.latestCoverage > 0;
  // An explicit empty list means no verified baseline. Do not fall back to failed observations.
  const legacy = !Array.isArray(previous.lastGoodObservations);
  const prior = legacy ? previous.observations ?? [] : previous.lastGoodObservations;
  const selected = new Map(prior.filter((observation) => valid(observation)
    && (!legacy || !hasError(observation, previous.findings ?? [])))
    .map((observation) => [keyOf(observation), observation]));
  for (const observation of observations) {
    if (valid(observation) && !hasError(observation, findings)) selected.set(keyOf(observation), observation);
  }
  // Unobserved payloads retain their baseline too; absence of a check cannot establish recovery.
  return [...selected.values()].sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
}

export function inspectThemeStructure(catalog) {
  const findings = [];
  const add = (code, detail) => findings.push({ code, severity: "error", detail });
  const sections = catalog.sections ?? [];
  if (!sections.length) add("missing-sections", "問いごとの章が未定義");
  const groups = new Map((catalog.metricGroups ?? []).map((g) => [g.key, g]));
  const charts = new Set((catalog.charts ?? []).map((c) => c.componentKey));
  const metricKeys = new Set(catalog.metrics.map((m) => m.rankingKey));
  const placedGroups = new Set();
  const placedCharts = new Set();
  const sectionKeys = new Set();
  for (const section of sections) {
    if (sectionKeys.has(section.key)) add("duplicate-section", section.key);
    sectionKeys.add(section.key);
    for (const key of section.metricGroupKeys ?? []) {
      if (!groups.has(key)) add("unknown-group", key);
      if (placedGroups.has(key)) add("repeated-group", key);
      placedGroups.add(key);
    }
    for (const key of section.chartKeys ?? []) {
      if (!charts.has(key)) add("unknown-chart", key);
      if (placedCharts.has(key)) add("repeated-chart", key);
      placedCharts.add(key);
    }
  }
  for (const [key, group] of groups) {
    if (!placedGroups.has(key)) add("unplaced-group", key);
    for (const metric of group.rankingKeys) if (!metricKeys.has(metric)) add("unknown-group-metric", metric);
  }
  for (const key of charts) if (!placedCharts.has(key)) add("unplaced-chart", key);
  return findings;
}

export function inspectChartYears(chart, references, observations) {
  const findings = [];
  if (chart.componentType !== "line-chart" && chart.componentType !== "mixed-chart") return findings;
  // This audit measures prefecture payload years; nationwide series have a separate runtime resolver.
  if (references.some((ref) => ref.area === "national")) return findings;
  const series = references.map((ref) => {
    const obs = observations.get(ref.metricKey);
    const years = obs?.status === "ok" ? obs.years : null;
    return { key: ref.metricKey, years: ref.year ? years?.filter((year) => year === String(ref.year)) : years };
  });
  if (!series.length || series.some((s) => !s.years)) return findings;
  const common = series[0].years.filter((year) => series.every((s) => s.years.includes(year)));
  const claimsTrend = /推移|経年|時系列/.test(chart.title);
  if (claimsTrend && series.every((s) => s.years.length < 2)) {
    findings.push({ code: "single-year-trend", severity: "error", detail: "全系列が単年なのに推移を表示", series });
  } else if (claimsTrend && common.length < 2 && series.length > 1) {
    findings.push({ code: "unaligned-trend", severity: "warn", detail: "同年比較できる時点が不足。長期系列と単年カードを分離", commonYears: common, series });
  }
  return findings;
}

export function findingIdentity(finding) {
  return [finding.themeKey ?? "", finding.metricKey ?? "", finding.componentKey ?? "", finding.namespace ?? "", finding.code, finding.detail ?? "", finding.year ?? ""].join("|");
}

export function summarizeThemeFindings(findings, previousFindings = []) {
  const before = new Set(previousFindings.map(findingIdentity));
  const now = new Set(findings.map(findingIdentity));
  const added = findings.filter((f) => !before.has(findingIdentity(f)));
  const resolved = previousFindings.filter((f) => !now.has(findingIdentity(f)));
  return {
    errors: findings.filter((f) => f.severity === "error").length,
    warnings: findings.filter((f) => f.severity === "warn").length,
    added,
    resolved,
    actionableChange: added.some((f) => f.severity !== "info") || resolved.some((f) => f.severity !== "info"),
  };
}
