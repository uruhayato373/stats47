#!/usr/bin/env node
/**
 * note の専用プロファイル (.local/playwright-note-profile) を Playwright で起動し、browser-use が
 * CDP でつなげる口を開けたまま待つ。Chrome の Profile 5 を読めない環境で note を公開するときに使う。
 *
 *   node .claude/scripts/note/launch-note-cdp.mjs [--port 9333] [--headless]
 *
 * 起動して stats47 のログインを確かめると `NOTE_BU_CDP=http://127.0.0.1:<port>` を 1 行出す。
 * 別の端末でその値を付けて publish-new-note.sh などを実行し、終わったら Ctrl+C (SIGINT) で閉じる。
 * 未ログイン・別アカウントのときは何も操作せずに終了する (パスワードは入れない。入り直しは note:login)。
 *
 * 専用プロファイルを素の Chrome で開かない (memory: feedback_note_profile_launch)。
 * ダイアログの競合で落ちない理由は lib/dialog-race-guard.mjs の冒頭。
 */
import { installDialogRaceGuard } from "./lib/dialog-race-guard.mjs";
import { assertAccount, launchContext, pruneProfileCaches } from "./lib/note-session.mjs";

const DEFAULT_PORT = 9333;
const args = process.argv.slice(2);
const portAt = args.indexOf("--port");
const port = portAt >= 0 ? Number(args[portAt + 1]) : DEFAULT_PORT;
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error(`[note-cdp] --port は 1024〜65535 の整数で指定する (受け取った値: ${args[portAt + 1]})`);
  process.exit(64);
}

// ブラウザを開く前に入れる。開いた後だと、最初のダイアログの競合で落ちうる。
installDialogRaceGuard();

const context = await launchContext({ headless: args.includes("--headless"), extraArgs: [`--remote-debugging-port=${port}`] });
let closing = false;
async function shutdown(exitCode) {
  if (closing) return;
  closing = true;
  await context.close().catch(() => {});
  pruneProfileCaches();
  process.exit(exitCode);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
// ウィンドウを手で閉じたときも、Node だけが残らないようにする。
context.on("close", () => shutdown(0));

try {
  const account = await assertAccount(context);
  console.log(`[note-cdp] ${account} でログイン済み。終了は Ctrl+C`);
  console.log(`NOTE_BU_CDP=http://127.0.0.1:${port}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  await shutdown(1);
}
