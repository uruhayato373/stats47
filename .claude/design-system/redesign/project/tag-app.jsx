/* Tag page — design canvas */

const tagRoot = ReactDOM.createRoot(document.getElementById("root"));

function TagApp() {
  return (
    <DesignCanvas
      title="stats47 — タグページ リデザイン案"
      subtitle="PCでの記事発見・タグ回遊・収益化を強化した4案。"
    >
      <DCSection id="sec-pc" title="PC（1280px）— /tag/[tagKey]">
        <DCArtboard
          id="tag-a"
          label="A — 整理改善 (低リスク)"
          description="h1: text-lg → 32px。タグ統計バナー(記事数・閲覧数・関連タグ)。記事カードを強化(サムネ + 日付 + カテゴリ + タグ + 閲覧数 ← 現行はタイトルのみ)。サイドバーに関連タグ + 関連ランキング + 広告。"
          width={1280} height={1400}
        >
          <TagOptionA />
        </DCArtboard>

        <DCArtboard
          id="tag-b"
          label="B — タグハブ (Discovery)"
          description="大型ヒーロー (タグ名 + 説明 + 4ステータス)。関連タグカルーセル、注目記事(大カード)+ サブ記事8件、サイドにメルマガ登録・関連ランキング。タグページを「コンテンツハブ」として確立。"
          width={1280} height={1800}
        >
          <TagOptionB />
        </DCArtboard>

        <DCArtboard
          id="tag-c"
          label="C — タイムライン・アーカイブ"
          description="記事を年月でグルーピング、左に月別ナビ、中央はタイムライン形式の記事リスト、右にタグメタ・関連タグ。多数の記事があるタグで「過去にさかのぼる」体験を最適化。"
          width={1280} height={1700}
        >
          <TagOptionC />
        </DCArtboard>

        <DCArtboard
          id="tag-d"
          label="D — Discovery + ネイティブ収益"
          description="暗色ヒーロー + 4ステータス → 関連タグ → 注目記事3枚 → ★ タグ関連書籍4冊(PR) → 過去の記事 → in-feed AdSense。サイドにフォロー(メルマガ)・関連ランキング・関連タグ。タグページから本+メルマガで収益化。"
          width={1280} height={2000}
        >
          <TagOptionD />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

tagRoot.render(<TagApp />);
