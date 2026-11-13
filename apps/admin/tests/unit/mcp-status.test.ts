import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";

/**
 * /ops/mcp のサーバー層 (この PC が使う MCP の一覧と接続状況)。
 * ★状態の語彙は Claude Code の `/mcp` と同じにする (有効・承認待ち・拒否・無効)。読み違えると、つながらない理由を
 *   画面が隠す (2026-09-28 に Cloudflare の MCP 2 台が未認証のまま何日も放置された)。
 * ★設定ファイルにはトークンが入りうる。返り値に値を 1 つも含めないことを固定する。
 */

const REPO_ROOT = path.resolve(__dirname, "../../../..");
const SECRET = "sk-SECRET-VALUE";

async function load(root: string) {
  process.env.STATS47_PROJECT_ROOT = root;
  vi.resetModules();
  return import("@/lib/server/mcp-status");
}

function makeHome(config: unknown | null): string {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-home-"));
  if (config !== null) fs.writeFileSync(path.join(home, ".claude.json"), JSON.stringify(config));
  return home;
}

let root: string | undefined;
let home: string | undefined;

afterEach(() => {
  delete process.env.STATS47_PROJECT_ROOT;
  if (root) cleanupFixtureRoot(root);
  if (home) fs.rmSync(home, { recursive: true, force: true });
  root = undefined;
  home = undefined;
});

function fixture() {
  root = makeFixtureRoot({
    stateFiles: {
      ".mcp.json": JSON.stringify({
        mcpServers: {
          approved: { type: "stdio", command: "npx", args: ["-y", "approved-mcp@1.0.0", "--api-key", SECRET] },
          waiting: { type: "http", url: `https://waiting.example.com/mcp?key=${SECRET}` },
          rejected: { type: "stdio", command: "node", args: ["server.mjs"] },
          shadowed: { type: "stdio", command: "npx", args: ["project-definition"] },
        },
      }),
      ".claude/settings.json": JSON.stringify({ enabledMcpjsonServers: ["approved", "rejected", "shadowed"] }),
      ".claude/settings.local.json": JSON.stringify({ disabledMcpjsonServers: ["rejected"] }),
      ".claude/config/mcp-servers.json": JSON.stringify({
        servers: { approved: { purpose: "確認用の用途", usedBy: [".claude/rules/example.md"] } },
      }),
    },
  });
  home = makeHome({
    mcpServers: {
      docs: { type: "http", url: "https://docs.example.com/mcp" },
      "token-http": { type: "http", url: "https://token.example.com/mcp", headers: { Authorization: `Bearer ${SECRET}` } },
      "env-ref": { type: "http", url: "https://env.example.com/mcp", headers: { "X-Api-Key": "${MCP_STATUS_TEST_TOKEN}" } },
      toggled: { type: "stdio", command: "npx", args: ["toggled-mcp"], env: { PLAIN_SETTING: "1" } },
      shadowed: { type: "stdio", command: "npx", args: ["user-definition"] },
    },
    projects: {
      [root]: {
        mcpServers: { shadowed: { type: "stdio", command: "npx", args: ["local-definition"], env: { OPENAI_API_KEY: SECRET } } },
        disabledMcpServers: ["toggled"],
      },
      "/some/other/project": { mcpServers: { elsewhere: { type: "stdio", command: "npx" } } },
    },
  });
  return { root, home };
}

describe("mcpServerRows (設定ファイルから読む一覧)", () => {
  it("local・project・user の定義を名前ごとに 1 行にし、同じ名前は local > project > user の順で採る", async () => {
    const f = fixture();
    const { mcpServerRows } = await load(f.root);
    const rows = mcpServerRows({ home: f.home });
    expect(rows.map((r) => r.name)).toEqual(["approved", "docs", "env-ref", "rejected", "shadowed", "toggled", "token-http", "waiting"]);
    const shadowed = rows.find((r) => r.name === "shadowed");
    expect(shadowed).toMatchObject({ scope: "local", shadowed: ["project", "user"], target: "npx local-definition" });
    // ほかのプロジェクトの local 定義は読まない
    expect(rows.find((r) => r.name === "elsewhere")).toBeUndefined();
  });

  it("有効か を /mcp と同じ 4 つの状態で返し、根拠のファイルを添える", async () => {
    const f = fixture();
    const { mcpServerRows } = await load(f.root);
    const state = Object.fromEntries(mcpServerRows({ home: f.home }).map((r) => [r.name, [r.state, r.stateSource]]));
    expect(state.approved).toEqual(["enabled", ".claude/settings.json の enabledMcpjsonServers"]);
    // .mcp.json にあるが、どの設定ファイルも承認していない
    expect(state.waiting).toEqual(["pending", "どの設定ファイルの enabledMcpjsonServers にも無い"]);
    // 承認があっても、この PC の settings.local.json の拒否が勝つ
    expect(state.rejected).toEqual(["rejected", ".claude/settings.local.json の disabledMcpjsonServers"]);
    // user の定義は承認が要らない
    expect(state.docs).toEqual(["enabled", "~/.claude.json の定義 (承認は要らない)"]);
    // /mcp でこのプロジェクトだけ切ったもの
    expect(state.toggled).toEqual(["disabled", "~/.claude.json の disabledMcpServers (このプロジェクト)"]);
  });

  it("enableAllProjectMcpServers が true なら .mcp.json の全部を承認済みにする", async () => {
    const f = fixture();
    fs.writeFileSync(path.join(f.root, ".claude/settings.local.json"), JSON.stringify({ enableAllProjectMcpServers: true }));
    const { mcpServerRows } = await load(f.root);
    const waiting = mcpServerRows({ home: f.home }).find((r) => r.name === "waiting");
    expect(waiting).toMatchObject({ state: "enabled", stateSource: ".claude/settings.local.json の enableAllProjectMcpServers" });
  });

  it("認証方式とトークンの有無を返すが、値は 1 つも返さない (引数・URL の query・ヘッダー・環境変数)", async () => {
    const f = fixture();
    const { mcpServerRows } = await load(f.root);
    const rows = mcpServerRows({ home: f.home, env: {} });
    const by = Object.fromEntries(rows.map((r) => [r.name, r]));
    expect(by["token-http"]).toMatchObject({ auth: "token", authNote: "ヘッダー Authorization", token: true });
    // 値が ${環境変数} の参照なら、その変数が管理画面のプロセスにあるかで答える
    expect(by["env-ref"]).toMatchObject({ auth: "token", authNote: "ヘッダー X-Api-Key", token: false });
    expect(by.shadowed).toMatchObject({ auth: "token", authNote: "環境変数 OPENAI_API_KEY", token: true });
    // 秘密らしくない環境変数は認証と数えない
    expect(by.toggled).toMatchObject({ auth: "none", authNote: null, token: null });
    // ヘッダーの無い HTTP サーバーは、応答を見るまで認証方式が分からない
    expect(by.docs).toMatchObject({ auth: "unknown", token: null });
    expect(by.approved.target).toBe("npx approved-mcp@1.0.0");
    expect(by.waiting.target).toBe("https://waiting.example.com/mcp");
    expect(JSON.stringify(rows)).not.toContain(SECRET);

    const withToken = mcpServerRows({ home: f.home, env: { MCP_STATUS_TEST_TOKEN: "x" } });
    expect(withToken.find((r) => r.name === "env-ref")?.token).toBe(true);
  });

  it("用途と使う場所は正本 .claude/config/mcp-servers.json から引き、無いサーバーは null にする", async () => {
    const f = fixture();
    const { mcpServerRows } = await load(f.root);
    const by = Object.fromEntries(mcpServerRows({ home: f.home }).map((r) => [r.name, r]));
    expect(by.approved).toMatchObject({ purpose: "確認用の用途", usedBy: [".claude/rules/example.md"] });
    expect(by.docs).toMatchObject({ purpose: null, usedBy: [] });
  });

  it("~/.claude.json と settings.local.json が無い PC でも、.mcp.json の行を返す", async () => {
    root = makeFixtureRoot({
      stateFiles: {
        ".mcp.json": JSON.stringify({ mcpServers: { only: { type: "stdio", command: "node", args: ["a.mjs"] } } }),
        ".claude/settings.json": JSON.stringify({ enabledMcpjsonServers: ["only"] }),
      },
    });
    home = makeHome(null);
    const { mcpServerRows } = await load(root);
    expect(mcpServerRows({ home })).toEqual([expect.objectContaining({ name: "only", scope: "project", state: "enabled", purpose: null })]);
  });
});

describe("probeInitialize (HTTP サーバーへの initialize)", () => {
  it("initialize を POST し、応答コードを返す。資格情報とプロジェクト名は送らない", async () => {
    const f = fixture();
    const { probeInitialize } = await load(f.root);
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response("{}", { status: 200 });
    };
    expect(await probeInitialize("https://docs.example.com/mcp", fetchImpl)).toEqual({ status: 200 });
    expect(calls).toHaveLength(1);
    const { url, init } = calls[0];
    expect(url).toBe("https://docs.example.com/mcp");
    expect(init.method).toBe("POST");
    const headers = new Headers(init.headers);
    // Streamable HTTP は Accept に両方を要求する
    expect(headers.get("accept")).toBe("application/json, text/event-stream");
    expect(headers.get("authorization")).toBeNull();
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ jsonrpc: "2.0", method: "initialize" });
    expect(String(init.body)).not.toMatch(/stats47/i);
  });

  it("401 はそのまま返し、つながらないときは理由を返す (throw しない)", async () => {
    const f = fixture();
    const { probeInitialize } = await load(f.root);
    expect(await probeInitialize("https://x.example.com/mcp", async () => new Response("", { status: 401 }))).toEqual({ status: 401 });
    const failed = await probeInitialize("https://x.example.com/mcp", async () => {
      throw new Error("getaddrinfo ENOTFOUND x.example.com");
    });
    expect(failed).toEqual({ error: "getaddrinfo ENOTFOUND x.example.com" });
  });
});

describe("mcpStatus (一覧 + 接続確認)", () => {
  it("有効な HTTP サーバーだけに initialize を送り、応答から認証方式を決める", async () => {
    const f = fixture();
    const { mcpStatus } = await load(f.root);
    const asked: string[] = [];
    const fetchImpl = async (url: string | URL | Request) => {
      asked.push(String(url));
      return new Response("", { status: String(url).includes("docs.example.com") ? 200 : 401 });
    };
    const v = await mcpStatus({ home: f.home, fetchImpl });
    if ("error" in v) throw new Error(v.error);
    const by = Object.fromEntries(v.rows.map((r) => [r.name, r]));
    // 承認待ちの waiting と stdio には送らない。URL の query (秘密が入りうる) は設定どおりに送る先へだけ渡す
    expect(asked.sort()).toEqual(["https://docs.example.com/mcp", "https://env.example.com/mcp", "https://token.example.com/mcp"]);
    expect(by.docs).toMatchObject({ probe: { status: 200 }, auth: "none" });
    expect(by["token-http"]).toMatchObject({ probe: { status: 401 }, auth: "token" });
    expect(by.waiting.probe).toBeNull();
    expect(by.approved.probe).toBeNull();
    expect(JSON.stringify(v)).not.toContain(SECRET);
  });

  it("ヘッダーの無い HTTP サーバーが 401 を返したら、認証方式を OAuth とする", async () => {
    const f = fixture();
    const { mcpStatus } = await load(f.root);
    const v = await mcpStatus({ home: f.home, fetchImpl: async () => new Response("", { status: 401 }) });
    if ("error" in v) throw new Error(v.error);
    expect(v.rows.find((r) => r.name === "docs")).toMatchObject({ probe: { status: 401 }, auth: "oauth", token: null });
  });

  it(".mcp.json が壊れていたら {error} に畳む", async () => {
    root = makeFixtureRoot({ stateFiles: { ".mcp.json": "{ broken" } });
    home = makeHome(null);
    const { mcpStatus } = await load(root);
    expect(await mcpStatus({ home, fetchImpl: async () => new Response("") })).toHaveProperty("error");
  });
});

describe("正本 .claude/config/mcp-servers.json (用途と使う場所)", () => {
  const ledger = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, ".claude/config/mcp-servers.json"), "utf8")) as {
    servers: Record<string, { purpose: string; usedBy: string[] }>;
  };

  it(".mcp.json の全サーバーに用途が書いてある", () => {
    const project = Object.keys(JSON.parse(fs.readFileSync(path.join(REPO_ROOT, ".mcp.json"), "utf8")).mcpServers);
    for (const name of project) expect(ledger.servers[name]?.purpose, name).toBeTruthy();
  });

  it("使う場所に書いたファイルは実在し、そのサーバーの名前を本文に持つ", () => {
    for (const [name, entry] of Object.entries(ledger.servers)) {
      expect(entry.usedBy.length, name).toBeGreaterThan(0);
      for (const rel of entry.usedBy) {
        const abs = path.join(REPO_ROOT, rel);
        expect(fs.existsSync(abs), `${name}: ${rel}`).toBe(true);
        expect(fs.readFileSync(abs, "utf8"), `${name}: ${rel}`).toContain(name);
      }
    }
  });
});

describe("/ops/mcp のページ", () => {
  it("メニュー (領域の正本 domains.json) に載っている", () => {
    const domains = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "data/business/domains.json"), "utf8")) as {
      domains: Array<{ id: string; nav: Array<{ href?: string }> }>;
    };
    expect(domains.domains.find((d) => d.id === "ops")?.nav.map((n) => n.href)).toContain("/ops/mcp");
  });
});
