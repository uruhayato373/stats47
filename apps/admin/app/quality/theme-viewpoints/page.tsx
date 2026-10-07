import Link from "next/link";

import { Cell, DataTable, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Grid, Section, Stack } from "@/components/layout-primitives";
import { PageHeading } from "@/components/ops/primitives";
import { themeViewpointSummary } from "@/lib/server/theme-viewpoints";

import { THEME_SELECTION_VIEWPOINTS } from "../../../../../config/paths.mjs";

export const dynamic = "force-dynamic";
export const metadata = { title: "指標を選ぶ視点 — stats47 admin" };

const PAGE = "/quality/theme-viewpoints";
const MAX_THEME_LINKS = 4;

const SEVERITY_LABEL = { fix: "直す", review: "確かめる" } as const;

function ruleHref(rule: string, theme?: string): string {
  const params = new URLSearchParams({ rule });
  if (theme) params.set("theme", theme);
  return `${PAGE}?${params.toString()}#hits`;
}

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

  return (
    <Stack gap="lg">
      <PageHeading
        title="指標を選ぶ視点"
        source={`${THEME_SELECTION_VIEWPOINTS} + data/themes/catalogs/`}
      >
        <p className="mt-2 max-w-3xl text-sm text-console-muted">
          テーマページの指標を選ぶときの採用基準と判断規則。機械で数えられる規則は、全テーマのカタログを毎回読み直して
          該当箇所を並べる (gate ではない。是正と提案の材料)。人が確かめる規則は、提案文書の表で 1 件ずつ判断する。
          提案の形式は{" "}
          <code className="rounded bg-muted px-1">
            .claude/skills/theme/manage-theme-portfolio/reference/theme-proposal-format.md
          </code>
          。
        </p>
      </PageHeading>

      <Grid min="sm">
        <StatCard label="対象テーマ" value={summary.themeCount} />
        <StatCard label="主要指標 (primary・secondary)" value={summary.primaryAndSecondaryCount} />
        <StatCard label="直す候補" value={fixHits} tone={fixHits ? "warn" : "good"} sub="重さが「直す」の規則の該当" />
        <StatCard label="確かめる候補" value={reviewHits} tone={reviewHits ? "info" : "good"} sub="重さが「確かめる」の規則の該当" />
      </Grid>

      <Section title="判断規則" count={summary.rules.length}>
        <DataTable columns={["視点", "内容", "確かめ方", "該当", "多いテーマ"]}>
          {summary.rules.map((rule) => (
            <Row key={rule.id}>
              <Cell>
                <div className="font-medium">{rule.title}</div>
                <code className="text-[10px] text-console-muted">{rule.id}</code>
              </Cell>
              <Cell>
                <span className="text-[12px] text-console-muted">{rule.statement}</span>
              </Cell>
              <Cell nowrap>
                <StatusBadge tone={rule.checkKind === "machine" ? "info" : "neutral"}>
                  {rule.checkKind === "machine" ? "機械で数える" : "提案で確かめる"}
                </StatusBadge>
                <div className="mt-1 text-[10px] text-console-muted">重さ: {SEVERITY_LABEL[rule.severity]}</div>
              </Cell>
              <Cell nowrap>
                {rule.hitCount === null ? (
                  <span className="text-console-muted">—</span>
                ) : (
                  <Link className="text-console-info underline underline-offset-2" href={ruleHref(rule.id)}>
                    <StatusBadge tone={rule.hitCount === 0 ? "good" : rule.severity === "fix" ? "warn" : "info"}>
                      {rule.hitCount}
                    </StatusBadge>
                  </Link>
                )}
              </Cell>
              <Cell>
                {rule.themes.slice(0, MAX_THEME_LINKS).map((t) => (
                  <div key={t.key} className="text-[12px]">
                    <Link className="text-console-info underline underline-offset-2" href={ruleHref(rule.id, t.key)}>
                      {t.title}
                    </Link>{" "}
                    <span className="text-console-muted">{t.count}</span>
                  </div>
                ))}
                {rule.themes.length > MAX_THEME_LINKS ? (
                  <div className="text-[11px] text-console-muted">ほか {rule.themes.length - MAX_THEME_LINKS} テーマ</div>
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
                <code className="text-[10px] text-console-muted">{c.id}</code>
              </Cell>
              <Cell>
                <span className="text-[12px]">{c.question}</span>
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
            <p className="mb-2 text-[11px] text-console-muted">
              <Link className="text-console-info underline underline-offset-2" href={ruleHref(selectedRule.id)}>
                全テーマを表示
              </Link>
            </p>
          ) : null}
          {selectedHits.length === 0 ? (
            <p className="text-sm text-console-good">該当はありません。</p>
          ) : (
            <div className="max-h-[36rem] overflow-auto">
              <DataTable columns={["テーマ", "対象", "内容"]}>
                {selectedHits.map((h, i) => (
                  <Row key={`${h.themeKey}-${h.target}-${i}`}>
                    <Cell nowrap>
                      <Link
                        className="text-console-info underline underline-offset-2"
                        href={ruleHref(selectedRule.id, h.themeKey)}
                      >
                        {h.themeTitle}
                      </Link>
                      <div className="text-[10px] text-console-muted">{h.themeKey}</div>
                    </Cell>
                    <Cell nowrap>
                      <code className="text-[11px]">{h.target}</code>
                    </Cell>
                    <Cell>
                      <span className="text-[12px] text-console-muted">{h.detail}</span>
                    </Cell>
                  </Row>
                ))}
              </DataTable>
            </div>
          )}
        </Section>
      ) : null}
    </Stack>
  );
}
