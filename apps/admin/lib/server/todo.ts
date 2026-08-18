import "server-only";

import fs from "node:fs";
import path from "node:path";

import { projectRoot } from "./project-root";

/**
 * TODO 台帳 (.claude/todo/*.md) の読み取り。**読み取り専用**で書き込み経路を持たない。
 *
 * ★パーサは自前で持たず `.claude/scripts/lib/backlog-lib.cjs` (v3-unified の単一実装。
 *   doboku-note と統一のカード構文) を共有する。backlog-loop (CI)・docs-governance・
 *   管理画面が同じ実体を使うので、画面で見えている件数と loop が処理する件数がずれない。
 *   .cjs の読み込みは posts-store.ts と同じ eval("require") — webpack の静的解析を避ける。
 *
 * 層の構成は backlog-lib の TODO_LAYER_FILES が真実源。ここが持つのは表示メタ
 * (ラベル・パースモード) だけ (doboku-note tools/admin-app/src/lib/todo.ts と同型)。
 */

type LibCard = {
  line: number;
  startLine: number;
  endLine: number;
  id: string | null;
  tier: Tier;
  title: string;
  category: string;
  kind: string | null;
  executor: string | null;
  verify: string | null;
  filed: string | null;
  due: string | null;
  codex: boolean;
  wip: boolean;
  hasTagLine: boolean;
  body: string;
};

type BacklogLib = {
  TODO_DIR: string;
  TODO_LAYER_FILES: string[];
  TIER: Record<string, Tier>;
  KINDS: string[];
  EXECUTORS: string[];
  parseBacklog: (text: string) => LibCard[];
};

let cachedLib: BacklogLib | null = null;
function lib(): BacklogLib {
  if (cachedLib) return cachedLib;
  const abs = path.join(projectRoot(), ".claude/scripts/lib/backlog-lib.cjs");
  const nativeRequire = eval("require") as NodeRequire;
  cachedLib = nativeRequire(abs) as BacklogLib;
  if (!cachedLib) throw new Error(`backlog-lib.cjs を読み込めません: ${abs}`);
  return cachedLib;
}

export type Tier = "high" | "mid" | "low" | "hold";
export type LayerId = "backlog" | "weekly" | "monthly" | "improvements";

interface LayerMeta {
  id: LayerId;
  label: string;
  mode: "backlog" | "sections" | "improvements";
  /** sections モードでカードとして拾う見出しレベル */
  level?: number;
}

/** 表示メタだけを持つ。「どのファイルが層か」は backlog-lib の TODO_LAYER_FILES が真実源。 */
const LAYER_META: Record<string, LayerMeta> = {
  "backlog.md": { id: "backlog", label: "バックログ", mode: "backlog" },
  "weekly.md": { id: "weekly", label: "週間", mode: "sections", level: 2 },
  "monthly.md": { id: "monthly", label: "月間", mode: "sections", level: 3 },
  "improvements.md": { id: "improvements", label: "改善", mode: "improvements" },
};

export interface TodoCard {
  layer: LayerId;
  layerLabel: string;
  /** リポジトリ相対パス */
  path: string;
  abs: string;
  line: number;
  id: string | null;
  tier: Tier | null;
  title: string;
  kind: string | null;
  executor: string | null;
  verify: string | null;
  filed: string | null;
  due: string | null;
  codex: boolean;
  wip: boolean;
  body: string;
}

/** improvements.md (6 列テーブル・improvement-triage 排他 write) の 1 行 */
export interface ImprovementRow {
  tierLabel: string;
  id: string;
  title: string;
  status: string;
  due: string;
  owner: string;
  metric: string;
  line: number;
}

export interface TodoLayerSummary {
  id: LayerId;
  label: string;
  file: string;
  rel: string;
  abs: string;
  exists: boolean;
  updated: string | null;
  count: number;
}

export interface TodoBoard {
  layers: TodoLayerSummary[];
  /** backlog / weekly / monthly のカード (improvements は表なので rows 側) */
  items: TodoCard[];
  improvements: ImprovementRow[];
  /** ファセットの語彙 (宣言順で固定 — 件数順にすると押すたびに並びが動く) */
  kinds: string[];
  executors: string[];
  error?: string;
}

function frontmatterValue(md: string, key: string): string | null {
  const m = md.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return m ? m[1].trim() : null;
}

function tierOf(text: string, tiers: Record<string, Tier>): Tier | null {
  for (const [emoji, tier] of Object.entries(tiers)) if (text.includes(emoji)) return tier;
  return null;
}

/** weekly / monthly: 見出し単位でカード化する (タグ行は無い層) */
function parseSections(
  md: string,
  meta: LayerMeta,
  rel: string,
  abs: string,
  tiers: Record<string, Tier>,
): TodoCard[] {
  const out: TodoCard[] = [];
  const level = meta.level ?? 2;
  const open = new RegExp(`^#{${level}}\\s+(.*)`);
  const close = new RegExp(`^#{1,${level}}\\s+`);
  let cur: (TodoCard & { bodyLines: string[] }) | null = null;
  const flush = () => {
    if (!cur) return;
    const { bodyLines, ...card } = cur;
    card.body = bodyLines.join("\n").trim();
    out.push(card);
    cur = null;
  };
  md.split(/\r?\n/).forEach((ln, i) => {
    const m = ln.match(open);
    if (m) {
      flush();
      const title = m[1].trim();
      cur = {
        layer: meta.id,
        layerLabel: meta.label,
        path: rel,
        abs,
        line: i + 1,
        id: null,
        tier: tierOf(title, tiers),
        title,
        kind: null,
        executor: null,
        verify: null,
        filed: null,
        due: null,
        codex: false,
        wip: false,
        body: "",
        bodyLines: [],
      };
      return;
    }
    if (cur && close.test(ln)) {
      flush();
      return;
    }
    if (cur) cur.bodyLines.push(ln);
  });
  flush();
  return out;
}

/** improvements.md: `## Tier N` 見出し + 6 列 pipe テーブル */
function parseImprovements(md: string): ImprovementRow[] {
  const rows: ImprovementRow[] = [];
  let tierLabel = "";
  md.split(/\r?\n/).forEach((ln, i) => {
    const h = ln.match(/^## (Tier .+)$/);
    if (h) {
      tierLabel = h[1];
      return;
    }
    if (!tierLabel || !ln.startsWith("|")) return;
    const cells = ln.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length !== 6 || cells[0] === "ID" || /^[-:\s]+$/.test(cells[0])) return;
    const [id, title, status, due, owner, metric] = cells;
    rows.push({ tierLabel, id, title, status, due, owner, metric, line: i + 1 });
  });
  return rows;
}

export function todoBoard(): TodoBoard {
  try {
    const root = projectRoot();
    const l = lib();
    const layers: TodoLayerSummary[] = [];
    const items: TodoCard[] = [];
    let improvements: ImprovementRow[] = [];

    for (const file of l.TODO_LAYER_FILES) {
      const meta = LAYER_META[file];
      // 層を増やしたのに表示メタを足し忘れたら、黙って 1 タブ消えるのではなく起動時に落とす
      if (!meta) throw new Error(`${l.TODO_DIR}/${file} の表示メタが未定義 (LAYER_META に追加する)`);
      const rel = `${l.TODO_DIR}/${file}`;
      const abs = path.join(root, rel);
      if (!fs.existsSync(abs)) {
        layers.push({ ...meta, file, rel, abs, exists: false, updated: null, count: 0 });
        continue;
      }
      const md = fs.readFileSync(abs, "utf8");
      let count = 0;
      if (meta.mode === "backlog") {
        const cards = l.parseBacklog(md).map((c) => ({
          layer: meta.id,
          layerLabel: meta.label,
          path: rel,
          abs,
          line: c.line,
          id: c.id,
          tier: c.tier,
          title: c.title,
          kind: c.kind,
          executor: c.executor,
          verify: c.verify,
          filed: c.filed,
          due: c.due,
          codex: c.codex,
          wip: c.wip,
          body: c.body,
        }));
        items.push(...cards);
        count = cards.length;
      } else if (meta.mode === "sections") {
        const cards = parseSections(md, meta, rel, abs, l.TIER);
        items.push(...cards);
        count = cards.length;
      } else {
        improvements = parseImprovements(md);
        count = improvements.length;
      }
      layers.push({
        ...meta,
        file,
        rel,
        abs,
        exists: true,
        updated: frontmatterValue(md, "updated"),
        count,
      });
    }

    return { layers, items, improvements, kinds: l.KINDS, executors: l.EXECUTORS };
  } catch (e) {
    return {
      layers: [],
      items: [],
      improvements: [],
      kinds: [],
      executors: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
