/* Home page — design canvas */

const homeRoot = ReactDOM.createRoot(document.getElementById("root"));

function HomeApp() {
  return (
    <DesignCanvas
      title="stats47 — トップページ リデザイン案"
      subtitle="PC向けに、入り口の整理・回遊性・収益化を強化した4案。"
    >
      <DCSection id="sec-pc" title="PC（1280px）— /">
        <DCArtboard
          id="home-a"
          label="A — 整理改善 (低リスク)"
          description="h1: text-2xl → 48pt に。「1,800以上の統計」を 4指標バナーに昇格。注目ランキングをカード化、「3つの切り口」を本当に3つ(現行は2つ)、新着記事に「タイトル+メタ情報」を表示(現行はサムネのみ)。"
          width={1280} height={1900}
        >
          <HomeOptionA />
        </DCArtboard>

        <DCArtboard
          id="home-b"
          label="B — Interactive Map Hero (都道府県起点)"
          description="ヒーローを大きな日本地図 + 検索ボックスに。「あなたの都道府県をクリック」起点で誘導。下部にテーマ12カード → 注目ランキング → 新着記事。地理から始まる入り口を強調。"
          width={1280} height={1820}
        >
          <HomeOptionB />
        </DCArtboard>

        <DCArtboard
          id="home-c"
          label="C — Editorial / Magazine"
          description="「今日のランキング」大型エディトリアルカード + サイドの注目3トピック。マガジン風に数値ハイライト。テーマ8カード → 注目ランキング → 編集部の記事(大画像)。ブランド体験を最大化。"
          width={1280} height={1820}
        >
          <HomeOptionC />
        </DCArtboard>

        <DCArtboard
          id="home-d"
          label="D — Revenue-Optimized (収益最大化)"
          description="暗色ヒーロー(主要CTA3つ: ランキング/検索/データ取得) → 注目ランキング → ★ ふるさと納税 4品(PR) → テーマ12カード → in-feed AdSense → 注目記事 → 「データ取得」+ 「メルマガ登録」CTAペア。"
          width={1280} height={2200}
        >
          <HomeOptionD />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

homeRoot.render(<HomeApp />);
