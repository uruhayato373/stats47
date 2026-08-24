import Link from 'next/link';

import { THEME_CATALOGS } from '@stats47/data-configs/theme-catalog';
import { findIndicatorSet } from '@stats47/types';

import { SurfaceSection } from '@/components/surface/SurfaceCard';

/**
 * テーマの全指標を role 別に一覧するセクション (server component)。
 *
 * カタログ (THEME_CATALOGS) が持つ全指標を /ranking/<key> リンク付きで描画する。
 * 選定根拠は編集用 SSOT に留め、読者向け UI へ内部 rationale を露出しない。
 */

interface CatalogMetricLike {
  rankingKey: string;
  shortLabel: string;
  role?: 'primary' | 'secondary' | 'context';
}

const ROLE_GROUPS: {
  role: 'primary' | 'secondary' | 'context';
  label: string;
}[] = [
  { role: 'primary', label: '主要指標' },
  { role: 'secondary', label: '補助指標' },
  { role: 'context', label: '参考指標' },
];

export function ThemeIndicatorCatalogSection({
  themeKey,
}: {
  themeKey: string;
}) {
  const catalog = THEME_CATALOGS[themeKey];
  const metrics: CatalogMetricLike[] =
    catalog?.metrics ?? findIndicatorSet(themeKey)?.metrics ?? [];

  if (metrics.length === 0) return null;

  return (
    <SurfaceSection
      id="theme-related-indicators"
      className="mt-8 scroll-mt-24 p-5"
    >
      <h2 className="text-lg font-bold text-foreground">このテーマの全指標</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        このテーマで扱う{metrics.length}
        指標。各リンクから47都道府県ランキングを確認できます。
      </p>

      <div className="mt-4 space-y-5">
        {ROLE_GROUPS.map(({ role, label }) => {
          const items = metrics.filter((m) => (m.role ?? 'secondary') === role);
          if (items.length === 0) return null;

          return (
            <div key={role}>
              <h3 className="text-sm font-semibold text-muted-foreground">
                {label}
              </h3>
              <ul className="mt-2 space-y-2">
                {items.map((m) => (
                  <li key={m.rankingKey}>
                    <Link
                      href={`/ranking/${m.rankingKey}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {m.shortLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </SurfaceSection>
  );
}
