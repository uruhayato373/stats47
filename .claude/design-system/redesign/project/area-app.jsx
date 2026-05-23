/* Area+Category app — design canvas */

const areaRoot = ReactDOM.createRoot(document.getElementById("root"));

function AreaApp() {
  return (
    <DesignCanvas
      title="stats47 — エリア × カテゴリページ リデザイン案"
      subtitle="PCでのデータ可読性・比較動線・収益化(ふるさと納税)のバランスを意識した4案 (例: 東京都 × 人口・世帯)。"
    >
      <DCSection id="sec-pc" title="PC（1280px）— /areas/[areaCode]/[categoryKey]">
        <DCArtboard
          id="area-a"
          label="A — 整理改善 (低リスク・現行構造踏襲)"
          description="現行 h1: text-lg → 32px に。エリア識別バッジ・主要メタ情報を見える化。横一列のカテゴリ・ピル切替、表示単位/年度/比較対象/CSVのツールバー。1カラム → 2カラム化（右に市区町村・隣接県・広告・ふるさと納税）。"
          width={1280} height={1900}
        >
          <AreaOptionA />
        </DCArtboard>

        <DCArtboard
          id="area-b"
          label="B — エリア・プロファイル・ハブ"
          description="上部に大きな「都道府県プロファイル ヒーロー」(日本地図ハイライト + アイデンティティ + 主要4数値)、その下に9カテゴリの大ナビ、KPI 3列、チャート2列。右に比較CTAと市区町村。サイト構造上「エリアの顔」になる構成。"
          width={1280} height={1820}
        >
          <AreaOptionB />
        </DCArtboard>

        <DCArtboard
          id="area-c"
          label="C — Compare-First (分析パワーユーザー)"
          description="ページ全体を「{AREA} vs 比較対象」のヘッドツーヘッド分析に最適化。上部に A vs B セレクタ、KPI は左右並列カードで差分を％表示、チャートは2系列オーバーレイ、最下部に「上位/下位ランクイン指標」を分けて表示。"
          width={1280} height={1820}
        >
          <AreaOptionC />
        </DCArtboard>

        <DCArtboard
          id="area-d"
          label="D — ストーリー型 + ふるさと納税ネイティブ収益"
          description="暗色ヒーロー（地図ハイライト + アイデンティティ + KPI 4枚）→ カテゴリナビ → KPI → チャート → ★ ふるさと納税4品ネイティブカード (PR) → 他県との比較CTA → in-feed AdSense → メルマガ。ふるさと納税のアフィリエイト価値を最大化。"
          width={1280} height={2400}
        >
          <AreaOptionD />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

areaRoot.render(<AreaApp />);
