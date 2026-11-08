#!/usr/bin/env node
/**
 * ローカルの成果物フォルダを Google Drive の `stats47/` 配下へ移す (コピー → 全ファイルの SHA-256 を読み戻して照合 → 一致したときだけローカルを削除)。
 * 人が見返す作業記録・候補画像・納品物の控えなど、R2 に正本を置かないものの置き場。規則は `.claude/rules/local-environment.md`「ローカルに残さない」。
 *
 *   node .claude/scripts/lib/drive-archive.mjs <local-dir> <drive-path> [--apply]
 *     <local-dir>  repo 内の `.local/` 配下 (それ以外は拒否)
 *     <drive-path> Drive の `stats47/` からの相対パス (例: Kindle表紙/_drafts)。既存のフォルダには上書きしない
 *   --apply が無ければ計画 (件数・容量・行き先) だけを表示する。
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolveVaultRoot } from '../source-vault/source-vault.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function listFiles(dir) {
  const out = [];
  const visit = (d) => {
    for (const name of fs.readdirSync(d)) {
      const full = path.join(d, name);
      const stat = fs.lstatSync(full);
      if (stat.isSymbolicLink()) throw new Error(`symlink は移さない: ${full}`);
      if (stat.isDirectory()) visit(full);
      else if (stat.isFile()) out.push({ rel: path.relative(dir, full), bytes: stat.size });
    }
  };
  visit(dir);
  return out;
}

const sha256 = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

/** @param {string} localDir @param {string} driveRel @param {{ apply?: boolean, driveRoot?: string, root?: string }} [options] */
export function archiveToDrive(localDir, driveRel, { apply = false, driveRoot, root = ROOT } = {}) {
  const source = path.resolve(root, localDir);
  const localBase = path.join(root, '.local') + path.sep;
  if (!source.startsWith(localBase)) throw new Error(`.local 配下だけを移せる: ${source}`);
  if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) throw new Error(`フォルダが無い: ${source}`);
  if (!driveRel || path.isAbsolute(driveRel) || driveRel.split(/[\\/]/).includes('..')) throw new Error(`Drive 側は stats47/ からの相対パス: ${driveRel}`);
  const base = driveRoot ?? resolveVaultRoot().root;
  const target = path.join(base, driveRel);
  if (fs.existsSync(target)) throw new Error(`Drive 側に既にある (上書きしない): ${target}`);
  const files = listFiles(source);
  const plan = { source, target, files: files.length, bytes: files.reduce((n, f) => n + f.bytes, 0), applied: false };
  if (!apply) return plan;
  const expected = new Map(files.map((f) => [f.rel, sha256(path.join(source, f.rel))]));
  fs.cpSync(source, target, { recursive: true, errorOnExist: true, force: false });
  for (const [rel, hash] of expected) {
    const copied = path.join(target, rel);
    if (!fs.existsSync(copied) || sha256(copied) !== hash) throw new Error(`読み戻しの SHA が一致しない (ローカルは消していない): ${rel}`);
  }
  fs.rmSync(source, { recursive: true, force: false });
  return { ...plan, applied: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const [localDir, driveRel] = args.filter((a) => !a.startsWith('--'));
  if (!localDir || !driveRel) {
    console.error('usage: drive-archive.mjs <local-dir> <drive-path> [--apply]');
    process.exit(2);
  }
  try {
    const result = archiveToDrive(localDir, driveRel, { apply: args.includes('--apply') });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`[drive-archive] ${error.message}`);
    process.exit(1);
  }
}
