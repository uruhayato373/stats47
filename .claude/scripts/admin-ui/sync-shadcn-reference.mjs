#!/usr/bin/env node
/**
 * sync-shadcn-reference.mjs — 管理画面の UI 部品と比べる shadcn/ui 公式ソースを取り直す
 * ---------------------------------------------------------------------------
 * 公式の registry（https://ui.shadcn.com/r/styles/base-nova/<name>.json）から ui/<name>.tsx を取り出し、
 * .claude/config/shadcn-reference/<name>.tsx に保存する。check-shadcn-parity はこの保存物（コミット済み）と
 * apps/admin/components/ui/*.tsx を比べるので、CI はネットワークに依存しない。
 * 公式が更新されたときだけ手で実行し、差分を見てから部品側を追従させる（ADMIN-UI-SHADCN-01）。
 *
 * base-nova の registry は、アイコンを `<IconPlaceholder lucide="X" tabler="…" … />` で持つ（公式 CLI が
 * components.json の iconLibrary に合わせて書き換える前の形）。管理画面は lucide なので、公式 CLI と同じく
 * `<X … />` + `import { X } from "lucide-react"` に置き換えてから保存する（保存物と部品で同じ変換）。
 * 2026-10-27 に new-york-v4 (Radix) から base-nova (Base UI) へ移した（ADMIN-UI-BASEUI-01）。
 *
 * 使い方: node .claude/scripts/admin-ui/sync-shadcn-reference.mjs            # 管理画面に置いている部品の分だけ取り直す
 *         node .claude/scripts/admin-ui/sync-shadcn-reference.mjs dialog     # 名前を指定して取る（新しく部品を足すとき）
 *         … --install           # apps/admin/components/ui/ にも置く（既存の部品は上書きしない）
 *         … --install --force   # 既存の部品も公式で置き換える（系統の移行・公式の大きな更新のとき）
 * exit: 0=全件取得 / 2=取得できないものがあった（ネットワーク・名前違い）
 * ---------------------------------------------------------------------------
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..', '..');
const UI_DIR = join(ROOT, 'apps/admin/components/ui');
const HOOKS_DIR = join(ROOT, 'apps/admin/hooks');
const OUT = join(ROOT, '.claude/config/shadcn-reference');
export const STYLE = 'base-nova';
const TAG = '[sync-shadcn-reference]';

const ICON_PROPS = /\s+(?:lucide|tabler|hugeicons|phosphor|remixicon)="[^"]*"/g;

/** `<IconPlaceholder lucide="X" … />` を `<X … />` にし、lucide-react の import を足す（テストから使う純関数）。 */
export function resolveIconPlaceholders(src) {
  const icons = new Set();
  let out = src.replace(/<IconPlaceholder\b([\s\S]*?)\/>/g, (whole, attrs) => {
    const lucide = /\blucide="([A-Za-z0-9]+)"/.exec(attrs);
    if (!lucide) throw new Error(`IconPlaceholder に lucide の名前が無い: ${whole.slice(0, 80)}`);
    icons.add(lucide[1]);
    const rest = attrs.replace(ICON_PROPS, '').replace(/\s+$/, '');
    return `<${lucide[1]}${rest} />`;
  });
  const importLine = /^import \{ IconPlaceholder \} from "@\/app\/\(create\)\/components\/icon-placeholder"\n/m;
  if (icons.size) {
    if (!importLine.test(out)) throw new Error('IconPlaceholder の import 行が見つからない');
    out = out.replace(importLine, `import { ${[...icons].sort().join(', ')} } from "lucide-react"\n`);
  }
  if (/IconPlaceholder/.test(out)) throw new Error('IconPlaceholder が残っている');
  return out;
}

/** registry 内の別名を admin の alias へ直す（クラスには触れない）。 */
export function rewriteAliases(src) {
  return src
    .replace(/from "cn"/g, 'from "@/lib/cn"')
    .replace(new RegExp(`@/registry/${STYLE}/ui/`, 'g'), '@/components/ui/')
    .replace(new RegExp(`@/registry/${STYLE}/hooks/`, 'g'), '@/hooks/');
}

function main() {
  const INSTALL = process.argv.includes('--install');
  const FORCE = process.argv.includes('--force');
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
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
      const file = item.files?.find((f) => /\/(ui|hooks)\/[\w-]+\.tsx?$/.test(f.path) && f.path.split('/').pop().replace(/\.tsx?$/, '') === name);
      if (!file?.content) throw new Error('registry に ui/<name>.tsx が無い');
      const isHook = /\/hooks\//.test(file.path);
      const ext = file.path.endsWith('.ts') ? 'ts' : 'tsx';
      const content = resolveIconPlaceholders(file.content.replace(/\r\n/g, '\n'));
      writeFileSync(join(OUT, `${name}.${ext}`), content, 'utf8');
      if (INSTALL) {
        const target = join(isHook ? HOOKS_DIR : UI_DIR, `${name}.${ext}`);
        if (existsSync(target) && !FORCE) throw new Error(`${name}.${ext} は既にある (上書きしない。差分は check-shadcn-parity で見る。置き換えるときは --force)`);
        const header = `// shadcn/ui 公式（${STYLE}）の ${name}.${ext} をそのまま使う。変えたのは import 先（cn → @/lib/cn・registry の別名 → admin の alias・IconPlaceholder → lucide-react）だけ。\n// 公式との差は check-shadcn-parity が止める（参照: .claude/config/shadcn-reference/${name}.${ext}・例外: .claude/config/shadcn-parity-allow.json）。\n`;
        writeFileSync(target, header + rewriteAliases(content), 'utf8');
      }
      console.log(`${TAG} ${name} ← ${url}（${file.content.length} 字）`);
    } catch (e) {
      failed++;
      console.error(`${TAG} ✗ ${name}: ${String(e.message).split('\n')[0]}`);
    }
  }
  console.log(`${TAG} ${names.length} 件中 取得 ${names.length - failed} 件 → ${OUT}`);
  return failed ? 2 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main();
