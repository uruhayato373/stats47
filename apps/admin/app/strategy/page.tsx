import { LinkCard } from "@/components/admin-ui";
import { Grid } from "@/components/layout-primitives";
import { PageHeading } from "@/components/ops/primitives";
import { PlanHeader, PolicyDocs, Principles } from "@/components/strategy/business-plan-sections";
import { businessPlanAdminData } from "@/lib/server/business-plan";

export const dynamic = "force-dynamic";
export const metadata = { title: "方針 — stats47 admin" };

/** 判断の基準として読むものへの入口。どこに何があるかは領域の正本 config/domains.json が割り振る。 */
const LINKS = [
  { href: "/docs/00_プロジェクト管理/02_収益化戦略", title: "収益化戦略", body: "領域と構え・意思決定ゲート・検証規律の正本" },
  { href: "/strategy/policy", title: "共通方針", body: "3 プロジェクト共通の HARM と判断の問い" },
  { href: "/strategy/business-plan", title: "事業計画の詳細", body: "実行イニシアチブ・25章の取込判断・KPI と記録契約・コンテンツカタログ" },
  { href: "/domains/strategy", title: "戦略の文書とタスク", body: "戦略領域の文書・バックログ・担当エージェント" },
];

/**
 * /strategy — 方針 (判断の基準)。事業計画の明細は各領域のページへ割り振った
 * (Geo は /data/geo、X は /sns/geo-plan、note 商品は /product/note-plan、計画の詳細は /strategy/business-plan)。
 */
export default function StrategyPolicyPage() {
  const data = businessPlanAdminData();

  return (
    <div className="space-y-8">
      <PageHeading title="方針" source="packages/data-configs/src/business-plan/ + docs/00_プロジェクト管理/">
        <p className="max-w-4xl text-sm text-console-muted">
          判断の基準だけを置く。売上・アクセス目標は予測ではなく仮説、未計測は 0 ではない。今週の判断はレビュー、施策の構えは領域と構えで行う。
        </p>
      </PageHeading>

      <PlanHeader data={data} />

      <Grid min="sm">
        {LINKS.map((l) => (
          <LinkCard key={l.href} href={l.href}>
            <h2 className="text-sm font-semibold">{l.title}</h2>
            <p className="pt-1 text-xs text-console-muted">{l.body}</p>
          </LinkCard>
        ))}
      </Grid>

      <Principles data={data} />
      <PolicyDocs data={data} />
    </div>
  );
}
