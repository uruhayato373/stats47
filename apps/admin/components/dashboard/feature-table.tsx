"use client";

import { useMemo, useState } from "react";

import { Cell, DataTable, Row } from "@/components/admin-ui";
import { NativeSelect } from "@/components/ui/native-select";

export interface FeatureRow {
  section: string;
  id: string;
  title: string;
  tier: string;
  status: string;
  created: string;
}

type Wrapped<T> = T | { error: string };

function hasError(v: unknown): v is { error: string } {
  return !!v && typeof v === "object" && "error" in (v as Record<string, unknown>);
}

const SECTION_ORDER: Record<string, number> = {
  "🔴 高": 0,
  "🟡 中": 1,
  "🟢 低": 2,
  "🟣 判断待ち": 3,
};

function featureSort(a: FeatureRow, b: FeatureRow): number {
  const s = (SECTION_ORDER[a.section] ?? 9) - (SECTION_ORDER[b.section] ?? 9);
  if (s) return s;
  return a.id.localeCompare(b.id);
}

export function FeatureTable({ featureBacklog }: { featureBacklog: Wrapped<{ rows?: FeatureRow[] }> }) {
  const rows = useMemo<FeatureRow[]>(
    () => (hasError(featureBacklog) ? [] : (featureBacklog.rows ?? [])),
    [featureBacklog],
  );
  const [section, setSection] = useState("");

  const sections = useMemo(
    () => [...new Set(rows.map((r) => r.section))].sort((a, b) => (SECTION_ORDER[a] ?? 9) - (SECTION_ORDER[b] ?? 9)),
    [rows],
  );

  const filtered = useMemo(
    () => rows.filter((r) => !section || r.section === section).slice().sort(featureSort),
    [rows, section],
  );

  if (hasError(featureBacklog)) {
    return <p className="text-sm text-console-bad">取得失敗: {featureBacklog.error}</p>;
  }

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <NativeSelect value={section} onChange={(e) => setSection(e.target.value)} size="sm">
          <option value="">区分: 全て</option>
          {sections.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </NativeSelect>
        <span className="text-xs text-console-muted">
          {filtered.length} / {rows.length} 件
        </span>
      </div>
      <DataTable columns={["区分", "ID", "タイトル", "種類", "実行", "created"]}>
            {filtered.map((r, i) => (
              // 実データに id="" の行が複数あり空文字キーが重複するため index を合成する
              <Row key={`${r.section}-${r.id}-${i}`}>
                <Cell nowrap>{r.section}</Cell>
                <Cell nowrap>{r.id}</Cell>
                <Cell className="max-w-[320px] truncate" title={r.title}>
                  {r.title}
                </Cell>
                <Cell>{r.tier}</Cell>
                <Cell className="max-w-[240px] truncate" title={r.status}>
                  {r.status}
                </Cell>
                <Cell nowrap>{r.created}</Cell>
              </Row>
            ))}
          </DataTable>
    </div>
  );
}
