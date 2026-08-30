import "server-only";

import fs from "node:fs";
import path from "node:path";

import { stateDir } from "./project-root";
import { jstDateStr } from "./time";
import { query } from "./posts-store";

/**
 * Instagram の schedule JSON (.claude/state/instagram-w*-schedule.json) を読み取り、
 * 投稿台帳との整合性を表示する。管理画面は読み取り専用であり、予約登録は行わない。
 */
export interface IgScheduleEntry {
  date: string;
  time?: string;
  type: string;
  domain: string;
  content_key: string;
  _file?: string;
  [key: string]: unknown;
}

/** instagram-w<N>-schedule.json を名前順で返す (絶対パス配列)。 */
export function igScheduleFiles(): string[] {
  return fs
    .readdirSync(stateDir())
    .filter((f) => /^instagram-w\d+-schedule\.json$/.test(f))
    .sort()
    .map((f) => path.join(stateDir(), f));
}

/** 全 schedule ファイルの entry を _file 付きで平坦化して返す。 */
export function igScheduleEntries(): IgScheduleEntry[] {
  const out: IgScheduleEntry[] = [];
  for (const f of igScheduleFiles()) {
    try {
      const entries = JSON.parse(fs.readFileSync(f, "utf-8"));
      if (Array.isArray(entries)) {
        for (const e of entries) out.push({ ...e, _file: path.basename(f) });
      }
    } catch {
      // 壊れた JSON はスキップ (旧実装と同じ・堅牢性のため)
    }
  }
  return out;
}

/** schedule JSON と posts.json の整合性 (未来分)。 */
export function igConsistency(): {
  onlyInJson: IgScheduleEntry[];
  onlyInPosts: Array<{ id: number; date: string; content_key: string | null }>;
} {
  const today = jstDateStr();
  const jsonEntries = igScheduleEntries().filter((e) => e.date >= today);
  const posts = query(
    (p) => p.platform === "instagram" && p.status === "scheduled" && !p.deleted_at,
  );
  const jsonKeys = new Set(jsonEntries.map((e) => `${e.date}|${e.content_key}`));
  const postKeys = new Set(
    posts.map((p) => `${(p.scheduled_at || "").slice(0, 10)}|${p.content_key}`),
  );
  return {
    onlyInJson: jsonEntries.filter(
      (e) => !postKeys.has(`${e.date}|${e.content_key}`),
    ),
    onlyInPosts: posts
      .filter(
        (p) => !jsonKeys.has(`${(p.scheduled_at || "").slice(0, 10)}|${p.content_key}`),
      )
      .map((p) => ({
        id: p.id,
        date: (p.scheduled_at || "").slice(0, 10),
        content_key: p.content_key,
      })),
  };
}
