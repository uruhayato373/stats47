/**
 * 値の分布が「正当である」と検証済みの metric 台帳。
 *
 * ## なぜ「壊れの allowlist」と別ファイルなのか
 *
 * `expected-shape-anomaly.ts` は **壊れているものを期限つきで許可する**生成物
 * (`--emit-allowlist` の出力を貼る・縮小専用ラチェット)。こちらは逆向きで、
 * **agent が中身を確認して「この形が正しい」と確定したもの**を手書きで積む台帳。
 * 同じファイルに混ぜると emit-allowlist の再生成で検証結果が吹き飛ぶ。
 *
 * ## なぜ boolean ではなく「予測」を書かせるのか (★この設計の要)
 *
 * `verified: true` だと agent が中身を見ずに一括承認でき、緑の板と実際の検証が区別できない。
 * 検知を狭めて見ないのと、見たふりをするのは失敗の質が同じ。
 *
 * そこで **観測できる上限・下限を予測として書かせる**:
 *
 *   - 中身を見ないと数字が書けない (地熱発電所が何県にあるか調べないと zeroShareMax を出せない)
 *   - 書いた数字は以後ずっと機械が照合し続ける
 *   - データが変われば自動で再オープンする (`profile-violated` → 監査が即失敗)
 *
 * これは `ExpectedShapeAnomalyEntry.observedSeverity` (悪化したら降格しない) と同じ発想を、
 * 「正当」側にも適用したもの。
 *
 * ## 書くときの規律 (`.claude/rules/evidence-based-judgment.md`)
 *
 * - `evidence` は**何をどう確認したか**を書く。「たぶん施設が少ないから」は不可。
 *   「地熱発電所は大分・秋田など 7 県のみに立地」のように**検証可能な事実**を書く
 * - 判断が付かないものは **profile を書かない**。unverified のまま残す方が正しい
 *   (未検証は週次監査のラチェットに載るので消えない)
 * - 一度書いた予測を「データが変わったから」で緩めない。再オープンしたら**再検証**する
 *
 * 正典: `.claude/rules/metric-config-standards.md` §検証済みプロファイル方式
 * 運用: skill `/verify-value-distribution` (owner: data-ingester)
 */

/** 検証で確定した「この範囲なら正当」の予測 */
export interface VerifiedValueProfile {
  /** METRICS_REGISTRY に実在する rankingKey */
  key: string;
  /**
   * 最新年のゼロ率の上限 (0-1)。これを**超えたら** profile-violated。
   * 現在値ちょうどではなく少し余裕を持たせる (標本の揺れで毎週赤くならないように)。
   */
  zeroShareMax?: number;
  /** 最新年の行数の下限。これを**下回ったら** profile-violated */
  rowCountMin?: number;
  /** 負値が定義上正当か (増減率・収支差額・気温など) */
  negativesAllowed?: boolean;
  /** 何をどう確認したか。推測ではなく検証可能な事実を書く */
  evidence: string;
  /** 根拠にした一次情報 / e-Stat 統計表 / repo 内パス */
  sourceUrl: string;
  /** 検証日 (ISO date) */
  verifiedAt: string;
}

export const VERIFIED_VALUE_PROFILES: readonly VerifiedValueProfile[] = [
  // --- 負値が定義上正当なもの (2026-08-05 検証) ---
  // 増減率・変化率・成長率・転入超過・気温・純減率は**定義上マイナスを取りうる**。
  // config の title / unit を 1 件ずつ読んで確認した。
  {
    key: "natural-increase-rate",
    negativesAllowed: true,
    evidence: "title=自然増減率・unit=‰。出生数が死亡数を下回れば負になる定義",
    sourceUrl: "packages/data-configs/src/metrics/natural-increase-rate.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "future-population-change-rate-2050",
    negativesAllowed: true,
    evidence: "description=2020年人口に対する2050年推計人口の増減率(%)。人口減少県は負",
    sourceUrl: "packages/data-configs/src/metrics/future-population-change-rate-2050.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "population-growth-rate",
    negativesAllowed: true,
    evidence: "title=人口増減率・unit=‰。減少県は負になる定義",
    sourceUrl: "packages/data-configs/src/metrics/population-growth-rate.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "moving-in-excess-rate-japanese",
    negativesAllowed: true,
    evidence: "title=転入超過率・subtitle=日本人移動者・unit=％。転出超過の県は負",
    sourceUrl: "packages/data-configs/src/metrics/moving-in-excess-rate-japanese.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "moving-in-excess-rate",
    negativesAllowed: true,
    evidence: "title=転入超過率・subtitle=外国人移動者・unit=％。転出超過の県は負",
    sourceUrl: "packages/data-configs/src/metrics/moving-in-excess-rate.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "gross-prefectural-income-growth-rate-real-h17",
    negativesAllowed: true,
    evidence: "title=県民総所得対前年増加率・実質H17基準・unit=％。減少年は負",
    sourceUrl: "packages/data-configs/src/metrics/gross-prefectural-income-growth-rate-real-h17.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "social-increase-rate",
    negativesAllowed: true,
    evidence: "title=社会増減率・unit=‰。転出超過の県は負になる定義",
    sourceUrl: "packages/data-configs/src/metrics/social-increase-rate.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "residential-land-price-change-rate",
    negativesAllowed: true,
    evidence: "title=住宅地地価変動率・unit=%。地価下落の県は負",
    sourceUrl: "packages/data-configs/src/metrics/residential-land-price-change-rate.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "standard-price-change-rate-residential",
    negativesAllowed: true,
    evidence: "title=標準価格対前年平均変動率・住宅地・unit=％。下落で負",
    sourceUrl: "packages/data-configs/src/metrics/standard-price-change-rate-residential.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "prefectural-income-growth-rate-h17",
    negativesAllowed: true,
    evidence: "title=県民所得対前年増加率・H17基準・unit=％。減少年は負",
    sourceUrl: "packages/data-configs/src/metrics/prefectural-income-growth-rate-h17.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "social-increase",
    negativesAllowed: true,
    evidence: "title=社会増減数・unit=人。転出超過の県は負になる増減数の定義",
    sourceUrl: "packages/data-configs/src/metrics/social-increase.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "prefectural-income-growth-rate-h23",
    negativesAllowed: true,
    evidence: "title=県民所得対前年増加率・H23基準・unit=％。減少年は負",
    sourceUrl: "packages/data-configs/src/metrics/prefectural-income-growth-rate-h23.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "standard-price-change-rate-commercial",
    negativesAllowed: true,
    evidence: "title=標準価格対前年平均変動率・商業地・unit=％。下落で負",
    sourceUrl: "packages/data-configs/src/metrics/standard-price-change-rate-commercial.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "gdp-growth-rate-pref-h23",
    negativesAllowed: true,
    evidence: "title=県内総生産額対前年増加率・H23基準・unit=％。減少年は負",
    sourceUrl: "packages/data-configs/src/metrics/gdp-growth-rate-pref-h23.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "gross-prefectural-income-growth-rate-nominal-h23",
    negativesAllowed: true,
    evidence: "title=県民総所得対前年増加率・名目H23基準・unit=％。減少年は負",
    sourceUrl: "packages/data-configs/src/metrics/gross-prefectural-income-growth-rate-nominal-h23.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "lowest-temperature",
    negativesAllowed: true,
    evidence: "title=最低気温・unit=℃。摂氏の気温は氷点下で負になる",
    sourceUrl: "packages/data-configs/src/metrics/lowest-temperature.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "industrial-land-price-change-rate",
    negativesAllowed: true,
    evidence: "title=標準価格変動率(工業地)・unit=%。地価下落で負",
    sourceUrl: "packages/data-configs/src/metrics/industrial-land-price-change-rate.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "standard-price-change-rate-industrial",
    negativesAllowed: true,
    evidence: "title=標準価格対前年平均変動率・工業地・unit=％。下落で負",
    sourceUrl: "packages/data-configs/src/metrics/standard-price-change-rate-industrial.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "cpi-change-rate-housing",
    negativesAllowed: true,
    evidence: "title=消費者物価指数変化率・住居・unit=％。物価下落で負",
    sourceUrl: "packages/data-configs/src/metrics/cpi-change-rate-housing.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "gdp-growth-rate-pref-h17",
    negativesAllowed: true,
    evidence: "title=県内総生産額対前年増加率・H17基準・unit=％。減少年は負",
    sourceUrl: "packages/data-configs/src/metrics/gdp-growth-rate-pref-h17.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "gross-prefectural-income-growth-rate-nominal-h17",
    negativesAllowed: true,
    evidence: "title=県民総所得対前年増加率・名目H17基準・unit=％。減少年は負",
    sourceUrl: "packages/data-configs/src/metrics/gross-prefectural-income-growth-rate-nominal-h17.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "cpi-change-rate-education",
    negativesAllowed: true,
    evidence: "title=消費者物価指数変化率・教育・unit=％。物価下落で負",
    sourceUrl: "packages/data-configs/src/metrics/cpi-change-rate-education.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "densely-populated-area-change-rate",
    negativesAllowed: true,
    evidence: "title=人口集中地区面積の変化率・unit=％。面積実数でなく変化率なので縮小で負",
    sourceUrl: "packages/data-configs/src/metrics/densely-populated-area-change-rate.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "net-decrease-rate-land-house-loans-worker-households",
    negativesAllowed: true,
    evidence: "title=土地家屋借金純減率・unit=％。借金が増えた年は純減率が負",
    sourceUrl: "packages/data-configs/src/metrics/net-decrease-rate-land-house-loans-worker-households.ts",
    verifiedAt: "2026-08-05",
  },
  {
    key: "port-vehicle-ferry",
    rowCountMin: 33,
    evidence: "欠落は内陸 8 県 + 岩手・山形・福島・富山・石川・高知。自動車航送航路の有無と一致",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003130796",
    verifiedAt: "2026-08-05",
  },
  {
    key: "factory-industrial-park-rate",
    rowCountMin: 38,
    evidence: "e-Stat 原表 2020 年でも青森・東京・福井ほか 9 県が空欄。立地件数 0 で率を算出できない",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003411445",
    verifiedAt: "2026-08-05",
  },
  {
    key: "port-cargo-export",
    rowCountMin: 39,
    evidence: "欠落 8 県が内陸 8 県と完全一致。15 年間 39 行で不変",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003130738",
    verifiedAt: "2026-08-05",
  },
  {
    key: "port-cargo-import",
    rowCountMin: 39,
    evidence: "欠落 8 県が内陸 8 県と完全一致。港湾を持たない県に海上貨物は無い",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003130738",
    verifiedAt: "2026-08-05",
  },
  {
    key: "port-cargo-total",
    rowCountMin: 39,
    evidence: "欠落 8 県が内陸 8 県と完全一致。2009-2023 年すべて 39 行で年変動なし",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003130738",
    verifiedAt: "2026-08-05",
  },
  {
    key: "port-container-count",
    rowCountMin: 39,
    evidence: "欠落 8 県が内陸 8 県と完全一致。取扱ゼロの沿岸県も 0 で計上され脱落なし",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003130688",
    verifiedAt: "2026-08-05",
  },
  {
    key: "fishery-species-catch-bonito",
    rowCountMin: 39,
    evidence: "欠落 8 県が内陸 8 県と完全一致。海面漁業統計なので内陸県は調査対象外",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003238633",
    verifiedAt: "2026-08-05",
  },
  {
    key: "fishery-species-catch-japanese-squid",
    rowCountMin: 39,
    evidence: "欠落 8 県が内陸 8 県と完全一致。他 11 品目と欠落集合が同一",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003238633",
    verifiedAt: "2026-08-05",
  },
  {
    key: "fishery-species-catch-kelp",
    rowCountMin: 39,
    evidence: "欠落 8 県が内陸 8 県。北海道偏在品目だが漁獲 0 の沿岸県も 0 で計上され 39 行を維持",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003238633",
    verifiedAt: "2026-08-05",
  },
  {
    key: "fishery-species-catch-mackerel",
    rowCountMin: 39,
    evidence: "欠落 8 県が内陸 8 県と完全一致。海面漁業統計で内陸県は調査対象外",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003238633",
    verifiedAt: "2026-08-05",
  },
  {
    key: "fishery-species-catch-pacific-saury",
    rowCountMin: 39,
    evidence: "欠落 8 県が内陸 8 県と完全一致。他 11 品目と欠落集合が同一",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003238633",
    verifiedAt: "2026-08-05",
  },
  {
    key: "fishery-species-catch-pollock",
    rowCountMin: 39,
    evidence: "欠落 8 県が内陸 8 県。北方偏在品目だが西日本の沿岸県も 0 で計上され 39 行を維持",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003238633",
    verifiedAt: "2026-08-05",
  },
  {
    key: "fishery-species-catch-sardine",
    rowCountMin: 39,
    evidence: "欠落 8 県が内陸 8 県と完全一致。海面漁業統計で内陸県は調査対象外",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003238633",
    verifiedAt: "2026-08-05",
  },
  {
    key: "fishery-species-catch-scallop",
    rowCountMin: 39,
    zeroShareMax: 0.5,
    evidence:
      "欠落 8 県が内陸 8 県と完全一致 (海面漁業)。e-Stat 原表は北海道 232,080・青森 1,805・" +
      "宮城 0 (単位未満) で、残る 37 県は「-」= 事実なし (null) なので有限値は 3 件だけ",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003238633",
    verifiedAt: "2026-08-05",
  },
  {
    key: "fishery-species-catch-sea-bream",
    rowCountMin: 39,
    evidence: "欠落 8 県が内陸 8 県と完全一致。他 11 品目と欠落集合が同一",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003238633",
    verifiedAt: "2026-08-05",
  },
  {
    key: "fishery-species-catch-snow-crab",
    rowCountMin: 39,
    evidence: "欠落 8 県が内陸 8 県と完全一致。他 11 品目と欠落集合が同一",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003238633",
    verifiedAt: "2026-08-05",
  },
  {
    key: "fishery-species-catch-tuna",
    rowCountMin: 39,
    evidence: "欠落 8 県が内陸 8 県と完全一致。海面漁業統計で内陸県は調査対象外",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003238633",
    verifiedAt: "2026-08-05",
  },
  {
    key: "fishery-species-catch-yellowtail",
    rowCountMin: 39,
    evidence: "欠落 8 県が内陸 8 県と完全一致。他 11 品目と欠落集合が同一",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003238633",
    verifiedAt: "2026-08-05",
  },

  // --- ゼロが実態を正しく表しているもの (2026-08-05 検証) ---
  {
    key: "secondary-education-school-count-per-100k-12-17",
    zeroShareMax: 0.55,
    evidence: "中等教育学校は全国 60 校弱の希少校種。新潟 6 校・愛媛 4 校と実数が一致し、ゼロ県に設置校は無い",
    sourceUrl: "https://www.mext.go.jp/b_menu/toukei/chousa01/kihon/kekka/k_detail/2024.htm",
    verifiedAt: "2026-08-05",
  },
  {
    key: "firefighting-expenses-prefecture",
    zeroShareMax: 0.99,
    evidence: "消防組織法 6 条で消防は市町村事務。特別区分のみ都が管理・費用負担 (26-28 条)。e-Stat 全国計が東京都の値と完全一致",
    sourceUrl: "https://elaws.e-gov.go.jp/document?lawid=322AC0000000226",
    verifiedAt: "2026-08-05",
  },
  {
    key: "unemployment-measures-expenses-prefecture",
    zeroShareMax: 0.75,
    evidence: "緊急失業対策法は平 7 法 54 で廃止 (1996 年 4 月施行) し失業対策事業は終息。残るのは旧失対の経過的経費のみ",
    sourceUrl: "https://www.shugiin.go.jp/internet/itdb_housei.nsf/html/houritsu/13219950331054.htm",
    verifiedAt: "2026-08-05",
  },
  {
    key: "maternal-mortality-rate-per-100k-births",
    zeroShareMax: 0.7,
    evidence: "2023 年の全国率は 3.5 (出産 10 万対) = 年約 25 件。大半の県で該当死亡 0 件なので率 0 が実態",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0000010209",
    verifiedAt: "2026-08-05",
  },
  {
    key: "major-lake-area",
    zeroShareMax: 0.62,
    evidence: "出典の全国都道府県市区町村別面積調は 1km² 以上の湖沼のみ掲載。0 の 26 県に 1km² 以上の湖沼は存在しない",
    sourceUrl: "https://www.gsi.go.jp/KOKUJYOHO/MENCHO-title.htm",
    verifiedAt: "2026-08-05",
  },
  {
    key: "maximum-snow-depth",
    zeroShareMax: 0.65,
    evidence: "県庁所在市の気象官署の年最深積雪。2006/07 年は記録的暖冬で東京 0cm・新潟 6cm まで落ち、西日本は積雪皆無",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0000010102",
    verifiedAt: "2026-08-05",
  },
  {
    key: "botanical-garden-count",
    zeroShareMax: 0.86,
    evidence:
      "社会教育調査 0003348770 の cat01=植物園・cat02=登録博物館と博物館相当施設の計を確認。" +
      "全国計10館、47県中38県が0で、別表の博物館類似施設107館は対象外。指標名にも対象範囲を明示",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003348770",
    verifiedAt: "2026-08-28",
  },
  {
    key: "zoo-count",
    zeroShareMax: 0.54,
    evidence:
      "社会教育調査 0003348770 の cat01=動物園・cat02=登録博物館と博物館相当施設の計を確認。" +
      "全国計35館、47県中23県が0で、別表の博物館類似施設59館は対象外。指標名にも対象範囲を明示",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003348770",
    verifiedAt: "2026-08-28",
  },
  {
    key: "aquarium-count",
    zeroShareMax: 0.52,
    evidence:
      "社会教育調査 0003348770 の cat01=水族館・cat02=登録博物館と博物館相当施設の計を確認。" +
      "全国計38館、47県中22県が0で、別表の博物館類似施設46館は対象外。指標名にも対象範囲を明示",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003348770",
    verifiedAt: "2026-08-28",
  },
  {
    key: "kindergarten-expenses-prefecture",
    zeroShareMax: 0.75,
    rowCountMin: 47,
    evidence:
      "社会・人口統計体系 D3103116 は幼稚園費（都道府県財政）。2022年度の公開R2は47県すべてに行があり、32県が欠損でなく数値0",
    sourceUrl: "https://www.e-stat.go.jp/koumoku/koumoku_teigi/D",
    verifiedAt: "2026-08-28",
  },
  {
    key: "general-project-investment-railway",
    zeroShareMax: 0.55,
    rowCountMin: 47,
    evidence:
      "社会・人口統計体系 D5211 は一般事業の鉄道投資（公営企業の軌道・地下鉄とは別区分、2006年で収集中止）。2006年度の公開R2は47県すべてに行があり、22県が数値0",
    sourceUrl: "https://www.e-stat.go.jp/koumoku/koumoku_teigi/D",
    verifiedAt: "2026-08-28",
  },
  // 家計調査の品目 (県庁所在市・二人以上世帯・1 市あたり約 100 世帯の標本)。
  // 低頻度 / 高額 / 該当世帯が少数の品目は、標本にその世帯が出ないと 0 になる。
  // 全国平均が正であることを 1 件ずつ確認しており、欠損を 0 で埋めているのではない。
  {
    key: "wedding-expense-consumption-expenditure",
    zeroShareMax: 0.8,
    evidence: "全国平均 3,195 円に対し 53 市中 38 市が原表で 0。婚礼支出は 1 市約 100 世帯の標本に該当世帯が出ない",
    sourceUrl: "https://www.stat.go.jp/data/kakei/search/before.html",
    verifiedAt: "2026-08-05",
  },
  {
    key: "maternity-hospital-consumption-expenditure",
    zeroShareMax: 0.7,
    evidence: "全国 990 円に対し 32 市が原表 0。出産入院料は年当たり該当世帯が極少で市別標本に現れない",
    sourceUrl: "https://www.stat.go.jp/data/kakei/search/before.html",
    verifiedAt: "2026-08-05",
  },
  {
    key: "non-car-vehicle-purchase-consumption-expenditure",
    zeroShareMax: 0.7,
    evidence: "自動二輪・自転車等は低頻度高額品。全国平均は正で、市別 0 は標本に購入世帯が出なかった結果",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003348239",
    verifiedAt: "2026-08-05",
  },
  {
    key: "cupboard-consumption-expenditure",
    zeroShareMax: 0.68,
    evidence: "食器戸棚は数十年に一度の耐久財。全国平均は正、市別 0 は約 100 世帯標本に購入世帯が不在",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003348239",
    verifiedAt: "2026-08-05",
  },
  {
    key: "cupboard-consumption-quantity",
    zeroShareMax: 0.68,
    evidence: "同品目の購入数量表。金額 0 の市と数量 0 が整合し、低頻度耐久財の標本欠落を反映",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003348235",
    verifiedAt: "2026-08-05",
  },
  {
    key: "private-elementary-school-consumption-expenditure",
    zeroShareMax: 0.65,
    evidence: "私立小学校在学は全国児童の約 1% 台。県庁所在市の少数標本に在学世帯が入らない市が多い",
    sourceUrl: "https://www.stat.go.jp/data/kakei/search/before.html",
    verifiedAt: "2026-08-05",
  },
  {
    key: "tatami-replacement-consumption-expenditure",
    zeroShareMax: 0.65,
    evidence: "全国平均 868 円に対し原表で 28 市が 0。畳替えは数年〜十数年に一度で標本に実施世帯が出ない",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003348239",
    verifiedAt: "2026-08-05",
  },
  {
    key: "tatami-replacement-consumption-quantity",
    zeroShareMax: 0.65,
    evidence: "同品目の購入数量 (畳) 表。金額 0 の市と一致し、低頻度支出が標本に現れないことを示す",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003348235",
    verifiedAt: "2026-08-05",
  },
  {
    key: "other-rent-land-consumption-expenditure",
    zeroShareMax: 0.5,
    evidence: "他の家賃地代は該当世帯が限定的。全国平均は正で、市別 0 は標本内に該当世帯が無かった結果",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003348239",
    verifiedAt: "2026-08-05",
  },
  {
    key: "chest-consumption-expenditure",
    zeroShareMax: 0.48,
    evidence: "たんすは数十年に一度の購入。全国平均は正、市別 0 は約 100 世帯標本に購入世帯が出ないため",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003348239",
    verifiedAt: "2026-08-05",
  },
  {
    key: "chest-consumption-quantity",
    zeroShareMax: 0.48,
    evidence: "同品目の購入数量表。金額 0 の市と対応し、低頻度耐久財の標本欠落を反映している",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003348235",
    verifiedAt: "2026-08-05",
  },
  {
    key: "land-rent-consumption-expenditure",
    zeroShareMax: 0.48,
    evidence: "借地する二人以上世帯は少数。全国平均は正で、市別 0 は標本に地代支払世帯が出なかった結果",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003348239",
    verifiedAt: "2026-08-05",
  },
  {
    key: "vocational-school-consumption-expenditure",
    zeroShareMax: 0.48,
    evidence: "専修学校在学世帯は限られる。全国平均は正、市別 0 は標本に該当世帯が含まれなかったため",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003348239",
    verifiedAt: "2026-08-05",
  },
  {
    key: "public-rent-consumption-expenditure",
    zeroShareMax: 0.45,
    evidence: "全国平均 8,485 円に対し原表 19 市が 0。公営住宅居住は少数派で市別標本に該当世帯が出ない",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003348239",
    verifiedAt: "2026-08-05",
  },
  {
    key: "public-rent-consumption-quantity",
    zeroShareMax: 0.45,
    evidence: "同品目の畳数表。金額 0 の市と一致し、公営住宅居住世帯が標本に出ないことを反映",
    sourceUrl: "https://www.e-stat.go.jp/dbview?sid=0003348235",
    verifiedAt: "2026-08-05",
  },
];
