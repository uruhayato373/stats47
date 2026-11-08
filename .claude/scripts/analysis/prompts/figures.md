<task>
<goal>主張ごとに 1 枚の図を割り当て、図の台帳の行を JSON で返す</goal>
<scope>読むだけ。ファイルを書かない。外部へ書くコマンドを実行しない</scope>
<sources>問い: {{question}} / 主張: {{claims}} / 分析の出力: {{result}} / 図の台帳の形: data/content/schema/figures.schema.json / 図の台帳の例: data/content/figures.json の analysis:H01-vacancy-population の行 / 使える図の型: {{templates}}</sources>
<done_when>主張 1 件に図 1 枚 (同じことを言う図は作らない)。各行が図の台帳の形に合い、chart の rows・series などが分析の出力に実在する</done_when>
</task>

上に挙げたファイル以外を開かない。リポジトリを検索しない。

規則:
- 1 枚 1 主張。図の題は主張の要点を 20 字以内で言う。reads には読者が図で何を読むかを 1 文で書く
- 並べ方で当然に生じる差を主張する図にしない
- 記事の目安の字数 {{chars}} に対し、1 枚あたり 800〜1,000 字になる枚数を上限にする
- id は figure:{{issueCode}}-<英小文字とハイフン>。analysis は {{analysisId}}。destinations は [{"channel":"site","slug":"{{slug}}","status":"draft"}]
- figures の各要素は、図の台帳の 1 行を JSON の文字列にしたもの
