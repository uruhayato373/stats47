/**
 * 事業計画 state の取得元の鮮度 (BUSINESS-PLAN-FRESHNESS-MTIME-01)。
 * git はファイルの更新時刻を保存しないので、clone・checkout 直後に mtime を使うと全取得元が「今日」に見えた
 * (2026-10-07 のクラウド clone で、X の最新計測 06-07 が 10-07 になった)。
 * 守ること: コミット済みならデータを変えたコミットの時刻 / 改名だけのコミットは数えない / 未コミットの変更と git なしは mtime。
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { lastChanged } from '../data-freshness';

const DATA_COMMIT = '2026-06-07T10:00:00+09:00';
const RENAME_COMMIT = '2026-09-01T10:00:00+09:00';

const dirs: string[] = [];

function makeRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bp-freshness-'));
  dirs.push(dir);
  return dir;
}

function git(cwd: string, args: string[], date?: string): void {
  execFileSync('git', args, {
    cwd,
    stdio: 'ignore',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'test',
      GIT_AUTHOR_EMAIL: 'test@example.com',
      GIT_COMMITTER_NAME: 'test',
      GIT_COMMITTER_EMAIL: 'test@example.com',
      ...(date ? { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } : {}),
    },
  });
}

/** data/x/posts.json を DATA_COMMIT の時刻でコミットし、ファイルの mtime だけ「今」にしたリポジトリ (clone 直後と同じ状態)。 */
function repoWithCommittedData(): string {
  const dir = makeRepo();
  git(dir, ['init', '-q']);
  fs.mkdirSync(path.join(dir, 'data/x'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'data/x/posts.json'), '{"posts":[1]}\n');
  git(dir, ['add', '.']);
  git(dir, ['commit', '-q', '-m', 'data'], DATA_COMMIT);
  const now = new Date();
  fs.utimesSync(path.join(dir, 'data/x/posts.json'), now, now);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('lastChanged', () => {
  it('clone 直後で mtime が今でも、データを変えたコミットの時刻を返す', () => {
    const dir = repoWithCommittedData();
    expect(lastChanged(dir, 'data/x')).toBe(new Date(DATA_COMMIT).toISOString());
  });

  it('改名だけのコミットは鮮度に数えない', () => {
    const dir = repoWithCommittedData();
    git(dir, ['mv', 'data/x/posts.json', 'data/x/posts-renamed.json']);
    git(dir, ['commit', '-q', '-m', 'rename'], RENAME_COMMIT);
    expect(lastChanged(dir, 'data/x')).toBe(new Date(DATA_COMMIT).toISOString());
  });

  it('未コミットの変更があるときはファイルの更新時刻に戻す', () => {
    const dir = repoWithCommittedData();
    const edited = new Date('2026-10-19T00:00:00Z');
    fs.writeFileSync(path.join(dir, 'data/x/posts.json'), '{"posts":[1,2]}\n');
    fs.utimesSync(path.join(dir, 'data/x/posts.json'), edited, edited);
    expect(lastChanged(dir, 'data/x')).toBe(edited.toISOString());
  });

  it('git の外ではファイルの更新時刻を使い、無いパスは null', () => {
    const dir = makeRepo();
    const at = new Date('2026-08-01T00:00:00Z');
    fs.writeFileSync(path.join(dir, 'a.json'), '{}');
    fs.utimesSync(path.join(dir, 'a.json'), at, at);
    expect(lastChanged(dir, 'a.json')).toBe(at.toISOString());
    expect(lastChanged(dir, 'missing')).toBeNull();
  });
});
