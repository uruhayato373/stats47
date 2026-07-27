import "server-only";

import { loadAll } from "./posts-store";
import { igScheduleEntries } from "./instagram";
import { weekStartJst, jstDateStr } from "./time";

/**
 * 頻度リミットの残枠計算 (旧 server.mjs の LIMITS / computeLimits を忠実移植)。
 * 正典: sns-content-standards.md §1。値は旧実装と同一に保つ (x/ig=週3)。
 * YouTube は撤退済のため対象外 (過去実績は posts.json に platform=youtube のまま残す)。
 */
const LIMITS = {
  x: { per: "week", max: 3, label: "X 週2-3" },
  instagram: { per: "week", max: 3, label: "IG カルーセル2+リール1/週" },
} as const;

export interface LimitInfo {
  used: number;
  max: number;
  window: string;
  label: string;
  scheduledInJson?: number;
}

export function computeLimits(): {
  x: LimitInfo;
  instagram: LimitInfo;
} {
  const posts = loadAll();
  const wk = weekStartJst();
  const today = jstDateStr();
  const igScheduled = igScheduleEntries().filter((e) => e.date >= today).length;
  const count = (platform: string, since: string) =>
    posts.filter(
      (p) =>
        p.platform === platform &&
        (p.status === "posted" || p.status === "scheduled") &&
        ((p.posted_at || "") >= since || (p.scheduled_at || "") >= since),
    ).length;
  return {
    x: {
      used: count("x", wk),
      max: LIMITS.x.max,
      window: `week from ${wk}`,
      label: LIMITS.x.label,
    },
    instagram: {
      used: Math.max(count("instagram", wk), 0) + 0,
      scheduledInJson: igScheduled,
      max: LIMITS.instagram.max,
      window: `week from ${wk}`,
      label: LIMITS.instagram.label,
    },
  };
}
