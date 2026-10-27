import { LinkCard } from "@/components/admin-ui";
import { KpiTree } from "@/components/home/kpi-tree";
import { SummaryCards } from "@/components/home/summary-cards";
import { Grid, Section } from "@/components/layout-primitives";
import { PageHeading } from "@/components/ops/primitives";
import { datasetDir } from "../../../config/datasets.mjs";

export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    href: "/product/status",
    title: "販売状態",
    desc: "note・ココナラ・Kindle の商品数と公開段階。各チャネルの詳細へ",
  },
  {
    href: "/content",
    title: "コンテンツ運用",
    desc: "X・Instagram・note・Kindleの原稿、公開状態、次の作業、SSOT整合性",
  },
  {
    href: "/sns",
    title: "SNS",
    desc: "投稿状態・caption・Geo分類・メトリクスの読み取りビュー",
  },
  {
    href: "/buzz-map",
    title: "バズ地図",
    desc: "日本地図 × 統計カードの企画キューと素材プレビュー",
  },
  {
    href: "/ops/image-library",
    title: "画像ライブラリ",
    desc: "OGP・リンクカード・ブログ SVG・note・SNS の画像と動画を横断して閲覧",
  },
  {
    href: "/research",
    title: "調査カタログ",
    desc: "政府・自治体の公式ダッシュボード、指標、可視化、stats47テーマ接続を確認",
  },
  {
    href: "/strategy",
    title: "方針",
    desc: "事業計画の題目・事業原則・設計と方針の文書。計画の明細は各領域の画面へ割り振った",
  },
  {
    href: "/revenue",
    title: "売上",
    desc: "商品の週次実売 (ココナラ・note・KDP の自動取得)・販売台帳・AdSense の週次実績 (2026-09-20 停止)。未計測は 0 円と表示しない",
  },
  {
    href: "/affiliate",
    title: "アフィリエイト",
    desc: "成果 (ASP 別の発生・確定・掲載位置別クリック)・掲載先 (どこに何が出ているか)・提携・案件 (ASP ごとの状態・報酬・掲載終了日)",
  },
  {
    href: "/dashboard",
    title: "プロジェクト現況",
    desc: "メトリクス・進捗キュー・効果測定サマリ・STP 戦略 (読み取り専用)",
  },
  {
    href: "/quality",
    title: "品質",
    desc: "是正キュー・SVG 系譜・出典・整合性など 8 監査の残欠陥と鮮度",
  },
  {
    href: "/ops",
    title: "CI・台帳",
    desc: "workflow 健全性・R2 鮮度・Claude 利用量・agents/skills/memory 一覧",
  },
  {
    href: "/todo",
    title: "TODO",
    desc: ".claude/todo を実行バックログ・計画・効果測定の役割で俯瞰",
  },
] as const;

/** トップ (型 A: 概況)。数値タイル → KPI ツリー → 各画面への入口の順。 */
export default function HomePage() {
  return (
    <>
      <PageHeading
        title="管理コンソール"
        source={`${datasetDir("business.measurement-cycle")}/latest.json + /api/assets/summary`}
        accessLabel="ローカル専用 (127.0.0.1)・完全読み取り専用"
      >
        <p className="text-sm text-muted-foreground">制作・収益・品質・運用・Geo契約を横断確認し、実行は担当agent/skillだけが行う。</p>
      </PageHeading>

      <SummaryCards />

      <KpiTree />

      <Section title="画面一覧">
        <Grid min="md">
          {SECTIONS.map((section) => (
            <LinkCard key={section.href} href={section.href} title={section.title} sub={section.desc} />
          ))}
        </Grid>
      </Section>
    </>
  );
}
