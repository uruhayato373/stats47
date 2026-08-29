export interface SurveyReaderQuestion {
  question: string;
  rankingKey: string;
}

export interface SurveyEditorialContent {
  summary: string;
  whatYouCanLearn: readonly string[];
  readerQuestions: readonly SurveyReaderQuestion[];
  caveats: readonly string[];
}

export function requiredSurveyReaderQuestionCount(
  activeRankingCount: number
): number {
  return Math.min(3, Math.max(0, activeRankingCount));
}

const SURVEY_EDITORIAL_CONTENT = {
  census: {
    summary:
      '国勢調査は、日本に住むすべての人と世帯を対象に5年ごとに行われる基幹統計です。人口だけでなく、年齢、配偶関係、世帯構成、就業状態などから地域の姿を比較できます。',
    whatYouCanLearn: [
      '年齢・性別ごとの人口構成と地域差',
      '未婚率や単独世帯割合など世帯構成の違い',
      '高齢世帯や生産年齢人口の地域的な偏り',
      '昼間人口・流入人口から見た都市の通勤通学構造',
    ],
    readerQuestions: [
      {
        question: '30代前半男性の未婚率が高い都道府県は？',
        rankingKey: 'unmarried-ratio-male-30-34',
      },
      {
        question: '一人暮らし世帯が多い都道府県は？',
        rankingKey: 'single-person-household-ratio',
      },
      {
        question: '高齢者の一人暮らしが多い都道府県は？',
        rankingKey: 'single-person-household-old-population-ratio',
      },
      {
        question: '生産年齢人口の割合が高い都道府県は？',
        rankingKey: 'production-age-population-ratio',
      },
      {
        question: '昼間に人口が集まる都道府県は？',
        rankingKey: 'day-time-population-ratio',
      },
    ],
    caveats: [
      '割合は母数によって意味が変わります。未婚率なら、性別や年齢階級が同じ指標同士で比較してください。',
      '国勢調査は5年ごとの特定時点を捉える調査です。毎年の変化を見る場合は、人口推計など他の統計も併用します。',
      '順位だけでは地域差の原因は分かりません。年齢構成、人口移動、都市化など複数の背景を分けて考える必要があります。',
    ],
  },
  'wage-structure-survey': {
    summary:
      '賃金構造基本統計調査は、厚生労働省が毎年実施する賃金の基幹統計です。大工やソフトウェア作成者など職種別の平均年収から、初任給、パートの時給、労働時間まで、性別・学歴などの区分で都道府県の賃金水準を比較できます。',
    whatYouCanLearn: [
      '大工からITエンジニアまで、職種ごとの平均年収の地域差',
      '男女の賃金格差と所定内給与の水準',
      '大卒・高卒など学歴と性別ごとの初任給の都道府県差',
      'パート労働者の時給と月間実労働時間の違い',
    ],
    readerQuestions: [
      {
        question: '大工の平均年収が高い都道府県は？',
        rankingKey: 'carpenter-annual-income',
      },
      {
        question:
          'ソフトウェア作成者（SE・プログラマー）の平均年収が高い都道府県は？',
        rankingKey: 'software-engineer-annual-income',
      },
      {
        question: '理学療法士等の平均年収が高い都道府県は？',
        rankingKey: 'physical-therapist-annual-income',
      },
      {
        question: '公認会計士・税理士の平均年収が高い都道府県は？',
        rankingKey: 'accountant-annual-income',
      },
      {
        question: '管理職（管理的職業従事者）の平均年収が高い都道府県は？',
        rankingKey: 'manager-annual-income',
      },
    ],
    caveats: [
      '「平均年収」は、きまって支給する現金給与と年間賞与などから算出した額面の推計値です。手取りではなく、所定内給与・初任給・時給とも定義が異なるため、種類の違う指標同士を直接比較しないでください。',
      '職種別の値は、性別・年齢・勤続年数・企業規模など標本の構成に影響されます。順位の差がそのまま同じ人の待遇差を意味するわけではなく、都道府県の平均値から個人の給与は予測できません。',
      '物価や家賃など生活費を控除した可処分所得のランキングではありません。地域の生活コストと合わせて読む必要があります。',
      '「理学療法士等」「公認会計士・税理士」「管理的職業従事者」のように複数の職種をまとめた区分があります。職種の正確な範囲は、各ランキングページの定義・出典で確認してください。最新データは2023年調査です。',
      '2020年に調査の推計方法と職種区分が変わりました。2019年以前の旧系列と現行の数値は接続しない場合があるため、時系列で比較するときは注意してください。',
    ],
  },
  'kakei-chousa': {
    summary:
      '家計調査は、総務省統計局が世帯を継続的に抽出して、収入と支出、品目別の購入量などを毎月調べる基幹統計調査です。このハブでは、主に都道府県庁所在市の二人以上世帯について、年間の品目別支出額や購入量を比較できます。',
    whatYouCanLearn: [
      'パンや米など品目別の年間支出額と購入量の地域差',
      '外食費や宿泊料などサービス支出の違い',
      '電気・ガス・上下水道に対する世帯支出の差',
      '食料費と消費支出総額から見た家計配分の違い',
    ],
    readerQuestions: [
      {
        question: 'パンへの年間支出が多い都市は？',
        rankingKey: 'bread-consumption-expenditure',
      },
      {
        question: '外食への年間支出が多い都市は？',
        rankingKey: 'dining-out-consumption-expenditure',
      },
      {
        question: '年間の電気使用量が多い都市は？',
        rankingKey: 'electricity-consumption-quantity',
      },
      {
        question: '二人以上世帯の消費支出総額が多い都市は？',
        rankingKey: 'consumption-expenditure-total',
      },
    ],
    caveats: [
      '都道府県全体ではなく、都道府県庁所在市を中心とする都市別の標本調査結果です。県民全体の消費傾向とは一致しません。',
      '主な品目ランキングは二人以上世帯を対象とします。単身世帯や世帯人員が異なる集計と直接比較しないでください。',
      '支出額は価格と購入量の両方に左右されます。消費量の多さを判断するときは、数量の指標がある品目では数量も併せて確認してください。',
    ],
  },
  'commercial-dynamics-survey': {
    summary:
      '商業動態統計調査は、経済産業省が卸売業・小売業の事業所または企業を対象に毎月実施し、販売活動の動向を捉える統計調査です。このハブでは、コンビニエンスストアや百貨店・スーパーの店舗数と販売額を都道府県別に比較できます。',
    whatYouCanLearn: [
      'コンビニエンスストア店舗数の地域差',
      'コンビニエンスストアの年間・月次販売額の違い',
      '百貨店・スーパー販売額の都道府県差',
      '店舗数と販売規模が必ずしも一致しない地域構造',
    ],
    readerQuestions: [
      {
        question: 'コンビニエンスストアの店舗数が多い都道府県は？',
        rankingKey: 'convenience-store-count-commercial',
      },
      {
        question: 'コンビニエンスストアの年間販売額が大きい都道府県は？',
        rankingKey: 'convenience-store-sales',
      },
      {
        question: 'コンビニエンスストア販売額の月次推移を比較すると？',
        rankingKey: 'convenience-store-sales-monthly',
      },
      {
        question: '百貨店・スーパー販売額が大きい都道府県は？',
        rankingKey: 'department-supermarket-sales',
      },
    ],
    caveats: [
      '卸売業・小売業全体は標本調査で推計される一方、百貨店・スーパーなどは調査票や集計方法が異なります。異なる業態の数値を単純に合算しないでください。',
      '販売額には消費税が含まれ、店頭販売だけでなく通信販売などを含む場合があります。',
      '月次値と年計、店舗数と販売額は別の指標です。季節変動や水準調整、調査対象の見直しがあるため、長期比較では各年の注記も確認してください。',
    ],
  },
  'social-education-survey': {
    summary:
      '社会教育調査は、文部科学省が公民館、図書館、博物館、社会体育施設などを対象に実施する基幹統計調査です。施設数だけでなく、蔵書、貸出、登録者、学級・講座など、地域の社会教育活動と利用状況を把握できます。',
    whatYouCanLearn: [
      '図書館・博物館・水族館など社会教育施設の地域差',
      '図書館の蔵書数、館外貸出冊数、登録者数の違い',
      '公共・民間の体育施設やキャンプ場などの整備状況',
      '成人・高齢者・女性向け学級や講座の実施状況',
    ],
    readerQuestions: [
      {
        question: '人口当たりの図書館数が多い都道府県は？',
        rankingKey: 'library-count-per-million',
      },
      {
        question: '図書館の館外貸出冊数が多い都道府県は？',
        rankingKey: 'library-lending-books',
      },
      {
        question: '美術博物館が多い都道府県は？',
        rankingKey: 'art-museum-count',
      },
      {
        question: '人口当たりの社会体育施設が多い都道府県は？',
        rankingKey: 'community-sports-facility-count-per-million',
      },
    ],
    caveats: [
      '施設の種類ごとに法令上・調査上の対象範囲が異なります。博物館には登録博物館、指定施設、一定規模以上の類似施設が含まれます。',
      '施設数の多さは、規模、開館日数、利用者数、サービス内容の充実度を直接示すものではありません。',
      '人口当たりの指標と実数を混同せず、調査年度や施設区分が同じランキング同士で比較してください。',
    ],
  },
  'social-welfare-facility-survey': {
    summary:
      '社会福祉施設等調査は、厚生労働省が全国の社会福祉施設・事業所を対象に毎年10月1日現在で実施する調査です。施設数、定員、在所者、従事者などから、児童・高齢者・障害者福祉サービスの提供体制を把握できます。',
    whatYouCanLearn: [
      '児童福祉施設や保育所等の施設数と従事者数',
      '老人ホームの施設数、定員、在所者、従事者の地域差',
      '障害者支援施設の定員と在所者数の違い',
      '人口や対象年齢人口で標準化した福祉施設の整備状況',
    ],
    readerQuestions: [
      {
        question: '人口当たりの児童福祉施設等数が多い都道府県は？',
        rankingKey: 'child-welfare-facility-count-per-100k',
      },
      {
        question: '0〜5歳人口当たりの保育所等数が多い都道府県は？',
        rankingKey: 'nursery-count-per-100k-0-5',
      },
      {
        question: '高齢者人口当たりの老人ホーム定員が多い都道府県は？',
        rankingKey: 'nursing-home-capacity-per-1000-65plus',
      },
      {
        question: '人口当たりの知的障害者援護施設数が多い都道府県は？',
        rankingKey: 'intellectual-disability-support-facility-count-per-1m',
      },
    ],
    caveats: [
      '基本票は行政情報を基に把握する項目を含み、詳細票は2018年から一部が標本調査です。施設数と従事者・利用者の推計値では調査方法が異なる場合があります。',
      '社会福祉制度の改正に伴って施設区分や調査対象が変わるため、旧名称の施設を含む長期系列は同じ制度範囲とは限りません。',
      '人口当たり、高齢者人口当たり、実数では分母が異なります。施設の充足度を比べるときは同じ分母の指標を使ってください。',
    ],
  },
  'prefectural-settlement-survey': {
    summary:
      '都道府県決算状況調は、総務省の地方財政状況調査に基づき、各都道府県の毎年度の決算を統一的な会計区分で整理する資料です。歳入・歳出の内訳、地方債、基金、財政力指数や経常収支比率などから都道府県財政を比較できます。',
    whatYouCanLearn: [
      '地方税、地方交付税、国庫支出金など歳入構成の違い',
      '民生費、教育費、土木費など目的別歳出の地域差',
      '人件費、扶助費、公債費など性質別歳出の構成',
      '財政力指数、経常収支比率、実質公債費比率など財政指標の違い',
    ],
    readerQuestions: [
      {
        question: '財政力指数が高い都道府県は？',
        rankingKey: 'fiscal-strength-index-prefecture',
      },
      {
        question: '経常収支比率が高い都道府県は？',
        rankingKey: 'current-balance-ratio',
      },
      {
        question: '教育費が歳出に占める割合が高い都道府県は？',
        rankingKey: 'education-expenditure-ratio-pref-finance',
      },
      {
        question: '農林水産業費が多い都道府県は？',
        rankingKey: 'agriculture-forestry-fisheries-expenses-prefecture',
      },
    ],
    caveats: [
      '団体ごとに会計範囲が異なるため、地方財政状況調査では普通会計など統一的な区分へ組み替えて比較します。自治体の公表決算書と項目が完全には一致しない場合があります。',
      '金額の大きさは人口や行政需要に左右されます。総額、住民1人当たり、歳出に占める割合を区別して読んでください。',
      '財政力指数や経常収支比率は定義が異なり、値の高低の意味も同じではありません。単一指標だけで財政の健全性を判断しないでください。',
    ],
  },
  'municipal-settlement-survey': {
    summary:
      '市町村別決算状況調は、総務省の地方財政状況調査に基づき、各市町村の毎年度の決算を共通の区分で整理する資料です。このハブでは、都道府県内の市町村分を都道府県分と合わせた歳出・税収や、人口・児童生徒数などで標準化した財政指標を比較できます。',
    whatYouCanLearn: [
      '住民1人当たりの住民税・固定資産税の地域差',
      '教育、福祉、衛生、土木など住民1人当たり歳出の違い',
      '児童・生徒1人当たりの学校教育費の差',
      '消防費や民生費が歳出に占める割合の違い',
    ],
    readerQuestions: [
      {
        question: '住民1人当たりの住民税が多い都道府県は？',
        rankingKey: 'per-capita-inhabitant-tax-pref-municipal',
      },
      {
        question: '住民1人当たりの歳出決算総額が多い都道府県は？',
        rankingKey: 'per-capita-total-expenditure-pref-municipal',
      },
      {
        question: '住民1人当たりの教育費が多い都道府県は？',
        rankingKey: 'per-capita-education-expenditure-pref-municipal',
      },
      {
        question: '公立小学校の児童1人当たり支出が多い都道府県は？',
        rankingKey:
          'per-child-public-elementary-school-expenditure-pref-municipal',
      },
    ],
    caveats: [
      'このハブの指標には、市町村だけでなく都道府県分を合算したものがあります。各ランキングのsubtitleで集計範囲を確認してください。',
      '人口1人当たり、対象児童1人当たり、歳出割合では分母が異なります。金額の総額やサービス量と同じ意味ではありません。',
      '東京都と特別区・市町村の事務分担は他道府県と異なるため、消防費など一部指標には東京向けの調整があります。',
    ],
  },
  'economic-census-activity': {
    summary:
      '経済センサス‐活動調査は、総務省と経済産業省が原則5年ごとに全国の事業所・企業を対象として、売上、費用、従業者など経済活動を横断的に調べる基幹統計調査です。製造、卸売・小売、サービスなど産業をまたいで地域の事業規模と構造を比較できます。',
    whatYouCanLearn: [
      '産業別の事業所数・従業者数と従業者規模の構成',
      '製造品出荷額や付加価値額など製造業の規模',
      '卸売・小売業の年間商品販売額と事業所当たり販売額',
      'コンビニエンスストアや百貨店・総合スーパーの事業所数',
    ],
    readerQuestions: [
      {
        question: '商業の年間商品販売額が大きい都道府県は？',
        rankingKey: 'annual-sales-amount',
      },
      {
        question: '製造業の従業者数が多い都道府県は？',
        rankingKey: 'manufacturing-employees',
      },
      {
        question: '人口当たりのコンビニエンスストア数が多い都道府県は？',
        rankingKey: 'convenience-store-count-per-100k',
      },
      {
        question: '従業者1〜4人の小規模事業所割合が高い都道府県は？',
        rankingKey: 'establishment-ratio-1-4-employees-private',
      },
    ],
    caveats: [
      '売上や従業者は事業所所在地または企業単位の集計があり、本社の所在地と事業活動の場所が一致しない場合があります。各表の集計単位を確認してください。',
      '産業分類、調査票、売上把握の範囲は調査年により変わることがあります。異なる回の長期比較では接続可否を確認する必要があります。',
      '事業所数と企業数は同じではありません。一つの企業が複数の事業所を持つ場合、それぞれが事業所として数えられます。',
    ],
  },
  'economic-census-basic': {
    summary:
      '経済センサス‐基礎調査は、総務省が事業所・企業の活動状態、産業、従業者規模などの基本構造を全国・地域別に把握し、他の事業所統計の母集団情報を整備する基幹統計調査です。このハブでは、産業別の事業所数や産業構成を都道府県別に比較できます。',
    whatYouCanLearn: [
      '都道府県ごとの事業所総数',
      '製造業、建設業、情報通信業など産業別事業所数',
      '第2次・第3次産業の事業所構成比',
      '事業所当たり従業者数から見た産業構造の違い',
    ],
    readerQuestions: [
      {
        question: '事業所数が多い都道府県は？',
        rankingKey: 'number-of-establishments-economic-census-basic-survey',
      },
      {
        question: '製造業の事業所数が多い都道府県は？',
        rankingKey: 'number-of-establishments-manufacturing',
      },
      {
        question: '情報通信業の事業所数が多い都道府県は？',
        rankingKey: 'number-of-establishments-information-communication',
      },
      {
        question: '第3次産業の事業所構成比が高い都道府県は？',
        rankingKey: 'tertiary-industry-establishment-ratio',
      },
    ],
    caveats: [
      '個人経営の農林漁家、家事サービス業、外国公務など、調査対象外となる事業所があります。全ての働く場所を漏れなく数えた値ではありません。',
      '事業所は一定の場所で継続的に経済活動を行う単位で、企業とは数え方が異なります。',
      '調査対象と実施方法は基礎調査の回ごとに変化しています。旧事業所・企業統計や活動調査の値と接続して比較する場合は対象範囲を確認してください。',
    ],
  },
  'area-survey': {
    summary:
      '全国都道府県市区町村別面積調は、国土地理院が電子国土基本図の海岸線と行政界を用いて、都道府県・市区町村別の国土面積を継続的に測定・公表する基本測量です。このハブでは、面積そのものに加え、面積を分母とする施設密度や道路密度などを比較できます。',
    whatYouCanLearn: [
      '都道府県面積と全国面積に占める割合',
      '可住地面積や森林面積など土地条件の地域差',
      '面積当たりの医療・消防・公園施設の密度',
      '可住地面積当たりの学校数や道路延長の違い',
    ],
    readerQuestions: [
      {
        question: '全国面積に占める割合が大きい都道府県は？',
        rankingKey: 'area-ratio-of-total',
      },
      {
        question: '可住地面積の割合が高い都道府県は？',
        rankingKey: 'habitable-area-ratio',
      },
      {
        question: '可住地100平方キロメートル当たりの小学校数が多い都道府県は？',
        rankingKey: 'elementary-school-count-per-100km2-habitable',
      },
      {
        question: '面積当たりの一般診療所数が多い都道府県は？',
        rankingKey: 'general-clinic-count-per-100km2',
      },
    ],
    caveats: [
      '海岸線は満潮時の水涯線を用い、河川と湖沼は陸域に含めます。埋立て、侵食、測定精度の向上でも公表面積が変わることがあります。',
      '2014年以降は電子国土基本図に基づく測定方法へ移行しており、2013年以前との変化には方法変更の影響が含まれます。',
      '面積調が直接測るのは行政区域の面積です。可住地面積や施設数を使う派生指標は、別の統計を分子・分母として組み合わせています。',
    ],
  },
  'care-service-facility-survey': {
    summary:
      '介護サービス施設・事業所調査は、厚生労働省が全国の介護保険施設と介護サービス事業所を対象に毎年10月1日現在で実施する調査です。施設・事業所数、定員、在所者、利用者、従事者などから介護サービスの提供体制を把握できます。',
    whatYouCanLearn: [
      '高齢者人口当たりの介護施設数と定員の地域差',
      '介護施設の在所者数と従事者数の違い',
      '訪問介護事業所当たりの利用者数',
      '介護老人福祉施設などサービス種別ごとの整備状況',
    ],
    readerQuestions: [
      {
        question: '高齢者人口当たりの老人ホーム数が多い都道府県は？',
        rankingKey: 'nursing-home-count-per-100k-65plus',
      },
      {
        question: '高齢者人口当たりの老人ホーム定員が多い都道府県は？',
        rankingKey: 'nursing-home-capacity-per-1000-65plus',
      },
      {
        question: '高齢者人口当たりの老人ホーム従事者が多い都道府県は？',
        rankingKey: 'nursing-home-staff-per-100k-65plus',
      },
      {
        question: '訪問介護事業所当たりの利用者が多い都道府県は？',
        rankingKey: 'home-helper-users-per-office',
      },
    ],
    caveats: [
      '基本票は施設・事業所の全数を行政情報から把握しますが、詳細票はサービス種別によって層化無作為抽出を含みます。項目ごとに全数と推計値を区別してください。',
      '介護保険制度の改正により対象サービスが追加・廃止されます。介護療養型医療施設は2024年から調査対象外です。',
      '施設数、定員、在所者、利用者、従事者は提供体制の異なる側面です。人口当たりの値だけでサービスの質や利用しやすさは判断できません。',
    ],
  },
  'vital-statistics': {
    summary:
      '人口動態統計は、厚生労働省が出生・死亡・婚姻・離婚・死産の届出を基に継続して作成する基幹統計です。このハブでは、出生率や合計特殊出生率、死亡率、初婚年齢などから都道府県の人口動態を比較できます。',
    whatYouCanLearn: [
      '出生率と合計特殊出生率の地域差',
      '死亡率と死因別死亡の違い',
      '夫・妻それぞれの平均初婚年齢',
      '乳児・新生児・周産期の死亡率',
    ],
    readerQuestions: [
      {
        question: '合計特殊出生率が高い都道府県は？',
        rankingKey: 'total-fertility-rate',
      },
      {
        question: '人口に対する出生率が高い都道府県は？',
        rankingKey: 'crude-birth-rate',
      },
      {
        question: '妻の平均初婚年齢が高い都道府県は？',
        rankingKey: 'average-age-of-first-marriage-wife',
      },
      {
        question: '出生千人当たりの乳児死亡率が高い都道府県は？',
        rankingKey: 'infant-mortality-rate-per-1000-births',
      },
    ],
    caveats: [
      '出生率、死亡率、婚姻率などは分母が異なります。件数と率を区別し、同じ定義の指標同士で比較してください。',
      '都道府県別集計は住所地・発生地など表ごとに集計基準が異なる場合があります。各ランキングの出典表と注記を確認してください。',
      '死因分類は国際疾病分類（ICD）の改訂や原死因選択ルールの変更の影響を受けます。長期比較では系列の接続性に注意が必要です。',
    ],
  },
  'population-estimates': {
    summary:
      '人口推計は、総務省統計局が国勢調査人口を基準に、出生・死亡と出入国・都道府県間移動などを加減して作成する人口統計です。全国人口は毎月、都道府県別人口は各年10月1日現在を中心に公表され、このハブでは人口規模・年齢構成と人口を分母にした地域指標を比較できます。',
    whatYouCanLearn: [
      '総人口と全国人口に占める割合',
      '年少・生産年齢・65歳以上人口の構成',
      '人口増減と自然増減・社会増減の違い',
      '人口を分母に標準化した施設・サービスの地域差',
    ],
    readerQuestions: [
      { question: '総人口が多い都道府県は？', rankingKey: 'total-population' },
      {
        question: '人口増加率が高い都道府県は？',
        rankingKey: 'population-growth-rate',
      },
      {
        question: '65歳以上人口の割合が高い都道府県は？',
        rankingKey: 'ratio-65-plus',
      },
      {
        question: '15歳未満人口の割合が高い都道府県は？',
        rankingKey: 'young-population-ratio',
      },
    ],
    caveats: [
      '国勢調査年以外は推計値です。基準となる国勢調査の確定や推計方法の改定によって、過去の系列が補正されることがあります。',
      '全国の月次値と都道府県別の年次値では公表時点が異なり、直近値には概算値を含む場合があります。時点をそろえて比較してください。',
      '人口千人・10万人当たりの派生指標は、分子となる統計の年度と人口の基準日が一致しない場合があります。小さな差を過度に解釈しないでください。',
    ],
  },
  'resident-registry-migration-report': {
    summary:
      '住民基本台帳人口移動報告は、総務省統計局が住民基本台帳に基づく月々の人口移動を集計し、月次・年次で公表する統計です。このハブでは、日本人・外国人移動者を分けながら、都道府県への転入、都道府県からの転出、転入超過の地域差を実数と率で比較できます。',
    whatYouCanLearn: [
      '都道府県別の転入者数と転出者数',
      '日本人移動者と外国人移動者の違い',
      '人口規模を踏まえた転入率・転出率の地域差',
      '転入超過率から見た人口移動の流入・流出傾向',
    ],
    readerQuestions: [
      {
        question: '日本人移動者の転入超過率が高い都道府県は？',
        rankingKey: 'moving-in-excess-rate-japanese',
      },
      {
        question: '外国人移動者の転入超過率が高い都道府県は？',
        rankingKey: 'moving-in-excess-rate',
      },
      {
        question: '日本人の転入者数が多い都道府県は？',
        rankingKey: 'japanese-movers-in',
      },
      {
        question: '外国人の転出者数が多い都道府県は？',
        rankingKey: 'movers-out',
      },
    ],
    caveats: [
      '住民基本台帳上の住所異動を集計したフロー統計であり、各地域に住む人口の総数を示す人口推計とは異なります。',
      '日本人移動者と外国人移動者では対象となる移動者の範囲が異なります。対象区分が同じ指標同士で比較してください。',
      '実数は人口規模の影響を強く受けます。転入率・転出率・転入超過率を見る際も、分母、集計期間、国内移動と国外移動の扱いを各ランキングの注記で確認してください。',
    ],
  },
  'household-survey': {
    summary:
      '家計調査は、総務省統計局が全国約9千世帯を抽出し、家計簿などから収入・支出、貯蓄・負債を毎月調べる基幹統計調査です。このハブでは、二人以上の世帯や勤労者世帯の実収入、可処分所得、消費性向、費目別支出割合を比較できます。',
    whatYouCanLearn: [
      '勤労者世帯の実収入と可処分所得の地域差',
      '可処分所得に対する消費と貯蓄の配分',
      '食料、住居、教育、交通・通信など費目別支出割合',
      '二人以上世帯の月間消費支出の違い',
    ],
    readerQuestions: [
      {
        question: '勤労者世帯の月間実収入が多い都道府県は？',
        rankingKey: 'actual-income-worker-households-per-month',
      },
      {
        question: '勤労者世帯の可処分所得が多い都道府県は？',
        rankingKey: 'disposable-income-worker-households',
      },
      {
        question: '平均消費性向が高い都道府県は？',
        rankingKey: 'avg-propensity-to-consume-worker-households',
      },
      {
        question: '二人以上世帯の月間消費支出が多い都道府県は？',
        rankingKey: 'consumption-expenditure-multi-person-households-per-month',
      },
    ],
    caveats: [
      '標本調査のため、地域別の値には標本誤差があります。単年の小さな順位差より、複数年の傾向を重視してください。',
      '二人以上の世帯、勤労者世帯、単身世帯では対象が異なります。世帯区分が同じ指標同士で比較してください。',
      '実収入と可処分所得は世帯人員、世帯主年齢、有業人員などの構成に影響されます。個人の賃金や生活水準そのものを示す値ではありません。',
    ],
  },
  'commercial-statistics': {
    summary:
      '商業統計調査は、経済産業省が卸売業・小売業の全事業所を対象に、事業所数、従業者数、年間商品販売額、商品手持額などを把握してきた基幹統計調査です。このハブでは、書籍・雑誌小売業の販売額と卸売・小売業の商品在庫を比較できます。',
    whatYouCanLearn: [
      '書籍・雑誌小売業の年間商品販売額',
      '人口当たりに直した書籍・雑誌小売業の販売規模',
      '卸売業・小売業の商品手持額',
    ],
    readerQuestions: [
      {
        question: '書籍・雑誌小売業の年間販売額が大きい都道府県は？',
        rankingKey: 'book-magazine-retail-annual-sales',
      },
      {
        question: '人口当たりの書籍・雑誌小売業販売額が大きい都道府県は？',
        rankingKey: 'book-magazine-retail-annual-sales-per-capita',
      },
      {
        question: '卸売業・小売業の商品手持額が大きい都道府県は？',
        rankingKey: 'goods-inventory-wholesale-retail',
      },
    ],
    caveats: [
      '商業統計調査は2014年調査を最後に廃止され、その後の商業データは経済センサス‐活動調査や経済構造実態調査へ移行しています。掲載値は最新の商業活動を示すとは限りません。',
      '年間商品販売額は事業所所在地で集計され、地域住民がその地域で購入した額とは一致しません。',
      '人口当たり販売額は販売額を人口で割った派生値です。商圏外からの来訪者や事業者間取引の影響を含むため、住民1人の購入額とは解釈できません。',
    ],
  },
  'prefectural-accounts': {
    summary:
      '県民経済計算は、各都道府県が国民経済計算の考え方に沿って地域内の生産・分配・支出を毎年度推計し、内閣府が比較可能な形で取りまとめる統計です。このハブでは、県内総生産、経済成長率、県民所得とその増減を比較できます。',
    whatYouCanLearn: [
      '県内総生産から見た地域経済の規模',
      '名目・実質の経済成長率',
      '1人当たり県民所得の地域差',
      '県民所得・県民総所得の増減',
    ],
    readerQuestions: [
      {
        question: '県内総生産が大きい都道府県は？',
        rankingKey: 'total-production-in-the-prefecture',
      },
      {
        question: '1人当たり県民所得が高い都道府県は？',
        rankingKey: 'per-capita-prefectural-income-h27',
      },
      {
        question: '県内総生産の成長率が高い都道府県は？',
        rankingKey: 'gdp-growth-rate-pref-h23',
      },
      {
        question: '県民所得の増加率が高い都道府県は？',
        rankingKey: 'prefectural-income-growth-rate-h23',
      },
    ],
    caveats: [
      '県民経済計算は各都道府県が推計する加工統計です。基礎資料の制約や推計方法の違いがあるため、順位の小さな差を過度に解釈しないでください。',
      '基準年や国民経済計算の体系が改定されると過去値も遡及改定されます。H17・H23・H27など基準の異なる系列を直接つながないでください。',
      '1人当たり県民所得は企業所得なども人口で割った地域経済指標で、県民個人の平均給与や手取りではありません。',
    ],
  },
  'local-finance': {
    summary:
      '地方財政状況調査は、総務省が都道府県・市町村などの毎年度の決算を共通の区分で把握する調査です。このハブでは、歳入・歳出の内訳に加え、財政力指数、経常収支比率、実質公債費比率、将来負担比率などを比較できます。',
    whatYouCanLearn: [
      '地方税・地方交付税・国庫支出金など歳入構成',
      '教育・福祉・土木など目的別歳出の違い',
      '人件費・扶助費・公債費など性質別歳出の違い',
      '財政余力、債務負担、収支を表す各種財政指標',
    ],
    readerQuestions: [
      {
        question: '財政力指数が高い都道府県は？',
        rankingKey: 'fiscal-strength-index-prefecture',
      },
      {
        question: '経常収支比率が高い都道府県は？',
        rankingKey: 'current-balance-ratio',
      },
      {
        question: '実質公債費比率が高い都道府県は？',
        rankingKey: 'real-public-debt-service-ratio',
      },
      {
        question: '将来負担比率が高い都道府県は？',
        rankingKey: 'future-burden-ratio',
      },
    ],
    caveats: [
      '自治体の会計を比較可能にするため、普通会計など統一的な区分へ組み替えています。各団体が公表する決算書の項目と完全には一致しません。',
      '都道府県と市町村では担う事務が異なります。都道府県指標と市町村指標を混ぜず、rankingKeyとsubtitleで集計単位を確認してください。',
      '財政力指数、経常収支比率、実質公債費比率、将来負担比率は定義も望ましい方向も異なります。単一の比率だけで財政健全性を判断しないでください。',
    ],
  },
  'local-tax': {
    summary:
      '地方税に関する統計は、総務省が都道府県・市町村の課税状況や税収などを毎年度取りまとめる資料です。このハブでは、個人住民税の納税義務者と課税対象所得、軽自動車税の対象車両数から地域差を比較できます。',
    whatYouCanLearn: [
      '人口に占める個人住民税の納税義務者割合',
      '納税義務者1人当たりの課税対象所得',
      '所得割・均等割の納税義務者数',
      '軽自動車、原動機付自転車、小型二輪車の台数',
    ],
    readerQuestions: [
      {
        question: '納税義務者1人当たりの課税対象所得が高い都道府県は？',
        rankingKey: 'per-taxpayer-taxable-income',
      },
      {
        question: '住民に占める納税義務者の割合が高い都道府県は？',
        rankingKey: 'taxpayer-ratio-per-pref-resident',
      },
      {
        question: '所得割の納税義務者数が多い都道府県は？',
        rankingKey: 'taxpayer-count-income',
      },
      {
        question: '軽自動車などの台数が多い都道府県は？',
        rankingKey: 'kei-car-count',
      },
    ],
    caveats: [
      '課税対象所得は税法上の控除などを反映した課税標準で、給与総額、可処分所得、世帯所得とは異なります。',
      '納税義務者1人当たりと人口1人当たりでは分母が異なります。納税義務者割合と合わせて読んでください。',
      '税制改正、控除制度、課税年度の違いで系列が変わることがあります。車両台数は税の課税台帳に基づくため、実際の利用場所と一致しない場合があります。',
    ],
  },
  'school-basic-survey': {
    summary:
      '学校基本調査は、文部科学省が幼稚園から大学までの学校、在学者、教職員、卒業後の進路などを毎年調べる基幹統計調査です。このハブでは、学校数、児童生徒数、教員配置、進学・就職状況を都道府県別に比較できます。',
    whatYouCanLearn: [
      '学校種別の学校数と在学者数',
      '教員1人当たり児童生徒数と女性教員割合',
      '中学校・高等学校卒業者の進学率',
      '高校・大学卒業者の就職状況と県外就職割合',
    ],
    readerQuestions: [
      {
        question: '小学校数が多い都道府県は？',
        rankingKey: 'elementary-school-count',
      },
      {
        question: '中学校卒業者の進学率が高い都道府県は？',
        rankingKey: 'junior-high-school-advancement-rate',
      },
      {
        question: '高校卒業者の就職割合が高い都道府県は？',
        rankingKey: 'high-school-graduates-job-ratio',
      },
      {
        question: '大学の収容力指数が高い都道府県は？',
        rankingKey: 'university-capacity-index',
      },
    ],
    caveats: [
      '在学者・学校・教員の多くは各年5月1日現在、卒業後の状況は卒業時点など、項目によって基準日が異なります。',
      '学校数の多さは規模や通学しやすさを直接示しません。実数、対象年齢人口当たり、可住地面積当たりを区別してください。',
      '進学率・就職率は卒業者などを分母にする割合です。2025年度公表では一部進学率の分母へ特別支援学校卒業者を含める訂正があり、過年度値も訂正されています。',
    ],
  },
  'housing-land-survey': {
    summary:
      '住宅・土地統計調査は、総務省統計局が住宅と居住世帯、世帯が保有する土地などの実態を5年ごとに調べる基幹統計調査です。このハブでは、持ち家・借家・空き家の割合、住宅の広さ、耐震・省エネ設備などを都道府県別に比較できます。',
    whatYouCanLearn: [
      '持ち家、借家、共同住宅など住宅形態の地域差',
      '空き家率と住宅ストックの状況',
      '住宅の延べ面積、居住室数、最低居住面積水準',
      '耐震改修、バリアフリー、太陽光発電設備の普及状況',
    ],
    readerQuestions: [
      {
        question: '持ち家率が高い都道府県は？',
        rankingKey: 'owner-occupied-housing-ratio',
      },
      {
        question: '空き家率が高い都道府県は？',
        rankingKey: 'vacant-housing-rate',
      },
      {
        question: '1住宅当たりの延べ面積が広い都道府県は？',
        rankingKey: 'housing-floor-area',
      },
      {
        question: '耐震改修を行った住宅の割合が高い都道府県は？',
        rankingKey: 'earthquake-renovation-rate',
      },
    ],
    caveats: [
      '全住宅を直接数えるのではなく、標本から地域別の住宅数・世帯数を推計する調査です。小さな差には標本誤差が含まれます。',
      '空き家には賃貸・売却用、別荘などの二次的住宅、その他の住宅が含まれます。空き家率だけでは管理状態や利用可能性は分かりません。',
      '5年ごとの特定時点を捉える調査です。持ち家と借家、実数と割合、住宅当たりと世帯当たりを区別して比較してください。',
    ],
  },
  'accommodation-survey': {
    summary:
      '宿泊旅行統計調査は、観光庁がホテル、旅館、簡易宿所などの宿泊施設を対象に毎月実施し、宿泊旅行の実態を把握する統計調査です。このハブでは、延べ宿泊者数、外国人延べ宿泊者数、客室稼働率を都道府県別に比較できます。',
    whatYouCanLearn: [
      '延べ宿泊者数から見た宿泊需要の地域差',
      '外国人延べ宿泊者数から見たインバウンド需要',
      '客室稼働率から見た宿泊施設の利用状況',
    ],
    readerQuestions: [
      {
        question: '延べ宿泊者数が多い都道府県は？',
        rankingKey: 'total-overnight-guests',
      },
      {
        question: '外国人延べ宿泊者数が多い都道府県は？',
        rankingKey: 'total-overnight-guests-foreign',
      },
      {
        question: '客室稼働率が高い都道府県は？',
        rankingKey: 'room-utilization-rate',
      },
    ],
    caveats: [
      '延べ宿泊者数は同じ人が複数泊すると泊数分を数えます。旅行者の実人数とは異なります。',
      '2010年4〜6月調査から従業者9人以下の宿泊施設が対象に加わり、2026年1月から層化基準が従業者数から客室数へ変更されました。変更時期をまたぐ比較には注意が必要です。',
      '速報値と確定値があり、過去値の訂正や遡及推計も行われます。月次の季節性も大きいため、同月または年計で比較してください。',
    ],
  },
  'medical-facility-survey': {
    summary:
      '医療施設調査は、厚生労働省が病院と診療所の分布・整備状況、病床、従事者、診療機能などを把握する基幹統計調査です。全医療施設を詳しく調べる静態調査を3年ごとに、開設・廃止・変更の届出を捉える動態調査を毎月実施しています。',
    whatYouCanLearn: [
      '病院、一般診療所、歯科診療所の施設数と人口当たりの配置',
      '一般病床・精神病床の数と病床利用率',
      '病院の平均在院日数と入院・外来患者の状況',
      '病床当たりの医師・看護師配置',
    ],
    readerQuestions: [
      {
        question: '人口10万人当たりの一般病院数が多い都道府県は？',
        rankingKey: 'general-hospital-count-per-100k',
      },
      {
        question: '人口10万人当たりの一般病院病床数が多い都道府県は？',
        rankingKey: 'general-hospital-bed-count-per-100k',
      },
      {
        question: '一般病院の平均在院日数が長い都道府県は？',
        rankingKey: 'general-hospital-avg-length-of-stay',
      },
      {
        question: '一般病院の病床利用率が高い都道府県は？',
        rankingKey: 'general-hospital-bed-occupancy-rate',
      },
    ],
    caveats: [
      '静態調査と動態調査では時点・調査事項が異なります。施設数、病床数、診療機能を同じ調査時点の値として扱わないでください。',
      '人口当たりと面積当たりは、医療施設へのアクセスの異なる側面です。施設数や病床数の多さだけでは医療の質や受診しやすさを判断できません。',
      '動態調査は開設・廃止などの発生日ではなく、都道府県から調査票が提出された月に集計される場合があります。',
    ],
  },
  'physician-survey': {
    summary:
      '医師・歯科医師・薬剤師統計は、厚生労働省が国内に住所を持つ医師・歯科医師・薬剤師の届出票を集計し、従事場所や業務種別などの分布を明らかにする公的統計です。2年ごとの12月31日現在の届出を基に、このハブでは人数と人口当たり人数を都道府県別に比較できます。',
    whatYouCanLearn: [
      '医療施設で働く医師の人数と人口当たりの配置',
      '医療施設で働く歯科医師の人数と人口当たりの配置',
      '薬局や医療施設などで働く薬剤師数',
      '実数と人口当たり人数で異なる地域順位',
    ],
    readerQuestions: [
      {
        question: '人口10万人当たりの医療施設従事医師が多い都道府県は？',
        rankingKey: 'physicians-in-medical-facilities-per-100k',
      },
      {
        question: '医療施設で働く医師の実数が多い都道府県は？',
        rankingKey: 'physicians-in-medical-facilities',
      },
      {
        question: '人口10万人当たりの歯科医師が多い都道府県は？',
        rankingKey: 'dentists-in-medical-facilities-per-100k',
      },
      {
        question: '薬剤師数が多い都道府県は？',
        rankingKey: 'pharmacist-count',
      },
    ],
    caveats: [
      '届出義務に基づく統計で、免許登録者総数と実際に業務へ従事している人数は同じではありません。ランキングの対象区分を確認してください。',
      '2018年から、従来の一般統計調査ではなく行政記録情報を利用する公的統計へ変更されました。旧調査と長期比較するときは作成方法の変更に注意が必要です。',
      '実数と人口10万人当たりでは意味が異なります。医療施設従事者の分布だけで、診療科別の不足や医療アクセスを判断することはできません。',
    ],
  },
  'police-statistics': {
    summary:
      '犯罪統計は、警察庁が警察に認知された刑法犯や特別法犯の件数、検挙件数・人員などを集計する業務統計です。このハブでは、刑法犯の認知件数・検挙率、窃盗・凶悪犯などの構成、少年検挙人員を都道府県別に比較できます。',
    whatYouCanLearn: [
      '刑法犯の認知件数と人口当たりの発生水準',
      '刑法犯・窃盗犯の検挙率',
      '窃盗犯、粗暴犯、凶悪犯など罪種別の構成',
      '少年刑法犯や特別法犯の検挙状況',
    ],
    readerQuestions: [
      {
        question: '人口千人当たりの刑法犯認知件数が多い都道府県は？',
        rankingKey: 'crime-rate-per-1k',
      },
      {
        question: '刑法犯の検挙率が高い都道府県は？',
        rankingKey: 'criminal-arrest-rate',
      },
      {
        question: '人口千人当たりの窃盗犯認知件数が多い都道府県は？',
        rankingKey: 'theft-offenses-recognized-per-1000',
      },
      {
        question: '人口10万人当たりの凶悪犯認知件数が多い都道府県は？',
        rankingKey: 'serious-crime-per-100k',
      },
    ],
    caveats: [
      '認知件数は警察が犯罪の発生を認知した件数で、被害実態の全てではありません。届出行動や警察活動、統計基準の影響を受けます。',
      '検挙率は、その年の検挙件数を認知件数で割るなどの方法で算出され、検挙した事件と認知した年が一致しない場合があります。',
      '最新期間には暫定値、年計には確定値があります。実数、人口当たり、認知件数に占める割合を区別して比較してください。',
    ],
  },
  'social-life-basic-survey': {
    summary:
      '社会生活基本調査は、総務省統計局が生活時間の配分と、学習、スポーツ、趣味・娯楽、旅行、ボランティアなどの生活行動を5年ごとに調べる基幹統計調査です。このハブでは、男女・就業状態別の平均時間と、過去1年間に各活動を行った人の割合を比較できます。',
    whatYouCanLearn: [
      '仕事、家事、余暇などに使う平均時間の地域差',
      'スポーツ種目別の行動者率',
      '趣味・娯楽、学習・自己啓発の行動者率',
      '旅行、ボランティア活動への参加状況',
    ],
    readerQuestions: [
      {
        question: 'ウォーキングや軽い体操をした人の割合が高い都道府県は？',
        rankingKey: 'sports-participation-rate-walking',
      },
      {
        question: '趣味として読書をした人の割合が高い都道府県は？',
        rankingKey: 'hobby-participation-rate-reading',
      },
      {
        question: '英語学習をした人の割合が高い都道府県は？',
        rankingKey: 'study-participation-rate-english',
      },
      {
        question: '国内観光旅行をした人の割合が高い都道府県は？',
        rankingKey: 'travel-participation-rate-domestic-tourism',
      },
    ],
    caveats: [
      '行動者率は過去1年間にその活動を行った人の割合で、回数、時間、熟練度を表すものではありません。',
      '生活時間は指定された調査日の行動を回答するため、曜日、天候、季節などの影響を受けます。平均時間の対象集団も確認してください。',
      '標本調査であり、年齢構成や就業状態など地域の人口構成にも左右されます。5年ごとの単年順位の小さな差を過度に解釈しないでください。',
    ],
  },
  'employment-structure-survey': {
    summary:
      '就業構造基本調査は、総務省統計局が15歳以上の人について、ふだんの就業・不就業状態、就業形態、就業希望、育児・介護などを5年ごとに調べる基幹統計調査です。このハブでは、転職・離職・副業・テレワークや、育児・介護をしている人の就業状況を比較できます。',
    whatYouCanLearn: [
      '転職、離職、新規就業など就業異動の地域差',
      '副業・フリーランス・テレワークの状況',
      '育児をしている人の就業率',
      '介護をしている人の就業率と夫の育児参加',
    ],
    readerQuestions: [
      {
        question: '転職率が高い都道府県は？',
        rankingKey: 'job-change-rate',
      },
      {
        question: '副業をしている人の割合が高い都道府県は？',
        rankingKey: 'side-job-rate',
      },
      {
        question: 'テレワーク実施率が高い都道府県は？',
        rankingKey: 'telework-rate',
      },
      {
        question: '育児をしている人の就業率が高い都道府県は？',
        rankingKey: 'childcare-employment-rate',
      },
    ],
    caveats: [
      '毎月の労働力調査が月末1週間の就業状態を捉えるのに対し、本調査は「ふだん」の就業状態を分類します。他調査の就業率と直接比較しないでください。',
      '転職率、離職率、副業率、育児・介護中の就業率は、それぞれ分母と対象期間が異なります。割合の定義をそろえて比較してください。',
      '標本調査のため、都道府県別の小さな差には標本誤差が含まれます。テレワークやフリーランスなど新しい項目は、過去回と同じ定義で長期比較できない場合があります。',
    ],
  },
  'health-admin-report': {
    summary:
      '衛生行政報告例は、都道府県・指定都市・中核市が衛生関係法令に基づく行政の実績を厚生労働省へ報告する統計です。このハブでは、保健医療の従事者、薬局、生活衛生関係施設などの実数と人口当たりの配置を比較できます。',
    whatYouCanLearn: [
      '看護師、保健師、歯科衛生士など衛生関係従事者の地域差',
      '薬局と医薬品販売業の施設数や人口・面積当たりの配置',
      '理美容所、クリーニング所、公衆浴場など生活衛生施設の状況',
      '母体保護や食品衛生行政に関する報告件数',
    ],
    readerQuestions: [
      {
        question: '人口10万人当たりの看護師が多い都道府県は？',
        rankingKey: 'nurses-per-100k-population',
      },
      {
        question: '人口10万人当たりの薬局数が多い都道府県は？',
        rankingKey: 'pharmacy-count-per-100k',
      },
      {
        question: '人口10万人当たりの理美容所が多い都道府県は？',
        rankingKey: 'barber-beauty-salon-count-per-100k',
      },
      {
        question: '人工妊娠中絶実施率が高い都道府県は？',
        rankingKey: 'abortion-rate',
      },
    ],
    caveats: [
      '報告事項には毎年集計するものと隔年で集計するものがあり、項目によって対象期間が異なります。調査年をそろえて比較してください。',
      '行政への届出・報告に基づく施設数や従事者数であり、サービスの質、稼働状況、利用しやすさを直接示すものではありません。',
      '実数、人口10万人当たり、面積当たりでは分母が異なります。資格区分や業務従事場所の定義もランキングごとに確認してください。',
    ],
  },
  'patient-survey': {
    summary:
      '患者調査は、厚生労働省が抽出した病院・診療所を利用した患者について、傷病や受療状況を3年ごとに調べる基幹統計調査です。このハブでは、ある1日の入院・外来の受療率と年齢別の受療率を都道府県別に比較できます。',
    whatYouCanLearn: [
      '人口10万人当たりの入院患者の受療率',
      '人口10万人当たりの外来患者の受療率',
      '年齢階級別に見た医療機関の受療状況',
    ],
    readerQuestions: [
      {
        question: '入院の受療率が高い都道府県は？',
        rankingKey: 'inpatient-rate-per-100k',
      },
      {
        question: '外来の受療率が高い都道府県は？',
        rankingKey: 'outpatient-rate-per-100k',
      },
    ],
    caveats: [
      '抽出した医療施設の特定1日の患者記録から全国・地域の患者数を推計する標本調査です。小さな差には標本誤差が含まれます。',
      '受療率は人口10万人当たりの推計患者数で、住民が一定期間に医療を利用した割合や有病率とは異なります。',
      '3年ごとの調査であり、入院と外来、総数と年齢別では対象・分母が異なります。同じ定義の指標同士で比較してください。',
    ],
  },
  'sole-proprietor-survey': {
    summary:
      '個人企業経済調査は、総務省統計局が個人経営の事業所を抽出し、事業主・従業者、売上、営業利益、事業上の問題などを毎年調べる基幹統計調査です。このハブでは、個人企業の売上高、従業者1人当たり売上高、営業利益を比較できます。',
    whatYouCanLearn: [
      '個人企業1事業所当たりの年間売上高',
      '従業者1人当たりの売上高から見た事業規模',
      '個人企業の営業利益の地域差',
    ],
    readerQuestions: [
      {
        question: '個人企業の営業利益が高い都道府県は？',
        rankingKey: 'sole-proprietor-operating-profit',
      },
      {
        question: '従業者1人当たりの売上高が高い都道府県は？',
        rankingKey: 'sole-proprietor-sales-per-worker',
      },
      {
        question: '個人企業の売上高が大きい都道府県は？',
        rankingKey: 'sole-proprietor-sales',
      },
    ],
    caveats: [
      '全国約4万の個人企業を対象とする標本調査で、会社法人は対象外です。都道府県別の小さな差には標本誤差があります。',
      '売上高と営業利益は事業の指標であり、事業主世帯の所得や手取りとは一致しません。',
      '業種、従業者構成、事業規模が地域で異なるため、順位の差を同じ条件の事業者の収益性の差とみなさないでください。',
    ],
  },
  'national-household-survey': {
    summary:
      '全国家計構造調査は、総務省統計局が家計の収入・支出、資産・負債、所得分布などを5年ごとに調べる基幹統計調査です。このハブでは、世帯収入、貯蓄・負債、金融資産の構成、耐久消費財の保有状況を都道府県別に比較できます。',
    whatYouCanLearn: [
      '世帯の年間収入と世帯主収入の地域差',
      '預貯金、生命保険、有価証券など金融資産の構成',
      '住宅・土地に関する負債を含む世帯負債の状況',
      '所得分布の偏りとスマートフォンなど耐久消費財の保有状況',
    ],
    readerQuestions: [
      {
        question: '1世帯当たりの年間収入が高い都道府県は？',
        rankingKey: 'annual-income-per-household',
      },
      {
        question: '二人以上世帯の現在貯蓄高が多い都道府県は？',
        rankingKey: 'current-savings-balance-multi-person-households',
      },
      {
        question: '世帯の金融負債残高が多い都道府県は？',
        rankingKey: 'financial-debt-balance',
      },
      {
        question: '二人以上世帯の金融資産残高が多い都道府県は？',
        rankingKey: 'financial-assets-balance-multi-person-households',
      },
    ],
    caveats: [
      '標本調査で、単身世帯と二人以上世帯、勤労者世帯など集計対象が指標ごとに異なります。世帯区分をそろえて比較してください。',
      '資産・負債は調査時点の残高、収入は一定期間の額など基準時点が異なります。5年ごとの結果には標本誤差も含まれます。',
      '2019年に全国消費実態調査から全国家計構造調査へ再設計されました。旧調査との長期比較では集計方法や調査項目の変更を確認してください。',
    ],
  },
  'crop-statistics': {
    summary:
      '作物統計調査は、農林水産省が耕地面積や作付面積、作柄、収穫量などを作物ごとに調べる統計です。このハブでは、水稲の作付面積、収穫量、10アール当たり収量を都道府県別に比較できます。',
    whatYouCanLearn: [
      '水稲の作付面積から見た生産基盤の地域差',
      '水稲の収穫量から見た生産規模',
      '10アール当たり収量から見た単位面積当たりの収穫水準',
    ],
    readerQuestions: [
      {
        question: '水稲の作付面積が広い都道府県は？',
        rankingKey: 'rice-cultivated-area',
      },
      {
        question: '水稲の収穫量が多い都道府県は？',
        rankingKey: 'rice-harvest-volume',
      },
      {
        question: '水稲の10アール当たり収量が多い都道府県は？',
        rankingKey: 'rice-yield-per-10a',
      },
    ],
    caveats: [
      '作付面積、収穫量、10アール当たり収量は異なる指標です。収穫量は面積と単収の両方に左右されます。',
      '予想収穫量と確定した収穫量が公表されるため、同じ作物年・公表段階の数値を比較してください。',
      '天候、品種、作付け方法の影響が大きく、調査・推計方法も見直されることがあります。単年順位だけで恒常的な生産性を判断しないでください。',
    ],
  },
  'public-assistance-survey': {
    summary:
      '被保護者調査は、厚生労働省が生活保護を受給している世帯・人員と保護の種類、申請・開始・廃止などを福祉事務所の行政記録から把握する統計です。このハブでは、被保護世帯・人員、各扶助の受給者、施設・職員などを都道府県別に比較できます。',
    whatYouCanLearn: [
      '人口・世帯数当たりの生活保護受給状況',
      '高齢者人口に占める被保護人員の地域差',
      '医療・住宅・教育・介護など扶助種類別の受給状況',
      '生活保護施設の定員・在所者と福祉事務所の申請件数',
    ],
    readerQuestions: [
      {
        question: '人口千人当たりの生活保護受給者が多い都道府県は？',
        rankingKey: 'persons-on-public-assistance-per-1000',
      },
      {
        question: '千世帯当たりの被保護世帯が多い都道府県は？',
        rankingKey: 'households-on-public-assistance-per-1000',
      },
      {
        question: '医療扶助の受給者が多い都道府県は？',
        rankingKey: 'public-assistance-medical-beneficiaries-per-1000',
      },
      {
        question: '高齢者人口に占める被保護人員が多い都道府県は？',
        rankingKey: 'elderly-on-public-assistance-per-1000-65plus',
      },
    ],
    caveats: [
      '月次調査と年次調査では基準時点や集計方法が異なり、公表後に訂正される場合があります。同じ期間の値として混ぜないでください。',
      '一人が医療扶助と住宅扶助など複数の扶助を受けることがあるため、扶助種類別の人数は単純に合計できません。',
      '人口千人当たり、世帯千当たり、被保護人員当たりなど分母が指標ごとに異なります。制度上の区分変更にも注意してください。',
    ],
  },
  'cpi-annual': {
    summary:
      '消費者物価指数は、総務省統計局が世帯の消費生活に関わる商品・サービスの価格変動を、基準時の価格を100とする指数で測る統計です。このハブでは、総合、食料、光熱・水道など費目別の年平均の上昇・下落率を都道府県別に比較できます。',
    whatYouCanLearn: [
      '総合指数の前年比から見た物価変動の地域差',
      '食料、住居、光熱・水道など費目別の上昇率',
      '生鮮食品やエネルギーを除いた基調的な物価変動',
      '交通・通信、教育、教養娯楽などサービスを含む費目の違い',
    ],
    readerQuestions: [
      {
        question: '消費者物価の総合上昇率が高い都道府県は？',
        rankingKey: 'cpi-change-rate-total',
      },
      {
        question: '食料の物価上昇率が高い都道府県は？',
        rankingKey: 'cpi-change-rate-food',
      },
      {
        question: '光熱・水道の物価上昇率が高い都道府県は？',
        rankingKey: 'cpi-change-rate-utilities',
      },
      {
        question: '生鮮食品を除く物価上昇率が高い都道府県は？',
        rankingKey: 'cpi-change-rate-excl-fresh-food',
      },
    ],
    caveats: [
      '前年比は価格がどれだけ変化したかを示す指標で、地域間の価格水準や生活費そのものの高低を示しません。',
      '基準年と品目のウエイトは原則5年ごとに改定され、接続指数が作られます。基準改定をまたぐ指数水準と変化率の扱いを確認してください。',
      '費目ごとに購入する品目とウエイトが異なり、世帯ごとの実感とは一致しない場合があります。総合と除外系列、費目別を区別して読んでください。',
    ],
  },
  'retail-price-survey': {
    summary:
      '小売物価統計調査（構造編）は、総務省統計局が消費生活に重要な商品の小売価格とサービス料金を調べ、地域間の物価水準の違いを毎年明らかにする基幹統計調査です。このハブでは、全国平均を100とする消費者物価地域差指数を総合・費目別に比較できます。',
    whatYouCanLearn: [
      '総合指数から見た都道府県間の物価水準の違い',
      '食料、住居、光熱・水道など費目別の地域差',
      '教育、保健医療、教養娯楽などサービスを含む費目の違い',
      '総合と持家の帰属家賃を除く系列の違い',
    ],
    readerQuestions: [
      {
        question: '消費者物価の総合水準が高い都道府県は？',
        rankingKey: 'consumer-price-difference-index-overall',
      },
      {
        question: '食料の物価水準が高い都道府県は？',
        rankingKey: 'consumer-price-difference-index-food',
      },
      {
        question: '住居の物価水準が高い都道府県は？',
        rankingKey: 'consumer-price-difference-index-housing',
      },
      {
        question: '光熱・水道の物価水準が高い都道府県は？',
        rankingKey: 'consumer-price-difference-index-utilities',
      },
    ],
    caveats: [
      '地域差指数は同じ年の全国平均を100とした価格水準です。前年からの物価上昇率を示す消費者物価指数の変化率とは異なります。',
      '総合指数には持家の帰属家賃を含まない系列があり、除外範囲の異なる指数同士を直接比較しないでください。',
      '指数は各費目の価格とウエイトを集約した値です。個別商品の価格や各世帯の実際の生活費と一致するとは限りません。',
    ],
  },
  'school-health-survey': {
    summary:
      '学校保健統計調査は、文部科学省が抽出した学校に在籍する5歳から17歳の幼児・児童・生徒について、発育と健康の状態を毎年調べる基幹統計調査です。このハブでは、小学5年、中学2年、高校2年の男女別平均身長・体重を都道府県別に比較できます。',
    whatYouCanLearn: [
      '小学5年生の男女別平均身長と平均体重',
      '中学2年生の男女別平均身長と平均体重',
      '高校2年生の男女別平均身長と平均体重',
      '同じ学年・性別で見た発育状態の地域差',
    ],
    readerQuestions: [
      {
        question: '小学5年男子の平均身長が高い都道府県は？',
        rankingKey: 'average-height-primary-school-fifth-grade-male',
      },
      {
        question: '小学5年女子の平均体重が重い都道府県は？',
        rankingKey: 'average-weight-primary-school-fifth-grade-female',
      },
      {
        question: '中学2年男子の平均身長が高い都道府県は？',
        rankingKey: 'average-height-middle-school-second-grade-male',
      },
      {
        question: '高校2年女子の平均体重が重い都道府県は？',
        rankingKey: 'average-weight-high-school-second-grade-female',
      },
    ],
    caveats: [
      '指定された学校と児童生徒を抽出する標本調査です。都道府県別の小さな平均値の差には標本誤差が含まれます。',
      '発育状態は学校の健康診断に基づき、原則として4月1日から6月30日の間に把握されます。学年、性別、調査年をそろえて比較してください。',
      '平均身長・体重は集団の平均で、個人の成長や健康状態、体格の分布を示すものではありません。',
    ],
  },
  'welfare-admin-report': {
    summary:
      '福祉行政報告例は、厚生労働省が社会福祉関係法令の施行に伴う都道府県・指定都市・中核市の行政実績を毎年度取りまとめる業務統計です。このハブでは、児童相談、障害者更生相談、身体障害者手帳、民生委員の活動を比較できます。',
    whatYouCanLearn: [
      '児童相談所が受け付けた相談件数と人口当たりの水準',
      '身体・知的障害者更生相談所の相談・判定件数',
      '身体障害者手帳の交付件数',
      '民生委員数と委員1人当たりの相談・支援件数',
    ],
    readerQuestions: [
      {
        question: '児童相談所の受付件数が多い都道府県は？',
        rankingKey: 'child-consultation-center-cases',
      },
      {
        question: '人口当たりの知的障害者更生相談所受付件数が多い都道府県は？',
        rankingKey:
          'intellectual-disability-rehabilitation-center-cases-per-100k',
      },
      {
        question: '人口当たりの身体障害者手帳交付件数が多い都道府県は？',
        rankingKey: 'physical-disability-certificates-issued-per-1000',
      },
      {
        question: '人口10万人当たりの民生委員数が多い都道府県は？',
        rankingKey: 'welfare-commissioner-count-per-100k',
      },
    ],
    caveats: [
      '行政機関が受け付け・処理した業務件数であり、地域に存在する福祉ニーズや障害の発生率そのものではありません。',
      '実数、人口当たり、担当者1人当たりでは分母が異なります。同じ相談が複数の区分に関係する場合もあります。',
      '制度改正や報告様式の変更、自治体からの訂正により公表値が更新されることがあります。年度と用語の定義を確認してください。',
    ],
  },
  'establishment-enterprise-census': {
    summary:
      '事業所・企業統計調査は、総務省統計局が国内の事業所・企業を対象に、産業、従業者規模、経営組織などの基本構造を把握していた全数調査です。1981年以降は5年ごとの大規模調査と中間年の民営事業所向け簡易調査が行われ、このハブでは最終の2006年調査までの歴史的な地域差を比較できます。',
    whatYouCanLearn: [
      '事業所総数と人口当たりの小売店・飲食店数',
      '百貨店、大型小売店、食料品小売店など業態別の地域差',
      '第2次・第3次産業の事業所構成比',
      '産業別の1事業所当たり従業者数',
    ],
    readerQuestions: [
      {
        question: '事業所数が多かった都道府県は？',
        rankingKey:
          'number-of-establishments-establishment-corporate-statistics',
      },
      {
        question: '人口当たりの飲食店数が多かった都道府県は？',
        rankingKey: 'restaurant-count-per-1000',
      },
      {
        question: '人口当たりの小売店数が多かった都道府県は？',
        rankingKey: 'retail-store-count-per-1000',
      },
      {
        question: '第3次産業の事業所割合が高かった都道府県は？',
        rankingKey: 'tertiary-industry-establishment-ratio-census',
      },
    ],
    caveats: [
      'この調査は2006年を最後に廃止され、2009年以降は経済センサスへ移行しました。現在の事業所構造を示すランキングではありません。',
      '事業所は原則として経済活動を行う場所ごとに数えます。一つの企業が複数の店舗・支所を持つ場合、企業数とは一致しません。',
      '個人経営の農林漁家など一部は対象外で、産業分類や調査範囲も調査年により変わります。経済センサスの値へそのまま接続しないでください。',
    ],
  },
  'agriculture-forestry-census': {
    summary:
      '農林業センサスは、農林水産省が農林業経営体と農山村地域を5年ごとに調べ、農林業の生産・就業構造と地域資源の実態を明らかにする基幹統計調査です。このハブでは、農家・就業人口・耕地と耕作放棄地・森林面積などを都道府県別に比較できます。',
    whatYouCanLearn: [
      '農家数と農業就業人口の地域差',
      '1戸当たりの経営耕地面積と耕作放棄地の状況',
      '農業就業者1人当たりの農業産出額',
      '森林・林野面積と都道府県面積に占める割合',
    ],
    readerQuestions: [
      {
        question: '農家数が多い都道府県は？',
        rankingKey: 'agricultural-farm-count',
      },
      {
        question: '農業就業人口が多い都道府県は？',
        rankingKey: 'agricultural-employment-population',
      },
      {
        question: '耕作放棄地面積が広い都道府県は？',
        rankingKey: 'abandoned-cultivated-land-area',
      },
      {
        question: '森林面積割合が高い都道府県は？',
        rankingKey: 'forest-area-ratio',
      },
    ],
    caveats: [
      '農林業経営体は一定規模以上の生産・作業を行う者など調査上の定義で把握されます。日常語の「農家」と完全には一致しません。',
      '5年ごとの特定時点を捉える調査で、経営体、販売農家、農業就業人口、耕作放棄地などの定義は調査回により見直されます。',
      '全数調査でも未回答や誤回答などの非標本誤差があります。面積の実数と都道府県面積に占める割合を区別してください。',
    ],
  },
  'road-statistics': {
    summary:
      '道路統計調査は、国土交通省が道路管理者から道路法上の高速自動車国道、一般国道、都道府県道、市町村道などの現況を毎年度把握する業務統計です。このハブでは、道路種別の延長、舗装率、面積当たり道路延長などを都道府県別に比較できます。',
    whatYouCanLearn: [
      '高速道路、一般国道、都道府県道、市町村道の延長',
      '主要道路と市町村道の舗装状況',
      '都道府県面積当たりの道路密度',
      '立体横断施設や道路延長当たりの交通事故件数',
    ],
    readerQuestions: [
      {
        question: '道路の実延長が長い都道府県は？',
        rankingKey: 'road-total-length-with-expressway',
      },
      {
        question: '市町村道の舗装率が高い都道府県は？',
        rankingKey: 'municipal-road-paving-rate',
      },
      {
        question: '高速道路の延長が長い都道府県は？',
        rankingKey: 'road-expressway-length',
      },
      {
        question: '面積当たりの道路延長が長い都道府県は？',
        rankingKey: 'road-length-per-km2',
      },
    ],
    caveats: [
      '総延長と実延長は異なります。実延長は重用区間、未供用区間、渡船区間などを除くため、同じ定義の延長を比較してください。',
      '道路種別ごとに管理者と対象範囲が異なり、自転車専用道や歩道などを含まない指標があります。',
      '延長の実数は都道府県の面積に大きく左右されます。舗装率や面積当たり延長も併用し、基準日と訂正情報を確認してください。',
    ],
  },
  'administrative-investment-report': {
    summary:
      '行政投資実績は、総務省が国、地方公共団体、公的機関などによる社会資本整備等への投資を毎年度取りまとめる業務統計です。このハブでは、行政投資総額と一般事業・公営企業の区分、道路、教育、福祉など目的別の投資額を比較できます。',
    whatYouCanLearn: [
      '国・地方公共団体などを合わせた行政投資総額',
      '一般事業投資と公営企業投資の構成',
      '道路、都市計画、治山治水など基盤整備への投資',
      '教育、福祉、環境衛生、農林水産業など目的別の投資',
    ],
    readerQuestions: [
      {
        question: '行政投資総額が大きい都道府県は？',
        rankingKey: 'total-administrative-investment',
      },
      {
        question: '道路への一般事業投資が大きい都道府県は？',
        rankingKey: 'general-project-investment-road',
      },
      {
        question: '教育施設への一般事業投資が大きい都道府県は？',
        rankingKey: 'general-project-investment-educational-facilities',
      },
      {
        question: '農林水産業への一般事業投資が大きい都道府県は？',
        rankingKey: 'general-project-investment-agriculture-forestry-fisheries',
      },
    ],
    caveats: [
      '国や公的機関の事業も含む地域別投資額で、都道府県庁自身の歳出額や普通建設事業費と同じではありません。',
      '行政投資には用地費、補償費、維持補修費、民間への資本的補助金などが含まれ、国民経済計算の公的固定資本形成とは範囲が異なります。',
      '金額は名目額で人口・面積・物価の影響を受けます。総額、事業区分、目的別内訳を区別し、分類変更をまたぐ長期比較に注意してください。',
    ],
  },
  'fishery-aquaculture-production': {
    summary:
      '漁業・養殖業生産統計は、農林水産省が海面・内水面の漁業と養殖業について、魚種別の漁獲量・収獲量や産出額を毎年取りまとめる統計です。このハブでは、漁獲・養殖の総量、海面・内水面の内訳、主要魚種の漁獲量と産出額を比較できます。',
    whatYouCanLearn: [
      '海面・内水面漁業の漁獲量と養殖業の収獲量',
      '海面養殖と内水面養殖の生産規模',
      'さば、いわし、かつお、まぐろなど魚種別の漁獲量',
      '漁業・養殖業の産出額と海面漁業・養殖業の内訳',
    ],
    readerQuestions: [
      {
        question: '漁獲量が多い都道府県は？',
        rankingKey: 'fish-catch',
      },
      {
        question: '養殖業の収獲量が多い都道府県は？',
        rankingKey: 'aquaculture-harvest',
      },
      {
        question: '漁業産出額が大きい都道府県は？',
        rankingKey: 'fishery-output-value',
      },
      {
        question: 'さば類の漁獲量が多い都道府県は？',
        rankingKey: 'fishery-species-catch-mackerel',
      },
    ],
    caveats: [
      '漁獲量は天然の水産動植物を採捕した量、養殖の収獲量は養殖業で収獲した量です。両者と産出額を混同しないでください。',
      '海面漁業は原則として漁業経営体の所在地に属する統計で、漁獲した海域や水揚港の所在地と一致しない場合があります。',
      '表示単位未満の丸め、秘密保護のための非公表、概数の第1報と確報があります。内水面は対象河川・湖沼の範囲変更にも注意してください。',
    ],
  },
  'labor-market-annual': {
    summary:
      '労働市場年報に相当する雇用関係指標は、厚生労働省が公共職業安定所の求人・求職・職業紹介業務を年度単位で集計する職業安定業務統計です。このハブでは、有効求人倍率、就職率、充足率、中高年・障害者の職業紹介状況を比較できます。',
    whatYouCanLearn: [
      '求職者1人当たりの有効求人数を示す有効求人倍率',
      '職業紹介を通じた就職率と求人の充足率',
      '45歳以上の中高年求職者の求人・就職状況',
      '障害者の求職・就職状況と県外就職者の動き',
    ],
    readerQuestions: [
      {
        question: '有効求人倍率が高い都道府県は？',
        rankingKey: 'active-job-opening-ratio',
      },
      {
        question: '求人の充足率が高い都道府県は？',
        rankingKey: 'fulfillment-rate',
      },
      {
        question: '公共職業安定所を通じた就職率が高い都道府県は？',
        rankingKey: 'employment-rate',
      },
      {
        question: '45歳以上の就職率が高い都道府県は？',
        rankingKey: 'middle-aged-employment-rate-45plus',
      },
    ],
    caveats: [
      '公共職業安定所で受理した求人・求職に基づく業務統計で、民間求人サービスや縁故採用を含む労働市場全体ではありません。',
      '有効求人倍率は月間有効求人・求職者の年度計を用いる場合があり、同じ求人・求職者が複数月に計上されます。',
      '一般、パート、新規学卒者、障害者など指標ごとに対象範囲が異なります。受理地別と就業地別の系列も区別してください。',
    ],
  },
  'weather-statistics': {
    summary:
      '気象統計は、気象庁が気象台・測候所・地域気象観測所で継続観測した気温、降水、日照、湿度、雪などを集計したものです。このハブでは、主に都道府県庁所在地の代表観測地点における年平均・年間値を都道府県名で比較できます。',
    whatYouCanLearn: [
      '年平均気温と年間の最高・最低気温指標',
      '年間降水量と降水日数の地域差',
      '年間日照時間と快晴日数',
      '年平均相対湿度と雪日数',
    ],
    readerQuestions: [
      {
        question: '年平均気温が高い観測地点は？',
        rankingKey: 'average-temperature',
      },
      {
        question: '年間降水量が多い観測地点は？',
        rankingKey: 'annual-precipitation',
      },
      {
        question: '年間日照時間が長い観測地点は？',
        rankingKey: 'annual-sunshine-duration',
      },
      {
        question: '年間の雪日数が多い観測地点は？',
        rankingKey: 'annual-snow-days',
      },
    ],
    caveats: [
      '都道府県全域の平均ではなく、原則として都道府県庁所在地の観測値です。埼玉県は熊谷市、東京都は千代田区、滋賀県は彦根市など例外があります。',
      '観測所の移転、測器・観測方法の変更により系列が均質でない場合があります。快晴日数など目視観測から自動化された項目は前後を単純比較できません。',
      '単年値はその年の天候を表し、地域の平常的な気候とは異なります。平年値は30年間の観測値から算出し10年ごとに更新されます。',
    ],
  },
  'housing-starts-statistics': {
    summary:
      '住宅着工統計は、国土交通省が建築工事届に基づき、新たに着工する住宅の戸数、床面積、利用関係などを毎月集計する建築着工統計調査の一部です。このハブでは、新設住宅の総数と床面積、持ち家・貸家・分譲住宅の構成を都道府県別に比較できます。',
    whatYouCanLearn: [
      '新設住宅の着工戸数と着工床面積',
      '持ち家と貸家の着工戸数・床面積',
      '持ち家・貸家が新設住宅に占める割合',
      '分譲マンションの新設着工戸数',
    ],
    readerQuestions: [
      {
        question: '新設住宅の着工戸数が多い都道府県は？',
        rankingKey: 'new-housing-starts',
      },
      {
        question: '持ち家の着工戸数が多い都道府県は？',
        rankingKey: 'new-owner-occupied-starts',
      },
      {
        question: '貸家の着工戸数が多い都道府県は？',
        rankingKey: 'new-rental-starts',
      },
      {
        question: '分譲マンションの着工戸数が多い都道府県は？',
        rankingKey: 'new-condo-starts',
      },
    ],
    caveats: [
      '着工戸数は工事を開始する住宅のフローで、完成戸数、販売戸数、既存住宅ストックとは異なります。',
      '建築主が提出した建築工事届に基づくため、届出後の計画変更や工事中止、完成時の床面積は反映しない場合があります。',
      '持ち家、貸家、給与住宅、分譲住宅は利用関係の区分です。戸数、床面積、構成比を区別し、年計と年度計を混ぜないでください。',
    ],
  },
  'job-placement-statistics': {
    summary:
      '一般職業紹介状況は、厚生労働省が全国の公共職業安定所における求人・求職・職業紹介の実績を毎月集計する職業安定業務統計です。このハブでは、有効求人倍率、就職率、求人充足率、パートや中高年の紹介状況などを都道府県別に比較できます。',
    whatYouCanLearn: [
      '有効求職者1人当たりの有効求人数',
      '求職者の就職率と求人の充足率',
      '常用雇用に占めるパートタイム就職の割合',
      '45歳以上や障害者の求人・求職状況',
    ],
    readerQuestions: [
      {
        question: '有効求人倍率が高い都道府県は？',
        rankingKey: 'active-job-opening-ratio',
      },
      {
        question: '公共職業安定所を通じた就職率が高い都道府県は？',
        rankingKey: 'employment-rate',
      },
      {
        question: '求人の充足率が高い都道府県は？',
        rankingKey: 'fulfillment-rate',
      },
      {
        question: '45歳以上の求職者に対する求人倍率が高い都道府県は？',
        rankingKey: 'middle-aged-job-ratio-45plus',
      },
    ],
    caveats: [
      'ハローワークで扱った求人・求職だけを集計する業務統計で、民間求人サービスや縁故採用などは含みません。',
      '有効求人・求職者は月をまたいで有効な場合があり、年度計では同じ求人や人が複数月に計上されます。',
      '一般、パート、新規学卒者、障害者などで対象範囲が異なります。季節調整値と原数値、受理地別と就業地別も区別してください。',
    ],
  },
  'city-planning-survey': {
    summary:
      '都市計画現況調査は、国土交通省が都道府県の都市計画担当課を通じ、都市計画法に基づく区域・地域地区・施設などの決定状況を毎年3月31日現在で把握する調査です。このハブでは、都市計画区域の面積と用途地域・市街化調整区域の構成を比較できます。',
    whatYouCanLearn: [
      '都市計画区域の指定面積',
      '住居系用途地域が占める面積割合',
      '商業系・工業系用途地域の構成',
      '都市計画区域に占める市街化調整区域の割合',
    ],
    readerQuestions: [
      {
        question: '都市計画区域の面積が広い都道府県は？',
        rankingKey: 'urban-planning-area',
      },
      {
        question: '住居専用地域の面積割合が高い都道府県は？',
        rankingKey: 'residential-area-ratio',
      },
      {
        question: '商業・近隣商業地域の面積割合が高い都道府県は？',
        rankingKey: 'commercial-and-neighborhood-commercial-area-ratio',
      },
      {
        question: '市街化調整区域の面積割合が高い都道府県は？',
        rankingKey: 'urbanization-control-area-ratio',
      },
    ],
    caveats: [
      '用途地域は法令上の土地利用規制で、実際に建っている住宅・店舗・工場の面積や土地利用を直接示すものではありません。',
      '割合の分母は都道府県総面積ではなく、都市計画区域や用途地域など指標ごとに異なります。',
      '区域の指定・変更や市町村合併により値が変わります。面積の総数と構成比を区別し、同じ基準日の結果を比較してください。',
    ],
  },
  'waste-management-survey': {
    summary:
      '一般廃棄物処理事業実態調査は、環境省が全国の市区町村と一部事務組合を対象に、ごみ・し尿の排出処理、処理施設、経費などを毎年度把握する調査です。このハブでは、ごみ総排出量、最終処分量、埋立・リサイクル率、最終処分場の残余容量などを比較できます。',
    whatYouCanLearn: [
      '市町村が扱うごみの総排出量と最終処分量',
      'ごみの埋立率とリサイクル率',
      '最終処分場に残っている埋立可能容量',
      'ごみ収集人口とし尿処理人口の状況',
    ],
    readerQuestions: [
      {
        question: 'ごみ総排出量が多い都道府県は？',
        rankingKey: 'garbage-total-output',
      },
      {
        question: 'ごみのリサイクル率が高い都道府県は？',
        rankingKey: 'waste-recycling-rate',
      },
      {
        question: 'ごみ埋立率が高い都道府県は？',
        rankingKey: 'garbage-landfill-rate',
      },
      {
        question: '最終処分場の残余容量が大きい都道府県は？',
        rankingKey: 'final-disposal-site-remaining-capacity',
      },
    ],
    caveats: [
      '対象は市町村が処理責任を持つ一般廃棄物で、産業廃棄物の排出・処理量は含みません。',
      'リサイクル率は直接資源化、中間処理後の資源化、集団回収など定義された量から算出され、家庭での再使用を全て捉えるものではありません。',
      '残余容量は年度末時点の容積で、今後使える年数とは異なります。域外処理や広域組合の分担により、排出地域と処分施設の所在地が一致しない場合があります。',
    ],
  },
  'foreign-residents-statistics': {
    summary:
      '在留外国人統計は、出入国在留管理庁が在留カードなどで把握した中長期在留者と特別永住者を、原則として6月末・12月末時点で集計する業務統計です。このハブでは、在留外国人の総数と国籍・地域を大きな地域区分別に比較できます。',
    whatYouCanLearn: [
      '都道府県別の在留外国人数',
      '中国・韓国を国籍・地域とする在留者数',
      'アジア、欧州、北米、南米の地域別構成',
      '住居地情報に基づく在留外国人の地域分布',
    ],
    readerQuestions: [
      {
        question: '在留外国人数が多い都道府県は？',
        rankingKey: 'resident-foreigner-population',
      },
      {
        question: '中国を国籍・地域とする在留者が多い都道府県は？',
        rankingKey: 'resident-foreigner-china',
      },
      {
        question: 'アジアを国籍・地域とする在留者が多い都道府県は？',
        rankingKey: 'resident-foreigner-asia',
      },
      {
        question: '南米を国籍・地域とする在留者が多い都道府県は？',
        rankingKey: 'resident-foreigner-south-america',
      },
    ],
    caveats: [
      '在留外国人数は中長期在留者と特別永住者の合計で、観光などの短期滞在者や在留管理上把握されない人を含みません。',
      '都道府県は在留管理上の住居地に基づき、実際の就労地・通学地とは一致しない場合があります。国籍・地域は民族や出生地を示す区分ではありません。',
      '2012年7月の新しい在留管理制度への移行前は登録外国人統計です。制度変更をまたぐ系列や6月末と12月末の時点を直接混ぜないでください。',
    ],
  },
  'local-gov-staffing-survey': {
    summary:
      '地方公共団体定員管理調査は、総務省が地方公共団体の職員数と部門別配置などを毎年4月1日現在で把握し、適正な定員管理の基礎資料とする調査です。このハブでは、都道府県・市町村の一般行政、教育、警察、消防、公営企業などの職員数を比較できます。',
    whatYouCanLearn: [
      '都道府県と市町村の一般行政部門の職員数',
      '教育部門と警察部門の職員配置',
      '消防部門と公営企業会計部門の職員数',
      '人口当たりで見た警察官の配置',
    ],
    readerQuestions: [
      {
        question: '都道府県の一般行政部門職員が多い地域は？',
        rankingKey: 'prefectural-general-administration-staff',
      },
      {
        question: '市町村の一般行政部門職員が多い都道府県は？',
        rankingKey: 'municipal-general-administration-staff',
      },
      {
        question: '教育部門の職員数が多い都道府県は？',
        rankingKey: 'education-department-staff',
      },
      {
        question: '人口当たりの警察官数が多い都道府県は？',
        rankingKey: 'police-officer-count-per-population',
      },
    ],
    caveats: [
      '職員数は4月1日時点の定員・在職状況を調査上の区分で集計したもので、年間の労働時間や業務量、行政サービスの質を示しません。',
      '都道府県と市町村では担う事務が異なり、消防の広域組合化など組織形態にも地域差があります。実数を単純に効率性の差とみなさないでください。',
      '任期付、短時間勤務、会計年度任用職員などの扱いや部門分類は制度改正で変わる場合があります。同じ職員区分・年度を比較してください。',
    ],
  },
  'insurance-rate-org-statistics': {
    summary:
      '損害保険料率算出機構統計集は、同機構が参考純率・基準料率を算出する保険について、会員保険会社から収集した契約・支払データを年度ごとに集計した資料です。このハブでは、自動車保険の普及率、自賠責保険の支払額、火災保険の契約当たり保険金額を比較できます。',
    whatYouCanLearn: [
      '任意自動車保険の対人・対物・車両補償の普及率',
      '自賠責保険の1支払当たり受取保険金額',
      '火災保険の1契約当たり保険金額',
      '保険契約と支払いの都道府県差',
    ],
    readerQuestions: [
      {
        question: '自賠責保険の1支払当たり保険金額が高い都道府県は？',
        rankingKey: 'auto-liability-insurance-amount-received-per-payment',
      },
      {
        question: '火災保険の1契約当たり保険金額が高い都道府県は？',
        rankingKey: 'fire-insurance-amount-received-per-contract',
      },
      {
        question: '任意自動車保険の対人賠償普及率が高い都道府県は？',
        rankingKey: 'private-auto-insurance-penetration-rate-person',
      },
      {
        question: '任意自動車保険の車両補償普及率が高い都道府県は？',
        rankingKey: 'private-auto-insurance-penetration-rate-vehicle',
      },
    ],
    caveats: [
      '会員保険会社から報告された統計で、共済を含むかどうかなど対象契約の範囲は表ごとに異なります。各年度版の凡例を確認してください。',
      '普及率は契約台数などを登録車両数等で割った指標で、人や世帯の加入割合とは限りません。対人・対物・車両補償は重複して契約されます。',
      '1支払当たり・1契約当たりの金額は契約条件や事故構成に左右され、保険料、平均損害額、地域の事故率を直接示すものではありません。',
    ],
  },
  'prefectural-land-price-survey': {
    summary:
      '都道府県地価調査は、都道府県知事が選定した基準地について、不動産鑑定士の鑑定評価を基に毎年7月1日時点の1平方メートル当たり標準価格を判定する公的土地評価です。このハブでは、住宅地・商業地・工業地の平均変動率と工業地の標準価格を比較できます。',
    whatYouCanLearn: [
      '住宅地、商業地、工業地の対前年平均変動率',
      '全用途の基準地価格の変化',
      '工業地の1平方メートル当たり標準価格',
      '用途別に異なる地価動向の地域差',
    ],
    readerQuestions: [
      {
        question: '工業地の標準価格が高い都道府県は？',
        rankingKey: 'industrial-land-price',
      },
      {
        question: '住宅地の地価上昇率が高い都道府県は？',
        rankingKey: 'standard-price-change-rate-residential',
      },
      {
        question: '商業地の地価上昇率が高い都道府県は？',
        rankingKey: 'standard-price-change-rate-commercial',
      },
      {
        question: '工業地の地価上昇率が高い都道府県は？',
        rankingKey: 'standard-price-change-rate-industrial',
      },
    ],
    caveats: [
      '基準地として選定された標準的な地点の鑑定価格で、全ての土地の平均価格や実際の取引価格ではありません。',
      '標準価格の水準と対前年変動率は別の指標です。用途の異なる土地や地価公示の1月1日時点の価格と混同しないでください。',
      '平均変動率は継続して調査した基準地の構成や地点の選定替えに影響されます。都道府県内の地域差も平均値だけでは分かりません。',
    ],
  },
  'waterworks-statistics': {
    summary:
      '水道統計は、日本水道協会が水道事業体等から毎年度末現在の基本計画、普及、給水、施設能力、財務などを取りまとめる統計資料です。このハブでは、給水人口と普及率、給水能力、年間給水量を都道府県別に比較できます。',
    whatYouCanLearn: [
      '上水道・簡易水道・専用水道による給水人口',
      '行政区域内人口に占める給水人口の割合',
      '水道施設の給水能力',
      '1年間に供給した水量の地域差',
    ],
    readerQuestions: [
      {
        question: '上水道給水人口比率が高い都道府県は？',
        rankingKey: 'water-supply-population-ratio-2012on',
      },
      {
        question: '水道の給水人口が多い都道府県は？',
        rankingKey: 'water-supply-population',
      },
      {
        question: '水道の給水能力が大きい都道府県は？',
        rankingKey: 'water-supply-capacity',
      },
      {
        question: '年間給水量が多い都道府県は？',
        rankingKey: 'water-supply-annual-volume',
      },
    ],
    caveats: [
      '給水人口比率は上水道、簡易水道、専用水道の給水人口を行政区域内人口で割る指標です。事業体数や管路の整備率とは異なります。',
      '2012年以降は外国人住民を含む住民基本台帳人口を分母に使うなど制度変更があり、2011年以前の系列と分けて掲載しています。',
      '給水能力は施設が供給できる量、年間給水量は実際の供給実績です。年度末時点の人口・能力と年度間の水量を同じ時点の値として扱わないでください。',
    ],
  },
  'agriculture-management-survey': {
    summary:
      '農業経営統計調査は、農業経営体の収支、所得、労働、資産などを調べ、営農類型別に経営の実態を明らかにする調査です。このハブでは、社会・人口統計体系に収録された農家総所得、家計費、農業所得・農外所得の割合を都道府県別に比較できます。',
    whatYouCanLearn: [
      '農家総所得と月当たり家計費の地域差',
      '総所得に占める農業所得と農外所得の割合',
      '可処分所得に対する家計費の割合としての平均消費性向',
    ],
    readerQuestions: [
      {
        question: '農家総所得が高かった都道府県は？',
        rankingKey: 'total-farm-household-income',
      },
      {
        question: '総所得に占める農業所得の割合が高かった都道府県は？',
        rankingKey: 'agricultural-income-ratio',
      },
      {
        question: '農家世帯の平均消費性向が高かった都道府県は？',
        rankingKey: 'average-propensity-to-consume-of-farm-households',
      },
    ],
    caveats: [
      'このハブの指標は主に2003年までの旧系列です。現在の農業経営や所得水準を表す最新値として扱わないでください。',
      '農業所得割合、農外所得割合、平均消費性向は分母が異なります。割合を足し合わせたり、金額の大小と同じ意味で比較したりしないでください。',
      '物価、世帯員数、営農類型や経営規模の構成が都道府県で異なるため、平均値の差が同じ条件の農家の収益差を直接示すものではありません。',
    ],
  },
  'urban-park-survey': {
    summary:
      '都市公園等整備現況調査は、国土交通省が都道府県・市区町村の協力を得て、都市公園等の箇所数や面積を毎年度末時点で取りまとめる調査です。街区公園、近隣公園、運動公園などの種類別整備状況と、住民1人当たりの公園面積を比較できます。',
    whatYouCanLearn: [
      '都市公園の箇所数と総面積の地域差',
      '街区公園、近隣公園、運動公園の種類別整備状況',
      '住民1人当たり、面積100平方キロメートル当たりで標準化した公園の充実度',
    ],
    readerQuestions: [
      {
        question: '住民1人当たりの都市公園面積が広い都道府県は？',
        rankingKey: 'urban-park-area-per-person',
      },
      {
        question: '都市公園の箇所数が多い都道府県は？',
        rankingKey: 'urban-parks',
      },
      {
        question: '面積当たりの街区公園数が多い都道府県は？',
        rankingKey: 'block-park-count-per-100km2',
      },
    ],
    caveats: [
      '箇所数、総面積、1人当たり面積、面積当たり箇所数はそれぞれ分母が異なります。同じ整備状況を示す指標ではありません。',
      '都市公園の種類は都市公園法上の区分に基づきます。小規模な広場や民間緑地など、統計対象外のオープンスペースは含まれない場合があります。',
      '都道府県全域の広さ、都市計画区域、人口密度の違いが値に影響します。施設の質、設備、利用者数までは示しません。',
    ],
  },
  'sewerage-statistics': {
    summary:
      '下水道統計は、地方公共団体等の下水道事業について、処理区域、人口、施設、維持管理などを年度ごとに取りまとめる統計です。このハブでは、下水道排水区域人口、水洗化人口、下水道普及率と水洗化人口比率を都道府県別に比較できます。',
    whatYouCanLearn: [
      '下水道を利用できる区域の人口と普及率',
      '下水道に接続してトイレを水洗化している人口',
      '整備区域の広がりと実際の接続状況の違い',
    ],
    readerQuestions: [
      {
        question: '下水道普及率が高い都道府県は？',
        rankingKey: 'sewerage-penetration-rate-2012on',
      },
      {
        question: '下水道排水区域人口が多い都道府県は？',
        rankingKey: 'sewerage-drainage-population',
      },
      {
        question: '水洗化人口比率が高い都道府県は？',
        rankingKey: 'flush-toilet-population-ratio',
      },
    ],
    caveats: [
      '下水道普及率は処理区域人口、水洗化人口比率は実際の接続人口に関係する指標で、同じ意味ではありません。',
      '2012年以降は人口の把握方法などが変わったため、2011年以前と以後の下水道普及率を別系列として掲載しています。系列をまたいだ増減比較には注意してください。',
      '公共下水道以外の農業集落排水、合併処理浄化槽などを含む汚水処理人口普及率とは対象範囲が異なります。',
    ],
  },
  'local-education-expense-survey': {
    summary:
      '地方教育費調査は、文部科学省が都道府県・市町村の教育委員会などを対象に、地方公共団体が学校教育、社会教育、教育行政へ支出した経費を毎年調べる全数調査です。このハブでは、公立学校種別の在学者1人当たり教育費を比較できます。',
    whatYouCanLearn: [
      '小学校・中学校の在学者1人当たり教育費',
      '全日制高等学校の在学者1人当たり教育費',
      '幼稚園と幼保連携型認定こども園の教育費の地域差',
    ],
    readerQuestions: [
      {
        question: '小学生1人当たりの教育費が高い都道府県は？',
        rankingKey: 'elementary-school-education-cost-per-student',
      },
      {
        question: '中学生1人当たりの教育費が高い都道府県は？',
        rankingKey: 'junior-high-school-education-cost-per-student',
      },
      {
        question: '全日制高校生1人当たりの教育費が高い都道府県は？',
        rankingKey: 'high-school-education-cost-fulltime-per-student',
      },
    ],
    caveats: [
      '地方公共団体が公立学校等のために支出した決算額を対象とし、家庭が負担する教育費や私立学校の学費とは異なります。',
      '在学者1人当たりの金額は、学校規模、教職員配置、施設整備などに影響されます。金額の高さだけで教育の質や学力を判断できません。',
      '学校種、課程、会計年度が異なる指標同士を直接比較しないでください。施設整備が集中した年度は値が大きく動く場合があります。',
    ],
  },
  'fire-annual-report': {
    summary:
      '火災年報は、消防機関から報告された火災について、出火件数、死傷者、り災世帯、焼損面積、損害額などを消防庁が年次で集計する統計です。このハブでは、建物火災を中心に実数と人口・火災件数で標準化した指標を比較できます。',
    whatYouCanLearn: [
      '建物火災の出火件数と人口当たりの発生状況',
      '火災による死者・負傷者やり災世帯の地域差',
      '建物火災1件当たり、住民1人当たりの損害額',
    ],
    readerQuestions: [
      {
        question: '人口当たりの火災出火件数が多い都道府県は？',
        rankingKey: 'building-fire-count-per-100-thousand-people',
      },
      {
        question: '建物火災1件当たりの損害額が大きい都道府県は？',
        rankingKey: 'building-fire-damage-amount-per-building-fire',
      },
      {
        question: '人口10万人当たりの火災死亡者数が多い都道府県は？',
        rankingKey: 'fire-deaths-per-100k',
      },
    ],
    caveats: [
      '建物火災と全火災では対象が異なります。指標名にある火災種別と、人口当たり・1件当たりなどの分母を確認してください。',
      '損害額は焼損した建物・収容物等の評価や大規模火災の有無に左右され、出火件数や消防力の単純な評価には使えません。',
      '人口の少ない地域では、少数の火災や死傷者でも人口当たりの値が大きく変動します。単年順位だけでなく複数年の傾向も確認してください。',
    ],
  },
  'construction-work-statistics': {
    summary:
      '建設工事施工統計調査は、国土交通省が建設業者を対象に、1年間に施工した建設工事の完成工事高、受注高、就業者などを毎年調べる基幹統計調査です。このハブでは、建設業者数と元請・下請別の完成工事高を都道府県別に比較できます。',
    whatYouCanLearn: [
      '建設業者数の地域差',
      '元請として完成した工事の総額と公共工事の規模',
      '下請として完成した工事の総額と地域の建設活動',
    ],
    readerQuestions: [
      {
        question: '建設業者数が多い都道府県は？',
        rankingKey: 'construction-industry-count',
      },
      {
        question: '元請完成工事高が大きい都道府県は？',
        rankingKey: 'prime-contractor-completed-construction',
      },
      {
        question: '公共の元請完成工事高が大きい都道府県は？',
        rankingKey: 'prime-contractor-completed-construction-public',
      },
    ],
    caveats: [
      '完成工事高は決算期内に完成・引渡しした工事等の請負高で、受注高、建設投資額、事業者の利益とは異なります。',
      '元請と下請は契約上の立場による区分です。両方を単純に合算すると同じ工事を重複して捉える可能性があります。',
      '金額は業者の所在地、工事の施工地、調査上の集計区分を確認して解釈する必要があります。大規模工事の有無で単年値が変動します。',
    ],
  },
  'passenger-regional-flow-survey': {
    summary:
      '旅客地域流動調査は、鉄道、乗合バス、旅客船、航空などの輸送統計を組み合わせ、都道府県間の旅客流動を交通機関別に整理する加工統計です。このハブでは、JR、民鉄、旅客船、航空の輸送人員を都道府県別に比較できます。',
    whatYouCanLearn: [
      'JRと民鉄による旅客輸送人員の地域差',
      '航空と旅客船が地域間移動で担う規模',
      '交通機関別に異なる都道府県の旅客流動構造',
    ],
    readerQuestions: [
      {
        question: 'JRの旅客輸送人員が多い都道府県は？',
        rankingKey: 'jr-passenger-transport',
      },
      {
        question: '航空の旅客輸送人員が多い都道府県は？',
        rankingKey: 'air-passenger-transport',
      },
      {
        question: '旅客船の輸送人員が多い都道府県は？',
        rankingKey: 'passenger-ship-transport',
      },
    ],
    caveats: [
      '交通機関ごとに原統計、対象事業者、集計方法が異なります。異なる交通機関の人数を単純に足して総旅行者数とはできません。',
      '輸送人員は延べ人数で、同じ人の乗換えや往復が複数回数えられる場合があります。居住人口や観光客数を直接示すものではありません。',
      '発地・着地・通過地の扱いや都道府県への帰属は交通機関別の集計表に従います。空港・港・主要駅の立地が順位に強く影響します。',
    ],
  },
  'natural-park-area': {
    summary:
      '自然公園の面積は、環境省が国立公園、国定公園、都道府県立自然公園について、都道府県別の箇所数と指定面積を取りまとめた資料です。自然公園の総面積、種類別面積、県土面積に占める割合を比較できます。',
    whatYouCanLearn: [
      '国立公園、国定公園、都道府県立自然公園の指定面積',
      '都道府県立自然公園の箇所数の地域差',
      '県土面積に占める自然公園面積の割合',
    ],
    readerQuestions: [
      {
        question: '自然公園面積が広い都道府県は？',
        rankingKey: 'nature-park-area',
      },
      {
        question: '県土に占める自然公園面積の割合が高い都道府県は？',
        rankingKey: 'nature-park-area-ratio',
      },
      {
        question: '都道府県立自然公園の箇所数が多い都道府県は？',
        rankingKey: 'prefectural-natural-park-count',
      },
    ],
    caveats: [
      '自然公園は自然公園法や条例に基づく指定区域で、森林面積、自然環境保全地域、都市公園とは別の範囲です。',
      '国立・国定公園が複数都道府県にまたがる場合は県別面積で集計されます。再測定や境界未定地、端数処理により公園別合計と一致しない場合があります。',
      '指定面積の広さは、生態系の状態、保護規制の強さ、利用者数や管理の質を直接示すものではありません。',
    ],
  },
  'boj-statistics': {
    summary:
      '日本銀行の都道府県別預金・現金・貸出金統計などは、金融機関の店舗が計上する預金・貸出金残高を地域別に整理した統計です。このハブでは、国内銀行の預金、個人預金、貸出金と、より広い金融機関を含む預貯金残高の系列を比較できます。',
    whatYouCanLearn: [
      '国内銀行の預金残高と貸出残高の地域差',
      '国内銀行の個人預金残高',
      '預貯金総額と住民1人当たり残高の違い',
    ],
    readerQuestions: [
      {
        question: '国内銀行の貸出残高が大きい都道府県は？',
        rankingKey: 'bank-loan-balance',
      },
      {
        question: '国内銀行の個人預金残高が大きい都道府県は？',
        rankingKey: 'bank-personal-deposit',
      },
      {
        question: '1人当たり預貯金残高が高かった都道府県は？',
        rankingKey: 'deposit-balance-per-person',
      },
    ],
    caveats: [
      '国内銀行の系列と、ゆうちょ銀行や中小企業金融機関などを含み得る預貯金系列では対象金融機関が異なります。名前が似た残高を合算・直結しないでください。',
      '都道府県別の計数は金融機関店舗の所在地等に基づく集計で、住民個人が保有する金融資産総額や平均貯蓄額をそのまま示すものではありません。',
      '1人当たり預貯金残高は人口で標準化した旧系列を含みます。総額、個人預金、貸出金では対象・時点・単位が異なるため、各ランキングの定義と年を確認してください。',
    ],
  },
  'comprehensive-living-conditions-survey': {
    summary:
      '国民生活基礎調査は、厚生労働省が世帯、所得、健康、介護など国民生活の基礎的事項を把握する調査です。このハブでは、大規模調査の健康票から、病気やけがの自覚症状がある人の有訴者率と、医療機関等へ通っている人の通院者率を都道府県別に比較できます。',
    whatYouCanLearn: [
      '自覚症状がある人の人口千人当たりの割合',
      '医療機関等へ通院している人の人口千人当たりの割合',
      '有訴と通院が一致しない地域の健康状態と受療行動',
    ],
    readerQuestions: [
      {
        question: '有訴者率が高い都道府県は？',
        rankingKey: 'complainant-rate-per-1000',
      },
      {
        question: '通院者率が高い都道府県は？',
        rankingKey: 'outpatient-rate-per-1000',
      },
      {
        question: '社会・人口統計体系で通院者率を長期比較すると？',
        rankingKey: 'outpatient-count',
      },
    ],
    caveats: [
      '有訴者は入院者を除く世帯員のうち自覚症状がある人、通院者は病院・診療所や施術所等へ通う人です。診断された患者数や受診件数とは異なります。',
      '率の分母には入院者を含む一方、分子の有訴者・通院者には入院者を含みません。いずれも人口千人当たりの標本調査による推計値です。',
      '都道府県別の健康指標は3年ごとの大規模調査を基にし、年齢構成や回答行動の差に影響されます。年齢調整率ではないため単純な健康度順位とはいえません。',
    ],
  },
  'japan-post-statistics': {
    summary:
      '日本郵政グループの統計資料は、日本郵便の郵便局ネットワークと郵便物の引受実績、ゆうちょ銀行の都道府県別貯金残高などを取りまとめています。このハブでは、社会・人口統計体系に収録された郵便局数、郵便物引受数、郵便貯金残高を比較できます。',
    whatYouCanLearn: [
      '営業している郵便局数の地域差',
      '郵便物の引受数から見た郵便利用規模',
      'ゆうちょ銀行の都道府県別貯金残高',
    ],
    readerQuestions: [
      {
        question: '郵便局数が多い都道府県は？',
        rankingKey: 'post-office-count',
      },
      {
        question: '郵便物引受数が多かった都道府県は？',
        rankingKey: 'mail-items-handled',
      },
      {
        question: '郵便貯金残高が大きい都道府県は？',
        rankingKey: 'postal-savings-balance',
      },
    ],
    caveats: [
      '3指標は同じ年の一体的な調査ではありません。郵便物引受数は2006年までの旧系列を含む一方、郵便局数と貯金残高には新しい年次があります。',
      '郵便局数は局の規模、営業時間、取扱サービスや人口当たりの利便性を直接示すものではありません。営業中・一時閉鎖などの集計条件も確認してください。',
      '都道府県別貯金残高は原則として口座を開設した都道府県へ帰属し、振替貯金などを含まない場合があります。住民1人当たりの貯蓄額や金融資産総額ではありません。',
    ],
  },
  'flood-statistics': {
    summary:
      '水害統計調査は、国土交通省が毎年、洪水、内水、高潮、津波、土石流、地すべりなどによる被害を地方公共団体等から収集する一般統計調査です。一般資産、公共土木施設、公益事業等の被害額と、被災地域、死傷者を都道府県別に比較できます。',
    whatYouCanLearn: [
      '水害による死者・負傷者と被災市区町村の地域差',
      '家屋や事業所など一般資産の推計被害額',
      '河川、道路、橋梁など公共土木施設の被害額',
      '一般資産・公共土木施設・公益事業等を含む被害総額',
    ],
    readerQuestions: [
      {
        question: '水害被害額の合計が大きかった都道府県は？',
        rankingKey: 'flood-damage-total',
      },
      {
        question: '水害による死者数が多かった都道府県は？',
        rankingKey: 'flood-deaths',
      },
      {
        question: '一般資産等の水害被害額が大きかった都道府県は？',
        rankingKey: 'flood-damage-general-assets',
      },
      {
        question: '公共土木施設の水害被害額が大きかった都道府県は？',
        rankingKey: 'flood-damage-public-infrastructure',
      },
    ],
    caveats: [
      'このハブの掲載値は2014年の単年値です。災害の発生場所・規模に強く左右されるため、恒常的な水害リスクの順位とはいえません。',
      '一般資産の被害額は浸水深、床面積、評価単価、被害率などから推計され、公共土木施設は報告額等を基に集計されます。区分ごとに算出方法が異なります。',
      '被災市区町村数や河川・海岸数の「延数」は、複数の水害で同じ対象が重複して数えられる場合があり、実在する自治体・河川の実数ではありません。',
      '暫定値と確報値では使用する評価単価や精査状況が異なるため、同じ調査年・確報区分の値を比較してください。',
    ],
  },
  'construction-orders-statistics': {
    summary:
      '建設工事受注動態統計調査は、国土交通省が建設業者の受注状況を毎月調べ、発注者、業種、工事種類、施工地域別に建設工事の動きを捉える基幹統計調査です。このハブでは、公共機関から受注した工事の件数と請負契約額を工事種類別に比較できます。',
    whatYouCanLearn: [
      '公共機関から受注した建設工事の件数と請負契約額',
      '道路、河川、下水道など公共工事の種類別規模',
      '住宅・宿舎、港湾・空港、災害復旧工事の地域差',
    ],
    readerQuestions: [],
    caveats: [
      '公共機関から受注した1件500万円以上の国内建設工事を扱う表を基にしており、小規模工事や民間発注工事を含む建設市場全体ではありません。',
      '請負契約額は受注時点の契約額で、完成工事高、工事出来高、建設投資額、事業者の売上・利益とは異なります。',
      '工事は施工都道府県別に集計される表を使います。受注した建設業者の本社所在地を示すランキングではありません。',
      '大型工事や災害復旧の有無で単年値が大きく変動します。件数と契約額を分け、複数年の動向も併せて確認してください。',
    ],
  },
  'pension-insurance-annual-report': {
    summary:
      '厚生年金保険・国民年金事業年報は、厚生労働省が公的年金制度の被保険者、保険料収納、受給権者、年金額などの事業実績を年度ごとに取りまとめる行政統計です。このハブでは、国民年金の被保険者構成と納付率、厚生年金受給権者の年金総額を都道府県別に比較できます。',
    whatYouCanLearn: [
      '20〜59歳人口に対する第1号国民年金被保険者数',
      '20〜59歳人口に対する第3号国民年金被保険者数',
      '国民年金保険料の納付率の地域差',
      '厚生年金受給権者に支払われる年金総額',
    ],
    readerQuestions: [
      {
        question: '20〜59歳人口当たりの第1号被保険者が多い都道府県は？',
        rankingKey: 'national-pension-enrollees-type1-per-1000-20-59',
      },
      {
        question: '20〜59歳人口当たりの第3号被保険者が多い都道府県は？',
        rankingKey: 'national-pension-enrollees-type3-per-1000-20-59',
      },
      {
        question: '国民年金保険料の納付率が高い都道府県は？',
        rankingKey: 'national-pension-payment-rate',
      },
      {
        question: '厚生年金受給権者の年金総額が大きい都道府県は？',
        rankingKey: 'pension-benefit-total',
      },
    ],
    caveats: [
      '第1号被保険者と第3号被保険者では加入要件が異なります。人口千人当たりの指標と実数、納付率、年金額を同じ尺度として比較しないでください。',
      '保険料納付率は納付対象月数に対する納付月数など制度上の定義に基づき、被保険者数の割合や未納者の人数そのものではありません。',
      '年金総額は受給権者数、年齢構成、加入期間、報酬履歴などに左右されます。1人当たり受給額や現役世代の将来給付水準を示すものではありません。',
      '制度改正や被保険者区分の変更があるため、長期系列では同じ定義で接続できるか各年度の注記を確認してください。',
    ],
  },
  'port-statistics': {
    summary:
      '港湾調査は、国土交通省が港湾の利用実態を把握するため、入港船舶、船舶乗降人員、海上出入貨物、コンテナ個数などを調べる港湾分野の基幹統計調査です。このハブでは、港湾を通じた海上出入貨物の総量と輸出・輸入貨物量を都道府県別に比較できます。',
    whatYouCanLearn: [
      '港湾で取り扱う海上出入貨物総量の地域差',
      '港湾を通じた輸出貨物量',
      '港湾を通じた輸入貨物量と貿易港の規模',
    ],
    readerQuestions: [
      {
        question: '海上出入貨物量が多い都道府県は？',
        rankingKey: 'port-cargo-total',
      },
      {
        question: '港湾の輸出貨物量が多い都道府県は？',
        rankingKey: 'port-cargo-export',
      },
      {
        question: '港湾の輸入貨物量が多い都道府県は？',
        rankingKey: 'port-cargo-import',
      },
    ],
    caveats: [
      '貨物量は港湾で取り扱った重量で、貨物の金額、企業の売上、都道府県内で生産・消費された量を直接示すものではありません。',
      '貨物は利用した港の所在都道府県へ集計されます。背後圏が県境を越えるため、荷主や最終目的地の地域とは一致しない場合があります。',
      '年報は甲種港湾と乙種港湾を対象としますが、公表表や項目によって対象港湾・集計範囲が異なります。月報や甲種港湾のみのデータと混同しないでください。',
      '総量、輸出、輸入では含まれる内訳が異なります。重量の大きいばら積み貨物の影響が強く、コンテナ取扱個数とは別の指標です。',
    ],
  },
  'workplace-accident-survey': {
    summary:
      '労働災害動向調査は、厚生労働省が主要産業の事業所を対象に、産業別・事業所規模別の労働災害の発生状況を継続的に把握する統計調査です。このハブでは、災害の発生頻度を示す度数率と、災害の重さを示す指標を都道府県別に比較できます。',
    whatYouCanLearn: [
      '100万延べ実労働時間当たりの労働災害死傷者数',
      '労働災害の発生頻度の都道府県差と過去系列',
      '労働損失日数などから見た災害の重さの地域差',
    ],
    readerQuestions: [
      {
        question: '最新年の労働災害度数率が高い都道府県は？',
        rankingKey: 'occupational-accident-frequency-rate',
      },
      {
        question: '労働災害の発生頻度を長期系列で比べると？',
        rankingKey: 'frequency-of-occupational-accidents',
      },
      {
        question: '労働災害の重さを示す指標が高い都道府県は？',
        rankingKey: 'work-accident-severity',
      },
    ],
    caveats: [
      '都道府県別の労働災害率は、事業所規模100人以上の集計を基にする表があります。小規模事業所を含む全事業所の状況とは一致しません。',
      '度数率は延べ実労働時間で標準化した発生頻度で、労働災害の件数や被災した労働者の人数そのものではありません。',
      '災害の重さを示す指標は労働損失日数などを用いるため、死亡災害の割合や個々の負傷の重症度と同じ意味ではありません。',
      '標本調査の推計値は、産業構成、事業所規模、労働時間の違いに影響されます。順位差だけを地域の安全対策の優劣と解釈しないでください。',
    ],
  },
  'water-pollution-survey': {
    summary:
      '水質汚濁物質排出量総合調査は、環境省が水質汚濁防止法の規制対象事業場について、汚濁物質の排出源と排出量を把握する調査です。このハブでは、BOD・COD・SSの1日当たり汚濁負荷量を都道府県別に比較できます。',
    whatYouCanLearn: [
      'BOD汚濁負荷量の都道府県差',
      'COD汚濁負荷量の都道府県差',
      '水中の浮遊物質を示すSS汚濁負荷量の地域差',
      '有機物と浮遊物質で排出負荷の地域構造がどう異なるか',
    ],
    readerQuestions: [
      {
        question: 'BOD汚濁負荷量が多い都道府県は？',
        rankingKey: 'bod-pollution-load',
      },
      {
        question: 'COD汚濁負荷量が多い都道府県は？',
        rankingKey: 'cod-pollution-load',
      },
      {
        question: 'SS汚濁負荷量が多い都道府県は？',
        rankingKey: 'ss-pollution-load',
      },
    ],
    caveats: [
      '汚濁負荷量は1日に排出される物質量です。河川や湖沼で測った濃度、水質環境基準の達成率とは別の指標です。',
      'BOD、COD、SSは測っている物質や性質が異なります。数値を足し合わせたり、異なる指標の大きさだけで水質を比較したりしないでください。',
      '都道府県の値は、規制対象事業場の数、業種構成、排水量、排水濃度などに左右されます。順位だけで個々の事業場の管理状況は判断できません。',
      '調査対象は水質汚濁防止法の規制対象事業場です。生活排水や面的な発生源を含む地域全体の汚濁負荷を網羅するものではありません。',
    ],
  },
  'traffic-accident-statistics': {
    summary:
      '交通事故統計は、警察庁が全国の都道府県警察からの報告を基に、道路上で車両・路面電車・列車の交通によって発生した人身事故を集計する公的統計です。このハブでは、事故発生件数、24時間以内の死者数、負傷者・死傷者数を実数と人口・事故件数・道路延長で標準化して比較できます。',
    whatYouCanLearn: [
      '交通事故の発生件数と人口当たり・道路延長当たりの地域差',
      '交通事故による24時間以内死者数と負傷者数',
      '事故100件当たりの死者・死傷者の発生状況',
      '65歳以上の高齢者が交通事故で死傷した人数',
    ],
    readerQuestions: [
      {
        question: '交通事故発生件数が多い都道府県は？',
        rankingKey: 'traffic-accident-count',
      },
      {
        question: '人口10万人当たりの交通事故死者数が多い都道府県は？',
        rankingKey: 'traffic-accident-deaths-per-100k',
      },
      {
        question: '人口当たりの交通事故負傷者数が多い都道府県は？',
        rankingKey: 'traffic-accident-injuries-per-100k',
      },
      {
        question: '高齢者の交通事故死傷者数が多い都道府県は？',
        rankingKey: 'traffic-accident-casualties-elderly-65plus',
      },
    ],
    caveats: [
      '現在の交通事故発生件数は、人の死亡または負傷を伴う人身事故を対象とし、物損事故は含みません。事故件数と車両台数・違反件数を混同しないでください。',
      '「死者」は原則として事故発生から24時間以内に亡くなった人です。30日以内死者や人口動態統計の交通事故死亡とは定義・計上時点が異なります。',
      '負傷者は治療を要する人で、重傷者と軽傷者の合計です。死傷者数は死者と負傷者を合わせるため、事故件数と1対1には対応しません。',
      '人口、事故100件、道路実延長など、指標ごとに分母が異なります。人口当たりの順位は交通量、道路環境、年齢構成などを調整した事故リスクそのものではありません。',
      '公表後に新たな事実が判明した場合、修正値は以後の公表資料へ反映されるため、異なる公表時点の資料では同じ年の値が一致しない場合があります。',
    ],
  },
  'hospital-report': {
    summary:
      '病院報告は、厚生労働省が全国の病院と療養病床を有する診療所から毎月報告を受け、患者の利用状況を把握する報告統計です。在院・入退院・外来患者の報告から病床利用率や平均在院日数を年次集計し、このハブでは病院病床数も含めて都道府県を比較できます。',
    whatYouCanLearn: [
      '6月末現在の病院病床数の都道府県差',
      '年間在院患者延数と月末病床数から算出する病床利用率の違い',
      '入退院患者数を用いて算出する平均在院日数の地域差',
    ],
    readerQuestions: [
      {
        question: '病院の病床数が多い都道府県は？',
        rankingKey: 'hospital-bed-count',
      },
      {
        question: '病院の病床利用率が高い都道府県は？',
        rankingKey: 'bed-utilization-rate',
      },
      {
        question: '病院の平均在院日数が長い都道府県は？',
        rankingKey: 'average-length-of-stay',
      },
    ],
    caveats: [
      '病院病床数は6月末現在の時点値ですが、病床利用率と平均在院日数は1年間の患者数を用いる指標です。時点値と年間値を同じ期間の数値として扱わないでください。',
      '病床利用率は、年間在院患者延数を各月の日数と月末病床数から求めた病床日数で割った値です。感染症病床では一般病床等に在院する患者を含むため、100％を超える場合があります。',
      '平均在院日数は、年間在院患者延数を新入院・退院患者数等で割る所定の式で算出します。個々の患者が実際に入院した日数の単純平均ではありません。',
      '精神・感染症・結核・療養・一般病床を合わせた全病床の指標は、機能の異なる病床の構成に左右されます。2024年4月には介護療養病床の報告が廃止されており、長期比較では区分変更も確認してください。',
    ],
  },
  'national-medical-expenditure': {
    summary:
      '国民医療費は、厚生労働省が保険診療の対象となり得る傷病の治療費を年度ごとに推計する加工統計です。医科・歯科診療、薬局調剤、入院時食事・生活医療、訪問看護などを含み、このハブでは都道府県別の総額、1人当たり額、医科診療の入院分を比較できます。',
    whatYouCanLearn: [
      '都道府県別に推計された国民医療費の総額',
      '人口規模をならした1人当たり国民医療費の地域差',
      '医科診療医療費のうち入院分が占める金額の違い',
      '総額の大きい地域と1人当たり額の大きい地域の違い',
    ],
    readerQuestions: [
      {
        question: '国民医療費の総額が大きい都道府県は？',
        rankingKey: 'national-medical-expense-total',
      },
      {
        question: '1人当たりの国民医療費が高い都道府県は？',
        rankingKey: 'national-medical-expense-per-person',
      },
      {
        question: '医科診療の入院医療費が大きい都道府県は？',
        rankingKey: 'national-medical-expense-inpatient',
      },
    ],
    caveats: [
      '国民医療費は支払額を直接全数集計したものではなく、医療保険の給付実績など複数の資料から推計した年度値です。掲載値は推計年度をそろえて比較してください。',
      '正常な妊娠・分娩、健康診断・予防接種、固定した身体障害に用いる義眼・義肢、保険診療の対象外となる先進医療や選定療養などは含みません。',
      '2000年度以降は、介護保険へ移行した費用を国民医療費の対象から除いています。制度変更をまたぐ長期比較では推計範囲の変化を確認してください。',
      '総額は人口規模、1人当たり額は年齢構成や受療状況などにも影響されます。1人当たり額の順位を、個人の自己負担額や地域の医療の質と解釈しないでください。',
      '医科診療の入院分は国民医療費の一部であり、歯科診療、薬局調剤、入院時食事・生活医療、訪問看護などを含みません。総額と同じ範囲ではありません。',
    ],
  },
  'minimum-wage': {
    summary:
      '地域別最低賃金は、都道府県ごとに定められ、その地域で働くすべての労働者と使用者に原則として適用される時間額です。このハブでは、厚生労働省が公表する各年度の最低賃金額を都道府県別に比較できます。',
    whatYouCanLearn: [
      '地域別最低賃金の時間額の都道府県差',
      '最高額と最低額の開きから見た地域差',
      '年度を切り替えたときの改定額の違い',
    ],
    readerQuestions: [
      {
        question: '地域別最低賃金が高い都道府県は？',
        rankingKey: 'minimum-wage-by-region',
      },
    ],
    caveats: [
      '掲載値は時間額で、月給、平均賃金、実際に支払われた時給ではありません。月収へ換算するには労働時間など別の条件が必要です。',
      '改定額は都道府県ごとに発効日が異なります。同じ暦年でも適用期間がそろわないため、年度と発効日を確認してください。',
      '特定の産業に適用される特定最低賃金は、この地域別最低賃金とは別に定められます。生活費や物価を調整した実質的な購買力の順位でもありません。',
    ],
  },
  'industrial-statistics': {
    summary:
      '工業統計調査は、経済産業省が製造業の事業所を対象に、従業者、製造品出荷額、原材料、工業用地・用水などを把握してきた統計調査です。このハブでは、工業用水の1日当たり使用量を都道府県別に比較できます。',
    whatYouCanLearn: [
      '製造事業所が使用する工業用水量の地域差',
      '用水使用が大きい工業地域への集中',
      '同じ定義で収録された年度間の工業用水量の変化',
    ],
    readerQuestions: [
      {
        question: '工業用水量が多い都道府県は？',
        rankingKey: 'industrial-water-usage',
      },
    ],
    caveats: [
      '掲載系列は工業統計調査のうち工業用水量で、製造品出荷額、事業所数、従業者数などを同時に示すものではありません。',
      '工業統計調査は原則として従業者4人以上の製造事業所を対象としてきました。対象事業所の規模や産業構成が地域で異なります。',
      '経済センサス活動調査の実施年を除く年次調査として行われ、2021年以降は経済構造実態調査などへ体系が移っています。掲載系列は2015年までなので、後継統計と無条件に接続しないでください。',
      '工業用水量は1日当たりの水量で、工業生産額、水道料金、家庭用水の使用量ではありません。',
    ],
  },
  'factory-location-survey': {
    summary:
      '工場立地動向調査は、経済産業省が製造業などの工場・研究所を建設する目的で取得された一定規模以上の用地を把握する調査です。このハブでは、年間の新規工場立地件数を都道府県別に比較できます。',
    whatYouCanLearn: [
      '年間に把握された新規工場立地件数の地域差',
      '工場用地の取得が特定地域へ集中する度合い',
      '同じ対象範囲で見た立地件数の年ごとの変化',
    ],
    readerQuestions: [
      {
        question: '新規の工場立地件数が多い都道府県は？',
        rankingKey: 'factory-establishment-count',
      },
    ],
    caveats: [
      '対象は、製造業、電気業、ガス業、熱供給業などの工場・研究所を建設する目的で取得・借地した1,000平方メートル以上の用地です。すべての工場新設を数える統計ではありません。',
      '立地件数は用地取得の件数で、操業開始した工場数、既存工場数、設備投資額、雇用者数を示すものではありません。',
      '研究所は別区分で集計され、行政情報による補完を含む場合があります。掲載値の対象年と集計範囲をそろえて比較してください。',
    ],
  },
  'livestock-statistics': {
    summary:
      '畜産統計調査は、農林水産省が家畜の飼養戸数・頭羽数などを畜種別に把握する統計です。このハブでは、調査期日現在の乳用牛の飼養頭数を都道府県別に比較できます。',
    whatYouCanLearn: [
      '乳用牛の飼養頭数の都道府県差',
      '酪農生産基盤が特定地域へ集中する度合い',
      '同じ畜種・調査期日で見た飼養規模の違い',
    ],
    readerQuestions: [
      {
        question: '乳用牛の飼養頭数が多い都道府県は？',
        rankingKey: 'dairy-cattle-count',
      },
    ],
    caveats: [
      '掲載値は乳用牛のうち雌の飼養頭数で、肉用牛、豚、採卵鶏、ブロイラーを含む家畜全体の規模ではありません。',
      '飼養頭数は調査期日現在の時点値です。年間の生乳生産量、出荷頭数、農家所得とは一致しません。',
      '畜種によって調査・集計の方法や対象が異なります。旧表には北海道を含まない都府県表もあるため、掲載中の47都道府県系列と別表を混在させないでください。',
    ],
  },
  'population-projection': {
    summary:
      '日本の地域別将来推計人口は、国立社会保障・人口問題研究所が2020年国勢調査を基準に、都道府県・市区町村の将来人口を5年ごとに2050年まで推計したものです。このハブでは、社会・人口統計体系に収録された都道府県別の将来推計人口を対象年ごとに比較します。',
    whatYouCanLearn: [
      '2025年から2050年まで5年ごとの将来推計人口',
      '将来も人口規模が大きい都道府県の分布',
      '複数の推計年を通じた地域人口の縮小幅の違い',
      '2020年を基準にした地域別人口構造の変化',
    ],
    readerQuestions: [],
    caveats: [
      '将来推計は予測値であり、実績値ではありません。出生、死亡、人口移動に一定の仮定を置いた結果なので、政策や社会状況の変化によって実際の人口は異なります。',
      '地域別推計は2020年国勢調査を基準に、市区町村別の推計を合計して都道府県値を得ています。全国推計とは推計期間・方法・仮定が同一ではありません。',
      '2020年値は年齢・国籍などの不詳を補完した基準人口を用いるため、国勢調査の公表値と一致しない場合があります。',
      '各ランキングのデータ年表示は推計の公表・収録時点で、指標名にある2025年・2030年などが推計対象年です。両者を混同しないでください。',
    ],
  },
  'freight-regional-flow-survey': {
    summary:
      '貨物地域流動調査は、鉄道、海運、自動車、航空の各輸送統計を地域間の貨物流動として組み替える国土交通省の加工統計です。このハブでは、都道府県から発送されたJR貨物の重量と航空貨物の輸送量を比較できます。',
    whatYouCanLearn: [
      'JR貨物が各都道府県から発送した貨物重量',
      '航空で輸送された貨物量の地域差',
      '鉄道と航空で異なる貨物流動の地域構造',
      '同じ輸送機関で見た年度ごとの発送・輸送量の変化',
    ],
    readerQuestions: [
      {
        question: 'JR貨物の発送量が多い都道府県は？',
        rankingKey: 'jr-freight-shipment',
      },
      {
        question: '航空貨物輸送量が多い都道府県は？',
        rankingKey: 'air-cargo-transport',
      },
    ],
    caveats: [
      '複数の輸送統計を再集計する加工統計で、輸送機関ごとに原統計の対象・単位・把握方法が異なります。鉄道と航空の値を同じ単位へ直さず合算しないでください。',
      'JR貨物発送量は到着量ではなく発送地側の重量で、JR貨物以外の鉄道事業者による輸送を含みません。',
      '航空貨物は空港を持たない県などで0になる場合があります。荷主、貨物の生産地、最終消費地の都道府県を直接示すものではありません。',
      '公表表の地域区分と掲載期間は改定されています。長期比較では同じ輸送機関・地域区分・年度の系列を使ってください。',
    ],
  },
  'late-elderly-medical-annual-report': {
    summary:
      '後期高齢者医療事業状況報告は、厚生労働省が後期高齢者医療制度の被保険者、保険給付、医療費、保険料などの事業実績を月報・年報としてまとめる行政統計です。このハブでは、被保険者1人当たりの医療費を都道府県別に比較できます。',
    whatYouCanLearn: [
      '後期高齢者医療の被保険者1人当たり医療費',
      '人口規模をならした医療費水準の都道府県差',
      '同じ制度・年度で見た地域的な医療費の開き',
    ],
    readerQuestions: [
      {
        question: '後期高齢者の1人当たり医療費が高い都道府県は？',
        rankingKey: 'late-elderly-medical-expense-per-insured',
      },
    ],
    caveats: [
      '被保険者1人当たり医療費は制度全体の医療費を被保険者数で割った地域平均で、個人が窓口で支払う自己負担額ではありません。',
      '年齢構成、疾病構造、受療状況、医療提供体制などの影響を受けます。金額の高低だけで医療の効率や質を判断しないでください。',
      '事業年報は確報、月報は速報で、公表後に被保険者数などが差し替えられる場合があります。同じ年度・確速報区分をそろえて比較してください。',
      '制度開始前を含む旧系列が収録される場合があります。現行の後期高齢者医療制度と同じ定義かを年度ごとに確認してください。',
    ],
  },
  'local-public-employee-salary': {
    summary:
      '地方公務員給与実態調査は、総務省が地方公務員の職員構成、給料、諸手当などを地方公共団体別・職種別に毎年把握する調査です。このハブでは、都道府県職員の平均給与月額、賞与、時間外勤務手当、給与水準などを比較できます。',
    whatYouCanLearn: [
      '都道府県職員の全職種・一般行政職における平均給与月額',
      '期末・勤勉手当や時間外勤務手当の地域差',
      '職員の平均年齢や職種構成と給与水準の関係',
      '国を100としたラスパイレス指数や知事給与の違い',
    ],
    readerQuestions: [
      {
        question: '全職種の平均給与月額が高い都道府県は？',
        rankingKey: 'avg-salary-all-prefecture',
      },
      {
        question: '一般行政職の平均給与月額が高い都道府県は？',
        rankingKey: 'avg-salary-admin-prefecture',
      },
      {
        question: '一般行政職の期末・勤勉手当が高い都道府県は？',
        rankingKey: 'bonus-admin-prefecture',
      },
      {
        question: 'ラスパイレス指数が高い都道府県は？',
        rankingKey: 'laspeyres-index-prefecture',
      },
    ],
    caveats: [
      '調査年・基準日と給与の支給対象期間を確認してください。平均給与月額、年間の期末・勤勉手当、時間外勤務手当は期間と定義が異なります。',
      '平均給与月額は給料月額と諸手当を含む平均で、基本給だけを示す平均給料月額とは異なります。手取り額でもありません。',
      '職種、年齢、経験年数、職員構成が地域ごとに異なるため、平均額の差を同一人物の待遇差とみなさないでください。',
      'ラスパイレス指数は職員構成を国と同じと仮定した給与水準の指数です。民間賃金や地域の生活費を直接比較する指標ではありません。',
    ],
  },
  'japanese-language-instruction-survey': {
    summary:
      '日本語指導が必要な児童生徒の受入状況等に関する調査は、文部科学省が公立学校に在籍する対象者の人数や指導体制を把握する調査です。外国籍だけでなく日本国籍の児童生徒も対象とし、学校種や地域による受入状況を確認できます。',
    whatYouCanLearn: [
      '日本語指導が必要な外国籍・日本国籍の児童生徒数',
      '小学校・中学校・高等学校など学校種別の在籍状況',
      '指導が必要な児童生徒を受け入れる地域の分布',
    ],
    readerQuestions: [],
    caveats: [
      '「日本語指導が必要」とは、日常会話だけでなく、学年相当の学習言語能力の不足により学習活動への参加に支障がある場合を含む調査上の区分です。',
      '公立学校の在籍者を対象とするため、私立学校や地域に住む子ども全体の人数とは一致しません。',
      '人数の多さは支援の質や不足を直接示しません。地域の児童生徒数、指導人員、言語構成などを分けて確認する必要があります。',
    ],
  },
  'telecommunications-service-contract-report': {
    summary:
      '電気通信役務契約等状況報告は、電気通信事業報告規則に基づく事業者の報告を集計した資料です。このハブでは、NTT東日本・NTT西日本が報告する3月31日現在の公衆電話設置台数を、実数と人口当たりで比較できます。',
    whatYouCanLearn: [
      '公衆電話設置台数の都道府県差',
      '人口1000人当たりに換算した設置密度',
      '同じ定義で見た公衆電話設置台数の長期的な変化',
    ],
    readerQuestions: [
      {
        question: '公衆電話の設置台数が多い都道府県は？',
        rankingKey: 'public-phone-count',
      },
      {
        question: '人口当たりの公衆電話が多い都道府県は？',
        rankingKey: 'public-phone-count-per-1000',
      },
      {
        question: '電話加入数が多い都道府県は？',
        rankingKey: 'telephone-subscription-count',
      },
      {
        question: '人口当たりの電話加入数が多い都道府県は？',
        rankingKey: 'telephone-subscription-count-per-1000',
      },
      {
        question: '人口当たりの住宅用電話加入数が多い都道府県は？',
        rankingKey: 'residential-telephone-subscription-count-per-1000',
      },
    ],
    caveats: [
      '掲載値は各年3月31日現在の時点値です。年度内の新設・撤去件数や年間平均ではありません。',
      '支店などのサービス区域と行政区域が一致しない場合があるため、原資料の地域区分を確認してください。',
      '設置台数は通話回数、利用者数、災害時の稼働状況、通信サービスの品質を示すものではありません。',
      'NTT東日本・NTT西日本の報告に基づく系列です。制度や公衆電話の区分変更をまたぐ長期比較では、同じ対象範囲か確認してください。',
    ],
  },
} as const satisfies Record<string, SurveyEditorialContent>;

export function getSurveyEditorialContent(
  surveyKey: string
): SurveyEditorialContent | null {
  if (!(surveyKey in SURVEY_EDITORIAL_CONTENT)) return null;

  return SURVEY_EDITORIAL_CONTENT[
    surveyKey as keyof typeof SURVEY_EDITORIAL_CONTENT
  ];
}
