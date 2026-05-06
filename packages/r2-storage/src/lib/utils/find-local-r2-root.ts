import * as fs from "fs";
import * as path from "path";

/**
 * ローカル R2 ルート (.local/r2/) を探す。
 * process.cwd() が apps/web/ 等のサブディレクトリを指す場合でも
 * 親ディレクトリを辿ってリポジトリルートの .local/r2/ を見つける。
 */
export function findLocalR2Root(): string | null {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, ".local/r2");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}
