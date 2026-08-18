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
import { adsSummary } from "@/lib/server/ads";
import { hasError } from "@/lib/server/state-io";

export const dynamic = "force-dynamic";
export const metadata = { title: "アフィリエイト運用 — stats47 admin" };

function gateTone(status: string) {
  if (status === "ready" || status === "ok") return "good" as const;
  if (status === "blocked") return "bad" as const;
  return "warn" as const;
}

export default function AdsPage() {
  const d = adsSummary();

  return (
    <div className="space-y-8">
      <PageHeading title="アフィリエイト運用" source=".claude/state/ads/" />

      {/* ゲートと推奨アクション */}
      {hasError(d.operations) ? (
        <ErrorNote error={d.operations.error} />
      ) : (
        <>
          <Section title="ゲート">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label="計測ゲート"
                value={d.operations.measurementGate.status}
                tone={gateTone(d.operations.measurementGate.status)}
                sub={d.operations.measurementGate.reasons.join(" / ") || "—"}
              />
              <Stat
                label="公開ゲート"
                value={d.operations.publishGate.status}
                tone={gateTone(d.operations.publishGate.status)}
                sub={d.operations.publishGate.reasons.join(" / ") || "—"}
              />
              <Stat
                label="GA4 (28日)"
                value={`${d.operations.ga4Totals?.impressions.toLocaleString() ?? "—"} imp`}
                sub={`clicks ${d.operations.ga4Totals?.clicks ?? "—"} / CTR ${
                  d.operations.ga4Totals ? (d.operations.ga4Totals.ctr * 100).toFixed(3) + "%" : "—"
                }`}
              />
              <Stat
                label="鮮度"
                value={<Freshness iso={d.operations.generatedAt} />}
                sub={`在庫 ${d.operations.freshness.inventoryDays ?? "—"}日前 / GA4 ${
                  d.operations.freshness.ga4Days ?? "—"
                }日前`}
              />
            </div>
          </Section>

          {d.operations.recommendedActions.length > 0 ? (
            <Section title="推奨アクション" count={d.operations.recommendedActions.length}>
              <ul className="space-y-1.5">
                {d.operations.recommendedActions.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-md border border-console-warn/40 bg-console-warn/10 px-3 py-2 text-sm"
                  >
                    <div className="font-medium text-console-warn">{a.id}</div>
                    <div className="text-console-fg">{a.reason}</div>
                    <code className="mt-1 block break-all text-[11px] text-console-muted">
                      {a.command}
                    </code>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section title="クリエイティブ実験" count={d.operations.experiments.length}>
            {d.operations.experiments.length === 0 ? (
              <p className="text-sm text-console-muted">実験はありません。</p>
            ) : (
              <Table columns={["ID", "種別", "状態", "開始", "経過", "標本", "variant"]}>
                {d.operations.experiments.map((e) => (
                  <Tr key={e.experimentId}>
                    <Td nowrap>{e.experimentId}</Td>
                    <Td nowrap muted>{e.kind}</Td>
                    <Td nowrap>
                      <Badge tone={e.bucket === "readyToDecide" ? "info" : "neutral"}>
                        {e.bucket}
                      </Badge>
                    </Td>
                    <Td nowrap muted>{e.startedAt ?? "—"}</Td>
                    <Td nowrap muted>{e.daysElapsed !== null ? `${e.daysElapsed}日` : "—"}</Td>
                    <Td nowrap>
                      {e.sampleReached === null ? (
                        "—"
                      ) : (
                        <Badge tone={e.sampleReached ? "good" : "warn"}>
                          {e.sampleReached ? "到達" : "未達"}
                        </Badge>
                      )}
                    </Td>
                    <Td muted>
                      {e.variants
                        .map((v) => `${v.variantId}: ${v.impressions}imp/${v.clicks}clk`)
                        .join(" · ") || "—"}
                    </Td>
                  </Tr>
                ))}
              </Table>
            )}
          </Section>
        </>
      )}

      {/* 在庫 */}
      <Section title="在庫">
        {hasError(d.inventory) ? (
          <ErrorNote error={d.inventory.error} />
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="広告エントリ" value={d.inventory.totals.entries} sub={`active ${d.inventory.totals.active}`} />
              <Stat label="広告主" value={d.inventory.totals.uniqueAdvertisers} />
              <Stat
                label="vertical カバー"
                value={`${d.inventory.coverage.verticalsCovered}/${d.inventory.coverage.verticalsTotal}`}
                tone={d.inventory.coverage.gapVerticals.length > 0 ? "warn" : "good"}
                sub={
                  d.inventory.coverage.gapVerticals.length > 0
                    ? `gap: ${d.inventory.coverage.gapVerticals.join(", ")}`
                    : "欠落なし"
                }
              />
              <Stat
                label="サイズ違反"
                value={d.inventory.sizeViolations.length}
                tone={d.inventory.sizeViolations.length > 0 ? "warn" : "good"}
              />
            </div>
            <div className="mt-2 grid gap-2 lg:grid-cols-2">
              <Table columns={["vertical", "件数"]}>
                {d.inventory.byVertical.map((v) => (
                  <Tr key={v.vertical}>
                    <Td nowrap>{v.vertical}</Td>
                    <Td nowrap muted>{v.count}</Td>
                  </Tr>
                ))}
              </Table>
              <Table columns={["adType", "件数"]}>
                {d.inventory.byAdType.map((v) => (
                  <Tr key={v.adType}>
                    <Td nowrap>{v.adType}</Td>
                    <Td nowrap muted>{v.count}</Td>
                  </Tr>
                ))}
              </Table>
            </div>
          </>
        )}
      </Section>

      {/* GA4 内訳 */}
      <Section title="GA4 実測">
        {hasError(d.ga4) ? (
          <ErrorNote error={d.ga4.error} />
        ) : (
          <>
            <p className="mb-2 text-[11px] text-console-muted">
              {d.ga4.date} 取得 / 直近 {d.ga4.days} 日
              {d.ga4.hasVariantBreakdown === false
                ? " — variant 内訳は未取得 (A/B 判定には使えない)"
                : ""}
            </p>
            <div className="grid gap-2 lg:grid-cols-2">
              <Table columns={["vertical", "imp", "clicks", "CTR"]}>
                {d.ga4.byVertical.slice(0, 12).map((r) => (
                  <Tr key={r.vertical}>
                    <Td nowrap>{r.vertical}</Td>
                    <Td nowrap muted>{r.impressions.toLocaleString()}</Td>
                    <Td nowrap muted>{r.clicks}</Td>
                    <Td nowrap muted>{(r.ctr * 100).toFixed(3)}%</Td>
                  </Tr>
                ))}
              </Table>
              <Table columns={["position", "imp", "clicks", "CTR"]}>
                {d.ga4.byPosition.slice(0, 12).map((r) => (
                  <Tr key={r.position}>
                    <Td nowrap>{r.position}</Td>
                    <Td nowrap muted>{r.impressions.toLocaleString()}</Td>
                    <Td nowrap muted>{r.clicks}</Td>
                    <Td nowrap muted>{(r.ctr * 100).toFixed(3)}%</Td>
                  </Tr>
                ))}
              </Table>
            </div>
          </>
        )}
      </Section>

      {/* compliance + カタログ */}
      <Section title="compliance / 提携カタログ">
        <div className="grid gap-2 lg:grid-cols-2">
          {hasError(d.compliance) ? (
            <ErrorNote error={d.compliance.error} />
          ) : (
            <div className="grid gap-2 sm:grid-cols-3">
              <Stat
                label="構造 issue"
                value={d.compliance.structureIssues.length}
                tone={d.compliance.structureIssues.length > 0 ? "warn" : "good"}
              />
              <Stat
                label="孤立配置"
                value={d.compliance.directPlacements.orphaned.length}
                tone={d.compliance.directPlacements.orphaned.length > 0 ? "bad" : "good"}
              />
              <Stat
                label="PR 表記漏れ"
                value={d.compliance.directPlacements.missingDisclosure.length}
                tone={d.compliance.directPlacements.missingDisclosure.length > 0 ? "bad" : "good"}
              />
            </div>
          )}
          {hasError(d.catalogs) ? (
            <ErrorNote error={d.catalogs.error} />
          ) : (
            <Table columns={["カタログ", "総数", "status 内訳"]}>
              {d.catalogs.map((c) => (
                <Tr key={c.file}>
                  <Td nowrap>{c.file}</Td>
                  <Td nowrap muted>{c.total}</Td>
                  <Td muted>
                    {c.byStatus.map((s) => `${s.status} ${s.count}`).join(" · ") || "—"}
                  </Td>
                </Tr>
              ))}
            </Table>
          )}
        </div>
      </Section>
    </div>
  );
}
