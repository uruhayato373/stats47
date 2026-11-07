#!/usr/bin/env node
/**
 * コード・スキル・エージェントが書く `.local/<名前>` が config/local-resources.json の台帳に載っているかを検査する (2026-11-08 オーナー依頼)。
 *
 * 台帳に無い置き場は誰も消さないので溜まり続ける (2026-11-08 に一回きりの調査スクリプト・ログ・試作が 180 個、2.6GB)。
 * 新しく `.local` に置き場を作るなら、期限で消す作業領域 (cachePaths) か、年齢では消さないもの (localRegistry の auth / state / product)
 * として理由つきで登録する。一回きりの作業は `.local` ではなく OS の一時領域に作り、終わったら消す。
 * 規則は `.claude/rules/local-environment.md`「ローカルに残さない」。
 *
 *   node .claude/scripts/lib/check-local-registry.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SOURCE = /\.(?:ts|tsx|mts|mjs|cjs|js|sh|ya?ml|md)$/;
const SKIP = /(?:__tests__\/|\.test\.|(?:^|\/)check-local-registry\.mjs$|^docs\/|^\.claude\/(?:todo|memory|state)\/|^data\/)/;
// `.local/<名前>` の名前だけを取る。テンプレート (${...})・glob・説明用の <...> は名前を決められないので数えない
const LOCAL_REF = /(?:^|[^A-Za-z0-9_./-])\.local\/([A-Za-z0-9][A-Za-z0-9._-]*)(?=[/'"`\s),:;\]}]|$)/g;

function globToRegExp(pattern) {
  return new RegExp('^' + pattern.replace(/[.+^$(){}|[\]\\]/g, '\\$&').replace(/\*/g, '[^/\\\\]*') + '$');
}

/** config から `.local` 直下で許される名前の判定器を作る */
export function registeredMatcher(config) {
  const tops = [
    ...(config.localRegistry ?? []).map((e) => e.pattern),
    ...(config.cachePaths ?? [])
      .map((e) => (typeof e === 'string' ? e : e.path).split(/[\\/]+/))
      .filter((s) => s[0] === '.local' && s.length > 1)
      .map((s) => s[1]),
    ...(config.protectedPaths ?? [])
      .map((p) => p.split(/[\\/]+/))
      .filter((s) => s[0] === '.local' && s.length > 1)
      .map((s) => s[1]),
  ].map(globToRegExp);
  return (name) => tops.some((re) => re.test(name));
}

/** files: [{ path, text }] → [{ path, name }] (台帳に無い参照) */
export function auditLocalRefs(files, config) {
  const isRegistered = registeredMatcher(config);
  const missing = [];
  for (const { path, text } of files) {
    if (!SOURCE.test(path) || SKIP.test(path)) continue;
    const seen = new Set();
    for (const match of text.matchAll(LOCAL_REF)) {
      const name = match[1].replace(/\.+$/, ''); // 文末の句点を名前に含めない
      if (seen.has(name) || isRegistered(name)) continue;
      seen.add(name);
      missing.push({ path, name });
    }
  }
  return missing;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
  const config = JSON.parse(readFileSync(resolve(root, 'config/local-resources.json'), 'utf8'));
  const paths = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\0')
    .filter((p) => p && SOURCE.test(p) && !SKIP.test(p));
  const files = [];
  for (const path of paths) {
    try {
      files.push({ path, text: readFileSync(resolve(root, path), 'utf8') });
    } catch {
      // 削除済みでまだ index に残るファイルは読まない
    }
  }
  const missing = auditLocalRefs(files, config);
  if (missing.length) {
    for (const { path, name } of missing) console.error(`${path}: .local/${name} が config/local-resources.json の台帳に無い`);
    console.error(
      `\n${missing.length} 件。一回きりの作業なら OS の一時領域 (os.tmpdir()) に作り、終わったら消す。残すなら cachePaths (期限) か localRegistry (auth / state / product と理由) に登録する。`
    );
    process.exit(1);
  }
  console.log(`✓ .local の置き場はすべて台帳にある (${files.length} ファイルを走査)`);
}
