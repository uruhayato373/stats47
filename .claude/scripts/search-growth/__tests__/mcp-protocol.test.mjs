/**
 * MCP protocol smoke — stdio server を spawn し initialize/tools/list/tools/call を実際に往復する。
 * Claude Code に load させずに server の動作を確認する。
 *   node --test .claude/scripts/search-growth/__tests__/mcp-protocol.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SERVER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "mcp", "server.mjs");

function startServer() {
  const proc = spawn("node", [SERVER], { stdio: ["pipe", "pipe", "inherit"] });
  let buf = "";
  const waiters = new Map();
  proc.stdout.on("data", (d) => {
    buf += d.toString();
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      const msg = JSON.parse(line);
      if (msg.id != null && waiters.has(msg.id)) {
        waiters.get(msg.id)(msg);
        waiters.delete(msg.id);
      }
    }
  });
  const rpc = (id, method, params) =>
    new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`timeout ${method}`)), 5000);
      waiters.set(id, (m) => { clearTimeout(t); resolve(m); });
      proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  return { proc, rpc };
}

test("MCP stdio: initialize → tools/list → tools/call が往復する", async () => {
  const { proc, rpc } = startServer();
  try {
    const init = await rpc(1, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0" } });
    assert.equal(init.result.serverInfo.name, "seo-observability");

    const list = await rpc(2, "tools/list", {});
    assert.equal(list.result.tools.length, 11);
    assert.ok(list.result.tools.every((t) => t.annotations.readOnlyHint === true));

    const call = await rpc(3, "tools/call", { name: "search_growth_status", arguments: {} });
    assert.ok(Array.isArray(call.result.content));
    const payload = JSON.parse(call.result.content[0].text);
    assert.ok("sources" in payload && "candidateCount" in payload);

    // allowlist 外 url は tool error (protocol error ではなく isError)
    const bad = await rpc(4, "tools/call", { name: "gsc_performance", arguments: { page: "https://evil.example.com" } });
    assert.equal(bad.result.isError, true);

    // unknown tool は JSON-RPC error
    const unknown = await rpc(5, "tools/call", { name: "deploy_site", arguments: {} });
    assert.ok(unknown.error);
  } finally {
    proc.kill();
  }
});
