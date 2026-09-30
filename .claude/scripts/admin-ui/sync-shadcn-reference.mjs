#!/usr/bin/env node
/**
 * sync-shadcn-reference.mjs — 管理画面の UI 部品と比べる shadcn/ui 公式ソースを取り直す
 * ---------------------------------------------------------------------------
 * 公式の registry（https://ui.shadcn.com/r/styles/new-york-v4/<name>.json）から ui/<name>.tsx を取り出し、
 * .claude/config/shadcn-reference/<name>.tsx に保存する。check-shadcn-parity はこの保存物（コミット済み）と
 * apps/admin/components/ui/*.tsx を比べるので、CI はネットワークに依存しない。
 * 公式が更新されたときだけ手で実行し、差分を見てから部品側を追従させる（ADMIN-UI-SHADCN-01）。
 *
 * 使い方: node .claude/scripts/admin-ui/sync-shadcn-reference.mjs            # 管理画面に置いている部品の分だけ取り直す
 *         node .claude/scripts/admin-ui/sync-shadcn-reference.mjs dialog     # 名前を指定して取る（新しく部品を足すとき）
 * exit: 0=全件取得 / 2=取得できないものがあった（ネットワーク・名前違い）
 * ---------------------------------------------------------------------------
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..', '..');
const UI_DIR = join(ROOT, 'apps/admin/components/ui');
const OUT = join(ROOT, '.claude/config/shadcn-reference');
const STYLE = 'new-york-v4';
const TAG = '[sync-shadcn-reference]';

const INSTALL = process.argv.includes('--install');
const args = process.argv.slice(2).filter((a) => a !== '--install');
const names = args.length
  ? args
  : readdirSync(UI_DIR).filter((f) => f.endsWith('.tsx')).map((f) => f.replace(/\.tsx$/, ''));
mkdirSync(OUT, { recursive: true });

let failed = 0;
for (const name of names) {
  const url = `https://ui.shadcn.com/r/styles/${STYLE}/${name}.json`;
  try {
    // 会社 PC のプロキシ越しでも通る curl を使う（fetch は証明書失効確認で落ちる・measurement-incidents.md）
    const body = execFileSync('curl', ['-sS', '--ssl-no-revoke', '--fail', '--max-time', '30', url], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
    const item = JSON.parse(body);
    const file = item.files?.find((f) => f.path.endsWith(`/${name}.tsx`) || f.path === `${name}.tsx`);
    if (!file?.content) throw new Error('registry に ui/<name>.tsx が無い');
    const content = file.content.replace(/\r\n/g, '\n');
    writeFileSync(join(OUT, `${name}.tsx`), content, 'utf8');
    if (INSTALL) {
      // 公式の registry 内の別名を admin の alias へ直すだけ (クラスには触れない)。既存の部品は上書きしない
      const target = join(UI_DIR, `${name}.tsx`);
      if (existsSync(target)) throw new Error(`${name}.tsx は既にある (上書きしない。差分は check-shadcn-parity で見る)`);
      const rewritten = content
        .replace(/from "cn"/g, 'from "@/lib/cn"')
        .replace(/@\/registry\/new-york-v4\/ui\//g, '@/components/ui/')
        .replace(/@\/registry\/new-york-v4\/hooks\//g, '@/hooks/');
      const header = `// shadcn/ui 公式（new-york-v4）の ${name}.tsx をそのまま使う。変えたのは import 先（cn → @/lib/cn・registry の別名 → admin の alias）だけ。\n// 公式との差は check-shadcn-parity が止める（参照: .claude/config/shadcn-reference/${name}.tsx・例外: .claude/config/shadcn-parity-allow.json）。\n`;
      writeFileSync(target, header + rewritten, 'utf8');
    }
    console.log(`${TAG} ${name} ← ${url}（${file.content.length} 字）`);
  } catch (e) {
    failed++;
    console.error(`${TAG} ✗ ${name}: ${String(e.message).split('\n')[0]}`);
  }
}
console.log(`${TAG} ${names.length} 件中 取得 ${names.length - failed} 件 → ${OUT}`);
process.exitCode = failed ? 2 : 0;
