"use client";

import { useEffect, useMemo, useState } from "react";

import { Grid } from "@/components/layout-primitives";
import { Button, Input, NativeSelect, NativeSelectOption } from "@stats47/components";

import { apiGet, ApiError } from "@/lib/client/api-client";
import { ErrorState, Loading } from "@/components/async-state";
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
    <>
      {catalog ? <BuzzMapSummary summary={catalog.summary} /> : null}

      <div className="sticky top-(--header-height) z-10 flex flex-col gap-2 border-b bg-background/95 py-3 backdrop-blur">
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
          <NativeSelect size="sm" aria-label="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <NativeSelectOption value="">category: All</NativeSelectOption>
            {categories.map((c) => (
              <NativeSelectOption key={c} value={c}>
                {c}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Input
            aria-label="候補を検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="title / hook / ideaId 検索"
            className="w-64"
          />
          <Button size="sm" variant="outline" onClick={load}>
            再読込
          </Button>
          <span className="text-sm text-muted-foreground">{filtered.length} 件</span>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">該当する候補がありません</p>
      ) : (
        <>
          <Grid min="lg">
            {visible.map((entry) => (
              <BuzzMapCard
                key={entry.ideaId || entry.metricKey}
                entry={entry}
              />
            ))}
          </Grid>
          {overflow > 0 ? (
            <p className="text-sm text-muted-foreground">
              +{overflow} 件 (上限 {MAX_VISIBLE} 件表示。filter で絞ってください)
            </p>
          ) : null}
        </>
      )}
    </>
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
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map(([val, lbl]) => (
          <Button
            key={`${label}-${val || "all"}`}
            size="xs"
            variant={value === val ? "default" : "outline"}
            aria-pressed={value === val}
            onClick={() => onChange(val)}
          >
            {lbl}
          </Button>
        ))}
      </div>
    </div>
  );
}
