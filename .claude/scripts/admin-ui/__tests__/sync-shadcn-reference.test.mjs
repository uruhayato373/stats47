import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveIconPlaceholders, rewriteAliases } from '../sync-shadcn-reference.mjs';

const IMPORT = 'import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"\n';

test('IconPlaceholder を lucide のアイコンへ置き換え、他のアイコン集の名前を落とす（公式 CLI と同じ結果）', () => {
  const src = `${IMPORT}const a = <IconPlaceholder\n  lucide="ChevronDownIcon"\n  tabler="IconSelector"\n  hugeicons="UnfoldMoreIcon"\n  phosphor="CaretDownIcon"\n  remixicon="RiArrowDownSLine"\n  className="size-4"\n/>\nconst b = <IconPlaceholder lucide="CheckIcon" tabler="IconCheck" />\n`;
  const out = resolveIconPlaceholders(src);
  assert.match(out, /^import \{ CheckIcon, ChevronDownIcon \} from "lucide-react"\n/);
  assert.match(out, /<ChevronDownIcon\n  className="size-4" \/>/);
  assert.match(out, /<CheckIcon \/>/);
  assert.doesNotMatch(out, /IconPlaceholder|tabler=|hugeicons=/);
});

test('lucide の名前が無い IconPlaceholder は止める（黙って壊れたアイコンを入れない）', () => {
  assert.throws(() => resolveIconPlaceholders(`${IMPORT}<IconPlaceholder tabler="IconCheck" />`), /lucide/);
});

test('アイコンが無い部品はそのまま返す', () => {
  const src = 'import { cn } from "cn"\nexport const x = 1\n';
  assert.equal(resolveIconPlaceholders(src), src);
});

test('registry 内の別名を管理画面の alias へ直す', () => {
  const out = rewriteAliases('import { cn } from "cn"\nimport { Button } from "@/registry/base-nova/ui/button"\nimport { useIsMobile } from "@/registry/base-nova/hooks/use-mobile"\n');
  assert.equal(out, 'import { cn } from "@/lib/cn"\nimport { Button } from "@/components/ui/button"\nimport { useIsMobile } from "@/hooks/use-mobile"\n');
});
