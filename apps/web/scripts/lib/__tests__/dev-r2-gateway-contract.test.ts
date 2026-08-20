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

  it('uses Windows credentials without weakening TLS and stays read-only', () => {
    const gateway = read('scripts/r2-dev-gateway.ps1');

    expect(gateway).toContain('Add-Type -AssemblyName System.Net.Http');
    expect(gateway).toContain('DefaultNetworkCredentials');
    expect(gateway).toContain('"GET", "HEAD"');
    expect(gateway).not.toContain('ServerCertificateCustomValidationCallback');
    expect(gateway).not.toContain('NODE_TLS_REJECT_UNAUTHORIZED');
  });

  it('does not replace Next.js devtools with a missing local module', () => {
    const nextConfig = read('next.config.ts');

    expect(nextConfig).not.toContain('next-devtools-stub.ts');
  });
});
