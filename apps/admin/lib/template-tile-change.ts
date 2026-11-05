import { buildDataCard } from '../../../.claude/scripts/sns/lib/data-card-input';
import type { ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';
import { renderTileChangeSvg } from '../../remotion/src/features/data-cards/TileChange';

/** Fixed population snapshots: the change sample is rebuilt from these exact bytes only. */
export const CHANGE_SAMPLE_SOURCES = {
  item: {
    bucket: 'stats47',
    key: 'app/ranking/total-population/item.json',
    sha256: '3c4bc4801f767300e662d17102b736a8fa8fd14b14db5eba492bec6eeeaf9457',
    bytes: 4540,
  },
  values: {
    bucket: 'stats47',
    key: 'app/ranking/total-population/values.json',
    sha256: '714a966447bc54788fd8b88a0efd8dc73a897f06e39cf6b15bce9451a4fe8d12',
    bytes: 426167,
  },
} as const;

/**
 * The tile-map's change variant: the same card the X/Threads tile-change image uses
 * (TileChange.tsx → all47-svg.ts), for the total population 1975 → 2025.
 */
export async function renderTileChangeSample(input: { item: unknown; values: unknown }, theme?: ChartTheme) {
  const byKey: Record<string, unknown> = {
    [CHANGE_SAMPLE_SOURCES.item.key]: input.item,
    [CHANGE_SAMPLE_SOURCES.values.key]: input.values,
  };
  const card = await buildDataCard(
    { kind: 'tile-change', key: 'total-population', from: '1975', to: '2025' },
    async (key) => {
      if (!Object.hasOwn(byKey, key)) throw Error('固定入力にない R2 キーです: ' + key);
      return byKey[key];
    },
    async () => { throw Error('増減タイルは県の形を使いません。'); }
  );
  if (card.kind !== 'tile-change') throw Error('増減タイルの入力ではありません。');
  return renderTileChangeSvg(card, theme);
}
