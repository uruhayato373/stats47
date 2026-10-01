import { Cell, DataTable, PanelCard, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Section, Stack } from "@/components/layout-primitives";
import { ErrorNote, Freshness, PageHeading } from "@/components/ops/primitives";
import { authCredentialRows, type AuthCredentialRow } from "@/lib/server/auth-credentials";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "ログインと資格情報 — stats47 admin" };

/**
 * /ops/auth — ログインが必要な全サービスについて、人が見るべきことだけを出す
 * (ログイン ID・この PC の登録・CI の登録・自動ログインの有無・要対応)。doboku-note の /ops/auth と同じ構成。
 * 正本は .claude/config/auth-credentials.json。登録状況は credential-status.mjs が書いたファイル (パスワードは読まない)。
 */
function action(r: AuthCredentialRow): string | null {
  if (r.stored === false) return "未登録";
  if ((r.ciCredential || r.ciStored) && r.ciSecrets === false) return "CI 未登録";
  return null;
}

function localCell(r: AuthCredentialRow) {
  if (r.stored === null) return <span className="text-console-muted">?</span>;
  return r.stored ? <StatusBadge tone="good">済</StatusBadge> : <StatusBadge tone="warn">未</StatusBadge>;
}

function ciCell(r: AuthCredentialRow) {
  if (!r.ciCredential && !r.ciStored) return <span className="text-console-muted">—</span>;
  if (r.ciSecrets === null) return <span className="text-console-muted">?</span>;
  if (!r.ciSecrets) return <StatusBadge tone="warn">未</StatusBadge>;
  // CI が実際に使うのは ciCredential だけ。保管だけのものは「保管」(理由は自動ログイン欄のツールチップ)
  return r.ciCredential ? <StatusBadge tone="good">済</StatusBadge> : <StatusBadge tone="info">保管</StatusBadge>;
}

export default function AuthCredentialsPage() {
  const v = authCredentialRows();
  if (hasError(v)) {
    return (
      <div className="space-y-8">
        <PageHeading title="ログインと資格情報" source=".claude/config/auth-credentials.json" />
        <ErrorNote error={v.error} />
      </div>
    );
  }
  const todo = v.rows.filter((r) => action(r));
  const unregistered = v.rows.filter((r) => r.stored === false);
  const ciMissing = v.rows.filter((r) => (r.ciCredential || r.ciStored) && r.ciSecrets === false);

  return (
    <div className="space-y-8">
      <PageHeading title="ログインと資格情報" source=".claude/config/auth-credentials.json" />
      <Stack>
        <div className="grid gap-2 sm:grid-cols-3">
          <StatCard label="この PC の登録" value={`${v.rows.length - unregistered.length}/${v.rows.length}`} />
          <StatCard label="要対応" value={todo.length} tone={todo.length > 0 ? "warn" : "good"} />
          <StatCard
            label="登録状況の確認"
            value={v.generatedAt ? <Freshness iso={v.generatedAt} /> : "未確認"}
          />
        </div>

        <Section title="サービス">
          <DataTable columns={["サービス", "ログイン ID", "この PC", "CI", "自動ログイン", "要対応"]}>
            {v.rows.map((r) => {
              const a = action(r);
              return (
                <Row key={r.id}>
                  <Cell nowrap>{r.label}</Cell>
                  <Cell nowrap muted>{r.user ?? "—"}</Cell>
                  <Cell nowrap>{localCell(r)}</Cell>
                  <Cell nowrap>{ciCell(r)}</Cell>
                  <Cell nowrap>
                    <span title={r.policyNote}>{r.autoLogin ? "する" : "しない"}</span>
                  </Cell>
                  <Cell nowrap>{a ? <StatusBadge tone="bad">{a}</StatusBadge> : <span className="text-console-muted">—</span>}</Cell>
                </Row>
              );
            })}
          </DataTable>
          <p className="mt-1 text-[11px] text-console-muted">
            CI は note・ココナラ・KDP だけがパスワードを使う (セッション切れの入り直し)。「保管」は Secrets にあるだけで CI は使わない。方針は「自動ログイン」欄にマウスを置くと出る。
            登録状況は npm run admin の起動時に調べる。パスワードは表示も読み出しもしない。
          </p>
        </Section>

        {unregistered.length > 0 && (
          <PanelCard
            title="未登録のサービスを登録する"
            description="ターミナルで実行し、聞かれたらパスワードを入力する。登録後に node .claude/scripts/measurement/credential-status.mjs を実行して再読み込みする"
          >
            <Stack gap="sm">
              {unregistered.map((r) => (
                <code key={r.id} className="text-[12px]">{r.registerCommand}</code>
              ))}
            </Stack>
          </PanelCard>
        )}

        {ciMissing.length > 0 && (
          <PanelCard title="CI の Secrets を登録する" description="値は聞かれたら入力する (コマンド引数に書かない)">
            <Stack gap="sm">
              {ciMissing.flatMap((r) =>
                ["USER", "PASSWORD"].map((k) => (
                  <code key={`${r.id}-${k}`} className="text-[12px]">
                    gh secret set STATS47_AUTH_{r.id.toUpperCase()}_{k} --repo uruhayato373/stats47
                  </code>
                )),
              )}
            </Stack>
          </PanelCard>
        )}
      </Stack>
    </div>
  );
}
