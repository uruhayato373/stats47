#!/usr/bin/env node
/**
 * search-growth MCP server — read-only。CLI と同じ pure service (lib/service.mjs) を呼ぶ薄い adapter。
 *
 * 正典: .claude/skills/analytics/search-growth/reference/platform-contract.md
 * (CLI 正典・MCP は薄い adapter・read-only tools のみ・mutation 非公開)。
 * stdio JSON-RPC 2.0 (newline-delimited)。外部依存ゼロ (MCP SDK を使わず最小実装)。
 * MCP が無くても CLI で全機能が成立する (この server は任意)。
 *
 * 公開しない mutation: deploy / push / PR / sitemap submit-delete / GSC・GA4・Cloudflare 変更 /
 * URL 削除 / production write。これらは tool として存在しない。
 */
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";
import { TOOLS, callTool } from "../lib/service.mjs";

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = { name: "seo-observability", version: "1.0.0" };

function toInputSchema(input) {
  const properties = {};
  const required = [];
  for (const [k, spec] of Object.entries(input ?? {})) {
    const optional = spec.endsWith("?");
    const type = spec.replace("?", "");
    properties[k] = { type };
    if (!optional) required.push(k);
  }
  return { type: "object", properties, required, additionalProperties: false };
}

function listTools() {
  return Object.entries(TOOLS).map(([name, def]) => ({
    name,
    description: `${def.desc} — READ-ONLY。外部への影響なし (deploy/送信/mutation は不可)。`,
    inputSchema: toInputSchema(def.input),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }));
}

function handle(msg) {
  const { id, method, params } = msg;
  // notification (id 無し) は応答しない
  if (id === undefined || id === null) return null;

  try {
    switch (method) {
      case "initialize":
        return ok(id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: "stats47 検索成長の read-only 観測基盤。全 tool は derived state を読むだけで外部影響なし。",
        });
      case "ping":
        return ok(id, {});
      case "tools/list":
        return ok(id, { tools: listTools() });
      case "tools/call": {
        const name = params?.name;
        const args = params?.arguments ?? {};
        if (!TOOLS[name]) return err(id, -32602, `unknown tool: ${name}`);
        const result = callTool(name, args);
        return ok(id, { content: [{ type: "text", text: JSON.stringify(result) }], isError: !!result?.error });
      }
      default:
        return err(id, -32601, `method not found: ${method}`);
    }
  } catch (e) {
    return err(id, -32603, `internal error: ${String(e?.message || e)}`);
  }
}

function ok(id, result) {
  return { jsonrpc: "2.0", id, result };
}
function err(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function main() {
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let msg;
    try {
      msg = JSON.parse(trimmed);
    } catch {
      process.stdout.write(JSON.stringify(err(null, -32700, "parse error")) + "\n");
      return;
    }
    const res = handle(msg);
    if (res) process.stdout.write(JSON.stringify(res) + "\n");
  });
}

// テストから import できるよう export しつつ、直接起動時のみ stdin を読む
export { handle, listTools, toInputSchema };
// 文字列連結で file:// URL を組み立てない。Windows のドライブレター (file:///C:/...) と
// 相対パス起動 (.mcp.json は相対パスを渡す) の双方で一致しなくなり、main() が呼ばれず
// stdin を読まないまま即 exit する (= MCP handshake が成立しない)。
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
