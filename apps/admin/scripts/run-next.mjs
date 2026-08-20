#!/usr/bin/env node
/**
 * gallery の next dev / start をポート解決つきで起動する。
 *
 * ★なぜ wrapper が要るか (2026-08-18 実測): npm は Windows でスクリプトを
 *   `cmd.exe /d /s /c` 経由で実行するため、POSIX の `${PORT:-4747}` が展開されず
 *   リテラル文字列のまま next に渡り、
 *     error: option '-p, --port <port>' argument '${PORT:-4747}' is invalid
 *   で起動できない (Mac/Linux では動くので気づけない)。
 *   同型の罠は .claude/rules/local-environment.md の `NODE_OPTIONS=` 前置と同じ。
 *   ポート解決を Node 側へ寄せて OS 差を消す。
 *
 * bind は 127.0.0.1 固定 (ローカル専用コンソールなので外部公開しない)。
 */
import { spawn } from "node:child_process";

const DEFAULT_PORT = "4747";
const mode = process.argv[2];
if (mode !== "dev" && mode !== "start") {
  console.error(`usage: run-next.mjs <dev|start> [...next args]`);
  process.exit(2);
}

const raw = process.env.PORT?.trim();
// 不正な PORT は既定へ黙って倒さない (別ポートで起動したつもりの取り違えを防ぐ)
if (raw !== undefined && raw !== "" && !/^\d+$/.test(raw)) {
  console.error(`PORT が数値ではありません: ${JSON.stringify(raw)}`);
  process.exit(2);
}
const port = raw && raw !== "" ? raw : DEFAULT_PORT;

const args = [mode, "-H", "127.0.0.1", "-p", port, ...process.argv.slice(3)];
console.error(`[gallery] next ${args.join(" ")}`);
const child = spawn("next", args, { stdio: "inherit", shell: true });
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
