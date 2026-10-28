/**
 * 事業計画 (packages/data-configs/src/business-plan/) の表示部品。
 * 旧 /strategy の1ページ (991 行) を、領域の正本 config/domains.json の割り振りに合わせて部品へ分けた (2026-10-27)。
 * 方針は /strategy、計画の詳細は /strategy/business-plan、Geo は /data/geo、X は /sns/geo-plan、note 商品は /product/note-plan が組み立てる。
 * 各部品は自分の見出し (Section / PanelCard) を持ち、ページは並べるだけにする (.claude/rules/admin-ui.md「ページの型と並べ方」)。
 */
import Link from "next/link";
import {
  BookOpenIcon,
  ChartNoAxesColumnIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileTextIcon,
  FlagIcon,
  GaugeIcon,
  HourglassIcon,
  LayersIcon,
  ListChecksIcon,
  MapIcon,
  MegaphoneIcon,
  RadioTowerIcon,
  ScaleIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  TargetIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { Cell, DataGrid, DataTable, PanelCard, Row, StatCard, StatusBadge } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, Freshness } from "@/components/ops/primitives";
import { businessPlanAdminData, businessPlanLabels } from "@/lib/server/business-plan";
import { hasError } from "@/lib/server/state-io";

const LINK = "text-xs font-medium underline-offset-4 hover:underline";

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

export type BusinessPlanData = ReturnType<typeof businessPlanAdminData>;

/** 事業計画の題目・ビジョン・重点テーマ */
export function PlanHeader({ data }: { data: BusinessPlanData }) {
  const { catalog } = data;
  return (
    <PanelCard
      title={catalog.tagline}
      icon={<TargetIcon />}
      description={`対象 ${catalog.source.planPeriod}`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="info">{catalog.id}</StatusBadge>
          <StatusBadge>{catalog.version}</StatusBadge>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="max-w-4xl text-sm text-muted-foreground">{catalog.vision}</p>
        <div className="flex flex-wrap gap-1.5">
          {catalog.priorityThemes.map((theme) => (
            <StatusBadge key={theme}>{theme}</StatusBadge>
          ))}
        </div>
      </div>
    </PanelCard>
  );
}

/** M1（2026年9月）実行ボードの集計と公開前チェック */
export function M1Summary({ data }: { data: BusinessPlanData }) {
  const { catalog } = data;
  return (
    <Section title="M1（2026年9月）の結果" note={catalog.m1.objective}>
      <Grid min="sm">
        <StatCard
          label="サイト画面"
          icon={<LayersIcon />}
          value={`${data.m1.routes.filter((route) => route.implemented).length}/${data.m1.routes.length}`}
          sub="ローカル実装 / noindex"
          tone={data.m1.routes.every((route) => route.implemented) ? "good" : "warn"}
        />
        {hasError(data.m1.x) ? (
          <StatCard label="X初回投稿" icon={<MegaphoneIcon />} value="読取失敗" tone="bad" />
        ) : (
          <StatCard
            label="X初回投稿"
            icon={<MegaphoneIcon />}
            value={`${data.m1.x.registered}/${data.m1.x.planned}`}
            sub={`入口 ${data.m1.x.geoRoleCounts.baseline ?? 0} / 空間横断 ${data.m1.x.geoRoleCounts["cross-analysis"] ?? 0} / 方法 ${data.m1.x.geoRoleCounts.method ?? 0} / 意思決定 ${data.m1.x.geoRoleCounts.decision ?? 0}`}
            tone={data.m1.x.registered === data.m1.x.planned ? "good" : "warn"}
          />
        )}
        <StatCard
          label="note商品"
          icon={<ShoppingBagIcon />}
          value={`${data.m1.note.registered}/${data.m1.note.planned}`}
          sub={`本文あり ${data.m1.note.withBody} / 公開 ${data.m1.note.published}`}
          tone={data.m1.note.registered === data.m1.note.planned ? "good" : "warn"}
        />
        <StatCard
          label="Geoイベント"
          icon={<RadioTowerIcon />}
          value={`${data.m1.events.codeMapped}/${data.m1.events.planned}`}
          sub={`GA4登録・反映待ち ${data.m1.events.registrationPending}`}
          tone={data.m1.events.registrationPending === 0 ? "good" : "warn"}
        />
      </Grid>

      {hasError(data.m1.x) ? <ErrorNote error={data.m1.x.error} /> : null}

      <Grid min="md">
        {data.m1.releaseChecks.map((check) => (
          <PanelCard
            key={check.id}
            title={check.label}
            icon={<ShieldCheckIcon />}
            action={<StatusBadge tone={releaseTone[check.status]}>{check.status === "pass" ? "PASS" : "待ち"}</StatusBadge>}
          >
            <p className="text-xs leading-relaxed text-muted-foreground">{check.detail}</p>
            {check.external ? <p className="mt-1 text-xs font-medium text-warning">外部操作</p> : null}
          </PanelCard>
        ))}
      </Grid>
    </Section>
  );
}

/** M1 の Geo 分析記事 (入力レイヤー・空間処理・配信 metric) */
export function GeoAnalyses({ data }: { data: BusinessPlanData }) {
  return (
    <Section title="分析記事" count={data.m1.analyses.length}>
      <DataTable columns={["分析記事", "分類", "入力レイヤー", "空間処理", "途中artifact", "配信metric", "47県snapshot", "状態"]}>
        {data.m1.analyses.map((analysis) => (
          <Row key={analysis.id}>
            <Cell>
              <div className="font-medium">{analysis.title}</div>
              <code className="font-mono text-xs text-muted-foreground">/geo/{analysis.slug}</code>
            </Cell>
            <Cell nowrap>
              <StatusBadge tone={analysis.analysisKind === "spatial-cross" ? "good" : "neutral"}>
                {analysis.analysisKind === "spatial-cross" ? "空間横断" : "入口"}
              </StatusBadge>
            </Cell>
            <Cell>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {analysis.sourceLayers.map((layer) => (
                  <div key={layer.id}>
                    {layer.label} · {layer.geometry} · {layer.usedInCalculation ? "計算入力" : "補助のみ"}
                  </div>
                ))}
              </div>
            </Cell>
            <Cell>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {analysis.spatialOperations.map((operation) => (
                  <div key={operation}>{operation}</div>
                ))}
              </div>
            </Cell>
            <Cell>
              {analysis.evidenceManifestReady ? (
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <div>
                    <StatusBadge tone={analysis.conservationChecks === 47 ? "good" : "bad"}>
                      {analysis.detailAreas}県 / 保存則{analysis.conservationChecks}件
                    </StatusBadge>
                  </div>
                  {analysis.evidenceStages.map((stage) => (
                    <div key={stage.id}>
                      {stage.label} · {stage.role}
                    </div>
                  ))}
                  <div>最大 {formatBytes(analysis.maxDetailBytes)}</div>
                </div>
              ) : (
                <StatusBadge tone="neutral">県別artifactなし</StatusBadge>
              )}
            </Cell>
            <Cell>
              <StatusBadge>{analysis.dataKind}</StatusBadge>
              <code className="mt-1 block font-mono text-xs text-muted-foreground">{analysis.dataKey}</code>
              <div className="mt-1 text-xs text-muted-foreground">{analysis.metricKeys.join(" / ")}</div>
            </Cell>
            <Cell nowrap>
              <StatusBadge tone={analysis.localSnapshotReady ? "good" : "bad"}>
                {analysis.localSnapshotReady ? `${analysis.expectedObservationCount}県・準備済み` : "ローカル未確認"}
              </StatusBadge>
            </Cell>
            <Cell nowrap>
              <StatusBadge tone={workTone[analysis.status]}>{businessPlanLabels.work[analysis.status]}</StatusBadge>
            </Cell>
          </Row>
        ))}
      </DataTable>
    </Section>
  );
}

/** Geo コンテンツ公開ライフサイクル */
export function GeoLifecycle({ data }: { data: BusinessPlanData }) {
  const { catalog } = data;
  const noteProductById = new Map(data.m1.note.products.map((product) => [product.id, product]));
  return (
    <Section
      title="Geoコンテンツ公開ライフサイクル"
      count={catalog.geoContentLifecycle.length}
      note="1分析をcanonical・テーマ・都道府県・ブログ・SNS・販売物へ接続。無料は結論と検証データ、有料は再現手順と加工済み成果物です。"
    >
      <DataTable columns={["分析", "無料canonical・データ", "テーマ・県別", "解説記事", "SNS", "販売物", "公開ゲート"]}>
        {catalog.geoContentLifecycle.map((content) => {
          const noteProduct = noteProductById.get(content.paid.productId);
          return (
            <Row key={content.contentId}>
              <Cell>
                <div className="font-medium">{content.title}</div>
                <code className="font-mono text-xs text-muted-foreground">{content.contentId}</code>
                <div className="mt-1 text-xs text-muted-foreground">
                  公開順 #{content.launch.order} · {content.launch.role}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{content.launch.audience}</div>
              </Cell>
              <Cell>
                <StatusBadge tone={lifecycleTone[content.free.status]}>{content.free.status}</StatusBadge>
                <code className="mt-1 block font-mono text-xs text-muted-foreground">{content.free.canonicalPath}</code>
                <code className="block font-mono text-xs text-muted-foreground">{content.free.dataPath}</code>
              </Cell>
              <Cell>
                <div className="text-xs text-muted-foreground">{content.themeKeys.join(" / ")}</div>
                <code className="mt-1 block font-mono text-xs text-muted-foreground">{content.free.areaPathPattern}</code>
              </Cell>
              <Cell>
                <StatusBadge tone={lifecycleTone[content.editorial.status]}>{content.editorial.status}</StatusBadge>
                <code className="mt-1 block font-mono text-xs text-muted-foreground">{content.editorial.blogPath}</code>
                <div className="mt-1 text-xs text-muted-foreground">{content.editorial.suggestedTitle}</div>
              </Cell>
              <Cell>
                <StatusBadge tone={lifecycleTone[content.social.status]}>{content.social.status}</StatusBadge>
                <code className="mt-1 block font-mono text-xs text-muted-foreground">{content.social.canonicalPolicy}</code>
              </Cell>
              <Cell>
                <StatusBadge tone={noteProduct?.hasBody ? "good" : lifecycleTone[content.paid.status]}>
                  {noteProduct?.hasBody ? "本文あり" : content.paid.status}
                </StatusBadge>
                <div className="mt-1 text-xs text-muted-foreground">
                  {content.paid.productId} · {content.paid.priceYen.toLocaleString("ja-JP")}円
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{content.paid.readerOutcome}</div>
              </Cell>
              <Cell>
                <StatusBadge tone={content.publicationGates.length >= 5 ? "good" : "warn"}>{content.publicationGates.length}条件</StatusBadge>
                <div className="mt-1 text-xs text-muted-foreground">{content.publicationGates.at(-1)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  評価 {content.launch.evaluationWindowDays}日 · {content.launch.stopCondition}
                </div>
              </Cell>
            </Row>
          );
        })}
      </DataTable>
    </Section>
  );
}

/** GIS 取得・ライセンスカタログ */
export function GisCatalog({ data }: { data: BusinessPlanData }) {
  return (
    <Section title="GIS取得・ライセンスカタログ">
      <a href="http://localhost:3000/geo/data-catalog" className={`${LINK} self-start`}>
        サイト表示を確認 →
      </a>
      {hasError(data.gisCatalog) ? (
        <ErrorNote error={data.gisCatalog.error} />
      ) : (
        <>
          <Grid min="sm">
            <StatCard label="公式候補" icon={<BookOpenIcon />} value={String(data.gisCatalog.summary.candidateCatalog)} />
            <StatCard label="stats47登録" icon={<ClipboardListIcon />} value={String(data.gisCatalog.summary.registered)} />
            <StatCard
              label="R2取得"
              icon={<DatabaseIcon />}
              value={`${data.gisCatalog.summary.r2Acquired}/${data.gisCatalog.summary.registered}`}
              tone={data.gisCatalog.summary.registeredMissingR2 === 0 ? "good" : "warn"}
            />
            <StatCard label="利用条件確認" icon={<ScaleIcon />} value={String(data.gisCatalog.summary.licenseReview)} tone="warn" />
            <StatCard
              label="自動取得残"
              icon={<HourglassIcon />}
              value={String(data.gisCatalog.summary.readyToAcquire)}
              tone={data.gisCatalog.summary.readyToAcquire === 0 ? "good" : "warn"}
            />
            <StatCard
              label="公開条件不整合"
              icon={<TriangleAlertIcon />}
              value={String(data.gisCatalog.summary.complianceMismatches)}
              tone={data.gisCatalog.summary.complianceMismatches === 0 ? "good" : "warn"}
            />
          </Grid>
          <DataGrid
            columns={[
              { id: "data", header: "ID・データ", sortable: true },
              { id: "shape", header: "形状・範囲", nowrap: true },
              { id: "license", header: "ライセンス", sortable: true, nowrap: true },
              { id: "state", header: "取得状態", sortable: true, nowrap: true },
              { id: "r2", header: "R2実体", nowrap: true },
              { id: "used", header: "GeoAI利用" },
            ]}
            rows={data.gisCatalog.items
              .filter((item) => item.registered)
              .map((item) => ({
                id: item.dataId,
                cells: [
                  <div key="d">
                    <div className="font-medium">{item.name}</div>
                    <code className="font-mono text-xs text-muted-foreground">{item.dataId}</code>
                  </div>,
                  <span key="s" className="text-muted-foreground">
                    {item.geometryType ?? "—"} / {item.coverage ?? "—"}
                  </span>,
                  item.license ?? "未確認",
                  <StatusBadge key="st" tone={gisStateTone(item.state)}>
                    {item.state}
                  </StatusBadge>,
                  <div key="r" className="text-muted-foreground">
                    {item.r2.fileCount > 0 ? `${item.r2.fileCount} files / ${formatBytes(item.r2.totalBytes)}` : "—"}
                    {item.compliance.publicMirrorPolicyMismatch ? <div className="text-xs font-semibold text-warning">公開条件要確認</div> : null}
                  </div>,
                  item.usedInAnalyses.join(" / ") || "未使用",
                ],
                sort: [item.name, null, item.license ?? null, item.state, null, null],
                search: `${item.name} ${item.dataId} ${item.state}`,
                facet: item.state,
                tone: item.compliance.publicMirrorPolicyMismatch ? ("warn" as const) : undefined,
              }))}
            searchPlaceholder="データ名・ID・状態で絞り込み"
          />
        </>
      )}
    </Section>
  );
}

/** X 初回15投稿の Geo 契約監査 */
export function M1XAudit({ data }: { data: BusinessPlanData }) {
  return (
    <Section title="X初回15投稿 · Geo契約監査">
      <Link href="/content/x" className={`${LINK} self-start`}>
        X読取画面で本文を確認 →
      </Link>
      {hasError(data.m1.x) ? null : (
        <>
          {data.m1.x.contractViolations.length > 0 ? (
            <ErrorNote error={`Geo契約違反: ${data.m1.x.contractViolations.join(" / ")}`} />
          ) : (
            <p className="text-xs text-positive">Geo契約 PASS — 入口3 / 空間横断9 / 方法2 / 意思決定1。ランキング画像の流用なし。</p>
          )}
          <DataTable columns={["投稿", "Geo分類", "分析・空間処理", "主張metric", "着地", "予定（JST）", "画像", "台帳"]}>
            {data.m1.x.posts.map((post) => (
              <Row key={post.contentKey}>
                <Cell>
                  <div className="font-medium">{post.title}</div>
                  <code className="font-mono text-xs text-muted-foreground">{post.contentKey}</code>
                </Cell>
                <Cell nowrap>
                  <StatusBadge tone={geoRoleTone[post.geoRole]}>{geoRoleLabel[post.geoRole]}</StatusBadge>
                  <div className="mt-1 text-xs text-muted-foreground">{post.template}</div>
                </Cell>
                <Cell>
                  <div className="text-xs text-muted-foreground">{post.sourceLayers.join(" × ")}</div>
                  <div className="mt-1 text-xs text-foreground">{post.spatialOperations.slice(0, 2).join(" → ")}</div>
                </Cell>
                <Cell>
                  <code className="font-mono text-xs text-muted-foreground">{post.claimMetricKey}</code>
                  <div className="mt-1">
                    <StatusBadge tone={post.geoContractOk ? "good" : "bad"}>{post.geoContractOk ? "契約PASS" : "契約違反"}</StatusBadge>
                  </div>
                </Cell>
                <Cell nowrap>
                  <code className="font-mono text-xs text-muted-foreground">{post.canonicalUrl}</code>
                </Cell>
                <Cell nowrap muted>
                  {formatSchedule(post.scheduledAt)}
                </Cell>
                <Cell nowrap>
                  <StatusBadge tone={post.mediaReady ? "good" : "bad"}>{post.mediaReady ? "準備済み" : "不足"}</StatusBadge>
                </Cell>
                <Cell nowrap>
                  <StatusBadge tone={postTone(post.registryStatus)}>{post.registryStatus ?? "未登録"}</StatusBadge>
                </Cell>
              </Row>
            ))}
          </DataTable>
        </>
      )}
    </Section>
  );
}

/** note 有料商品15件 */
export function M1NoteProducts({ data }: { data: BusinessPlanData }) {
  return (
    <Section title="note有料商品15件" count={data.m1.note.products.length}>
      <Link href="/content/note" className={`${LINK} self-start`}>
        note運用画面で本文を確認 →
      </Link>
      <DataTable columns={["商品", "価格", "本文", "カタログ", "制作ゲート"]}>
        {data.m1.note.products.map((product, index) => (
          <Row key={product.articleKey}>
            <Cell>
              <div className="font-medium">
                {index + 1}. {product.title}
              </div>
              <code className="font-mono text-xs text-muted-foreground">{product.articleKey}</code>
              <p className="mt-1 text-xs text-muted-foreground">{product.readerOutcome}</p>
            </Cell>
            <Cell nowrap>{product.priceYen.toLocaleString("ja-JP")}円</Cell>
            <Cell nowrap>
              <StatusBadge tone={product.hasBody ? "good" : "warn"}>{product.hasBody ? "本文あり" : "本文なし"}</StatusBadge>
            </Cell>
            <Cell nowrap>
              <StatusBadge tone={product.catalogStatus === "published" ? "good" : "neutral"}>{product.catalogStatus ?? "未登録"}</StatusBadge>
            </Cell>
            <Cell>
              <StatusBadge tone={workTone[product.productStatus]}>{businessPlanLabels.work[product.productStatus]}</StatusBadge>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{product.readinessGate}</p>
            </Cell>
          </Row>
        ))}
      </DataTable>
    </Section>
  );
}

/** Geo 計測イベント */
export function GeoEvents({ data }: { data: BusinessPlanData }) {
  return (
    <Section title="Geo計測イベント" count={data.m1.events.items.length}>
      <DataTable columns={["事業イベント", "GA4イベント", "計測状態", "残作業"]}>
        {data.m1.events.items.map((event) => (
          <Row key={event.id}>
            <Cell>
              <div className="font-medium">{event.label}</div>
              <code className="font-mono text-xs text-muted-foreground">{event.id}</code>
            </Cell>
            <Cell>
              <code className="font-mono text-xs">{event.canonicalEvent ?? "未設定"}</code>
            </Cell>
            <Cell nowrap>
              <StatusBadge tone={measurementTone[event.status]}>{businessPlanLabels.measurement[event.status]}</StatusBadge>
            </Cell>
            <Cell muted>{event.note}</Cell>
          </Row>
        ))}
      </DataTable>
    </Section>
  );
}

/** M1 の画面と作業 */
export function M1RoutesTasks({ data }: { data: BusinessPlanData }) {
  const { catalog } = data;
  return (
    <Grid min="lg">
      <PanelCard title={`M1 の画面 ${data.m1.routes.length} 件`} icon={<MapIcon />}>
        <DataTable columns={["画面", "実装", "検索", "計画状態"]}>
          {data.m1.routes.map((route) => (
            <Row key={route.path}>
              <Cell>
                <div className="font-medium">{route.title}</div>
                <code className="font-mono text-xs text-muted-foreground">{route.path}</code>
              </Cell>
              <Cell nowrap>
                <StatusBadge tone={route.implemented ? "good" : "bad"}>{route.implemented ? "ファイルあり" : "未実装"}</StatusBadge>
              </Cell>
              <Cell nowrap muted>
                {route.searchVisibility}
              </Cell>
              <Cell nowrap>
                <StatusBadge tone={workTone[route.status]}>{businessPlanLabels.work[route.status]}</StatusBadge>
              </Cell>
            </Row>
          ))}
        </DataTable>
      </PanelCard>

      <PanelCard title={`M1 の作業 ${catalog.m1.tasks.length} 件`} icon={<ListChecksIcon />}>
        <DataTable columns={["状態", "担当", "タスク", "完了条件"]}>
          {catalog.m1.tasks.map((task) => (
            <Row key={task.id}>
              <Cell nowrap>
                <StatusBadge tone={workTone[task.status]}>{businessPlanLabels.work[task.status]}</StatusBadge>
              </Cell>
              <Cell nowrap muted>
                {task.owner}
              </Cell>
              <Cell>
                <div className="font-medium">{task.title}</div>
                <code className="font-mono text-xs text-muted-foreground">{task.deliverablePath}</code>
              </Cell>
              <Cell>{task.doneWhen}</Cell>
            </Row>
          ))}
        </DataTable>
      </PanelCard>
    </Grid>
  );
}

/** M1 の公開ゲート */
export function M1ReleaseGates({ data }: { data: BusinessPlanData }) {
  const { catalog } = data;
  return (
    <PanelCard title="公開ゲート" icon={<FlagIcon />}>
      <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
        {catalog.m1.releaseGates.map((gate) => (
          <li key={gate}>• {gate}</li>
        ))}
      </ul>
    </PanelCard>
  );
}

/** 事業原則と収益レイヤー */
export function Principles({ data }: { data: BusinessPlanData }) {
  const { catalog } = data;
  return (
    <Grid min="lg">
      <PanelCard title="守る原則" icon={<ShieldCheckIcon />}>
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          {catalog.principles.map((principle) => (
            <li key={principle}>• {principle}</li>
          ))}
        </ul>
      </PanelCard>
      <PanelCard title="段階的な収益レイヤー" icon={<ChartNoAxesColumnIcon />}>
        <ol className="flex flex-col gap-1 text-sm text-muted-foreground">
          {catalog.revenueLayers.map((layer, index) => (
            <li key={layer}>
              {index + 1}. {layer}
            </li>
          ))}
        </ol>
      </PanelCard>
    </Grid>
  );
}

/** 実装可能性の概況 */
export function Feasibility({ data }: { data: BusinessPlanData }) {
  const { catalog } = data;
  return (
    <>
      <Grid min="sm">
        <StatCard label="原案の判断" icon={<ScaleIcon />} value={catalog.decisions.length} sub="25章を全件分類" />
        <StatCard
          label="コンテンツ候補"
          icon={<LayersIcon />}
          value={catalog.contentOpportunities.length}
          sub={`今すぐ実行 ${data.counts.readyContent}`}
        />
        <StatCard label="X / note商品" icon={<MegaphoneIcon />} value={`${catalog.xIdeas.length} / ${catalog.noteProducts.length}`} />
        <StatCard label="開始条件待ち" icon={<HourglassIcon />} value={data.counts.gatedInitiatives} tone="warn" />
        <StatCard
          label="未実装イベント"
          icon={<RadioTowerIcon />}
          value={data.counts.unmeasuredEvents}
          tone={data.counts.unmeasuredEvents ? "warn" : "good"}
        />
      </Grid>
      {hasError(data.state) ? (
        <ErrorNote error={`${data.state.error} — npm run business-plan:build-state で再生成`} />
      ) : (
        <p className="text-xs text-muted-foreground">
          運用state <Freshness iso={data.state.generatedAt} /> · {data.state.measurementWarning}
        </p>
      )}
    </>
  );
}

/** 最初の4系列 */
export function GeoPilots({ data }: { data: BusinessPlanData }) {
  const pilots = data.catalog.contentOpportunities
    .filter((item) => item.pilotOrder !== undefined)
    .sort((a, b) => (a.pilotOrder ?? 99) - (b.pilotOrder ?? 99));
  const pilotSpecs = new Map(data.catalog.pilotSpecs.map((spec) => [spec.contentId, spec]));
  return (
    <Section title="最初の4系列" count={pilots.length}>
      <Grid min="md">
        {pilots.map((item) => {
          const spec = pilotSpecs.get(item.id);
          return (
            <PanelCard
              key={item.id}
              title={item.title}
              icon={<GaugeIcon />}
              description={`第${item.pilotOrder}弾 · ${item.id}`}
              action={<StatusBadge tone={workTone[item.status]}>{businessPlanLabels.work[item.status]}</StatusBadge>}
            >
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <p>
                  {item.geography} · {item.primaryRevenue}
                </p>
                {spec ? (
                  <>
                    <p className="font-medium text-foreground">{spec.question}</p>
                    <p>data: {spec.dataRefs.map((ref) => `${ref.kind}:${ref.id}`).join(" / ")}</p>
                    <p>gate: {spec.qualityGates.join(" / ")}</p>
                  </>
                ) : null}
              </div>
            </PanelCard>
          );
        })}
      </Grid>
    </Section>
  );
}

/** 実行イニシアチブ */
export function Initiatives({ data }: { data: BusinessPlanData }) {
  const { catalog } = data;
  return (
    <Section title="実行イニシアチブ" count={catalog.initiatives.length}>
      <DataTable columns={["状態", "wave", "施策", "owner / skills", "開始条件"]}>
        {catalog.initiatives.map((item) => (
          <Row key={item.id}>
            <Cell nowrap>
              <StatusBadge tone={workTone[item.status]}>{businessPlanLabels.work[item.status]}</StatusBadge>
            </Cell>
            <Cell nowrap muted>
              {item.wave}
            </Cell>
            <Cell>
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-muted-foreground">{item.deliverables.join(" / ")}</div>
            </Cell>
            <Cell nowrap>
              <div>{item.owner}</div>
              <div className="text-xs text-muted-foreground">{item.skills.join(", ")}</div>
            </Cell>
            <Cell>{item.readinessGate}</Cell>
          </Row>
        ))}
      </DataTable>
    </Section>
  );
}

/** 25章の取込判断 */
export function Decisions({ data }: { data: BusinessPlanData }) {
  const { catalog } = data;
  const statuses = [...new Set(catalog.decisions.map((d) => d.status))];
  return (
    <Section title="25章の取込判断" count={catalog.decisions.length}>
      <DataGrid
        columns={[
          { id: "chapter", header: "章", sortable: true, nowrap: true },
          { id: "status", header: "判断", sortable: true, nowrap: true },
          { id: "title", header: "方針" },
          { id: "rationale", header: "適合理由" },
          { id: "owners", header: "owner", nowrap: true },
        ]}
        rows={catalog.decisions.map((item) => ({
          id: String(item.chapter),
          cells: [
            item.chapter,
            <StatusBadge key="s" tone={decisionTone[item.status]}>
              {businessPlanLabels.decision[item.status]}
            </StatusBadge>,
            <div key="t">
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-muted-foreground">{item.summary}</div>
            </div>,
            item.rationale,
            <span key="o" className="text-muted-foreground">
              {item.owners.join(", ")}
            </span>,
          ],
          sort: [item.chapter, item.status, null, null, null],
          search: `${item.chapter} ${item.title} ${item.summary}`,
          facet: item.status,
        }))}
        facets={statuses.map((s) => ({ value: s, label: businessPlanLabels.decision[s] }))}
        searchPlaceholder="章・方針で絞り込み"
      />
    </Section>
  );
}

/** KPI と記録契約 */
export function KpiContracts({ data }: { data: BusinessPlanData }) {
  const { catalog } = data;
  return (
    <Section title="KPIと記録契約" count={catalog.metrics.length}>
      <DataTable columns={["役割", "指標", "状態", "頻度 / source", "仮説目標", "注記"]}>
        {catalog.metrics.map((metric) => (
          <Row key={metric.id}>
            <Cell nowrap>
              <StatusBadge>{metric.role}</StatusBadge>
            </Cell>
            <Cell>
              <div className="font-medium">{metric.label}</div>
              <code className="font-mono text-xs text-muted-foreground">{metric.id}</code>
            </Cell>
            <Cell nowrap>
              <StatusBadge tone={measurementTone[metric.measurementStatus]}>{businessPlanLabels.measurement[metric.measurementStatus]}</StatusBadge>
            </Cell>
            <Cell nowrap muted>
              {metric.cadence}
              <br />
              {metric.source}
            </Cell>
            <Cell nowrap muted>
              {[metric.targetM3 && `M3 ${metric.targetM3}`, metric.targetM6 && `M6 ${metric.targetM6}`, metric.targetM12 && `M12 ${metric.targetM12}`]
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
  );
}

/** イベント実装・登録状況 */
export function EventContracts({ data }: { data: BusinessPlanData }) {
  const { catalog } = data;
  return (
    <Section title="イベント実装・登録状況" count={catalog.events.length}>
      <DataTable columns={["状態", "事業イベント", "実装イベント", "owner", "注記"]}>
        {catalog.events.map((event) => (
          <Row key={event.id}>
            <Cell nowrap>
              <StatusBadge tone={measurementTone[event.status]}>{businessPlanLabels.measurement[event.status]}</StatusBadge>
            </Cell>
            <Cell>
              <div>{event.label}</div>
              <code className="font-mono text-xs text-muted-foreground">{event.id}</code>
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
  );
}

/** 設計・方針 SSOT */
export function PolicyDocs({ data }: { data: BusinessPlanData }) {
  const { catalog } = data;
  return (
    <Section title="設計・方針SSOT" count={catalog.documents.length}>
      {hasError(data.documents) ? (
        <ErrorNote error={data.documents.error} />
      ) : (
        <Grid min="md">
          {data.documents.map((document) => (
            <PanelCard
              key={document.id}
              title={document.title}
              icon={<FileTextIcon />}
              description={document.role}
              action={document.status ? <StatusBadge>{document.status}</StatusBadge> : undefined}
            >
              <div className="flex flex-col gap-2">
                <code className="block break-all font-mono text-xs text-muted-foreground">{document.path}</code>
                <p className="text-xs text-muted-foreground">
                  owner: {document.owner} · updated: {document.updated ?? "不明"}
                </p>
                <Link className={`${LINK} self-start`} href={`/strategy/doc/${document.id}`}>
                  本文を読む →
                </Link>
              </div>
            </PanelCard>
          ))}
        </Grid>
      )}
    </Section>
  );
}

/** 全コンテンツカタログ */
export function ContentCatalog({ data }: { data: BusinessPlanData }) {
  const { catalog } = data;
  const statuses = [...new Set(catalog.contentOpportunities.map((item) => item.status))];
  return (
    <Section title="全コンテンツカタログ" count={catalog.contentOpportunities.length}>
      <p className="text-xs text-muted-foreground">
        100件は在庫であり制作ノルマではありません。実行可能4件以外は需要・データ・収益・更新工数のゲート後に昇格します。
      </p>
      <DataGrid
        columns={[
          { id: "id", header: "ID", sortable: true, nowrap: true },
          { id: "status", header: "状態", sortable: true, nowrap: true },
          { id: "category", header: "分類", sortable: true, nowrap: true },
          { id: "title", header: "企画", sortable: true },
          { id: "geography", header: "単位", sortable: true, nowrap: true },
          { id: "revenue", header: "主収益", sortable: true, nowrap: true },
        ]}
        rows={catalog.contentOpportunities.map((item) => ({
          id: item.id,
          cells: [
            <span key="i" className="text-muted-foreground">
              {item.id}
            </span>,
            <StatusBadge key="s" tone={workTone[item.status]}>
              {businessPlanLabels.work[item.status]}
            </StatusBadge>,
            item.category,
            item.title,
            <span key="g" className="text-muted-foreground">
              {item.geography}
            </span>,
            <span key="r" className="text-muted-foreground">
              {item.primaryRevenue}
            </span>,
          ],
          sort: [item.id, item.status, item.category, item.title, item.geography, item.primaryRevenue],
          search: `${item.id} ${item.title} ${item.category}`,
          facet: item.status,
        }))}
        facets={statuses.map((s) => ({ value: s, label: businessPlanLabels.work[s] }))}
        searchPlaceholder="ID・企画・分類で絞り込み"
      />
    </Section>
  );
}

/** X 派生企画 */
export function XIdeas({ data }: { data: BusinessPlanData }) {
  const { catalog } = data;
  const statuses = [...new Set(catalog.xIdeas.map((item) => item.status))];
  return (
    <Section title="X派生企画" count={catalog.xIdeas.length}>
      <DataGrid
        columns={[
          { id: "id", header: "ID", sortable: true, nowrap: true },
          { id: "status", header: "状態", sortable: true, nowrap: true },
          { id: "title", header: "企画", sortable: true },
          { id: "format", header: "型", sortable: true, nowrap: true },
          { id: "link", header: "リンク契約", nowrap: true },
        ]}
        rows={catalog.xIdeas.map((item) => ({
          id: item.id,
          cells: [
            <span key="i" className="text-muted-foreground">
              {item.id}
            </span>,
            <StatusBadge key="s" tone={workTone[item.status]}>
              {businessPlanLabels.work[item.status]}
            </StatusBadge>,
            item.title,
            <span key="f" className="text-muted-foreground">
              {item.format}
            </span>,
            <span key="l" className="text-muted-foreground">
              {item.linkPolicy}
            </span>,
          ],
          sort: [item.id, item.status, item.title, item.format, null],
          search: `${item.id} ${item.title} ${item.format}`,
          facet: item.status,
        }))}
        facets={statuses.map((s) => ({ value: s, label: businessPlanLabels.work[s] }))}
        searchPlaceholder="ID・企画・型で絞り込み"
      />
    </Section>
  );
}

/** M1 X 初回15投稿 */
export function M1XPosts({ data }: { data: BusinessPlanData }) {
  const { catalog } = data;
  return (
    <Section title="M1 X初回15投稿" count={catalog.m1.xPosts.length}>
      <DataTable columns={["ID", "予定", "型", "企画", "content key"]}>
        {catalog.m1.xPosts.map((post) => (
          <Row key={post.id}>
            <Cell nowrap muted>
              {post.id}
            </Cell>
            <Cell nowrap muted>
              {post.scheduledAt.slice(0, 16).replace("T", " ")}
            </Cell>
            <Cell nowrap>
              <StatusBadge>{post.template}</StatusBadge>
            </Cell>
            <Cell>{post.title}</Cell>
            <Cell nowrap>
              <code className="font-mono text-xs text-muted-foreground">{post.contentKey}</code>
            </Cell>
          </Row>
        ))}
      </DataTable>
    </Section>
  );
}

/** note 有料商品候補 */
export function NoteCandidates({ data }: { data: BusinessPlanData }) {
  const { catalog } = data;
  return (
    <Section title="note有料商品候補" count={catalog.noteProducts.length}>
      <DataTable columns={["ID", "状態", "時期", "企画", "仮説価格"]}>
        {catalog.noteProducts.map((item) => (
          <Row key={item.id}>
            <Cell nowrap muted>
              {item.id}
            </Cell>
            <Cell nowrap>
              <StatusBadge tone={workTone[item.status]}>{businessPlanLabels.work[item.status]}</StatusBadge>
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
  );
}

/** M1 note 商品実装契約 */
export function M1NoteContracts({ data }: { data: BusinessPlanData }) {
  const { catalog } = data;
  return (
    <Section title="M1 note商品実装契約" count={catalog.m1.noteProducts.length}>
      <DataTable columns={["状態", "商品", "記事key", "読者成果", "公開条件"]}>
        {catalog.m1.noteProducts.map((product) => (
          <Row key={product.id}>
            <Cell nowrap>
              <StatusBadge tone={workTone[product.status]}>{businessPlanLabels.work[product.status]}</StatusBadge>
            </Cell>
            <Cell>
              <div className="font-medium">{product.title}</div>
              <div className="text-xs text-muted-foreground">{product.priceYen.toLocaleString("ja-JP")}円</div>
            </Cell>
            <Cell nowrap>
              <code className="font-mono text-xs text-muted-foreground">{product.articleKey}</code>
            </Cell>
            <Cell>{product.readerOutcome}</Cell>
            <Cell>{product.readinessGate}</Cell>
          </Row>
        ))}
      </DataTable>
    </Section>
  );
}
