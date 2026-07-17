"use client";

import { useEffect, useMemo, useState } from "react";

import { Input, cn } from "@stats47/components";

import { apiGet, ApiError } from "@/lib/client/api-client";
import { ErrorState, Loading } from "@/components/async-state";
import { JobDialog } from "@/components/job-dialog";
import type { BuzzMapCatalogResponse, BuzzMapEntryDTO } from "@/lib/contracts/types";
import { BuzzMapCard } from "./buzz-map-card";
import { BuzzMapSummary } from "./buzz-map-summary";

const MAX_VISIBLE = 100;

const PRIORITIES: Array<[string, string]> = [
  ["", "All"],
  ["P0", "P0"],
  ["P1", "P1"],
  ["P2", "P2"],
  ["P3", "P3"],
];

const STRATEGIES: Array<[string, string]> = [
  ["", "All"],
  ["existing-ranking", "existing-ranking"],
  ["existing-blog", "existing-blog"],
  ["existing-theme", "existing-theme"],
  ["extend-theme", "extend-theme"],
  ["create-blog", "create-blog"],
  ["create-theme", "create-theme"],
  ["blocked", "blocked"],
];

const FEASIBILITIES: Array<[string, string]> = [
  ["", "All"],
  ["now", "now"],
  ["needs-pipeline", "needs-pipeline"],
  ["needs-renderer", "needs-renderer"],
  ["needs-data", "needs-data"],
];

const LICENSES: Array<[string, string]> = [
  ["", "All"],
  ["allowed", "allowed"],
  ["review-required", "review-required"],
  ["blocked", "blocked"],
];

export function BuzzMapView() {
  const [catalog, setCatalog] = useState<BuzzMapCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [priority, setPriority] = useState("");
  const [strategy, setStrategy] = useState("");
  const [feasibility, setFeasibility] = useState("");
  const [license, setLicense] = useState("");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");

  const [activeJob, setActiveJob] = useState<{ id: string; title: string } | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    apiGet<BuzzMapCatalogResponse>("/api/buzz-map/catalog?lane=curated")
      .then((res) => setCatalog(res))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    if (!catalog) return [];
    const set = new Set<string>();
    for (const e of catalog.entries) if (e.category) set.add(e.category);
    return [...set].sort();
  }, [catalog]);

  const filtered = useMemo<BuzzMapEntryDTO[]>(() => {
    if (!catalog) return [];
    let list = catalog.entries;
    if (priority) list = list.filter((e) => e.priority === priority);
    if (strategy) list = list.filter((e) => e.landingStrategy === strategy);
    if (feasibility) list = list.filter((e) => e.feasibility === feasibility);
    if (license) list = list.filter((e) => e.commercialUse === license);
    if (category) list = list.filter((e) => e.category === category);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          (e.title || "").toLowerCase().includes(q) ||
          String(e.hook || "").toLowerCase().includes(q) ||
          (e.ideaId || "").toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [catalog, priority, strategy, feasibility, license, category, query]);

  const visible = filtered.slice(0, MAX_VISIBLE);
  const overflow = filtered.length - visible.length;

  return (
    <div className="space-y-4">
      {catalog ? <BuzzMapSummary summary={catalog.summary} /> : null}

      <div className="sticky top-[57px] z-10 -mx-6 space-y-2 border-b border-console-border bg-console-bg/95 px-6 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <FilterGroup label="priority" options={PRIORITIES} value={priority} onChange={setPriority} />
          <FilterGroup
            label="landing"
            options={STRATEGIES}
            value={strategy}
            onChange={setStrategy}
          />
          <FilterGroup
            label="feasibility"
            options={FEASIBILITIES}
            value={feasibility}
            onChange={setFeasibility}
          />
          <FilterGroup label="license" options={LICENSES} value={license} onChange={setLicense} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-8 rounded-md border border-console-border bg-console-bg px-2 text-xs text-console-fg"
          >
            <option value="">category: All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="title / hook / ideaId 検索"
            className="h-8 w-64 bg-console-bg text-xs"
          />
          <button
            type="button"
            onClick={load}
            className="h-8 rounded-md border border-console-border bg-console-bg px-3 text-xs text-console-fg transition-colors hover:border-console-accent"
          >
            再読込
          </button>
          <span className="text-console-muted">{filtered.length} 件</span>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-console-muted">該当する候補がありません</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2 xl:grid-cols-3">
            {visible.map((entry) => (
              <BuzzMapCard
                key={entry.ideaId || entry.metricKey}
                entry={entry}
                onChanged={load}
                onJobStarted={(jobId, title) => setActiveJob({ id: jobId, title })}
              />
            ))}
          </div>
          {overflow > 0 ? (
            <p className="text-sm text-console-muted">
              +{overflow} 件 (上限 {MAX_VISIBLE} 件表示。filter で絞ってください)
            </p>
          ) : null}
        </>
      )}

      {activeJob ? (
        <JobDialog
          jobId={activeJob.id}
          onClose={() => setActiveJob(null)}
          onFinished={() => load()}
        />
      ) : null}
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<[string, string]>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-console-muted">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map(([val, lbl]) => {
          const active = value === val;
          return (
            <button
              key={`${label}-${val || "all"}`}
              type="button"
              onClick={() => onChange(val)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                active
                  ? "border-console-accent bg-console-accent font-semibold text-console-bg"
                  : "border-console-border text-console-muted hover:border-console-accent/60",
              )}
            >
              {lbl}
            </button>
          );
        })}
      </div>
    </div>
  );
}
