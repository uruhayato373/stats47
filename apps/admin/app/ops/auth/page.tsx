import { ClockIcon, KeyRoundIcon, LaptopIcon, ShieldAlertIcon, TimerIcon } from "lucide-react";

import { Cell, DataTable, PanelCard, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Grid, Section, Stack } from "@/components/layout-primitives";
import { ErrorNote, Freshness, PageHeading } from "@/components/ops/primitives";
import { authCredentialRows, type AuthCredentialRow } from "@/lib/server/auth-credentials";
import { sessionPreflight, type SessionPreflightView, type SessionState } from "@/lib/server/session-preflight";
import { hasError, type Wrapped } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "ログインと資格情報 — stats47 admin" };

/**
 * /ops/auth — ログインが必要な全サービスについて、人が見るべきことだけを出す
 * (ログイン ID・この PC の登録・自動ログインの有無・要対応)。ログインは Mac だけが持ち、CI の Secrets には置かない。
 * 正本は .claude/config/auth-credentials.json。登録状況はページを開くたびに読む (パスワードは読まない)。
 * 保存済みセッションの事前確認 (切れる前に知らせる) は launchd の session-preflight.sh が毎日書く
 * .local/session-preflight/latest.json を読むだけで、ここではプロファイルを開かない。
 */
const SESSION_TONE: Record<SessionState, "good" | "warn" | "bad" | "neutral"> = {
  valid: "good",
  expiring: "warn",
  expired: "bad",
  autologin_failed: "bad",
  unknown: "neutral",
};

function SessionSection({ view }: { view: Wrapped<SessionPreflightView> }) {
  if (hasError(view)) return <ErrorNote error={view.error} />;
  if (!view.ran) {
    return (
      <Section title="保存済みセッション">
        <p className="text-sm">
          <StatusBadge>未実行</StatusBadge> <span className="text-muted-foreground">{view.file} がまだ無い。</span>
        </p>
        <p className="text-xs text-muted-foreground">
          launchd の scripts/scheduled/session-preflight.sh が毎日書く。手で回すときは
          <code className="font-mono"> node .claude/scripts/measurement/session-preflight.mjs --write</code>
        </p>
      </Section>
    );
  }
  return (
    <Section title="保存済みセッション">
      <DataTable columns={["サービス", "状態", "期限 (日本時間)", "最後に成功した取得", "復旧"]}>
        {view.rows.map((r) => (
          <Row key={r.source}>
            <Cell nowrap>{r.label}</Cell>
            <Cell>
              <Stack gap="sm">
                <span>
                  <StatusBadge tone={SESSION_TONE[r.state]} title={r.reason}>{r.stateLabel}</StatusBadge>
                </span>
                <span className="text-xs text-muted-foreground">
                  {r.reason}
                  {r.failedJst ? ` (失敗印 ${r.failedJst})` : ""}
                </span>
              </Stack>
            </Cell>
            <Cell nowrap muted={!r.needsAction}>{r.expiresJst ?? "—"}</Cell>
            <Cell nowrap muted>{r.lastSuccessJst ?? "記録なし"}</Cell>
            <Cell>
              {r.recovery ? (
                <code className={r.needsAction ? "font-mono text-xs" : "font-mono text-xs text-muted-foreground"}>{r.recovery}</code>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </Cell>
          </Row>
        ))}
      </DataTable>
      <p className="text-xs text-muted-foreground">
        cookie の名前と期限だけを読む (値は読まない)。期限は上限で、提供元がサーバー側で先に切ることがある。期限まで {view.warnDays} 日以内を「期限が近い」とする。
        確認した時刻: <Freshness iso={view.generatedAt} /> 。入り直しはオーナーが「復旧」のコマンドを打つ。
      </p>
    </Section>
  );
}

function action(r: AuthCredentialRow): string | null {
  if (r.stored === false) return "未登録";
  // 正本の ID とこの PC のストアの ID が違うと、ログインは別アカウントか失敗になる (2026-09-30 の全角スペース事故)
  if (r.stored && r.loginId && r.user !== r.loginId) return "ID 不一致";
  return null;
}

function localCell(r: AuthCredentialRow) {
  if (r.stored === null) return <span className="text-muted-foreground">?</span>;
  return r.stored ? <StatusBadge tone="good">済</StatusBadge> : <StatusBadge tone="warn">未</StatusBadge>;
}

export default function AuthCredentialsPage() {
  const v = authCredentialRows();
  if (hasError(v)) {
    return (
      <>
        <PageHeading title="ログインと資格情報" source=".claude/config/auth-credentials.json" />
        <ErrorNote error={v.error} />
      </>
    );
  }
  const todo = v.rows.filter((r) => action(r));
  const unregistered = v.rows.filter((r) => r.stored === false);
  const toRegister = v.rows.filter((r) => action(r) === "未登録" || action(r) === "ID 不一致");
  const sessions = sessionPreflight();
  const sessionAlerts = !hasError(sessions) && sessions.ran ? sessions.rows.filter((r) => r.needsAction).length : null;

  return (
    <>
      <PageHeading title="ログインと資格情報" source=".claude/config/auth-credentials.json" />
      <Grid min="sm">
        <StatCard label="この PC の登録" icon={<LaptopIcon />} value={`${v.rows.length - unregistered.length}/${v.rows.length}`} />
        <StatCard label="要対応" icon={<ShieldAlertIcon />} value={todo.length} tone={todo.length > 0 ? "warn" : "good"} />
        <StatCard label="確認した時刻" icon={<ClockIcon />} value={v.generatedAt ? <Freshness iso={v.generatedAt} /> : "未確認"} />
        <StatCard
          label="セッションの要対応"
          icon={<TimerIcon />}
          value={sessionAlerts ?? "未実行"}
          tone={sessionAlerts === null ? "neutral" : sessionAlerts > 0 ? "warn" : "good"}
        />
      </Grid>

      <SessionSection view={sessions} />

        <Section title="サービス">
          <DataTable columns={["サービス", "ログイン ID", "この PC", "自動ログイン", "要対応"]}>
            {v.rows.map((r) => {
              const a = action(r);
              return (
                <Row key={r.id}>
                  <Cell nowrap>{r.label}</Cell>
                  <Cell nowrap muted>{r.loginId ?? r.user ?? "—"}</Cell>
                  <Cell nowrap>{localCell(r)}</Cell>
                  <Cell nowrap>
                    <span title={r.policyNote}>{r.autoLogin ? "する" : "しない"}</span>
                  </Cell>
                  <Cell nowrap>{a ? <StatusBadge tone="bad">{a}</StatusBadge> : <span className="text-muted-foreground">—</span>}</Cell>
                </Row>
              );
            })}
          </DataTable>
          <p className="text-xs text-muted-foreground">
            ログインは Mac だけが持ち、CI の Secrets には置かない。方針は「自動ログイン」欄にマウスを置くと出る。
            登録状況はページを開くたびに調べる。パスワードは表示も読み出しもしない。
          </p>
        </Section>

        {toRegister.length > 0 && (
          <PanelCard
            title="未登録・ID 不一致のサービスを登録する"
            icon={<KeyRoundIcon />}
            description="ターミナルで実行し、聞かれたらパスワードを入力する。登録後にこのページを再読み込みする"
          >
            <Stack gap="sm">
              {toRegister.map((r) => (
                <code key={r.id} className="font-mono text-xs">{r.registerCommand}</code>
              ))}
            </Stack>
          </PanelCard>
        )}
    </>
  );
}
