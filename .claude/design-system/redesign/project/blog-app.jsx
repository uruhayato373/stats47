/* Blog redesign — design canvas wiring */

const blogRoot = ReactDOM.createRoot(document.getElementById("root"));

function BlogApp() {
  return (
    <DesignCanvas
      title="stats47 — ブログ記事ページ リデザイン案"
      subtitle="PCでの読みやすさ・回遊率・収益化バランスを意識した4案。"
    >
      <DCSection id="sec-pc" title="PC（1280px）— ブログ記事ページ">
        <DCArtboard
          id="blog-a"
          label="A — エディトリアル整理 (低リスク)"
          description="現行のH1は text-lg と小さすぎ、メタ情報も雑然。タイトルを32pxに引き上げ、タグ・カテゴリ・著者・読了時間を1段で整理。サイドバーは「関連ランキング → 関連記事 → 関連書籍(PR) → 広告」の意味でグルーピング。最も安全な改善案。"
          width={1280} height={1820}
        >
          <BlogOptionA />
        </DCArtboard>

        <DCArtboard
          id="blog-b"
          label="B — TOC + デュアルサイドバー"
          description="左に常時表示の目次・読書進捗・著者プロフィール・共有ボタン。中央に記事、右に関連ランキング/記事/書籍/広告。長文記事の回遊性と完読率を最大化するPC最適レイアウト。"
          width={1280} height={1820}
        >
          <BlogOptionB />
        </DCArtboard>

        <DCArtboard
          id="blog-c"
          label="C — マガジン・スタイル"
          description="フルブリードのヒーロー（タイトル42px + フィーチャー画像 + 概要グラフ）。本文に drop cap、暗色のインライン・ランキング CTA、著者バイオブロック。末尾に画像付き3カラムグリッドで読了後の回遊を演出。最もブランド体験寄りの案。"
          width={1280} height={2400}
        >
          <BlogOptionC />
        </DCArtboard>

        <DCArtboard
          id="blog-d"
          label="D — データストーリー + ネイティブ収益"
          description="KPI ストリップ付き暗色ヒーロー → 本文 → ランキング CTA → 推薦書籍 3冊(PR) → in-feed AdSense → 「記事に登場したデータ」関連ランキング → メルマガ CTA → 関連記事 3カラム。回遊と収益の機会を体系的に最大化。左には浮遊シェアレール。"
          width={1280} height={2800}
        >
          <BlogOptionD />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

blogRoot.render(<BlogApp />);
