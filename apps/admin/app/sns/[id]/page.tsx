import Link from "next/link";
import { notFound } from "next/navigation";

import { Cell, DataTable, PanelCard, Row, StatusBadge, type Tone } from "@/components/admin-ui";
import { Grid, Section, Stack } from "@/components/layout-primitives";
import { MediaPreview } from "@/components/media-preview";
import { PageHeading } from "@/components/ops/primitives";
import { buildPostTrace } from "@/lib/server/post-trace";
import type { Post } from "@/lib/server/posts-store";
import { datasetDir, datasetPath } from "../../../../../config/datasets.mjs";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, Tone> = { posted: "good", scheduled: "info", draft: "neutral", deleted: "bad" };
const APPROVAL_TONE: Record<string, Tone> = { approved: "good", pending: "warn", rejected: "bad", unrecorded: "neutral" };
const APPROVAL_LABEL: Record<string, string> = {
  approved: "承認済み",
  pending: "承認待ち",
  rejected: "却下",
  unrecorded: "記録なし (承認の記録を始める前の投稿)",
};
const ROLE_LABEL: Record<string, string> = { image: "画像", slide: "スライド", video: "動画", thumbnail: "サムネイル" };

function PostLink({ post }: { post: Post }) {
  return (
    <Link className="text-console-info hover:underline" href={`/sns/${post.id}`}>
      #{post.id} {post.platform}/{post.post_type} {post.status}
    </Link>
  );
}

export default async function SnsPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9]+$/.test(id)) notFound();
  const trace = buildPostTrace(Number(id));
  if (!trace) notFound();
  const { post, externalId, approval, script, assets, metrics, related } = trace;

  const facts: Array<[string, React.ReactNode]> = [
    ["媒体 / 種類", `${post.platform} / ${post.post_type ?? "-"}`],
    ["題材", `${post.domain ?? "-"} / ${post.content_key ?? "-"}`],
    ["状態", <StatusBadge key="s" tone={STATUS_TONE[post.status] ?? "neutral"}>{post.status}</StatusBadge>],
    ["予約日時", post.scheduled_at ?? "-"],
    ["投稿日時", post.posted_at ?? "-"],
    ["外部 ID", externalId ?? "たどれない (URL・media_id が未記録)"],
    [
      "投稿 URL",
      post.post_url ? (
        <a key="u" className="break-all text-console-info hover:underline" href={post.post_url} target="_blank" rel="noreferrer">
          {post.post_url} ↗
        </a>
      ) : (
        "-"
      ),
    ],
    ["着地 URL (UTM)", post.utm_url ?? "-"],
    ["型 (template)", post.template ?? "-"],
    ["作成 / 更新", `${post.created_at} / ${post.updated_at}`],
  ];

  return (
    <Stack gap="lg">
      <PageHeading title={`投稿 #${post.id}`} source={`${datasetPath("sns.posts")} (id=${post.id})`}>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <StatusBadge tone="info">{post.platform}</StatusBadge>
          <StatusBadge tone={STATUS_TONE[post.status] ?? "neutral"}>{post.status}</StatusBadge>
          <StatusBadge tone={APPROVAL_TONE[approval.state] ?? "neutral"}>{APPROVAL_LABEL[approval.state] ?? approval.state}</StatusBadge>
        </div>
      </PageHeading>

      <Grid min="lg">
        <PanelCard title="状態と外部 ID">
          <DataTable columns={["項目", "値"]}>
            {facts.map(([label, value]) => (
              <Row key={label}>
                <Cell nowrap muted>{label}</Cell>
                <Cell>{value}</Cell>
              </Row>
            ))}
          </DataTable>
        </PanelCard>
        <PanelCard title="承認" description="予約・投稿の道具は承認済みの行だけを外へ出す">
          <DataTable columns={["項目", "値"]}>
            <Row>
              <Cell nowrap muted>状態</Cell>
              <Cell>
                <StatusBadge tone={APPROVAL_TONE[approval.state] ?? "neutral"}>{APPROVAL_LABEL[approval.state] ?? approval.state}</StatusBadge>
              </Cell>
            </Row>
            <Row>
              <Cell nowrap muted>承認者 / 日時</Cell>
              <Cell>{approval.by ?? "-"} / {approval.at ?? "-"}</Cell>
            </Row>
            <Row>
              <Cell nowrap muted>経路</Cell>
              <Cell>{approval.via ?? "-"}</Cell>
            </Row>
            <Row>
              <Cell nowrap muted>メモ</Cell>
              <Cell>{approval.note ?? "-"}</Cell>
            </Row>
          </DataTable>
        </PanelCard>
      </Grid>

      <PanelCard title="台本" description={script.kind === "file" ? script.path : "短文・カルーセルの台本は本文 (caption)"}>
        {script.kind === "caption" ? (
          <pre className="m-0 whitespace-pre-wrap break-words text-sm">{script.text ?? "(本文の記録なし)"}</pre>
        ) : script.script ? (
          <Stack gap="sm">
            <p className="m-0 font-semibold">{script.script.title}</p>
            <pre className="m-0 whitespace-pre-wrap break-words text-sm">{script.script.description}</pre>
            {script.script.chapters?.length ? (
              <DataTable columns={["開始", "章", "ナレーション"]}>
                {script.script.chapters.map((c) => (
                  <Row key={c.start}>
                    <Cell nowrap>{c.start}</Cell>
                    <Cell>{c.title}</Cell>
                    <Cell muted>{c.narration ?? ""}</Cell>
                  </Row>
                ))}
              </DataTable>
            ) : null}
            <DataTable columns={["出典 URL", "metric", "調査"]}>
              {script.script.sources.map((s) => (
                <Row key={s.url}>
                  <Cell className="break-all">{s.url}</Cell>
                  <Cell muted>{s.metric_key ?? "-"}</Cell>
                  <Cell muted>{s.survey_id ?? "-"}</Cell>
                </Row>
              ))}
            </DataTable>
          </Stack>
        ) : (
          <p className="m-0 text-sm text-console-warn">台本ファイルがありません: {script.path}</p>
        )}
      </PanelCard>

      <Section
        title="素材"
        count={assets ? assets.length : "未保全"}
        note="実体は Google Drive の stats47/SNS素材/<媒体>/<id>/。台帳には相対パス・sha256・bytes だけを記録する"
      >
        {assets === null ? (
          <p className="m-0 text-sm text-console-warn">
            まだ Drive へ保全していません: node .claude/scripts/sns/archive-sns-assets.mjs --id {post.id}
          </p>
        ) : assets.length === 0 ? (
          <p className="m-0 text-sm text-console-muted">画像・動画を持たない投稿です (引用 RT など)</p>
        ) : (
          <Grid min="md">
            {assets.map((a) => (
              <PanelCard
                key={`${a.role}-${a.order}`}
                title={`${ROLE_LABEL[a.role] ?? a.role} ${a.order}`}
                description={a.state === "archived" ? a.drive_path : `取得元なし: ${a.reason}`}
              >
                {a.url ? (
                  <Stack gap="sm">
                    <MediaPreview candidates={[{ url: a.url, source: a.drive_path ?? "" }]} alt={`${a.role}-${a.order}`} aspectClassName="aspect-4/5" />
                    <p className="m-0 break-all text-[11px] text-console-muted">
                      sha256 {a.sha256?.slice(0, 12)}… · {a.bytes?.toLocaleString()} bytes{a.width ? ` · ${a.width}×${a.height}` : ""}
                      {a.source ? ` · 取得元 ${a.source}` : ""}
                    </p>
                  </Stack>
                ) : (
                  <StatusBadge tone="warn">missing</StatusBadge>
                )}
              </PanelCard>
            ))}
          </Grid>
        )}
      </Section>

      <PanelCard
        title="観測値"
        description={`最新: 表示 ${post.impressions ?? "-"} / いいね ${post.likes ?? "-"} / 更新 ${post.metrics_updated_at ?? "-"}。推移は ${datasetDir("sns.metric-snapshots")} の sns_post_id=${post.id}`}
      >
        {metrics.length ? (
          <DataTable columns={["取得日時", "表示", "リーチ", "再生", "いいね", "コメント", "共有", "保存", "引用"]}>
            {metrics.map((m) => (
              <Row key={m.fetchedAt}>
                <Cell nowrap>{m.fetchedAt.slice(0, 16)}</Cell>
                <Cell>{m.impressions || "-"}</Cell>
                <Cell>{m.reach || "-"}</Cell>
                <Cell>{m.views || "-"}</Cell>
                <Cell>{m.likes || "-"}</Cell>
                <Cell>{m.comments || "-"}</Cell>
                <Cell>{m.shares || "-"}</Cell>
                <Cell>{m.saves || "-"}</Cell>
                <Cell>{m.quotes || "-"}</Cell>
              </Row>
            ))}
          </DataTable>
        ) : (
          <p className="m-0 text-sm text-console-muted">この投稿に結び付いた指標の記録はまだありません</p>
        )}
      </PanelCard>

      <PanelCard title="関連投稿" description="YouTube マスターと派生 (parent_post_id)、同じ題材の他媒体投稿">
        <Stack gap="sm">
          {related.parent ? (
            <p className="m-0 text-sm">親: <PostLink post={related.parent} /></p>
          ) : null}
          {related.children.map((c) => (
            <p key={c.id} className="m-0 text-sm">派生: <PostLink post={c} /></p>
          ))}
          {related.sameContent.map((c) => (
            <p key={c.id} className="m-0 text-sm">同じ題材: <PostLink post={c} /></p>
          ))}
          {!related.parent && !related.children.length && !related.sameContent.length ? (
            <p className="m-0 text-sm text-console-muted">関連投稿はありません</p>
          ) : null}
        </Stack>
      </PanelCard>

      <Link className="text-sm font-medium text-console-info hover:underline" href="/sns">
        ← SNS 投稿ギャラリーへ戻る
      </Link>
    </Stack>
  );
}
