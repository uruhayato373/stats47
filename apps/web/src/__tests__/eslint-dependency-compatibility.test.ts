// @vitest-environment node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

import nextPlugin from '@next/eslint-plugin-next';
import { Linter } from 'eslint';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const rootDirsModule = require.resolve('@next/eslint-plugin-next/dist/utils/get-root-dirs');
const { getRootDirs } = require(rootDirsModule) as {
  getRootDirs: (context: { cwd: string; settings: { next?: { rootDir?: string | string[] } } }) => string[];
};
let directory: string;

beforeAll(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-eslint-glob-'));
  for (const app of ['web', 'admin']) {
    const page = path.join(directory, 'apps', app, 'app', 'about');
    fs.mkdirSync(page, { recursive: true });
    fs.writeFileSync(path.join(page, 'page.tsx'), 'export default function Page() { return null; }');
    fs.writeFileSync(path.join(directory, 'apps', app, 'app', 'page.tsx'), 'export default function Page() { return null; }');
    const pages = path.join(directory, 'apps', app, 'pages');
    fs.mkdirSync(pages);
    fs.writeFileSync(path.join(pages, 'about.tsx'), 'export default function Page() { return null; }');
  }
  fs.writeFileSync(path.join(directory, 'apps', 'not-a-project.txt'), 'fixture');
});
afterAll(() => {
  const target = path.resolve(directory);
  if (path.dirname(target) !== path.resolve(os.tmpdir()) || !path.basename(target).startsWith('stats47-eslint-glob-'))
    throw Error('Unexpected fixture cleanup path');
  fs.rmSync(target, { recursive: true, force: true });
});

describe('Next.js ESLint directory discovery after removing vulnerable braces', () => {
  it('keeps the current directory when no root glob is configured', () => {
    expect(getRootDirs({ cwd: directory, settings: {} })).toEqual([directory]);
  });
  it.each(['glob', 'array', 'braces', 'windows', 'relative'] as const)('discovers only project directories with %s settings', (kind) => {
    const base = directory.replace(/\\/g, '/');
    const expectedBase = kind === 'relative' ? path.relative(process.cwd(), directory).replace(/\\/g, '/') : base;
    const rootDir = kind === 'array' ? [`${base}/apps/web`, `${base}/apps/admin`]
      : kind === 'braces' ? `${base}/apps/{web,admin}`
      : kind === 'relative' ? `${expectedBase}/apps/*`
      : kind === 'windows' ? `${base}/apps/*`.replace(/\//g, '\\') : `${base}/apps/*`;
    expect(getRootDirs({ cwd: directory, settings: { next: { rootDir } } }).map(p => p.replace(/\\/g, '/')).sort())
      .toEqual([`${expectedBase}/apps/admin`, `${expectedBase}/apps/web`]);
  });
  it.each(['/', '/about/'])('still detects the internal link %s through the real Next.js rule', (href) => {
    const linter = new Linter({ cwd: directory });
    const config = {
      files: ['**/*.jsx'],
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      plugins: { '@next/next': nextPlugin },
      settings: { next: { rootDir: path.join(directory, 'apps', 'w*') } },
      rules: { '@next/next/no-html-link-for-pages': 'error' as const },
    };
    const internal = linter.verify(`<a href="${href}">About</a>`, config, { filename: path.join(directory, 'example.jsx') });
    expect(internal.map(message => message.ruleId)).toEqual(['@next/next/no-html-link-for-pages']);
    expect(linter.verify('<a href="https://example.com/about/">About</a>', config, { filename: path.join(directory, 'example.jsx') })).toEqual([]);
  });
  it('handles a deeply nested brace pattern without exhausting the call stack', () => {
    const pattern = directory.replace(/\\/g, '/') + '/' + '{'.repeat(5000) + 'x' + '}'.repeat(5000);
    const result = execFileSync(process.execPath, ['-e',
      'const {getRootDirs}=require(process.argv[1]);process.stdout.write(JSON.stringify(getRootDirs({cwd:process.argv[2],settings:{next:{rootDir:process.argv[3]}}})));',
      rootDirsModule, directory, pattern], { encoding: 'utf8', timeout: 5000, maxBuffer: 64 * 1024 });
    expect(JSON.parse(result)).toEqual([]);
  });
});
