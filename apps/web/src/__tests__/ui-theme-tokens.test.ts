import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// @ts-expect-error -- 生成スクリプトは型定義を持たない .mjs
import { buildHslTokens } from '../../../../packages/ui-theme/build-hsl-tokens.mjs';

const themeDir = path.resolve(__dirname, '../../../../packages/ui-theme');
const read = (name: string) => readFileSync(path.join(themeDir, name), 'utf8');

// サイトは色を hsl(var(--x)) で参照するので、テンプレートの oklch 値 (tokens.css) を HSL 3 値へ変換した
// tokens-hsl.css を読む。手編集や生成忘れで管理画面 (oklch をそのまま読む) とサイトの色がずれるのを止める。
describe('@stats47/ui-theme の HSL トークン', () => {
  it('tokens-hsl.css は tokens.css (テンプレートの値) から生成したものと一致する', () => {
    expect(read('tokens-hsl.css')).toBe(buildHslTokens(read('tokens.css')));
  });

  it('サイトの globals.css は HSL 版を読み、テンプレートの色を上書きしない', () => {
    const globals = readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf8');
    expect(globals).toContain("@import '@stats47/ui-theme/tokens-hsl.css';");
    for (const token of ['--background', '--foreground', '--primary', '--border', '--card', '--chart-1', '--radius']) {
      expect(globals).not.toMatch(new RegExp(`^\\s*${token}:`, 'm'));
    }
  });
});
