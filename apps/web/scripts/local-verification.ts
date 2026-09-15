#!/usr/bin/env tsx
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { changedFilesSince } from "../../../.claude/scripts/page-quality/lib/git-diff";
import { affectedTemplates } from "../../../.claude/scripts/page-quality/templates";
import { classifyPrQualityPaths } from "../../../.claude/scripts/lib/plan-pr-quality.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(SCRIPT_DIR, "..");
const PROJECT_ROOT = path.resolve(APP_ROOT, "../..");
const RELEASE_DIST_DIR = ".local/next-release";
const REPRESENTATIVE_E2E = [
  "tests/e2e/public-route-contract.spec.ts",
  "tests/e2e/responsive-pr.spec.ts",
  "tests/e2e/accessibility/representative-routes.spec.ts",
  "tests/e2e/seo/structured-data.spec.ts",
] as const;
const MAX_LOCAL_TEST_FILES = 12;

type Mode = "fast" | "release";

function optionValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function parseMode(): Mode {
  const mode = process.argv[2] ?? "fast";
  if (mode !== "fast" && mode !== "release") {
    throw new Error(`modeは fast または release を指定してください: ${mode}`);
  }
  return mode;
}

function npmCliPath(): string {
  if (process.env.npm_execpath) return process.env.npm_execpath;
  return path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
}

function spawnNpm(
  args: string[],
  options: { env?: NodeJS.ProcessEnv; stdio?: "inherit" | "ignore" } = {}
): ChildProcess {
  return spawn(process.execPath, [npmCliPath(), ...args], {
    cwd: PROJECT_ROOT,
    env: options.env ?? process.env,
    stdio: options.stdio ?? "inherit",
    windowsHide: true,
  });
}

async function runNpm(label: string, args: string[], env?: NodeJS.ProcessEnv): Promise<void> {
  console.log(`\n[local-check] ${label}`);
  const child = spawnNpm(args, { env });
  const code = await new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (exitCode) => resolve(exitCode ?? 1));
  });
  if (code !== 0) throw new Error(`${label} が失敗しました (exit ${code})`);
}

function stopOwnedChild(child: ChildProcess | null): void {
  if (!child?.pid || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
      timeout: 10_000,
    });
  } else {
    child.kill("SIGTERM");
  }
}

async function serverIsListening(url: string): Promise<boolean> {
  const parsed = new URL(url);
  const port = Number(parsed.port || (parsed.protocol === "https:" ? "443" : "80"));
  return await new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ host: parsed.hostname, port });
    let settled = false;
    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(1_000);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

async function waitForServer(url: string, child: ChildProcess, timeoutMs = 120_000): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (child.exitCode !== null) {
      throw new Error(`サーバーが起動前に終了しました (exit ${child.exitCode})`);
    }
    if (await serverIsListening(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`サーバー起動がタイムアウトしました: ${url}`);
}

async function findAvailablePort(start = 3100): Promise<number> {
  for (let port = start; port < start + 20; port += 1) {
    const available = await new Promise<boolean>((resolve) => {
      const server = net.createServer();
      server.once("error", () => resolve(false));
      server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
    });
    if (available) return port;
  }
  throw new Error(`${start}〜${start + 19} に空きポートがありません`);
}

async function runChangedCodeChecks(
  changed: string[],
  { withTypeCheck, withTests }: { withTypeCheck: boolean; withTests: boolean },
): Promise<void> {
  const plan = classifyPrQualityPaths(changed);
  if (!plan.web) {
    console.log("[local-check] Webへ影響する変更がないため型・unit検査を省略します");
    return;
  }
  if (plan.type_check && withTypeCheck) {
    await runNpm("Web incremental type-check", [
      "run",
      "type-check:local",
      "--workspace=apps/web",
    ]);
  }
  if (plan.tests && withTests) {
    const directTests = selectDirectWebTests(changed);
    if (directTests.length > 0) {
      await runNpm(`変更・近傍Web unit tests（${directTests.length}件）`, [
        "run",
        "test:run",
        "--workspace=apps/web",
        "--",
        ...directTests,
        "--passWithNoTests",
      ]);
    } else {
      console.log("[local-check] 変更ファイルに直接対応するWeb unit testなし（全件はPR・週次CI）");
    }
  }
}

function selectDirectWebTests(changed: string[]): string[] {
  const selected = new Set<string>();
  const testPath = /(?:^|\/)(?:__tests__\/.*|[^/]+\.(?:test|spec))\.[cm]?[jt]sx?$/;
  for (const repositoryPath of changed) {
    const normalized = repositoryPath.replaceAll("\\", "/");
    if (!normalized.startsWith("apps/web/")) continue;
    const appPath = normalized.slice("apps/web/".length);
    if (!appPath.startsWith("src/")) continue;
    if (testPath.test(appPath)) {
      selected.add(appPath);
      continue;
    }
    if (!/\.[cm]?[jt]sx?$/.test(appPath)) continue;
    const withoutExtension = appPath.replace(/\.[cm]?[jt]sx?$/, "");
    const directory = path.posix.dirname(withoutExtension);
    const basename = path.posix.basename(withoutExtension);
    for (const candidate of [
      `${withoutExtension}.test.ts`,
      `${withoutExtension}.test.tsx`,
      `${withoutExtension}.spec.ts`,
      `${withoutExtension}.spec.tsx`,
      `${directory}/__tests__/${basename}.test.ts`,
      `${directory}/__tests__/${basename}.test.tsx`,
      `${directory}/__tests__/${basename}.spec.ts`,
      `${directory}/__tests__/${basename}.spec.tsx`,
    ]) {
      if (existsSync(path.join(APP_ROOT, candidate))) selected.add(candidate);
    }
  }
  const tests = [...selected].sort();
  if (tests.length > MAX_LOCAL_TEST_FILES) {
    console.log(
      `[local-check] 直接対応test ${tests.length}件のうち${MAX_LOCAL_TEST_FILES}件を実行（残りはPR・週次CI）`,
    );
  }
  return tests.slice(0, MAX_LOCAL_TEST_FILES);
}

async function runPageQuality(baseUrl: string, diffBase: string, all: boolean): Promise<void> {
  const args = [
    "run",
    "page-quality:check",
    "--",
    "--base-url",
    baseUrl,
    "--base",
    diffBase,
    "--runs",
    "1",
  ];
  if (all) args.push("--all");
  else args.push("--max-templates", "3");
  await runNpm(all ? "全テンプレート代表ページ検査" : "変更テンプレート代表ページ検査", args);
}

async function runFast(diffBase: string): Promise<void> {
  const changed = changedFilesSince(diffBase);
  await runChangedCodeChecks(changed, {
    withTypeCheck: process.argv.includes("--typecheck"),
    withTests: process.argv.includes("--tests"),
  });

  const templates = affectedTemplates(changed);
  if (templates.length === 0) {
    console.log("[local-check] 影響するページテンプレートがないためブラウザ検査を省略します");
    return;
  }

  const baseUrl = optionValue("--base-url") ?? "http://localhost:3000";
  let ownedServer: ChildProcess | null = null;
  try {
    if (await serverIsListening(baseUrl)) {
      console.log(`[local-check] 起動済みサーバーを再利用します: ${baseUrl}`);
    } else {
      console.log(`[local-check] Web devサーバーを起動します: ${baseUrl}`);
      const parsed = new URL(baseUrl);
      const gatewayUrl = "http://127.0.0.1:4777";
      const gatewayIsRunning = await serverIsListening(gatewayUrl);
      const gatewayPort = gatewayIsRunning ? "4777" : String(await findAvailablePort(4777));
      ownedServer = spawnNpm(["run", "dev", "--workspace=apps/web"], {
        env: {
          ...process.env,
          PORT: parsed.port || "3000",
          ...(gatewayIsRunning
            ? {
                R2_DEV_GATEWAY: "0",
                R2_PUBLIC_FETCH_URL: gatewayUrl,
                NEXT_PUBLIC_R2_PUBLIC_URL: gatewayUrl,
              }
            : { R2_DEV_GATEWAY_PORT: gatewayPort }),
        },
      });
      await waitForServer(baseUrl, ownedServer);
    }
    await runPageQuality(baseUrl, diffBase, false);
  } finally {
    stopOwnedChild(ownedServer);
  }
}

async function runRelease(diffBase: string): Promise<void> {
  const changed = changedFilesSince(diffBase);
  await runChangedCodeChecks(changed, {
    withTypeCheck: true,
    withTests: process.argv.includes("--tests"),
  });

  await rm(path.join(APP_ROOT, RELEASE_DIST_DIR), { recursive: true, force: true });
  const buildEnv: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: "production",
    NEXT_PUBLIC_ENV: "production",
    NEXT_DIST_DIR: RELEASE_DIST_DIR,
    NEXT_SKIP_BUILD_TYPECHECK: "true",
    NEXT_PUBLIC_R2_PUBLIC_URL: "",
    R2_PUBLIC_FETCH_URL: "",
  };
  await runNpm("Web production build（1回）", ["run", "build", "--workspace=apps/web"], buildEnv);

  const port = await findAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const require = createRequire(import.meta.url);
  const nextBin = require.resolve("next/dist/bin/next");
  const server = spawn(process.execPath, [nextBin, "start", "--port", String(port)], {
    cwd: APP_ROOT,
    env: {
      ...process.env,
      NODE_ENV: "production",
      NEXT_DIST_DIR: RELEASE_DIST_DIR,
      NEXT_PUBLIC_R2_PUBLIC_URL: "https://storage.stats47.jp",
      R2_PUBLIC_FETCH_URL: "https://storage.stats47.jp",
    },
    stdio: "inherit",
    windowsHide: true,
  });

  try {
    await waitForServer(baseUrl, server);
    await runPageQuality(baseUrl, diffBase, true);
    await runNpm("代表Playwright E2E", [
      "run",
      "test:e2e",
      "--workspace=apps/web",
      "--",
      "--project=e2e-chromium",
      ...REPRESENTATIVE_E2E,
    ], {
      ...process.env,
      NODE_ENV: "production",
      PLAYWRIGHT_TEST_BASE_URL: baseUrl,
    });
  } finally {
    stopOwnedChild(server);
  }
}

async function main(): Promise<void> {
  const mode = parseMode();
  const diffBase = optionValue("--base") ?? (mode === "fast" ? "HEAD" : "origin/main");
  console.log(`[local-check] mode=${mode} base=${diffBase}`);
  if (mode === "fast") await runFast(diffBase);
  else await runRelease(diffBase);
  console.log("\n[local-check] 完了しました");
}

main().catch((error: unknown) => {
  console.error(`[local-check] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
