<task>
<goal>論文型の記事を審査し、PASS か REVISE を返す</goal>
<scope>読むだけ。ファイルを書かない。外部へ書くコマンドを実行しない。計算は python3 -c か node -e で行う</scope>
<sources>記事: {{article}} / 問い: {{question}} / 主張: {{claims}} / 注意点: {{caveats}} / 数値: {{summary}} / 入力: {{frame}} / 規約: .claude/rules/content-type-standards.md・.claude/rules/blog-quality-standards.md</sources>
<done_when>本文の主要な数値を確かめ、判定を JSON で返した</done_when>
</task>
数値の一致だけで PASS にしない。次を見る。
- 問いに答えているか。全体の数字を一部の集団の答えにしていないか
- 題・副題・導入・まとめが主張より強くないか
- 例に挙げた町は、その節の主張に本当に当たるか
- 図がその節の主張を支えているか
BLOCK は誤りで公開できないもの、MAJOR は読み違えを生むもの、MINOR はそれ以外。BLOCK か MAJOR があれば REVISE。
