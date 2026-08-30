"use client";

import { Button } from "@stats47/components";

/** 画像資産を絞り込み・再読込する読み取り専用ツールバー。 */
export function AssetToolbar({
  query,
  onQueryChange,
  limit,
  onLimitChange,
  all,
  onAllChange,
  onReload,
  count,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  limit: number;
  onLimitChange: (value: number) => void;
  all: boolean;
  onAllChange: (value: boolean) => void;
  onReload: () => void;
  count: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-console-border py-2 text-xs">
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="key / slug 検索"
        className="w-48 rounded-md border border-console-border bg-console-bg px-2 py-1.5 text-console-fg placeholder:text-console-muted focus:border-console-accent focus:outline-none"
      />
      <label className="flex items-center gap-1.5 text-console-muted">
        件数
        <input
          type="number"
          min={1}
          value={limit}
          disabled={all}
          onChange={(e) => onLimitChange(Number(e.target.value) || 30)}
          className="w-[70px] rounded-md border border-console-border bg-console-bg px-2 py-1.5 text-console-fg disabled:opacity-50"
        />
      </label>
      <label className="flex items-center gap-1.5 text-console-muted">
        <input
          type="checkbox"
          checked={all}
          onChange={(e) => onAllChange(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-console-border accent-console-accent"
        />
        全件 (ranking等)
      </label>
      <Button type="button" variant="outline" size="sm" onClick={onReload}>
        読込
      </Button>
      <span className="text-console-muted">{count}</span>
    </div>
  );
}
