import { act } from 'react';

import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { PREFECTURE_SET_LABEL } from '../../types';
import { PrefectureSelect } from '../PrefectureSelect';
import { ThemePrefectureProvider } from '../ThemePrefectureContext';

vi.mock('@/lib/analytics/events', () => ({ trackNavClick: vi.fn() }));

describe('PrefectureSelect 初期HTMLとhydration', () => {
  it.each([
    { code: '28000', name: '兵庫県', label: '兵庫県' },
    { code: '13000', name: undefined, label: '東京都' },
    { code: null, name: null, label: PREFECTURE_SET_LABEL },
  ])('$labelをSSRから表示し、hydrateでトリガーを再生成しない', async ({ code, name, label }) => {
    window.history.replaceState(null, '', `/themes/roads?pref=${code ?? 'all'}`);
    const component = (
      <ThemePrefectureProvider initialAreaCode={code} initialAreaName={name}>
        <PrefectureSelect />
      </ThemePrefectureProvider>
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(component);
    document.body.appendChild(container);
    const trigger = container.querySelector('[role="combobox"]');
    const recoverableError = vi.fn();
    let root: Root | undefined;

    try {
      // Radix ItemTextのmount後portalが動く前から、選択地域を読めること。
      expect(trigger).toHaveTextContent(label);
      await act(async () => {
        root = hydrateRoot(container, component, { onRecoverableError: recoverableError });
      });
      expect(recoverableError).not.toHaveBeenCalled();
      expect(container.querySelector('[role="combobox"]')).toBe(trigger);
      expect(trigger).toHaveTextContent(label);
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });
});
