<task>
<goal>論文型のブログ記事の本文を、frontmatter を含む Markdown 全文で返す</goal>
<scope>読むだけ。ファイルを書かない。返答は article.md の全文だけで、前置きもコードフェンスも付けない</scope>
<sources>規約: .claude/rules/blog-quality-standards.md・.claude/rules/content-type-standards.md / 問い: {{question}} / 結論: {{finding}} / 主張: {{claims}} / 注意点: {{caveats}} / 数値: {{summary}} / 図: {{figures}} / 今の本文: {{article}} / 記事の条件: {{articleMeta}}</sources>
<done_when>問いに最初の段落で答え、本文の数値がすべて出力にある</done_when>
</task>
直す指摘:
{{findings}}

規則:
- です・ます調。「答えはこうです」のように結論を先に書く
- 主張より強く書かない。注意点は「この分解で言えないこと」に入れる
- 図は ![説明](data/<名前>.svg) で全部載せる。表は使わない。順位の主張 (N位) を書かない
- frontmatter は今の本文の形を保つ。今の本文があるときは指摘の箇所だけを直し、他を変えない
