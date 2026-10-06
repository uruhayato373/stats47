import "server-only";

import { describeChannel, weeklyProductRevenue } from "../../../../.claude/scripts/metrics/lib/product-revenue.mjs";

import { cached, fileExists, readJson, TTL, wrap, type Wrapped } from "./state-io";

/**
 * KPI ツリーと商品の週次実売 (読み取り専用)。
 * - KPI の値・比較・状態・施策は週次 CI が書く measurement-cycle/latest.json が正典
 * - 目標は事業計画 catalog から生成する kpi-tree.json が正典 (週次 CI の再生成を待たずに出すため id で結合する)
 * - 商品の週次実売は revenue-history.json を、週次 Issue と同じ関数 (product-revenue.mjs) で計算する
 */

const CYCLE = "data/measurement-cycle/latest.json";
const TREE = ".claude/state/business-plan/kpi-tree.json";
const REVENUE_HISTORY = "data/authenticated/revenue-history.json";

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
      return {
        week: cycle.week,
        generatedAt: cycle.generatedAt,
        compareWeek: cycle.kpiTree.compareWeek,
        improvements: cycle.kpiTree.improvements,
        focusWithoutImprovements: cycle.kpiTree.focusWithoutImprovements,
        nodes: cycle.kpiTree.nodes.map((n) => ({ ...n, target: targets.get(n.id) ?? null })),
      };
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
  const jst = new Date(now.getTime() + 9 * 3600_000);
  const day = (jst.getUTCDay() + 6) % 7; // 月曜 = 0
  const end = new Date(jst);
  end.setUTCDate(jst.getUTCDate() - day - 1);
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - 6);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { weekStart: iso(start), weekEnd: iso(end) };
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
