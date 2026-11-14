import { afterEach, describe, expect, it, vi } from 'vitest';

import { assertR2WriteAllowed, LocalR2WriteBlockedError } from '../_assert-ci-write';
import { R2_PRIVATE_BUCKET } from '../r2-key-classes';

const LOCAL: NodeJS.ProcessEnv = {};

afterEach(() => vi.restoreAllMocks());

describe('assertR2WriteAllowed', () => {
  it('CI (GITHUB_ACTIONS=true) では書き込み先を問わず通す', () => {
    expect(() => assertR2WriteAllowed({ targets: ['app/stats/x/'], env: { GITHUB_ACTIONS: 'true' } })).not.toThrow();
    expect(() => assertR2WriteAllowed({ env: { GITHUB_ACTIONS: 'true' } })).not.toThrow();
  });

  it('dry-run は R2 に書かないのでローカルでも通す', () => {
    expect(() => assertR2WriteAllowed({ dryRun: true, targets: ['app/stats/x/'], env: LOCAL })).not.toThrow();
  });

  it('ローカルで Mac が作る prefix だけなら通す (SNS 画像・note 背景・Kindle・private の素材)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(() => assertR2WriteAllowed({
      targets: [
        'sns/buzz-map/1/instagram/stills/a.png',
        'media/note-backgrounds/slug/abc/background.jpg',
        'archive/kindle-encrypted/K-1/v1/rev/',
        { bucket: R2_PRIVATE_BUCKET, key: 'media-workspace/' },
      ],
      env: LOCAL,
    })).not.toThrow();
  });

  it('ローカルで CI が書く prefix は、書き手の workflow 名を出して止める', () => {
    expect(() => assertR2WriteAllowed({ targets: ['app/stats/x/values.json'], env: LOCAL }))
      .toThrow(/data-refresh\.yml/);
    expect(() => assertR2WriteAllowed({ targets: ['app/stats/x/values.json'], env: LOCAL }))
      .toThrow(LocalR2WriteBlockedError);
  });

  it('Mac の key と CI の key が混ざっていれば止める', () => {
    expect(() => assertR2WriteAllowed({
      targets: ['sns/buzz-map/1/a.png', 'sns/pref-silhouette/13/a.png'],
      env: LOCAL,
    })).toThrow(/sns\/pref-silhouette\/13\/a\.png/);
  });

  it('未登録の prefix と書き込み先の指定なしはローカルでは止める', () => {
    expect(() => assertR2WriteAllowed({ targets: ['unknown/a.json'], env: LOCAL })).toThrow(/未登録/);
    expect(() => assertR2WriteAllowed({ env: LOCAL })).toThrow(/指定されていない/);
  });

  it('CI=true だけ (GITHUB_ACTIONS なし) は CI とみなさない', () => {
    expect(() => assertR2WriteAllowed({ targets: ['app/stats/x/'], env: { CI: 'true' } })).toThrow();
  });

  it('ALLOW_LOCAL_R2_WRITE=1 は明示の逃げ道として効く', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(() => assertR2WriteAllowed({ targets: ['app/stats/x/'], env: { ALLOW_LOCAL_R2_WRITE: '1' } })).not.toThrow();
    expect(() => assertR2WriteAllowed({ env: { ALLOW_LOCAL_R2_WRITE: '1' } })).not.toThrow();
  });
});
