import { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s | e-Stat API | 開発ツール" },
  description: "e-Stat API関連の開発・管理ツール",
};

export default function EstatAPILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="estat-api-layout">
      <nav className="estat-api-nav">
        <h3>e-Stat API ツール</h3>
        <ul>
          <li>
            <a href="/admin/dev-tools/estat-api/stats-data">統計データ取得</a>
          </li>
          <li>
            <a href="/admin/dev-tools/estat-api/stats-list">統計リスト取得</a>
          </li>
          <li>
            <a href="/admin/dev-tools/estat-api/meta-info">メタ情報管理</a>
          </li>
        </ul>
      </nav>
      <main>{children}</main>
    </div>
  );
}
