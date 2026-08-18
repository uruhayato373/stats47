import { SummaryCards } from "@/components/home/summary-cards";

const SECTIONS = [
  {
    href: "/sns",
    title: "SNS",
    desc: "投稿・予約・caption・メトリクス (X / IG / note)",
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
    href: "/dashboard",
    title: "プロジェクト現況",
    desc: "メトリクス・進捗キュー・改善バックログ TODO・STP 戦略 (読み取り専用)", // .claude/todo/ ミラー
  },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-console-fg">
          統合メディアコンソール
        </h1>
        <p className="mt-1 text-sm text-console-muted">
          ローカル専用 (127.0.0.1)。SNS 素材・画像資産・SVG・現況を 1 画面で横断管理する。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
