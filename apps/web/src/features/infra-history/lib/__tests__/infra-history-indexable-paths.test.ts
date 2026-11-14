// @vitest-environment node
import { INFRA_NETWORKS, isInfraNetworkPublishable } from '@stats47/gis/infra-history';
import { describe, expect, it } from 'vitest';

import { infraHistoryIndexablePaths, resolveInfraScope } from '../infra-history-scope';

/**
 * サイトマップに載せるインフラの変遷のページ (2026-11-11)。
 * 2026-11-11 まで掲載が漏れていて、GSC では 100 件超が「未送信で登録済み」だった。
 * ページ側の robots (公開できるネットワークだけ index) と同じ条件で決まることを固定する。
 */
describe('infraHistoryIndexablePaths', () => {
  const paths = infraHistoryIndexablePaths();
  const publishable = INFRA_NETWORKS.filter(isInfraNetworkPublishable);

  it('公開できるネットワークごとに、全国・地方・47 都道府県のページを返す', () => {
    for (const network of publishable) {
      const own = paths.filter((path) => path === `/geo/history/${network.key}` || path.startsWith(`/geo/history/${network.key}/`));
      expect(own).toContain(`/geo/history/${network.key}`);
      expect(own).toContain(`/geo/history/${network.key}/13`);
      expect(own.filter((path) => /\/\d{2}$/.test(path))).toHaveLength(47);
    }
  });

  it('返したパスは、ページが解決できる範囲だけ (404 になるパスを載せない)', () => {
    for (const path of paths) {
      const [, , , networkKey, scopeSlug] = path.split('/');
      if (!networkKey) continue; // 一覧 /geo/history
      const network = INFRA_NETWORKS.find((item) => item.key === networkKey);
      expect(network, path).toBeDefined();
      expect(resolveInfraScope(network!.key, scopeSlug ?? null), path).not.toBeNull();
    }
  });

  it('公開できないネットワークのページと、1 つでも公開できないときの一覧は載せない (ページ側は noindex)', () => {
    for (const network of INFRA_NETWORKS.filter((item) => !isInfraNetworkPublishable(item))) {
      expect(paths.some((path) => path.startsWith(`/geo/history/${network.key}`))).toBe(false);
    }
    expect(paths.includes('/geo/history')).toBe(publishable.length === INFRA_NETWORKS.length);
  });

  it('同じパスを 2 回返さない', () => {
    expect(new Set(paths).size).toBe(paths.length);
  });
});
