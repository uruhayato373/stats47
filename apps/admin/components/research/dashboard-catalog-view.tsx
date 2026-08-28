"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@stats47/components";
import { ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

function StatusBadge({ status }: { status: DashboardVerificationStatusDTO }) {
  return (
    <Badge
      variant="outline"
      size="sm"
      className={
        status === "verified"
          ? "border-console-good/50 text-console-good"
          : "border-console-warn/50 text-console-warn"
      }
    >
      {statusLabel(status)}
    </Badge>
  );
}

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-console-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`${label}を公式サイトで開く`}
    >
      公式
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-3.5">
        <div className="text-xl font-bold text-console-fg">{value}</div>
        <div className="mt-1 text-xs font-medium text-console-fg">{label}</div>
        {detail ? (
          <div className="mt-1 text-[11px] text-console-muted">{detail}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DashboardTable({ data }: { data: DashboardCatalogResponse }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-sm">公式ダッシュボード</CardTitle>
        <span className="text-xs text-console-muted">
          {data.dashboards.length}件
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <Table containerClassName="max-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>名称・提供者</TableHead>
              <TableHead>区分</TableHead>
              <TableHead className="text-right">ストーリー</TableHead>
              <TableHead>状態</TableHead>
              <TableHead>確認メモ</TableHead>
              <TableHead>出典</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.dashboards.map((dashboard) => (
              <TableRow key={dashboard.id}>
                <TableCell className="min-w-52 align-top">
                  <div className="font-semibold text-console-fg">
                    {dashboard.title}
                  </div>
                  <div className="mt-0.5 text-xs text-console-muted">
                    {dashboard.publisher}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap align-top text-xs">
                  {publisherTypeLabel(dashboard.publisherType)}
                </TableCell>
                <TableCell className="text-right align-top font-semibold">
                  {dashboard.storyCount}
                </TableCell>
                <TableCell className="whitespace-nowrap align-top">
                  <StatusBadge status={dashboard.status} />
                </TableCell>
                <TableCell className="min-w-64 align-top text-xs text-console-muted">
                  {dashboard.notes}
                </TableCell>
                <TableCell className="align-top">
                  <SourceLink
                    href={dashboard.officialUrl}
                    label={dashboard.title}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
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
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-console-fg">調査カタログ</h1>
        <p className="mt-1 max-w-4xl text-sm text-console-muted">
          政府・自治体の公式ダッシュボードが採用する問い、指標、可視化、地域粒度をstats47のテーマ別に確認する読み取り専用ミラーです。
        </p>
        {data ? (
          <p className="mt-1 text-xs text-console-muted">
            調査日: {data.researchedAt} ・ 真実源:{" "}
            <code className="break-all">{data.sourcePath}</code>
          </p>
        ) : null}
      </div>

      {loading ? <Loading label="調査カタログを読み込み中..." /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && !data ? (
        <EmptyState message="調査カタログがありません" />
      ) : null}

      {data ? (
        <>
          <section aria-labelledby="research-summary-heading">
            <h2
              id="research-summary-heading"
              className="mb-3 border-b border-console-border pb-1.5 text-sm font-semibold text-console-fg"
            >
              収録状況
            </h2>
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
              <StatCard label="公式システム" value={data.summary.dashboards} />
              <StatCard label="自治体" value={data.summary.localDashboards} />
              <StatCard label="ストーリー" value={data.summary.stories} />
              <StatCard
                label="RESAS"
                value={`${data.summary.resasStories}/40`}
              />
              <StatCard
                label="テーマ接続"
                value={`${data.summary.coveredThemes}/${data.summary.declaredThemes}`}
              />
              <StatCard
                label="基本監査"
                value={data.audit.status.toUpperCase()}
                detail={`${data.audit.errors.length} errors / ${data.audit.warnings.length} warnings`}
              />
            </div>
          </section>

          <section aria-labelledby="research-audit-heading">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle id="research-audit-heading" className="text-sm">
                  監査状態
                </CardTitle>
                <Badge
                  variant="outline"
                  size="sm"
                  className={
                    data.audit.status === "fail"
                      ? "border-console-bad/50 text-console-bad"
                      : data.audit.status === "warn"
                        ? "border-console-warn/50 text-console-warn"
                        : "border-console-good/50 text-console-good"
                  }
                >
                  {data.audit.status.toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {data.audit.errors.map((item) => (
                  <p key={item} className="text-console-bad">
                    ERROR: {item}
                  </p>
                ))}
                {data.audit.warnings.map((item) => (
                  <p key={item} className="text-console-warn">
                    WARN: {item}
                  </p>
                ))}
                {data.audit.errors.length === 0 &&
                data.audit.warnings.length === 0 ? (
                  <p className="text-console-good">
                    構造・テーマ接続・RESAS件数に問題はありません。
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="dashboard-list-heading">
            <h2 id="dashboard-list-heading" className="sr-only">
              公式ダッシュボード一覧
            </h2>
            <DashboardTable data={data} />
          </section>

          <section aria-labelledby="story-list-heading">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-console-border pb-3">
              <div>
                <h2
                  id="story-list-heading"
                  className="text-sm font-semibold text-console-fg"
                >
                  ストーリー
                </h2>
                <p className="mt-1 text-xs text-console-muted">
                  {filteredStories.length} / {data.stories.length} 件
                </p>
              </div>
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
                className="h-8 text-xs"
              >
                絞り込みを解除
              </Button>
            </div>

            <div className="mb-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <Label
                  htmlFor="research-query"
                  className="mb-1 block text-xs text-console-muted"
                >
                  キーワード
                </Label>
                <Input
                  id="research-query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="指標・問い・提供者を検索"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs text-console-muted">
                  stats47テーマ
                </Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger aria-label="stats47テーマで絞り込み">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>すべてのテーマ</SelectItem>
                    {data.filters.themes.map((item) => (
                      <SelectItem key={item.key} value={item.key}>
                        {item.label} ({item.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block text-xs text-console-muted">
                  公式システム
                </Label>
                <Select value={dashboard} onValueChange={setDashboard}>
                  <SelectTrigger aria-label="公式システムで絞り込み">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>すべてのシステム</SelectItem>
                    {data.dashboards.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title} ({item.storyCount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block text-xs text-console-muted">
                  ストーリー形式
                </Label>
                <Select value={pattern} onValueChange={setPattern}>
                  <SelectTrigger aria-label="ストーリー形式で絞り込み">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>すべての形式</SelectItem>
                    {data.filters.patterns.map((item) => (
                      <SelectItem key={item.key} value={item.key}>
                        {PATTERN_LABELS[item.key] ?? item.key} ({item.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredStories.length === 0 ? (
              <EmptyState message="条件に一致するストーリーはありません" />
            ) : (
              <Card className="shadow-none">
                <CardContent className="p-0">
                  <Table containerClassName="max-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>ストーリー</TableHead>
                        <TableHead>問い・指標</TableHead>
                        <TableHead>stats47テーマ</TableHead>
                        <TableHead>可視化</TableHead>
                        <TableHead>確認</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStories.map((story) => (
                        <TableRow key={story.id}>
                          <TableCell className="min-w-56 align-top">
                            <div className="font-semibold text-console-fg">
                              {story.title}
                            </div>
                            <div className="mt-1 text-xs text-console-muted">
                              {story.dashboardTitle}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              <Badge variant="outline" size="sm">
                                {PATTERN_LABELS[story.storyPattern] ??
                                  story.storyPattern}
                              </Badge>
                              <StatusBadge status={story.dashboardStatus} />
                            </div>
                          </TableCell>
                          <TableCell className="min-w-80 align-top">
                            <div className="text-sm text-console-fg">
                              {story.question}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {story.indicatorFamilies.map((indicator) => (
                                <Badge
                                  key={indicator}
                                  variant="secondary"
                                  size="sm"
                                >
                                  {indicator}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-48 align-top">
                            <div className="flex flex-wrap gap-1">
                              {story.stats47ThemeKeys.map((key) => (
                                <Badge key={key} variant="outline" size="sm">
                                  {data.filters.themes.find(
                                    (item) => item.key === key
                                  )?.label ?? key}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-44 align-top">
                            <div className="flex flex-wrap gap-1">
                              {story.visualizations.map((visualization) => (
                                <Badge
                                  key={visualization}
                                  variant="secondary"
                                  size="sm"
                                >
                                  {VISUALIZATION_LABELS[visualization] ??
                                    visualization}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap align-top text-xs">
                            <SourceLink
                              href={story.sourceUrl}
                              label={story.title}
                            />
                            <div className="mt-1 text-console-muted">
                              {story.verifiedAt}
                            </div>
                            <div className="mt-0.5 text-console-muted">
                              {story.evidenceLevel}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
