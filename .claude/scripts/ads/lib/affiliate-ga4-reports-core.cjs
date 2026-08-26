"use strict";

const IMPRESSION_EVENT = "affiliate_impression";
const CLICK_EVENT = "affiliate_click";

const REPORT_SPECS = Object.freeze({
  overview: {
    tiers: [
      ["eventName", "customEvent:ad_id", "customEvent:affiliate_vertical", "customEvent:link_position"],
      ["eventName", "customEvent:affiliate_vertical", "customEvent:affiliate_category", "customEvent:link_position"],
      ["eventName", "customEvent:affiliate_vertical", "customEvent:link_position"],
      ["eventName", "customEvent:affiliate_category", "customEvent:link_position"],
      ["eventName"],
    ],
  },
  experiments: {
    tiers: [
      ["eventName", "customEvent:experiment_id", "customEvent:variant_id", "customEvent:creative_size"],
      ["eventName", "customEvent:experiment_id", "customEvent:variant_id"],
      ["eventName"],
    ],
  },
  pages: {
    tiers: [
      ["eventName", "pagePath", "customEvent:ad_id", "customEvent:affiliate_vertical", "customEvent:link_position"],
      ["eventName", "pagePath", "customEvent:affiliate_vertical", "customEvent:link_position"],
      ["eventName", "pagePath"],
      ["eventName"],
    ],
  },
});

const shortName = (apiName) => apiName.replace(/^customEvent:/, "");

function pivot(rows, dimNames) {
  const valueDims = dimNames.slice(1);
  const map = new Map();
  for (const row of rows ?? []) {
    const dims = (row.dimensionValues ?? []).map((dimension) => dimension.value);
    const event = dims[0];
    const fields = {};
    valueDims.forEach((dimensionName, index) => {
      fields[shortName(dimensionName)] = dims[index + 1] || "(unset)";
    });
    const key = valueDims.length
      ? valueDims.map((_, index) => dims[index + 1] || "(unset)").join("|")
      : "(all)";
    const count = Number((row.metricValues ?? [])[0]?.value ?? 0);
    const current = map.get(key) ?? { ...fields, impressions: 0, clicks: 0 };
    if (event === IMPRESSION_EVENT) current.impressions += count;
    else if (event === CLICK_EVENT) current.clicks += count;
    map.set(key, current);
  }
  return [...map.values()].map((value) => ({
    ...value,
    ctr: value.impressions > 0 ? value.clicks / value.impressions : null,
  }));
}

function derivePageType(pagePath) {
  if (pagePath === "/" || pagePath === "") return "home";
  if (typeof pagePath !== "string" || !pagePath.startsWith("/")) return "unknown";
  const segment = pagePath.split("?")[0].split("/").filter(Boolean)[0];
  return (
    {
      ranking: "ranking",
      themes: "theme",
      blog: "blog",
      areas: "area",
      survey: "survey",
      compare: "compare",
    }[segment] ?? "other"
  );
}

async function fetchReportWithFallback(runReport, reportName, spec) {
  const failures = [];
  for (const dimensions of spec.tiers) {
    try {
      const rows = await runReport(dimensions);
      const pivoted = pivot(rows, dimensions);
      return {
        reportName,
        dimensions: dimensions.slice(1).map(shortName),
        rows:
          reportName === "pages"
            ? pivoted.map((row) => ({ ...row, page_type: derivePageType(row.pagePath) }))
            : pivoted,
        failures,
      };
    } catch (error) {
      failures.push({
        dimensions: dimensions.slice(1).map(shortName),
        reason: String(error?.message ?? error),
      });
    }
  }
  throw new Error(`${reportName}: 全 dimension tier の取得に失敗`);
}

async function fetchAllReports(runReport, specs = REPORT_SPECS) {
  const entries = await Promise.all(
    Object.entries(specs).map(async ([reportName, spec]) => [
      reportName,
      await fetchReportWithFallback(runReport, reportName, spec),
    ]),
  );
  return Object.fromEntries(entries);
}

module.exports = {
  CLICK_EVENT,
  IMPRESSION_EVENT,
  REPORT_SPECS,
  derivePageType,
  fetchAllReports,
  fetchReportWithFallback,
  pivot,
  shortName,
};
