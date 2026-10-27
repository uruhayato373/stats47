#!/usr/bin/env node
/**
 * sync-shadcn-reference.mjs — 管理画面の UI 部品と比べる正 (テンプレート) のソースを取り直す
 * ---------------------------------------------------------------------------
 * 正は shadcndashboard/next-shadcn-dashboard (MIT・Base UI 版 shadcn の base-nova + style-lyra) の
 * 固定コミットの components/ui/<name>.tsx (2026-10-27 オーナー決定「テンプレートを正としてサイトを寄せる」)。
 * shadcn 公式 registry の base-nova とはクラスが一部違うので、registry ではなくテンプレートを取る。
 * .claude/config/shadcn-reference/<name>.tsx に保存する。check-shadcn-parity はこの保存物（コミット済み）と
 * apps/admin/components/ui/*.tsx を比べるので、CI はネットワークに依存しない。
 * テンプレートを追従させるときは TEMPLATE_SHA を上げて手で実行し、差分を見てから部品側を追従させる。
 *
 * 使い方: node .claude/scripts/admin-ui/sync-shadcn-reference.mjs            # 管理画面に置いている部品の分だけ取り直す
 *         node .claude/scripts/admin-ui/sync-shadcn-reference.mjs dialog     # 名前を指定して取る（新しく部品を足すとき）
 *         --install  取った部品を apps/admin/components/ui/ に置く (既存は上書きしない)
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
const TEMPLATE_REPO = 'shadcndashboard/next-shadcn-dashboard';
const TEMPLATE_SHA = '91deb10215bc6b567d881c608a9ad794e894994f';
const TAG = '[sync-shadcn-reference]';

const INSTALL = process.argv.includes('--install');
const args = process.argv.slice(2).filter((a) => a !== '--install');
const names = args.length
  ? args
  : readdirSync(UI_DIR).filter((f) => f.endsWith('.tsx')).map((f) => f.replace(/\.tsx$/, ''));
mkdirSync(OUT, { recursive: true });

let failed = 0;
for (const name of names) {
  const url = `https://raw.githubusercontent.com/${TEMPLATE_REPO}/${TEMPLATE_SHA}/components/ui/${name}.tsx`;
  try {
    // 会社 PC のプロキシ越しでも通る curl を使う（fetch は証明書失効確認で落ちる・measurement-incidents.md）
    const body = execFileSync('curl', ['-sS', '--ssl-no-revoke', '--fail', '--max-time', '30', url], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
    const content = body.replace(/\r\n/g, '\n');
    writeFileSync(join(OUT, `${name}.tsx`), content, 'utf8');
    if (INSTALL) {
      // テンプレートの別名を admin の alias へ直すだけ (クラスには触れない)。既存の部品は上書きしない
      const target = join(UI_DIR, `${name}.tsx`);
      if (existsSync(target)) throw new Error(`${name}.tsx は既にある (上書きしない。差分は check-shadcn-parity で見る)`);
      const rewritten = content.replace(/from "@\/lib\/utils"/g, 'from "@/lib/cn"');
      const header = `// テンプレート (${TEMPLATE_REPO}@${TEMPLATE_SHA.slice(0, 8)}・Base UI) の ${name}.tsx をそのまま使う。変えたのは import 先（cn → @/lib/cn）だけ。\n// 正との差は check-shadcn-parity が止める（参照: .claude/config/shadcn-reference/${name}.tsx・例外: .claude/config/shadcn-parity-allow.json）。\n`;
      writeFileSync(target, header + rewritten, 'utf8');
    }
    console.log(`${TAG} ${name} ← ${url}（${content.length} 字）`);
  } catch (e) {
    failed++;
    console.error(`${TAG} ✗ ${name}: ${String(e.message).split('\n')[0]}`);
  }
}
console.log(`${TAG} ${names.length} 件中 取得 ${names.length - failed} 件 → ${OUT}`);
process.exitCode = failed ? 2 : 0;
