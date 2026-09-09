import Link from 'next/link';

import { cn } from '@stats47/components';

import { ContentDisclosure } from '@/components/content';
import { RailCard } from '@/components/surface';

import { getGeoSourceNavigation } from '../lib/geo-source-navigation';

import type { GeoSourceCatalog } from '../lib/geo-source-catalog';

type Props = {
  catalog: GeoSourceCatalog | null;
  currentDataId?: string;
  mobile?: boolean;
};

/** Same complete list in the desktop rail and the mobile top disclosure. */
export function GeoSourceNavigation({
  catalog,
  currentDataId,
  mobile = false,
}: Props) {
  const groups = getGeoSourceNavigation(catalog);
  const items = groups.flatMap((group) => group.items);
  const readyCount = items.filter((item) => item.status === 'ready').length;
  const current = items.find((item) => item.dataId === currentDataId);
  const title = `GIS一覧（${items.length}種類）`;
  const body = (
    <nav aria-label="GIS一覧">
      {!mobile && current && (
        <p className="mb-3 text-sm font-medium text-primary">
          表示中：{current.name}
        </p>
      )}
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        {catalog
          ? `地図あり ${readyCount}種類・準備中 ${items.length - readyCount}種類。データ名から個別ページへ進めます。`
          : '地図の準備状況を取得できませんでした。データ名から個別ページへ進めます。'}
      </p>
      <div className="space-y-5">
        {groups
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <section key={group.category} aria-label={group.label}>
              <h3 className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
                <span>{group.label}</span>
                <span>{group.items.length}</span>
              </h3>
              <ol start={group.items[0].position}>
                {group.items.map((item) => (
                  <li
                    key={item.dataId}
                    className="border-b border-border last:border-b-0"
                  >
                    <Link
                      href={item.href}
                      prefetch={false}
                      aria-current={
                        item.dataId === currentDataId ? 'true' : undefined
                      }
                      data-geo-source={item.dataId}
                      className={cn(
                        'flex min-h-11 items-start gap-2 px-2 py-3 text-sm leading-snug transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        item.dataId === currentDataId &&
                          'bg-accent font-semibold text-primary'
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="w-5 shrink-0 text-xs leading-5 tabular-nums text-muted-foreground"
                      >
                        {String(item.position).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1 break-words">
                        {item.name}
                        {item.dataId === currentDataId && (
                          <span className="mt-1 block text-xs">表示中</span>
                        )}
                        {item.status === 'preparing' && (
                          <span className="mt-1 block text-xs font-normal text-muted-foreground">
                            地図を準備中
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
      </div>
      <Link
        href="/geo/layers"
        className="mt-4 flex min-h-11 items-center text-sm text-primary underline"
      >
        GISを検索・比較する
      </Link>
      <Link
        href="/geo"
        className="flex min-h-11 items-center text-sm text-primary underline"
      >
        重ね合わせた地域分析を見る
      </Link>
    </nav>
  );
  if (mobile) {
    return (
      <ContentDisclosure
        title={title}
        description={
          current ? `表示中：${current.name}` : 'データ名から個別ページを選ぶ'
        }
        className="mb-6 xl:hidden"
      >
        {body}
      </ContentDisclosure>
    );
  }
  // PageShell also places its rail below the article on mobile; use the top disclosure there.
  return (
    <div className="hidden xl:block">
      <RailCard title={title}>{body}</RailCard>
    </div>
  );
}
