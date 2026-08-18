import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * テスト用の隔離 project root を構築するヘルパ。
 *
 * project-root.ts は `<root>/package.json` の name === "stats47-monorepo" を検証し、
 * posts-store.ts は `<root>/.claude/scripts/lib/sns-posts-store.cjs` を実行時 require する。
 * → fixture root にこの 2 つを用意すれば、全ての読み書きが fixture 配下に閉じ、
 *   実 SSOT (.claude/state/sns/posts.json 等) には一切触れない。
 *
 * 使い方 (テスト側):
 *   const root = makeFixtureRoot();          // beforeEach
 *   process.env.STATS47_PROJECT_ROOT = root;
 *   vi.resetModules();                        // project-root / posts-store のキャッシュを捨てる
 *   const mod = await import("@/lib/server/...");
 *   ...
 *   cleanupFixtureRoot(root);                 // afterEach
 */

// 実物の store をコピーする (fixture の posts.json に読み書きさせる)。
const REAL_STORE = path.resolve(
  __dirname,
  "../../../../.claude/scripts/lib/sns-posts-store.cjs",
);
const REAL_PARSE_CORE = path.resolve(
  __dirname,
  "../../../../.claude/scripts/backlog-loop/parse-backlog-core.cjs",
);

export interface SeedPost {
  id: number;
  platform: string;
  status: string;
  domain?: string | null;
  content_key?: string | null;
  caption?: string | null;
  post_type?: string | null;
  scheduled_at?: string | null;
  posted_at?: string | null;
  media_path?: string | null;
  deleted_at?: string | null;
  template?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface FixtureOptions {
  posts?: SeedPost[];
  /** { "instagram-w29-schedule.json": [ {date,type,domain,content_key}, ... ] } */
  igSchedules?: Record<string, unknown[]>;
  /** .local/sns-gallery-state.json の内容 */
  galleryState?: Record<string, unknown>;
  /** .local/r2/sns 配下に作る相対パス (ダミーファイルを touch) */
  localSnsFiles?: string[];
  /** .claude/todo 配下に作る { ファイル名: 内容 }。指定時は parse-backlog-core.cjs も実物をコピーする */
  todoFiles?: Record<string, string>;
}

/** os.tmpdir() 配下に隔離 root を作り、必要なファイルを配置して絶対パスを返す。 */
export function makeFixtureRoot(opts: FixtureOptions = {}): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "gallery-fixture-"));

  // 1) package.json (name 検証を通す)
  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({ name: "stats47-monorepo", private: true }, null, 2),
  );

  // 2) 実物 sns-posts-store.cjs をコピー
  const libDir = path.join(root, ".claude/scripts/lib");
  fs.mkdirSync(libDir, { recursive: true });
  fs.copyFileSync(REAL_STORE, path.join(libDir, "sns-posts-store.cjs"));

  // 3) posts.json seed
  const snsStateDir = path.join(root, ".claude/state/sns");
  fs.mkdirSync(snsStateDir, { recursive: true });
  const posts = opts.posts ?? [];
  const nextId = posts.reduce((m, p) => Math.max(m, p.id || 0), 0) + 1;
  fs.writeFileSync(
    path.join(snsStateDir, "posts.json"),
    JSON.stringify({ _meta: { nextId, count: posts.length }, posts }, null, 2),
  );

  // 4) IG schedule ファイル群 (.claude/state 直下)
  const stateDir = path.join(root, ".claude/state");
  for (const [name, entries] of Object.entries(opts.igSchedules ?? {})) {
    fs.writeFileSync(
      path.join(stateDir, name),
      JSON.stringify(entries, null, 2) + "\n",
    );
  }

  // 5) gallery-state (.local/sns-gallery-state.json)
  const localDir = path.join(root, ".local");
  fs.mkdirSync(localDir, { recursive: true });
  if (opts.galleryState) {
    fs.writeFileSync(
      path.join(localDir, "sns-gallery-state.json"),
      JSON.stringify(opts.galleryState, null, 2),
    );
  }

  // 6) ローカル SNS 素材 (.local/r2/sns 配下)
  for (const rel of opts.localSnsFiles ?? []) {
    const abs = path.join(root, ".local/r2/sns", rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, "dummy");
  }

  // 7) TODO 台帳 (.claude/todo) と実物パーサ
  if (opts.todoFiles) {
    const todoDir = path.join(root, ".claude/todo");
    fs.mkdirSync(todoDir, { recursive: true });
    for (const [name, body] of Object.entries(opts.todoFiles)) {
      fs.writeFileSync(path.join(todoDir, name), body);
    }
    // ★パーサは実物をコピーする。テスト用に別実装を置くと「テストは通るが本番は違う解釈」になる
    const coreDir = path.join(root, ".claude/scripts/backlog-loop");
    fs.mkdirSync(coreDir, { recursive: true });
    fs.copyFileSync(REAL_PARSE_CORE, path.join(coreDir, "parse-backlog-core.cjs"));
  }

  return root;
}

export function cleanupFixtureRoot(root: string): void {
  try {
    fs.rmSync(root, { recursive: true, force: true });
  } catch {
    // 後始末なので失敗は無視
  }
}

/** fixture の posts.json を読み返す (書込検証用)。 */
export function readPosts(root: string): SeedPost[] {
  const raw = fs.readFileSync(
    path.join(root, ".claude/state/sns/posts.json"),
    "utf-8",
  );
  return JSON.parse(raw).posts as SeedPost[];
}

/** fixture の IG schedule を読み返す。 */
export function readIgSchedule(root: string, name: string): unknown[] {
  const raw = fs.readFileSync(path.join(root, ".claude/state", name), "utf-8");
  return JSON.parse(raw);
}

/** fixture の gallery-state を読み返す。 */
export function readGalleryState(root: string): Record<string, unknown> {
  try {
    const raw = fs.readFileSync(
      path.join(root, ".local/sns-gallery-state.json"),
      "utf-8",
    );
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** git 管理された実 SSOT に diff が無いことを確認する (安全ガード)。 */
export function assertNoRealSsotDiff(): void {
  const repoRoot = path.resolve(__dirname, "../../../..");
  const out = execSync(
    "git status --short .claude/state .local 2>/dev/null || true",
    { cwd: repoRoot, encoding: "utf-8" },
  );
  if (out.trim() !== "") {
    throw new Error(`実 SSOT に diff が発生しました:\n${out}`);
  }
}
