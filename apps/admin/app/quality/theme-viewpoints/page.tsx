import Link from "next/link";
import { CircleAlertIcon, LayersIcon, ListChecksIcon, SearchCheckIcon, TrendingDownIcon } from "lucide-react";

import { Cell, DataGrid, DataTable, Row, StatCard, StatusBadge, TrendChart } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { PageHeading } from "@/components/ops/primitives";
import { themeViewpointSummary } from "@/lib/server/theme-viewpoints";

import { datasetDir } from "../../../../../config/datasets.mjs";
import { THEME_SELECTION_VIEWPOINTS } from "../../../../../config/paths.mjs";

export const dynamic = "force-dynamic";
export const metadata = { title: "指標を選ぶ視点 — stats47 admin" };

const PAGE = "/quality/theme-viewpoints";
const MAX_THEME_LINKS = 4;
const MAX_CANDIDATES = 10;

const SEVERITY_LABEL = { fix: "直す", review: "確かめる" } as const;

function ruleHref(rule: string, theme?: string): string {
  const params = new URLSearchParams({ rule });
  if (theme) params.set("theme", theme);
  return `${PAGE}?${params.toString()}#hits`;
}

const LINK = "font-medium underline-offset-4 hover:underline";

/** 指標を選ぶ視点 (型 B: 一覧・キュー)。件数 → 推移 → 候補・規則・該当箇所の一覧 */
export default async function ThemeViewpointsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const summary = themeViewpointSummary();
  const machineRules = summary.rules.filter((r) => r.hitCount !== null);
  const selectedRule =
    machineRules.find((r) => r.id === params.rule) ?? machineRules.find((r) => (r.hitCount ?? 0) > 0) ?? null;
  const selectedTheme = params.theme ?? null;
  const selectedHits = selectedRule
    ? (summary.hits[selectedRule.id] ?? []).filter((h) => !selectedTheme || h.themeKey === selectedTheme)
    : [];
  const fixHits = machineRules.filter((r) => r.severity === "fix").reduce((n, r) => n + (r.hitCount ?? 0), 0);
  const reviewHits = machineRules.filter((r) => r.severity === "review").reduce((n, r) => n + (r.hitCount ?? 0), 0);
  const nextCandidates = summary.candidates.filter((c) => !c.inFlight).slice(0, MAX_CANDIDATES);
  const inFlight = summary.candidates.filter((c) => c.inFlight);
  const ruleTitle = new Map(summary.rules.map((r) => [r.id, r.title]));
  const ruleSeverity = new Map(summary.rules.map((r) => [r.id, r.severity]));
  /** 週ごとに重さ別の該当件数を足す。その週に記録が 1 件も無ければ欠測 (null) のまま */
  const sumWeek = (i: number, severity: "fix" | "review") => {
    const values = Object.entries(summary.trend.byRule)
      .filter(([rule]) => ruleSeverity.get(rule) === severity)
      .map(([, counts]) => counts[i])
      .filter((n): n is number => typeof n === "number");
    return values.length ? values.reduce((a, b) => a + b, 0) : null;
  };
  const trendRows = summary.trend.weeks.map((week, i) => ({ week, fix: sumWeek(i, "fix"), review: sumWeek(i, "review") }));

  return (
    <>
      <PageHeading
        title="指標を選ぶ視点"
        source={`${THEME_SELECTION_VIEWPOINTS} + ${datasetDir("themes.catalogs")}/`}
      >
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          テーマページの指標を選ぶときの採用基準と判断規則。機械で数えられる規則は、全テーマのカタログを毎回読み直して
          該当箇所を並べる (gate ではない。是正と提案の材料)。人が確かめる規則は、提案文書の表で 1 件ずつ判断する。
          提案の形式は{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">
            .claude/skills/theme/manage-theme-portfolio/reference/theme-proposal-format.md
          </code>
          。
        </p>
      </PageHeading>

      <Grid min="sm">
        <StatCard label="対象テーマ" icon={<LayersIcon />} value={summary.themeCount} />
        <StatCard label="主要指標 (primary・secondary)" icon={<ListChecksIcon />} value={summary.primaryAndSecondaryCount} />
        <StatCard label="直す候補" icon={<CircleAlertIcon />} value={fixHits} tone={fixHits ? "warn" : "good"} sub="重さが「直す」の規則の該当" />
        <StatCard label="確かめる候補" icon={<SearchCheckIcon />} value={reviewHits} tone={reviewHits ? "info" : "good"} sub="重さが「確かめる」の規則の該当" />
      </Grid>

      <Section
        title="次に見直す候補"
        count={nextCandidates.length}
        note={`検索の表示回数 (GSC ${summary.gscWeek ?? "未取得"} の 28 日) が多い順。30 日以内の承認待ちと公開待ちのテーマは下に分けた。公開の目安より前に出すと、進行中の実験の観測に混ざる。`}
      >
        <DataTable columns={["テーマ", "表示 (28日)", "直す候補", "確かめる候補", "最新の提案", "公開の目安"]}>
          {[...nextCandidates, ...inFlight].map((c) => (
            <Row key={c.key}>
              <Cell nowrap>
                <div className={c.inFlight ? "text-muted-foreground" : "font-medium"}>{c.title}</div>
                <code className="font-mono text-xs text-muted-foreground">{c.key}</code>
              </Cell>
              <Cell nowrap>{c.impressions === null ? <span className="text-muted-foreground">—</span> : c.impressions.toLocaleString("ja-JP")}</Cell>
              <Cell nowrap>
                <StatusBadge tone={c.fixHits ? "warn" : "good"}>{c.fixHits}</StatusBadge>
              </Cell>
              <Cell nowrap>
                <StatusBadge tone={c.reviewHits ? "info" : "good"}>{c.reviewHits}</StatusBadge>
              </Cell>
              <Cell nowrap>
                {c.latestReview ? (
                  <span className="text-xs">
                    {c.latestReview.date} <span className="text-muted-foreground">{c.latestReview.status}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Cell>
              <Cell nowrap>
                {c.pendingUntil ? <span className="text-xs">{c.pendingUntil} 以降</span> : <span className="text-muted-foreground">—</span>}
              </Cell>
            </Row>
          ))}
        </DataTable>
      </Section>

      <Section
        title="該当件数の推移"
        count={summary.trend.weeks.length}
        note="週次のテーマ監査 (theme:portfolio:audit) が記録した件数 (直近 8 週)。"
      >
        {summary.trend.weeks.length === 0 ? (
          <p className="text-sm text-muted-foreground">まだ記録がありません。</p>
        ) : (
          <>
            {trendRows.length >= 3 ? (
              <TrendChart
                title="重さ別の該当件数"
                icon={<TrendingDownIcon />}
                description="週次・規則の該当を重さごとに合計"
                data={trendRows}
                xKey="week"
                series={[
                  { key: "fix", label: "直す" },
                  { key: "review", label: "確かめる" },
                ]}
                kind="line"
              />
            ) : null}
          <DataTable columns={["視点", ...summary.trend.weeks]}>
            {Object.entries(summary.trend.byRule).map(([rule, counts]) => (
              <Row key={rule}>
                <Cell nowrap>{ruleTitle.get(rule) ?? rule}</Cell>
                {counts.map((n, i) => (
                  <Cell key={summary.trend.weeks[i]} nowrap>
                    {n ?? <span className="text-muted-foreground">—</span>}
                  </Cell>
                ))}
              </Row>
            ))}
          </DataTable>
          </>
        )}
      </Section>

      <Section title="判断規則" count={summary.rules.length}>
        <DataTable columns={["視点", "内容", "確かめ方", "該当", "多いテーマ"]}>
          {summary.rules.map((rule) => (
            <Row key={rule.id}>
              <Cell>
                <div className="font-medium">{rule.title}</div>
                <code className="font-mono text-xs text-muted-foreground">{rule.id}</code>
              </Cell>
              <Cell>
                <span className="text-xs text-muted-foreground">{rule.statement}</span>
              </Cell>
              <Cell nowrap>
                <StatusBadge tone={rule.checkKind === "machine" ? "info" : "neutral"}>
                  {rule.checkKind === "machine" ? "機械で数える" : "提案で確かめる"}
                </StatusBadge>
                <div className="mt-1 text-xs text-muted-foreground">重さ: {SEVERITY_LABEL[rule.severity]}</div>
              </Cell>
              <Cell nowrap>
                {rule.hitCount === null ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <Link className={LINK} href={ruleHref(rule.id)}>
                    <StatusBadge tone={rule.hitCount === 0 ? "good" : rule.severity === "fix" ? "warn" : "info"}>
                      {rule.hitCount}
                    </StatusBadge>
                  </Link>
                )}
              </Cell>
              <Cell>
                {rule.themes.slice(0, MAX_THEME_LINKS).map((t) => (
                  <div key={t.key} className="text-xs">
                    <Link className={LINK} href={ruleHref(rule.id, t.key)}>
                      {t.title}
                    </Link>{" "}
                    <span className="text-muted-foreground">{t.count}</span>
                  </div>
                ))}
                {rule.themes.length > MAX_THEME_LINKS ? (
                  <div className="text-xs text-muted-foreground">ほか {rule.themes.length - MAX_THEME_LINKS} テーマ</div>
                ) : null}
              </Cell>
            </Row>
          ))}
        </DataTable>
      </Section>

      <Section title="採用基準 (adoptionCriteria)" count={summary.criteria.length}>
        <DataTable columns={["基準", "問い", "挙げた指標"]}>
          {summary.criteria.map((c) => (
            <Row key={c.id}>
              <Cell nowrap>
                <div className="font-medium">{c.label}</div>
                <code className="font-mono text-xs text-muted-foreground">{c.id}</code>
              </Cell>
              <Cell>
                <span className="text-xs">{c.question}</span>
              </Cell>
              <Cell nowrap>
                {c.usage} / {summary.primaryAndSecondaryCount}
              </Cell>
            </Row>
          ))}
        </DataTable>
      </Section>

      {selectedRule ? (
        <Section
          id="hits"
          title={`該当箇所: ${selectedRule.title}${selectedTheme ? ` (${selectedTheme})` : ""}`}
          count={selectedHits.length}
        >
          {selectedTheme ? (
            <p className="text-xs text-muted-foreground">
              <Link className={LINK} href={ruleHref(selectedRule.id)}>
                全テーマを表示
              </Link>
            </p>
          ) : null}
          {selectedHits.length === 0 ? (
            <p className="text-sm text-positive">該当はありません。</p>
          ) : (
            <DataGrid
              columns={[
                { id: "theme", header: "テーマ", sortable: true, nowrap: true },
                { id: "target", header: "対象", sortable: true, nowrap: true },
                { id: "detail", header: "内容" },
              ]}
              rows={selectedHits.map((h, i) => ({
                id: `${h.themeKey}-${h.target}-${i}`,
                cells: [
                  <div key="t">
                    <Link className={LINK} href={ruleHref(selectedRule.id, h.themeKey)}>
                      {h.themeTitle}
                    </Link>
                    <div className="text-xs text-muted-foreground">{h.themeKey}</div>
                  </div>,
                  <code key="c" className="font-mono text-xs">
                    {h.target}
                  </code>,
                  <span key="d" className="text-xs text-muted-foreground">
                    {h.detail}
                  </span>,
                ],
                sort: [h.themeTitle, h.target, null],
                search: `${h.themeTitle} ${h.themeKey} ${h.target} ${h.detail}`,
              }))}
              searchPlaceholder="テーマ・対象・内容で絞り込み"
            />
          )}
        </Section>
      ) : null}
    </>
  );
}
