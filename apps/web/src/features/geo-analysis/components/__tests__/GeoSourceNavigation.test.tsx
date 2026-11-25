import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  GEO_SOURCE_NAVIGATION_ID,
  GeoSourceNavigation,
} from '../GeoSourceNavigation';

/** ページ内リンク (#...) を除いた、本文中の内部リンクの href。ページ品質の duplicate_link_ratio と同じ数え方。 */
function hrefsOf(container: HTMLElement) {
  return Array.from(container.querySelectorAll('a[href]'))
    .map((a) => a.getAttribute('href') ?? '')
    .filter((href) => href && !href.startsWith('#'));
}

describe('GeoSourceNavigation: 一覧のリンクは 1 回だけ出す', () => {
  it('モバイルの入口と右レールを両方置いても、同じリンクが 2 回出ない', () => {
    const { container } = render(
      <>
        <GeoSourceNavigation catalog={null} mobile />
        <GeoSourceNavigation catalog={null} />
      </>
    );
    const hrefs = hrefsOf(container);
    const duplicated = hrefs.filter((href, i) => hrefs.indexOf(href) !== i);
    expect(hrefs.length).toBeGreaterThan(50);
    expect(duplicated).toEqual([]);
  });

  it('モバイルの入口は一覧のカードへ飛ぶページ内リンクだけを出す', () => {
    const { container } = render(
      <>
        <GeoSourceNavigation catalog={null} mobile />
        <GeoSourceNavigation catalog={null} />
      </>
    );
    const jump = container.querySelector(
      `a[href="#${GEO_SOURCE_NAVIGATION_ID}"]`
    );
    expect(jump).not.toBeNull();
    expect(
      container.querySelector(`#${GEO_SOURCE_NAVIGATION_ID}`)
    ).not.toBeNull();
    expect(
      jump?.closest('nav[aria-label="GIS一覧"]'),
      '入口の中に一覧を再び入れない'
    ).toBeNull();
  });
});
