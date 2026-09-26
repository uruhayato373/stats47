import { readFileSync } from 'node:fs';
import path from 'node:path';

import { CARD_SURFACE_CLASS, cn } from '@stats47/components';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '../../../../../..');
const read = (relativePath: string) => readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('CARD_SURFACE_CLASS (カード外枠の単一定義)', () => {
  it('角丸・線色をリテラルで持たず、トークン (rounded-card / border-card-outline) だけで決める', () => {
    const classes = CARD_SURFACE_CLASS.split(' ');
    expect(classes).toEqual(expect.arrayContaining(['rounded-card', 'border', 'border-card-outline', 'bg-card']));
    // リテラルが混ざると --card-radius / --card-outline を変えてもカードが追従しない
    expect(classes.filter((c) => /^rounded-(?!card$)/.test(c))).toEqual([]);
    expect(classes).not.toContain('border-border');
    expect(classes).not.toContain('border-transparent');
  });

  it('cn は rounded-card を角丸として扱い、呼び出し側の角丸指定と衝突解決する', () => {
    // 未登録だと両方残り、どちらが効くかが CSS の出力順任せになる
    expect(cn(CARD_SURFACE_CLASS, 'rounded-none').split(' ')).not.toContain('rounded-card');
    expect(cn('rounded-none', 'rounded-card')).toBe('rounded-card');
    // レスポンシブ variant は別グループなので残す (ArticleCard のモバイル全幅表示)
    expect(cn(CARD_SURFACE_CLASS, 'max-sm:rounded-none')).toContain('rounded-card');
  });

  it.each([
    ['apps/web/tailwind.config.ts', 'apps/web/src/app/globals.css'],
    ['apps/admin/tailwind.config.ts', 'apps/admin/app/globals.css'],
  ])('%s はカード外枠のトークンを定義している', (configPath, cssPath) => {
    // 共有 primitive を使うアプリは両方を定義しないと、クラスが生成されず外枠が崩れる
    const config = read(configPath);
    expect(config).toMatch(/card:\s*"var\(--card-radius\)"/);
    expect(config).toMatch(/outline:\s*"var\(--card-outline\)"/);
    const css = read(cssPath);
    expect(css).toMatch(/--card-radius:/);
    expect(css).toMatch(/--card-outline:/);
  });
});
