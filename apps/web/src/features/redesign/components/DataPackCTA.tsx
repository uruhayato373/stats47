"use client";

import type { ReactNode } from "react";

import { Download } from "lucide-react";

interface DataPackCTAProps {
  /** カード見出し */
  title: string;
  /** カード説明 */
  description: string;
  /** primary CSV ダウンロードボタン (要 onClick 付き) */
  csvButton: ReactNode;
  /** JSON ボタンを表示 (disabled) するか */
  showJson?: boolean;
  /** Excel ボタンを表示 (disabled) するか */
  showExcel?: boolean;
}

/**
 * D-System データパック訴求カード
 *
 * CSV ダウンロードボタンを active、JSON/Excel は disabled で「準備中」表示。
 * `csvButton` は呼び出し側で `DataDownloadMenuButton` 等を注入する。
 */
export function DataPackCTA({
  title,
  description,
  csvButton,
  showJson = true,
  showExcel = true,
}: DataPackCTAProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-none border border-primary/20 bg-primary/5 p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Download className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-bold text-primary">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {csvButton}
        {showJson && (
          <button
            type="button"
            disabled
            title="準備中"
            className="cursor-not-allowed rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-60"
          >
            JSON
          </button>
        )}
        {showExcel && (
          <button
            type="button"
            disabled
            title="準備中"
            className="cursor-not-allowed rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-60"
          >
            Excel
          </button>
        )}
      </div>
    </div>
  );
}
