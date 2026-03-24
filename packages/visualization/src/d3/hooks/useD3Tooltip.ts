"use client";

/**
 * D3地図ツールチップ管理カスタムフック
 */

import { useCallback, useEffect, useRef } from "react";

import { formatNumber } from "@stats47/utils";
import { TOOLTIP_OFFSET_X, TOOLTIP_OFFSET_Y } from "../constants/map-constants";

/**
 * ツールチップが画面外にはみ出さないよう位置を補正する
 */
export function clampTooltipPosition(
  tooltip: HTMLDivElement,
  pageX: number,
  pageY: number,
): void {
  const gap = 8;
  const rect = tooltip.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // 水平方向: 右にはみ出すならカーソル左側に配置
  let left = pageX + TOOLTIP_OFFSET_X;
  if (pageX + TOOLTIP_OFFSET_X + rect.width > window.scrollX + vw - gap) {
    left = pageX - rect.width - TOOLTIP_OFFSET_X;
  }

  // 垂直方向: 上にはみ出すならカーソル下側に配置、下にはみ出すなら上側
  let top = pageY + TOOLTIP_OFFSET_Y - rect.height;
  if (top < window.scrollY + gap) {
    top = pageY + Math.abs(TOOLTIP_OFFSET_Y);
  } else if (top + rect.height > window.scrollY + vh - gap) {
    top = window.scrollY + vh - rect.height - gap;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}


/**
 * ツールチップのCSSスタイル定数
 * JavaScriptのstyleオブジェクトに直接適用可能
 */
export const TOOLTIP_STYLES = {
  position: "absolute",
  opacity: "0",
  pointerEvents: "none",
  zIndex: "9999",
  backgroundColor: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  padding: "0.375rem 0.625rem",
  borderRadius: "0.5rem",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  border: "1px solid hsl(var(--border))",
  fontSize: "0.75rem",
  lineHeight: "1.125rem",
  transition: "opacity 0.1s ease",
  backdropFilter: "blur(4px)",
} as const;

/**
 * ツールチップのTailwind CSSクラス名
 * React要素のclassNameプロップに使用
 */
export const TOOLTIP_CLASSNAMES =
  "absolute bg-popover text-popover-foreground px-2.5 py-1.5 rounded-lg border border-border text-xs opacity-0 transition-opacity z-50 backdrop-blur-sm pointer-events-none shadow-md";

/**
 * ツールチップのHTML生成関数
 * 
 * @param params - ツールチップに表示する情報
 * @param params.prefName - 都道府県名
 * @param params.value - 数値データ
 * @param params.year - 年度（オプション）
 * @param params.categoryName - カテゴリ名（オプション）
 * @param params.unit - 単位（オプション）
 * @returns ツールチップのHTML文字列
 */
export function createTooltipContent(params: {
  prefName: string;
  value?: number | null;
  year?: string;
  categoryName?: string;
  unit?: string;
}): string {
  const { prefName, value, year, categoryName, unit = "" } = params;
  const formattedValue = typeof value === "number" ? formatNumber(value) : "-";
  
  return `
    <div style="display: grid; gap: 0.125rem;">
      <div style="font-weight: 500; border-bottom: 1px solid hsl(var(--border)); padding-bottom: 0.125rem; margin-bottom: 0.125rem;">
        ${prefName}
      </div>
      ${year ? `<div style="font-size: 0.6875rem; color: hsl(var(--muted-foreground));">${year}</div>` : ""}
      ${categoryName ? `<div style="font-size: 0.6875rem; font-weight: 500;">${categoryName}</div>` : ""}
      <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; margin-top: 0.125rem;">
        <span style="font-family: ui-monospace, monospace; font-weight: 600; font-variant-numeric: tabular-nums; font-size: 0.8125rem;">
          ${formattedValue}
        </span>
        <span style="font-size: 0.6875rem; color: hsl(var(--muted-foreground));">
          ${unit}
        </span>
      </div>
    </div>
  `;
}

/** 複数系列のツールチップ用データ */
export interface TooltipSeriesItem {
  name: string;
  value: number | null;
  color: string;
  unit?: string;
}

/**
 * 複数系列をスタック表示するツールチップHTML生成
 */
export function createStackedTooltipContent(params: {
  title: string;
  items: TooltipSeriesItem[];
  unit?: string;
  formatter?: (value: number) => string;
}): string {
  const { title, items, unit = "", formatter = formatNumber } = params;
  const rows = items
    .filter((item) => item.value != null)
    .map(
      (item) => `
      <div style="display: flex; align-items: center; gap: 0.375rem; padding: 0.0625rem 0;">
        <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background-color: ${item.color}; flex-shrink: 0;"></span>
        <span style="flex: 1; font-size: 0.6875rem;">${item.name}</span>
        <span style="font-family: ui-monospace, monospace; font-weight: 600; font-variant-numeric: tabular-nums; font-size: 0.75rem;">
          ${formatter(item.value!)}
        </span>
        <span style="font-size: 0.625rem; color: hsl(var(--muted-foreground));">${item.unit ?? unit}</span>
      </div>`
    )
    .join("");

  return `
    <div style="display: grid; gap: 0.0625rem; min-width: 120px;">
      <div style="font-weight: 500; border-bottom: 1px solid hsl(var(--border)); padding-bottom: 0.125rem; margin-bottom: 0.0625rem;">
        ${title}
      </div>
      ${rows}
    </div>
  `;
}

export interface UseD3TooltipReturn {
  showTooltip: (
    event: MouseEvent,
    prefName: string,
    data: {
      value?: number | null;
      year?: string;
      categoryName?: string;
      unit?: string;
    }
  ) => void;
  /** 複数系列のスタック表示ツールチップ */
  showStackedTooltip: (
    event: MouseEvent,
    title: string,
    items: TooltipSeriesItem[],
    options?: { unit?: string; formatter?: (value: number) => string }
  ) => void;
  updateTooltipPosition: (event: MouseEvent) => void;
  hideTooltip: () => void;
  cleanup: () => void;
}

const TOOLTIP_ID = "prefecture-map-tooltip";

/**
 * ツールチップの作成、表示、非表示を管理するカスタムフック
 * Vanilla JSでDOMを直接操作することで、D3への依存を減らしパフォーマンスを向上
 */
export function useD3Tooltip(): UseD3TooltipReturn {
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // ツールチップ要素の取得または作成
  const getOrCreateTooltip = useCallback((): HTMLDivElement => {
    let tooltip = document.getElementById(TOOLTIP_ID) as HTMLDivElement;

    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = TOOLTIP_ID;
      // 共通スタイル定数を使用
      Object.assign(tooltip.style, TOOLTIP_STYLES);

      document.body.appendChild(tooltip);
    }

    return tooltip;
  }, []);

  const showTooltip = useCallback(
    (
      event: MouseEvent,
      prefName: string,
      data: {
        value?: number | null;
        year?: string;
        categoryName?: string;
        unit?: string;
      }
    ) => {
      const tooltip = getOrCreateTooltip();

      // 共通のHTML生成関数を使用
      const tooltipContent = createTooltipContent({
        prefName,
        value: data.value,
        year: data.year,
        categoryName: data.categoryName,
        unit: data.unit,
      });

      tooltip.innerHTML = tooltipContent;
      tooltip.style.opacity = "1";
      clampTooltipPosition(tooltip, event.pageX, event.pageY);
    },
    [getOrCreateTooltip]
  );

  const showStackedTooltip = useCallback(
    (
      event: MouseEvent,
      title: string,
      items: TooltipSeriesItem[],
      options?: { unit?: string; formatter?: (value: number) => string }
    ) => {
      const tooltip = getOrCreateTooltip();
      tooltip.innerHTML = createStackedTooltipContent({
        title,
        items,
        unit: options?.unit,
        formatter: options?.formatter,
      });
      tooltip.style.opacity = "1";
      clampTooltipPosition(tooltip, event.pageX, event.pageY);
    },
    [getOrCreateTooltip]
  );

  const updateTooltipPosition = useCallback(
    (event: MouseEvent) => {
      const tooltip = document.getElementById(TOOLTIP_ID) as HTMLDivElement | null;
      if (tooltip) {
        clampTooltipPosition(tooltip, event.pageX, event.pageY);
      }
    },
    []
  );

  const hideTooltip = useCallback(() => {
    const tooltip = document.getElementById(TOOLTIP_ID);
    if (tooltip) {
      tooltip.style.opacity = "0";
    }
  }, []);

  const cleanup = useCallback(() => {
    const tooltip = document.getElementById(TOOLTIP_ID);
    if (tooltip) {
      // 他のコンポーネントが使っている可能性もあるため、削除せず非表示にするだけにする
      // または、参照カウントなどで管理するが、ここではシンプルに非表示
      tooltip.style.opacity = "0";
    }
  }, []);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    showTooltip,
    showStackedTooltip,
    updateTooltipPosition,
    hideTooltip,
    cleanup,
  };
}