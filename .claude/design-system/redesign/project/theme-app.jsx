/* Theme app — wires up the 4 theme dashboard options */

const themeRoot = ReactDOM.createRoot(document.getElementById("root"));

function ThemeApp() {
  return (
    <DesignCanvas
      title="stats47 — テーマダッシュボード リデザイン案"
      subtitle="PCでの指標切替・データ取得・収益化導線を強化した4案 (例: 人口動態テーマ)。"
    >
      <DCSection id="sec-pc" title="PC（1280px）— テーマダッシュボードページ">
        <DCArtboard
          id="theme-a"
          label="A — 整理改善 (現行構造踏襲)"
          description="h1を24→30pxに、テーマメタを整理。指標タブを色付きピル化、表示単位/年度/集計範囲/CSVを1本のツールバーへ統合。下部の「指標一覧」をスパークライン入りのKPIカードに格上げ。最も低リスクな改善案。"
          width={1280} height={1700}
        >
          <ThemeOptionA />
        </DCArtboard>

        <DCArtboard
          id="theme-b"
          label="B — KPI ヒーロー (Bold)"
          description="現行のタブ式指標切替を、12枚のKPIカード（現在値+1位+スパークライン）に置換。クリックで地図とパネルが切替。右パネルは「都道府県プロファイル」化し、選択した県の全指標を一覧できる。ダッシュボード感を強化。"
          width={1280} height={1480}
        >
          <ThemeOptionB />
        </DCArtboard>

        <DCArtboard
          id="theme-c"
          label="C — マップ中心 + 指標サイドナビ (Power-user)"
          description="左に縦型の指標ナビ（{N}指標を一覧で常時表示）、中央にフォーカスした大きな地図 + 時系列/分布、右に「表示設定」「CSV エクスポート」「都道府県比較」をまとめた操作カード。データ操作の生産性を最大化するPC専用構成。"
          width={1280} height={1380}
        >
          <ThemeOptionC />
        </DCArtboard>

        <DCArtboard
          id="theme-d"
          label="D — ストーリー型 + ネイティブ収益"
          description="暗色ヒーロー（テーマ説明 + 主要KPI 4枚）→ 指標カード → 地図+順位表 → テーマ書籍4冊(PR) → 「テーマ・データパック」CSV CTA + メルマガ → in-feed AdSense → 関連記事。回遊と収益の機会を体系的に最大化。"
          width={1280} height={2400}
        >
          <ThemeOptionD />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

themeRoot.render(<ThemeApp />);
