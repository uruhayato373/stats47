/* Search redesign — design canvas */

const searchRoot = ReactDOM.createRoot(document.getElementById("root"));

function SearchApp() {
  return (
    <DesignCanvas
      title="stats47 — 検索ページ リデザイン案"
      subtitle="PCでの検索体験・絞り込み生産性・収益化のバランスを意識した4案。"
    >
      <DCSection id="sec-pc" title="PC（1280px）— /search">
        <DCArtboard
          id="search-a"
          label="A — 整理改善 (低リスク・現行構造踏襲)"
          description="h1: text-lg → 28px に。検索ボックスを目立つ大型ピル型に。結果カードをタイプ別に強化 (ランキング: TOP1値を右に表示 / ブログ: タグ・読了時間)。タイプ別タブ + 件数バッジ。右サイドバーは現行フィルタを整理し、広告を末尾に。"
          width={1280} height={1280}
        >
          <SearchOptionA />
        </DCArtboard>

        <DCArtboard
          id="search-b"
          label="B — 大型ヒーロー + ディスカバリー"
          description="クエリ空 / 初訪問時に最適化。Google風の大きな検索ヒーロー + 人気の検索チップ。下部に「📈 急上昇検索」「🗂 カテゴリで探す」「✨ 注目のコンテンツ」のディスカバリーセクション。サイドバーにタグクラウドとメルマガ。"
          width={1280} height={1600}
        >
          <SearchOptionB />
        </DCArtboard>

        <DCArtboard
          id="search-c"
          label="C — Power-Search (ファセット検索強化)"
          description="左カラムに完全展開された絞り込み (タイプ・カテゴリ・年・タグ、件数バッジ付き)。中央に密度の高い rich card 結果。右に検索結果のCSV取得、検索クエリ保存、関連検索。データ取得・分析を最大化する PC 専用構成。"
          width={1280} height={1300}
        >
          <SearchOptionC />
        </DCArtboard>

        <DCArtboard
          id="search-d"
          label="D — Discovery + ネイティブ収益"
          description="トップ結果を「最も関連度の高い結果」として強調。本文中に PR ネイティブカード3つ(Amazon・ふるさと納税・関連書籍)、in-feed AdSense、末尾に「データ取得」CTA。右サイドに関連書籍と検索アラート登録。"
          width={1280} height={1700}
        >
          <SearchOptionD />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

searchRoot.render(<SearchApp />);
