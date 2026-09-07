---
slug: geothermal-power-plant-count-prefecture-gap
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-09-07
---

## 評価サマリ

PASSです。エネルギー統計の対象・単位を監査する立場で、記事全文、公式Excel、集計入力、47県の値、図を独立確認しました。制度下で買取開始済みの設備を数え、全地熱発電所数・年間新設数・発電量と区別する説明は適切です。大分57件と秋田の容量帯を対比し、件数から供給力を判断できない理由を具体化しています。

## 指摘

- 残存指摘なし。まとめの「過去の施設所在データや…新設数にはなりません」という反復2文の削除をdelta確認しました。原表の0と欠測の区別、容量帯の具体例、基準日と改訂可能性の注記は保たれています。

## 判定理由

初回の独立full審査で見つけた同順位表示のBLOCKは、著者の修正後にdelta確認して解消しました。横長・縦長カードとも4件を同率4、0件を同率15と表示しています。横長カードと地図を実画像で再確認し、値・県名・順位・見切れに問題はありません。category: energy、タグ、subtitleの補完も確認しました。再実行したquality-gateはblocker・warningとも0です。

公式Excelの表A①－１ U6:V52と表A①－２ T6:U52を、各シートA列の県名と結合して全47行・188セルをfit-geothermal-observations.jsonと照合しました。全セルが欠損なしの非負整数で一致し、新規92+1=93、移行1+0=1、合計94、正値14道県・0値33都府県、15,000kW未満93・以上1（秋田）を独立再計算しました。ランキング・地図JSONの47値と競争順位も全件一致しています。57/94=60.638…%、72/94=76.595…%は記事の丸めと一致しました。

[公式集計ページ](https://www.fit-portal.go.jp/publicinfosummary)で基準日2026年3月末・更新日2026年8月18日、導入の定義、新規/移行の区分を確認しました。[利用規約](https://www.fit-portal.go.jp/Terms)は商用利用と加工を認め、出典・加工表示、第三者の権利尊重を要求しています。本文は出典と独自合算・作図を明示し、原表の図表や画像を転載していません。統計は改訂される可能性があり、現在の実運転状態を保証する資料とは評価していません。

タイトルの0件の問いに対象範囲で答え、導入・認定や件・kW・kWhを混同していません。calloutは記事固有の誤読防止を担い、常体混在・因果の断定・広告過多・図と重複する表は確認しませんでした。立地原因の解明ではなく測定対象を読む比較記事として審査しています。未検証の火山や開発条件を原因として加える必要はありません。内部リンク3本は県別ページと実在カテゴリに限り、旧ランキングへの誘導はありません。

### 検証対象のSHA256

- article.md: `a2e829cc4894860755ece27f6fcdbf0aa3e1c46d8b888e3ae477f54e4bb1d0df`
- fit-geothermal-observations.json: `797508828a8f8f09fc53ef6ad211e099c47685e082fbd3d9a19c922b6b7d5c3e`
- 原典Excel: `275519e42166cee8d48d370ddf753e186bc56d3f552d9c754aae87a029af1c77`
- prefecture-rankings.json: `c63b346d731ef89c9104f6b944e32d1f91cba1e871cd3fedf573bce3bde72fa5`
- map.json: `d216b543a21026cb3fabb960b1cd54438eab059b5d4a2a49d34c20d6d9eb5262`
- prefecture-rankings.svg: `6f4100312ab6bb014abbbcf4a8b6097a55aea0447739a489c963e90ce72d0187`
- prefecture-rankings-ig.svg: `f3a5547b2d91470f0f7da96b5dc932941799bcc68ee55398a3b3c97e1477d339`
- map.svg: `1110255fd0cb9d846e18c2fcb3b1ce1fec004f8a388d97659b362f3f8c7e53de`
