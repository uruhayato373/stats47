import { BookOpenCheckIcon, ClipboardCheckIcon, FileStackIcon, LockIcon, RocketIcon, ShieldAlertIcon, VideoIcon, NewspaperIcon, LayoutTemplateIcon } from "lucide-react";

import type { JapanZueResearchData } from "@/lib/server/japan-zue";

import { Cell, DataTable, PanelCard, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote } from "@/components/ops/primitives";

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function JapanZueInventoryPanel({ data }: { data: JapanZueResearchData }) {
  if ("error" in data) {
    return (
      <Section title="日本国勢図会 evidence inventory">
        <ErrorNote error={`${data.source}: ${data.error}`} />
      </Section>
    );
  }

  const { summary, pilot, masterContent } = data;
  return (
    <>
      <Section
        title={
          <span className="flex flex-wrap items-center gap-2">
            日本国勢図会 evidence inventory
            <StatusBadge tone={summary.pilotReadyCount === 10 ? "good" : "bad"}>pilot {summary.pilotReadyCount}/10</StatusBadge>
            <StatusBadge tone="info">読み取り専用</StatusBadge>
          </span>
        }
        note={
          <>
            書籍は論点発見に限定。数値・定義・公開表現は一次資料とstats47 SSOTへ接続します。真実源:{" "}
            <code className="font-mono text-xs">{data.source}</code> / candidate hash {summary.candidatesSha256.slice(0, 12)}…
          </>
        }
      >
        <Grid min="sm">
          <StatCard
            label="候補総数"
            icon={<FileStackIcon />}
            value={summary.counts.total.toLocaleString("ja-JP")}
            sub={`表 ${summary.counts.table} / 図 ${summary.counts.figure} / 本文統計 ${summary.counts["text-stat"]}`}
          />
          <StatCard label="判定済み" icon={<ClipboardCheckIcon />} value={percent(summary.resolutionCoverage)} tone="good" sub="未判定を残さない" />
          <StatCard
            label="人手確認 pilot"
            icon={<BookOpenCheckIcon />}
            value={`${summary.manualOverrideCount}件`}
            tone={summary.manualOverrideCount === 10 ? "good" : "bad"}
            sub="一次資料・単位・地域粒度を確認"
          />
          <StatCard
            label="公開候補"
            icon={<RocketIcon />}
            value={`${summary.publicCandidateCount}件`}
            tone="info"
            sub={`本番ready ${summary.productionReadyCount}件 / 外部公開は別承認`}
          />
          <StatCard
            label="fail-closed 保留"
            icon={<LockIcon />}
            value={(summary.blockers.primarySourceUnavailable + summary.blockers.rightsHold).toLocaleString("ja-JP")}
            tone="warn"
            sub="所管判明だけでは採用しない"
          />
        </Grid>
      </Section>

      <PanelCard title="一次資料照合済み pilot" icon={<ShieldAlertIcon />} description={`${pilot.length} 件`}>
        <DataTable columns={["問い", "指標", "導線候補", "状態", "次"]}>
          {pilot.map((item) => (
            <Row key={item.evidenceId}>
              <Cell>
                <div className="max-w-md font-medium">{item.question}</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">{item.evidenceId}</div>
              </Cell>
              <Cell>
                <div className="max-w-xs text-xs">{item.metricKeys.join(" / ")}</div>
              </Cell>
              <Cell>
                <div className="flex max-w-xs flex-wrap gap-1">
                  {item.placements.map((placement) => (
                    <StatusBadge key={placement}>{placement}</StatusBadge>
                  ))}
                </div>
              </Cell>
              <Cell nowrap>
                <StatusBadge tone={item.status === "existing-live" ? "good" : "warn"}>{item.status === "existing-live" ? "既存公開" : "公開承認待ち"}</StatusBadge>
              </Cell>
              <Cell>
                <div className="max-w-md text-xs text-muted-foreground">{item.nextAction}</div>
              </Cell>
            </Row>
          ))}
        </DataTable>
      </PanelCard>

      <Section
        title="マスターコンテンツ展開"
        note={
          <>
            公開導線: <code className="font-mono text-xs">{masterContent.lineage.landingRoute}</code>（{masterContent.lineage.landingStatus}）。
            EXP-006の既存3本を置換する場合だけ、実験SSOTと投稿台帳を更新します。
          </>
        }
      >
        <Grid min="md">
          <StatCard label="テーマ" icon={<LayoutTemplateIcon />} value={masterContent.title} sub={masterContent.question} />
          <StatCard
            label="ブログ・note"
            icon={<NewspaperIcon />}
            value="原稿ready / review待ち"
            sub={`${masterContent.article.sections.length}セクションの一次資料由来・独自原稿`}
            tone="info"
          />
          <StatCard
            label="YouTube master候補"
            icon={<VideoIcon />}
            value={`${masterContent.youtube.targetDurationMinutes}分 / 枠待ち`}
            sub={`EXP-006 残り${masterContent.youtube.experimentCapacity.availableSlots}枠 / 未登録 / 派生 ${masterContent.derivatives.length}本`}
            tone="warn"
          />
        </Grid>
      </Section>
    </>
  );
}
