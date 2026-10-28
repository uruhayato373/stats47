import { readFileSync } from 'node:fs';
import path from 'node:path';

import { CARD_SURFACE_CLASS, cn } from '@stats47/components';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '../../../../../..');
const read = (relativePath: string) => readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('CARD_SURFACE_CLASS (カード外枠の単一定義)', () => {
  it('角丸・線色をリテラルで持たず、トークン (rounded-card / border-card-outline) だけで決める', () => {
    const classes = CARD_SURFACE_CLASS.split(' ');
    expect(classes).toEqual(expect.arrayContaining(['rounded-card', 'border', 'border-card-outline', 'bg-background']));
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

  // カード外枠のトークンは 3 アプリ共通の @stats47/ui-theme/theme.css が持つ (2026-10-28 に apps/web の
  // tailwind.config.ts と globals.css から移した)。共有部品を使うアプリの CSS はこれを読み込む。
  it('theme.css はカード外枠の Tailwind テーマと値を定義している', () => {
    const theme = read('packages/ui-theme/theme.css');
    expect(theme).toMatch(/--radius-card:\s*var\(--card-radius\)/);
    expect(theme).toMatch(/--color-card-outline:\s*var\(--card-outline\)/);
    expect(theme).toMatch(/--card-radius:/);
    expect(theme).toMatch(/--card-outline:/);
  });

  it.each([['apps/web/src/app/globals.css']])('%s は theme.css を読み込む', (cssPath) => {
    // 読み込まないと rounded-card / border-card-outline のクラスが生成されず外枠が崩れる
    expect(read(cssPath)).toContain("@import '@stats47/ui-theme/theme.css';");
  });
});
