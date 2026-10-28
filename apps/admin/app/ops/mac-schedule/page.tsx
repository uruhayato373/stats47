import { CalendarClockIcon, ClipboardCheckIcon, GitCompareIcon, PackageXIcon } from "lucide-react";
import Link from "next/link";

import { Cell, DataTable, Row, StatCard, StatusBadge, type Tone } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { Alert, AlertDescription } from "@stats47/components";
import { macSchedule, slotLabel, SCHEDULE_DIR, type LogStatus, type MacJob } from "@/lib/server/mac-schedule";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mac の定期実行 — stats47 admin" };

/**
 * /ops/mac-schedule — Mac の launchd で動く定期実行 (土曜ランナーほか) の定義・この Mac への登録・最後の結果を目視する画面。
 * 読み取り専用。launchctl は呼ばず、リポジトリの plist・~/Library/LaunchAgents・~/Library/Logs/stats47 を読む。
 * GitHub Actions の定期実行は /ops/workflows。
 */

const jst = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

const RESULT: Record<LogStatus["result"], { label: string; tone: Tone }> = {
  ok: { label: "成功", tone: "good" },
  failed: { label: "失敗", tone: "bad" },
  running: { label: "実行中か途中で停止", tone: "warn" },
  none: { label: "記録なし", tone: "neutral" },
};

function resultCell(log: LogStatus) {
  const r = RESULT[log.result];
  return (
    <div className="flex flex-col gap-0.5">
      <span>
        <StatusBadge tone={r.tone}>
          {r.label}
          {log.rc !== null ? ` (rc=${log.rc})` : ""}
        </StatusBadge>
      </span>
      {log.startedAt ? (
        <span className="text-xs text-muted-foreground">
          {jst(log.startedAt)} 開始{log.finishedAt ? ` · ${jst(log.finishedAt)} 終了` : ""}
        </span>
      ) : null}
      {log.detail ? <span className="text-xs text-muted-foreground">落ちた段: {log.detail}</span> : null}
    </div>
  );
}

function schedule(job: MacJob) {
  const slots = job.def.slots.map(slotLabel);
  if (job.def.intervalSeconds) slots.push(`${Math.round(job.def.intervalSeconds / 60)} 分ごと`);
  if (job.def.runAtLoad) slots.push("ログイン時");
  return slots.join(" / ") || "—";
}

function installedCell(job: MacJob) {
  if (job.installed === "same") return <StatusBadge tone="good">登録済み (定義と一致)</StatusBadge>;
  if (job.installed === "missing") return <StatusBadge tone="neutral">未登録</StatusBadge>;
  return (
    <div className="flex flex-col gap-0.5">
      <span>
        <StatusBadge tone="bad">定義と違う</StatusBadge>
      </span>
      <span className="text-xs text-muted-foreground">この Mac: {(job.installedSlots ?? []).map(slotLabel).join(" / ") || "—"}</span>
    </div>
  );
}

export default function MacSchedulePage() {
  const v = macSchedule();
  if (hasError(v)) {
    return (
      <>
        <PageHeading title="Mac の定期実行" source={`${SCHEDULE_DIR}/*.plist`} />
        <ErrorNote error={v.error} />
      </>
    );
  }
  const runner = v.jobs.find((j) => j.def.label === "com.stats47.weekly-saturday");
  const others = v.jobs.filter((j) => j !== runner);
  const drift = v.jobs.filter((j) => j.installed === "different").length;
  const audits = v.saturday.audits;
  const auditFailed = audits?.results.filter((r) => r.status !== "pass").length ?? 0;

  return (
    <>
      <PageHeading title="Mac の定期実行" source={`${SCHEDULE_DIR}/*.plist + ~/Library/LaunchAgents + ~/Library/Logs/stats47`} />
        {!v.isLaunchdHost ? (
          <Alert>
            <AlertDescription>この端末には launchd の登録フォルダが無い。登録と結果は、定期実行を登録した Mac で開いたときだけ出る。</AlertDescription>
          </Alert>
        ) : null}
        <Grid min="sm">
          <StatCard
            label="土曜ランナー"
            icon={<CalendarClockIcon />}
            value={runner ? RESULT[runner.log.result].label : "定義なし"}
            tone={runner?.log.result === "ok" ? "good" : runner?.log.result === "failed" ? "bad" : "neutral"}
            sub={runner ? `最後の開始 ${jst(runner.log.startedAt)}` : undefined}
          />
          <StatCard
            label="週次監査"
            icon={<ClipboardCheckIcon />}
            value={audits ? `${audits.results.length - auditFailed} / ${audits.results.length} 通過` : "要約なし"}
            tone={!audits ? "neutral" : auditFailed ? "warn" : "good"}
            sub={audits ? `${audits.day} の回` : undefined}
          />
          <StatCard label="定義と違う登録" icon={<GitCompareIcon />} value={drift} tone={drift ? "bad" : "good"} sub={`定義 ${v.jobs.length} 本`} />
          <StatCard label="定義に無い登録" icon={<PackageXIcon />} value={v.strayInstalled.length} tone={v.strayInstalled.length ? "warn" : "good"} />
        </Grid>

        <Section title="土曜ランナー (毎週土曜 07:00)">
          <DataTable columns={["段", "中身", "最後の結果"]}>
            {v.saturday.steps.map((s, i) => (
              <Row key={s.id}>
                <Cell nowrap>
                  {i + 1}. <code className="font-mono text-xs">{s.id}</code>
                </Cell>
                <Cell>{s.label}</Cell>
                <Cell nowrap>{resultCell(s.log)}</Cell>
              </Row>
            ))}
          </DataTable>
          <p className="text-xs text-muted-foreground">
            1 段が落ちても次の段へ進む。ログは <code className="font-mono text-xs">~/Library/Logs/stats47/&lt;段&gt;.log</code>、全体は <code className="font-mono text-xs">weekly-saturday.log</code>。
            すぐ 1 回走らせるには <code className="font-mono text-xs">launchctl kickstart gui/$(id -u)/com.stats47.weekly-saturday</code>。
          </p>
        </Section>

        <Section title={audits ? `週次監査 (${audits.day})` : "週次監査"}>
          {audits ? (
            <DataTable columns={["監査", "結果", "所要 (分)"]}>
              {audits.results.map((r) => (
                <Row key={r.id}>
                  <Cell>
                    <div>{r.label}</div>
                    <div className="text-xs text-muted-foreground">
                      <code className="font-mono text-xs">{r.id}</code>
                    </div>
                  </Cell>
                  <Cell nowrap>
                    <StatusBadge tone={r.status === "pass" ? "good" : r.status === "timeout" ? "warn" : "bad"}>
                      {r.status === "pass" ? "通過" : r.status === "timeout" ? "時間切れ" : "異常あり"}
                    </StatusBadge>
                  </Cell>
                  <Cell nowrap muted>
                    {r.minutes}
                  </Cell>
                </Row>
              ))}
            </DataTable>
          ) : (
            <p className="text-sm text-muted-foreground">
              まだ要約が無い。土曜ランナーの後か、<code className="font-mono text-xs">npm run weekly:audits</code> を走らせた後に <code className="font-mono text-xs">.local/weekly-audits/&lt;日付&gt;/summary.json</code> ができる。
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            各監査のログは <code className="font-mono text-xs">.local/weekly-audits/&lt;日付&gt;/&lt;監査&gt;.log</code>。異常の中身は週次レビューで読み、バックログカードへ書く。
          </p>
        </Section>

        <Section title={`定期実行の定義 (${v.jobs.length})`}>
          <DataTable columns={["定期実行", "時刻", "この Mac への登録", "最後の結果"]}>
            {[...(runner ? [runner] : []), ...others].map((j) => (
              <Row key={j.file}>
                <Cell>
                  <div className="font-semibold">{j.def.label.replace(/^com\.stats47\./, "")}</div>
                  <div className="text-xs text-muted-foreground">
                    <code className="font-mono text-xs">{j.def.script?.replace(/^.*\/stats47\//, "") ?? j.file}</code>
                  </div>
                </Cell>
                <Cell>{schedule(j)}</Cell>
                <Cell nowrap>{installedCell(j)}</Cell>
                <Cell nowrap>{resultCell(j.log)}</Cell>
              </Row>
            ))}
          </DataTable>
          {v.scriptInstalled.length ? (
            <p className="text-xs text-muted-foreground">
              台本が自分で登録するもの (plist はリポジトリに置かない): {v.scriptInstalled.map((f) => <code key={f} className="mr-2 font-mono text-xs">{f}</code>)}
            </p>
          ) : null}
          {v.strayInstalled.length ? (
            <p className="text-xs text-muted-foreground">
              定義に無い登録: {v.strayInstalled.map((f) => <code key={f} className="mr-2 font-mono text-xs">{f}</code>)}
              (リポジトリから消した定義が Mac に残っている可能性がある。外すなら <code className="font-mono text-xs">launchctl bootout gui/$(id -u)/&lt;Label&gt;</code>)
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            時刻は Mac の現地時刻 (日本時間)。定義を変えたら <code className="font-mono text-xs">~/Library/LaunchAgents/</code> へ入れ直す (入れ直さないと旧時刻のまま動く)。
            GitHub Actions の定期実行は <Link href="/ops/workflows" className="font-medium underline-offset-4 hover:underline">
              CI ワークフロー
            </Link>。
          </p>
        </Section>
    </>
  );
}
