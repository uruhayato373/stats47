const compareRoot = ReactDOM.createRoot(document.getElementById("root"));

function CompareApp() {
  return (
    <DesignCanvas
      title="stats47 — 比較ページ リデザイン案"
      subtitle="PCでの2地域比較の理解しやすさと収益化を強化した4案。"
    >
      <DCSection id="sec-pc" title="PC（1280px）— /compare/[categoryKey]">
        <DCArtboard
          id="cmp-a"
          label="A — 整理改善 (低リスク)"
          description="h1: text-lg → 30px に。リージョン・セレクタを大型カード化(色付きピル + ドロップダウン + VS)。カテゴリはドロップダウンから横一列ピル切替へ。KPI 比較を見やすいダブルバー+差分%表示に。"
          width={1280} height={1740}
        >
          <CompareOptionA />
        </DCArtboard>

        <DCArtboard
          id="cmp-b"
          label="B — スコアボード・ヒーロー"
          description="スポーツのスコアボード風: 左右に各地域の名前と「リード指標数」を大きく、中央に小型地図ハイライト。直感的に「どちらが何で勝っているか」が分かる。下にKPIH2H + チャート。"
          width={1280} height={1720}
        >
          <CompareOptionB />
        </DCArtboard>

        <DCArtboard
          id="cmp-c"
          label="C — マトリックス・テーブル (Power-user)"
          description="左に比較設定パネル(地域A/B + カテゴリ + 表示する指標フィルタ + CSV/PDF/画像エクスポート)、中央に大型マトリックステーブル(差分バー列付き) + KPI ヘッダー、右に「他の比較」「広告」。"
          width={1280} height={1500}
        >
          <CompareOptionC />
        </DCArtboard>

        <DCArtboard
          id="cmp-d"
          label="D — Story Editorial + ふるさと納税"
          description="グラデーションヒーロー + AI要約 → ★「3つのキーインサイト」大カード → KPI比較 → ★両地域のふるさと納税4品(PR) → チャート → AdSense → 「両地域の更新を受け取る」メルマガCTA。"
          width={1280} height={2400}
        >
          <CompareOptionD />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

compareRoot.render(<CompareApp />);
