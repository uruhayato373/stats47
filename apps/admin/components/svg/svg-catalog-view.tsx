"use client";

import { useMemo, useState } from "react";

import { Badge, Button, Input, cn } from "@stats47/components";

import { apiGet, ApiError } from "@/lib/client/api-client";
import { EmptyState, ErrorState, Loading } from "@/components/async-state";
import type { SvgCatalogResponse, SvgChartDTO } from "@/lib/contracts/types";

const MAX_RENDERED = 300;

/**
 * SVG カタログページ本体。旧 UI (.claude/scripts/gallery/svg.html) の
 * ツールバー・sticky タブ・カードグリッドを React 化したもの。
 * 旧実装と同様、初回ロードはボタン押下で開始する (自動ロードしない)。
 */
export function SvgCatalogView() {
  const [limitInput, setLimitInput] = useState("30");
  const [allArticles, setAllArticles] = useState(false);
  const [query, setQuery] = useState("");

  const [data, setData] = useState<SvgCatalogResponse | null>(null);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    const limit = Number(limitInput) || 30;
    const params = new URLSearchParams({ limit: String(limit) });
    if (allArticles) params.set("all", "1");
    apiGet<SvgCatalogResponse>(`/api/svg/catalog?${params.toString()}`)
      .then((res) => {
        setData(res);
        const cats = res.catalogs.filter((c) => c.count > 0);
        setActiveCat(cats.length > 0 ? cats[0].key : null);
      })
      .catch((e: unknown) => {
        const message =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : String(e);
        setError(message);
        setData(null);
      })
      .finally(() => {
        setLoading(false);
        setLoaded(true);
      });
  };

  const activeCatalogs = useMemo(
    () => (data ? data.catalogs.filter((c) => c.count > 0) : []),
    [data],
  );

  const activeCatalog = useMemo(
    () => activeCatalogs.find((c) => c.key === activeCat) ?? null,
    [activeCatalogs, activeCat],
  );

  const filteredItems = useMemo(() => {
    if (!data || !activeCat) return [];
    const term = query.trim().toLowerCase();
    return data.items.filter(
      (item) =>
        item.cat === activeCat &&
        (!term || `${item.slug}/${item.file}`.toLowerCase().includes(term)),
    );
  }, [data, activeCat, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-console-border bg-console-card p-3 text-sm">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="slug / file 検索"
          className="h-8 w-52 border-console-border bg-console-bg text-xs text-console-fg"
        />
        <label className="flex items-center gap-1.5 text-xs text-console-muted">
          記事数
          <input
            type="number"
            min={1}
            value={limitInput}
            onChange={(e) => setLimitInput(e.target.value)}
            className="h-8 w-20 rounded-md border border-console-border bg-console-bg px-2 text-xs text-console-fg"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-console-muted">
          <input
            type="checkbox"
            checked={allArticles}
            onChange={(e) => setAllArticles(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-console-border"
          />
          全記事 (重い)
        </label>
        <Button size="sm" onClick={load} disabled={loading}>
          {loading ? "読込中..." : "読込"}
        </Button>
        {data ? (
          <span className="text-xs text-console-muted">
            全 {data.items.length} 枚 / {data.articleCount} 記事
          </span>
        ) : null}
        <span className="ml-auto text-[11px] text-console-muted">
          ※ SVG は img 参照 (dark 対応は静的ギャラリー build-svg-gallery-tabbed で確認)
        </span>
      </div>

      {!loaded && !loading ? (
        <EmptyState message="「読込」を押すと R2 から SVG を取得・分類します" />
      ) : loading && !data ? (
        <Loading label="読込中... (R2 から SVG を取得・分類)" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : data ? (
        <>
          <div className="sticky top-14 z-10 -mx-1 flex flex-wrap gap-1.5 border-b border-console-border bg-console-bg/95 px-1 py-2 backdrop-blur">
            {activeCatalogs.length === 0 ? (
              <span className="text-xs text-console-muted">SVG なし</span>
            ) : (
              activeCatalogs.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setActiveCat(c.key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    activeCat === c.key
                      ? "border-console-accent bg-console-accent font-semibold text-console-bg"
                      : "border-console-border bg-transparent text-console-muted hover:border-console-accent/60",
                  )}
                >
                  {c.label} <b className="opacity-70">{c.count}</b>
                </button>
              ))
            )}
          </div>

          {activeCatalog ? (
            <p className="text-xs text-console-muted">
              <code className="rounded bg-console-bg px-1.5 py-0.5">
                {activeCatalog.desc}
              </code>{" "}
              — {activeCatalog.count} 枚
            </p>
          ) : null}

          {filteredItems.length === 0 ? (
            <EmptyState message="該当なし" />
          ) : (
            <SvgGrid items={filteredItems} />
          )}
        </>
      ) : null}
    </div>
  );
}

function SvgGrid({ items }: { items: SvgChartDTO[] }) {
  const shown = items.slice(0, MAX_RENDERED);
  const overflow = items.length - shown.length;

  return (
    <div className="grid grid-cols-1 gap-4 [grid-template-columns:repeat(auto-fill,minmax(380px,1fr))]">
      {shown.map((item) => (
        <figure
          key={`${item.slug}/${item.file}`}
          className="m-0 rounded-lg border border-console-border bg-white p-2"
        >
          <div className="overflow-hidden rounded bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              loading="lazy"
              src={item.url}
              alt={item.file}
              className="block h-auto w-full"
            />
          </div>
          <figcaption className="mt-1.5 break-all text-[11px] text-console-fg">
            <code>
              {item.slug}/{item.file}
            </code>{" "}
            <span className="text-console-muted">{item.viewBox || "?"}</span>{" "}
            {!item.hasViewBox ? (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px]">
                no viewBox
              </Badge>
            ) : null}
            {!item.hasTheme ? (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                no dark
              </Badge>
            ) : null}
          </figcaption>
        </figure>
      ))}
      {overflow > 0 ? (
        <div className="col-span-full text-xs text-console-muted">
          +{overflow} 枚 (絞り込んでください)
        </div>
      ) : null}
    </div>
  );
}
