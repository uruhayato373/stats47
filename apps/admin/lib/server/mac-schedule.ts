import "server-only";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { projectRoot } from "./project-root";
import { wrap } from "./state-io";

/**
 * Mac の launchd で動く定期実行 (読み取り専用)。管理画面は子プロセスを起動しない契約なので launchctl は呼ばず、
 * 次の 3 つのファイルを読む。
 *   - 定義: リポジトリの scripts/scheduled/*.plist
 *   - この Mac への登録: ~/Library/LaunchAgents/<Label>.plist (定義と時刻が一致しているか。2026-10-26 に土曜へ移した
 *     3 本が、リポジトリだけ直して Mac では旧時刻のまま動いていたため)
 *   - 結果: ~/Library/Logs/stats47/<名前>.log の `=== <時刻> [<名前>] start / ok / FAILED rc=N ===` (_common.sh の log_run が書く)
 * 土曜ランナー (scripts/scheduled/weekly-saturday.sh) は段ごとのログと、週次監査の要約 .local/weekly-audits/<日付>/summary.json も読む。
 */

export const SCHEDULE_DIR = "scripts/scheduled";
export const WEEKLY_AUDITS_DIR = ".local/weekly-audits";
const LAUNCH_AGENTS = path.join(os.homedir(), "Library/LaunchAgents");
const LOG_DIR = path.join(os.homedir(), "Library/Logs/stats47");

export interface CalendarSlot {
  weekday: number | null;
  hour: number | null;
  minute: number | null;
}
export interface PlistDef {
  label: string;
  script: string | null;
  slots: CalendarSlot[];
  intervalSeconds: number | null;
  runAtLoad: boolean;
}
export interface LogStatus {
  /** 最後に始まった時刻 */
  startedAt: string | null;
  /** start の後に ok / FAILED が無ければ running (動いている途中か、途中で止まった) */
  result: "ok" | "failed" | "running" | "none";
  rc: number | null;
  finishedAt: string | null;
  detail: string | null;
}
export interface MacJob {
  file: string;
  def: PlistDef;
  installed: "same" | "different" | "missing";
  installedSlots: CalendarSlot[] | null;
  log: LogStatus;
}
export interface WeeklyAuditResult {
  id: string;
  label: string;
  status: "pass" | "fail" | "timeout";
  minutes: number;
}
export interface MacSchedule {
  /** この端末に launchd のフォルダがあるか (Windows や別の Mac では false) */
  isLaunchdHost: boolean;
  jobs: MacJob[];
  /** リポジトリに定義が無いのに、この Mac に stats47 の名前で登録されているもの */
  strayInstalled: string[];
  /** リポジトリの台本が自分で登録を作るもの (local-resources.sh など。plist はリポジトリに置かない) */
  scriptInstalled: string[];
  saturday: {
    steps: Array<{ id: string; label: string; log: LogStatus }>;
    audits: { day: string; results: WeeklyAuditResult[] } | null;
  };
}

/** 土曜ランナーの段 (weekly-saturday.sh の `step <名前>` と同じ順。名前はログのファイル名) */
export const SATURDAY_STEPS = [
  { id: "measurement", label: "認証付き計測 (ログイン → 取得 → 記録)" },
  { id: "note-metrics", label: "note の計測 (表紙監査 + ダッシュボード)" },
  { id: "scout-asp", label: "ASP の巡回 (A8 の審査確認・精選・コード取得)" },
  { id: "weekly-audits", label: "週次監査 11 本 (専用 clone で回して記録を push)" },
] as const;

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

/** launchd の時刻を読める形にする (plist の時刻は Mac の現地時刻 = 日本時間) */
export function slotLabel(s: CalendarSlot): string {
  const time = s.hour === null ? "毎時" : `${String(s.hour).padStart(2, "0")}:${String(s.minute ?? 0).padStart(2, "0")}`;
  return s.weekday === null ? `毎日 ${time}` : `毎週${DOW[s.weekday % 7]} ${time}`;
}

function intOf(dict: string, key: string): number | null {
  const m = dict.match(new RegExp(`<key>${key}</key>\\s*<integer>(\\d+)</integer>`));
  return m ? Number(m[1]) : null;
}

function stripCommentsOnce(xml: string): string {
  let out = "";
  let from = 0;
  for (;;) {
    const open = xml.indexOf("<!--", from);
    if (open < 0) return out + xml.slice(from);
    out += xml.slice(from, open);
    const close = xml.indexOf("-->", open + 4);
    if (close < 0) return out;
    from = close + 3;
  }
}

/** `<!--` から `-->` までを切り落とす (閉じていないコメントは残りごと落とす)。1 回では消した跡に `<!--` が
 *  組み上がる形 (`<!<!-- x -->-- y -->`) が残るので、変化が無くなるまで繰り返す (CodeQL の incomplete multi-character sanitization) */
export function stripXmlComments(xml: string): string {
  let current = xml;
  for (;;) {
    const next = stripCommentsOnce(current);
    if (next === current) return next;
    current = next;
  }
}

/** plist の必要な項目だけを読む (コメントは除いてから読む。コメントに書いた手順の <key> を拾わない) */
export function parsePlist(xml: string): PlistDef {
  const body = stripXmlComments(xml);
  const label = body.match(/<key>Label<\/key>\s*<string>([^<]+)<\/string>/)?.[1] ?? "";
  const args = body.match(/<key>ProgramArguments<\/key>\s*<array>([\s\S]*?)<\/array>/)?.[1] ?? "";
  const strings = [...args.matchAll(/<string>([^<]+)<\/string>/g)].map((m) => m[1]);
  const script = strings.find((s) => /\.(sh|mjs|cjs|js|ts)$/.test(s)) ?? null;
  const cal = body.match(/<key>StartCalendarInterval<\/key>\s*(<array>[\s\S]*?<\/array>|<dict>[\s\S]*?<\/dict>)/)?.[1] ?? "";
  const dicts = [...cal.matchAll(/<dict>([\s\S]*?)<\/dict>/g)].map((m) => m[1]);
  const slots = dicts.map((d) => ({ weekday: intOf(d, "Weekday"), hour: intOf(d, "Hour"), minute: intOf(d, "Minute") }));
  return {
    label,
    script,
    slots,
    intervalSeconds: intOf(body, "StartInterval"),
    runAtLoad: /<key>RunAtLoad<\/key>\s*<true\/>/.test(body),
  };
}

/** log_run が書いた最後の実行を読む */
export function parseLog(text: string, name: string): LogStatus {
  const none: LogStatus = { startedAt: null, result: "none", rc: null, finishedAt: null, detail: null };
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^=== (\\S+) \\[${escaped}\\] (start|ok|FAILED)(?: rc=(\\d+))?(?:[: ](.*?))? ===$`, "gm");
  let status = none;
  for (const m of text.matchAll(re)) {
    const [, at, kind, rc, detail] = m;
    if (kind === "start") status = { startedAt: at, result: "running", rc: null, finishedAt: null, detail: null };
    else if (status.startedAt)
      status = { ...status, result: kind === "ok" ? "ok" : "failed", rc: rc ? Number(rc) : null, finishedAt: at, detail: detail?.trim() || null };
  }
  return status;
}

function readLog(name: string): LogStatus {
  const file = path.join(LOG_DIR, `${name}.log`);
  if (!fs.existsSync(file)) return parseLog("", name);
  return parseLog(fs.readFileSync(file, "utf8"), name);
}

function sameSlots(a: CalendarSlot[], b: CalendarSlot[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function latestAudits(): MacSchedule["saturday"]["audits"] {
  const dir = path.join(projectRoot(), WEEKLY_AUDITS_DIR);
  if (!fs.existsSync(dir)) return null;
  const days = fs.readdirSync(dir).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse();
  for (const day of days) {
    const file = path.join(dir, day, "summary.json");
    if (!fs.existsSync(file)) continue;
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as { day: string; results: WeeklyAuditResult[] };
    return { day: parsed.day ?? day, results: parsed.results ?? [] };
  }
  return null;
}

export function macSchedule() {
  return wrap((): MacSchedule => {
    const dir = path.join(projectRoot(), SCHEDULE_DIR);
    const isLaunchdHost = fs.existsSync(LAUNCH_AGENTS);
    const jobs = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".plist"))
      .sort()
      .map((file): MacJob => {
        const def = parsePlist(fs.readFileSync(path.join(dir, file), "utf8"));
        const installedFile = path.join(LAUNCH_AGENTS, `${def.label}.plist`);
        const installedDef = fs.existsSync(installedFile) ? parsePlist(fs.readFileSync(installedFile, "utf8")) : null;
        return {
          file,
          def,
          installed: !installedDef ? "missing" : sameSlots(installedDef.slots, def.slots) && installedDef.script === def.script ? "same" : "different",
          installedSlots: installedDef?.slots ?? null,
          log: readLog(def.label.replace(/^com\.stats47\./, "")),
        };
      });
    const known = new Set(jobs.map((j) => `${j.def.label}.plist`));
    const scripts = fs.readdirSync(dir).filter((f) => f.endsWith(".sh")).map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
    const unlisted = isLaunchdHost
      ? fs.readdirSync(LAUNCH_AGENTS).filter((f) => f.startsWith("com.stats47.") && f.endsWith(".plist") && !known.has(f)).sort()
      : [];
    const scriptInstalled = unlisted.filter((f) => scripts.includes(f.replace(/\.plist$/, "")));
    const strayInstalled = unlisted.filter((f) => !scriptInstalled.includes(f));
    return {
      isLaunchdHost,
      jobs,
      strayInstalled,
      scriptInstalled,
      saturday: {
        steps: SATURDAY_STEPS.map((s) => ({ ...s, log: readLog(s.id) })),
        audits: latestAudits(),
      },
    };
  });
}
