import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

// The coverage inventory owns tests split into the separate coverage step.
// Project configs consume the child-only flag; CLI excludes are not inherited reliably.
export function packageProjects(root = ROOT) {
  const inventory = JSON.parse(fs.readFileSync(path.join(root, '.claude/config/critical-module-coverage.json'), 'utf8'));
  const covered = new Set(inventory.modules.map((m) => m.workspace));
  for (const workspace of covered) {
    if (workspace.startsWith('packages/') && !['packages/data-configs', 'packages/r2-storage'].includes(workspace))
      throw new Error(`Add a blocking coverage step before splitting ${workspace}`);
  }
  const config = fs.readFileSync(path.join(root, 'vitest.config.ts'), 'utf8');
  const projects = [];
  for (const match of config.matchAll(/["'](packages\/[^"']+)\/vitest\.config\.[cm]?ts["']/g)) {
    const workspace = match[1];
    const filename = match[0].slice(1, -1);
    const source = fs.readFileSync(path.join(root, filename), 'utf8');
    const name = /\bname:\s*["']([^"']+)["']/.exec(source)?.[1]
      ?? JSON.parse(fs.readFileSync(path.join(root, workspace, 'package.json'), 'utf8')).name;
    if (!name?.startsWith('@stats47/')) throw new Error(`Explicit package test name required: ${filename}`);
    projects.push(name);
  }
  if (!projects.length) throw new Error('No package test projects selected');
  return projects;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = [process.argv.includes('--list') ? 'list' : 'run'];
  if (args[0] === 'list') args.push('--filesOnly');
  for (const name of packageProjects()) args.push('--project', name);
  const child = spawn(process.execPath, [path.join(ROOT, 'node_modules/vitest/vitest.mjs'), ...args], {
    cwd: ROOT, stdio: 'inherit', windowsHide: true,
    env: { ...process.env, STATS47_COVERAGE_SPLIT: '1' },
  });
  child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
  child.on('exit', (code) => { process.exitCode = code ?? 1; });
}
