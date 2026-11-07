import { notFound } from "next/navigation";

import Link from "next/link";

import { Cell, DataTable, PanelCard, Row, StatusBadge } from "@/components/admin-ui";
import { Grid, Section, Stack } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { localSiteHref } from "@/lib/local-site";
import { ANALYSIS_STAGE_LABELS } from "@/lib/question-detail";
import { questionDetail, type DraftView, type QuestionDetail } from "@/lib/server/question-progress";

type QuestionCycle = QuestionDetail["cycles"][number];
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "問いの配線 — stats47 admin" };

const LINK = "font-medium underline-offset-4 hover:underline";

function RankingLink({ href }: { href: string | null }) {
  if (!href) return <span className="text-muted-foreground">なし</span>;
  return (
    <a className={LINK} href={localSiteHref(href)} target="_blank" rel="noreferrer">
      開く
    </a>
  );
}

function DraftCard({ draft }: { draft: DraftView }) {
  return (
    <PanelCard title={draft.title} description={draft.description ?? undefined}>
      <Stack>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge tone={draft.state === "公開待ち" ? "good" : "warn"}>{draft.state}</StatusBadge>
          <StatusBadge tone={draft.verdict === "PASS" ? "good" : "warn"}>審査 {draft.verdict ?? "未実施"}</StatusBadge>
          <StatusBadge tone="neutral">{draft.chars.toLocaleString()} 字</StatusBadge>
        </div>
        {draft.hasBackground ? (
          // eslint-disable-next-line @next/next/no-img-element -- 手元のファイルをそのまま見せる
          <img src={`/api/content/draft-file/background/${draft.slug}.jpg`} alt={`${draft.title}の背景画像`} className="w-full rounded-md border" />
        ) : (
          <p className="m-0 text-sm text-warning">背景画像がありません。</p>
        )}
        <ol className="m-0 list-decimal pl-5 text-sm">
          {draft.outline.map((heading) => (
            <li key={heading}>{heading}</li>
          ))}
        </ol>
        <Grid min="sm" lines={false}>
          {draft.figures.map((figure) => (
            // eslint-disable-next-line @next/next/no-img-element -- 手元のファイルをそのまま見せる
            <img key={figure} src={`/api/content/draft-file/draft/${draft.slug}/data/${figure}`} alt={figure} className="w-full rounded-md border" />
          ))}
        </Grid>
        <p className="m-0 text-xs text-muted-foreground">
          本番と同じ画面で読む: <code className="font-mono">npm run blog:preview -- --slug {draft.slug}</code> のあと{" "}
          <a className={LINK} href={localSiteHref(`/blog/${draft.slug}`)} target="_blank" rel="noreferrer">
            localhost で開く
          </a>
        </p>
      </Stack>
    </PanelCard>
  );
}

const VIEWPOINT_TONE = { 済み: "good", 対象外: "neutral", 未: "warn" } as const;

/** 分析の工程と視点の結果。npm run analysis:check が止めるものをそのまま見せる */
function AnalysisCycle({ cycle }: { cycle?: QuestionCycle }) {
  if (!cycle) return null;
  return (
    <Stack>
      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        <span>工程</span>
        <StatusBadge tone={cycle.stage ? "good" : "warn"}>{cycle.stage ? ANALYSIS_STAGE_LABELS[cycle.stage] ?? cycle.stage : "未登録"}</StatusBadge>
        {cycle.problems.length ? <StatusBadge tone="bad">止まる点 {cycle.problems.length} 件</StatusBadge> : null}
      </div>
      {cycle.problems.length ? (
        <ul className="m-0 list-disc pl-5 text-sm">
          {cycle.problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      ) : null}
      <DataTable columns={["視点", "状態", "結果", "根拠"]}>
        {cycle.rows.map((row) => (
          <Row key={row.id}>
            <Cell nowrap>{row.label}</Cell>
            <Cell nowrap>
              <StatusBadge tone={VIEWPOINT_TONE[row.status]}>{row.status}</StatusBadge>
            </Cell>
            <Cell>{row.text || row.ask}</Cell>
            <Cell nowrap muted>
              {row.evidence ? <code className="font-mono text-xs">{row.evidence}</code> : "-"}
            </Cell>
          </Row>
        ))}
      </DataTable>
    </Stack>
  );
}

/** 1 つの問いから作ったものと配線先 (型 C: 詳細)。問い → 分析 → 記事 → 図の配信先 → 投稿 → 商品 の順に出す */
export default async function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = questionDetail(decodeURIComponent(id));
  if (data === null) notFound();
  if (hasError(data)) {
    return (
      <>
        <PageHeading title="問いの配線" source="問いの台帳" />
        <ErrorNote error={data.error} />
      </>
    );
  }
  const { issue, analyses, cycles, inputs, pages, drafts, figures, posts, products, relatedNotes, relatedPosts } = data;

  return (
    <>
      <PageHeading title={issue.question} source={`${issue.id} — 問いの台帳 + 配信先の台帳`}>
        {issue.dataNote ? <p className="m-0 max-w-4xl text-sm text-muted-foreground">使う統計: {issue.dataNote}</p> : null}
        {issue.pitfall ? <p className="m-0 max-w-4xl text-sm text-muted-foreground">読み違えやすい点: {issue.pitfall}</p> : null}
        <Link className={`${LINK} text-sm`} href="/content/types?type=paper">
          問いの一覧へ戻る
        </Link>
      </PageHeading>

      <Section title={`サイト (${pages.length})`}>
        {pages.length ? (
          <DataTable columns={["役割", "ページ", "公開"]}>
            {pages.map((p) => (
              <Row key={`${p.role}:${p.id}`}>
                <Cell nowrap>{p.role === "answers" ? "答え" : "根拠"}</Cell>
                <Cell>
                  <a className={LINK} href={localSiteHref(p.href)} target="_blank" rel="noreferrer">
                    {p.title}
                  </a>
                </Cell>
                <Cell nowrap>{p.published ? "公開" : "未公開"}</Cell>
              </Row>
            ))}
          </DataTable>
        ) : (
          <p className="m-0 text-sm text-muted-foreground">ページはまだありません。</p>
        )}
      </Section>

      <Section title={`note (${relatedNotes.length})`}>
        {relatedNotes.length ? (
          <DataTable columns={["記事", "経由したページ"]}>
            {relatedNotes.map((n) => (
              <Row key={`${n.id}:${n.via}`}>
                <Cell>
                  {n.href ? (
                    <a className={LINK} href={n.href} target="_blank" rel="noreferrer">
                      {n.title}
                    </a>
                  ) : (
                    n.title
                  )}
                </Cell>
                <Cell muted>{n.via}</Cell>
              </Row>
            ))}
          </DataTable>
        ) : (
          <p className="m-0 text-sm text-muted-foreground">つながる note はありません。</p>
        )}
      </Section>

      <Section title={`SNS (${relatedPosts.length + posts.length})`}>
        {relatedPosts.length ? (
          <DataTable columns={["ID", "媒体", "状態", "本文", "経由したページ"]}>
            {relatedPosts.map((p) => (
              <Row key={`${p.id}:${p.via}`}>
                <Cell nowrap>
                  <Link className={LINK} href={`/sns/${p.id}`} target="_blank">
                    {p.id}
                  </Link>
                </Cell>
                <Cell nowrap>{p.platform}</Cell>
                <Cell nowrap>{p.status}</Cell>
                <Cell>{p.caption}</Cell>
                <Cell muted>{p.via}</Cell>
              </Row>
            ))}
          </DataTable>
        ) : null}
      </Section>

      <Section title={`分析 (${analyses.length})`}>
        {analyses.length ? (
          analyses.map((a) => (
            <PanelCard key={a.id} title={a.question ?? a.id}>
              <Stack>
                <p className="m-0 text-sm">{a.finding}</p>
                <ul className="m-0 list-disc pl-5 text-sm text-muted-foreground">
                  {(a.caveats ?? []).map((caveat) => (
                    <li key={caveat}>{caveat}</li>
                  ))}
                </ul>
                <AnalysisCycle cycle={cycles.find((cycle) => cycle.id === a.id)} />
              </Stack>
            </PanelCard>
          ))
        ) : (
          <p className="m-0 text-sm text-muted-foreground">分析はまだありません。</p>
        )}
      </Section>

      {inputs.length ? (
        <Section title={`分析に使ったデータ (${inputs.length})`}>
          <DataTable columns={["データ", "都道府県", "市区町村", "配線"]}>
            {inputs.map((input) => (
              <Row key={input.key}>
                <Cell>
                  {input.title}
                  {input.derived ? <span className="ml-1 text-xs text-muted-foreground">(分析で計算)</span> : null}
                </Cell>
                <Cell nowrap>
                  <RankingLink href={input.rankingHref} />
                </Cell>
                <Cell nowrap>
                  <RankingLink href={input.municipalityHref} />
                </Cell>
                <Cell nowrap>
                  <Link className={LINK} href={`/content/metrics/${encodeURIComponent(input.key)}`} target="_blank">
                    記事・note・SNS
                  </Link>
                </Cell>
              </Row>
            ))}
          </DataTable>
        </Section>
      ) : null}

      <Section title={`公開待ちの記事 (${drafts.length})`}>
        {drafts.length ? (
          <Grid min="lg" lines={false}>
            {drafts.map((draft) => (
              <DraftCard key={draft.slug} draft={draft} />
            ))}
          </Grid>
        ) : (
          <p className="m-0 text-sm text-muted-foreground">公開待ちの記事はありません。</p>
        )}
      </Section>

      <Section title={`図の配信先 (${figures.reduce((n, f) => n + f.destinations.length, 0)})`}>
        <DataTable columns={["図", "読み方", "型", "媒体", "配信先", "状態"]}>
          {figures.flatMap((f) =>
            f.destinations.map((d) => (
              <Row key={`${f.id}:${d.channel}:${d.page ?? d.slug ?? d.postId}`}>
                <Cell>{f.title}</Cell>
                <Cell muted>{f.reads ?? "-"}</Cell>
                <Cell nowrap muted>
                  {f.template}
                </Cell>
                <Cell nowrap>{d.channel}</Cell>
                <Cell>
                  <code className="font-mono text-xs">{d.page ?? (d.slug ? `blog:${d.slug}` : `post:${d.postId}`)}</code>
                </Cell>
                <Cell nowrap>{d.status}</Cell>
              </Row>
            )),
          )}
        </DataTable>
      </Section>

      <Section title={`投稿の下書き (${posts.length})`}>
        {posts.length ? (
          <DataTable columns={["ID", "媒体", "状態", "承認", "本文"]}>
            {posts.map((p) => (
              <Row key={p.id}>
                <Cell nowrap>
                  <Link className={LINK} href={`/sns/${p.id}`} target="_blank">
                    {p.id}
                  </Link>
                </Cell>
                <Cell nowrap>{p.platform}</Cell>
                <Cell nowrap>{p.status}</Cell>
                <Cell nowrap>{p.approval}</Cell>
                <Cell>{p.caption}</Cell>
              </Row>
            ))}
          </DataTable>
        ) : (
          <p className="m-0 text-sm text-muted-foreground">投稿はありません。</p>
        )}
      </Section>

      <Section title={`商品 (${products.length})`}>
        {products.length ? (
          <DataTable columns={["商品", "価格", "状態"]}>
            {products.map((p) => (
              <Row key={p.id}>
                <Cell>
                  {p.href ? (
                    <a className={LINK} href={p.href} target="_blank" rel="noreferrer">
                      {p.title}
                    </a>
                  ) : (
                    p.title
                  )}
                </Cell>
                <Cell nowrap>{p.priceJpy === null ? "—" : `¥${p.priceJpy.toLocaleString()}`}</Cell>
                <Cell nowrap>{p.status}</Cell>
              </Row>
            ))}
          </DataTable>
        ) : (
          <p className="m-0 text-sm text-muted-foreground">この問いから企画した商品はありません。</p>
        )}
      </Section>

    </>
  );
}
