/** noteカバーの制作判断。実測値は入力JSON、地図は既存GIS、画像は派生物。 */
export const NOTE_COVER_REFRESH_VERSION = '2026-09-12-v1';
/** 320px一覧で可読性・構図を確認済み。CTA観測中の既存3記事も維持する。 */
export const KEEP_EXISTING_COVER_KEYS: ReadonlySet<string> = new Set([
  '00-claude-code-intro-for-public-servants',
  '01-claude-code-setup-complete',
  '02-internal-network-workarounds',
  '03-it-dept-security-doc',
  '04-meeting-minutes-30min-to-5min',
  '05-assembly-answer-prompts',
  '06-ordinance-revision-review',
  '07-official-doc-skills',
  '08-proposal-doc-checklist-20',
  '09-assembly-question-points',
  '10-ai-without-personal-info',
  '11-hooks-personal-info-masking',
  '12-audit-ready-settings',
  '13-ollama-offline-local-llm',
  '14-excel-budget-aggregation',
  '15-data-preprocessing-intro',
  '16-subsidy-doc-consistency',
  '17-year-on-year-analysis',
  '18-pr-magazine-rewrite',
  '19-faq-auto-generation',
  '20-complaint-reply-patterns',
  '21-disaster-sns-multilang',
  '31-claude-code-how-to-ask',
  '32-claude-skills-getting-started',
  '00-estat-claude-code-intro',
  '01-estat-api-key-setup',
  '02-search-estat-statsdataid',
  '03-fetch-prefecture-ranking',
  '04-excel-download-and-parse',
  '05-pandas-duckdb-derived-metrics',
  '06-prefecture-code-and-merge',
  '07-year-on-year-diff',
  '08-benchmark-table-5min',
  '09-assembly-chart-generation',
  '10-claude-skills-routinize',
  '11-mcp-sqlite-search',
  'paid-nf80da34b28c3',
  'paid-n02da130aae01',
  'paid-n66ffb10aa41b',
  'paid-n79fefdbd4d4c',
  'paid-n823d76c5cbac',
  'paid-nfe2c65e669a8',
  'recovered-n023501038bd5',
  'recovered-n03844512d58a',
  'recovered-n04d95ae14bc1',
  'recovered-n144d350fc14e',
  'recovered-n16950238dfd8',
  'recovered-n1b943c7d414d',
  'recovered-n21cb13582fe6',
  'recovered-n3908e5981967',
  'recovered-n3a4efa70c02a',
  'recovered-n46a8eb03072b',
  'recovered-n48dff1df249f',
  'recovered-n567416b632f6',
  'recovered-n581a1409b2c9',
  'recovered-n5f183fcf5b97',
  'recovered-n68f5e09c8d62',
  'recovered-n80e58a01f660',
  'recovered-n863f429319ca',
  'recovered-n91e82ac3b13c',
  'recovered-n93a6656b2096',
  'recovered-nb2d65c42c28b',
  'recovered-nd5f8b5072cdb',
  'recovered-nded2d34fc978',
  'recovered-ne0d53bfef7ed',
  'recovered-ne31a2574e231',
  'recovered-ne82a6c83ed45',
  'recovered-nf962c6702b93',
  'recovered-n03e45e40d3a7',
  'paid-n9f666946d105',
  'recovered-nc18fa33ec65e',
  'paid-n143a9f6a0050',
  'recovered-n73a4d300e045',
]);
export type NoteCoverCopy = {
  headline: string;
  subline: string;
  kicker: string;
  badge?: string;
};
export const NOTE_COVER_COPY: Record<string, NoteCoverCopy> = {
  'pinned-intro': {
    headline: 'あなたの県は、\n何位？',
    subline: '元県庁職員がつくった統計サイト',
    kicker: 'はじめまして、stats47です',
    badge: '47都道府県を比べる',
  },
  'koumuin-gis-01-depopulation-medical': {
    headline: '過疎地域と\n医療機関を\n地図で重ねる',
    subline: '無料の国土数値情報からはじめる',
    kicker: '自治体職員のためのGIS入門',
  },
  'b-kakei-academic-food': {
    headline: '学力上位の県は\n何を食べる？',
    subline: '家計調査と学力テストを読み解く',
    kicker: '相関から、一歩先へ',
  },
  'b-kakei-advancement-employment': {
    headline: '進学率だけで\n教育は測れる？',
    subline: '就職率も合わせて見えてくる県の姿',
    kicker: 'データの読み方',
  },
  'b-kakei-beer-peak-month': {
    headline: 'ビールが売れる\nピークは何月？',
    subline: '家計調査20年の月次データで見る',
    kicker: '季節と家計',
  },
  'b-kakei-bread-giffen': {
    headline: '値上がりすると\n食パンは売れる？',
    subline: '家計調査で確かめるギッフェン財の条件',
    kicker: '価格と買い方',
  },
  'b-kakei-gyoza-counting': {
    headline: 'ぎょうざ日本一。\n何を数えた？',
    subline: '消費ランキングの範囲と限界を読む',
    kicker: '数字の見方',
  },
  'b-kakei-necktie-decline': {
    headline: 'ネクタイは\nどこまで\n売れなくなった？',
    subline: 'ストッキングとともに市場の縮小を見る',
    kicker: '家計調査で追う変化',
  },
  'b-kakei-quantity-price': {
    headline: 'たくさん買う県。\n高いものを買う県。',
    subline: '支出額を「数量」と「価格」に分ける',
    kicker: '家計調査の読み方',
  },
  'b-kakei-winter-bargain': {
    headline: '冬のバーゲン、\n本当に売れた？',
    subline: '数量と単価、どちらが動いたのか',
    kicker: '家計調査で検証',
  },
  'd-kakei-category-dataset': {
    headline: '47都市の\n家計を、\n十大費目で比べる',
    subline: '2007–2024年の家計データセット',
    kicker: '家計データを分析に使う',
    badge: '8,460行',
  },
  'd-geo-flood-population-mesh': {
    headline: '浸水想定区域に\n2050年の人口を\n重ねる',
    subline: '47都道府県・29,737メッシュを再現',
    kicker: '洪水 × 将来人口',
    badge: '再現用データ付き',
  },
  'd-geo-ipss-prefecture-map': {
    headline: '将来人口を\n地図に使える\nデータへ',
    subline: '47都道府県のコード・辞書・検算付き',
    kicker: 'データを地図につなぐ',
  },
  'd-geo-land-price-future-population': {
    headline: '地価の地点と\n人口の将来像を\n重ねる',
    subline: '47都道府県CSV・包含結合・検算',
    kicker: '地価 × 将来人口',
  },
  'd-geo-station-access-analysis': {
    headline: '駅から800m。\n2050年に\n何人暮らす？',
    subline: '駅代表点から直線距離で47都道府県を分析',
    kicker: '鉄道駅 × 将来人口',
  },
};

/** 倍率だけを強調せず、公開済み図表の指標・分母・対象を短いコピーへ移す。 */
Object.assign(NOTE_COVER_COPY, {
  'paid-n0135c75ca76c': {
    headline: '高校2年生の\n体重はどう違う？',
    subline: '男女別の地域差をデータで見る',
    kicker: '都道府県のデータを読む',
  },
  'paid-n0642ad7f7fdd': {
    headline: '農業所得の\n地域差を読む',
    subline: '2003年の都道府県ランキング',
    kicker: '都道府県のデータを読む',
  },
  'paid-n066d8687ef00': {
    headline: '歯科健診は\nどれくらい\n受けている？',
    subline: '2020年・人口千人当たり',
    kicker: '都道府県のデータを読む',
  },
  'paid-n2406ded99484': {
    headline: '一般行政部門の\n職員数を比べる',
    subline: '都道府県の行政を支える人数',
    kicker: '都道府県のデータを読む',
  },
  'paid-n2d43e8cd6054': {
    headline: '小学5年生の\n体重はどう違う？',
    subline: '男女別の平均体重を都道府県で比べる',
    kicker: '都道府県のデータを読む',
  },
  'paid-n2ed31d721531': {
    headline: '財政の健全性を\n4指標で読む',
    subline: '赤字比率と借金の重さを確認する',
    kicker: '都道府県のデータを読む',
  },
  'paid-n317c673b1e81': {
    headline: '服と靴の値段は\n地域で違う？',
    subline: '2023年・消費者物価地域差指数',
    kicker: '都道府県のデータを読む',
  },
  'paid-n44bedb732274': {
    headline: '農業産出額を\n都道府県で比べる',
    subline: '2022年の規模と生産性を見る',
    kicker: '都道府県のデータを読む',
  },
  'paid-n48a11cea7b31': {
    headline: '年齢調整死亡率を\n地域で比べる',
    subline: '2022年・65歳以上',
    kicker: '都道府県のデータを読む',
  },
  'paid-n4b8346d9c17b': {
    headline: '自主財源は\nどれくらいある？',
    subline: '2021年度・都道府県の財政',
    kicker: '都道府県のデータを読む',
  },
  'paid-n67de9d45c426': {
    headline: '趣味・娯楽の\n時間を比べる',
    subline: '2021年・有業者（男性）',
    kicker: '都道府県のデータを読む',
  },
  'paid-n7290144784d4': {
    headline: '火災による\n死傷者数を比べる',
    subline: '2022年・人口10万人当たり',
    kicker: '都道府県のデータを読む',
  },
  'paid-n772ff041af18': {
    headline: '農家の数は\n地域でどう違う？',
    subline: '都道府県の農業をデータで見る',
    kicker: '都道府県のデータを読む',
  },
  'paid-n82a4168eaa19': {
    headline: '中学2年生の\n体重を比べる',
    subline: '2022年・女子の平均体重',
    kicker: '都道府県のデータを読む',
  },
  'paid-n925aa92c4ee4': {
    headline: '中学2年生の\n体重はどう違う？',
    subline: '男女別の平均体重を都道府県で比べる',
    kicker: '都道府県のデータを読む',
  },
  'paid-na16afa534c77': {
    headline: '実質収支比率で\n財政を読む',
    subline: '都道府県の決算を比べる',
    kicker: '都道府県のデータを読む',
  },
  'paid-na76caacd17c3': {
    headline: '求人の充足率は\n地域でどう違う？',
    subline: '都道府県の雇用環境を比べる',
    kicker: '都道府県のデータを読む',
  },
  'paid-naa6eba6efec2': {
    headline: '脳血管疾患の\n死亡率を比べる',
    subline: '2022年・人口10万人当たり',
    kicker: '都道府県のデータを読む',
  },
  'paid-nafcc04dcd988': {
    headline: '年少人口指数で\n地域を比べる',
    subline: '2022年・都道府県の人口構成',
    kicker: '都道府県のデータを読む',
  },
  'paid-nb17d039bc1aa': {
    headline: '火災による\n死傷者数を比べる',
    subline: '2022年・建物火災100件当たり',
    kicker: '都道府県のデータを読む',
  },
  'paid-nb216c5776aab': {
    headline: '行政事件の\n件数を比べる',
    subline: '2022年・人口10万人当たり',
    kicker: '都道府県のデータを読む',
  },
  'paid-nb3c79a94e53a': {
    headline: '車はどれくらい\n持っている？',
    subline: '2014年・千世帯当たりの自動車保有数量',
    kicker: '都道府県のデータを読む',
  },
  'paid-nb8f3e05d244b': {
    headline: '経常収支比率で\n財政の余裕を読む',
    subline: '2021年・都道府県の比較',
    kicker: '都道府県のデータを読む',
  },
  'paid-nba8bf272cc2b': {
    headline: '初婚年齢は\n地域で違う？',
    subline: '2022年・夫と妻をそれぞれ比較',
    kicker: '都道府県のデータを読む',
  },
  'paid-ncf695ba6eb35': {
    headline: '教育にかかる\n物価を比べる',
    subline: '2023年・消費者物価地域差指数',
    kicker: '都道府県のデータを読む',
  },
  'paid-nd2fd5adb4bed': {
    headline: '世帯の実収入は\nどれくらい違う？',
    subline: '2023年・1世帯当たり1か月間',
    kicker: '都道府県のデータを読む',
  },
  'paid-nd54b2958dc0e': {
    headline: '農地の転用面積を\n地域で比べる',
    subline: '都道府県の農業データ',
    kicker: '都道府県のデータを読む',
  },
  'paid-nd5edff320928': {
    headline: '働く女性の\n趣味・娯楽時間',
    subline: '2021年・有業者（女性）',
    kicker: '都道府県のデータを読む',
  },
  'paid-nead1c21768b5': {
    headline: '趣味・娯楽の\n物価を比べる',
    subline: '2023年・消費者物価地域差指数',
    kicker: '都道府県のデータを読む',
  },
  'paid-neecba2a1752d': {
    headline: '有効求人倍率は\n地域でどう違う？',
    subline: '都道府県の雇用環境を読む',
    kicker: '都道府県のデータを読む',
  },
  'paid-nef7e875ba364': {
    headline: '子どもの割合は\n地域でどう違う？',
    subline: '年少人口割合を都道府県で比べる',
    kicker: '都道府県のデータを読む',
  },
  'paid-nefecfbe76bd2': {
    headline: '未来への投資は\n財政の何割？',
    subline: '2021年・投資的経費の割合',
    kicker: '都道府県のデータを読む',
  },
  'recovered-n0e8fd0068d4e': {
    headline: '妊産婦の保健指導を\n地域で比べる',
    subline: '2022年・出産数100当たり',
    kicker: '都道府県のデータを読む',
  },
  'recovered-n15ee88b5169d': {
    headline: '国民健康保険の\n診療費を比べる',
    subline: '2022年・被保険者1人当たり',
    kicker: '都道府県のデータを読む',
  },
  'recovered-n1e63abcfba72': {
    headline: 'メディアに\n使う時間を比べる',
    subline: '2021年・無業者（男性）',
    kicker: '都道府県のデータを読む',
  },
  'recovered-n218588ef2f67': {
    headline: '特別法犯の\n検挙件数を比べる',
    subline: '2022年・人口10万人当たり',
    kicker: '都道府県のデータを読む',
  },
  'recovered-n24b5000d587f': {
    headline: '働く女性の\nメディア時間',
    subline: 'テレビ・ラジオ・新聞・雑誌の平均時間',
    kicker: '都道府県のデータを読む',
  },
  'recovered-n2b4298e9ac07': {
    headline: '無業者の\n趣味・娯楽時間',
    subline: '2021年・男性の平均時間',
    kicker: '都道府県のデータを読む',
  },
  'recovered-n391d3ef70d29': {
    headline: '警察官の数を\n地域で比べる',
    subline: '2023年・人口千人当たり',
    kicker: '都道府県のデータを読む',
  },
  'recovered-n3f65c01be9a8': {
    headline: '一般粉じんの\n発生施設数を比べる',
    subline: '都道府県の環境データ',
    kicker: '都道府県のデータを読む',
  },
  'recovered-n4dae901ea3e8': {
    headline: '平均貯蓄率で\n家計を比べる',
    subline: '2023年・都道府県のデータ',
    kicker: '都道府県のデータを読む',
  },
  'recovered-n5158c5766a07': {
    headline: '生命保険の\n備えを比べる',
    subline: '生命保険現在高割合の地域差',
    kicker: '都道府県のデータを読む',
  },
  'recovered-n99561600d4fe': {
    headline: '無業者の\n趣味・娯楽時間',
    subline: '2021年・女性の平均時間',
    kicker: '都道府県のデータを読む',
  },
  'recovered-n99f53e7a1f33': {
    headline: '救急出動は\nどれくらいある？',
    subline: '2022年・人口千人当たり',
    kicker: '都道府県のデータを読む',
  },
  'recovered-ncbed56eb7c3d': {
    headline: '人口の規模と\n密度を比べる',
    subline: '2023年・都道府県のデータ',
    kicker: '都道府県のデータを読む',
  },
  'recovered-ndc600ddb7c44': {
    headline: 'エアコンは\nどれくらいある？',
    subline: '2014年・千世帯当たりの所有数量',
    kicker: '都道府県のデータを読む',
  },
  'recovered-nfe69996fb5c9': {
    headline: '光熱・水道費の\n割合を比べる',
    subline: '2023年・家計に占める割合',
    kicker: '都道府県のデータを読む',
  },
});

Object.assign(NOTE_COVER_COPY, {
  'paid-n2207f3039fd3': {
    headline: '毎月の定型業務を\n1コマンドに\nまとめる',
    subline: '.claude/skills の活用手順',
    kicker: '公務員のための実務ガイド',
  },
  'paid-n2c2df066e865': {
    headline: 'Claude Codeを\n上司にどう\n説明する？',
    subline: '導入承認の説明資料・実例加工',
    kicker: '公務員のための実務ガイド',
  },
  'paid-n68eafab07946': {
    headline: '複数案件の調査を\nSubagentsで\n並行して進める',
    subline: '調査の分担と実行の手順',
    kicker: '公務員のための実務ガイド',
  },
  'paid-n8558c1a6503a': {
    headline: '退職後の\n公的セクター経験に\nAIを掛け合わせる',
    subline: 'キャリアと市場価値を考える',
    kicker: '公務員のキャリア',
  },
  'paid-naf942acdbe59': {
    headline: '災害時のSNSを\n多言語で届ける',
    subline: 'Claude Codeで発信文をつくる',
    kicker: '公務員のための実務ガイド',
  },
  'paid-nbead1fe772c7': {
    headline: '庁内システムに\nMCPをつなぐ',
    subline: '架空のLGWANを想定した接続実験',
    kicker: '公務員のための実務ガイド',
  },
  'paid-ncab0d7b04228': {
    headline: 'AI導入に慎重な\n上席と話すには？',
    subline: '現場で使う対応Q&A集',
    kicker: '公務員のための実務ガイド',
  },
  'paid-nf0c82ce9cee0': {
    headline: '苦情メールの\n返信案を\n5パターン作る',
    subline: '文面を考えるためのプロンプト',
    kicker: '公務員のための実務ガイド',
  },
  'paid-nfd3ab8213e1f': {
    headline: 'Excelマクロを\nPythonへ移す',
    subline: 'Claude Codeを使った移植の手順',
    kicker: '公務員のための実務ガイド',
  },
  'recovered-nddd927386fce': {
    headline: '住民問い合わせを\nFAQにまとめる',
    subline: 'Claude Codeで回答集を自動生成',
    kicker: '公務員のための実務ガイド',
  },
});
Object.assign(NOTE_COVER_COPY, {
  'paid-n92b846280d1a': {
    headline: '収入階級ごとの\n家計を\nデータで読む',
    subline: '159品目 × 25年分のCSVデータセット',
    kicker: '家計調査・五分位階級別',
  },
});
