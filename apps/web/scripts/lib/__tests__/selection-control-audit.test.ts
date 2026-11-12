// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { findSelectionControlViolations } from '../selection-control-audit.mjs';

const inspect = (source: string) => findSelectionControlViolations(source, 'src/features/example/View.tsx').map(item => item.ruleId);

describe('表示条件の切り替えを共通部品に集約する', () => {
  it.each([
    `import { ToggleGroup } from '@stats47/components/atoms/ui/toggle-group';`,
    `import { ToggleGroup as Choices } from '@stats47/components';`,
    `import * as Choices from '@base-ui/react/toggle-group';`,
  ])('直接組み立てる import を止める: %s', source => {
    expect(inspect(source)).toContain('selection-use-shared-control');
  });

  it.each([
    `<Button aria-pressed={value === item.value} onClick={() => setValue(item.value)} />`,
    `import { Button as Choice } from '@stats47/components'; const view = <Choice aria-pressed={active} variant={active ? 'default' : 'outline'} />;`,
    `<button aria-pressed={item.id !== selected} />`,
  ])('通常ボタンで単一選択を再実装するのを止める: %s', source => {
    expect(inspect(source)).toContain('selection-no-button-group');
  });

  it.each([
    `<SingleSelectToggleGroup className="h-6 data-pressed:bg-primary" />`,
    `<SingleSelectToggleGroup className="bg-primary" />`,
    `<SingleSelectToggleGroup className="[&_button]:text-red-500" />`,
    `const classes = 'sm:h-5'; const view = <SingleSelectToggleGroup className={cn('mb-3', classes)} />;`,
    `<SingleSelectToggleGroup style={{ height: 24 }} />`,
  ])('個別の選択色・寸法の上書きを止める: %s', source => {
    expect(inspect(source)).toContain('selection-no-style-override');
  });

  it('配置、独立したオンオフ、パネル切替、リンクを誤検出しない', () => {
    expect(inspect(`
      const view = <>
        <SingleSelectToggleGroup className="hidden sm:flex absolute left-2 top-2 bg-background/90" />
        <Button aria-pressed={showSource} variant="outline" onClick={() => setShowSource(!showSource)} />
        <TabsTrigger value="map" />
        <Link aria-current="page" href="/ranking/other" />
      </>;
    `)).toEqual([]);
  });

  it('標準部品は共有実装の中で利用できる', () => {
    expect(findSelectionControlViolations(
      `import { ToggleGroup } from '@stats47/components/atoms/ui/toggle-group';`,
      'src/components/molecules/SingleSelectToggleGroup.tsx',
    )).toEqual([]);
  });
});
