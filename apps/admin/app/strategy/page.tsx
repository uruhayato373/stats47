import Link from "next/link";

import {
  Badge,
  ErrorNote,
  Freshness,
  PageHeading,
  Section,
  Stat,
  Table,
  Td,
  Tr,
} from "@/components/ops/primitives";
import {
  businessPlanAdminData,
  businessPlanLabels,
} from "@/lib/server/business-plan";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "方針・事業計画 — stats47 admin" };

const decisionTone = {
  adopted: "good",
  adapted: "info",
  deferred: "warn",
  rejected: "bad",
} as const;
const workTone = {
  ready: "good",
  "in-progress": "info",
  blocked: "bad",
  gated: "warn",
  candidate: "neutral",
} as const;
const measurementTone = {
  measured: "good",
  "partially-measured": "warn",
  "not-instrumented": "bad",
  manual: "info",
} as const;
const releaseTone = {
  pass: "good",
  pending: "warn",
} as const;

function postTone(status: string | null) {
  if (status === "posted") return "good" as const;
  if (status === "scheduled") return "info" as const;
  if (status === "draft") return "neutral" as const;
  return "bad" as const;
}

function formatSchedule(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

export default function StrategyPage() {
  const data = businessPlanAdminData();
  const { catalog } = data;
  const pilots = catalog.contentOpportunities
    .filter((item) => item.pilotOrder !== undefined)
    .sort((a, b) => (a.pilotOrder ?? 99) - (b.pilotOrder ?? 99));
  const pilotSpecs = new Map(
    catalog.pilotSpecs.map((spec) => [spec.contentId, spec])
  );

  return (
    <div className="space-y-8">
      <PageHeading
        title="方針・事業計画"
        source="packages/data-configs/src/business-plan/ + 既存の設計・戦略SSOT"
      >
        <p className="max-w-4xl text-sm text-console-muted">
          原案を実行可能な正典へ変換した読み取りビューです。売上・アクセス目標は予測ではなく仮説、
          未計測は0ではありません。
        </p>
      </PageHeading>

      <section className="rounded-md border border-console-border bg-console-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info">{catalog.id}</Badge>
          <Badge>{catalog.version}</Badge>
          <span className="text-[11px] text-console-muted">
            対象 {catalog.source.planPeriod}
          </span>
        </div>
        <h2 className="mt-3 text-xl font-bold text-console-fg">
          {catalog.tagline}
        </h2>
        <p className="mt-1 max-w-4xl text-sm text-console-muted">
          {catalog.vision}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {catalog.priorityThemes.map((theme) => (
            <Badge key={theme}>{theme}</Badge>
          ))}
        </div>
      </section>

      <Section title="M1（2026年9月）実行ボード">
        <p className="text-[12px] text-console-muted">
          {catalog.m1.objective}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="サイト画面"
            value={`${data.m1.routes.filter((route) => route.implemented).length}/${data.m1.routes.length}`}
            sub="ローカル実装 / noindex"
            tone={data.m1.routes.every((route) => route.implemented) ? "good" : "warn"}
          />
          {hasError(data.m1.x) ? (
            <Stat label="X初回投稿" value="読取失敗" tone="bad" />
          ) : (
            <Stat
              label="X初回投稿"
              value={`${data.m1.x.registered}/${data.m1.x.planned}`}
              sub={`draft ${data.m1.x.draft} / scheduled ${data.m1.x.scheduled} / posted ${data.m1.x.posted}`}
              tone={data.m1.x.registered === data.m1.x.planned ? "good" : "warn"}
            />
          )}
          <Stat
            label="note商品"
            value={`${data.m1.note.registered}/${data.m1.note.planned}`}
            sub={`本文あり ${data.m1.note.withBody} / 公開 ${data.m1.note.published}`}
            tone={data.m1.note.registered === data.m1.note.planned ? "good" : "warn"}
          />
          <Stat
            label="Geoイベント"
            value={`${data.m1.events.codeMapped}/${data.m1.events.planned}`}
            sub={`GA4登録・反映待ち ${data.m1.events.registrationPending}`}
            tone={data.m1.events.registrationPending === 0 ? "good" : "warn"}
          />
        </div>

        {hasError(data.m1.x) ? <ErrorNote error={data.m1.x.error} /> : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {data.m1.releaseChecks.map((check) => (
            <div
              key={check.id}
              className="rounded-md border border-console-border bg-console-card p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[12px] font-bold text-console-fg">
                  {check.label}
                </h3>
                <Badge tone={releaseTone[check.status]}>
                  {check.status === "pass" ? "PASS" : "待ち"}
                </Badge>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-console-muted">
                {check.detail}
              </p>
              {check.external ? (
                <p className="mt-1 text-[10px] font-medium text-console-warn">
                  外部操作
                </p>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Table columns={["分析記事", "データ", "47県snapshot", "確認日", "状態"]}>
            {data.m1.analyses.map((analysis) => (
              <Tr key={analysis.id}>
                <Td>
                  <div className="font-medium">{analysis.title}</div>
                  <code className="text-[10px] text-console-muted">
                    /geo/{analysis.slug}
                  </code>
                </Td>
                <Td>
                  <Badge>{analysis.dataKind}</Badge>
                  <code className="mt-1 block text-[10px] text-console-muted">
                    {analysis.dataKey}
                  </code>
                </Td>
                <Td nowrap>
                  <Badge tone={analysis.localSnapshotReady ? "good" : "bad"}>
                    {analysis.localSnapshotReady
                      ? `${analysis.expectedObservationCount}県・準備済み`
                      : "ローカル未確認"}
                  </Badge>
                </Td>
                <Td nowrap muted>{analysis.evidenceCheckedAt}</Td>
                <Td nowrap>
                  <Badge tone={workTone[analysis.status]}>
                    {businessPlanLabels.work[analysis.status]}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Table>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-[13px] font-bold text-console-fg">
              X初回15投稿
            </h3>
            <Link
              href="/content/x"
              className="text-[11px] font-medium text-console-accent hover:underline"
            >
              X運用画面で本文を確認 →
            </Link>
          </div>
          {hasError(data.m1.x) ? null : (
            <Table columns={["投稿", "型", "予定（JST）", "画像", "台帳状態"]}>
              {data.m1.x.posts.map((post, index) => (
                <Tr key={post.contentKey}>
                  <Td>
                    <div className="font-medium">
                      {index + 1}. {post.title}
                    </div>
                    <code className="text-[10px] text-console-muted">
                      {post.contentKey}
                    </code>
                  </Td>
                  <Td nowrap><Badge>{post.template}</Badge></Td>
                  <Td nowrap muted>{formatSchedule(post.scheduledAt)}</Td>
                  <Td nowrap>
                    <Badge tone={post.mediaReady ? "good" : "bad"}>
                      {post.mediaReady ? "準備済み" : "不足"}
                    </Badge>
                  </Td>
                  <Td nowrap>
                    <Badge tone={postTone(post.registryStatus)}>
                      {post.registryStatus ?? "未登録"}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Table>
          )}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-[13px] font-bold text-console-fg">
              note有料商品15件
            </h3>
            <Link
              href="/content/note"
              className="text-[11px] font-medium text-console-accent hover:underline"
            >
              note運用画面で本文を確認 →
            </Link>
          </div>
          <Table columns={["商品", "価格", "本文", "カタログ", "制作ゲート"]}>
            {data.m1.note.products.map((product, index) => (
              <Tr key={product.articleKey}>
                <Td>
                  <div className="font-medium">
                    {index + 1}. {product.title}
                  </div>
                  <code className="text-[10px] text-console-muted">
                    {product.articleKey}
                  </code>
                  <p className="mt-1 text-[10px] text-console-muted">
                    {product.readerOutcome}
                  </p>
                </Td>
                <Td nowrap>{product.priceYen.toLocaleString("ja-JP")}円</Td>
                <Td nowrap>
                  <Badge tone={product.hasBody ? "good" : "warn"}>
                    {product.hasBody ? "本文あり" : "本文なし"}
                  </Badge>
                </Td>
                <Td nowrap>
                  <Badge tone={product.catalogStatus === "published" ? "good" : "neutral"}>
                    {product.catalogStatus ?? "未登録"}
                  </Badge>
                </Td>
                <Td>
                  <Badge tone={workTone[product.productStatus]}>
                    {businessPlanLabels.work[product.productStatus]}
                  </Badge>
                  <p className="mt-1 text-[10px] leading-relaxed text-console-muted">
                    {product.readinessGate}
                  </p>
                </Td>
              </Tr>
            ))}
          </Table>
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-[13px] font-bold text-console-fg">
            Geo計測イベント
          </h3>
          <Table columns={["事業イベント", "GA4イベント", "計測状態", "残作業"]}>
            {data.m1.events.items.map((event) => (
              <Tr key={event.id}>
                <Td>
                  <div className="font-medium">{event.label}</div>
                  <code className="text-[10px] text-console-muted">{event.id}</code>
                </Td>
                <Td><code className="text-[10px]">{event.canonicalEvent ?? "未設定"}</code></Td>
                <Td nowrap>
                  <Badge tone={measurementTone[event.status]}>
                    {businessPlanLabels.measurement[event.status]}
                  </Badge>
                </Td>
                <Td muted>{event.note}</Td>
              </Tr>
            ))}
          </Table>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <Table columns={["画面", "実装", "検索", "計画状態"]}>
            {data.m1.routes.map((route) => (
              <Tr key={route.path}>
                <Td>
                  <div className="font-medium">{route.title}</div>
                  <code className="text-[11px] text-console-muted">{route.path}</code>
                </Td>
                <Td nowrap>
                  <Badge tone={route.implemented ? "good" : "bad"}>
                    {route.implemented ? "ファイルあり" : "未実装"}
                  </Badge>
                </Td>
                <Td nowrap muted>{route.searchVisibility}</Td>
                <Td nowrap>
                  <Badge tone={workTone[route.status]}>
                    {businessPlanLabels.work[route.status]}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Table>

          <Table columns={["状態", "担当", "タスク", "完了条件"]}>
            {catalog.m1.tasks.map((task) => (
              <Tr key={task.id}>
                <Td nowrap>
                  <Badge tone={workTone[task.status]}>
                    {businessPlanLabels.work[task.status]}
                  </Badge>
                </Td>
                <Td nowrap muted>{task.owner}</Td>
                <Td>
                  <div className="font-medium">{task.title}</div>
                  <code className="text-[10px] text-console-muted">{task.deliverablePath}</code>
                </Td>
                <Td>{task.doneWhen}</Td>
              </Tr>
            ))}
          </Table>
        </div>

        <div className="mt-4 rounded-md border border-console-border bg-console-card p-3">
          <h3 className="text-[12px] font-bold text-console-fg">公開ゲート</h3>
          <ul className="mt-2 space-y-1 text-[11px] text-console-muted">
            {catalog.m1.releaseGates.map((gate) => (
              <li key={gate}>• {gate}</li>
            ))}
          </ul>
        </div>
      </Section>

      <Section title="事業原則と収益レイヤー">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-console-border bg-console-card p-3">
            <h3 className="text-[12px] font-bold text-console-fg">守る原則</h3>
            <ul className="mt-2 space-y-1 text-[12px] text-console-muted">
              {catalog.principles.map((principle) => (
                <li key={principle}>• {principle}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-console-border bg-console-card p-3">
            <h3 className="text-[12px] font-bold text-console-fg">
              段階的な収益レイヤー
            </h3>
            <ol className="mt-2 space-y-1 text-[12px] text-console-muted">
              {catalog.revenueLayers.map((layer, index) => (
                <li key={layer}>
                  {index + 1}. {layer}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <Section title="実装可能性の概況">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <Stat
            label="原案の判断"
            value={catalog.decisions.length}
            sub="25章を全件分類"
          />
          <Stat
            label="コンテンツ候補"
            value={catalog.contentOpportunities.length}
            sub={`今すぐ実行 ${data.counts.readyContent}`}
          />
          <Stat
            label="X / note商品"
            value={`${catalog.xIdeas.length} / ${catalog.noteProducts.length}`}
          />
          <Stat
            label="開始条件待ち"
            value={data.counts.gatedInitiatives}
            tone="warn"
          />
          <Stat
            label="未実装イベント"
            value={data.counts.unmeasuredEvents}
            tone={data.counts.unmeasuredEvents ? "warn" : "good"}
          />
        </div>
        {hasError(data.state) ? (
          <ErrorNote
            error={`${data.state.error} — npm run business-plan:build-state で再生成`}
          />
        ) : (
          <p className="text-[11px] text-console-muted">
            運用state <Freshness iso={data.state.generatedAt} /> ·{" "}
            {data.state.measurementWarning}
          </p>
        )}
      </Section>

      <Section title="最初の4系列" count={pilots.length}>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {pilots.map((item) => (
            <article
              key={item.id}
              className="rounded-md border border-console-border bg-console-card p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-console-muted">
                  第{item.pilotOrder}弾 · {item.id}
                </span>
                <Badge tone={workTone[item.status]}>
                  {businessPlanLabels.work[item.status]}
                </Badge>
              </div>
              <h3 className="mt-2 text-sm font-bold text-console-fg">
                {item.title}
              </h3>
              <p className="mt-1 text-[11px] text-console-muted">
                {item.geography} · {item.primaryRevenue}
              </p>
              {pilotSpecs.get(item.id) ? (
                <div className="mt-3 space-y-2 border-t border-console-border pt-2 text-[11px] text-console-muted">
                  <p className="font-medium text-console-fg">
                    {pilotSpecs.get(item.id)?.question}
                  </p>
                  <p>
                    data:{" "}
                    {pilotSpecs
                      .get(item.id)
                      ?.dataRefs.map((ref) => `${ref.kind}:${ref.id}`)
                      .join(" / ")}
                  </p>
                  <p>
                    gate: {pilotSpecs.get(item.id)?.qualityGates.join(" / ")}
                  </p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </Section>

      <Section title="実行イニシアチブ" count={catalog.initiatives.length}>
        <Table columns={["状態", "wave", "施策", "owner / skills", "開始条件"]}>
          {catalog.initiatives.map((item) => (
            <Tr key={item.id}>
              <Td nowrap>
                <Badge tone={workTone[item.status]}>
                  {businessPlanLabels.work[item.status]}
                </Badge>
              </Td>
              <Td nowrap muted>
                {item.wave}
              </Td>
              <Td>
                <div className="font-medium">{item.title}</div>
                <div className="text-[11px] text-console-muted">
                  {item.deliverables.join(" / ")}
                </div>
              </Td>
              <Td nowrap>
                <div>{item.owner}</div>
                <div className="text-[11px] text-console-muted">
                  {item.skills.join(", ")}
                </div>
              </Td>
              <Td>{item.readinessGate}</Td>
            </Tr>
          ))}
        </Table>
      </Section>

      <Section title="25章の取込判断" count={catalog.decisions.length}>
        <Table columns={["章", "判断", "方針", "適合理由", "owner"]}>
          {catalog.decisions.map((item) => (
            <Tr key={item.chapter}>
              <Td nowrap>{item.chapter}</Td>
              <Td nowrap>
                <Badge tone={decisionTone[item.status]}>
                  {businessPlanLabels.decision[item.status]}
                </Badge>
              </Td>
              <Td>
                <div className="font-medium">{item.title}</div>
                <div className="text-[11px] text-console-muted">
                  {item.summary}
                </div>
              </Td>
              <Td>{item.rationale}</Td>
              <Td nowrap muted>
                {item.owners.join(", ")}
              </Td>
            </Tr>
          ))}
        </Table>
      </Section>

      <Section title="KPIと記録契約" count={catalog.metrics.length}>
        <Table
          columns={[
            "役割",
            "指標",
            "状態",
            "頻度 / source",
            "仮説目標",
            "注記",
          ]}
        >
          {catalog.metrics.map((metric) => (
            <Tr key={metric.id}>
              <Td nowrap>
                <Badge>{metric.role}</Badge>
              </Td>
              <Td>
                <div className="font-medium">{metric.label}</div>
                <code className="text-[11px] text-console-muted">
                  {metric.id}
                </code>
              </Td>
              <Td nowrap>
                <Badge tone={measurementTone[metric.measurementStatus]}>
                  {businessPlanLabels.measurement[metric.measurementStatus]}
                </Badge>
              </Td>
              <Td nowrap muted>
                {metric.cadence}
                <br />
                {metric.source}
              </Td>
              <Td nowrap muted>
                {[
                  metric.targetM3 && `M3 ${metric.targetM3}`,
                  metric.targetM6 && `M6 ${metric.targetM6}`,
                  metric.targetM12 && `M12 ${metric.targetM12}`,
                ]
                  .filter(Boolean)
                  .join(" / ") || "—"}
                <br />
                {metric.unit}
              </Td>
              <Td>{metric.note}</Td>
            </Tr>
          ))}
        </Table>
      </Section>

      <Section title="イベント実装・登録状況" count={catalog.events.length}>
        <Table
          columns={["状態", "事業イベント", "実装イベント", "owner", "注記"]}
        >
          {catalog.events.map((event) => (
            <Tr key={event.id}>
              <Td nowrap>
                <Badge tone={measurementTone[event.status]}>
                  {businessPlanLabels.measurement[event.status]}
                </Badge>
              </Td>
              <Td>
                <div>{event.label}</div>
                <code className="text-[11px] text-console-muted">
                  {event.id}
                </code>
              </Td>
              <Td nowrap muted>
                {event.canonicalEvent ?? "—"}
              </Td>
              <Td nowrap muted>
                {event.owner}
              </Td>
              <Td>{event.note}</Td>
            </Tr>
          ))}
        </Table>
      </Section>

      <Section title="設計・方針SSOT" count={catalog.documents.length}>
        {hasError(data.documents) ? (
          <ErrorNote error={data.documents.error} />
        ) : (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {data.documents.map((document) => (
              <article
                key={document.id}
                className="rounded-md border border-console-border bg-console-card p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-console-fg">
                    {document.title}
                  </h3>
                  {document.status ? <Badge>{document.status}</Badge> : null}
                </div>
                <p className="mt-1 text-[12px] text-console-muted">
                  {document.role}
                </p>
                <code className="mt-2 block break-all text-[10px] text-console-muted">
                  {document.path}
                </code>
                <p className="mt-2 text-[11px] text-console-muted">
                  owner: {document.owner} · updated:{" "}
                  {document.updated ?? "不明"}
                </p>
                <Link
                  className="mt-3 inline-block text-[12px] font-medium text-console-info hover:underline"
                  href={`/strategy/doc/${document.id}`}
                >
                  本文を読む →
                </Link>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="全コンテンツカタログ"
        count={catalog.contentOpportunities.length}
      >
        <p className="text-[11px] text-console-muted">
          100件は在庫であり制作ノルマではありません。実行可能4件以外は需要・データ・収益・更新工数のゲート後に昇格します。
        </p>
        <div className="max-h-[34rem] overflow-auto rounded-md border border-console-border bg-console-card">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 border-b border-console-border bg-console-card text-left text-[11px] text-console-muted">
              <tr>
                <th className="px-2 py-1.5">ID</th>
                <th className="px-2 py-1.5">状態</th>
                <th className="px-2 py-1.5">分類</th>
                <th className="px-2 py-1.5">企画</th>
                <th className="px-2 py-1.5">単位</th>
                <th className="px-2 py-1.5">主収益</th>
              </tr>
            </thead>
            <tbody>
              {catalog.contentOpportunities.map((item) => (
                <Tr key={item.id}>
                  <Td nowrap muted>
                    {item.id}
                  </Td>
                  <Td nowrap>
                    <Badge tone={workTone[item.status]}>
                      {businessPlanLabels.work[item.status]}
                    </Badge>
                  </Td>
                  <Td nowrap>{item.category}</Td>
                  <Td>{item.title}</Td>
                  <Td nowrap muted>
                    {item.geography}
                  </Td>
                  <Td nowrap muted>
                    {item.primaryRevenue}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="X派生企画" count={catalog.xIdeas.length}>
        <Table columns={["ID", "状態", "企画", "型", "リンク契約"]}>
          {catalog.xIdeas.map((item) => (
            <Tr key={item.id}>
              <Td nowrap muted>
                {item.id}
              </Td>
              <Td nowrap>
                <Badge tone={workTone[item.status]}>
                  {businessPlanLabels.work[item.status]}
                </Badge>
              </Td>
              <Td>{item.title}</Td>
              <Td nowrap muted>
                {item.format}
              </Td>
              <Td nowrap muted>
                {item.linkPolicy}
              </Td>
            </Tr>
          ))}
        </Table>
      </Section>

      <Section title="M1 X初回15投稿" count={catalog.m1.xPosts.length}>
        <Table columns={["ID", "予定", "型", "企画", "content key"]}>
          {catalog.m1.xPosts.map((post) => (
            <Tr key={post.id}>
              <Td nowrap muted>{post.id}</Td>
              <Td nowrap muted>
                {post.scheduledAt.slice(0, 16).replace("T", " ")}
              </Td>
              <Td nowrap><Badge>{post.template}</Badge></Td>
              <Td>{post.title}</Td>
              <Td nowrap>
                <code className="text-[10px] text-console-muted">
                  {post.contentKey}
                </code>
              </Td>
            </Tr>
          ))}
        </Table>
      </Section>

      <Section title="note有料商品候補" count={catalog.noteProducts.length}>
        <Table columns={["ID", "状態", "時期", "企画", "仮説価格"]}>
          {catalog.noteProducts.map((item) => (
            <Tr key={item.id}>
              <Td nowrap muted>
                {item.id}
              </Td>
              <Td nowrap>
                <Badge tone={workTone[item.status]}>
                  {businessPlanLabels.work[item.status]}
                </Badge>
              </Td>
              <Td nowrap muted>
                M{item.month}
              </Td>
              <Td>{item.title}</Td>
              <Td nowrap muted>
                {item.priceYen.toLocaleString("ja-JP")}円
              </Td>
            </Tr>
          ))}
        </Table>
      </Section>

      <Section title="M1 note商品実装契約" count={catalog.m1.noteProducts.length}>
        <Table columns={["状態", "商品", "記事key", "読者成果", "公開条件"]}>
          {catalog.m1.noteProducts.map((product) => (
            <Tr key={product.id}>
              <Td nowrap>
                <Badge tone={workTone[product.status]}>
                  {businessPlanLabels.work[product.status]}
                </Badge>
              </Td>
              <Td>
                <div className="font-medium">{product.title}</div>
                <div className="text-[11px] text-console-muted">
                  {product.priceYen.toLocaleString("ja-JP")}円
                </div>
              </Td>
              <Td nowrap>
                <code className="text-[10px] text-console-muted">
                  {product.articleKey}
                </code>
              </Td>
              <Td>{product.readerOutcome}</Td>
              <Td>{product.readinessGate}</Td>
            </Tr>
          ))}
        </Table>
      </Section>
    </div>
  );
}
