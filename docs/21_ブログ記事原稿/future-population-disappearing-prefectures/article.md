---
title: "30年で人口が4割消える県はどこ？"
seoTitle: "将来人口減少率ランキング2050｜秋田-41.6%・青森-39.0%、増えるのは東京だけ 47都道府県"
subtitle: "秋田は96万→56万人、増えるのは東京1都だけ──IPSS推計が示す2050年の地図"
description: "「人口減少は地方の問題」で片づけてよいのか──IPSS令和5年推計では、2050年に人口が増えるのは東京都ただ1つ。秋田は-41.6%で約96万人→約56万人へ、11県が3割以上減る。なぜ同じ国でこれほど未来が分かれるのかを、高齢化率・財政力・人の移動の3指標で解き明かす。"
category: population
tags:
  - 将来推計人口
  - 人口減少
  - 高齢化
  - 財政力指数
  - 2050年
publishedAt: 未定
updatedAt: 未定
published: false
ogImage: /blog/future-population-disappearing-prefectures/og.png
---

「人口減少は、いずれどこかの地方で起きること」——多くの人がそう思っているかもしれない。だが国立社会保障・人口問題研究所（IPSS）の令和5年推計を1枚の地図に落とすと、その認識は崩れる。**2020年から2050年の30年間で人口が「増える」のは、47都道府県のうち東京都ただ1つ（+2.5%）。** 残り46道府県はすべて減る。

最も激しいのは秋田県の **-41.6%**。約96万人が約56万人へ、人口の4割が消える計算だ。しかも-30%以上の「3割減」に達する県は11もある。

本記事が問いたいのは「どこが何位か」ではない。**なぜ同じ日本で、これほど未来が枝分かれするのか。** 減る県には、高齢化率・財政力・人の流れに共通したプロファイルがある。それをデータで描き出す。

> [!NOTE]
> 数値は国立社会保障・人口問題研究所「日本の地域別将来推計人口（令和5年推計）」に基づく将来推計人口（2020年実績→2050年推計）と、その増減率。あくまで「現在の出生・死亡・移動の傾向が続いた場合」のシナリオであり、予言ではない。ただし出生はすでに起きた出生数に強く規定されるため、向こう30年の大枠は実績に近い精度で見通せる。

## 増えるのは東京だけ──2050年増減率ランキング

将来人口増減率の上位・下位を並べると、構図は一目瞭然だ。プラスは東京都（+2.5%）のみ。2位の沖縄県でさえ-5.21%とマイナスに沈む。下位は秋田・青森・岩手と東北が独占し、四国の高知（-34.78%）も食い込む。

<!-- data-source: docs/21_ブログ記事原稿/future-population-disappearing-prefectures/data/change-rate-2050.json (IPSS 令和5年推計, 将来人口増減率 2020→2050) -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 560" width="680" height="560" role="img" aria-label="2050年 将来人口増減率 ワースト15と東京の比較">
  <title>2050年 将来人口増減率：東京+2.5%、秋田-41.6%</title>
  <style>
    .svg-bg { fill: #ffffff; }
    .svg-title { fill: #1f2937; }
    .svg-label { fill: #374151; }
    .svg-val { fill: #374151; }
    .svg-axis { stroke: #9ca3af; }
    .svg-grid { stroke: #e5e7eb; }
    .bar-pos { fill: #1565c0; }
    .bar-neg { fill: #c62828; }
    @media (prefers-color-scheme: dark) {
      .svg-bg { fill: #0f172a; }
      .svg-title { fill: #f1f5f9; }
      .svg-label { fill: #cbd5e1; }
      .svg-val { fill: #cbd5e1; }
      .svg-axis { stroke: #64748b; }
      .svg-grid { stroke: #334155; }
      .bar-pos { fill: #42a5f5; }
      .bar-neg { fill: #ef5350; }
    }
  </style>
  <rect class="svg-bg" x="0" y="0" width="680" height="560"/>
  <text class="svg-title" x="20" y="30" font-size="16" font-weight="bold">将来人口増減率（2020→2050）：増えるのは東京だけ</text>
  <text class="svg-label" x="20" y="50" font-size="11">単位：％／出典：IPSS 令和5年推計</text>
  <!-- ゼロ基準線 x=300 -->
  <line class="svg-axis" x1="300" y1="70" x2="300" y2="530" stroke-width="1"/>
  <text class="svg-label" x="300" y="548" font-size="10" text-anchor="middle">0%</text>
  <!-- 各行: scale 1% = 6px。負は左、正は右 -->
  <g font-size="11">
    <!-- 東京 +2.5 -->
    <text class="svg-label" x="296" y="86" text-anchor="end">東京都</text>
    <rect class="bar-pos" x="300" y="78" width="15" height="14" rx="2"/>
    <text class="svg-val" x="319" y="89">+2.5%</text>
    <!-- 沖縄 -5.21 -->
    <text class="svg-label" x="304" y="108" text-anchor="start">沖縄県</text>
    <rect class="bar-neg" x="269" y="100" width="31" height="14" rx="2"/>
    <text class="svg-val" x="265" y="111" text-anchor="end">-5.2%</text>
    <!-- 新潟 -30.72 (rank37) -->
    <text class="svg-label" x="304" y="130" text-anchor="start">新潟県</text>
    <rect class="bar-neg" x="116" y="122" width="184" height="14" rx="2"/>
    <text class="svg-val" x="112" y="133" text-anchor="end">-30.7%</text>
    <!-- 山口 -30.99 -->
    <text class="svg-label" x="304" y="152" text-anchor="start">山口県</text>
    <rect class="bar-neg" x="114" y="144" width="186" height="14" rx="2"/>
    <text class="svg-val" x="110" y="155" text-anchor="end">-31.0%</text>
    <!-- 和歌山 -31.54 -->
    <text class="svg-label" x="304" y="174" text-anchor="start">和歌山県</text>
    <rect class="bar-neg" x="111" y="166" width="189" height="14" rx="2"/>
    <text class="svg-val" x="107" y="177" text-anchor="end">-31.5%</text>
    <!-- 福島 -31.98 -->
    <text class="svg-label" x="304" y="196" text-anchor="start">福島県</text>
    <rect class="bar-neg" x="108" y="188" width="192" height="14" rx="2"/>
    <text class="svg-val" x="104" y="199" text-anchor="end">-32.0%</text>
    <!-- 徳島 -33.2 -->
    <text class="svg-label" x="304" y="218" text-anchor="start">徳島県</text>
    <rect class="bar-neg" x="101" y="210" width="199" height="14" rx="2"/>
    <text class="svg-val" x="97" y="221" text-anchor="end">-33.2%</text>
    <!-- 山形 -33.44 -->
    <text class="svg-label" x="304" y="240" text-anchor="start">山形県</text>
    <rect class="bar-neg" x="99" y="232" width="201" height="14" rx="2"/>
    <text class="svg-val" x="95" y="243" text-anchor="end">-33.4%</text>
    <!-- 長崎 -33.8 -->
    <text class="svg-label" x="304" y="262" text-anchor="start">長崎県</text>
    <rect class="bar-neg" x="97" y="254" width="203" height="14" rx="2"/>
    <text class="svg-val" x="93" y="265" text-anchor="end">-33.8%</text>
    <!-- 高知 -34.78 -->
    <text class="svg-label" x="304" y="284" text-anchor="start">高知県</text>
    <rect class="bar-neg" x="91" y="276" width="209" height="14" rx="2"/>
    <text class="svg-val" x="87" y="287" text-anchor="end">-34.8%</text>
    <!-- 岩手 -35.3 (rank45) -->
    <text class="svg-label" x="304" y="306" text-anchor="start">岩手県</text>
    <rect class="bar-neg" x="88" y="298" width="212" height="14" rx="2"/>
    <text class="svg-val" x="84" y="309" text-anchor="end">-35.3%</text>
    <!-- 青森 -39.03 (rank46) -->
    <text class="svg-label" x="304" y="328" text-anchor="start">青森県</text>
    <rect class="bar-neg" x="66" y="320" width="234" height="14" rx="2"/>
    <text class="svg-val" x="62" y="331" text-anchor="end">-39.0%</text>
    <!-- 秋田 -41.59 (rank47) -->
    <text class="svg-label" x="304" y="350" text-anchor="start">秋田県</text>
    <rect class="bar-neg" x="50" y="342" width="250" height="14" rx="2"/>
    <text class="svg-val" x="46" y="353" text-anchor="end" font-weight="bold">-41.6%</text>
  </g>
  <text class="svg-label" x="20" y="392" font-size="11">※下位は新潟（37位）以下を抜粋。プラスは東京のみ、秋田（47位）が最大の減少。</text>
</svg>

東京以外で「マシ」なのは、いずれも大都市圏か沖縄だ。神奈川-7.72%・千葉-9.46%・埼玉-9.68%と、東京を取り囲む首都圏3県が上位を占める。つまり**減りにくい県とは「人が集まり続ける県」**であり、減少率ランキングは事実上「人の引力ランキング」の裏返しになっている。

<source-link href="/ranking/future-population-change-rate-2050">将来人口増減率（2020→2050）のランキングをもっと見る</source-link>

## 「3割減」は11県──東北・四国・中国地方に集中

減少率を地域で区切ると、深刻さの地理的な偏りがはっきりする。**-30%以上（3割減）に達する県は11**。下表のとおり、東北6県のうち5県（秋田・青森・岩手・山形・福島）が顔をそろえ、四国（高知・徳島）、中国・北陸（山口・新潟）、九州（長崎）、近畿（和歌山）が続く。

| 順位 | 都道府県 | 2050年増減率 | 地域 |
|---|---|---|---|
| 47 | 秋田県 | -41.6% | 東北 |
| 46 | 青森県 | -39.0% | 東北 |
| 45 | 岩手県 | -35.3% | 東北 |
| 44 | 高知県 | -34.8% | 四国 |
| 43 | 長崎県 | -33.8% | 九州 |
| 42 | 山形県 | -33.4% | 東北 |
| 41 | 徳島県 | -33.2% | 四国 |
| 40 | 福島県 | -32.0% | 東北 |
| 39 | 和歌山県 | -31.5% | 近畿 |
| 38 | 山口県 | -31.0% | 中国 |
| 37 | 新潟県 | -30.7% | 北陸・甲信越 |

秋田県を絶対数で見ると重みが伝わる。2050年の推計人口は **約56万人（560,429人）**。-41.6%という減少率から逆算すると2020年は約96万人だったから、政令市1つぶんに近い人口が、30年で県から失われる規模だ。

> [!WARNING]
> 「減少率が大きい＝人口が少ない県」ではない点に注意。新潟県（-30.7%）は2020年時点で約220万人規模の中堅県であり、率は11位でも失われる「人数」はワースト県より多い。率（スピード）と量（規模）は別の物差しであり、政策の優先度を測るときは両方を見る必要がある。

<source-link href="/ranking/future-population">2050年の将来推計人口（実数）ランキングを見る</source-link>

## なぜ減るのか──高齢化・財政・人の流出が重なる「負のスパイラル」

減る県には共通したプロファイルがある。減少率ワースト4県（秋田・青森・岩手・高知）と、唯一増える東京都を、3つの指標で並べてみる。

<!-- data-source: docs/21_ブログ記事原稿/future-population-disappearing-prefectures/data/cross-metrics.json (高齢化率2024 / 財政力指数2022 / 転入超過率2024) -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 360" width="680" height="360" role="img" aria-label="減少率ワースト県と東京の指標比較">
  <title>減少率ワースト県は高齢化率が高く財政力が弱い</title>
  <style>
    .svg-bg { fill: #ffffff; }
    .svg-title { fill: #1f2937; }
    .svg-label { fill: #374151; }
    .svg-head { fill: #1f2937; }
    .svg-grid { stroke: #e5e7eb; }
    .c-tokyo { fill: #1565c0; }
    .c-worst { fill: #c62828; }
    @media (prefers-color-scheme: dark) {
      .svg-bg { fill: #0f172a; }
      .svg-title { fill: #f1f5f9; }
      .svg-label { fill: #cbd5e1; }
      .svg-head { fill: #f1f5f9; }
      .svg-grid { stroke: #334155; }
      .c-tokyo { fill: #42a5f5; }
      .c-worst { fill: #ef5350; }
    }
  </style>
  <rect class="svg-bg" x="0" y="0" width="680" height="360"/>
  <text class="svg-title" x="20" y="28" font-size="15" font-weight="bold">減少率ワースト県 vs 東京：3指標の対比</text>
  <text class="svg-label" x="20" y="46" font-size="11">高齢化率(2024) ／ 財政力指数(2022) ／ 転入超過率(2024)</text>
  <!-- 表ヘッダ -->
  <line class="svg-grid" x1="20" y1="62" x2="660" y2="62" stroke-width="1"/>
  <g font-size="12">
    <text class="svg-head" x="28" y="80" font-weight="bold">県</text>
    <text class="svg-head" x="180" y="80" font-weight="bold" text-anchor="middle">2050年増減率</text>
    <text class="svg-head" x="330" y="80" font-weight="bold" text-anchor="middle">高齢化率</text>
    <text class="svg-head" x="470" y="80" font-weight="bold" text-anchor="middle">財政力指数</text>
    <text class="svg-head" x="610" y="80" font-weight="bold" text-anchor="middle">転入超過率</text>
  </g>
  <line class="svg-grid" x1="20" y1="92" x2="660" y2="92" stroke-width="1"/>
  <g font-size="12">
    <!-- 秋田 -->
    <text class="c-worst" x="28" y="116" font-weight="bold">秋田県</text>
    <text class="svg-label" x="180" y="116" text-anchor="middle">-41.6%</text>
    <text class="svg-label" x="330" y="116" text-anchor="middle">39.5%（全国1位）</text>
    <text class="svg-label" x="470" y="116" text-anchor="middle">0.309（44位）</text>
    <text class="svg-label" x="610" y="116" text-anchor="middle">-0.37%</text>
    <line class="svg-grid" x1="20" y1="128" x2="660" y2="128" stroke-width="0.5"/>
    <!-- 青森 -->
    <text class="c-worst" x="28" y="152" font-weight="bold">青森県</text>
    <text class="svg-label" x="180" y="152" text-anchor="middle">-39.0%</text>
    <text class="svg-label" x="330" y="152" text-anchor="middle">35.7%（3位）</text>
    <text class="svg-label" x="470" y="152" text-anchor="middle">0.342（37位）</text>
    <text class="svg-label" x="610" y="152" text-anchor="middle">-0.45%</text>
    <line class="svg-grid" x1="20" y1="164" x2="660" y2="164" stroke-width="0.5"/>
    <!-- 岩手 -->
    <text class="c-worst" x="28" y="188" font-weight="bold">岩手県</text>
    <text class="svg-label" x="180" y="188" text-anchor="middle">-35.3%</text>
    <text class="svg-label" x="330" y="188" text-anchor="middle">35.4%（7位）</text>
    <text class="svg-label" x="470" y="188" text-anchor="middle">0.354（36位）</text>
    <text class="svg-label" x="610" y="188" text-anchor="middle">-0.43%</text>
    <line class="svg-grid" x1="20" y1="200" x2="660" y2="200" stroke-width="0.5"/>
    <!-- 高知 -->
    <text class="c-worst" x="28" y="224" font-weight="bold">高知県</text>
    <text class="svg-label" x="180" y="224" text-anchor="middle">-34.8%</text>
    <text class="svg-label" x="330" y="224" text-anchor="middle">36.6%（2位）</text>
    <text class="svg-label" x="470" y="224" text-anchor="middle">0.261（46位）</text>
    <text class="svg-label" x="610" y="224" text-anchor="middle">-0.48%（全国最大の流出）</text>
    <line class="svg-grid" x1="20" y1="236" x2="660" y2="236" stroke-width="1"/>
    <!-- 東京 (対照) -->
    <text class="c-tokyo" x="28" y="262" font-weight="bold">東京都</text>
    <text class="svg-label" x="180" y="262" text-anchor="middle">+2.5%</text>
    <text class="svg-label" x="330" y="262" text-anchor="middle">22.7%（全国最低）</text>
    <text class="svg-label" x="470" y="262" text-anchor="middle">1.064（1位）</text>
    <text class="svg-label" x="610" y="262" text-anchor="middle">+0.56%（全国1位）</text>
  </g>
  <line class="svg-grid" x1="20" y1="274" x2="660" y2="274" stroke-width="1"/>
  <text class="svg-label" x="20" y="300" font-size="11">高齢化率が高い／財政力が弱い／人が流出する──3つが重なる県ほど深く減る。</text>
  <text class="svg-label" x="20" y="320" font-size="11">東京は3指標すべてで正反対の極にあり、唯一プラス成長を続ける。</text>
</svg>

3つの数字の並びは偶然ではない。**高齢化率の全国1位は秋田（39.5%）、2位は高知（36.6%）、3位は青森（35.7%）**で、いずれも減少率ワースト県と重なる。高齢者比率が高いということは、これから亡くなる世代が多く、子どもを産む若い世代が少ないことを意味する。出生で補えない自然減が、構造的に決まっているのだ。

財政も連動する。財政力指数（自前で財源を賄える度合い、1.0で自立）はワースト4県すべてが0.26〜0.35と低い。対して東京は1.06で全国唯一の「自立」県。人口が減れば税収が減り、行政サービスを維持しにくくなり、それがさらに転出を促す——**人口減→税収減→サービス低下→転出増→さらに人口減**という負のループが見える。

そして人の移動。**転入超過率がプラス（流入超過）なのは全国でわずか7都府県**で、東京（+0.56%）を筆頭に首都圏と大阪・愛知に偏る。残り40道府県は転出超過で、高知の-0.48%は全国最大の流出だ。減る県は「生まれる人が少なく、出ていく人が多い」二重の流出にさらされている。

> [!TIP]
> 増える東京と減る秋田は、3指標すべてで正反対の位置にある。逆に言えば「高齢化率を下げ、財政基盤を強め、転出を止める」のどれか1つだけでは流れは変わらない。人口維持は単一施策では届かない複合問題だ、というのがこのデータの含意である。

<source-link href="/ranking/fiscal-strength-index-prefecture">財政力指数ランキング（都道府県）を見る</source-link>

## 出生率が高くても減る県がある──「健闘型の悲劇」

ここで一つ、見落とされがちな事実を補っておきたい。「子どもをたくさん産めば人口は維持できる」という直感は、必ずしも正しくない。

長崎県の合計特殊出生率は全国でも高い部類だが、2050年の人口は **-33.8%**（43位）と大きく減る見込みだ。理由は明快で、生まれた若者が進学・就職で県外へ出ていくから。出生で人口を生み出しても、20歳前後でそれを首都圏に「輸出」してしまえば、県内には残らない。

> [!NOTE]
> 合計特殊出生率の全国分布は西高東低で、九州・沖縄が高く東京が最低（東京は1.0前後）。それでも将来人口で東京が勝ち、九州が負けるのは、出生の差を上回る規模で「人の移動」が効いているため。出生率と将来人口の順位が一致しないこの「ズレ」こそ、人口問題の核心といえる。

つまり人口維持の方程式は「出生率」単独ではなく、**出生率 × 定着率（流出させない力）** の掛け算だ。出生率を上げても定着率がゼロに近ければ、人口は積み上がらない。長崎・鹿児島のような「出生は健闘しているのに減る県」の存在が、それを物語っている。

<source-link href="/ranking/total-fertility-rate">合計特殊出生率ランキングを見る</source-link>

## まとめ：30年後の地図は、すでに大枠が描かれている

- **2050年に人口が増えるのは東京都だけ（+2.5%）。** 残り46道府県はすべて減る。
- 最大の減少は **秋田県の-41.6%**（約96万人→約56万人）。次いで青森-39.0%、岩手-35.3%。
- **-30%以上（3割減）は11県**で、東北5県を中心に四国・中国・九州へ広がる。
- 減る県は「**高齢化率が高い・財政力が弱い・人が流出する**」3条件が重なる。秋田は高齢化率全国1位（39.5%）・財政力44位（0.31）・転出超過と、三拍子そろう。
- 出生率が高くても若者が流出すれば減る（長崎-33.8%）。人口維持は **出生率 × 定着率** の掛け算であり、単一施策では止まらない。

将来推計人口は「予言」ではないが、向こう30年に親になる世代はすでに生まれている以上、大枠は揺らぎにくい。地図の色は、これから塗られるのではなく、もう下描きされている——その前提に立てるかどうかが、地域政策の分かれ目になる。

> [!WARNING]
> 本記事の数値は「現在のトレンドが継続した場合」のシナリオである。大規模な移住促進、出生環境の改善、外国人の受け入れ拡大などが進めば結果は変わりうる。推計を「変えられない運命」ではなく「介入の余地を測る基準線」として読むのが正しい使い方だ。

### データ出典

- 国立社会保障・人口問題研究所「日本の地域別将来推計人口（令和5年推計）」（将来推計人口 2020年実績→2050年推計、および増減率）
- 総務省「住民基本台帳人口移動報告」（転入超過率 2024年）
- 総務省「人口推計」（65歳以上人口割合 2024年）
- 総務省「地方財政状況調査」（財政力指数 2022年度）

いずれも政府統計の総合窓口（e-Stat）を通じて整備されたデータを集計。

### 関連記事

- [出生率ワーストの東京が唯一人口増──2050年の「東京パラドックス」](/blog/future-population-tokyo-paradox)
- [人口密度ランキング──東京と過疎県で広がる格差の構造](/blog/population-density-urbanization)
- [転入超過率で見る東京一極集中──人はどこへ動いているか](/blog/population-migration-tokyo-concentration)
