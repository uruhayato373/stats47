"use client";

import { useEffect, useMemo, useState } from "react";

import { apiGet, apiSend, ApiError } from "@/lib/client/api-client";
import { EmptyState, ErrorState, Loading } from "@/components/async-state";
import { JobDialog } from "@/components/job-dialog";
import type {
  AssetTabDTO,
  AssetTabResponse,
  AssetsCheckResponse,
} from "@/lib/contracts/types";

import { TabBar } from "./tab-bar";
import { AssetToolbar } from "./asset-toolbar";
import { AssetCard, type AssetCheckState } from "./asset-card";

const CARD_LIMIT = 400;

/** タブ → 再生成 kind (無いタブは再生成ボタン非表示)。旧 UI (assets.html REGEN_KIND) と同一。 */
const REGEN_KIND: Record<string, string> = {
  "blog-ogp": "blog-thumbnails",
  "blog-card": "blog-thumbnails",
  "ranking-ogp": "ogp-ranking",
  "ranking-card": "ogp-ranking-cards",
  "areas-ogp": "ogp-areas",
  "note-cover": "ogp-note-covers",
};

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

  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<AssetsCheckResponse["result"] | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState("");

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
    setCheckResult(null);
    setCheckError(null);
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

  const missingCount = useMemo(() => {
    if (!checkResult) return null;
    let bad = 0;
    for (const entry of entries) {
      const hasMissing = entry.images.some((img) => {
        if (!img.url) return false;
        const r = checkResult[img.url] as { ok: boolean } | undefined;
        return Boolean(r && !r.ok);
      });
      if (hasMissing) bad += 1;
    }
    return bad;
  }, [checkResult, entries]);

  const countLabel = `${entries.length} 件${missingCount !== null ? ` · 欠落 ${missingCount} 件` : ""}`;

  const handleCheck = async () => {
    if (!current) return;
    setChecking(true);
    setCheckError(null);
    try {
      const res = await apiSend<AssetsCheckResponse>("/api/assets/check", "POST", {
        tab: current,
        limit: all ? null : limit || 30,
        all,
      });
      setCheckResult(res.result);
    } catch (e) {
      setCheckError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e));
    } finally {
      setChecking(false);
    }
  };

  const [regenKeys, setRegenKeys] = useState("");
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  const regenKind = current ? REGEN_KIND[current] : undefined;

  const handleRegenerateStart = () => {
    setRegenKeys("");
    setRegenError(null);
    setRegenOpen(true);
  };

  const handleRegenerateConfirm = async () => {
    if (!regenKind) return;
    const keys = regenKeys.trim() || undefined;
    setRegenError(null);
    try {
      const res = await apiSend<{ id: number }>("/api/actions/regenerate", "POST", {
        kind: regenKind,
        keys: keys ?? null,
      });
      setRegenOpen(false);
      setJobId(String(res.id));
      setJobTitle(`再生成: ${regenKind}${keys ? ` (key: ${keys})` : ""}`);
    } catch (e) {
      setRegenError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e));
    }
  };

  function checkStateFor(images: { url: string | null }[]): AssetCheckState {
    if (!checkResult) return null;
    let sawResult = false;
    let missing = false;
    for (const img of images) {
      if (!img.url) continue;
      const r = checkResult[img.url] as { ok: boolean } | undefined;
      if (r) {
        sawResult = true;
        if (!r.ok) missing = true;
      } else {
        missing = true;
      }
    }
    if (!sawResult) return null;
    return missing ? "missing" : "ok";
  }

  function imageResultFor(images: { url: string | null }[]): Record<string, boolean> | undefined {
    if (!checkResult) return undefined;
    const map: Record<string, boolean> = {};
    for (const img of images) {
      if (!img.url) continue;
      const r = checkResult[img.url] as { ok: boolean } | undefined;
      if (r) map[img.url] = r.ok;
    }
    return map;
  }

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
        onCheck={handleCheck}
        checking={checking}
        onRegenerate={handleRegenerateStart}
        showRegenerate={Boolean(regenKind)}
        count={countLabel}
      />

      {data ? (
        <p className="py-2 text-xs text-console-muted">
          source: <b className="text-console-fg">{data.source}</b> · aspect: {data.aspect} ·{" "}
          <code className="rounded bg-console-bg px-1.5 py-0.5">{data.r2KeyPattern}</code>
        </p>
      ) : null}

      {checkError ? <ErrorState message={checkError} className="py-2" /> : null}

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
                <AssetCard
                  key={entry.key}
                  entry={entry}
                  checkState={checkStateFor(entry.images)}
                  imageCheckResult={imageResultFor(entry.images)}
                />
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

      {regenOpen ? (
        <RegenerateDialog
          kind={regenKind ?? ""}
          keys={regenKeys}
          onKeysChange={setRegenKeys}
          error={regenError}
          onCancel={() => setRegenOpen(false)}
          onConfirm={handleRegenerateConfirm}
        />
      ) : null}

      {jobId ? (
        <JobDialog jobId={jobId} onClose={() => setJobId(null)} />
      ) : null}
    </div>
  );
}

/**
 * 再生成の確認ダイアログ。旧 UI の window.prompt + window.confirm を
 * 明示的な UI に置き換え、「生成して R2 に push します」の確認文言を必ず表示する。
 */
function RegenerateDialog({
  kind,
  keys,
  onKeysChange,
  error,
  onCancel,
  onConfirm,
}: {
  kind: string;
  keys: string;
  onKeysChange: (value: string) => void;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-console-border bg-console-card p-5">
        <h3 className="text-sm font-semibold text-console-fg">再生成 ({kind})</h3>
        <p className="mt-2 text-xs text-console-muted">
          特定 key のみなら入力 (カンマ区切り・英数字ハイフンのみ)。空欄で全件対象。
        </p>
        <input
          type="text"
          value={keys}
          onChange={(e) => onKeysChange(e.target.value)}
          placeholder="key1,key2 (空欄=全件)"
          className="mt-2 w-full rounded-md border border-console-border bg-console-bg px-2 py-1.5 text-sm text-console-fg placeholder:text-console-muted focus:border-console-accent focus:outline-none"
        />
        <p className="mt-3 rounded-md border border-console-warn/40 bg-console-warn/10 px-3 py-2 text-xs text-console-warn">
          再生成ジョブを起動します。生成 → R2 に push まで実行します。よろしいですか?
        </p>
        {error ? <p className="mt-2 text-xs text-console-bad">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-console-border bg-console-bg px-3 py-1.5 text-xs text-console-fg hover:border-console-accent"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md border border-console-accent bg-console-accent px-3 py-1.5 text-xs font-semibold text-console-bg"
          >
            実行する
          </button>
        </div>
      </div>
    </div>
  );
}
