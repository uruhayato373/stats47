<task>
<goal>分析の結論を、台帳へ書く JSON として返す</goal>
<scope>{{authorScope}}</scope>
<sources>問い: {{question}} / 確かめる項目: {{plan}} / 入力: {{frame}} / 計算: {{script}} / 出力: {{summary}} / 視点: data/content/analysis-viewpoints.json / 今の結論: {{finding}} (古い版のことがある。出力と食い違えば出力を優先する) / 反証の結果: {{refutation}} / 出力の上位の項目: {{resultKeys}}</sources>
<done_when>結論・注意点・主張・視点の結果がすべて出力の値を根拠に書かれている</done_when>
</task>
上に挙げたファイル以外を開かない。リポジトリを検索しない。足りないときは足りないと返す。

前回の指摘:
{{findings}}

規則:
- finding は問いの語 {{terms}} をそのまま使って答える。問いを言い換えない
- 主張の value と interval は出力 JSON の中のキーを「.」でつないだパス (配列は番号)。evidence も同じで、1 つのパスだけを書く。カンマで並べない
- interval は [下限, 上限] の配列を指す。オブジェクトしか無ければその中の配列を指し、幅が出力に無い主張には above・below・straddles を付けない
- 「過半」「上回る」と言う主張には interval と above (または below) を付ける。幅が基準をまたぐなら straddles を付け「ほぼ半々」と書く。使わない項目は null
- viewpoints は視点の全 id について返す。decomposition の evidence は足すと 100 になる内訳、robustness の evidence は 2 通り以上の配列
- 因果を断定しない。掛け算の分解は原因ではない
- 出力の上位の項目のうち、問いに関わる分析ごとに主張を少なくとも 1 件立てる。新しく足された分析 (付加価値・推移・範囲の比較など) を主張から落とさない
- 反証で weak と判定された主張は、その numbers の言い換え案の強さまで弱めて書き直す。broken の主張は消す
