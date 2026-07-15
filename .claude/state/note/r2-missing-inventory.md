# note: R2 未保存の公開記事インベントリ (要本文復元)

> 派生物 (手編集しない)。真実源はカタログ (`.claude/scripts/note/catalog/data/*.ts`) の `r2Body: false` エントリ。
> 再生成: `npx tsx .claude/scripts/note/catalog/generate-note-catalog.ts` 後、r2Path が noteID (`note/<vertical>/n<hex>`) のものを抽出。

これらは note.com に公開済みだが **R2 に記事本体 (draft.md/画像) が無い**回収スタブ (`recovered-*` / `paid-*`)。
r2Path は note ID から機械生成しただけで実体が無く 404 になる。docs/31 にもローカル本文は無い。
**復元には note.com からの本文取得 (browser-use + note ログイン、有料は所有者アカウント) が必要**
= creds/ブラウザを持つローカルセッションで実施する (このクラウドセッションでは不可)。復元後 `r2Body: true` に更新する。

## サマリ (165 件, 有料 50 件)

| vertical | 件数 |
|---|---|
| koumuin-claude-code | 2 |
| koumuin-estat-claude-code | 2 |
| koumuin-gis | 2 |
| stats47-note | 159 |

## 一覧

| vertical | key | 有料 | noteUrl | title |
|---|---|---|---|---|
| koumuin-claude-code | paid-n9f666946d105 | 有料 | https://note.com/stats47/n/n9f666946d105 | 庁内勉強会の進め方: 30 分で職員を Claude Code 入門させる |
| koumuin-claude-code | recovered-nc18fa33ec65e |  | https://note.com/stats47/n/nc18fa33ec65e | 公務員が副業せずに Claude Code スキルで評価される 5 つの場 |
| koumuin-estat-claude-code | paid-n143a9f6a0050 | 有料 | https://note.com/stats47/n/n143a9f6a0050 | e-Stat 統計の前年比較・5 年トレンド・増減ランキングを自動化する |
| koumuin-estat-claude-code | recovered-n73a4d300e045 |  | https://note.com/stats47/n/n73a4d300e045 | 47 都道府県データを 1 コマンドで取得する — fetch-estat-data スキルの使い方 |
| koumuin-gis | paid-nf80da34b28c3 | 有料 | https://note.com/stats47/n/nf80da34b28c3 | 【D3.js×Next.js】ダサい地図から脱却するデータ可視化の配色理論。AIへの的確な指示にも使える全98種コード付 |
| koumuin-gis | recovered-na21015ac366d |  | https://note.com/stats47/n/na21015ac366d | 【2021年版】都道府県「剣道の行動者率」ランキング｜山形と長野が同率首位、意外な武道地図 |
| stats47-note | paid-n0135c75ca76c | 有料 | https://note.com/stats47/n/n0135c75ca76c | 高校2年の体重格差、最大5.6kg！男女とも青森がトップ、岐阜が最下位 |
| stats47-note | paid-n02da130aae01 | 有料 | https://note.com/stats47/n/n02da130aae01 | 【第3章】発散データ編：プラスとマイナスの対立を可視化する（全30種） |
| stats47-note | paid-n0642ad7f7fdd | 有料 | https://note.com/stats47/n/n0642ad7f7fdd | 農業所得ランキング2003：トップ北海道は最下位滋賀の17倍！驚きの地域格差 |
| stats47-note | paid-n066d8687ef00 | 有料 | https://note.com/stats47/n/n066d8687ef00 | 歯科健診の受診率に最大3.2倍の地域格差！2020年都道府県ランキングで見る日本のオーラルケア意識 |
| stats47-note | paid-n2207f3039fd3 | 有料 | https://note.com/stats47/n/n2207f3039fd3 | .claude/skills で「毎月の定型業務」を 1 コマンド化する |
| stats47-note | paid-n2406ded99484 | 有料 | https://note.com/stats47/n/n2406ded99484 | 【格差7.3倍】都道府県「一般行政部門職員数」ランキング｜東京2万人超、地方は3千人以下 |
| stats47-note | paid-n2c2df066e865 | 有料 | https://note.com/stats47/n/n2c2df066e865 | 上司に Claude Code 導入を承認させた説明資料 (実例加工) |
| stats47-note | paid-n2d43e8cd6054 | 有料 | https://note.com/stats47/n/n2d43e8cd6054 | 小学5年の体重格差、最大1.10倍！男子は青森37.5kg、女子は鹿児島34.2kgが最軽量 |
| stats47-note | paid-n2ed31d721531 | 有料 | https://note.com/stats47/n/n2ed31d721531 | 財政健全化法の4指標で見る都道府県ランキング｜赤字比率は全県クリア、差がつくのは借金の重さ |
| stats47-note | paid-n317c673b1e81 | 有料 | https://note.com/stats47/n/n317c673b1e81 | 【2023年】服や靴の価格、地域で1.27倍の格差！石川県は高く、鹿児島県は安い？ |
| stats47-note | paid-n44bedb732274 | 有料 | https://note.com/stats47/n/n44bedb732274 | 都道府県別農業産出額ランキング2022：北海道が圧倒的1位、生産性も全国トップ |
| stats47-note | paid-n48a11cea7b31 | 有料 | https://note.com/stats47/n/n48a11cea7b31 | 【2022年最新】都道府県別「年齢調整死亡率（65歳以上）」ランキング｜秋田と滋賀で1.22倍の格差！あなたの地域は大丈 |
| stats47-note | paid-n4b8346d9c17b | 有料 | https://note.com/stats47/n/n4b8346d9c17b | 【2021年度】自主財源比率ランキング！東京76%、高知24.1%で格差3.15倍の衝撃 |
| stats47-note | paid-n66ffb10aa41b | 有料 | https://note.com/stats47/n/n66ffb10aa41b | 【第5章】実践テクニック編：凡例（Legend）とアクセシビリティ |
| stats47-note | paid-n67de9d45c426 | 有料 | https://note.com/stats47/n/n67de9d45c426 | 【2021年】趣味・娯楽時間ランキング！1位は茨城・大阪、最下位は沖縄・鹿児島で1.4倍の格差 |
| stats47-note | paid-n68eafab07946 | 有料 | https://note.com/stats47/n/n68eafab07946 | Subagents で「複数案件の並行調査」を回す |
| stats47-note | paid-n7290144784d4 | 有料 | https://note.com/stats47/n/n7290144784d4 | あなたの街は火事に強い？2022年火災死傷者数ランキング、鳥取と神奈川で2.5倍の格差 |
| stats47-note | paid-n772ff041af18 | 有料 | https://note.com/stats47/n/n772ff041af18 | 農家数の都道府県格差は9.4倍！偏差値81.0の長野県と偏差値33.7の東京都の驚きの差 |
| stats47-note | paid-n79fefdbd4d4c | 有料 | https://note.com/stats47/n/n79fefdbd4d4c | 【第4章】カテゴリ・循環データ編：定性データの分類と特殊用途（全28種） |
| stats47-note | paid-n823d76c5cbac | 有料 | https://note.com/stats47/n/n823d76c5cbac | 【第6章・完結】特典・付録：全98種 D3.jsカラーパレット辞書 & 実装チートシート |
| stats47-note | paid-n82a4168eaa19 | 有料 | https://note.com/stats47/n/n82a4168eaa19 | 中学2年女子の平均体重、地域差は3.1kg！2022年都道府県ランキング |
| stats47-note | paid-n8558c1a6503a | 有料 | https://note.com/stats47/n/n8558c1a6503a | 退職後のキャリア: AI × 公的セクター経験者の市場価値 |
| stats47-note | paid-n925aa92c4ee4 | 有料 | https://note.com/stats47/n/n925aa92c4ee4 | 中学2年の体重格差、最大4.3kg！男子は青森53.6kg、女子は愛知46.7kgが最軽量 |
| stats47-note | paid-n92b846280d1a | 有料 | https://note.com/stats47/n/n92b846280d1a | 年収で「塾代」は56倍違う──家計調査 五分位階級別 159品目×25年分CSVデータセット |
| stats47-note | paid-na16afa534c77 | 有料 | https://note.com/stats47/n/na16afa534c77 | 【格差41倍】都道府県「実質収支比率」ランキング｜東京8.2％、長崎0.2％の財政格差 |
| stats47-note | paid-na76caacd17c3 | 有料 | https://note.com/stats47/n/na76caacd17c3 | 充足率の都道府県格差、最大3.7倍！長崎7.0%、東京1.9%の地域差 |
| stats47-note | paid-naa6eba6efec2 | 有料 | https://note.com/stats47/n/naa6eba6efec2 | 脳血管疾患死亡率、最大2.6倍の地域格差！2022年都道府県ランキングから見る日本の健康課題 |
| stats47-note | paid-naf942acdbe59 | 有料 | https://note.com/stats47/n/naf942acdbe59 | 災害時の SNS 発信文を Claude Code で多言語化 |
| stats47-note | paid-nafcc04dcd988 | 有料 | https://note.com/stats47/n/nafcc04dcd988 | 都道府県別年少人口指数ランキング2022：沖縄県が27.1で圧倒的1位、東京都との差は1.6倍 |
| stats47-note | paid-nb17d039bc1aa | 有料 | https://note.com/stats47/n/nb17d039bc1aa | 火災死傷者数ランキング2022：鳥取と滋賀で約1.9倍の格差！あなたの街の火災リスクは？ |
| stats47-note | paid-nb216c5776aab | 有料 | https://note.com/stats47/n/nb216c5776aab | 【格差148倍】都道府県「行政事件」ランキング2022：偏差値110超えの東京と「わずか8件」の3県 |
| stats47-note | paid-nb3c79a94e53a | 有料 | https://note.com/stats47/n/nb3c79a94e53a | 自動車保有率、東京と山形で3.2倍の格差！2014年データで見る日本の「くるま社会」の現実 |
| stats47-note | paid-nb8f3e05d244b | 有料 | https://note.com/stats47/n/nb8f3e05d244b | 財政の余裕は最大1.25倍の格差！2021年経常収支比率ランキング |
| stats47-note | paid-nba8bf272cc2b | 有料 | https://note.com/stats47/n/nba8bf272cc2b | 【格差2.5歳】都道府県「初婚年齢（夫・妻）」ランキング2022：東京と山口の「2.5歳」の差と性別による違い |
| stats47-note | paid-nbead1fe772c7 | 有料 | https://note.com/stats47/n/nbead1fe772c7 | MCP server を庁内システムにつなぐ実験 (架空 LGWAN 想定) |
| stats47-note | paid-ncab0d7b04228 | 有料 | https://note.com/stats47/n/ncab0d7b04228 | AI 導入を渋る上席への対応 Q&A 集 (現場感あり) |
| stats47-note | paid-ncf695ba6eb35 | 有料 | https://note.com/stats47/n/ncf695ba6eb35 | 教育費、和歌山は富山の1.57倍！あなたの街の教育コストは？【2023年版】 |
| stats47-note | paid-nd2fd5adb4bed | 有料 | https://note.com/stats47/n/nd2fd5adb4bed | 収入格差1.65倍！2023年、日本の世帯収入ランキング。あなたの県は？ |
| stats47-note | paid-nd54b2958dc0e | 有料 | https://note.com/stats47/n/nd54b2958dc0e | 農地の転用面積の都道府県格差は9.8倍！偏差値76.4の北海道と偏差値37.6の福井県の驚きの差 |
| stats47-note | paid-nd5edff320928 | 有料 | https://note.com/stats47/n/nd5edff320928 | 【格差1.9倍】働く女性の「自分の時間」ランキング！1位神奈川、最下位は岩手。あなたの県は？ |
| stats47-note | paid-nead1c21768b5 | 有料 | https://note.com/stats47/n/nead1c21768b5 | 【2023年】趣味や遊びの費用、東京は宮崎の1.16倍！エンタメ費用の地域格差を大解剖 |
| stats47-note | paid-neecba2a1752d | 有料 | https://note.com/stats47/n/neecba2a1752d | 有効求人倍率、1位福井県と最下位神奈川県で2.2倍の格差！偏差値で見る雇用環境の地域差 |
| stats47-note | paid-nef7e875ba364 | 有料 | https://note.com/stats47/n/nef7e875ba364 | あなたの県は大丈夫？2024年年少人口割合、沖縄と秋田で1.8倍の衝撃格差 |
| stats47-note | paid-nefecfbe76bd2 | 有料 | https://note.com/stats47/n/nefecfbe76bd2 | 【2021年】都道府県の未来への投資力に6倍の格差！投資的経費の割合ランキング、あなたの県は？ |
| stats47-note | paid-nf0c82ce9cee0 | 有料 | https://note.com/stats47/n/nf0c82ce9cee0 | 苦情メール返信案を 5 パターン出す prompt |
| stats47-note | paid-nfd3ab8213e1f | 有料 | https://note.com/stats47/n/nfd3ab8213e1f | 既存の Excel マクロを Claude Code で Python 移植する |
| stats47-note | paid-nfe2c65e669a8 | 有料 | https://note.com/stats47/n/nfe2c65e669a8 | 【第2章】順序データの配色カタログ40選＆TypeScript実装レシピ |
| stats47-note | recovered-n023501038bd5 |  | https://note.com/stats47/n/n023501038bd5 | なぜ埼玉が「日照時間日本一」なのか — 意外な答えは地形にあった |
| stats47-note | recovered-n026bb22ad4eb |  | https://note.com/stats47/n/n026bb22ad4eb | 【2021年版】都道府県「バレーボールの行動者率」ランキング｜宮崎県が偏差値83.2で圧倒的1位、富山県は最下位 |
| stats47-note | recovered-n03844512d58a |  | https://note.com/stats47/n/n03844512d58a | エンゲル係数で見る所得格差 ── 低所得層33%、高所得層25%。食費の中身はもっと違う |
| stats47-note | recovered-n03e45e40d3a7 |  | https://note.com/stats47/n/n03e45e40d3a7 | 【保存版】GoogleマップでKMLファイルを利用する方法 |
| stats47-note | recovered-n04c2737daf2c |  | https://note.com/stats47/n/n04c2737daf2c | 【2021年版】都道府県「ヨガの行動者率」ランキング｜東京と青森で3倍の差 |
| stats47-note | recovered-n04d95ae14bc1 |  | https://note.com/stats47/n/n04d95ae14bc1 | 【2022年度】都道府県「実質公債費比率」ランキング｜北海道18.9%で47位、東京都はわずか1.2% |
| stats47-note | recovered-n0654ddf27920 |  | https://note.com/stats47/n/n0654ddf27920 | 【2021年版】都道府県「カラオケの行動者率」ランキング｜1位は東京都、2位に鹿児島県が浮上 |
| stats47-note | recovered-n08eb33492a93 |  | https://note.com/stats47/n/n08eb33492a93 | 【2021年版】都道府県「コーラス・声楽の行動者率」ランキング｜1位は神奈川県、東北の岩手県も上位に |
| stats47-note | recovered-n0b7373c9648a |  | https://note.com/stats47/n/n0b7373c9648a | 【2021年版】都道府県「サッカーの行動者率」ランキング｜1位は愛知県、最下位の岐阜県とは隣県で2倍以上の差 |
| stats47-note | recovered-n0e8fd0068d4e |  | https://note.com/stats47/n/n0e8fd0068d4e | 妊産婦支援に2.4倍の地域格差！広島県が偏差値86でトップ、あなたの県は？【2022年】 |
| stats47-note | recovered-n144d350fc14e |  | https://note.com/stats47/n/n144d350fc14e | なぜ沖縄の出生率は高いのか — 東京との差1.6倍を生む「見えない力」 |
| stats47-note | recovered-n14f716fcd76d |  | https://note.com/stats47/n/n14f716fcd76d | 【2021年版】都道府県「水泳の行動者率」ランキング｜東京が偏差値83で圧倒、青森は半分以下 |
| stats47-note | recovered-n15ee88b5169d |  | https://note.com/stats47/n/n15ee88b5169d | 医療費格差1.5倍！2022年国民健康保険診療費ランキング、あなたの県は健康？ |
| stats47-note | recovered-n1649910097fb |  | https://note.com/stats47/n/n1649910097fb | 【2021年版】都道府県「楽器の演奏の行動者率」ランキング｜沖縄8位・三線文化の力 |
| stats47-note | recovered-n16950238dfd8 |  | https://note.com/stats47/n/n16950238dfd8 | 【2022年度】都道府県「財政力指数」ランキング｜唯一の1.0超え東京都、茨城8位の意外 |
| stats47-note | recovered-n1b943c7d414d |  | https://note.com/stats47/n/n1b943c7d414d | 【2023年版】都道府県「薬局数」ランキング｜1位は意外にも佐賀県 |
| stats47-note | recovered-n1e63abcfba72 |  | https://note.com/stats47/n/n1e63abcfba72 | あなたの県は大丈夫？メディア接触時間、地域格差1.38倍！2021年無職男性の過ごし方 |
| stats47-note | recovered-n218588ef2f67 |  | https://note.com/stats47/n/n218588ef2f67 | 犯罪率3.3倍の衝撃！2022年特別法犯検挙件数ランキング、あなたの街の治安は？ |
| stats47-note | recovered-n21cb13582fe6 |  | https://note.com/stats47/n/n21cb13582fe6 | 【2023年版】都道府県「りんご消費量」ランキング｜産地・青森を抑えて長野が1位、京都8位の意外 |
| stats47-note | recovered-n24b5000d587f |  | https://note.com/stats47/n/n24b5000d587f | 女性のメディア時間、地域格差1.38倍！1位富山、最下位長野に見るライフスタイルの違い |
| stats47-note | recovered-n250b7aab145f |  | https://note.com/stats47/n/n250b7aab145f | 【2021年版】都道府県「スキー・スノーボードの行動者率」ランキング｜北海道が首位、沖縄との差は41.5倍 |
| stats47-note | recovered-n279776fbbbb1 |  | https://note.com/stats47/n/n279776fbbbb1 | 【2021年版】都道府県「サイクリングの行動者率」ランキング｜東京が偏差値91で独走、長崎は5分の1 |
| stats47-note | recovered-n27cb4242cb67 |  | https://note.com/stats47/n/n27cb4242cb67 | 【2021年版】都道府県「将棋の行動者率」ランキング｜1位は香川県、秋田県との差は2.7倍 |
| stats47-note | recovered-n285e0ba282d0 |  | https://note.com/stats47/n/n285e0ba282d0 | 【2021年版】都道府県「CD・スマートフォンなどによる音楽鑑賞の行動者率」ランキング｜東京64％と青森43％の21ポイ |
| stats47-note | recovered-n28943c36410a |  | https://note.com/stats47/n/n28943c36410a | 【2021年版】都道府県「趣味としての読書の行動者率」ランキング｜東京43％、青森23％の読書格差 |
| stats47-note | recovered-n2b4298e9ac07 |  | https://note.com/stats47/n/n2b4298e9ac07 | 【2.1倍格差】リタイア後の趣味時間、東京が圧勝！あなたの老後は大丈夫？ |
| stats47-note | recovered-n361a963fb079 |  | https://note.com/stats47/n/n361a963fb079 | 【2021年版】都道府県「邦楽の行動者率」ランキング｜沖縄県が偏差値97で圧倒的1位 |
| stats47-note | recovered-n36624f1c4134 |  | https://note.com/stats47/n/n36624f1c4134 | 【2021年版】都道府県「演芸・演劇・舞踊鑑賞の行動者率」ランキング｜東京は青森の約4倍 |
| stats47-note | recovered-n3908e5981967 |  | https://note.com/stats47/n/n3908e5981967 | 家計調査でわかること — 47都道府県の「お金の使い方」が丸見えになる統計 |
| stats47-note | recovered-n391d3ef70d29 |  | https://note.com/stats47/n/n391d3ef70d29 | 警察官の数が示す地域格差！2023年、東京が埼玉の約1.96倍でトップに |
| stats47-note | recovered-n3a4efa70c02a |  | https://note.com/stats47/n/n3a4efa70c02a | 【2023年】交通事故発生件数ランキング｜人口10万人当たりで比較する47都道府県 |
| stats47-note | recovered-n3a94353f31aa |  | https://note.com/stats47/n/n3a94353f31aa | 【2021年版】都道府県「グラウンドゴルフの行動者率」ランキング｜鹿児島が首位、格差は8.5倍 |
| stats47-note | recovered-n3e67c2f80ec1 |  | https://note.com/stats47/n/n3e67c2f80ec1 | 【2021年版】都道府県「園芸・ガーデニングの行動者率」ランキング｜群馬県が32.8％で1位、大阪は最下位 |
| stats47-note | recovered-n3e69a23bb946 |  | https://note.com/stats47/n/n3e69a23bb946 | 【2021年版】都道府県「バスケットボールの行動者率」ランキング｜バスケの本場・秋田県が1位、東京都はまさかの42位 |
| stats47-note | recovered-n3f65c01be9a8 |  | https://note.com/stats47/n/n3f65c01be9a8 | 【14.7倍差】一般粉じん発生施設数ランキング！あなたの街は大丈夫？愛知がワースト1位の衝撃 |
| stats47-note | recovered-n46a8eb03072b |  | https://note.com/stats47/n/n46a8eb03072b | 高等学校卒業者の進学率ランキング｜47都道府県の教育格差を徹底分析 |
| stats47-note | recovered-n48dff1df249f |  | https://note.com/stats47/n/n48dff1df249f | 【都道府県ランキング】日曜大工をする人が多い県1位は滋賀県｜東京は45位、格差1.5倍の実態 |
| stats47-note | recovered-n4d38db115f82 |  | https://note.com/stats47/n/n4d38db115f82 | 【2021年版】都道府県「編み物・手芸の行動者率」ランキング｜北海道が10.7％で圧倒的1位 |
| stats47-note | recovered-n4dae901ea3e8 |  | https://note.com/stats47/n/n4dae901ea3e8 | 貯蓄格差1.98倍！福井県が偏差値70で1位、あなたの県は？【2023年平均貯蓄率】 |
| stats47-note | recovered-n4e1e67f70686 |  | https://note.com/stats47/n/n4e1e67f70686 | 【2021年版】都道府県「器具を使ったトレーニングの行動者率」ランキング｜沖縄6位の意外な筋トレ県 |
| stats47-note | recovered-n5158c5766a07 |  | https://note.com/stats47/n/n5158c5766a07 | 生命保険格差1.6倍！鹿児島県が偏差値65でトップ、東京は最下位。あなたの地域の備えは？ |
| stats47-note | recovered-n51f946877627 |  | https://note.com/stats47/n/n51f946877627 | 【2021年版】都道府県「遊園地・動植物園・水族館の行動者率」ランキング｜愛知県が東京を抜いて1位 |
| stats47-note | recovered-n523b6fbeabdf |  | https://note.com/stats47/n/n523b6fbeabdf | 【2021年版】都道府県「野球の行動者率」ランキング｜1位はカープの街・広島県、プロ野球の影響色濃く |
| stats47-note | recovered-n55cd6de6a733 |  | https://note.com/stats47/n/n55cd6de6a733 | 【2021年版】都道府県「テニスの行動者率」ランキング｜神奈川が首位、テニス不毛地帯は意外にも雪国 |
| stats47-note | recovered-n567416b632f6 |  | https://note.com/stats47/n/n567416b632f6 | 【2022年度】都道府県「実質収支比率」ランキング｜島根県7.5%でトップ、長崎県0.3%で余裕なし |
| stats47-note | recovered-n578b6e871067 |  | https://note.com/stats47/n/n578b6e871067 | 【2021年版】都道府県「商業実務・ビジネス関係の行動者率」ランキング｜東京は青森の2.3倍 |
| stats47-note | recovered-n581a1409b2c9 |  | https://note.com/stats47/n/n581a1409b2c9 | 【2024年版】都道府県「大学数」ランキング｜京都が東京を抑えて1位の理由 |
| stats47-note | recovered-n583a06d171e1 |  | https://note.com/stats47/n/n583a06d171e1 | 【2021年版】都道府県「華道の行動者率」ランキング｜島根県が2.1％でトップ、都市部は低迷 |
| stats47-note | recovered-n5867882dd7ab |  | https://note.com/stats47/n/n5867882dd7ab | 【2021年版】都道府県「詩・和歌・俳句・小説などの創作の行動者率」ランキング｜東京と秋田で約3倍の差 |
| stats47-note | recovered-n598a096ecbff |  | https://note.com/stats47/n/n598a096ecbff | 【2021年版】都道府県「和裁・洋裁の行動者率」ランキング｜神奈川県が6.3％で全国1位 |
| stats47-note | recovered-n5ced125edb74 |  | https://note.com/stats47/n/n5ced125edb74 | 【2021年版】都道府県「ゴルフの行動者率」ランキング｜愛知が首位、青森は愛知の3分の1 |
| stats47-note | recovered-n5ddcfb6bf233 |  | https://note.com/stats47/n/n5ddcfb6bf233 | 【2021年版】都道府県「書道の行動者率」ランキング｜佐賀県が4.5％で全国1位 |
| stats47-note | recovered-n5f183fcf5b97 |  | https://note.com/stats47/n/n5f183fcf5b97 | 【2022年度】都道府県「将来負担比率」ランキング｜兵庫県330.8%で断トツ、東京都はわずか17.3% |
| stats47-note | recovered-n6305d990f2d2 |  | https://note.com/stats47/n/n6305d990f2d2 | 【2021年版】都道府県「邦舞・おどりの行動者率」ランキング｜鹿児島県が東京都と並んで1位 |
| stats47-note | recovered-n67729e8be7c4 |  | https://note.com/stats47/n/n67729e8be7c4 | 【2021年版】都道府県「バドミントンの行動者率」ランキング｜宮城が首位、長崎は全国の半分 |
| stats47-note | recovered-n68f5e09c8d62 |  | https://note.com/stats47/n/n68f5e09c8d62 | 690品目で丸裸にする「47都道府県の家計」── 家計調査が暴く、あなたの県の消費グセ |
| stats47-note | recovered-n6f8a367906d1 |  | https://note.com/stats47/n/n6f8a367906d1 | 【2024年版】都道府県「最高気温」ランキング｜猛暑日の常連は九州・東海 |
| stats47-note | recovered-n724eab276711 |  | https://note.com/stats47/n/n724eab276711 | 【2021年版】都道府県「人文・社会・自然科学の行動者率」ランキング｜東京14.6％、宮崎5.7％の知的格差 |
| stats47-note | recovered-n765fc88c67ef |  | https://note.com/stats47/n/n765fc88c67ef | 【2021年版】都道府県「芸術・文化の行動者率」ランキング｜東京17.3％が圧倒、神奈川・京都が同率2位 |
| stats47-note | recovered-n7ea3a816d39b |  | https://note.com/stats47/n/n7ea3a816d39b | 【2001年版】都道府県「旅行・行楽の年間行動者率」ランキング（15歳以上）｜1位は埼玉県、沖縄県は59％で断トツ最下位 |
| stats47-note | recovered-n7ff099157abd |  | https://note.com/stats47/n/n7ff099157abd | 【2021年版】都道府県「ジョギング・マラソンの行動者率」ランキング｜東京が首位、岐阜は半分 |
| stats47-note | recovered-n80e58a01f660 |  | https://note.com/stats47/n/n80e58a01f660 | 【都道府県ランキング】1人当たり県民所得1位は東京都5,214千円｜47位の沖縄県と2.4倍の格差 |
| stats47-note | recovered-n827191af8c1c |  | https://note.com/stats47/n/n827191af8c1c | 【2021年版】都道府県「海外旅行の年間行動者率」ランキング（10歳以上）｜コロナ禍で全国平均0.34％、1位は意外にも |
| stats47-note | recovered-n863f429319ca |  | https://note.com/stats47/n/n863f429319ca | 【2024年版】都道府県「最高気温」ランキング｜猛暑日の常連は九州・東海 |
| stats47-note | recovered-n88d2a55a9e36 |  | https://note.com/stats47/n/n88d2a55a9e36 | 【2021年版】都道府県「柔道の行動者率」ランキング｜山口県が偏差値91で圧倒的1位 |
| stats47-note | recovered-n8df3cf170cf4 |  | https://note.com/stats47/n/n8df3cf170cf4 | 【2021年版】都道府県「ソフトボールの行動者率」ランキング｜山口県が3.0％で圧倒的1位、1位と最下位の差は5倍 |
| stats47-note | recovered-n91e82ac3b13c |  | https://note.com/stats47/n/n91e82ac3b13c | 【2017年版】都道府県「ホテル客室数」ランキング｜東京は2位の大阪に1.6倍の大差 |
| stats47-note | recovered-n93a6656b2096 |  | https://note.com/stats47/n/n93a6656b2096 | 【都道府県ランキング】合計特殊出生率1位は沖縄県1.70｜47位の東京都と1.6倍の格差 |
| stats47-note | recovered-n97bd102186c6 |  | https://note.com/stats47/n/n97bd102186c6 | 【2021年版】都道府県「ボウリングの行動者率」ランキング｜沖縄が全国トップ、秋田は半分以下 |
| stats47-note | recovered-n991a75be91ce |  | https://note.com/stats47/n/n991a75be91ce | 【2021年版】都道府県「ゲームの行動者率」ランキング｜愛知が東京を僅差で抑えて1位 |
| stats47-note | recovered-n99561600d4fe |  | https://note.com/stats47/n/n99561600d4fe | 【1.9倍格差】リタイア後の女性、趣味を一番楽しむのは宮城県！あなたの地域は？ |
| stats47-note | recovered-n99f53e7a1f33 |  | https://note.com/stats47/n/n99f53e7a1f33 | 救急車を最も呼ぶのは大阪府！福井県との差は1.7倍。あなたの街の救急医療は大丈夫？ |
| stats47-note | recovered-n9dcb0680cea6 |  | https://note.com/stats47/n/n9dcb0680cea6 | 【2021年版】都道府県「絵画・彫刻の制作の行動者率」ランキング｜京都府が東京都に肉薄して2位 |
| stats47-note | recovered-na25ccb15a6cb |  | https://note.com/stats47/n/na25ccb15a6cb | 【2021年版】都道府県「写真の撮影・プリントの行動者率」ランキング｜青森と東京で約2倍の差 |
| stats47-note | recovered-na2720854b1d9 |  | https://note.com/stats47/n/na2720854b1d9 | 【2021年版】都道府県「キャンプの行動者率」ランキング｜北海道が9.1％でダントツ1位 |
| stats47-note | recovered-naa474d085c7b |  | https://note.com/stats47/n/naa474d085c7b | 【2021年版】都道府県「つりの行動者率」ランキング｜広島が首位、海なし県の東京が最下位 |
| stats47-note | recovered-nabd65a1c893d |  | https://note.com/stats47/n/nabd65a1c893d | 【2021年版】都道府県「美術鑑賞の行動者率」ランキング｜福井・石川・富山の北陸勢が上位に集結 |
| stats47-note | recovered-nafc693255794 |  | https://note.com/stats47/n/nafc693255794 | 【2021年版】都道府県「洋舞・社交ダンスの行動者率」ランキング｜東京都が1.7％で断トツ1位 |
| stats47-note | recovered-nb16c0b751d01 |  | https://note.com/stats47/n/nb16c0b751d01 | 【2021年版】都道府県「ウォーキング・軽い体操の行動者率」ランキング｜青森県は東京都の6割にとどまる |
| stats47-note | recovered-nb2d65c42c28b |  | https://note.com/stats47/n/nb2d65c42c28b | 【2024年版】都道府県「最高気温」ランキング｜猛暑日の常連は九州・東海 |
| stats47-note | recovered-nb90f2342ebd8 |  | https://note.com/stats47/n/nb90f2342ebd8 | 【2021年版】都道府県「映画館での映画鑑賞の行動者率」ランキング｜福井県7位の意外な映画好き県 |
| stats47-note | recovered-nbedecc99f3a3 |  | https://note.com/stats47/n/nbedecc99f3a3 | 【2021年版】都道府県「陶芸・工芸の行動者率」ランキング｜福井県と滋賀県が東京都と並んで1位 |
| stats47-note | recovered-nbf1373427ca3 |  | https://note.com/stats47/n/nbf1373427ca3 | 【2021年版】都道府県「パソコンなどの情報処理の行動者率」ランキング｜東京23.2％、岩手10.3％の格差 |
| stats47-note | recovered-nc0e7474b34e1 |  | https://note.com/stats47/n/nc0e7474b34e1 | 【2021年版】都道府県「登山・ハイキングの行動者率」ランキング｜東京と兵庫が同率首位、沖縄は4分の1 |
| stats47-note | recovered-nc60f702445f8 |  | https://note.com/stats47/n/nc60f702445f8 | 【2021年版】都道府県「国内旅行の行動者率」ランキング｜東京都41.7％、徳島県は16.3％ |
| stats47-note | recovered-ncaddeaf3e2ff |  | https://note.com/stats47/n/ncaddeaf3e2ff | 【2021年版】都道府県「卓球の行動者率」ランキング｜東京都が6.2％で1位、卓球人気の地域差は意外に大きい |
| stats47-note | recovered-ncbed56eb7c3d |  | https://note.com/stats47/n/ncbed56eb7c3d | 都道府県別総人口・人口密度ランキング2023：格差26倍の現実 |
| stats47-note | recovered-ncf6086199c7d |  | https://note.com/stats47/n/ncf6086199c7d | 【2021年版】都道府県「趣味としての料理・菓子作りの行動者率」ランキング｜東京都が21.9％で1位 |
| stats47-note | recovered-nd5f8b5072cdb |  | https://note.com/stats47/n/nd5f8b5072cdb | 【2024年版】都道府県「人口密度」ランキング｜東京と北海道で100倍の差 |
| stats47-note | recovered-nda04ec118c93 |  | https://note.com/stats47/n/nda04ec118c93 | 【2021年版】都道府県「行楽（日帰り）の行動者率」ランキング｜愛知県が1位、沖縄県は半分以下 |
| stats47-note | recovered-ndc600ddb7c44 |  | https://note.com/stats47/n/ndc600ddb7c44 | エアコン普及率、徳島vs北海道で11倍格差！あなたの地域は本当に「普通」？ |
| stats47-note | recovered-nddd927386fce |  | https://note.com/stats47/n/nddd927386fce | 住民問い合わせ FAQ を Claude Code で自動生成 |
| stats47-note | recovered-nded2d34fc978 |  | https://note.com/stats47/n/nded2d34fc978 | 財政力7位なのに借金1位？都道府県「稼ぐ力」と「借金」のギャップを可視化してみた |
| stats47-note | recovered-ne0d53bfef7ed |  | https://note.com/stats47/n/ne0d53bfef7ed | 【都道府県ランキング】持ち家比率1位は秋田県77.1％｜47位の沖縄県と1.8倍の格差 |
| stats47-note | recovered-ne31a2574e231 |  | https://note.com/stats47/n/ne31a2574e231 | 【2022年度】都道府県「経常収支比率」ランキング｜100%超えの大阪府、東京都は全国最低の79.5% |
| stats47-note | recovered-ne3cdb7819c41 |  | https://note.com/stats47/n/ne3cdb7819c41 | 【2021年版】都道府県「国内観光旅行の行動者率」ランキング｜東京34.2％で1位、徳島は11.4％ |
| stats47-note | recovered-ne4a6ec30706a |  | https://note.com/stats47/n/ne4a6ec30706a | 【2021年版】都道府県「マンガを読む行動者率」ランキング｜全国平均34％、3人に1人がマンガ読者 |
| stats47-note | recovered-ne5b9d2b01255 |  | https://note.com/stats47/n/ne5b9d2b01255 | 【2021年版】都道府県「囲碁の行動者率」ランキング｜1位は意外にも長崎県 |
| stats47-note | recovered-ne62fa955bcff |  | https://note.com/stats47/n/ne62fa955bcff | 【2021年版】都道府県「旅行・行楽の年間行動者率」ランキング（10歳以上）｜コロナ禍で半数以下に急落、愛知県がトップ |
| stats47-note | recovered-ne82a6c83ed45 |  | https://note.com/stats47/n/ne82a6c83ed45 | 【2022年度】都道府県「地方債現在高比率」ランキング｜なぜ財政力7位の静岡が借金ワースト？大阪41位の意外 |
| stats47-note | recovered-ne85980349fda |  | https://note.com/stats47/n/ne85980349fda | 【2021年版】都道府県「スポーツ観覧の行動者率」ランキング｜広島県が偏差値92で圧倒的1位 |
| stats47-note | recovered-nead586305cdb |  | https://note.com/stats47/n/nead586305cdb | 【2021年版】都道府県「パチンコの行動者率」ランキング｜九州勢が上位独占、東京は46位 |
| stats47-note | recovered-ned30a382334d |  | https://note.com/stats47/n/ned30a382334d | 【2024年版】都道府県「大学数」ランキング｜京都が東京を抑えて1位の理由 |
| stats47-note | recovered-nefd814b49c5d |  | https://note.com/stats47/n/nefd814b49c5d | 【2021年版】都道府県「スポーツの年間行動者率」ランキング（10歳以上）｜東京都が圧倒的1位、青森県との差は22ポイン |
| stats47-note | recovered-nf0c533293f5b |  | https://note.com/stats47/n/nf0c533293f5b | 【2021年版】都道府県「クラシック音楽鑑賞の行動者率」ランキング｜福井県3位・山形県9位の意外な結果 |
| stats47-note | recovered-nf0fc2a7eb326 |  | https://note.com/stats47/n/nf0fc2a7eb326 | 【2021年版】都道府県「家政・家事の行動者率」ランキング｜京都府が1位、青森県との差は1.8倍 |
| stats47-note | recovered-nf1a5abab3d5e |  | https://note.com/stats47/n/nf1a5abab3d5e | 【2021年版】都道府県「ポピュラー音楽鑑賞の行動者率」ランキング｜沖縄県が最下位の意外 |
| stats47-note | recovered-nf5b4ced7a736 |  | https://note.com/stats47/n/nf5b4ced7a736 | 【2021年版】都道府県「ボランティア活動の年間行動者率」ランキング（10歳以上）｜子どもを含めても島根県が不動の1位 |
| stats47-note | recovered-nf962c6702b93 |  | https://note.com/stats47/n/nf962c6702b93 | 【2023年版】都道府県「年間日照時間」ランキング！1位埼玉と最下位青森に「1.4倍」の差 |
| stats47-note | recovered-nfa4057b9b8de |  | https://note.com/stats47/n/nfa4057b9b8de | 【2021年版】都道府県「茶道の行動者率」ランキング｜1位は京都ではなく富山県 |
| stats47-note | recovered-nfbdfd99fee1b |  | https://note.com/stats47/n/nfbdfd99fee1b | 【2021年版】都道府県「映画館以外での映画鑑賞の行動者率」ランキング｜東京は6割超、青森は4割台 |
| stats47-note | recovered-nfe69996fb5c9 |  | https://note.com/stats47/n/nfe69996fb5c9 | 家計を圧迫する光熱・水道費！2023年、青森が最下位大分の1.7倍超えで全国1位に |
