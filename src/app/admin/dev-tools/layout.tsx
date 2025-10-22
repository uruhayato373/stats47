import { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s | 開発ツール | 統計で見る都道府県" },
  description: "開発・管理用ツール",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DevToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dev-tools-layout">
      <nav className="dev-tools-nav">
        <h2>開発ツール</h2>
        <ul>
          <li>
            <a href="/admin/dev-tools/estat-api/stats-data">e-Stat API</a>
          </li>
          <li>
            <a href="/admin">管理画面トップ</a>
          </li>
        </ul>
      </nav>
      <main className="dev-tools-content">{children}</main>
    </div>
  );
}
