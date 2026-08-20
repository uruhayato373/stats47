#!/usr/bin/env tsx
import { spawn, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_NEXT_PORT = 3000;
const DEFAULT_GATEWAY_PORT = 4777;
const DEFAULT_R2_UPSTREAM = 'https://storage.stats47.jp';
const GATEWAY_START_ATTEMPTS = 60;
const GATEWAY_START_INTERVAL_MS = 250;

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(SCRIPT_DIR, '..');

function parsePort(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`不正なポート番号です: ${value}`);
  }
  return port;
}

function shouldUseWindowsGateway(): boolean {
  if (process.env.R2_DEV_GATEWAY === '0') return false;
  if (process.env.R2_DEV_GATEWAY === '1') return true;
  return process.platform === 'win32';
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForGateway(url: string, child: ChildProcess): Promise<void> {
  for (let attempt = 0; attempt < GATEWAY_START_ATTEMPTS; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(
        `R2開発ゲートウェイが起動前に終了しました (${child.exitCode})`
      );
    }
    try {
      const response = await fetch(`${url}/__health`);
      if (response.ok) return;
    } catch {
      // 起動待ち。最終試行まで短い間隔で再確認する。
    }
    await delay(GATEWAY_START_INTERVAL_MS);
  }
  throw new Error('R2開発ゲートウェイの起動がタイムアウトしました');
}

function startNext(nextPort: number, r2BaseUrl?: string): ChildProcess {
  const require = createRequire(import.meta.url);
  const nextBin = require.resolve('next/dist/bin/next');
  const env = r2BaseUrl
    ? {
        ...process.env,
        R2_PUBLIC_FETCH_URL: r2BaseUrl,
        NEXT_PUBLIC_R2_PUBLIC_URL: r2BaseUrl,
      }
    : process.env;

  return spawn(process.execPath, [nextBin, 'dev', '--port', String(nextPort)], {
    cwd: APP_ROOT,
    env,
    stdio: 'inherit',
  });
}

function startWindowsGateway(port: number, upstream: string): ChildProcess {
  const scriptPath = path.join(SCRIPT_DIR, 'r2-dev-gateway.ps1');
  const powershell = process.env.PWSH_PATH || 'powershell.exe';
  return spawn(
    powershell,
    [
      '-NoLogo',
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      scriptPath,
      '-Port',
      String(port),
      '-UpstreamBase',
      upstream,
    ],
    { cwd: APP_ROOT, stdio: 'inherit' }
  );
}

async function main(): Promise<void> {
  const nextPort = parsePort(process.env.PORT, DEFAULT_NEXT_PORT);
  let gateway: ChildProcess | null = null;
  let next: ChildProcess | null = null;
  let isStopping = false;

  const stop = (exitCode: number): void => {
    if (isStopping) return;
    isStopping = true;
    next?.kill();
    gateway?.kill();
    process.exitCode = exitCode;
  };

  process.once('SIGINT', () => stop(130));
  process.once('SIGTERM', () => stop(143));

  if (shouldUseWindowsGateway()) {
    const gatewayPort = parsePort(
      process.env.R2_DEV_GATEWAY_PORT,
      DEFAULT_GATEWAY_PORT
    );
    const gatewayUrl = `http://127.0.0.1:${gatewayPort}`;
    const upstream = process.env.R2_DEV_GATEWAY_UPSTREAM || DEFAULT_R2_UPSTREAM;

    gateway = startWindowsGateway(gatewayPort, upstream);
    gateway.once('error', (error) => {
      console.error('R2開発ゲートウェイを起動できませんでした', error);
      stop(1);
    });
    await waitForGateway(gatewayUrl, gateway);
    console.log(`[dev] R2 data/images: ${gatewayUrl}`);
    next = startNext(nextPort, gatewayUrl);
  } else {
    next = startNext(nextPort);
  }

  next.once('error', (error) => {
    console.error('Next.js開発サーバーを起動できませんでした', error);
    stop(1);
  });
  next.once('exit', (code) => stop(code ?? 1));
  gateway?.once('exit', (code) => {
    if (!isStopping) {
      console.error(`R2開発ゲートウェイが終了しました (${code ?? 1})`);
      stop(code ?? 1);
    }
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
