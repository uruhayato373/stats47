/* App — wires up 4 options as artboards on the design canvas */

const root = ReactDOM.createRoot(document.getElementById("root"));

function App() {
  return (
    <DesignCanvas
      title="stats47 — ランキング詳細ページ リデザイン案"
      subtitle="PC向けに、単位切替・CSV・収益面の導線を強化した4案。"
    >
      <DCSection id="sec-pc" title="PC（1280px）— ランキング詳細ページ">
        <DCArtboard
          id="opt-a"
          label="A — 統合ツールバー (整理改善)"
          description="既存スタイルを尊重。すべての操作を1本の明確なツールバーに集約し、各コントロールにラベルを付与。CSV はアイコンのみから「CSV」ラベル付きの primary ボタンへ。最も低リスクな改善案。"
          width={1280} height={1180}
        >
          <OptionA />
        </DCArtboard>

        <DCArtboard
          id="opt-b"
          label="B — メトリック・カードタブ (Bold)"
          description="「総数 / 人口あたり / 面積あたり」の切替を、3枚の大きなメトリックカードへ昇格。各カードに現在値・1位の県を表示し、何が変わるかをひと目で伝える。CSV は文言付きの primary CTA、ネイティブ広告も含む。"
          width={1280} height={1280}
        >
          <OptionB />
        </DCArtboard>

        <DCArtboard
          id="opt-c"
          label="C — スティッキー・コントロールレール (PC最適化)"
          description="左に縦型のスティッキー・コントロールパネルを常時表示。単位はラジオで詳細説明つき、CSV は専用カードで「データをダウンロード」とプライマリ訴求。表示エリアが上下にスクロールしても操作は常に届く。"
          width={1280} height={1300}
        >
          <OptionC />
        </DCArtboard>

        <DCArtboard
          id="opt-d"
          label="D — ヒーロー・メトリック＋ネイティブ収益"
          description="上部に大きなヒーローカード（暗色の数値ハイライト＋単位ピル切替＋CSV CTA）。本文中にネイティブ風アフィリエイト枠・「データを使う」CTA・AdSense in-feed をリズム良く挿入し、収益と UX を両立。最も攻めた案。"
          width={1280} height={1680}
        >
          <OptionD />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

root.render(<App />);
