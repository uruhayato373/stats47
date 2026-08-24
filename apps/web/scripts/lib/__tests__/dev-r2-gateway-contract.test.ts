import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const WEB_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

function read(relativePath: string): string {
  return readFileSync(path.join(WEB_ROOT, relativePath), 'utf8');
}

describe('Windows development R2 gateway contract', () => {
  it('npm run dev starts the supervised development server', () => {
    const packageJson = JSON.parse(read('package.json')) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts.dev).toContain('scripts/dev-server.ts');
  });

  it('routes both server data and browser assets through localhost', () => {
    const supervisor = read('scripts/dev-server.ts');

    expect(supervisor).toContain('R2_PUBLIC_FETCH_URL');
    expect(supervisor).toContain('NEXT_PUBLIC_R2_PUBLIC_URL');
    expect(supervisor).toContain('http://127.0.0.1:');
    expect(supervisor).toContain("'powershell.exe'");
  });

  it('serves authored page-components from the git SSOT during development', () => {
    const supervisor = read('scripts/dev-server.ts');
    const gateway = read('scripts/r2-dev-gateway.ps1');

    expect(supervisor).toContain(
      "path.join(SCRIPT_DIR, 'data', 'page-components')"
    );
    expect(supervisor).toContain("'-LocalOverrideRoot'");
    expect(gateway).toContain('"app/page-components/"');
    expect(gateway).toContain('X-R2-Dev-Source');
    expect(gateway).toContain('local-override');
    expect(gateway).toContain('Cache-Control"] = "no-store"');
  });

  it('serves generated municipality snapshots from the local R2 mirror', () => {
    const supervisor = read('scripts/dev-server.ts');
    const gateway = read('scripts/r2-dev-gateway.ps1');

    expect(supervisor).toContain("'.local', 'r2'");
    expect(supervisor).toContain("'-LocalR2Root'");
    expect(gateway).toContain('"app/municipalities/"');
    expect(gateway).toContain('$localR2Base');
  });

  it('uses Windows credentials without weakening TLS and stays read-only', () => {
    const gateway = read('scripts/r2-dev-gateway.ps1');

    expect(gateway).toContain('Add-Type -AssemblyName System.Net.Http');
    expect(gateway).toContain('DefaultNetworkCredentials');
    expect(gateway).toContain('"GET", "HEAD"');
    expect(gateway).not.toContain('ServerCertificateCustomValidationCallback');
    expect(gateway).not.toContain('NODE_TLS_REJECT_UNAUTHORIZED');
  });

  it('keeps the .ps1 in UTF-8 with a BOM', () => {
    // ★powershell.exe (Windows PowerShell 5.1) は BOM の無い .ps1 を ANSI (CP932) として
    //   読む。UTF-8 の日本語がコメントにあるだけでも化けて「予期しない '}'」の構文エラーに
    //   なり、gateway が起動しなくなる (2026-08-21 実測: BOM 無しで 2 件の構文エラー、
    //   BOM 付きで 0 件)。ここが落ちたら BOM を消したということ。
    const raw = readFileSync(path.join(WEB_ROOT, 'scripts/r2-dev-gateway.ps1'));

    expect(raw.subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
  });

  it('caches GET only, and never caches conditional or partial responses', () => {
    const gateway = read('scripts/r2-dev-gateway.ps1');

    // HEAD を GET の本文で返すと Content-Length を偽ることになる。
    expect(gateway).toContain(
      'if ($Request.HttpMethod -ne "GET") { return $false }'
    );
    // Range / 条件付きは応答が要求ごとに変わる。
    expect(gateway).toContain('"Range", "If-None-Match", "If-Modified-Since"');
    // 200 以外を配り続けないこと。
    expect(gateway).toContain('[int]$remoteResponse.StatusCode -eq 200');
    // 上限が外れるとメモリを無制限に食う。
    expect(gateway).toContain('$maxCacheBytes');
    expect(gateway).toContain('$maxCacheEntries');
  });

  it('lets the developer turn the cache off from the environment', () => {
    const supervisor = read('scripts/dev-server.ts');
    const turbo = JSON.parse(
      readFileSync(path.join(WEB_ROOT, '../../turbo.json'), 'utf8')
    ) as { globalPassThroughEnv: string[] };

    expect(supervisor).toContain('R2_DEV_GATEWAY_CACHE_SECONDS');
    expect(supervisor).toContain("'-CacheSeconds'");
    // ★turbo 2.x は strict env mode。宣言しないと子プロセスへ渡らないので、
    //   env での opt-out が黙って効かなくなる (R2_DEV_GATEWAY が実際にそうなっていた)。
    for (const name of [
      'R2_DEV_GATEWAY',
      'R2_DEV_GATEWAY_CACHE_SECONDS',
      'R2_DEV_GATEWAY_PORT',
      'R2_DEV_GATEWAY_UPSTREAM',
      'PWSH_PATH',
      'PORT',
    ]) {
      expect(turbo.globalPassThroughEnv).toContain(name);
    }
  });

  it('does not replace Next.js devtools with a missing local module', () => {
    const nextConfig = read('next.config.ts');

    expect(nextConfig).not.toContain('next-devtools-stub.ts');
  });
});
