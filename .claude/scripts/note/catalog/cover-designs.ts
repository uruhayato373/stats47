import { REFERENCE_COVER_EXTRA, REFERENCE_COVER_HEADLINES } from './reference-cover-copy';
import { REFERENCE_COVER_FIGURES } from './reference-cover-figures';
/** noteカバーの制作判断。実測値は入力JSON、地図は既存GIS、画像は派生物。 */
export const NOTE_COVER_REFRESH_VERSION = '2026-09-28-v4';
/** v4 は日本地図を横置きにし、実測値が47県そろうランキングをコロプレス化する。 */
export const KEEP_EXISTING_COVER_KEYS: ReadonlySet<string> = new Set();
/** v2 の大きな文字組みに収まる、公開タイトルに基づく短い見出し。 */
export const BOLD_COVER_HEADLINES: Record<string, string> = {
  '21-disaster-sns-multilang': '災害発信を\n多言語に',
  '19-faq-auto-generation': '住民の質問を\nFAQに',
  '09-assembly-chart-generation': '議会答弁の図を\nつくる',
  '07-year-on-year-diff': '統計の変化を\n自動で追う',
  '11-mcp-sqlite-search': '自前DBと\ne-Statをつなぐ',
  '10-claude-skills-routinize': '毎月の集計を\n1コマンドに',
  'paid-n143a9f6a0050': '統計の変化を\n自動で追う',
  '04-excel-download-and-parse': 'e-Statの表を\n整える',
  '01-estat-api-key-setup': 'e-Stat APIを\n使い始める',
  'recovered-nc18fa33ec65e': '公務員のAIスキル\nどう生かす？',
  'paid-n9f666946d105': '庁内勉強会を\n30分で',
  '18-pr-magazine-rewrite': '広報誌の原稿を\n読みやすく',
  '16-subsidy-doc-consistency': '補助金書類の\n矛盾を見つける',
  '15-data-preprocessing-intro': '統計データを\n使える形に',
  '14-excel-budget-aggregation': '予算Excelを\nまとめて集計',
  '13-ollama-offline-local-llm': 'オフラインで\nAIを使う',
  '12-audit-ready-settings': 'AI活用の記録を\n監査に備える',
  '11-hooks-personal-info-masking': '個人情報を\n自動で隠す',
  '10-ai-without-personal-info': '個人情報を\n送らずにAI',
  '09-assembly-question-points': '議会質問の論点を\n10分で整理',
  '07-official-doc-skills': '公文書を\nAIで校正',
  '06-ordinance-revision-review': '条例改正案の\n矛盾を探す',
  '05-assembly-answer-prompts': '議会答弁の原稿を\n3案つくる',
  '04-meeting-minutes-30min-to-5min': '議事録づくりを\n5分に',
  '03-it-dept-security-doc': '情報システム担当に\n伝える資料',
  '02-internal-network-workarounds': '庁内ネットワークで\nAIを使う',
  '01-claude-code-setup-complete': 'Claude Codeの\n環境をつくる',
  'recovered-n285e0ba282d0': '音楽鑑賞が\n多い県は？',
  'recovered-nded2d34fc978': '稼ぐ力7位\n借金は1位？',
  'paid-n823d76c5cbac': '配色辞書\n全98種',
  'paid-n79fefdbd4d4c': '定性データの\n配色28種',
  'paid-n02da130aae01': 'プラスとマイナス\n配色30種',
  'paid-nfe2c65e669a8': '順序データの\n配色40選',
  'paid-nf80da34b28c3': '地図の配色を\n変える',
  'a-final-energy-consumption-per-capita': 'エネルギー\n消費量',
  'a-convenience-store-sales': 'コンビニ\n販売額',
  '20-complaint-reply-patterns': '苦情返信を\n5パターン',
  '06-prefecture-code-and-merge': '県コードの\n扱い方',
  '05-pandas-duckdb-derived-metrics': '人口当たり指標を\n計算',
  '02-search-estat-statsdataid': '統計表IDを\n1分で探す',
  '08-benchmark-table-5min': '自治体比較表を\n5分で',
  '03-fetch-prefecture-ranking': '47県データを\n1コマンドで',
  'recovered-n73a4d300e045': '47県データを\n1コマンドで',
  '00-estat-claude-code-intro': 'e-Stat ×\nClaude Code',
  '17-year-on-year-analysis': '決算書の前年比を\n5分で',
  '08-proposal-doc-checklist-20': '起案文の\n20項目チェック',
  '32-claude-skills-getting-started': 'スキルを\n職場の資産に',
  '31-claude-code-how-to-ask': 'Claude Codeに\nどう頼む？',
  '00-claude-code-intro-for-public-servants': '公務員のための\nClaude Code',
  'recovered-n68f5e09c8d62': '690品目で\n県の家計を読む',
  'recovered-n03844512d58a': '所得別の\nエンゲル係数',
  'recovered-n144d350fc14e': '沖縄の出生率\nなぜ高い？',
  'recovered-n023501038bd5': '埼玉の日照時間\nなぜ日本一？',
  'recovered-n46a8eb03072b': '高校卒業後の\n進学率',
  'recovered-ne0d53bfef7ed': '持ち家比率\n1位は秋田',
  'recovered-n80e58a01f660': '県民所得\n1位は東京',
  'recovered-n93a6656b2096': '出生率\n1位は沖縄',
  'recovered-n48dff1df249f': '日曜大工\n1位は滋賀',
  'paid-n66ffb10aa41b': '凡例と\nアクセシビリティ',
  'recovered-n03e45e40d3a7': 'KMLを\nGoogleマップで',
  'recovered-ne4a6ec30706a': 'マンガを読む人\n多い県は？',
  ...REFERENCE_COVER_HEADLINES,
};
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

/** 2026-10-11: practitioner series covers. Series = vertical; label/accent tell the series apart. */
export const PRACTITIONER_SERIES: Record<string, { label: string; accent: string; numbered: boolean }> = {
  'koumuin-claude-code': { label: '公務員 × Claude Code 実務活用', accent: '#f5a524', numbered: true },
  'koumuin-estat-claude-code': { label: 'e-Stat × Claude Code', accent: '#2bb3a3', numbered: true },
  'koumuin-gis': { label: '自治体職員のためのGIS入門', accent: '#5fbf6f', numbered: true },
  'stats47-note': { label: '公務員のための実務ガイド', accent: '#6aa7ff', numbered: false },
};
export const PRACTITIONER_LABEL_OVERRIDES: Record<string, string> = {
  'paid-n8558c1a6503a': '公務員のキャリア',
  'recovered-n03e45e40d3a7': '地図の実務ガイド',
};
export const EXTRA_COVER_HEADLINES: Record<string, { kicker: string; headline: string; subline: string }> = {
  'recovered-n3908e5981967': { kicker: '家計調査の読み方', headline: '家計調査で\nわかること', subline: '47都道府県のお金の使い方を比べる' },
  '12-fiscal-peer-comparison': { kicker: '', headline: '財政指標を\n同規模の市と比べる', subline: '' },
  '13-fiscal-peer-no-code': { kicker: '', headline: 'コードなしで\n財政指標を比べる', subline: '' },
  "prefecture-population-household-pack": { kicker: "都道府県データパック", headline: "人口・世帯の\n県別データ集", subline: "47都道府県×134指標の実データ" },
  "prefecture-income-wage-hiring-pack": { kicker: "都道府県データパック", headline: "賃金・求人の\n県別データ集", subline: "47都道府県×107指標の実データ" },
  "prefecture-tourism-lodging-pack": { kicker: "都道府県データパック", headline: "宿泊・交通の\n県別データ集", subline: "47都道府県×44指標の実データ" },
  "prefecture-municipal-finance-pack": { kicker: "都道府県データパック", headline: "自治体財政の\n県別データ集", subline: "47都道府県×119指標の実データ" },
  "prefecture-healthcare-nursing-pack": { kicker: "都道府県データパック", headline: "医療・介護の\n県別データ集", subline: "47都道府県×237指標の実データ" },
  "prefecture-education-childcare-pack": { kicker: "都道府県データパック", headline: "学校・保育の\n県別データ集", subline: "47都道府県×244指標の実データ" },
  "prefecture-migration-living-pack": { kicker: "都道府県データパック", headline: "住まい・物価の\n県別データ集", subline: "47都道府県×76指標の実データ" },
  "prefecture-retail-trade-area-pack": { kicker: "都道府県データパック", headline: "商業・小売の\n県別データ集", subline: "47都道府県×69指標の実データ" },
  "prefecture-industry-economy-pack": { kicker: "都道府県データパック", headline: "産業・農業の\n県別データ集", subline: "47都道府県×132指標の実データ" },
  "prefecture-disaster-infrastructure-pack": { kicker: "都道府県データパック", headline: "防災・インフラの\n県別データ集", subline: "47都道府県×230指標の実データ" },
  "prefecture-map-chart-assets-pack": { kicker: "都道府県データパック", headline: "都道府県の\n地図・グラフ素材", subline: "47都道府県×28指標の実データ" },
  "prefecture-all-in-one-pack": { kicker: "都道府県データパック", headline: "2,073指標の\n総合データ集", subline: "47都道府県×2,073指標の実データ" },
  "prefecture-free-trial-pack": { kicker: "無料お試しサンプル", headline: "無料の\nお試しデータ", subline: "47都道府県×1指標の実データ" },
  "prefecture-household-consumption-pack": { kicker: "都道府県データパック", headline: "家計消費の\n県別データ集", subline: "47都道府県×685指標の実データ" },
  "b-expenditure-structure": {"kicker": "2022年度・県の歳出構造", "headline": "教育重視？\n産業重視？", "subline": "教育費1位は滋賀22.0%、商工費1位は大阪22.8%"},
  "b-hotel-rooms-nara": {"kicker": "ホテル客室数で比較", "headline": "奈良にホテルが\n少ない理由", "subline": "奈良は客室数46位の4,409室。京都は12位"},
  "b-hottest-prefecture": {"kicker": "2024年・最高気温", "headline": "最高気温1位は\n沖縄でなく熊本", "subline": "熊本36.2度。沖縄は33.9度で26位"},
  "b-local-tax-vs-allocation-tax": {"kicker": "2022年度・地方税と交付税", "headline": "自力で稼ぐ県、\n国に頼る県", "subline": "東京は地方税63.4%で交付税0%、高知は交付税37.4%"},
  "b-pharmacy-density": {"kicker": "2023年・薬局密度", "headline": "人口あたり薬局数\n日本一は佐賀", "subline": "10万人あたり64.5軒。最下位沖縄は39.4軒"},
  "b-rich-spending-patterns": {"kicker": "2024年・家計調査", "headline": "お金持ちが\n使うもの、\n使わないもの", "subline": "補習教育は56.1倍、光熱・水道は1.16倍"},
  "c-tokyo-vs-osaka-fiscal": {"kicker": "2022年度・財政構造", "headline": "東京と大阪\n財政はどう違う？", "subline": "財政力指数は東京1.064で1位、大阪0.742で5位"},
  "d-education-income-gap": {"kicker": "2024年・家計調査", "headline": "塾代の差は\n56.1倍", "subline": "年収差は4.74倍、塾代はQ1月138円・Q5月7,747円"},
  "d-engel-coefficient-income": {"kicker": "2024年・五分位階級", "headline": "年収差4.74倍、\nエンゲル係数差は\n8ポイント", "subline": "Q1は33.1%、Q5は25.0%。補習教育は56.1倍"},
  "d-kakei-spending-personality": {"kicker": "家計調査・690品目", "headline": "ラーメン外食の\n1位は山形", "subline": "冷凍ぎょうざは宮崎、焼肉は高知が1位"},
  "koumuin-shigoto-kouritsuka-ai": {"kicker": "", "headline": "公務員の事務作業\nAIで半日仕事が\n数分に", "subline": ""},
  ...REFERENCE_COVER_EXTRA,
};

/** Explainer covers: one figure that the article itself publishes (public R2 `<r2Path>/<image>`). */
export const EXPLAINER_COVER_FIGURES: Record<string, { image: string; caption: string }> = {
  'recovered-n023501038bd5': { image: 'images/image-01.png', caption: '記事の図: 年間日照時間ランキング（2023年）' },
  'recovered-n03844512d58a': { image: 'images/image-01.png', caption: '記事の図: 月間消費支出 Q1とQ5（2024年）' },
  'recovered-n144d350fc14e': { image: 'images/image-01.png', caption: '記事の図: 合計特殊出生率ランキング（2023年）' },
  'recovered-n3908e5981967': { image: 'images/image-02.png', caption: '記事の図: 消費支出の都道府県ランキング' },
  'recovered-n68f5e09c8d62': { image: 'images/image-03.png', caption: '記事の図: 酒類の支出額1位（2024年）' },
  'recovered-nded2d34fc978': { image: 'images/image-01.png', caption: '記事の図: 財政力指数×地方債現在高比率' },
  'b-kakei-academic-food': { image: 'images/spinach-quantity-ranking.png', caption: '記事の図: ほうれんそう消費量のランキング' },
  'b-kakei-advancement-employment': { image: 'images/combined-index-ranking.png', caption: '記事の図: 進学率＋就職者割合の合成指数' },
  'b-kakei-beer-peak-month': { image: 'images/beer-months-by-year-timeseries.png', caption: '記事の図: ビール支出額の月別パターン' },
  'b-kakei-bread-giffen': { image: 'images/bread-quantity-index-timeseries.png', caption: '記事の図: 食パン・米・他のパンの購入数量指数' },
  'b-kakei-gyoza-counting': { image: 'images/frozen-gyoza-spending-prefecture-gap-map.png', caption: '記事の図: ぎょうざ消費支出額の都道府県マップ' },
  'b-kakei-necktie-decline': { image: 'images/accessory-quantity-timeseries.png', caption: '記事の図: ネクタイ・ストッキング・帽子の購入数量' },
  'b-kakei-quantity-price': { image: 'images/hokkaido-quantity-price-findings.png', caption: '記事の図: 北海道の食卓を数量×価格で分解' },
  'b-kakei-winter-bargain': { image: 'images/coat-quantity-timeseries.png', caption: '記事の図: 婦人用コートの月別購入数量' },
  "d-education-income-gap": {"image": "images/ratio-chart.png", "caption": "記事の図: 教育費の品目別Q5/Q1倍率"},
  "d-engel-coefficient-income": {"image": "images/gap-spectrum.png", "caption": "記事の図: 品目別Q5/Q1支出倍率"},
  "d-kakei-spending-personality": {"image": "images/food-champions.png", "caption": "記事の図: 食の全国1位コレクション"},
  ...REFERENCE_COVER_FIGURES,
};

/** Palette guides: swatches drawn from the d3-scale-chromatic schemes each chapter covers. */
export const PALETTE_COVER_SWATCHES: Record<string, { kicker: string; subline: string; caption: string;
  rows: Array<{ name: string; kind: 'continuous' | 'categorical' }> }> = {
  'paid-nfe2c65e669a8': { kicker: 'D3.js 配色ガイド 第2章', subline: '順序データの配色とTypeScript実装', caption: 'D3 の順序配色から 7 種',
    rows: ['Blues', 'Greens', 'YlOrRd', 'YlGnBu', 'Viridis', 'Magma', 'Cividis'].map((name) => ({ name, kind: 'continuous' as const })) },
  'paid-n02da130aae01': { kicker: 'D3.js 配色ガイド 第3章', subline: '発散データの配色を選ぶ', caption: 'D3 の発散配色から 7 種',
    rows: ['RdBu', 'BrBG', 'PiYG', 'PRGn', 'PuOr', 'RdYlBu', 'Spectral'].map((name) => ({ name, kind: 'continuous' as const })) },
  'paid-n79fefdbd4d4c': { kicker: 'D3.js 配色ガイド 第4章', subline: 'カテゴリ・循環データの配色', caption: 'カテゴリ配色 5 種と循環配色 2 種',
    rows: [...['Category10', 'Tableau10', 'Set2', 'Dark2', 'Paired'].map((name) => ({ name, kind: 'categorical' as const })),
      ...['Rainbow', 'Sinebow'].map((name) => ({ name, kind: 'continuous' as const }))] },
  'paid-n66ffb10aa41b': { kicker: 'D3.js 配色ガイド 第5章', subline: '実践テクニック編', caption: '凡例で確かめる 5 種の配色',
    rows: [...['Viridis', 'Cividis', 'Inferno', 'PuOr'].map((name) => ({ name, kind: 'continuous' as const })),
      { name: 'Set2', kind: 'categorical' as const }] },
  'paid-n823d76c5cbac': { kicker: 'D3.js 配色ガイド 第6章・完結', subline: 'パレット辞書と実装チートシート', caption: '全98種から 8 種を抜粋',
    rows: [...['Blues', 'Viridis', 'Turbo', 'RdBu', 'Spectral', 'Rainbow'].map((name) => ({ name, kind: 'continuous' as const })),
      ...['Tableau10', 'Set3'].map((name) => ({ name, kind: 'categorical' as const }))] },
  'paid-nf80da34b28c3': { kicker: 'D3.js × 地図の配色', subline: 'データ可視化の配色理論', caption: '順序・発散・カテゴリの配色',
    rows: [...['YlOrRd', 'Blues', 'RdBu', 'PuOr'].map((name) => ({ name, kind: 'continuous' as const })),
      ...['Tableau10', 'Set2'].map((name) => ({ name, kind: 'categorical' as const }))] },
};

/** Dataset / Geo covers: a choropleth of the article's own published aggregate, or the stats47 figure that shows its headline claim. */
export type DatasetCoverFigure =
  | { kind: 'geo-item'; source: string; metric: string; invert?: boolean; caption: string }
  | { kind: 'stats-values'; source: string; year: string; invert?: boolean; caption: string }
  | { kind: 'image'; source: string; caption: string }
  // pack-csv: a column of the pack's own data.csv (local .local/coconala-products build) drawn as a choropleth.
  | { kind: 'pack-csv'; source: string; column: string; caption: string };
export const DATASET_COVER_FIGURES: Record<string, DatasetCoverFigure> = {
  'd-geo-ipss-prefecture-map': { kind: 'stats-values', source: 'app/stats/future-population-change-rate-2050/values.json', year: '2050', invert: true,
    caption: '2050年の人口増減率（2020年比）濃いほど減少' },
  'd-geo-flood-population-mesh': { kind: 'geo-item', source: 'app/geo/population-flood-risk/item.json', metric: 'floodExposureShare2050',
    caption: '2050年 浸水想定区域の人口比率 濃いほど高い' },
  'd-geo-land-price-future-population': { kind: 'geo-item', source: 'app/geo/population-land-price/item.json', metric: 'risingDecliningPointShare',
    caption: '地価上昇×人口減少の地点比率 濃いほど高い' },
  'd-geo-station-access-analysis': { kind: 'geo-item', source: 'app/geo/population-station-access/item.json', metric: 'stationAccessShare2050',
    caption: '2050年 駅800m圏の人口比率 濃いほど高い' },
  'paid-n92b846280d1a': { kind: 'image', source: 'note/stats47-note/n03844512d58a/images/image-03.png',
    caption: '家計調査 五分位階級別の品目格差（2024年）' },
  'd-kakei-category-dataset': { kind: 'image', source: 'note/stats47-note/n68f5e09c8d62/images/image-04.png',
    caption: '家計調査の教育費 1位と47位（2024年）' },
  "prefecture-population-household-pack": { kind: 'pack-csv', source: ".local/coconala-products/P-01/v3-20261012-mac-r4/data.csv", column: "総人口（人・2025）", caption: "収録データの例: 総人口" },
  "prefecture-income-wage-hiring-pack": { kind: 'pack-csv', source: ".local/coconala-products/P-02/v3-20261012-mac-r4/data.csv", column: "有効求人倍率（倍・2022）", caption: "収録データの例: 有効求人倍率" },
  "prefecture-tourism-lodging-pack": { kind: 'pack-csv', source: ".local/coconala-products/P-03/v3-20261012-mac-r4/data.csv", column: "延べ宿泊者数（人泊・2024）", caption: "収録データの例: 延べ宿泊者数" },
  "prefecture-municipal-finance-pack": { kind: 'pack-csv', source: ".local/coconala-products/P-04/v3-20261012-mac-r4/data.csv", column: "財政力指数（都道府県財政）（指数・2022）", caption: "収録データの例: 財政力指数" },
  "prefecture-healthcare-nursing-pack": { kind: 'pack-csv', source: ".local/coconala-products/P-05/v3-20261012-mac-r4/data.csv", column: "医師数（人・2022）", caption: "収録データの例: 医師数" },
  "prefecture-education-childcare-pack": { kind: 'pack-csv', source: ".local/coconala-products/P-06/v3-20261012-mac-r4/data.csv", column: "図書館数（人口100万人当たり）（館・2021）", caption: "収録データの例: 図書館数" },
  "prefecture-migration-living-pack": { kind: 'pack-csv', source: ".local/coconala-products/P-07/v3-20261012-mac-r4/data.csv", column: "年平均気温（℃・2024）", caption: "収録データの例: 年平均気温" },
  "prefecture-retail-trade-area-pack": { kind: 'pack-csv', source: ".local/coconala-products/P-08/v3-20261012-mac-r4/data.csv", column: "商業年間商品販売額（卸売業＋小売業）（百万円・2022）", caption: "収録データの例: 商業年間商品販売額" },
  "prefecture-industry-economy-pack": { kind: 'pack-csv', source: ".local/coconala-products/P-09/v3-20261012-mac-r4/data.csv", column: "耕地放棄面積（ｈａ・2014）", caption: "収録データの例: 耕地放棄面積" },
  "prefecture-disaster-infrastructure-pack": { kind: 'pack-csv', source: ".local/coconala-products/P-10/v3-20261012-mac-r4/data.csv", column: "道路実延長（高速道路）（km・2023）", caption: "収録データの例: 道路実延長" },
  "prefecture-map-chart-assets-pack": { kind: 'pack-csv', source: ".local/coconala-products/P-11/v3-20261012-mac-r4/data.csv", column: "総人口（人・2025）", caption: "収録データの例: 総人口" },
  "prefecture-all-in-one-pack": { kind: 'pack-csv', source: ".local/coconala-products/P-12/v3-20261012-mac-r4/data.csv", column: "総人口（人・2025）", caption: "収録データの例: 総人口" },
  "prefecture-free-trial-pack": { kind: 'pack-csv', source: ".local/coconala-products/P-13/v3-20261012-mac-r4/data.csv", column: "総人口（人・2024）", caption: "収録データの例: 総人口" },
  "prefecture-household-consumption-pack": { kind: 'pack-csv', source: ".local/coconala-products/P-14/v3-20261012-mac-r4/data.csv", column: "りんご消費支出額（都道府県庁所在市の二人以上世帯の年間りんご消費支出額）（円・2024）", caption: "収録データの例: りんご消費支出額" },
};
