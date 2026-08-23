"use client";

import { useEffect, useMemo, useState } from "react";

import { Button, Input, cn } from "@stats47/components";

import { apiGet, ApiError } from "@/lib/client/api-client";
import { ErrorState, Loading } from "@/components/async-state";
import { JobDialog } from "@/components/job-dialog";
import type {
  IgConsistencyResponse,
  InventoryResponse,
  LimitsResponse,
  PostDTO,
} from "@/lib/contracts/types";
import { PostCard } from "./post-card";
import { ToastPortal, useToast } from "./toast";

// YouTube pilot は Studio で人間が投稿するため、管理画面からの新規投稿・予約は不可。
// 過去実績と pilot 台帳を一覧・フィルタで閲覧する表示専用の選択肢として残す。
const PLATFORMS: Array<[string, string]> = [
  ["", "All"],
  ["x", "X"],
  ["instagram", "Instagram"],
  ["youtube", "YouTube"],
];

const STATUSES: Array<[string, string]> = [
  ["", "All"],
  ["draft", "draft"],
  ["scheduled", "scheduled"],
  ["posted", "posted"],
];

const MAX_VISIBLE = 200;

type ExtraItem = Record<string, unknown> & {
  id?: null;
  platform: string;
  domain?: string | null;
  content_key?: string | null;
  caption?: string | null;
  status?: string;
  posted_at?: string | null;
  scheduled_at?: string | null;
  created_at?: string | null;
};

type GalleryItem = PostDTO | ExtraItem;

function sortKey(item: GalleryItem): string {
  return String(item.posted_at || item.scheduled_at || item.created_at || "");
}

export function SnsView() {
  const [platform, setPlatform] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");

  const [inventory, setInventory] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [limits, setLimits] = useState<LimitsResponse["limits"] | null>(null);
  const [consistency, setConsistency] = useState<IgConsistencyResponse | null>(
    null,
  );

  const [activeJob, setActiveJob] = useState<{ id: string; title: string } | null>(
    null,
  );
  const { message, showToast } = useToast();

  const loadInventory = () => {
    setLoading(true);
    setError(null);
    apiGet<InventoryResponse>("/api/inventory")
      .then((res) => setInventory(res))
      .catch((e: unknown) => {
        setError(e instanceof ApiError ? e.message : String(e));
      })
      .finally(() => setLoading(false));
  };

  const loadLimits = () => {
    apiGet<LimitsResponse>("/api/limits")
      .then((res) => setLimits(res.limits))
      .catch(() => {
        // limits バッジは補助情報。取得失敗しても投稿一覧は表示継続する。
      });
  };

  const loadConsistency = () => {
    apiGet<IgConsistencyResponse>("/api/ig-consistency")
      .then((res) => setConsistency(res))
      .catch(() => {
        // 不整合バーは補助情報。取得失敗時は非表示のまま。
      });
  };

  useEffect(() => {
    loadInventory();
    loadLimits();
    loadConsistency();
  }, []);

  const items = useMemo<GalleryItem[]>(() => {
    if (!inventory) return [];
    let list: GalleryItem[] = [
      ...inventory.posts,
      ...(inventory.extras as ExtraItem[]),
    ];
    if (platform) list = list.filter((x) => x.platform === platform);
    if (status) list = list.filter((x) => x.status === status);
    if (query) {
      list = list.filter(
        (x) =>
          String(x.content_key || "").includes(query) ||
          String(x.caption || "").includes(query),
      );
    }
    return [...list].sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
  }, [inventory, platform, status, query]);

  const visible = items.slice(0, MAX_VISIBLE);
  const overflow = items.length - visible.length;

  const consistencyCount =
    (consistency?.onlyInJson.length ?? 0) + (consistency?.onlyInPosts.length ?? 0);

  const refreshAll = () => {
    loadInventory();
    loadLimits();
    loadConsistency();
  };

  return (
    <div className="space-y-3">
      <div className="sticky top-[57px] z-10 -mx-6 space-y-2 border-b border-console-border bg-console-bg/95 px-6 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <TabGroup
            options={PLATFORMS}
            value={platform}
            onChange={setPlatform}
            variant="tab"
          />
          <TabGroup
            options={STATUSES}
            value={status}
            onChange={setStatus}
            variant="chip"
          />
          {limits ? (
            <div className="ml-auto flex flex-wrap gap-2">
              {Object.entries(limits).map(([key, info]) => {
                const over = info.used >= info.max;
                return (
                  <span
                    key={key}
                    title={info.window}
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-[11px]",
                      over
                        ? "border-red-500/60 font-semibold text-console-bad"
                        : "border-console-border text-console-muted",
                    )}
                  >
                    {key}: {info.used}/{info.max}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value.trim())}
            placeholder="content_key / caption 検索"
            className="h-8 w-56 bg-console-bg text-xs"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={refreshAll}
          >
            再読込
          </Button>
          <span className="text-console-muted">{items.length} 件</span>
        </div>
      </div>

      {consistencyCount > 0 ? (
        <div className="rounded-md bg-console-warn/15 px-4 py-2 text-xs text-console-warn">
          ⚠ IG 予約の不整合: schedule JSON のみ {consistency?.onlyInJson.length} 件 /
          posts.json のみ {consistency?.onlyInPosts.length} 件 — /api/ig-consistency
          で詳細
        </div>
      ) : null}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={loadInventory} />
      ) : items.length === 0 ? (
        <p className="text-sm text-console-muted">該当する投稿がありません</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((item, i) => (
              <PostCard
                key={`${item.platform}-${item.content_key}-${(item as PostDTO).id ?? i}`}
                item={item}
                onChanged={loadInventory}
                onJobStarted={(jobId, title) => setActiveJob({ id: jobId, title })}
              />
            ))}
          </div>
          {overflow > 0 ? (
            <p className="text-sm text-console-muted">
              +{overflow} 件 (フィルタで絞ってください)
            </p>
          ) : null}
        </>
      )}

      {activeJob ? (
        <JobDialog
          jobId={activeJob.id}
          onClose={() => setActiveJob(null)}
          onFinished={(finalStatus) => {
            loadLimits();
            showToast(
              finalStatus === "success" ? "ジョブが完了しました" : "ジョブが失敗しました",
            );
          }}
        />
      ) : null}

      <ToastPortal message={message} />
    </div>
  );
}

function TabGroup({
  options,
  value,
  onChange,
  variant,
}: {
  options: Array<[string, string]>;
  value: string;
  onChange: (v: string) => void;
  variant: "tab" | "chip";
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([val, label]) => {
        const active = value === val;
        return (
          <button
            key={`${variant}-${val || "all"}`}
            type="button"
            onClick={() => onChange(val)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              active
                ? "border-console-accent bg-console-accent font-semibold text-console-bg"
                : "border-console-border text-console-muted hover:border-console-accent/60",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
