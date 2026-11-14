import { ClockIcon, PlugIcon, ShieldAlertIcon, ToggleRightIcon } from "lucide-react";

import { Cell, DataTable, Row, StatCard, StatusBadge, type Tone } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, Freshness, PageHeading } from "@/components/ops/primitives";
import { mcpStatus, type McpServerRow } from "@/lib/server/mcp-status";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "MCP の接続状況 — stats47 admin" };

/**
 * /ops/mcp — この PC が使う MCP の一覧と接続状況。どの MCP を何のために使い、今つながるのかを 1 画面で確かめる。
 * 接続状況は PC ごとに違うので保存せず、ページを開くたびにこの PC で調べる (設定ファイルを読み、有効な HTTP サーバーへ
 * initialize を 1 回送る)。状態の語彙は Claude Code の `/mcp` と同じ。トークンの値は表示も読み出しもしない。
 */
const SOURCE = ".mcp.json · .claude/settings.json · .claude/settings.local.json · ~/.claude.json · .claude/config/mcp-servers.json";

const SCOPE_LABEL: Record<McpServerRow["scope"], string> = { local: "local", project: "project", user: "user" };
const STATE_LABEL: Record<McpServerRow["state"], { label: string; tone: Tone }> = {
  enabled: { label: "有効", tone: "good" },
  pending: { label: "承認待ち", tone: "warn" },
  rejected: { label: "拒否", tone: "bad" },
  disabled: { label: "無効", tone: "neutral" },
};
const AUTH_LABEL: Record<McpServerRow["auth"], string> = { none: "なし", token: "トークン", oauth: "OAuth", unknown: "不明" };

/** 接続確認で人が見るべきもの。資格情報を送らないので、401 は「つながらない」とは限らない */
function probeCell(r: McpServerRow) {
  if (!r.probe) {
    const reason = r.state !== "enabled" ? "有効でない" : r.transport === "stdio" ? "stdio は対象外" : `${r.transport} は対象外`;
    return <span className="text-muted-foreground">— ({reason})</span>;
  }
  if ("error" in r.probe) return <StatusBadge tone="bad" title={r.probe.error}>応答なし</StatusBadge>;
  const { status } = r.probe;
  if (status >= 200 && status < 300) return <StatusBadge tone="good">HTTP {status}</StatusBadge>;
  if (status === 401 || status === 403) return <StatusBadge tone="warn" title="資格情報を送らずに確かめた応答。認証済みかは /mcp で確かめる">HTTP {status} 認証が要る</StatusBadge>;
  return <StatusBadge tone="bad">HTTP {status}</StatusBadge>;
}

function tokenCell(r: McpServerRow) {
  if (r.token === null) return <span className="text-muted-foreground">{r.auth === "oauth" ? "調べない" : "—"}</span>;
  return r.token ? <StatusBadge tone="good">あり</StatusBadge> : <StatusBadge tone="bad">なし</StatusBadge>;
}

/** 対応が要る行: 承認待ち、トークンが無い、有効なのに応答が 2xx でも認証要求でもない */
function needsAction(r: McpServerRow): boolean {
  if (r.state === "pending" || r.token === false) return true;
  if (!r.probe) return false;
  if ("error" in r.probe) return true;
  const { status } = r.probe;
  return !(status >= 200 && status < 300) && status !== 401 && status !== 403;
}

export default async function McpStatusPage() {
  const v = await mcpStatus();
  if (hasError(v)) {
    return (
      <>
        <PageHeading title="MCP の接続状況" source={SOURCE} />
        <ErrorNote error={v.error} />
      </>
    );
  }
  const enabled = v.rows.filter((r) => r.state === "enabled");
  const todo = v.rows.filter(needsAction);

  return (
    <>
      <PageHeading title="MCP の接続状況" source={SOURCE} />
      <Grid min="sm">
        <StatCard label="この PC の MCP" icon={<PlugIcon />} value={v.rows.length} />
        <StatCard label="有効" icon={<ToggleRightIcon />} value={`${enabled.length}/${v.rows.length}`} />
        <StatCard label="要対応" icon={<ShieldAlertIcon />} value={todo.length} tone={todo.length > 0 ? "warn" : "good"} />
        <StatCard label="確認した時刻" icon={<ClockIcon />} value={<Freshness iso={v.generatedAt} />} />
      </Grid>

      <Section title="サーバー">
        <DataTable columns={["サーバー", "用途と使う場所", "有効か", "認証方式", "トークン", "接続確認"]}>
          {v.rows.map((r) => (
            <Row key={r.name}>
              <Cell className="min-w-44">
                <span className="font-medium">{r.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {SCOPE_LABEL[r.scope]} · {r.transport}
                  {r.shadowed.length > 0 && ` (${r.shadowed.join("・")} の定義は使われない)`}
                </span>
                <code className="block break-all font-mono text-xs text-muted-foreground">{r.target}</code>
              </Cell>
              <Cell className="min-w-52">
                {r.purpose ?? <span className="text-muted-foreground">未記入</span>}
                {r.usedBy.map((rel) => (
                  <code key={rel} className="block break-all font-mono text-xs text-muted-foreground">{rel}</code>
                ))}
              </Cell>
              <Cell className="min-w-40">
                <StatusBadge tone={STATE_LABEL[r.state].tone} title={r.stateSource}>{STATE_LABEL[r.state].label}</StatusBadge>
                <span className="block text-xs text-muted-foreground">{r.stateSource}</span>
              </Cell>
              <Cell nowrap>
                {AUTH_LABEL[r.auth]}
                {r.authNote && <span className="block text-xs text-muted-foreground">{r.authNote}</span>}
              </Cell>
              <Cell nowrap>{tokenCell(r)}</Cell>
              <Cell nowrap>{probeCell(r)}</Cell>
            </Row>
          ))}
        </DataTable>
        <p className="text-xs text-muted-foreground">
          「有効か」は Claude Code の /mcp と同じ語で、承認待ち = Pending approval、拒否 = Rejected、無効 = Disabled for this project。
          接続確認は、有効な HTTP サーバーへ initialize を 1 回送った応答コードで、資格情報は送らない。HTTP 401 は認証が要るサーバーという意味で、
          認証済みかどうかは /mcp で確かめる。stdio のサーバーは起動が要るので確かめない。トークンの値は表示も読み出しもせず、
          OAuth のトークン (Claude Code の資格情報の中) は有無も調べない。claude.ai のコネクタとプラグインの MCP はこの一覧に出ない。
        </p>
      </Section>
    </>
  );
}
