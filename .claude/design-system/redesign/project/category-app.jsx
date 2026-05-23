/* Category app — design canvas wiring */

const categoryRoot = ReactDOM.createRoot(document.getElementById("root"));

function CategoryApp() {
  return (
    <DesignCanvas
      title="stats47 — カテゴリページ リデザイン案"
      subtitle="PCでの一覧性・横断回遊・データ取得・収益化のバランスを意識した4案。"
    >
      <DCSection id="sec-pc" title="PC（1280px）— カテゴリページ">
        <DCArtboard
          id="cat-a"
          label="A — 整理改善 (現行構造踏襲)"
          description="現行 h1: text-lg → 30px に。注目ランキングカードに TileMap を残しつつ整理。全件テーブルに検索・正規化・並び順・CSV のツールバーを追加。サイドバーは「他カテゴリ → 新着記事 → 広告 → 調査」と意味で並べる。"
          width={1280} height={1700}
        >
          <CategoryOptionA />
        </DCArtboard>

        <DCArtboard
          id="cat-b"
          label="B — Featured ヒーロー + 強化テーブル"
          description="注目ランキングを「リーダーボード」風の大カード（mini bar chart + TileMap）に格上げ。全件テーブルにスパークライン列を追加。カード/テーブル表示切替も可能。"
          width={1280} height={1820}
        >
          <CategoryOptionB />
        </DCArtboard>

        <DCArtboard
          id="cat-c"
          label="C — ナビゲーション・ハブ (横断回遊)"
          description="左に「現在カテゴリ + 注目へのクイックジャンプ → 他カテゴリ → 関連テーマ」のナビハブ、中央に注目+全件、右に「表示設定 + データ取得 + 調査 + 広告」のツールカラム。サイト全体の回遊率を上げる構成。"
          width={1280} height={1620}
        >
          <CategoryOptionC />
        </DCArtboard>

        <DCArtboard
          id="cat-d"
          label="D — ストーリー型 + ネイティブ収益"
          description="暗色ヒーロー（カテゴリ説明 + 全体を物語る KPI 4枚 + CSV CTA）→ 注目大カード → 全件テーブル → 関連書籍4冊(PR) → 「カテゴリ・データパック」CSV + メルマガ → in-feed AdSense → 関連記事。回遊と収益を体系的に最大化。"
          width={1280} height={2500}
        >
          <CategoryOptionD />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

categoryRoot.render(<CategoryApp />);
