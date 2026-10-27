"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  BookOpenIcon,
  Building2Icon,
  ExternalLink,
  LandmarkIcon,
  LayersIcon,
  MapIcon,
  ScanSearchIcon,
  WorkflowIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DataGrid, PanelCard, StatCard, StatusBadge } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { EmptyState, ErrorState, Loading } from "@/components/async-state";
import { apiGet, ApiError } from "@/lib/client/api-client";
import type {
  DashboardCatalogResponse,
  DashboardVerificationStatusDTO,
} from "@/lib/contracts/types";

const ALL = "all";

const PATTERN_LABELS: Record<string, string> = {
  overview: "概況",
  "map-to-detail": "地図から詳細",
  "trend-and-comparison": "推移と比較",
  "composition-and-driver": "構成と要因",
  flow: "流動",
  "supply-demand": "需給",
  correlation: "相関",
  scenario: "将来シナリオ",
  "policy-progress": "政策進捗",
  "catalog-exploration": "データ探索",
};

const VISUALIZATION_LABELS: Record<string, string> = {
  kpi: "KPI",
  choropleth: "塗り分け地図",
  "mesh-map": "メッシュ地図",
  "point-map": "地点地図",
  line: "折れ線",
  bar: "棒",
  "stacked-bar": "積み上げ棒",
  pyramid: "ピラミッド",
  scatter: "散布図",
  radar: "レーダー",
  "ranking-table": "ランキング",
  "flow-map": "流動地図",
  sankey: "サンキー",
  heatmap: "ヒートマップ",
  treemap: "ツリーマップ",
  donut: "ドーナツ",
  table: "表",
  "policy-progress": "進捗",
};

function publisherTypeLabel(value: string): string {
  if (value === "national-government") return "国";
  if (value === "prefecture") return "都道府県";
  if (value === "municipality") return "市区町村";
  return value;
}

function statusLabel(value: DashboardVerificationStatusDTO): string {
  return value === "verified" ? "確認済み" : "部分確認";
}

function VerificationBadge({ status }: { status: DashboardVerificationStatusDTO }) {
  return <StatusBadge tone={status === "verified" ? "good" : "warn"}>{statusLabel(status)}</StatusBadge>;
}

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`${label}を公式サイトで開く`}
    >
      公式
      <ExternalLink className="size-3.5" aria-hidden="true" />
    </a>
  );
}

function DashboardTable({ data }: { data: DashboardCatalogResponse }) {
  return (
    <Section title="公式ダッシュボード" count={data.dashboards.length}>
      <DataGrid
        columns={[
          { id: "title", header: "名称・提供者", sortable: true },
          { id: "type", header: "区分", sortable: true, nowrap: true },
          { id: "stories", header: "ストーリー", numeric: true, sortable: true },
          { id: "status", header: "状態", sortable: true, nowrap: true },
          { id: "notes", header: "確認メモ" },
          { id: "source", header: "出典" },
        ]}
        rows={data.dashboards.map((dashboard) => ({
          id: dashboard.id,
          cells: [
            <div key="title" className="min-w-52">
              <div className="font-medium text-foreground">{dashboard.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{dashboard.publisher}</div>
            </div>,
            <span key="type" className="text-xs">
              {publisherTypeLabel(dashboard.publisherType)}
            </span>,
            <span key="stories" className="font-medium">
              {dashboard.storyCount}
            </span>,
            <VerificationBadge key="status" status={dashboard.status} />,
            <div key="notes" className="min-w-64 text-xs text-muted-foreground">
              {dashboard.notes}
            </div>,
            <SourceLink key="source" href={dashboard.officialUrl} label={dashboard.title} />,
          ],
          sort: [dashboard.title, dashboard.publisherType, dashboard.storyCount, dashboard.status, null, null],
          search: `${dashboard.title} ${dashboard.publisher}`,
          facet: dashboard.publisherType,
        }))}
        facets={[...new Set(data.dashboards.map((d) => d.publisherType))].map((v) => ({ value: v, label: publisherTypeLabel(v) }))}
        searchPlaceholder="名称・提供者で絞り込み"
      />
    </Section>
  );
}

export function DashboardCatalogView() {
  const [data, setData] = useState<DashboardCatalogResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState(ALL);
  const [dashboard, setDashboard] = useState(ALL);
  const [pattern, setPattern] = useState(ALL);

  const load = () => {
    setLoading(true);
    setError(null);
    apiGet<DashboardCatalogResponse>("/api/research/dashboard-catalog")
      .then(setData)
      .catch((reason: unknown) => {
        const message =
          reason instanceof ApiError
            ? `取得失敗: ${reason.message}`
            : reason instanceof Error
              ? reason.message
              : String(reason);
        setError(message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filteredStories = useMemo(() => {
    if (!data) return [];
    const normalized = query.trim().toLocaleLowerCase("ja");
    return data.stories.filter((story) => {
      if (theme !== ALL && !story.stats47ThemeKeys.includes(theme))
        return false;
      if (dashboard !== ALL && story.dashboardId !== dashboard) return false;
      if (pattern !== ALL && story.storyPattern !== pattern) return false;
      if (!normalized) return true;
      const haystack = [
        story.title,
        story.question,
        story.dashboardTitle,
        story.category,
        ...story.indicatorFamilies,
        ...story.stats47ThemeKeys,
      ]
        .join(" ")
        .toLocaleLowerCase("ja");
      return haystack.includes(normalized);
    });
  }, [dashboard, data, pattern, query, theme]);

  return (
    <>
      <Section
        title="公式ダッシュボード研究カタログ"
        note={
          data ? (
            <>
              調査日: {data.researchedAt} ・ 真実源: <code className="break-all font-mono text-xs">{data.sourcePath}</code>
            </>
          ) : undefined
        }
      >
        <p className="max-w-4xl text-sm text-muted-foreground">
          政府・自治体の公式ダッシュボードが採用する問い、指標、可視化、地域粒度をstats47のテーマ別に確認する読み取り専用ミラーです。
        </p>
      </Section>

      {loading ? <Loading label="調査カタログを読み込み中..." /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && !data ? <EmptyState message="調査カタログがありません" /> : null}

      {data ? (
        <>
          <Grid min="sm">
            <StatCard label="公式システム" icon={<LandmarkIcon />} value={data.summary.dashboards} />
            <StatCard label="自治体" icon={<Building2Icon />} value={data.summary.localDashboards} />
            <StatCard label="ストーリー" icon={<BookOpenIcon />} value={data.summary.stories} />
            <StatCard label="RESAS" icon={<MapIcon />} value={`${data.summary.resasStories}/40`} />
            <StatCard label="テーマ接続" icon={<LayersIcon />} value={`${data.summary.coveredThemes}/${data.summary.declaredThemes}`} />
            <StatCard
              label="基本監査"
              icon={<ScanSearchIcon />}
              value={data.audit.status.toUpperCase()}
              tone={data.audit.status === "fail" ? "bad" : data.audit.status === "warn" ? "warn" : "good"}
              sub={`${data.audit.errors.length} errors / ${data.audit.warnings.length} warnings`}
            />
          </Grid>

          <PanelCard
            title="監査状態"
            icon={<ScanSearchIcon />}
            action={
              <StatusBadge tone={data.audit.status === "fail" ? "bad" : data.audit.status === "warn" ? "warn" : "good"}>
                {data.audit.status.toUpperCase()}
              </StatusBadge>
            }
          >
            <div className="flex flex-col gap-2 text-sm">
              {data.audit.errors.map((item) => (
                <p key={item}>
                  <StatusBadge tone="bad">ERROR</StatusBadge> {item}
                </p>
              ))}
              {data.audit.warnings.map((item) => (
                <p key={item}>
                  <StatusBadge tone="warn">WARN</StatusBadge> {item}
                </p>
              ))}
              {data.audit.errors.length === 0 && data.audit.warnings.length === 0 ? (
                <p className="text-muted-foreground">構造・テーマ接続・RESAS件数に問題はありません。</p>
              ) : null}
            </div>
          </PanelCard>

          <DashboardTable data={data} />

          <PanelCard
            title="ストーリー"
            icon={<WorkflowIcon />}
            description={`${filteredStories.length} / ${data.stories.length} 件`}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setTheme(ALL);
                  setDashboard(ALL);
                  setPattern(ALL);
                }}
              >
                絞り込みを解除
              </Button>
            }
          >
            <div className="flex flex-col gap-4">
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="research-query" className="text-xs text-muted-foreground">
                    キーワード
                  </Label>
                  <Input
                    id="research-query"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="指標・問い・提供者を検索"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">stats47テーマ</Label>
                  <NativeSelect value={theme} onChange={(e) => setTheme(e.target.value)} aria-label="stats47テーマで絞り込み">
                    <NativeSelectOption value={ALL}>すべてのテーマ</NativeSelectOption>
                    {data.filters.themes.map((item) => (
                      <NativeSelectOption key={item.key} value={item.key}>
                        {item.label} ({item.count})
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">公式システム</Label>
                  <NativeSelect value={dashboard} onChange={(e) => setDashboard(e.target.value)} aria-label="公式システムで絞り込み">
                    <NativeSelectOption value={ALL}>すべてのシステム</NativeSelectOption>
                    {data.dashboards.map((item) => (
                      <NativeSelectOption key={item.id} value={item.id}>
                        {item.title} ({item.storyCount})
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">ストーリー形式</Label>
                  <NativeSelect value={pattern} onChange={(e) => setPattern(e.target.value)} aria-label="ストーリー形式で絞り込み">
                    <NativeSelectOption value={ALL}>すべての形式</NativeSelectOption>
                    {data.filters.patterns.map((item) => (
                      <NativeSelectOption key={item.key} value={item.key}>
                        {PATTERN_LABELS[item.key] ?? item.key} ({item.count})
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              {filteredStories.length === 0 ? (
                <EmptyState message="条件に一致するストーリーはありません" />
              ) : (
                <DataGrid
                  columns={[
                    { id: "story", header: "ストーリー", sortable: true },
                    { id: "question", header: "問い・指標" },
                    { id: "themes", header: "stats47テーマ" },
                    { id: "viz", header: "可視化" },
                    { id: "check", header: "確認", sortable: true, nowrap: true },
                  ]}
                  rows={filteredStories.map((story) => ({
                    id: story.id,
                    cells: [
                      <div key="story" className="min-w-56">
                        <div className="font-medium text-foreground">{story.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{story.dashboardTitle}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge variant="outline">{PATTERN_LABELS[story.storyPattern] ?? story.storyPattern}</Badge>
                          <VerificationBadge status={story.dashboardStatus} />
                        </div>
                      </div>,
                      <div key="question" className="min-w-80">
                        <div className="text-sm text-foreground">{story.question}</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {story.indicatorFamilies.map((indicator) => (
                            <Badge key={indicator} variant="secondary">
                              {indicator}
                            </Badge>
                          ))}
                        </div>
                      </div>,
                      <div key="themes" className="flex min-w-48 flex-wrap gap-1">
                        {story.stats47ThemeKeys.map((key) => (
                          <Badge key={key} variant="outline">
                            {data.filters.themes.find((item) => item.key === key)?.label ?? key}
                          </Badge>
                        ))}
                      </div>,
                      <div key="viz" className="flex min-w-44 flex-wrap gap-1">
                        {story.visualizations.map((visualization) => (
                          <Badge key={visualization} variant="secondary">
                            {VISUALIZATION_LABELS[visualization] ?? visualization}
                          </Badge>
                        ))}
                      </div>,
                      <div key="check" className="text-xs">
                        <SourceLink href={story.sourceUrl} label={story.title} />
                        <div className="mt-1 text-muted-foreground">{story.verifiedAt}</div>
                        <div className="mt-0.5 text-muted-foreground">{story.evidenceLevel}</div>
                      </div>,
                    ],
                    sort: [story.title, null, null, null, story.verifiedAt],
                  }))}
                />
              )}
            </div>
          </PanelCard>
        </>
      ) : null}
    </>
  );
}
