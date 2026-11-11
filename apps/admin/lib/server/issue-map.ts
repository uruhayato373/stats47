import "server-only";

import { datasetPath } from "../../../../config/datasets.mjs";
import type { ContentTypeDef } from "../content-coverage";
import { buildIssueMap, type IssueMapBuilt, type IssueMapSpec } from "../issue-map";
import { pilotBoard } from "./pilot-board";
import { fileExists, readJson } from "./state-io";
import { jstDateStr } from "./time";
import { todoBoard } from "./todo";

/**
 * 事業イシューマップの入力を読む。判定日と状態と行の型の定義は台帳を写さず、ここで参照先から集める。**読み取りのみ**。
 */

export const ISSUE_MAP_PATH = datasetPath("business.issue-map");

interface ExperimentRecord {
  id: string;
  status: string;
  next_check_date?: string | null;
}

export type IssueMapView = { today: string; map: IssueMapBuilt | null; relatedPaths: Record<string, string>; error: string | null };

export function issueMap(): IssueMapView {
  const today = jstDateStr();
  try {
    const spec = readJson<IssueMapSpec>(ISSUE_MAP_PATH);
    const contentTypes = readJson<{ types: ContentTypeDef[] }>(datasetPath("content.types")).types;
    const todo = todoBoard();
    const experimentsPath = datasetPath("business.experiments");
    const experiments = fileExists(experimentsPath) ? readJson<{ experiments: ExperimentRecord[] }>(experimentsPath).experiments : [];
    const map = buildIssueMap(spec, {
      today,
      improvements: Object.fromEntries(todo.improvements.map((r) => [r.id, { due: r.due, status: r.status }])),
      backlog: Object.fromEntries(todo.items.flatMap((c) => (c.id ? [[c.id, { due: c.due, wip: c.wip }]] : []))),
      pilots: Object.fromEntries(pilotBoard().rows.map((r) => [r.id, { judgeDate: r.judgeDate, state: r.state }])),
      experiments: Object.fromEntries(experiments.map((e) => [e.id, { nextCheck: e.next_check_date ?? null, status: e.status }])),
    }, contentTypes);
    const relatedPaths = Object.fromEntries(
      spec.rows.flatMap((r) => (r.relatedDataset ? [[r.relatedDataset, datasetPath(r.relatedDataset)]] : [])),
    );
    return { today, map, relatedPaths, error: null };
  } catch (e) {
    return { today, map: null, relatedPaths: {}, error: e instanceof Error ? e.message : String(e) };
  }
}
