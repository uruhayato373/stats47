import type { JapanZueResearchData } from "@/lib/server/japan-zue";

import { Badge, ErrorNote, Section, Stat, Table, Td, Tr } from "@/components/ops/primitives";

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
    <section className="space-y-4 rounded-lg border border-console-border bg-console-card/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-console-fg">日本国勢図会 evidence inventory</h2>
          <p className="mt-1 text-xs text-console-muted">
            書籍は論点発見に限定。数値・定義・公開表現は一次資料とstats47 SSOTへ接続します。
          </p>
          <p className="mt-1 text-[11px] text-console-muted">
            真実源: <code>{data.source}</code> / candidate hash {summary.candidatesSha256.slice(0, 12)}…
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone={summary.pilotReadyCount === 10 ? "good" : "bad"}>pilot {summary.pilotReadyCount}/10</Badge>
          <Badge tone="info">読み取り専用</Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="候補総数" value={summary.counts.total.toLocaleString("ja-JP")} sub={`表 ${summary.counts.table} / 図 ${summary.counts.figure} / 本文統計 ${summary.counts["text-stat"]}`} />
        <Stat label="判定済み" value={percent(summary.resolutionCoverage)} tone="good" sub="未判定を残さない" />
        <Stat label="人手確認 pilot" value={`${summary.manualOverrideCount}件`} tone={summary.manualOverrideCount === 10 ? "good" : "bad"} sub="一次資料・単位・地域粒度を確認" />
        <Stat label="公開候補" value={`${summary.publicCandidateCount}件`} tone="info" sub={`本番ready ${summary.productionReadyCount}件 / 外部公開は別承認`} />
        <Stat label="fail-closed 保留" value={(summary.blockers.primarySourceUnavailable + summary.blockers.rightsHold).toLocaleString("ja-JP")} tone="warn" sub="所管判明だけでは採用しない" />
      </div>

      <Section title="一次資料照合済み pilot" count={pilot.length}>
        <Table columns={["問い", "指標", "導線候補", "状態", "次"]}>
          {pilot.map((item) => (
            <Tr key={item.evidenceId}>
              <Td>
                <div className="max-w-md font-medium">{item.question}</div>
                <div className="mt-1 font-mono text-[10px] text-console-muted">{item.evidenceId}</div>
              </Td>
              <Td><div className="max-w-xs text-xs">{item.metricKeys.join(" / ")}</div></Td>
              <Td><div className="flex max-w-xs flex-wrap gap-1">{item.placements.map((placement) => <Badge key={placement}>{placement}</Badge>)}</div></Td>
              <Td nowrap><Badge tone={item.status === "existing-live" ? "good" : "warn"}>{item.status === "existing-live" ? "既存公開" : "公開承認待ち"}</Badge></Td>
              <Td><div className="max-w-md text-xs text-console-muted">{item.nextAction}</div></Td>
            </Tr>
          ))}
        </Table>
      </Section>

      <Section title="マスターコンテンツ展開">
        <div className="grid gap-3 lg:grid-cols-3">
          <Stat label="テーマ" value={masterContent.title} sub={masterContent.question} />
          <Stat label="ブログ・note" value="原稿ready / review待ち" sub={`${masterContent.article.sections.length}セクションの一次資料由来・独自原稿`} tone="info" />
          <Stat
            label="YouTube master候補"
            value={`${masterContent.youtube.targetDurationMinutes}分 / 枠待ち`}
            sub={`EXP-006 残り${masterContent.youtube.experimentCapacity.availableSlots}枠 / 未登録 / 派生 ${masterContent.derivatives.length}本`}
            tone="warn"
          />
        </div>
        <p className="mt-3 text-xs text-console-muted">
          公開導線: <code>{masterContent.lineage.landingRoute}</code>（{masterContent.lineage.landingStatus}）。
          EXP-006の既存3本を置換する場合だけ、実験SSOTと投稿台帳を更新します。
        </p>
      </Section>
    </section>
  );
}
