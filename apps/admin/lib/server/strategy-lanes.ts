import "server-only";

import path from "node:path";

import { projectRoot } from "./project-root";

/**
 * 戦略レーン (収益化戦略 §5 の優先順位表) と、月次・週次・バックログの配線状態。**読み取り専用**。
 *
 * ★判定は自前で持たず `.claude/scripts/lib/strategy-lanes.cjs` を共有する。docs:check (DG073〜078) と
 *   同じ実体なので、画面の警告と CI の警告がずれない。.cjs の読み込みは todo.ts と同じ eval("require")。
 */

export type Stance = "攻める" | "維持" | "凍結";
type Tier = "high" | "mid" | "low" | "hold";

interface LibLane {
  order: number;
  name: string;
  stance: Stance;
  aim: string;
  gate: string;
  improvementMetrics: string[];
}
interface LibCard {
  id: string | null;
  title: string;
  tier: Tier;
  kind: string | null;
  lane: string | null;
  due: string | null;
  line: number;
}
interface LibRef {
  id: string;
  lane: string | null;
  source: "backlog" | "improvements" | null;
}
interface LibWeeklyItem {
  section: "Must" | "Should" | "Could";
  line: number;
  done: boolean;
  text: string;
  refs: LibRef[];
  lanes: string[];
  status: "aligned" | "off-focus" | "unresolved" | "frozen";
}
interface LibIssue {
  level: "error" | "warning";
  code: string;
  file: string;
  message: string;
}
interface LibBoard {
  lanes: LibLane[];
  focusLanes: string[] | null;
  cards: LibCard[];
  idIndex: Map<string, { lane: string | null; source: string }>;
  weekly: LibWeeklyItem[];
  issues: LibIssue[];
}
type StrategyLanesLib = {
  STRATEGY_DOC: string;
  laneBoard: (root: string) => LibBoard;
};

let cachedLib: StrategyLanesLib | null = null;
function lib(): StrategyLanesLib {
  if (cachedLib) return cachedLib;
  const abs = path.join(projectRoot(), ".claude/scripts/lib/strategy-lanes.cjs");
  const nativeRequire = eval("require") as NodeRequire;
  cachedLib = nativeRequire(abs) as StrategyLanesLib;
  if (!cachedLib) throw new Error(`strategy-lanes.cjs を読み込めません: ${abs}`);
  return cachedLib;
}

export interface LaneCard {
  id: string | null;
  title: string;
  tier: Tier;
  kind: string | null;
  due: string | null;
}

export interface LaneView extends LibLane {
  isFocus: boolean;
  cards: LaneCard[];
  tierCounts: Record<Tier, number>;
  improvementIds: string[];
  weeklyCount: number;
}

export interface StrategyLaneBoard {
  strategyDoc: string;
  lanes: LaneView[];
  focusLanes: string[] | null;
  weekly: LibWeeklyItem[];
  issues: LibIssue[];
  totalCards: number;
  unlanedCards: LaneCard[];
  error?: string;
}

const toLaneCard = (c: LibCard): LaneCard => ({
  id: c.id,
  title: c.title,
  tier: c.tier,
  kind: c.kind,
  due: c.due,
});

export function strategyLaneBoard(): StrategyLaneBoard {
  try {
    const l = lib();
    const board = l.laneBoard(projectRoot());
    const focus = new Set(board.focusLanes ?? []);
    const lanes = board.lanes.map((lane): LaneView => {
      const cards = board.cards.filter((c) => c.lane === lane.name);
      const tierCounts: Record<Tier, number> = { high: 0, mid: 0, low: 0, hold: 0 };
      for (const c of cards) tierCounts[c.tier] += 1;
      const improvementIds = [...board.idIndex.entries()]
        .filter(([, v]) => v.source === "improvements" && v.lane === lane.name)
        .map(([id]) => id);
      return {
        ...lane,
        isFocus: focus.has(lane.name),
        cards: cards.map(toLaneCard),
        tierCounts,
        improvementIds,
        weeklyCount: board.weekly.filter((w) => w.lanes.includes(lane.name)).length,
      };
    });
    return {
      strategyDoc: l.STRATEGY_DOC,
      lanes,
      focusLanes: board.focusLanes,
      weekly: board.weekly,
      issues: board.issues,
      totalCards: board.cards.length,
      unlanedCards: board.cards.filter((c) => !c.lane).map(toLaneCard),
    };
  } catch (e) {
    return {
      strategyDoc: "docs/00_プロジェクト管理/02_収益化戦略.md",
      lanes: [],
      focusLanes: null,
      weekly: [],
      issues: [],
      totalCards: 0,
      unlanedCards: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
