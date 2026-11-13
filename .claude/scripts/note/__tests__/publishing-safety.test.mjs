import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const NOTE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLISHER = readFileSync(join(NOTE_DIR, "publish-new-note.sh"), "utf8");
const HELPERS = readFileSync(join(NOTE_DIR, "editor-helpers.sh"), "utf8");
const MAGAZINES = readFileSync(join(NOTE_DIR, "note-magazine.mjs"), "utf8");
const KAKEI = readFileSync(join(NOTE_DIR, "publish-kakei-one.sh"), "utf8");
const PUBLISH_LIB = readFileSync(join(NOTE_DIR, "note-publish-lib.sh"), "utf8");
const HASHTAG_UPDATER = readFileSync(join(NOTE_DIR, "update-published-hashtags.mjs"), "utf8");
const CATALOG_ENTRIES_BUILDER = readFileSync(join(NOTE_DIR, "build-kakei-catalog-entries.mjs"), "utf8");

test("new note publication serializes Profile 5 access and removes temporary Chrome state", () => {
  assert.match(PUBLISHER, /stats47-note-profile5\.lock/);
  assert.match(PUBLISHER, /kill -0 "\$holder"/);
  assert.match(PUBLISHER, /browser-use-user-data-dir-\*/);
  assert.match(PUBLISHER, /URL of t contains "editor\.note\.com"/);
});

test("publisher fails closed on image, magazine, settings, and submit failures", () => {
  assert.match(PUBLISHER, /FAIL image insert/);
  assert.match(PUBLISHER, /FAIL magazine assignment/);
  assert.match(PUBLISHER, /FAIL 公開に進む 未検出/);
  assert.match(PUBLISHER, /FAIL 投稿する 未検出/);
  assert.match(HELPERS, /\[FAIL\] image upload failed/);
  assert.match(HELPERS, /\[ -d "\$ARTICLE_DIR" \] \|\| ARTICLE_DIR=/);
});

test("publisher verifies ownership, state, title, price, hashtags, and embeds through the live API", () => {
  assert.match(PUBLISHER, /api\/v3\/notes\/\$\{process\.env\.NOTE_KEY\}/);
  for (const key of ["account", "status", "title", "price", "hashtags", "embedded"]) {
    assert.match(PUBLISHER, new RegExp(`\\b${key}:`));
  }
  assert.match(PUBLISHER, /hashtag_notes\?\.length \|\| 0\) >= 95/);
});

test("magazine assignment falls back to an owned published note lookup", () => {
  assert.match(MAGAZINES, /fetchOwnedPublishedNoteId/);
  assert.match(MAGAZINES, /note\?\.status !== "published"/);
  assert.match(MAGAZINES, /note\?\.user\?\.urlname !== "stats47"/);
});

test("nested kakei publication owns the full-session lock, cleanup, and payload guard", () => {
  assert.match(PUBLISHER, /NOTE_PROFILE_LOCK_HELD/);
  assert.match(KAKEI, /stats47-note-profile5\.lock/);
  assert.match(KAKEI, /NOTE_PROFILE_LOCK_HELD=1 bash/);
  assert.match(KAKEI, /np_install_publish_guard/);
  assert.match(KAKEI, /np_verify_publish_guard/);
  assert.match(KAKEI, /np_update_published_hashtags/);
  assert.match(KAKEI, /head -5 "\$ADIR\/hashtags\.txt"/);
  assert.match(PUBLISH_LIB, /free body too short/);
  assert.match(PUBLISH_LIB, /body\.hashtags=tags/);
  assert.match(PUBLISH_LIB, /hashtag_notes\?\.length \|\| 0\) >= 95/);
});

test("published hashtag updates lock Profile 5 and clean only resolved temporary profiles", () => {
  assert.match(HASHTAG_UPDATER, /stats47-note-profile5\.lock/);
  assert.match(HASHTAG_UPDATER, /acquireProfileLock\(\)/);
  assert.match(HASHTAG_UPDATER, /entry\.name\.startsWith\('browser-use-user-data-dir-'\)/);
  assert.doesNotMatch(HASHTAG_UPDATER, /rm -rf .*browser-use-user-data-dir/);
  assert.match(HASHTAG_UPDATER, /if \(options\.auditOnly\) return;\s+\n\s*acquireProfileLock\(\)/);
});

test("kakei catalog entry builder defaults a-/d-kakei magazine to s47-kakei-reading (not s47-economy)", () => {
  assert.match(CATALOG_ENTRIES_BUILDER, /const magazine = "s47-kakei-reading";/);
  assert.doesNotMatch(CATALOG_ENTRIES_BUILDER, /const magazine = "s47-economy"/);
});

test("new publication and paid-landing patches stop on unverified disclaimers in the body", () => {
  assert.match(PUBLISHER, /audit-note-unverified\.mjs" --file "\$ADIR\/draft\.md"/);
  assert.match(PUBLISHER, /FAIL: 未検証の断り書きが本文に残っている/);
  const patcher = readFileSync(join(NOTE_DIR, "patch-note-paid-landing.mjs"), "utf8");
  assert.match(patcher, /findUnverifiedDisclosures\(`\$\{composed\.html\}\\n\$\{pay\}`\)/);
  const weekly = readFileSync(join(NOTE_DIR, "../management/weekly-audits/note-circulation.sh"), "utf8");
  assert.match(weekly, /note:unverified:audit/);
});

// --- NOTE-PLAYWRIGHT-DIALOG-CRASH-01 ---
// Playwright が開いたブラウザを browser-use が CDP で同時に操作すると、ダイアログを browser-use が先に閉じたとき
// Playwright 側の Page.handleJavaScriptDialog が失敗し、未処理の rejection で起動スクリプトごとブラウザが落ちる。

const GUARD_URL = pathToFileURL(join(NOTE_DIR, "lib/dialog-race-guard.mjs")).href;
const DIALOG_RACE_MESSAGE = "Protocol error (Page.handleJavaScriptDialog): No dialog is showing";

/** 子プロセスで guard を入れてから rejection を 1 つ起こし、300ms 後も生きていれば ALIVE を出す。 */
function rejectUnderGuard(message) {
  const code = `
    const { installDialogRaceGuard } = await import(${JSON.stringify(GUARD_URL)});
    installDialogRaceGuard();
    Promise.reject(new Error(${JSON.stringify(message)}));
    setTimeout(() => console.log("ALIVE"), 300);
  `;
  return spawnSync(process.execPath, ["--input-type=module", "-e", code], { encoding: "utf8" });
}

test("dialog race guard recognizes only the lost-dialog protocol error", async () => {
  const { isDialogRaceError } = await import(GUARD_URL);
  assert.equal(isDialogRaceError(new Error(DIALOG_RACE_MESSAGE)), true);
  assert.equal(isDialogRaceError(new Error("Page.handleJavaScriptDialog: No dialog is showing")), true);
  assert.equal(isDialogRaceError(new Error("Protocol error (Page.handleJavaScriptDialog): Target closed")), false);
  assert.equal(isDialogRaceError(new Error("Protocol error (Page.navigate): No dialog is showing")), false);
  assert.equal(isDialogRaceError(new Error("browserContext.close: Target page, context or browser has been closed")), false);
  assert.equal(isDialogRaceError(undefined), false);
});

test("the launcher process survives the dialog race and still dies on any other unhandled rejection", () => {
  const race = rejectUnderGuard(DIALOG_RACE_MESSAGE);
  assert.equal(race.status, 0, race.stderr);
  assert.match(race.stdout, /ALIVE/);
  assert.match(race.stderr, /ダイアログ/);

  const other = rejectUnderGuard("net::ERR_CONNECTION_REFUSED at https://note.com");
  assert.notEqual(other.status, 0);
  assert.doesNotMatch(other.stdout, /ALIVE/);
  assert.match(other.stderr, /ERR_CONNECTION_REFUSED/);
});

test("the CDP launcher installs the guard before opening the note profile and gates on the account", () => {
  const launcher = readFileSync(join(NOTE_DIR, "launch-note-cdp.mjs"), "utf8");
  const guardAt = launcher.indexOf("installDialogRaceGuard()");
  const launchAt = launcher.indexOf("launchContext(");
  assert.ok(guardAt > 0 && launchAt > guardAt, "guard must be installed before the browser is launched");
  assert.match(launcher, /--remote-debugging-port=\$\{port\}/);
  assert.match(launcher, /assertAccount\(/);
  assert.match(launcher, /NOTE_BU_CDP=http:\/\/127\.0\.0\.1:\$\{port\}/);
  const session = readFileSync(join(NOTE_DIR, "lib/note-session.mjs"), "utf8");
  assert.match(session, /"--disable-blink-features=AutomationControlled", \.\.\.extraArgs/);
});

/** 一時リポジトリ (bare の remote + clone) を作る。親の git の環境変数 (hook の中で動くときの GIT_DIR など) は渡さない。 */
function makeRecordRepo(t) {
  const root = mkdtempSync(join(tmpdir(), "note-publish-record-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")));
  Object.assign(env, { GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1", GIT_TERMINAL_PROMPT: "0" });
  const remote = join(root, "remote.git");
  const work = join(root, "work");
  const git = (cwd, ...args) => {
    const result = spawnSync("git", args, { cwd, env, encoding: "utf8" });
    assert.equal(result.status, 0, `git ${args.join(" ")}: ${result.stderr}`);
    return result.stdout.trim();
  };
  git(root, "init", "--bare", "--initial-branch=main", remote);
  git(root, "clone", remote, work);
  git(work, "config", "user.name", "test");
  git(work, "config", "user.email", "test@example.invalid");
  git(work, "config", "core.hooksPath", ".git/hooks");
  git(work, "checkout", "-B", "main");
  writeFileSync(join(work, "articles.json"), '{"status":"draft"}\n');
  git(work, "add", "articles.json");
  git(work, "commit", "-m", "init");
  git(work, "push", "-u", "origin", "main");
  const setHook = (exitCode) => {
    const hook = join(work, ".git/hooks/pre-commit");
    mkdirSync(join(work, ".git/hooks"), { recursive: true });
    writeFileSync(hook, `#!/bin/sh\nexit ${exitCode}\n`);
    chmodSync(hook, 0o755);
  };
  const record = (content = '{"status":"published"}\n') => {
    writeFileSync(join(work, "articles.json"), content);
    return spawnSync("bash", [join(NOTE_DIR, "commit-publish-record.sh"), "chore(note): record", "articles.json"], { cwd: work, env, encoding: "utf8" });
  };
  return { git, remote, work, setHook, record };
}

test("publish record: a pre-commit failure stops before push and shows up in the report line", (t) => {
  const repo = makeRecordRepo(t);
  const before = repo.git(repo.remote, "rev-parse", "main");
  repo.setHook(1);
  const result = repo.record();
  assert.notEqual(result.status, 0);
  assert.match(result.stdout.trim().split("\n").at(-1), /^PUBLISH_RECORD: FAILED commit/);
  assert.equal(repo.git(repo.remote, "rev-parse", "main"), before, "nothing may reach the remote");
  assert.equal(repo.git(repo.work, "rev-parse", "HEAD"), before, "no commit may be created");
});

test("publish record: commit and push succeed together, and a push failure is reported separately", (t) => {
  const repo = makeRecordRepo(t);
  repo.setHook(0);
  const pushed = repo.record();
  assert.equal(pushed.status, 0, pushed.stdout + pushed.stderr);
  const head = repo.git(repo.work, "rev-parse", "HEAD");
  assert.equal(repo.git(repo.remote, "rev-parse", "main"), head);
  assert.match(pushed.stdout.trim().split("\n").at(-1), new RegExp(`^PUBLISH_RECORD: pushed ${head.slice(0, 9)}`));

  rmSync(repo.remote, { recursive: true, force: true });
  const unpushed = repo.record('{"status":"published","noteUrl":"x"}\n');
  assert.notEqual(unpushed.status, 0);
  assert.match(unpushed.stdout.trim().split("\n").at(-1), /^PUBLISH_RECORD: FAILED push/);
});

test("the publish skill records the ledger through the fail-closed commit script and reports its last line", () => {
  const skill = readFileSync(join(NOTE_DIR, "../../skills/note/publish-note/SKILL.md"), "utf8");
  assert.match(skill, /commit-publish-record\.sh/);
  assert.match(skill, /PUBLISH_RECORD:/);
  assert.match(skill, /launch-note-cdp\.mjs/);
});
