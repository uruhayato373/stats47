import "server-only";

import fs from "node:fs";
import path from "node:path";

import { projectRoot } from "./project-root";

/**
 * TODO 台帳 (.claude/todo/*.md) の読み取り。**読み取り専用**で書き込み経路を持たない。
 *
 * ★パーサは自前で持たず `.claude/scripts/backlog-loop/parse-backlog-core.cjs` を共有する。
 *   backlog-loop (CI) と管理画面が別実装を持つと、同じ台帳を違う解釈で読む状態になり、
 *   画面で見えている件数と loop が処理する件数がずれる。同一実体なので parity テストも要らない。
 *   .cjs の読み込みは posts-store.ts と同じ eval("require") — webpack の静的解析を避ける
 *   (createRequire や素の require だとバンドルされて MODULE_NOT_FOUND になる)。
 */

type HeadingEntry = {
  id: string;
  title: string;
  section: string;
  sourceFile: string;
  startLine: number;
  endLine: number;
  fields: Record<string, string>;
  body: string;
};

type ParseCore = {
  parseHeadingEntries: (
    text: string,
    sourceFile: string,
  ) => { entries: HeadingEntry[]; lineCount: number };
  parseTableRows: (text: string, sourceFile: string) => unknown;
};

let cachedCore: ParseCore | null = null;
function core(): ParseCore {
  if (cachedCore) return cachedCore;
  const abs = path.join(projectRoot(), ".claude/scripts/backlog-loop/parse-backlog-core.cjs");
  const nativeRequire = eval("require") as NodeRequire;
  cachedCore = nativeRequire(abs) as ParseCore;
  if (!cachedCore) throw new Error(`parse-backlog-core.cjs を読み込めません: ${abs}`);
  return cachedCore;
}

export const TODO_DIR = ".claude/todo";

/** 台帳の構成。順序は 00_運用ガイド.md の「ファイル構成」と揃える */
export const TODO_FILES = [
  { key: "guide", file: "00_運用ガイド.md", label: "運用ガイド", kind: "prose" },
  { key: "inbox", file: "01_未整理タスク.md", label: "未整理タスク", kind: "table" },
  { key: "monthly", file: "02_今月の重点.md", label: "今月の重点", kind: "prose" },
  { key: "weekly", file: "03_今週の計画.md", label: "今週の計画", kind: "prose" },
  { key: "improvement", file: "04_改善バックログ.md", label: "改善バックログ", kind: "table" },
  { key: "feature", file: "05_機能バックログ.md", label: "機能バックログ", kind: "heading" },
  { key: "indicator", file: "06_指標バックログ.md", label: "指標バックログ", kind: "table" },
] as const;

export type TodoFileKey = (typeof TODO_FILES)[number]["key"];

export type TodoEntry = {
  id: string;
  title: string;
  section: string;
  status: string | null;
  tier: string | null;
  owner: string | null;
  created: string | null;
  startLine: number;
  fileKey: TodoFileKey;
};

export type TodoFileSummary = {
  key: TodoFileKey;
  file: string;
  label: string;
  /** リポジトリ相対パス (エディタで開くリンク用) */
  rel: string;
  abs: string;
  exists: boolean;
  updated: string | null;
  lineCount: number;
  entryCount: number;
};

export type TodoSummary = {
  files: TodoFileSummary[];
  /** 見出し型 (05) のエントリ。件数が多いので一覧表示の主対象 */
  featureEntries: TodoEntry[];
  inboxRows: { date: string; body: string; kind: string }[];
  error?: string;
};

function frontmatterValue(md: string, key: string): string | null {
  const m = md.match(new RegExp(`^${key}:\s*(.+)$`, "m"));
  return m ? m[1].trim() : null;
}

/**
 * 01_未整理タスク.md の 4 列テーブル。parse-backlog-core の parseTableRows は
 * 06 の 7 列を前提にしているので、こちらは行分割だけの素朴な読み取りにする
 * (機械契約ではなく画面表示用)。
 */
function parseInbox(md: string) {
  const rows: { date: string; body: string; kind: string }[] = [];
  for (const line of md.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 4) continue;
    if (cells[0] === "日付" || /^-+$/.test(cells[0].replace(/[:\s]/g, "-"))) continue;
    rows.push({ date: cells[0], body: cells[1], kind: cells[2] });
  }
  return rows;
}

export function todoSummary(): TodoSummary {
  try {
    const root = projectRoot();
    const files: TodoFileSummary[] = [];
    let featureEntries: TodoEntry[] = [];
    let inboxRows: TodoSummary["inboxRows"] = [];

    for (const def of TODO_FILES) {
      const rel = `${TODO_DIR}/${def.file}`;
      const abs = path.join(root, rel);
      if (!fs.existsSync(abs)) {
        files.push({ ...def, rel, abs, exists: false, updated: null, lineCount: 0, entryCount: 0 });
        continue;
      }
      const md = fs.readFileSync(abs, "utf8");
      let entryCount = 0;

      if (def.kind === "heading") {
        const parsed = core().parseHeadingEntries(md, rel);
        entryCount = parsed.entries.length;
        featureEntries = parsed.entries.map((e) => ({
          id: e.id,
          title: e.title,
          section: e.section,
          status: e.fields.status ?? null,
          tier: e.fields.tier ?? null,
          owner: e.fields.owner ?? null,
          created: e.fields.created ?? null,
          startLine: e.startLine,
          fileKey: def.key,
        }));
      } else if (def.key === "inbox") {
        inboxRows = parseInbox(md);
        entryCount = inboxRows.length;
      } else if (def.kind === "table") {
        entryCount = md
          .split("\n")
          .filter((l) => l.startsWith("|") && !/^\|\s*(ID|priority|日付)/.test(l) && !/^\|[-:\s|]+\|$/.test(l))
          .length;
      }

      files.push({
        ...def,
        rel,
        abs,
        exists: true,
        updated: frontmatterValue(md, "updated"),
        lineCount: md.split("\n").length,
        entryCount,
      });
    }

    return { files, featureEntries, inboxRows };
  } catch (e) {
    return {
      files: [],
      featureEntries: [],
      inboxRows: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
