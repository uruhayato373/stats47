import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { addWrappers, buildLyraMap, findLyraDeadCallerClasses } from '../lyra-dead-class-audit.mjs';

/**
 * lyra に負けて効いていない呼び出し側のクラスの検査 (design-system:check の lyra-dead-caller-class)。
 * 部品は実物 (packages/components/src/atoms/ui) を読む。lyra の値が変わってもこの意図が保たれることを確かめる:
 * - lyra と同じ性質を決める素のクラスは拾い、! 付きは拾わない
 * - variant / size に応じた lyra で判定する (ghost の Button は文字色を決めないので text-muted-foreground は効く)
 * - 属性の中の JSX (action={<Link className=…>}) は部品自身の className と取り違えない
 * - className を部品へ渡す包み (ChartPanel → Card) の呼び出しも拾う
 */
const map = buildLyraMap(path.resolve(__dirname, '../../../../../packages/components/src/atoms/ui'));
const tokens = (source: string, wrappers = new Set<string>()) =>
  findLyraDeadCallerClasses(source, map, wrappers).map((v: { token: string }) => v.token);

const TABLE_IMPORT = `import { TableHead } from "@stats47/components/atoms/ui/table";\n`;
const BUTTON_IMPORT = `import { Button, buttonVariants } from "@stats47/components";\n`;

describe('findLyraDeadCallerClasses', () => {
  it('TableHead の text-right は lyra の text-left に負けるので拾い、text-right! は拾わない', () => {
    expect(tokens(`${TABLE_IMPORT}<TableHead className="text-right">値</TableHead>`)).toEqual(['text-right']);
    expect(tokens(`${TABLE_IMPORT}<TableHead className="text-right!">値</TableHead>`)).toEqual([]);
    // cn(…) の条件付きの文字列も同じ要素のクラス
    expect(tokens(`${TABLE_IMPORT}<TableHead className={cn("tabular-nums", numeric && "text-right")} />`)).toEqual([
      'text-right',
    ]);
  });

  it('Button は variant / size の lyra で判定する', () => {
    expect(tokens(`${BUTTON_IMPORT}<Button variant="outline" size="sm" className="w-full gap-2" />`)).toEqual(['gap-2']);
    expect(tokens(`${BUTTON_IMPORT}const c = buttonVariants({ variant: 'ghost', size: 'icon', className: 'text-muted-foreground' });`)).toEqual([]);
    // 既定 (default) の Button は文字色を lyra が決めるので負ける
    expect(tokens(`${BUTTON_IMPORT}const c = buttonVariants({ className: 'text-muted-foreground' });`)).toEqual([
      'text-muted-foreground',
    ]);
  });

  it('同じファイルの文字列定数を className に渡しても拾う', () => {
    const source = `${BUTTON_IMPORT}const TRIGGER = 'h-8 text-muted-foreground';\n<Button variant="ghost" size="sm" className={TRIGGER} />`;
    expect(tokens(source)).toEqual(['h-8']);
  });

  it('属性の中の JSX の className は部品自身の className と取り違えない', () => {
    const source = `${BUTTON_IMPORT}<Button variant="ghost" render={<a className="h-11" />} />`;
    expect(tokens(source)).toEqual([]);
  });

  it('className を部品へ渡す包みの呼び出しも拾う', () => {
    const wrapper = `import { Skeleton } from "@stats47/components/atoms/ui/skeleton";\nexport function Loading({ className }: { className?: string }) { return <Skeleton className={cn("w-full", className)} />; }`;
    const wrapperMap = new Map(map);
    const names = addWrappers(wrapperMap, [wrapper]);
    expect([...names]).toEqual(['Loading']);
    const caller = `import { Loading } from "./Loading";\n<Loading className="h-4 rounded-md" />`;
    expect(findLyraDeadCallerClasses(caller, wrapperMap, names).map((v: { token: string }) => v.token)).toEqual([
      'rounded-md',
    ]);
  });
});
