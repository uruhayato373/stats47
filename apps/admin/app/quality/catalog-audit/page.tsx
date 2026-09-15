import Link from "next/link";

import { Badge, PageHeading, Section, Stat, Table, Td, Tr } from "@/components/ops/primitives";
import { catalogAuditSummary } from "@/lib/server/catalog-audit";

export const dynamic = "force-dynamic";
export const metadata = { title: "テーマカタログ監査 — stats47 admin" };

const HARM_LABELS: Record<string, string> = {
  health: "Health（健康・美容）",
  ambition: "Ambition（夢・目標・成長）",
  relation: "Relation（人間関係）",
  money: "Money（お金）",
};

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
    <div className="space-y-8">
      <PageHeading
        title="テーマカタログ監査"
        source="packages/data-configs/src/theme-catalog/ (git TS SSOT)"
      >
        <p className="mt-2 max-w-3xl text-sm text-console-muted">
          ThemeCatalog の指標選定根拠 (readerQuestion / adoptionCriteria / harmRelevance 等) の
          充足状況と、<code className="rounded bg-console-card px-1">npm run validate:catalog</code>{" "}
          と同じ判定ロジックの error/warn を毎回 SSOT から再計算して表示する読み取り専用画面。
          正典は{" "}
          <code className="rounded bg-console-card px-1">.claude/rules/theme-catalog-standards.md</code>。
        </p>
      </PageHeading>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="対象テーマ" value={summary.themeCount} />
        <Stat label="error" value={summary.totalErrorCount} tone={summary.totalErrorCount ? "bad" : "good"} />
        <Stat label="warning" value={summary.totalWarnCount} tone={summary.totalWarnCount ? "warn" : "good"} />
        <Stat label="HARM該当テーマ" value={summary.harmThemes.length} />
      </div>

      <Section title="違反の内訳 (error)" count={summary.errorTally.length}>
        {summary.errorTally.length === 0 ? (
          <p className="text-sm text-console-good">error はありません。</p>
        ) : (
          <Table columns={["種別", "件数"]}>
            {summary.errorTally.map((row) => (
              <Tr key={row.tag}>
                <Td>
                  <code className="text-[11px]">{row.tag}</code>
                </Td>
                <Td nowrap>{row.count}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Section>

      <Section title="違反の内訳 (warning)" count={summary.warnTally.length}>
        <Table columns={["種別", "件数"]}>
          {summary.warnTally.map((row) => (
            <Tr key={row.tag}>
              <Td>
                <code className="text-[11px]">{row.tag}</code>
              </Td>
              <Td nowrap>{row.count}</Td>
            </Tr>
          ))}
        </Table>
      </Section>

      <Section title="HARM 該当テーマ (企画側の参照材料。UI の広告枠設定ではない)" count={summary.harmThemes.length}>
        {summary.harmThemes.length === 0 ? (
          <p className="text-sm text-console-muted">
            HARM 該当が記録されたテーマはまだありません (任意項目・全テーマへの強制なし)。
          </p>
        ) : (
          <Table columns={["テーマ", "軸", "理由"]}>
            {summary.harmThemes.map((row, i) => (
              <Tr key={`${row.key}-${row.axis}-${i}`}>
                <Td>
                  <Link
                    className="text-console-info underline underline-offset-2"
                    href={`/themes/${row.key}`}
                  >
                    {row.title}
                  </Link>
                </Td>
                <Td nowrap>
                  <Badge tone="info">{HARM_LABELS[row.axis] ?? row.axis}</Badge>
                </Td>
                <Td>
                  <span className="text-[12px] text-console-muted">{row.reason}</span>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Section>

      <Section
        title="テーマ別の完全性"
        count={visibleThemes.length}
      >
        {!showAll && flaggedThemes.length < summary.themes.length ? (
          <p className="mb-2 text-[11px] text-console-muted">
            error/warning があるテーマ {visibleThemes.length} 件だけ表示 (全 {summary.themes.length} 件中)。
            {" "}
            <Link className="text-console-info underline underline-offset-2" href="/quality/catalog-audit?showAll=1">
              全件表示
            </Link>
          </p>
        ) : null}
        <div className="max-h-[32rem] overflow-auto">
          <Table
            columns={[
              "テーマ",
              "指標数",
              "主要指標",
              "selection記入",
              "adoptionCriteria記入",
              "readerQuestion記入",
              "error",
              "warning",
            ]}
          >
            {visibleThemes.map((t) => (
              <Tr key={t.key}>
                <Td>
                  <Link
                    className="text-console-info underline underline-offset-2"
                    href={`/themes/${t.key}`}
                  >
                    {t.title}
                  </Link>
                  <div className="text-[10px] text-console-muted">{t.key}</div>
                </Td>
                <Td nowrap>{t.metricCount}</Td>
                <Td nowrap>{t.primaryAndSecondaryCount}</Td>
                <Td nowrap>
                  {t.selectionCount}/{t.primaryAndSecondaryCount}
                </Td>
                <Td nowrap>
                  {t.adoptionCriteriaCount}/{t.primaryAndSecondaryCount}
                </Td>
                <Td nowrap>
                  {t.readerQuestionCount}/{t.primaryAndSecondaryCount}
                </Td>
                <Td nowrap>
                  <Badge tone={t.errorCount ? "bad" : "good"}>{t.errorCount}</Badge>
                </Td>
                <Td nowrap>
                  <Badge tone={t.warnCount ? "warn" : "good"}>{t.warnCount}</Badge>
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      </Section>
    </div>
  );
}
