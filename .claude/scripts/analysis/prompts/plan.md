<task>
<goal>問いの分析を始める前に、確かめる項目を出す</goal>
<scope>読むだけ。ファイルを書かない。外部へ書くコマンドを実行しない。結論・記事・図・分析スクリプトは読まない</scope>
<sources>問い: {{question}} / 表: {{frame}} (rows の列を読む) / 指標の定義: {{spec}} の key を data/metrics/<key>.ts で読む / 視点: data/content/analysis-viewpoints.json / 下調べ: {{research}}</sources>
<done_when>問いの語ごとの測り方と、視点の層ごとの確認項目が JSON で返っている</done_when>
</task>
一般論を書かない。この問いの語、この表の列、指標の定義から書く。計算で確かめた事実は数字を書く。
結果で絞った集団の分解を勧めない。1 視点あたり最大 3 項目。layer は視点の id を使う。
