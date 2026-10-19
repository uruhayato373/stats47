import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/** ファイルまたはディレクトリ配下の最も新しい更新時刻。 */
function newestMtime(repoRoot: string, rel: string): string | null {
  const full = path.join(repoRoot, rel);
  if (!fs.existsSync(full)) return null;
  const stat = fs.statSync(full);
  if (stat.isFile()) return stat.mtime.toISOString();
  const mtimes = fs
    .readdirSync(full, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => fs.statSync(path.join(entry.parentPath, entry.name)).mtimeMs);
  return mtimes.length > 0 ? new Date(Math.max(...mtimes)).toISOString() : stat.mtime.toISOString();
}

function git(repoRoot: string, args: string[]): string {
  try {
    return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

/**
 * データが最後に変わった時刻。git はファイルの更新時刻を保存しないので、clone・checkout 直後の mtime は
 * 取得時刻ではなく checkout 時刻になる (BUSINESS-PLAN-FRESHNESS-MTIME-01)。最後にコミットした時刻を使い、
 * 未コミットの変更があるときと git が使えないときだけ mtime に戻す。
 */
export function lastChanged(repoRoot: string, rel: string): string | null {
  if (!fs.existsSync(path.join(repoRoot, rel))) return null;
  if (git(repoRoot, ['status', '--porcelain', '--', rel])) return newestMtime(repoRoot, rel);
  // 改名だけのコミットは数えない
  const committed = git(repoRoot, ['log', '-1', '--format=%cI', '-M', '--diff-filter=AM', '--', rel]);
  return committed ? new Date(committed).toISOString() : newestMtime(repoRoot, rel);
}
