import { describe, expect, it } from 'vitest';

import { classNameText, findClassOverrideViolations } from '../class-override-audit.mjs';

/**
 * 上書き禁止の 4 規則 (panel-no-text-size-override・disclosure-no-look-override・empty-state-no-look-override・
 * link-row-no-size-override) が、className の書き方によらず同じ上書きを拾うことを固定する (DESIGN-CHECK-CLASSNAME-EXPR-01)。
 * 2026-10-28 までは "…" と {"…"} だけを読み、cn(…)・テンプレート文字列・三項演算子で書くと素通りしていた。
 */
const ids = (source: string) => findClassOverrideViolations(source).map((v: { ruleId: string }) => v.ruleId);

describe('classNameText', () => {
  it('文字列・{文字列}・cn・テンプレート・三項演算子から文字列リテラルを取り出す', () => {
    expect(classNameText('className="a b"')).toEqual(['a b']);
    expect(classNameText('className={"a b"}')).toEqual(['a b']);
    expect(classNameText('className={cn("a", cond && "b", { c: d })}')).toEqual(['a b']);
    expect(classNameText('className={`a ${x ? "b" : "c"} d`}')).toEqual(['a b c d']);
    expect(classNameText('className={cond ? "a" : "b"}')).toEqual(['a b']);
  });

  it('${…} に接した断片 (途中で切れたクラス名) と文字列を持たない式は拾わない', () => {
    expect(classNameText('className={`gap-${n} p-4`}')).toEqual(['p-4']);
    expect(classNameText('className={styles.box}')).toEqual(['']);
  });

  it('JSX の name="…" は後ろの属性を読まず、関数の引数 name: 式 は , で止まる', () => {
    expect(classNameText('className="a" title="text-xs"')).toEqual(['a']);
    expect(classNameText('({ className: cn("a", "b"), other: "text-xs" })')).toEqual(['a b']);
  });
});

describe('panel-no-text-size-override', () => {
  const rule = 'panel-no-text-size-override';
  it('文字の大きさをどの書き方で書いても拾う', () => {
    expect(ids('<ChartPanel className="text-sm" />')).toEqual([rule]);
    expect(ids('<ChartPanel className={cn("p-2", "text-sm")} />')).toEqual([rule]);
    expect(ids('<RailCard bodyClassName={cn(open && "leading-tight")} />')).toEqual([rule]);
    expect(ids('<SectionCard contentClassName={`space-y-2 ${wide ? "md:text-lg" : ""}`} />')).toEqual([rule]);
  });
  it('置き場所だけの cn と、属性の中の JSX の className は拾わない', () => {
    expect(ids('<ChartPanel className={cn("mt-4", hidden && "hidden")} />')).toEqual([]);
    expect(ids('<ChartPanel action={<Link className={cn("text-xs")} />} />')).toEqual([]);
  });
});

describe('disclosure-no-look-override / empty-state-no-look-override', () => {
  it('開閉の見た目の上書きを cn・テンプレートでも拾う', () => {
    expect(ids('<ContentDisclosure className="bg-muted" />')).toEqual(['disclosure-no-look-override']);
    expect(ids('<FaqSection className={cn("mt-4", "bg-muted")} />')).toEqual(['disclosure-no-look-override']);
    expect(ids('<FaqSection contentClassName={`space-y-2 ${x ? "p-4" : ""}`} />')).toEqual([
      'disclosure-no-look-override',
    ]);
  });
  it('空の状態の見た目の上書きを cn・テンプレートでも拾う', () => {
    expect(ids('<ChartEmptyState className="border-2" />')).toEqual(['empty-state-no-look-override']);
    expect(ids('<ChartErrorState className={cn("aspect-video", "rounded-lg")} />')).toEqual([
      'empty-state-no-look-override',
    ]);
  });
  it('置き場所 (外の余白・縦横比・表示切替) だけなら拾わない', () => {
    expect(ids('<ChartEmptyState className={cn("mt-4 aspect-video", hidden && "hidden")} />')).toEqual([]);
    expect(ids('<FaqSection className={`mt-4 ${hidden ? "hidden" : ""}`} />')).toEqual([]);
  });
});

describe('link-row-no-size-override', () => {
  const rule = 'link-row-no-size-override';
  it('行の寸法を cn・テンプレートで書いても拾う', () => {
    expect(ids('<RailNavRow className="px-0" />')).toEqual([rule]);
    expect(ids('<RailNavRow className={cn("font-medium", active && "min-h-10")} />')).toEqual([rule]);
    expect(ids('<RailNavRowButton className={`w-full ${x ? "h-8" : ""}`} />')).toEqual([rule]);
  });
  it('railNavRowClassName({ className: cn(…) }) の引数形も拾う', () => {
    expect(ids('const c = railNavRowClassName({ active, className: cn("text-sm") });')).toEqual([rule]);
  });
  it('一覧は行の間隔・左右の余白だけを止め、上下の位置と太さ・色は拾わない', () => {
    expect(ids('<RailLinkList className={cn("gap-2")} />')).toEqual([rule]);
    expect(ids('<RailLinkList className={cn("mt-4", "font-medium")} />')).toEqual([]);
    expect(ids('<RailNavRow className={cn("font-medium", "text-primary")} />')).toEqual([]);
  });
});
