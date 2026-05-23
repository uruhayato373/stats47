const themesIndexRoot = ReactDOM.createRoot(document.getElementById("root"));

function ThemesIndexApp() {
  return (
    <DesignCanvas
      title="stats47 — テーマ一覧ページ リデザイン案"
      subtitle="PCでのテーマ発見・俯瞰・データ取得を強化した4案。"
    >
      <DCSection id="sec-pc" title="PC（1280px）— /themes">
        <DCArtboard
          id="ti-a"
          label="A — 整理改善 (低リスク)"
          description="h1: text-lg → 32px。テーマ統計バナー、カテゴリ・フィルタピル + 検索。既存3列カードを icon + color border + 注目バッジ + 代表指標プレビュー(1位 + 値)に強化。"
          width={1280} height={1280}
        >
          <ThemesIndexOptionA />
        </DCArtboard>

        <DCArtboard
          id="ti-b"
          label="B — 注目+カテゴリグルーピング"
          description="軽量ヒーロー + 4ステータス。注目テーマ4枚を画像ヒーロー付き大カードで。残りはカテゴリ別(人口/経済/生活/労働/産業)にセクション分割し、各テーマをコンパクトカードで表示。"
          width={1280} height={1620}
        >
          <ThemesIndexOptionB />
        </DCArtboard>

        <DCArtboard
          id="ti-c"
          label="C — マトリックス・アトラス"
          description="17テーマを 5列 グリッドで一画面俯瞰。各セルに icon + mini チャート + 代表指標KPI。「知の地図」風で、データの密度が高い PC 向け俯瞰画面。"
          width={1280} height={1200}
        >
          <ThemesIndexOptionC />
        </DCArtboard>

        <DCArtboard
          id="ti-d"
          label="D — Discovery + ネイティブ収益"
          description="暗色ヒーロー + 4 KPI → 注目テーマ4枚 → ★ テーマ関連書籍4冊(PR) → 全テーマカード13枚(カテゴリピル付き) → in-feed AdSense → 「全テーマ・データパック」CSV + メルマガ。"
          width={1280} height={1900}
        >
          <ThemesIndexOptionD />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

themesIndexRoot.render(<ThemesIndexApp />);
