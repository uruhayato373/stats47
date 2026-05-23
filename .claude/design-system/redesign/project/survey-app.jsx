const surveyRoot = ReactDOM.createRoot(document.getElementById("root"));

function SurveyApp() {
  return (
    <DesignCanvas
      title="stats47 — 調査名ページ リデザイン案"
      subtitle="PCでの調査の権威性・データの取得・回遊と収益を強化した4案 (例: 国勢調査)。"
    >
      <DCSection id="sec-pc" title="PC（1280px）— /survey/[surveyKey]">
        <DCArtboard
          id="srv-a"
          label="A — 整理改善 (低リスク)"
          description="現行 h1: text-lg → 30px。メタ情報を整理(実施機関・周期・初回/最新年・調査方式)。注目ランキングを TileMap 付き色付きカードに強化。全件テーブルに検索/カテゴリ/CSVのツールバー。右に「この調査について」「他の調査」「広告」。"
          width={1280} height={1400}
        >
          <SurveyOptionA />
        </DCArtboard>

        <DCArtboard
          id="srv-b"
          label="B — 調査プロファイル・ヒーロー"
          description="政府統計バッジ付き大型ヒーロー + 概要4 KPI(ランキング数・注目指標・周期・最新年 + 次回予定)。カテゴリ分布バー (どの分野で使われているか)。注目大カード3枚 + 全件カードグリッド。"
          width={1280} height={1500}
        >
          <SurveyOptionB />
        </DCArtboard>

        <DCArtboard
          id="srv-c"
          label="C — 「調査を読み解く」エディトリアル"
          description="暗色ヒーロー + 横スクロール調査タイムライン(初回/戦後再開/近年/最新/次回)。「この調査について」4カード(実施機関/周期/方式/派生指標)。ランキングをカテゴリ別にセクション化したエディトリアル構成。"
          width={1280} height={1700}
        >
          <SurveyOptionC />
        </DCArtboard>

        <DCArtboard
          id="srv-d"
          label="D — データジャーナリスト向け + 書籍ネイティブ"
          description="暗色ヒーロー + 4 KPI → 注目大カード3枚 → 「調査データパック」CSV CTA → ★ 統計関連書籍4冊(PR) → 全件テーブル(カテゴリピル付き) → AdSense → 関連調査 + 次回結果メルマガ。"
          width={1280} height={2100}
        >
          <SurveyOptionD />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

surveyRoot.render(<SurveyApp />);
