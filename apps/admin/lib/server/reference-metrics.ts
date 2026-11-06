import "server-only";

import { datasetPath } from "../../../../config/datasets.mjs";
import { readClassifyInputs } from "../../../../.claude/scripts/content-types/content-types-io.mjs";
import { buildMetricDetail, buildMetricRows, type MetricDetail, type MetricExternalPage, type MetricLink, type MetricRow } from "../reference-metrics";
import { projectRoot } from "./project-root";
import { readJson, type Wrapped } from "./state-io";

function readInput() {
  const external = readJson<{ pages: MetricExternalPage[]; links: MetricLink[] }>(datasetPath("content.external"));
  return { pages: readClassifyInputs(projectRoot()).pages, externalPages: external.pages, externalLinks: external.links };
}

export function metricRows(): Wrapped<MetricRow[]> {
  try {
    return buildMetricRows(readInput());
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export function metricDetail(key: string): Wrapped<MetricDetail | null> {
  try {
    return buildMetricDetail(key, readInput());
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
