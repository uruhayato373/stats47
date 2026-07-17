import "server-only";

import fs from "node:fs";
import path from "node:path";

import { stateDir } from "./project-root";
import { jstDateStr } from "./time";
import { insert, query, type Post } from "./posts-store";

/**
 * Instagram の schedule JSON (.claude/state/instagram-w*-schedule.json) 操作。
 * 旧 server.mjs の igScheduleFiles / igScheduleEntries / igConsistency / scheduleIg を忠実移植。
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

export interface ScheduleIgInput {
  date: string;
  time?: string;
  type: string;
  domain: string;
  content_key: string;
  caption?: string | null;
}

/**
 * IG 予約登録: schedule JSON への entry 追記と posts.json への scheduled insert を同一関数内で
 * 連続実行 (二重書込)。旧実装忠実:
 * - date/type/domain/content_key 必須
 * - date は YYYY-MM-DD
 * - 過去日 (JST 今日より前) は拒否
 * - 追記先はその date を含む週ファイル、無ければ最新ファイル
 * - 同一日に既に entry があれば拒否 (IG cron は 1 日 1 件)
 * 業務エラーは Error を throw (呼び元 route が 400 化)。
 */
export function scheduleIg(input: ScheduleIgInput): { file: string; postId: number } {
  const { date, time = "08:00", type, domain, content_key, caption } = input;
  if (!date || !type || !domain || !content_key) {
    throw new Error("date/type/domain/content_key は必須");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("date は YYYY-MM-DD");
  if (date < jstDateStr()) throw new Error("過去日は指定不可");

  const files = igScheduleFiles();
  if (files.length === 0) throw new Error("instagram-w*-schedule.json が見つからない");

  let target: string | null = null;
  for (const f of files) {
    try {
      const entries: IgScheduleEntry[] = JSON.parse(fs.readFileSync(f, "utf-8"));
      const dates = entries.map((e) => e.date).sort();
      if (dates.length && date >= dates[0] && date <= dates[dates.length - 1]) {
        target = f;
        break;
      }
    } catch {
      // skip
    }
  }
  if (!target) target = files[files.length - 1];

  const entries: IgScheduleEntry[] = JSON.parse(fs.readFileSync(target, "utf-8"));
  if (entries.some((e) => e.date === date)) {
    throw new Error(
      `${date} には既に予約あり (${path.basename(target)})。IG cron は 1 日 1 件`,
    );
  }
  entries.push({ date, time, type, domain, content_key });
  entries.sort((a, b) => (a.date < b.date ? -1 : 1));
  fs.writeFileSync(target, JSON.stringify(entries, null, 2) + "\n");

  // posts.json にも scheduled を insert (SSOT へ反映)
  const row: Post = insert({
    platform: "instagram",
    post_type: type,
    domain,
    content_key,
    caption: caption ?? null,
    status: "scheduled",
    scheduled_at: `${date} ${time}:00`,
    template: null,
  });
  return { file: path.basename(target), postId: row.id };
}
