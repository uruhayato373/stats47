export default function DevToolsPage() {
  return (
    <div>
      <h1>開発ツール</h1>
      <p>開発・管理用のツールです。</p>
      <ul>
        <li>
          <a href="/admin/dev-tools/estat-api/stats-data">
            e-Stat API - 統計データ取得
          </a>
        </li>
        <li>
          <a href="/admin/dev-tools/estat-api/stats-list">
            e-Stat API - 統計リスト取得
          </a>
        </li>
        <li>
          <a href="/admin/dev-tools/estat-api/meta-info">
            e-Stat API - メタ情報管理
          </a>
        </li>
      </ul>
    </div>
  );
}
