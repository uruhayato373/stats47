import Link from "next/link";

import { Cell, DataTable, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Section } from "@/components/layout-primitives";
import { ErrorNote, Freshness, PageHeading } from "@/components/ops/primitives";
import {
  businessPlanAdminData,
  businessPlanLabels,
} from "@/lib/server/business-plan";
import { hasError } from "@/lib/server/state-io";

import { Card, CardContent } from "@/components/ui/card";
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
const lifecycleTone = {
  ready: "good",
  draft: "info",
  gated: "warn",
} as const;
const geoRoleLabel = {
  baseline: "入口",
  "cross-analysis": "空間横断",
  method: "方法・限界",
  decision: "意思決定",
} as const;
const geoRoleTone = {
  baseline: "neutral",
  "cross-analysis": "good",
  method: "info",
  decision: "warn",
} as const;

function postTone(status: string | null) {
  if (status === "posted") return "good" as const;
  if (status === "scheduled") return "info" as const;
  if (status === "draft") return "neutral" as const;
  return "bad" as const;
}

function gisStateTone(status: string) {
  if (status === "acquired") return "good" as const;
  if (status === "analysis-source") return "info" as const;
  if (status === "ready-to-acquire" || status === "license-review") return "warn" as const;
  return "neutral" as const;
}

function formatBytes(value: number): string {
  if (value <= 0) return "—";
  return `${(value / 1024 / 1024).toFixed(value >= 100 * 1024 * 1024 ? 0 : 1)} MB`;
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
  const noteProductById = new Map(
    data.m1.note.products.map((product) => [product.id, product])
  );

  return (
    <div className="space-y-8">
      <PageHeading
        title="方針・事業計画"
        source="packages/data-configs/src/business-plan/ + 既存の設計・戦略SSOT"
      >
        <p className="max-w-4xl text-sm text-console-muted">
          原案を実行可能な正典へ変換した読み取りビューです。売上・アクセス目標は予測ではなく仮説、
          未計測は0ではありません。編集・生成・予約・投稿は管理画面から実行せず、担当agent/skillだけが行います。
        </p>
      </PageHeading>

      <Card className="gap-0 py-4"><CardContent className="px-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="info">{catalog.id}</StatusBadge>
          <StatusBadge>{catalog.version}</StatusBadge>
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
            <StatusBadge key={theme}>{theme}</StatusBadge>
          ))}
        </div>
      </CardContent></Card>

      <Section title="M1（2026年9月）実行ボード">
        <p className="text-[12px] text-console-muted">
          {catalog.m1.objective}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="サイト画面"
            value={`${data.m1.routes.filter((route) => route.implemented).length}/${data.m1.routes.length}`}
            sub="ローカル実装 / noindex"
            tone={data.m1.routes.every((route) => route.implemented) ? "good" : "warn"}
          />
          {hasError(data.m1.x) ? (
            <StatCard label="X初回投稿" value="読取失敗" tone="bad" />
          ) : (
            <StatCard
              label="X初回投稿"
              value={`${data.m1.x.registered}/${data.m1.x.planned}`}
              sub={`入口 ${data.m1.x.geoRoleCounts.baseline ?? 0} / 空間横断 ${data.m1.x.geoRoleCounts["cross-analysis"] ?? 0} / 方法 ${data.m1.x.geoRoleCounts.method ?? 0} / 意思決定 ${data.m1.x.geoRoleCounts.decision ?? 0}`}
              tone={data.m1.x.registered === data.m1.x.planned ? "good" : "warn"}
            />
          )}
          <StatCard
            label="note商品"
            value={`${data.m1.note.registered}/${data.m1.note.planned}`}
            sub={`本文あり ${data.m1.note.withBody} / 公開 ${data.m1.note.published}`}
            tone={data.m1.note.registered === data.m1.note.planned ? "good" : "warn"}
          />
          <StatCard
            label="Geoイベント"
            value={`${data.m1.events.codeMapped}/${data.m1.events.planned}`}
            sub={`GA4登録・反映待ち ${data.m1.events.registrationPending}`}
            tone={data.m1.events.registrationPending === 0 ? "good" : "warn"}
          />
        </div>

        {hasError(data.m1.x) ? <ErrorNote error={data.m1.x.error} /> : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {data.m1.releaseChecks.map((check) => (
            <Card key={check.id} className="gap-0 py-3"><CardContent className="px-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[12px] font-bold text-console-fg">
                  {check.label}
                </h3>
                <StatusBadge tone={releaseTone[check.status]}>
                  {check.status === "pass" ? "PASS" : "待ち"}
                </StatusBadge>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-console-muted">
                {check.detail}
              </p>
              {check.external ? (
                <p className="mt-1 text-[10px] font-medium text-console-warn">
                  外部操作
                </p>
              ) : null}
            </CardContent></Card>
          ))}
        </div>

        <div className="mt-4">
          <DataTable columns={["分析記事", "分類", "入力レイヤー", "空間処理", "途中artifact", "配信metric", "47県snapshot", "状態"]}>
            {data.m1.analyses.map((analysis) => (
              <Row key={analysis.id}>
                <Cell>
                  <div className="font-medium">{analysis.title}</div>
                  <code className="text-[10px] text-console-muted">
                    /geo/{analysis.slug}
                  </code>
                </Cell>
                <Cell nowrap>
                  <StatusBadge tone={analysis.analysisKind === "spatial-cross" ? "good" : "neutral"}>
                    {analysis.analysisKind === "spatial-cross" ? "空間横断" : "入口"}
                  </StatusBadge>
                </Cell>
                <Cell>
                  <div className="space-y-1 text-[10px] text-console-muted">
                    {analysis.sourceLayers.map((layer) => (
                      <div key={layer.id}>
                        {layer.label} · {layer.geometry} · {layer.usedInCalculation ? "計算入力" : "補助のみ"}
                      </div>
                    ))}
                  </div>
                </Cell>
                <Cell>
                  <div className="space-y-1 text-[10px] text-console-muted">
                    {analysis.spatialOperations.map((operation) => (
                      <div key={operation}>{operation}</div>
                    ))}
                  </div>
                </Cell>
                <Cell>
                  {analysis.evidenceManifestReady ? (
                    <div className="space-y-1 text-[10px] text-console-muted">
                      <StatusBadge tone={analysis.conservationChecks === 47 ? "good" : "bad"}>
                        {analysis.detailAreas}県 / 保存則{analysis.conservationChecks}件
                      </StatusBadge>
                      {analysis.evidenceStages.map((stage) => (
                        <div key={stage.id}>{stage.label} · {stage.role}</div>
                      ))}
                      <div>最大 {formatBytes(analysis.maxDetailBytes)}</div>
                    </div>
                  ) : (
                    <StatusBadge tone="neutral">県別artifactなし</StatusBadge>
                  )}
                </Cell>
                <Cell>
                  <StatusBadge>{analysis.dataKind}</StatusBadge>
                  <code className="mt-1 block text-[10px] text-console-muted">
                    {analysis.dataKey}
                  </code>
                  <div className="mt-1 text-[10px] text-console-muted">
                    {analysis.metricKeys.join(" / ")}
                  </div>
                </Cell>
                <Cell nowrap>
                  <StatusBadge tone={analysis.localSnapshotReady ? "good" : "bad"}>
                    {analysis.localSnapshotReady
                      ? `${analysis.expectedObservationCount}県・準備済み`
                      : "ローカル未確認"}
                  </StatusBadge>
                </Cell>
                <Cell nowrap>
                  <StatusBadge tone={workTone[analysis.status]}>
                    {businessPlanLabels.work[analysis.status]}
                  </StatusBadge>
                </Cell>
              </Row>
            ))}
          </DataTable>
        </div>

        <div className="mt-6">
          <div className="mb-2">
            <h3 className="text-[13px] font-bold text-console-fg">
              Geoコンテンツ公開ライフサイクル
            </h3>
            <p className="mt-1 text-[11px] text-console-muted">
              1分析をcanonical・テーマ・都道府県・ブログ・SNS・販売物へ接続。無料は結論と検証データ、有料は再現手順と加工済み成果物です。
            </p>
          </div>
          <DataTable columns={["分析", "無料canonical・データ", "テーマ・県別", "解説記事", "SNS", "販売物", "公開ゲート"]}>
            {catalog.geoContentLifecycle.map((content) => {
              const noteProduct = noteProductById.get(content.paid.productId);
              return (
                <Row key={content.contentId}>
                  <Cell>
                    <div className="font-medium">{content.title}</div>
                    <code className="text-[10px] text-console-muted">{content.contentId}</code>
                    <div className="mt-1 text-[10px] text-console-muted">
                      公開順 #{content.launch.order} · {content.launch.role}
                    </div>
                    <div className="mt-1 text-[10px] text-console-muted">{content.launch.audience}</div>
                  </Cell>
                  <Cell>
                    <StatusBadge tone={lifecycleTone[content.free.status]}>{content.free.status}</StatusBadge>
                    <code className="mt-1 block text-[10px] text-console-muted">{content.free.canonicalPath}</code>
                    <code className="block text-[10px] text-console-muted">{content.free.dataPath}</code>
                  </Cell>
                  <Cell>
                    <div className="text-[10px] text-console-muted">{content.themeKeys.join(" / ")}</div>
                    <code className="mt-1 block text-[10px] text-console-muted">{content.free.areaPathPattern}</code>
                  </Cell>
                  <Cell>
                    <StatusBadge tone={lifecycleTone[content.editorial.status]}>{content.editorial.status}</StatusBadge>
                    <code className="mt-1 block text-[10px] text-console-muted">{content.editorial.blogPath}</code>
                    <div className="mt-1 text-[10px] text-console-muted">{content.editorial.suggestedTitle}</div>
                  </Cell>
                  <Cell>
                    <StatusBadge tone={lifecycleTone[content.social.status]}>{content.social.status}</StatusBadge>
                    <code className="mt-1 block text-[10px] text-console-muted">{content.social.canonicalPolicy}</code>
                  </Cell>
                  <Cell>
                    <StatusBadge tone={noteProduct?.hasBody ? "good" : lifecycleTone[content.paid.status]}>
                      {noteProduct?.hasBody ? "本文あり" : content.paid.status}
                    </StatusBadge>
                    <div className="mt-1 text-[10px] text-console-muted">
                      {content.paid.productId} · {content.paid.priceYen.toLocaleString("ja-JP")}円
                    </div>
                    <div className="mt-1 text-[10px] text-console-muted">{content.paid.readerOutcome}</div>
                  </Cell>
                  <Cell>
                    <StatusBadge tone={content.publicationGates.length >= 5 ? "good" : "warn"}>
                      {content.publicationGates.length}条件
                    </StatusBadge>
                    <div className="mt-1 text-[10px] text-console-muted">
                      {content.publicationGates.at(-1)}
                    </div>
                    <div className="mt-1 text-[10px] text-console-muted">
                      評価 {content.launch.evaluationWindowDays}日 · {content.launch.stopCondition}
                    </div>
                  </Cell>
                </Row>
              );
            })}
          </DataTable>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-[13px] font-bold text-console-fg">
              GIS取得・ライセンスカタログ
            </h3>
            <a
              href="http://localhost:3000/geo/data-catalog"
              className="text-[11px] font-medium text-console-accent hover:underline"
            >
              サイト表示を確認 →
            </a>
          </div>
          {hasError(data.gisCatalog) ? (
            <ErrorNote error={data.gisCatalog.error} />
          ) : (
            <>
              <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
                <StatCard label="公式候補" value={String(data.gisCatalog.summary.candidateCatalog)} />
                <StatCard label="stats47登録" value={String(data.gisCatalog.summary.registered)} />
                <StatCard
                  label="R2取得"
                  value={`${data.gisCatalog.summary.r2Acquired}/${data.gisCatalog.summary.registered}`}
                  tone={data.gisCatalog.summary.registeredMissingR2 === 0 ? "good" : "warn"}
                />
                <StatCard label="利用条件確認" value={String(data.gisCatalog.summary.licenseReview)} tone="warn" />
                <StatCard
                  label="自動取得残"
                  value={String(data.gisCatalog.summary.readyToAcquire)}
                  tone={data.gisCatalog.summary.readyToAcquire === 0 ? "good" : "warn"}
                />
                <StatCard
                  label="公開条件不整合"
                  value={String(data.gisCatalog.summary.complianceMismatches)}
                  tone={data.gisCatalog.summary.complianceMismatches === 0 ? "good" : "warn"}
                />
              </div>
              <DataTable columns={["ID・データ", "形状・範囲", "ライセンス", "取得状態", "R2実体", "GeoAI利用"]}>
                {data.gisCatalog.items.filter((item) => item.registered).map((item) => (
                  <Row key={item.dataId}>
                    <Cell>
                      <div className="font-medium">{item.name}</div>
                      <code className="text-[10px] text-console-muted">{item.dataId}</code>
                    </Cell>
                    <Cell nowrap muted>{item.geometryType ?? "—"} / {item.coverage ?? "—"}</Cell>
                    <Cell nowrap>{item.license ?? "未確認"}</Cell>
                    <Cell nowrap>
                      <StatusBadge tone={gisStateTone(item.state)}>{item.state}</StatusBadge>
                    </Cell>
                    <Cell nowrap muted>
                      {item.r2.fileCount > 0
                        ? `${item.r2.fileCount} files / ${formatBytes(item.r2.totalBytes)}`
                        : "—"}
                      {item.compliance.publicMirrorPolicyMismatch ? (
                        <div className="text-[10px] font-semibold text-console-warn">公開条件要確認</div>
                      ) : null}
                    </Cell>
                    <Cell>{item.usedInAnalyses.join(" / ") || "未使用"}</Cell>
                  </Row>
                ))}
              </DataTable>
            </>
          )}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-[13px] font-bold text-console-fg">
              X初回15投稿 · Geo契約監査
            </h3>
            <Link
              href="/content/x"
              className="text-[11px] font-medium text-console-accent hover:underline"
            >
              X読取画面で本文を確認 →
            </Link>
          </div>
          {hasError(data.m1.x) ? null : (
            <>
            {data.m1.x.contractViolations.length > 0 ? (
              <ErrorNote error={`Geo契約違反: ${data.m1.x.contractViolations.join(" / ")}`} />
            ) : (
              <p className="mb-2 text-[11px] text-console-good">
                Geo契約 PASS — 入口3 / 空間横断9 / 方法2 / 意思決定1。ランキング画像の流用なし。
              </p>
            )}
            <DataTable columns={["投稿", "Geo分類", "分析・空間処理", "主張metric", "着地", "予定（JST）", "画像", "台帳"]}>
              {data.m1.x.posts.map((post) => (
                <Row key={post.contentKey}>
                  <Cell>
                    <div className="font-medium">{post.title}</div>
                    <code className="text-[10px] text-console-muted">
                      {post.contentKey}
                    </code>
                  </Cell>
                  <Cell nowrap>
                    <StatusBadge tone={geoRoleTone[post.geoRole]}>
                      {geoRoleLabel[post.geoRole]}
                    </StatusBadge>
                    <div className="mt-1 text-[10px] text-console-muted">{post.template}</div>
                  </Cell>
                  <Cell>
                    <div className="text-[10px] text-console-muted">
                      {post.sourceLayers.join(" × ")}
                    </div>
                    <div className="mt-1 text-[10px] text-console-fg">
                      {post.spatialOperations.slice(0, 2).join(" → ")}
                    </div>
                  </Cell>
                  <Cell>
                    <code className="text-[10px] text-console-muted">{post.claimMetricKey}</code>
                    <div className="mt-1">
                      <StatusBadge tone={post.geoContractOk ? "good" : "bad"}>
                        {post.geoContractOk ? "契約PASS" : "契約違反"}
                      </StatusBadge>
                    </div>
                  </Cell>
                  <Cell nowrap>
                    <code className="text-[10px] text-console-muted">{post.canonicalUrl}</code>
                  </Cell>
                  <Cell nowrap muted>{formatSchedule(post.scheduledAt)}</Cell>
                  <Cell nowrap>
                    <StatusBadge tone={post.mediaReady ? "good" : "bad"}>
                      {post.mediaReady ? "準備済み" : "不足"}
                    </StatusBadge>
                  </Cell>
                  <Cell nowrap>
                    <StatusBadge tone={postTone(post.registryStatus)}>
                      {post.registryStatus ?? "未登録"}
                    </StatusBadge>
                  </Cell>
                </Row>
              ))}
            </DataTable>
            </>
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
          <DataTable columns={["商品", "価格", "本文", "カタログ", "制作ゲート"]}>
            {data.m1.note.products.map((product, index) => (
              <Row key={product.articleKey}>
                <Cell>
                  <div className="font-medium">
                    {index + 1}. {product.title}
                  </div>
                  <code className="text-[10px] text-console-muted">
                    {product.articleKey}
                  </code>
                  <p className="mt-1 text-[10px] text-console-muted">
                    {product.readerOutcome}
                  </p>
                </Cell>
                <Cell nowrap>{product.priceYen.toLocaleString("ja-JP")}円</Cell>
                <Cell nowrap>
                  <StatusBadge tone={product.hasBody ? "good" : "warn"}>
                    {product.hasBody ? "本文あり" : "本文なし"}
                  </StatusBadge>
                </Cell>
                <Cell nowrap>
                  <StatusBadge tone={product.catalogStatus === "published" ? "good" : "neutral"}>
                    {product.catalogStatus ?? "未登録"}
                  </StatusBadge>
                </Cell>
                <Cell>
                  <StatusBadge tone={workTone[product.productStatus]}>
                    {businessPlanLabels.work[product.productStatus]}
                  </StatusBadge>
                  <p className="mt-1 text-[10px] leading-relaxed text-console-muted">
                    {product.readinessGate}
                  </p>
                </Cell>
              </Row>
            ))}
          </DataTable>
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-[13px] font-bold text-console-fg">
            Geo計測イベント
          </h3>
          <DataTable columns={["事業イベント", "GA4イベント", "計測状態", "残作業"]}>
            {data.m1.events.items.map((event) => (
              <Row key={event.id}>
                <Cell>
                  <div className="font-medium">{event.label}</div>
                  <code className="text-[10px] text-console-muted">{event.id}</code>
                </Cell>
                <Cell><code className="text-[10px]">{event.canonicalEvent ?? "未設定"}</code></Cell>
                <Cell nowrap>
                  <StatusBadge tone={measurementTone[event.status]}>
                    {businessPlanLabels.measurement[event.status]}
                  </StatusBadge>
                </Cell>
                <Cell muted>{event.note}</Cell>
              </Row>
            ))}
          </DataTable>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <DataTable columns={["画面", "実装", "検索", "計画状態"]}>
            {data.m1.routes.map((route) => (
              <Row key={route.path}>
                <Cell>
                  <div className="font-medium">{route.title}</div>
                  <code className="text-[11px] text-console-muted">{route.path}</code>
                </Cell>
                <Cell nowrap>
                  <StatusBadge tone={route.implemented ? "good" : "bad"}>
                    {route.implemented ? "ファイルあり" : "未実装"}
                  </StatusBadge>
                </Cell>
                <Cell nowrap muted>{route.searchVisibility}</Cell>
                <Cell nowrap>
                  <StatusBadge tone={workTone[route.status]}>
                    {businessPlanLabels.work[route.status]}
                  </StatusBadge>
                </Cell>
              </Row>
            ))}
          </DataTable>

          <DataTable columns={["状態", "担当", "タスク", "完了条件"]}>
            {catalog.m1.tasks.map((task) => (
              <Row key={task.id}>
                <Cell nowrap>
                  <StatusBadge tone={workTone[task.status]}>
                    {businessPlanLabels.work[task.status]}
                  </StatusBadge>
                </Cell>
                <Cell nowrap muted>{task.owner}</Cell>
                <Cell>
                  <div className="font-medium">{task.title}</div>
                  <code className="text-[10px] text-console-muted">{task.deliverablePath}</code>
                </Cell>
                <Cell>{task.doneWhen}</Cell>
              </Row>
            ))}
          </DataTable>
        </div>

        <Card className="mt-4 gap-0 py-3"><CardContent className="px-3">
          <h3 className="text-[12px] font-bold text-console-fg">公開ゲート</h3>
          <ul className="mt-2 space-y-1 text-[11px] text-console-muted">
            {catalog.m1.releaseGates.map((gate) => (
              <li key={gate}>• {gate}</li>
            ))}
          </ul>
        </CardContent></Card>
      </Section>

      <Section title="事業原則と収益レイヤー">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="gap-0 py-3"><CardContent className="px-3">
            <h3 className="text-[12px] font-bold text-console-fg">守る原則</h3>
            <ul className="mt-2 space-y-1 text-[12px] text-console-muted">
              {catalog.principles.map((principle) => (
                <li key={principle}>• {principle}</li>
              ))}
            </ul>
          </CardContent></Card>
          <Card className="gap-0 py-3"><CardContent className="px-3">
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
          </CardContent></Card>
        </div>
      </Section>

      <Section title="実装可能性の概況">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="原案の判断"
            value={catalog.decisions.length}
            sub="25章を全件分類"
          />
          <StatCard
            label="コンテンツ候補"
            value={catalog.contentOpportunities.length}
            sub={`今すぐ実行 ${data.counts.readyContent}`}
          />
          <StatCard
            label="X / note商品"
            value={`${catalog.xIdeas.length} / ${catalog.noteProducts.length}`}
          />
          <StatCard
            label="開始条件待ち"
            value={data.counts.gatedInitiatives}
            tone="warn"
          />
          <StatCard
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
            <Card key={item.id} className="gap-0 py-3"><CardContent className="px-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-console-muted">
                  第{item.pilotOrder}弾 · {item.id}
                </span>
                <StatusBadge tone={workTone[item.status]}>
                  {businessPlanLabels.work[item.status]}
                </StatusBadge>
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
            </CardContent></Card>
          ))}
        </div>
      </Section>

      <Section title="実行イニシアチブ" count={catalog.initiatives.length}>
        <DataTable columns={["状態", "wave", "施策", "owner / skills", "開始条件"]}>
          {catalog.initiatives.map((item) => (
            <Row key={item.id}>
              <Cell nowrap>
                <StatusBadge tone={workTone[item.status]}>
                  {businessPlanLabels.work[item.status]}
                </StatusBadge>
              </Cell>
              <Cell nowrap muted>
                {item.wave}
              </Cell>
              <Cell>
                <div className="font-medium">{item.title}</div>
                <div className="text-[11px] text-console-muted">
                  {item.deliverables.join(" / ")}
                </div>
              </Cell>
              <Cell nowrap>
                <div>{item.owner}</div>
                <div className="text-[11px] text-console-muted">
                  {item.skills.join(", ")}
                </div>
              </Cell>
              <Cell>{item.readinessGate}</Cell>
            </Row>
          ))}
        </DataTable>
      </Section>

      <Section title="25章の取込判断" count={catalog.decisions.length}>
        <DataTable columns={["章", "判断", "方針", "適合理由", "owner"]}>
          {catalog.decisions.map((item) => (
            <Row key={item.chapter}>
              <Cell nowrap>{item.chapter}</Cell>
              <Cell nowrap>
                <StatusBadge tone={decisionTone[item.status]}>
                  {businessPlanLabels.decision[item.status]}
                </StatusBadge>
              </Cell>
              <Cell>
                <div className="font-medium">{item.title}</div>
                <div className="text-[11px] text-console-muted">
                  {item.summary}
                </div>
              </Cell>
              <Cell>{item.rationale}</Cell>
              <Cell nowrap muted>
                {item.owners.join(", ")}
              </Cell>
            </Row>
          ))}
        </DataTable>
      </Section>

      <Section title="KPIと記録契約" count={catalog.metrics.length}>
        <DataTable
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
            <Row key={metric.id}>
              <Cell nowrap>
                <StatusBadge>{metric.role}</StatusBadge>
              </Cell>
              <Cell>
                <div className="font-medium">{metric.label}</div>
                <code className="text-[11px] text-console-muted">
                  {metric.id}
                </code>
              </Cell>
              <Cell nowrap>
                <StatusBadge tone={measurementTone[metric.measurementStatus]}>
                  {businessPlanLabels.measurement[metric.measurementStatus]}
                </StatusBadge>
              </Cell>
              <Cell nowrap muted>
                {metric.cadence}
                <br />
                {metric.source}
              </Cell>
              <Cell nowrap muted>
                {[
                  metric.targetM3 && `M3 ${metric.targetM3}`,
                  metric.targetM6 && `M6 ${metric.targetM6}`,
                  metric.targetM12 && `M12 ${metric.targetM12}`,
                ]
                  .filter(Boolean)
                  .join(" / ") || "—"}
                <br />
                {metric.unit}
              </Cell>
              <Cell>{metric.note}</Cell>
            </Row>
          ))}
        </DataTable>
      </Section>

      <Section title="イベント実装・登録状況" count={catalog.events.length}>
        <DataTable
          columns={["状態", "事業イベント", "実装イベント", "owner", "注記"]}
        >
          {catalog.events.map((event) => (
            <Row key={event.id}>
              <Cell nowrap>
                <StatusBadge tone={measurementTone[event.status]}>
                  {businessPlanLabels.measurement[event.status]}
                </StatusBadge>
              </Cell>
              <Cell>
                <div>{event.label}</div>
                <code className="text-[11px] text-console-muted">
                  {event.id}
                </code>
              </Cell>
              <Cell nowrap muted>
                {event.canonicalEvent ?? "—"}
              </Cell>
              <Cell nowrap muted>
                {event.owner}
              </Cell>
              <Cell>{event.note}</Cell>
            </Row>
          ))}
        </DataTable>
      </Section>

      <Section title="設計・方針SSOT" count={catalog.documents.length}>
        {hasError(data.documents) ? (
          <ErrorNote error={data.documents.error} />
        ) : (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {data.documents.map((document) => (
              <Card key={document.id} className="gap-0 py-3"><CardContent className="px-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-console-fg">
                    {document.title}
                  </h3>
                  {document.status ? <StatusBadge>{document.status}</StatusBadge> : null}
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
              </CardContent></Card>
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
        <DataTable className="max-h-[34rem] overflow-y-auto" columns={["ID", "状態", "分類", "企画", "単位", "主収益"]}>
          {catalog.contentOpportunities.map((item) => (
                <Row key={item.id}>
                  <Cell nowrap muted>
                    {item.id}
                  </Cell>
                  <Cell nowrap>
                    <StatusBadge tone={workTone[item.status]}>
                      {businessPlanLabels.work[item.status]}
                    </StatusBadge>
                  </Cell>
                  <Cell nowrap>{item.category}</Cell>
                  <Cell>{item.title}</Cell>
                  <Cell nowrap muted>
                    {item.geography}
                  </Cell>
                  <Cell nowrap muted>
                    {item.primaryRevenue}
                  </Cell>
                </Row>
              ))}
        </DataTable>
      </Section>

      <Section title="X派生企画" count={catalog.xIdeas.length}>
        <DataTable columns={["ID", "状態", "企画", "型", "リンク契約"]}>
          {catalog.xIdeas.map((item) => (
            <Row key={item.id}>
              <Cell nowrap muted>
                {item.id}
              </Cell>
              <Cell nowrap>
                <StatusBadge tone={workTone[item.status]}>
                  {businessPlanLabels.work[item.status]}
                </StatusBadge>
              </Cell>
              <Cell>{item.title}</Cell>
              <Cell nowrap muted>
                {item.format}
              </Cell>
              <Cell nowrap muted>
                {item.linkPolicy}
              </Cell>
            </Row>
          ))}
        </DataTable>
      </Section>

      <Section title="M1 X初回15投稿" count={catalog.m1.xPosts.length}>
        <DataTable columns={["ID", "予定", "型", "企画", "content key"]}>
          {catalog.m1.xPosts.map((post) => (
            <Row key={post.id}>
              <Cell nowrap muted>{post.id}</Cell>
              <Cell nowrap muted>
                {post.scheduledAt.slice(0, 16).replace("T", " ")}
              </Cell>
              <Cell nowrap><StatusBadge>{post.template}</StatusBadge></Cell>
              <Cell>{post.title}</Cell>
              <Cell nowrap>
                <code className="text-[10px] text-console-muted">
                  {post.contentKey}
                </code>
              </Cell>
            </Row>
          ))}
        </DataTable>
      </Section>

      <Section title="note有料商品候補" count={catalog.noteProducts.length}>
        <DataTable columns={["ID", "状態", "時期", "企画", "仮説価格"]}>
          {catalog.noteProducts.map((item) => (
            <Row key={item.id}>
              <Cell nowrap muted>
                {item.id}
              </Cell>
              <Cell nowrap>
                <StatusBadge tone={workTone[item.status]}>
                  {businessPlanLabels.work[item.status]}
                </StatusBadge>
              </Cell>
              <Cell nowrap muted>
                M{item.month}
              </Cell>
              <Cell>{item.title}</Cell>
              <Cell nowrap muted>
                {item.priceYen.toLocaleString("ja-JP")}円
              </Cell>
            </Row>
          ))}
        </DataTable>
      </Section>

      <Section title="M1 note商品実装契約" count={catalog.m1.noteProducts.length}>
        <DataTable columns={["状態", "商品", "記事key", "読者成果", "公開条件"]}>
          {catalog.m1.noteProducts.map((product) => (
            <Row key={product.id}>
              <Cell nowrap>
                <StatusBadge tone={workTone[product.status]}>
                  {businessPlanLabels.work[product.status]}
                </StatusBadge>
              </Cell>
              <Cell>
                <div className="font-medium">{product.title}</div>
                <div className="text-[11px] text-console-muted">
                  {product.priceYen.toLocaleString("ja-JP")}円
                </div>
              </Cell>
              <Cell nowrap>
                <code className="text-[10px] text-console-muted">
                  {product.articleKey}
                </code>
              </Cell>
              <Cell>{product.readerOutcome}</Cell>
              <Cell>{product.readinessGate}</Cell>
            </Row>
          ))}
        </DataTable>
      </Section>
    </div>
  );
}
