import React, { Suspense, act, lazy } from 'react';

import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';

import {
  ThemePrefectureProvider,
  useThemePrefecture,
} from '../ThemePrefectureContext';

describe('shared prefecture selection while an embedded section is still hydrating', () => {
  it.each([
    [null, null, '全国'],
    ['01000', '北海道', '北海道'],
  ] as const)(
    'preserves SSR selection %s until the delayed section hydrates',
    async (initialAreaCode, initialAreaName, initialText) => {
      window.history.replaceState(null, '', '/themes/local-economy?pref=all');
      const errors: unknown[] = [];
      let release!: (value: { default: React.ComponentType }) => void;
      function Reader() {
        const { selectedAreaName } = useThemePrefecture();
        return <p data-testid="embedded">{selectedAreaName ?? '全国'}</p>;
      }
      const DeferredReader = lazy(
        () =>
          new Promise<{ default: React.ComponentType }>((resolve) => {
            release = resolve;
          })
      );
      function Selector() {
        const { setSelected } = useThemePrefecture();
        return (
          <button onClick={() => setSelected('13000', '東京都')}>
            東京都を選択
          </button>
        );
      }
      function App({ defer = false }: { defer?: boolean }) {
        return (
          <ThemePrefectureProvider
            initialAreaCode={initialAreaCode}
            initialAreaName={initialAreaName}
          >
            <Selector />
            <Suspense fallback={null}>
              {defer ? <DeferredReader /> : <Reader />}
            </Suspense>
          </ThemePrefectureProvider>
        );
      }
      const host = document.createElement('div');
      host.innerHTML = renderToString(<App />);
      document.body.append(host);
      let root: Root | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(host, <App defer />, {
            onRecoverableError: (error) => errors.push(error),
          });
        });
        expect(
          host.querySelector('[data-testid="embedded"]')?.textContent
        ).toBe(initialText);
        await act(async () => {
          host.querySelector('button')!.click();
        });
        await act(async () => {
          release({ default: Reader });
        });
        expect(
          host.querySelector('[data-testid="embedded"]')?.textContent
        ).toBe('東京都');
        expect(window.location.search).toBe('?pref=13000');
        expect(errors).toEqual([]);
      } finally {
        await act(async () => root?.unmount());
        host.remove();
      }
    }
  );
});
