import Link from "next/link";
import { CircleAlertIcon, HeartPulseIcon, LayersIcon, TriangleAlertIcon } from "lucide-react";

import { Cell, DataGrid, DataTable, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { PageHeading } from "@/components/ops/primitives";
import { catalogAuditSummary } from "@/lib/server/catalog-audit";

import { datasetDir } from "../../../../../config/datasets.mjs";

export const dynamic = "force-dynamic";
export const metadata = { title: "テーマカタログ監査 — stats47 admin" };

const LINK = "font-medium underline-offset-4 hover:underline";

const HARM_LABELS: Record<string, string> = {
  health: "Health（健康・美容）",
  ambition: "Ambition（夢・目標・成長）",
  relation: "Relation（人間関係）",
  money: "Money（お金）",
};

/** テーマカタログ監査 (型 B: 一覧・キュー)。件数 → 内訳 → テーマ別の一覧 (DataGrid) */
export default async function CatalogAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const summary = catalogAuditSummary();
  const showAll = params.showAll === "1";

  const flaggedThemes = summary.themes.filter((t) => t.errorCount + t.warnCount > 0);
  const visibleThemes = showAll ? summary.themes : flaggedThemes;

  return (
    <>
      <PageHeading title="テーマカタログ監査" source={`${datasetDir("themes.catalogs")}/ (JSON SSOT)`}>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          ThemeCatalog の指標選定根拠 (readerQuestion / adoptionCriteria / harmRelevance 等) の 充足状況と、
          <code className="rounded bg-muted px-1 font-mono text-xs">npm run validate:catalog</code> と同じ判定ロジックの error/warn
          を毎回 SSOT から再計算して表示する読み取り専用画面。 正典は{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">.claude/rules/theme-catalog-standards.md</code>。
        </p>
      </PageHeading>

      <Grid min="sm">
        <StatCard label="対象テーマ" icon={<LayersIcon />} value={summary.themeCount} />
        <StatCard label="error" icon={<CircleAlertIcon />} value={summary.totalErrorCount} tone={summary.totalErrorCount ? "bad" : "good"} />
        <StatCard label="warning" icon={<TriangleAlertIcon />} value={summary.totalWarnCount} tone={summary.totalWarnCount ? "warn" : "good"} />
        <StatCard label="HARM該当テーマ" icon={<HeartPulseIcon />} value={summary.harmThemes.length} />
      </Grid>

      <Section title="違反の内訳 (error)" count={summary.errorTally.length}>
        {summary.errorTally.length === 0 ? (
          <p className="text-sm text-positive">error はありません。</p>
        ) : (
          <DataTable columns={["種別", "件数"]}>
            {summary.errorTally.map((row) => (
              <Row key={row.tag}>
                <Cell>
                  <code className="font-mono text-xs">{row.tag}</code>
                </Cell>
                <Cell nowrap>{row.count}</Cell>
              </Row>
            ))}
          </DataTable>
        )}
      </Section>

      <Section title="違反の内訳 (warning)" count={summary.warnTally.length}>
        <DataTable columns={["種別", "件数"]}>
          {summary.warnTally.map((row) => (
            <Row key={row.tag}>
              <Cell>
                <code className="font-mono text-xs">{row.tag}</code>
              </Cell>
              <Cell nowrap>{row.count}</Cell>
            </Row>
          ))}
        </DataTable>
      </Section>

      <Section title="HARM 該当テーマ (企画側の参照材料。UI の広告枠設定ではない)" count={summary.harmThemes.length}>
        {summary.harmThemes.length === 0 ? (
          <p className="text-sm text-muted-foreground">HARM 該当が記録されたテーマはまだありません (任意項目・全テーマへの強制なし)。</p>
        ) : (
          <DataTable columns={["テーマ", "軸", "理由"]}>
            {summary.harmThemes.map((row, i) => (
              <Row key={`${row.key}-${row.axis}-${i}`}>
                <Cell>
                  <Link className={LINK} href={`/themes/${row.key}`}>
                    {row.title}
                  </Link>
                </Cell>
                <Cell nowrap>
                  <StatusBadge tone="info">{HARM_LABELS[row.axis] ?? row.axis}</StatusBadge>
                </Cell>
                <Cell>
                  <span className="text-xs text-muted-foreground">{row.reason}</span>
                </Cell>
              </Row>
            ))}
          </DataTable>
        )}
      </Section>

      <Section title="テーマ別の完全性" count={visibleThemes.length}>
        {!showAll && flaggedThemes.length < summary.themes.length ? (
          <p className="text-xs text-muted-foreground">
            error/warning があるテーマ {visibleThemes.length} 件だけ表示 (全 {summary.themes.length} 件中)。{" "}
            <Link className={LINK} href="/quality/catalog-audit?showAll=1">
              全件表示
            </Link>
          </p>
        ) : null}
        <DataGrid
          columns={[
            { id: "theme", header: "テーマ", sortable: true },
            { id: "metrics", header: "指標数", numeric: true, sortable: true },
            { id: "primary", header: "主要指標", numeric: true, sortable: true },
            { id: "selection", header: "selection記入", numeric: true, sortable: true, nowrap: true },
            { id: "adoption", header: "adoptionCriteria記入", numeric: true, sortable: true, nowrap: true },
            { id: "reader", header: "readerQuestion記入", numeric: true, sortable: true, nowrap: true },
            { id: "error", header: "error", numeric: true, sortable: true },
            { id: "warning", header: "warning", numeric: true, sortable: true },
          ]}
          rows={visibleThemes.map((t) => ({
            id: t.key,
            cells: [
              <div key="t">
                <Link className={LINK} href={`/themes/${t.key}`}>
                  {t.title}
                </Link>
                <div className="text-xs text-muted-foreground">{t.key}</div>
              </div>,
              t.metricCount,
              t.primaryAndSecondaryCount,
              `${t.selectionCount}/${t.primaryAndSecondaryCount}`,
              `${t.adoptionCriteriaCount}/${t.primaryAndSecondaryCount}`,
              `${t.readerQuestionCount}/${t.primaryAndSecondaryCount}`,
              <StatusBadge key="e" tone={t.errorCount ? "bad" : "good"}>
                {t.errorCount}
              </StatusBadge>,
              <StatusBadge key="w" tone={t.warnCount ? "warn" : "good"}>
                {t.warnCount}
              </StatusBadge>,
            ],
            sort: [
              t.title,
              t.metricCount,
              t.primaryAndSecondaryCount,
              t.selectionCount,
              t.adoptionCriteriaCount,
              t.readerQuestionCount,
              t.errorCount,
              t.warnCount,
            ],
            search: `${t.title} ${t.key}`,
            tone: t.errorCount ? ("bad" as const) : t.warnCount ? ("warn" as const) : undefined,
          }))}
          searchPlaceholder="テーマ名・key で絞り込み"
        />
      </Section>
    </>
  );
}
