import { addDays, isoWeekOf, isoWeekRange, jstDateOf } from "../../../../.claude/scripts/metrics/lib/periods.mjs";
import "server-only";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describeChannel, weeklyProductRevenue } from "../../../../.claude/scripts/metrics/lib/product-revenue.mjs";
import { summarizeWeeklyRevenue, weeklyRevenueNode } from "../../../../.claude/scripts/metrics/lib/weekly-revenue.mjs";

import { cached, fileExists, hasError, readCsv, readJson, statePath, TTL, wrap, type Wrapped } from "./state-io";
import { datasetDir, datasetPath } from "../../../../config/datasets.mjs";

/**
 * KPI ツリーと商品の週次実売 (読み取り専用)。
 * - KPI の値・比較・状態・施策は週次 CI が書く measurement-cycle/latest.json が正典
 * - 目標は事業計画 catalog から生成する kpi-tree.json が正典 (週次 CI の再生成を待たずに出すため id で結合する)
 * - 商品の週次実売は revenue-history.json を、週次 Issue と同じ関数 (product-revenue.mjs) で計算する
 */

const CYCLE = `${datasetDir("business.measurement-cycle")}/latest.json`;
const TREE = `${datasetDir("business-plan.state")}/kpi-tree.json`;
const REVENUE_HISTORY = `${datasetDir("revenue.authenticated")}/revenue-history.json`;

export interface KpiTarget {
  value: number;
  dueWeek: string;
  basis: string;
}

export interface KpiNode {
  id: string;
  label: string;
  tier: "nsm" | "driver" | "guardrail";
  unit: string;
  focus: boolean;
  status: string;
  value: string | null;
  previous: string | null;
  note?: string;
  improvements: string[];
  target: KpiTarget | null;
}

export interface KpiSummary {
  week: string;
  compareWeek: string;
  generatedAt: string;
  nodes: KpiNode[];
  improvements: { active: number; maxActive: number; unlinked: string[]; noTarget: string[] };
  focusWithoutImprovements: string[];
}

interface CycleFile {
  week: string;
  generatedAt: string;
  kpiTree: Omit<KpiSummary, "week" | "generatedAt" | "nodes"> & { nodes: Omit<KpiNode, "target">[] };
}

export function readKpiSummary(): Wrapped<KpiSummary> {
  return cached("kpi-summary", TTL.weekly, () =>
    wrap(() => {
      const cycle = readJson<CycleFile>(CYCLE);
      const tree = fileExists(TREE) ? readJson<{ nodes: { id: string; target?: KpiTarget }[] }>(TREE) : { nodes: [] };
      const targets = new Map(tree.nodes.map((n) => [n.id, n.target ?? null]));
      // 週次収益の行は入力の記録から同じ関数で作り直す (CI の再生成前でも、ホームのタイルと表が同じ値になる)
      const revenue = readWeeklyRevenue(cycle.week);
      const revenueNode = hasError(revenue) ? null : weeklyRevenueNode(revenue);
      return {
        week: cycle.week,
        generatedAt: cycle.generatedAt,
        compareWeek: cycle.kpiTree.compareWeek,
        improvements: cycle.kpiTree.improvements,
        focusWithoutImprovements: cycle.kpiTree.focusWithoutImprovements,
        nodes: cycle.kpiTree.nodes.map((n) => ({
          ...n,
          ...(n.id === "weekly-revenue" && revenueNode ? revenueNode : {}),
          target: targets.get(n.id) ?? null,
        })),
      };
    }),
  );
}

export interface WeeklyRevenueChannel {
  id: string;
  label: string;
  period: "week" | "month-to-date";
  status: "ok" | "unmeasurable";
  yen: number | null;
  inTotal: boolean;
  detail: string;
}

export interface WeeklyRevenue {
  week: string;
  weekStart: string;
  weekEnd: string;
  status: "ok" | "partial" | "unmeasurable";
  totalYen: number | null;
  measuredYen: number;
  channels: WeeklyRevenueChannel[];
}

const optionalJson = (rel: string) => (fileExists(rel) ? readJson<object>(rel) : null);

/** 収益の明細 (data/revenue/daily の全ファイル)。まだ 1 件も無ければ空 */
function readDailyRevenue(): object[] {
  const dir = statePath(datasetDir("revenue.daily"));
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as object);
}

/**
 * KPI ツリーと同じ週の週次収益 (NSM) の内訳。計算は KPI ツリー (measurement-cycle) と同じ関数で、
 * 入力の記録をその場で読むので、週次 CI の再生成を待たずに最新の記録を反映する。
 */
export function readWeeklyRevenue(week: string): Wrapped<WeeklyRevenue> {
  return cached(`weekly-revenue:${week}`, TTL.weekly, () =>
    wrap(() => {
      const { monday, sunday } = isoWeekRange(week);
      const adsenseCsv = `${datasetDir("adsense.history")}/history.csv`;
      const result = summarizeWeeklyRevenue({
        week,
        weekStart: monday,
        weekEnd: sunday,
        asOf: new Date(`${sunday}T23:59:59Z`),
        adsenseHistory: fileExists(adsenseCsv) ? readCsv(adsenseCsv) : null,
        revenueHistory: optionalJson(REVENUE_HISTORY),
        authLatest: optionalJson(`${datasetDir("revenue.authenticated")}/latest.json`),
        a8Results: optionalJson(datasetPath("a8.results")),
        rakutenResults: optionalJson(datasetPath("rakuten.results")),
        daily: readDailyRevenue(),
      });
      return { ...result, weekStart: monday, weekEnd: sunday } as WeeklyRevenue;
    }),
  );
}

export interface ChannelRevenue {
  channel: string;
  status: "ok" | "unmeasurable";
  yen: number | null;
  count: number | null;
  estimate: boolean;
  text: string;
}

export interface WeeklyProductRevenue {
  weekStart: string;
  weekEnd: string;
  status: "ok" | "unmeasurable";
  yen: number | null;
  count: number | null;
  channels: ChannelRevenue[];
  entries: number;
  latestDate: string | null;
}

/** 直近の月曜〜日曜 (JST) を返す。今週はまだ終わっていないので、終わった直近の週を使う。 */
function lastCompletedWeek(now = new Date()): { weekStart: string; weekEnd: string } {
  const thisMonday = isoWeekRange(isoWeekOf(jstDateOf(now))).monday; // 正本は .claude/scripts/metrics/lib/periods.mjs (JST の暦日で数える。SCRIPT-ISO-WEEK-UNIFY-01)
  return { weekStart: addDays(thisMonday, -7), weekEnd: addDays(thisMonday, -1) };
}

export function readWeeklyProductRevenue(): Wrapped<WeeklyProductRevenue> {
  return cached("weekly-product-revenue", TTL.weekly, () =>
    wrap(() => {
      const history = fileExists(REVENUE_HISTORY) ? readJson<{ entries?: { date: string }[] }>(REVENUE_HISTORY) : null;
      const window = lastCompletedWeek();
      const week = weeklyProductRevenue({ revenueHistory: history, ...window });
      const entries = history?.entries ?? [];
      return {
        ...window,
        status: week.status,
        yen: week.yen,
        count: week.count,
        entries: entries.length,
        latestDate: entries.map((e) => e.date).sort().at(-1) ?? null,
        channels: Object.entries(week.channels).map(([channel, r]) => ({
          channel,
          status: r.status,
          yen: r.yen ?? null,
          count: r.count ?? null,
          estimate: Boolean(r.estimate),
          text: describeChannel(channel, r),
        })),
      };
    }),
  );
}
