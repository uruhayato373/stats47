"use client";

import { useEffect, useState, useTransition } from "react";

import { ChartErrorState } from "@/components/charts/ChartState";
import type { PageComponent } from "@/components/stat-charts";

import { ChartEmptyState, ChartLoading } from "./ChartState";
import { MarkdownSectionRenderer } from "./MarkdownSectionRenderer";
import { loadThemeChartResult, type ThemeChartLoadResult } from "./theme-chart-result";
import { ThemeChartResultRenderer } from "./ThemeChartResultRenderer";

import type { MarkdownSectionComponentProps } from "../types";

interface Props {
  chart: PageComponent;
  prefCode: string;
  prefName: string;
}

/**
 * DB 管理チャートの統一レンダラー。
 *
 * page_components の componentType に応じてデータを取得し、
 * 実際のチャート描画は ThemeChartResultRenderer に委譲する。
 */
export function ThemeDbChartRenderer({ chart, prefCode }: Props) {
  const [loadResult, setLoadResult] = useState<ThemeChartLoadResult | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (chart.componentType === "markdown-section") return;

    let cancelled = false;
    setLoadResult(undefined);

    startTransition(async () => {
      const result = await loadThemeChartResult(chart, prefCode);
      if (!cancelled) {
        setLoadResult(result);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chart object reference changes on every render; key/type/area identify the fetch
  }, [chart.componentKey, chart.componentType, prefCode]);

  if (chart.componentType === "markdown-section") {
    const props = parseMarkdownSectionComponentProps(chart.componentProps);
    if (!props) {
      return <ChartEmptyState message="markdown が未設定です" />;
    }

    return (
      <div
        data-theme-component-key={chart.componentKey}
        data-theme-component-type="markdown-section"
        data-data-state="ready"
      >
        <MarkdownSectionRenderer title={chart.title} props={props} fallbackSourceName={chart.sourceName} />
      </div>
    );
  }

  if (isPending || loadResult === undefined) {
    return (
      <div
        data-theme-chart="true"
        data-theme-component-key={chart.componentKey}
        data-theme-component-type={chart.componentType}
        data-data-state="loading"
      >
        <ChartLoading height={200} />
      </div>
    );
  }

  if (loadResult.state === "source-unavailable") {
    return (
      <div
        data-theme-chart="true"
        data-theme-component-key={chart.componentKey}
        data-theme-component-type={chart.componentType}
        data-data-state="source-unavailable"
      >
        <ChartErrorState message="データソースからチャートを取得できません" height={200} />
      </div>
    );
  }

  if (loadResult.state === "no-data") {
    return (
      <div
        data-theme-chart="true"
        data-theme-component-key={chart.componentKey}
        data-theme-component-type={chart.componentType}
        data-data-state="no-data"
      >
        <ChartEmptyState message="チャートデータがありません" />
      </div>
    );
  }

  const { result } = loadResult;
  return (
    <div
      data-theme-chart="true"
      data-theme-component-key={chart.componentKey}
      data-theme-component-type={chart.componentType}
      data-data-state="ready"
      data-unit={result.contract.unit}
      data-year={result.contract.year}
      data-series-count={result.contract.seriesCount}
    >
      <ThemeChartResultRenderer chartResult={result} />
    </div>
  );
}

function parseMarkdownSectionComponentProps(value: Record<string, unknown>): MarkdownSectionComponentProps | null {
  const subtitle = typeof value.subtitle === "string" ? value.subtitle : undefined;
  const sources = parseMarkdownSources(value.sources);

  if (value.displayMode === "faq") {
    const items = parseFaqItems(value.items);
    if (!items) return null;
    return { displayMode: "faq", items, subtitle, sources };
  }

  if (value.displayMode !== undefined && value.displayMode !== "prose") return null;
  if (typeof value.markdown !== "string") return null;

  return {
    displayMode: "prose",
    markdown: value.markdown,
    subtitle,
    sources,
  };
}

function parseFaqItems(value: unknown): Array<{ question: string; answer: string }> | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const items = value.map((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return null;
    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.question !== "string" ||
      candidate.question.trim().length === 0 ||
      typeof candidate.answer !== "string" ||
      candidate.answer.trim().length === 0
    ) {
      return null;
    }
    return { question: candidate.question, answer: candidate.answer };
  });
  return items.every((item) => item !== null) ? (items as Array<{ question: string; answer: string }>) : null;
}

function parseMarkdownSources(value: unknown): MarkdownSectionComponentProps["sources"] {
  if (!Array.isArray(value)) return undefined;

  const sources = value.map((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return null;
    const source = item as Record<string, unknown>;
    if (typeof source.label !== "string") return null;
    return {
      label: source.label,
      url: typeof source.url === "string" ? source.url : undefined,
    };
  });

  return sources.every((source) => source !== null) ? (sources as MarkdownSectionComponentProps["sources"]) : undefined;
}
