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
    </div>
  );
}
