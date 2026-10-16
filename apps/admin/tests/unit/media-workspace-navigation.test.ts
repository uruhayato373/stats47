import { describe, expect, it } from 'vitest';
import {
  MEDIA_PAGES,
  mediaUrl,
  mediaViewRedirect,
  templateMedium,
  templateReturnUrl,
} from '@/lib/media-workspace-navigation';

describe('画像管理の専用ページと確認位置', () => {
  it('古い見本・改善ページのURLでも絞り込みと選択を失わない', () => {
    expect(
      mediaViewRedirect({
        view: 'templates',
        template: 'map',
        medium: 'x',
        'ratio-x': '4:5',
      })
    ).toBe('/ops/image-templates?template=map&medium=x&ratio-x=4%3A5');
    expect(
      mediaViewRedirect({
        view: 'articles',
        owner: 'note/article',
        channel: 'note',
      })
    ).toBe('/product/content-quality?owner=note%2Farticle&channel=note');
    expect(mediaViewRedirect({ view: 'images', image: 'IMG-1' })).toBeNull();
    expect(new Set(Object.values(MEDIA_PAGES)).size).toBe(3);
  });
  it('画像の詳細へ進んでも型・媒体・比率・見本の戻り先を保持する', () => {
    const returnTo = mediaUrl('templates', {
      template: 'map',
      medium: 'note',
      'ratio-note': '2:3',
      'sample-note': 'IMG-1',
    });
    const detail = new URL(
      mediaUrl('images', { image: 'IMG-1', returnTo }),
      'http://localhost'
    );
    expect(templateReturnUrl(detail.searchParams.get('returnTo'))).toBe(
      returnTo
    );
  });
  it('外部URLや他の画面を戻り先にせず、未知の媒体は既定表示に戻す', () => {
    for (const value of [
      'https://example.com',
      '//example.com',
      '/ops/image-library?image=x',
      '/ops/image-templates/other?x=1',
    ]) {
      expect(templateReturnUrl(value)).toBeNull();
    }
    expect(templateMedium('compare')).toBe('compare');
    expect(templateMedium('web')).toBe('web');
    expect(templateMedium('unknown')).toBeNull();
  });
});
