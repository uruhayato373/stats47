import "server-only";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { projectRoot } from "./project-root";
import { wrap, type Wrapped } from "./state-io";

/**
 * この PC が使う MCP の一覧と接続状況 (読み取り専用)。接続状況は PC ごとに違うので保存せず、ページを開くたびに調べる。
 *
 * 読むファイルと状態の語彙は Claude Code の公式文書に合わせる (2026-11-14 に読んだ版):
 *   https://code.claude.com/docs/en/mcp
 *     - 同じ名前の定義は local > project > user の順で 1 つだけ使う (項目は scope をまたいで混ぜない)
 *     - project = リポジトリの .mcp.json / local・user = ~/.claude.json (local はそのプロジェクトのパスの下)
 *     - .mcp.json のサーバーは承認が要る (enabledMcpjsonServers・enableAllProjectMcpServers)。
 *       disabledMcpjsonServers はどの設定ファイルにあっても拒否になる
 *     - /mcp で切ったサーバーは ~/.claude.json のプロジェクトごとの disabledMcpServers に入る
 *     - 状態の表示: Connected / Needs authentication / Failed to connect / Pending approval / Rejected / Disabled for this project
 *   https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
 *     - Streamable HTTP の initialize は POST で、Accept に application/json と text/event-stream の両方を書く
 *
 * 守ること: 設定ファイルにはトークンが入りうる。値 (引数・URL の query・ヘッダー・環境変数) は返り値に入れず、
 * 名前と有無だけを返す。接続確認は資格情報を送らない (401 は「認証が要るサーバー」までしか分からない)。
 * stdio のサーバーは子プロセスの起動が要るので確認しない (管理画面は子プロセスを起動しない契約)。
 */
export type McpScope = "local" | "project" | "user";
/** /mcp の表示と同じ 4 つ。enabled だけが接続を試みる状態 */
export type McpState = "enabled" | "pending" | "rejected" | "disabled";
export type McpAuth = "none" | "token" | "oauth" | "unknown";
export type McpProbe = { status: number } | { error: string };

export interface McpServerRow {
  name: string;
  scope: McpScope;
  /** 同じ名前の定義がある、使われない方の scope */
  shadowed: McpScope[];
  transport: string;
  /** コマンドと最初の引数、または URL (query なし) */
  target: string;
  purpose: string | null;
  usedBy: string[];
  state: McpState;
  stateSource: string;
  auth: McpAuth;
  /** 認証に使う項目の名前 (値ではない) */
  authNote: string | null;
  /** トークンが設定にあるか。OAuth と認証なしは null (OAuth のトークンは Claude Code の資格情報の中なので読まない) */
  token: boolean | null;
  /** HTTP の initialize の応答。確認の対象外 (stdio・SSE・有効でない) は null */
  probe: McpProbe | null;
}

interface ServerDef {
  type?: string;
  command?: string;
  args?: unknown[];
  env?: Record<string, unknown>;
  url?: string;
  headers?: Record<string, unknown>;
  headersHelper?: unknown;
  oauth?: unknown;
}

interface McpSettings {
  enabledMcpjsonServers?: unknown;
  disabledMcpjsonServers?: unknown;
  enableAllProjectMcpServers?: unknown;
}

interface UserProject extends McpSettings {
  mcpServers?: Record<string, ServerDef>;
  disabledMcpServers?: unknown;
}

interface UserConfig {
  mcpServers?: Record<string, ServerDef>;
  projects?: Record<string, UserProject>;
}

interface Ledger {
  servers?: Record<string, { purpose?: string; usedBy?: string[] }>;
}

/** 環境変数の読み口 (テストは process.env を触らずに渡す) */
type EnvVars = Record<string, string | undefined>;

const SCOPE_ORDER: readonly McpScope[] = ["local", "project", "user"];
const SECRET_NAME = /token|secret|password|passwd|api[-_]?key|authorization|credential/i;
const ENV_REFERENCE = /\$\{([A-Za-z_][A-Za-z0-9_]*)(:-[^}]*)?\}/g;
const PROBE_TIMEOUT_MS = 5000;
const HTTP_TYPES = new Set(["http", "streamable-http"]);

/** 無いファイルは null (各 PC に無くて普通)。壊れた JSON はパスを付けて throw する */
function readJsonIfExists<T>(abs: string): T | null {
  if (!fs.existsSync(abs)) return null;
  try {
    return JSON.parse(fs.readFileSync(abs, "utf8")) as T;
  } catch (e) {
    throw new Error(`${abs} を JSON として読めません (${(e as Error).message})`);
  }
}

function names(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/**
 * ~/.claude.json の projects のキー (プロジェクトの絶対パス) と比べる。Mac では projectRoot() と同じ文字列だった (2026-11-14 実測)。
 * Windows の実機のキーの書き方は未確認なので、区切り (/ と \) と大文字小文字の違いでは外さないようにそろえて比べる。
 */
function samePath(a: string, b: string): boolean {
  const norm = (p: string) => {
    const s = p.replace(/\\/g, "/").replace(/\/+$/, "");
    return process.platform === "win32" ? s.toLowerCase() : s;
  };
  return norm(a) === norm(b);
}

function transportOf(def: ServerDef): string {
  return def.type ?? "stdio";
}

function targetOf(def: ServerDef): string {
  if (typeof def.url === "string") {
    try {
      const u = new URL(def.url);
      return `${u.origin}${u.pathname}`;
    } catch {
      return "(URL を読めない)";
    }
  }
  // 引数にはキーが入りうるので、最初の「- で始まらない引数」(パッケージ名・台本) だけを出す
  const first = (def.args ?? []).find((a): a is string => typeof a === "string" && !a.startsWith("-"));
  return [def.command ?? "(command なし)", first].filter(Boolean).join(" ");
}

/** 値が入っているか。${VAR} の参照は、その変数が管理画面のプロセスにあるか (既定値つきならある扱い) で答える */
function hasValue(value: unknown, env: EnvVars): boolean {
  if (typeof value !== "string" || value === "") return false;
  for (const m of value.matchAll(ENV_REFERENCE)) {
    if (m[2] === undefined && !env[m[1]]) return false;
  }
  return true;
}

function authOf(def: ServerDef, env: EnvVars): Pick<McpServerRow, "auth" | "authNote" | "token"> {
  const remote = typeof def.url === "string";
  const source = remote ? def.headers ?? {} : def.env ?? {};
  const secretKeys = Object.keys(source).filter((k) => SECRET_NAME.test(k));
  if (secretKeys.length > 0) {
    return {
      auth: "token",
      authNote: `${remote ? "ヘッダー" : "環境変数"} ${secretKeys.join("・")}`,
      token: secretKeys.every((k) => hasValue(source[k], env)),
    };
  }
  if (remote && def.headersHelper !== undefined) return { auth: "token", authNote: "headersHelper", token: null };
  if (remote && def.oauth !== undefined) return { auth: "oauth", authNote: "oauth の設定あり", token: null };
  // ヘッダーの無い HTTP サーバーは、応答 (200 か 401) を見るまで認証の要否が分からない
  return { auth: remote ? "unknown" : "none", authNote: null, token: null };
}

interface SettingsFile {
  label: string;
  settings: McpSettings | null;
}

function stateOf(name: string, scope: McpScope, files: SettingsFile[], toggledOff: Set<string>): Pick<McpServerRow, "state" | "stateSource"> {
  if (toggledOff.has(name)) return { state: "disabled", stateSource: "~/.claude.json の disabledMcpServers (このプロジェクト)" };
  if (scope !== "project") return { state: "enabled", stateSource: "~/.claude.json の定義 (承認は要らない)" };
  const rejected = files.find((f) => names(f.settings?.disabledMcpjsonServers).includes(name));
  if (rejected) return { state: "rejected", stateSource: `${rejected.label} の disabledMcpjsonServers` };
  const approved = files.find((f) => names(f.settings?.enabledMcpjsonServers).includes(name));
  if (approved) return { state: "enabled", stateSource: `${approved.label} の enabledMcpjsonServers` };
  const all = files.find((f) => f.settings?.enableAllProjectMcpServers === true);
  if (all) return { state: "enabled", stateSource: `${all.label} の enableAllProjectMcpServers` };
  return { state: "pending", stateSource: "どの設定ファイルの enabledMcpjsonServers にも無い" };
}

interface Effective {
  name: string;
  scope: McpScope;
  shadowed: McpScope[];
  def: ServerDef;
}

/** 設定ファイルを読み、名前ごとに使われる定義 (local > project > user) を 1 つ選ぶ。名前順 */
function loadConfig(home: string) {
  const root = projectRoot();
  const project = readJsonIfExists<{ mcpServers?: Record<string, ServerDef> }>(path.join(root, ".mcp.json"));
  const user = readJsonIfExists<UserConfig>(path.join(home, ".claude.json"));
  const here = Object.entries(user?.projects ?? {}).find(([p]) => samePath(p, root))?.[1];
  const ledger = readJsonIfExists<Ledger>(path.join(root, ".claude/config/mcp-servers.json"));
  // 承認を探す順 = 設定の優先順 (この PC だけの設定が先)
  const files: SettingsFile[] = [
    { label: ".claude/settings.local.json", settings: readJsonIfExists<McpSettings>(path.join(root, ".claude/settings.local.json")) },
    { label: ".claude/settings.json", settings: readJsonIfExists<McpSettings>(path.join(root, ".claude/settings.json")) },
    { label: "~/.claude/settings.json", settings: readJsonIfExists<McpSettings>(path.join(home, ".claude/settings.json")) },
    // 公式文書に無いが、この Mac の ~/.claude.json のプロジェクトの下に同じ 2 つの key があった (2026-11-14 実測・どちらも空)
    { label: "~/.claude.json (このプロジェクト)", settings: here ?? null },
  ];
  const defs: Record<McpScope, Record<string, ServerDef>> = {
    local: here?.mcpServers ?? {},
    project: project?.mcpServers ?? {},
    user: user?.mcpServers ?? {},
  };
  const servers = [...new Set(SCOPE_ORDER.flatMap((s) => Object.keys(defs[s])))].sort().map((name): Effective => {
    const scopes = SCOPE_ORDER.filter((s) => name in defs[s]);
    return { name, scope: scopes[0], shadowed: scopes.slice(1), def: defs[scopes[0]][name] };
  });
  return { servers, files, toggledOff: new Set(names(here?.disabledMcpServers)), ledger };
}

function toRow(e: Effective, config: ReturnType<typeof loadConfig>, env: EnvVars): McpServerRow {
  const entry = config.ledger?.servers?.[e.name];
  return {
    name: e.name,
    scope: e.scope,
    shadowed: e.shadowed,
    transport: transportOf(e.def),
    target: targetOf(e.def),
    purpose: entry?.purpose ?? null,
    usedBy: entry?.usedBy ?? [],
    ...stateOf(e.name, e.scope, config.files, config.toggledOff),
    ...authOf(e.def, env),
    probe: null,
  };
}

/** 設定ファイルだけから作る一覧 (接続確認の前) */
export function mcpServerRows({ home = os.homedir(), env = process.env }: { home?: string; env?: EnvVars } = {}): McpServerRow[] {
  const config = loadConfig(home);
  return config.servers.map((e) => toRow(e, config, env));
}

/**
 * HTTP サーバーへ initialize を 1 回送り、応答コードを返す。資格情報は送らない。
 * 外へ出るのは設定に書かれた URL への 1 リクエストだけで、名乗る名前にプロジェクト名を入れない。
 */
export async function probeInitialize(url: string, fetchImpl: typeof fetch = fetch): Promise<McpProbe> {
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "mcp-status-check", version: "1.0.0" } },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    // 本文 (SSE の場合は開いたままの stream) は読まずに閉じる
    await res.body?.cancel().catch(() => undefined);
    return { status: res.status };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** 一覧に、有効な HTTP サーバーの接続確認を足す。ページを開くたびに呼ぶ */
export async function mcpStatus({
  home = os.homedir(),
  env = process.env,
  fetchImpl = fetch,
}: { home?: string; env?: EnvVars; fetchImpl?: typeof fetch } = {}): Promise<Wrapped<{ rows: McpServerRow[]; generatedAt: string }>> {
  const config = wrap(() => loadConfig(home));
  if ("error" in config) return config;
  const rows = await Promise.all(
    config.servers.map(async (e): Promise<McpServerRow> => {
      const row = toRow(e, config, env);
      // 送り先は設定に書かれた URL そのまま (query を含みうるので、行には載せない)
      if (row.state !== "enabled" || typeof e.def.url !== "string" || !HTTP_TYPES.has(row.transport)) return row;
      const probe = await probeInitialize(e.def.url, fetchImpl);
      if (row.auth !== "unknown" || !("status" in probe)) return { ...row, probe };
      // 資格情報なしで 200 なら認証なし、401 なら OAuth (ヘッダーの設定が無いので、Claude Code は OAuth で入る)
      const auth: McpAuth = probe.status === 401 ? "oauth" : probe.status >= 200 && probe.status < 300 ? "none" : "unknown";
      return { ...row, probe, auth };
    }),
  );
  return { rows, generatedAt: new Date().toISOString() };
}
