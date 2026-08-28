import { SummaryCards } from "@/components/home/summary-cards";

const SECTIONS = [
  {
    href: "/content",
    title: "コンテンツ運用",
    desc: "X・Instagram・note・Kindleの原稿、公開状態、次の作業、SSOT整合性",
  },
  {
    href: "/sns",
    title: "SNS",
    desc: "投稿・予約・caption・メトリクス (X / IG / note)",
  },
  {
    href: "/buzz-map",
    title: "バズ地図",
    desc: "日本地図 × 統計カードの企画キューと素材生成",
  },
  {
    href: "/assets",
    title: "画像資産",
    desc: "OGP・リンクカード・note カバー・記事内画像/動画の閲覧と欠落チェック",
  },
  {
    href: "/svg",
    title: "SVG カタログ",
    desc: "ブログ SVG チャートをカタログ別に横断閲覧",
  },
  {
    href: "/research",
    title: "調査カタログ",
    desc: "政府・自治体の公式ダッシュボード、指標、可視化、stats47テーマ接続を確認",
  },
  {
    href: "/strategy",
    title: "方針・事業計画",
    desc: "stats47 2.0の取込判断、初期パイロット、企画在庫、KPI、設計文書を確認",
  },
  {
    href: "/revenue",
    title: "収益 (AdSense)",
    desc: "週次収益・RPM・内訳。実測は AdSense のみで他チャネルは未計測と明示する",
  },
  {
    href: "/ads",
    title: "アフィリエイト運用",
    desc: "計測/公開ゲート・在庫 260・GA4 実測・compliance・提携カタログ",
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

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-console-fg">
          管理コンソール
        </h1>
        <p className="mt-1 text-sm text-console-muted">
          ローカル専用 (127.0.0.1)。制作・収益・品質・運用を 1 画面で横断管理する。書き込みは SNS の投稿/予約とバズ地図の素材生成だけで、note・Kindleを含む他画面は読み取り専用。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <a
            key={section.href}
            href={section.href}
            className="rounded-lg border border-console-border bg-console-card p-5 transition-colors hover:border-console-accent/60"
          >
            <div className="text-base font-semibold text-console-fg">
              {section.title}
            </div>
            <p className="mt-2 text-sm text-console-muted">{section.desc}</p>
          </a>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-console-fg">サマリ</h2>
        <div className="mt-3">
          <SummaryCards />
        </div>
      </div>
    </div>
  );
}
