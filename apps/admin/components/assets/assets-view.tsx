"use client";

import { useEffect, useMemo, useState } from "react";

import { apiGet } from "@/lib/client/api-client";
import { EmptyState, ErrorState, Loading } from "@/components/async-state";
import type {
  AssetTabDTO,
  AssetTabResponse,
} from "@/lib/contracts/types";

import { TabBar } from "./tab-bar";
import { AssetToolbar } from "./asset-toolbar";
import { AssetCard } from "./asset-card";

const CARD_LIMIT = 400;

export function AssetsView() {
  const [tabs, setTabs] = useState<AssetTabDTO[] | null>(null);
  const [tabsError, setTabsError] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);

  const [data, setData] = useState<AssetTabResponse | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(30);
  const [all, setAll] = useState(false);

  // 初回: タブ一覧取得
  useEffect(() => {
    apiGet<{ tabs: AssetTabDTO[] }>("/api/assets/tabs")
      .then((res) => {
        setTabs(res.tabs);
        if (res.tabs.length > 0) setCurrent(res.tabs[0].id);
      })
      .catch((e: unknown) => {
        setTabsError(e instanceof Error ? e.message : String(e));
      });
  }, []);

  const loadPanel = (tabId: string, opts: { limit: number; all: boolean }) => {
    setPanelLoading(true);
    setPanelError(null);
    const qs = opts.all ? "?all=1" : `?limit=${opts.limit || 30}`;
    apiGet<AssetTabResponse>(`/api/assets/tab/${tabId}${qs}`)
      .then((res) => setData(res))
      .catch((e: unknown) => {
        setData(null);
        setPanelError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => setPanelLoading(false));
  };

  // タブ切り替え・全件チェックボックス変更で再読込
  useEffect(() => {
    if (!current) return;
    loadPanel(current, { limit, all });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, all]);

  const handleSelectTab = (id: string) => {
    setCurrent(id);
  };

  const handleReload = () => {
    if (!current) return;
    loadPanel(current, { limit, all });
  };

  const entries = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = data?.entries ?? [];
    if (!term) return list;
    return list.filter(
      (e) =>
        (e.key || "").toLowerCase().includes(term) ||
        (e.label || "").toLowerCase().includes(term),
    );
  }, [data, query]);

  const visibleEntries = entries.slice(0, CARD_LIMIT);
  const overflowCount = entries.length - visibleEntries.length;

  const countLabel = `${entries.length} 件`;

  if (tabsError) {
    return <ErrorState message={tabsError} />;
  }
  if (!tabs) {
    return <Loading label="タブ読込中..." />;
  }

  return (
    <div className="space-y-0">
      <TabBar tabs={tabs} current={current} onSelect={handleSelectTab} />

      <AssetToolbar
        query={query}
        onQueryChange={setQuery}
        limit={limit}
        onLimitChange={setLimit}
        all={all}
        onAllChange={setAll}
        onReload={handleReload}
        count={countLabel}
      />

      {data ? (
        <p className="py-2 text-xs text-console-muted">
          source: <b className="text-console-fg">{data.source}</b> · aspect: {data.aspect} ·{" "}
          <code className="rounded bg-console-bg px-1.5 py-0.5">{data.r2KeyPattern}</code>
        </p>
      ) : null}

      <div className="py-3">
        {panelLoading ? (
          <Loading label="読込中..." />
        ) : panelError ? (
          <ErrorState message={panelError} onRetry={handleReload} />
        ) : entries.length === 0 ? (
          <EmptyState message="エントリなし" />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleEntries.map((entry) => (
                <AssetCard key={entry.key} entry={entry} />
              ))}
            </div>
            {overflowCount > 0 ? (
              <p className="mt-3 text-xs text-console-muted">
                +{overflowCount} 件 (絞り込んでください)
              </p>
            ) : null}
          </>
        )}
      </div>

    </div>
  );
}
