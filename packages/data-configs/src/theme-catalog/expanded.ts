import type { ThemeCatalog, CatalogMetric } from './types';

/**
 * 128候補のうち「新規テーマ」として採択した残り31テーマ。
 * 指標はすべて既存のMETRICS_REGISTRYに存在する実値を参照する。候補専用の
 * 観測値が未整備なものは、カタログの説明にその制約を明記し、別指標へ名前を
 * 置き換えない。追加取得後に同じキーへ差し替えられるよう章構造を固定する。
 */
type Spec = {
  key: string;
  title: string;
  description: string;
  category: ThemeCatalog['category'];
  metrics: Array<[string, string, CatalogMetric['role']?]>;
  keywords: string[];
};

function makeCatalog(spec: Spec): ThemeCatalog {
  const metrics = spec.metrics.map(([rankingKey, shortLabel, role = 'secondary']) => ({
    rankingKey,
    shortLabel,
    role,
    selection: {
      proposedBy: '128テーマ実現性調査・全体展開',
      surveyedAt: '2026-09-09',
      rationale: `${shortLabel}を都道府県別の実値として比較する。`,
    },
  }));
  // 1カード=1系列にして単位の違う指標を同じY軸へ重ねない。
  const groups = metrics.map((metric, index) => ({
    key: `${spec.key}-indicator-${index + 1}`,
    title: metric.shortLabel,
    rankingKeys: [metric.rankingKey],
    defaultCheckedKeys: [metric.rankingKey],
  }));
  return {
    key: spec.key,
    title: spec.title,
    description: spec.description,
    category: spec.category,
    usage: 'theme',
    metrics,
    charts: [],
    metricGroups: groups,
    sections: [{ key: `${spec.key}-overview`, title: `${spec.title}を都道府県別に見る`, description: spec.description, metricGroupKeys: groups.map((group) => group.key) }],
    keywords: spec.keywords,
  };
}

const SPECS: Spec[] = [
  { key: 'land-property-market', title: '不動産取引と地価', description: '住宅地・工業地の地価水準と変動率を分けて比較します。価格の水準と変化率は同じ尺度にせず、調査地点と基準日を確認します。', category: 'economy', metrics: [['residential-land-price-change-rate', '住宅地地価変動率', 'primary'], ['industrial-land-price-change-rate', '工業地地価変動率'], ['industrial-land-price', '工業地地価']], keywords: ['地価', '不動産', '住宅地', '工業地'] },
  { key: 'agriculture-production', title: '農業の生産力', description: '農業産出額、農家数、基幹的農業従事者を別々の指標として比較します。総額は人口規模の影響を受けるため、1人当たり指標と混同しません。', category: 'industry', metrics: [['agricultural-output', '農業産出額', 'primary'], ['agricultural-output-per-employed-person', '就業者1人当たり農業産出額'], ['agricultural-farm-count', '農家数'], ['core-agricultural-workers', '基幹的農業従事者数']], keywords: ['農業', '農業産出額', '農家'] },
  { key: 'forestry-timber', title: '森林・林業・木材産業', description: '森林面積・森林率、人工林、林道延長を並べ、森林の規模と林業基盤を分けて読みます。各面積を合算して自然面積とは扱いません。', category: 'industry', metrics: [['forest-area', '森林面積', 'primary'], ['forest-area-ratio', '森林面積割合'], ['artificial-forest-area', '人工林面積'], ['forest-road-length', '林道延長']], keywords: ['森林', '林業', '人工林', '林道'] },
  { key: 'retail-commerce', title: '商業と小売', description: '小売業の事業所数、売場面積、年間商品販売額、商業従業者数を比較します。センサスの対象年を揃え、販売額と店舗数を足し合わせません。', category: 'economy', metrics: [['retail-establishments-by-prefecture', '小売業事業所数', 'primary'], ['retail-sales-area-by-class', '小売業売場面積'], ['retail-sales-amount-by-prefecture', '小売業年間商品販売額'], ['number-of-commercial-employees-wholesale-retail', '商業従業者数']], keywords: ['小売', '商業', '販売額', '売場面積'] },
  { key: 'local-services', title: '飲食・生活関連サービス', description: '飲食店、宿泊施設、生活関連サービスの規模を実値で比較します。飲食・宿泊・その他サービスは別の産業分類として表示します。', category: 'economy', metrics: [['restaurant-count-per-1000', '飲食店数（人口千人当たり）', 'primary'], ['number-of-hotel-facilities', 'ホテル営業施設数'], ['number-of-hotel-rooms', 'ホテル営業施設客室数'], ['personal-items-service-consumption-expenditure', '身の回り用品関連サービス支出']], keywords: ['飲食店', '宿泊', '生活関連サービス'] },
  { key: 'business-demography', title: '起業と開廃業', description: '事業所の開設・廃止を直接表す公表系列が整うまで、経済センサスの事業所数と個人企業売上を基礎情報として掲載します。開業率・廃業率とは読み替えません。', category: 'economy', metrics: [['number-of-establishments-economic-census-basic-survey', '経済センサス事業所数', 'primary'], ['sole-proprietor-sales', '個人企業の売上高'], ['sole-proprietor-sales-per-worker', '個人企業の従業者1人当たり売上高']], keywords: ['起業', '開業', '廃業', '事業所'] },
  { key: 'innovation-patents', title: '研究開発と特許', description: '研究者の平均年収など研究人材の基礎指標を掲載します。特許出願・登録件数は原典系列を取得後に追加し、研究者数を特許件数の代用にはしません。', category: 'industry', metrics: [['researcher-annual-income', '研究者の平均年収', 'primary'], ['university-count-per-100k', '大学数（人口10万人当たり）']], keywords: ['研究開発', '研究者', '特許', 'イノベーション'] },
  { key: 'childcare-services', title: '保育の需給', description: '保育所等の数・在所児・利用率と認定こども園数を比較します。待機児童や申込数は自治体別原典を都道府県集計した後に追加します。', category: 'education', metrics: [['nursery-count-per-100k-0-5', '保育所等数', 'primary'], ['nursery-children-per-nursery-teacher', '保育所等在所児数'], ['nursery-utilization-rate', '保育所等利用率'], ['certified-childcare-center-count-per-100k-0-5', '認定こども園数']], keywords: ['保育', '保育所', '待機児童', 'こども園'] },
  { key: 'single-parent-households', title: 'ひとり親家庭の生活', description: '母子世帯・父子世帯の世帯数と単独世帯割合を比較します。世帯数と生活条件を混ぜず、所得や就業の系列は追加取得後に章へ加えます。', category: 'demographics', metrics: [['single-mother-households', '母子世帯数', 'primary'], ['single-father-households', '父子世帯数'], ['single-person-household-ratio', '単独世帯割合']], keywords: ['ひとり親', '母子世帯', '父子世帯'] },
  { key: 'long-term-care', title: '介護の需給', description: '介護保険給付、老人ホームの数・定員・在所者を分けて比較します。高齢者人口当たり系列と実数を同じランキングにしません。', category: 'welfare', metrics: [['nursing-care-insurance-benefit', '介護保険給付費用額', 'primary'], ['nursing-home-count-per-100k-65plus', '老人ホーム数'], ['nursing-home-capacity-per-1000-65plus', '老人ホーム定員数'], ['nursing-home-residents-per-1000-65plus', '老人ホーム在所者数']], keywords: ['介護', '介護保険', '老人ホーム'] },
  { key: 'disability-support', title: '障害福祉と社会参加', description: '知的障害者援護施設の数・定員・在所者と身体障害者手帳交付数を比較します。制度区分の異なる人数を合算しません。', category: 'welfare', metrics: [['intellectual-disability-support-facility-count-per-1m', '知的障害者援護施設数', 'primary'], ['intellectual-disability-support-facility-capacity-per-100k', '知的障害者援護施設定員数'], ['intellectual-disability-support-facility-residents-per-100k', '知的障害者援護施設在所者数'], ['physical-disability-certificates-issued-per-1000', '身体障害者手帳交付数']], keywords: ['障害福祉', '障害者手帳', '社会参加'] },
  { key: 'public-assistance', title: '生活保護と生活困窮', description: '生活保護の実人員・実世帯数、保護費、施設定員を分けて比較します。受給者数の大小だけを困窮の原因や良否と解釈しません。', category: 'welfare', metrics: [['persons-on-public-assistance-per-1000', '生活保護被保護実人員', 'primary'], ['households-on-public-assistance-per-1000', '生活保護被保護実世帯数'], ['public-assistance-expenses-prefecture', '生活保護費'], ['public-assistance-facility-capacity-per-1000', '生活保護施設定員数']], keywords: ['生活保護', '生活困窮', '社会保障'] },
  { key: 'health-checkups', title: '生活習慣と健診', description: '生活習慣病健診の受診延人員と歯科健診を別系列で比較します。健診の受診者数を健康状態そのものとは解釈しません。受診率は公式系列を取得後に追加します。', category: 'welfare', metrics: [['health-checkup-recipients', '生活習慣病健康診断受診延人員', 'primary'], ['dental-checkup-persons-per-1000', '歯科健診受診延人員']], keywords: ['健診', '生活習慣病', '歯科健診'] },
  { key: 'daily-time-use', title: '睡眠と生活時間', description: '睡眠・家事・仕事・趣味娯楽の平均時間を男女別に比較します。平均時間は一日の行動配分であり、生活の良否を示す指標ではありません。', category: 'demographics', metrics: [['sleep-avg-time-female', '女性の睡眠時間', 'primary'], ['sleep-avg-time-male', '男性の睡眠時間'], ['housework-avg-time-female', '女性の家事時間'], ['housework-avg-time-male', '男性の家事時間'], ['hobby-leisure-avg-time-employed-female', '女性の趣味・娯楽時間'], ['hobby-leisure-avg-time-employed-male', '男性の趣味・娯楽時間']], keywords: ['生活時間', '睡眠', '家事', '余暇'] },
  { key: 'household-assets-debt', title: '貯蓄と負債', description: '二人以上世帯の貯蓄現在高と金融負債残高、貯蓄率を別々に比較します。世帯属性や調査年の違いを補正した推計は行いません。', category: 'economy', metrics: [['financial-assets-balance-multi-person-households', '貯蓄現在高', 'primary'], ['financial-debt-balance', '金融負債残高'], ['avg-savings-rate-worker-households', '平均貯蓄率']], keywords: ['貯蓄', '負債', '家計'] },
  { key: 'freight-logistics', title: '物流と貨物輸送', description: 'JR貨物、航空貨物、貨物車両、トラック事業者の規模を輸送手段別に比較します。輸送量を単純合算して物流量とはしません。', category: 'tourism', metrics: [['jr-freight-shipment', 'JR貨物発送量', 'primary'], ['air-cargo-transport', '航空貨物輸送量'], ['number-of-freight-cars', '貨物車数'], ['truck-operators', 'トラック事業者']], keywords: ['物流', '貨物', '輸送', 'トラック'] },
  { key: 'regional-transport', title: '自動車依存と移動手段', description: '自動車保有、通勤・通学の交通手段、交通通信費、バス事業者を別々に比較します。自動車保有台数から交通空白を直接判定しません。', category: 'tourism', metrics: [['car-ownership-multi-person-households-per-1000', '自動車所有数量', 'primary'], ['commute-by-car', '自家用車通勤・通学者数'], ['commute-by-bus', '乗合バス通勤・通学者数'], ['bus-operators', 'バス事業者']], keywords: ['自動車', '交通', '通勤', 'バス'] },
  { key: 'geographic-access', title: '交通空白と生活アクセス', description: '交通手段と鉄道・バスの供給を基礎指標として掲載します。距離圏外人口や医療施設までの距離は公式GIS計算が整った時点で追加し、既存の交通量を交通空白へ置き換えません。', category: 'safety', metrics: [['railway-station-count', '鉄道駅数', 'primary'], ['bus-operators', 'バス事業者数'], ['commute-by-car', '自家用車通勤・通学者数']], keywords: ['交通空白', '生活アクセス', '駅', 'バス'] },
  { key: 'water-services', title: '水道の持続性', description: '上水道の給水人口比率、給水量、施設能力と下水道普及率を分けて比較します。上下水道料の家計支出はインフラ供給指標と別に扱います。', category: 'industry', metrics: [['water-supply-population-ratio-2012on', '上水道給水人口比率', 'primary'], ['sewerage-coverage-rate', '下水道処理人口普及率'], ['water-supply-annual-volume', '上水道年間給水量'], ['water-supply-capacity', '上水道施設能力']], keywords: ['水道', '上水道', '下水道', '持続性'] },
  { key: 'communication-access', title: '通信環境とデジタル基盤', description: '携帯電話契約数・保有数量、インターネット接続料、情報通信係数を掲載します。契約数は実利用や通信速度を意味しません。', category: 'industry', metrics: [['mobile-phone-contract-count-per-1000', '携帯電話契約数', 'primary'], ['mobile-phone-ownership-multi-person-households-per-1000', '携帯電話所有数量'], ['internet-fee-consumption-expenditure', 'インターネット接続料'], ['information-communication-coefficient', '情報通信係数']], keywords: ['通信', '携帯電話', 'インターネット', 'デジタル'] },
  { key: 'regional-energy', title: 'エネルギー消費', description: '最終エネルギー消費量と1人当たり消費、電力需要、住宅の太陽光設備率を規模と普及に分けて比較します。電源構成は別統計として扱います。', category: 'industry', metrics: [['final-energy-consumption', '最終エネルギー消費量', 'primary'], ['final-energy-consumption-per-capita', '1人当たり最終エネルギー消費量'], ['electricity-demand', '電力需要量'], ['solar-panel-housing-rate', '太陽光発電機のある住宅率']], keywords: ['エネルギー', '電力', '太陽光', '消費'] },
  { key: 'environmental-quality', title: '大気と水環境', description: '公表済みの水質汚濁負荷量、公害苦情、特定事業場を掲載します。PM2.5や環境基準達成率は環境省の年次原典を都道府県集計した後に追加し、負荷量を濃度の代用にはしません。', category: 'safety', metrics: [['ss-pollution-load', 'SS汚濁負荷量', 'primary'], ['bod-pollution-load', 'BOD汚濁負荷量'], ['cod-pollution-load', 'COD汚濁負荷量'], ['pollution-complaints-received-per-100k', '公害苦情受付件数']], keywords: ['大気', '水環境', '公害', '水質'] },
  { key: 'natural-environment', title: '森林と自然環境', description: '森林面積・森林率、人工林、自然環境保全地域、自然公園を別々に比較します。保全地域と森林面積を足して自然面積とは扱いません。', category: 'lifestyle', metrics: [['forest-area', '森林面積', 'primary'], ['forest-area-ratio', '森林面積割合'], ['artificial-forest-area', '人工林面積'], ['natural-environment-conservation-area', '自然環境保全地域面積'], ['nature-park-area', '自然公園面積']], keywords: ['自然環境', '森林', '自然公園', '保全地域'] },
  { key: 'earthquake-exposure', title: '地震への備え', description: '住宅の耐震改修率・耐震工事数と火災・地震保険料を比較します。J-SHISの確率・震度曝露人口は版とシナリオを固定したGIS計算後に追加します。', category: 'safety', metrics: [['earthquake-renovation-rate', '耐震改修工事実施率', 'primary'], ['earthquake-retrofit-housing', '耐震工事をした住宅数（持ち家）'], ['fire-earthquake-insurance-consumption-expenditure', '火災・地震保険料']], keywords: ['地震', '耐震', '防災', '住宅'] },
  { key: 'landslide-exposure', title: '土砂災害', description: '災害被害額・復旧費を基礎情報として掲載します。土砂災害警戒区域の数・面積と区域内人口は、原典のライセンスと都道府県別更新年を確認したGIS計算後に追加します。', category: 'safety', metrics: [['disaster-damage-amount', '災害被害額', 'primary'], ['disaster-recovery-expenses-prefecture', '災害復旧費'], ['disaster-relief-expenses-prefecture', '災害救助費']], keywords: ['土砂災害', '警戒区域', '災害', '復旧'] },
  { key: 'tsunami-exposure', title: '津波と沿岸防災', description: '沿岸県の災害被害額と復旧費、漁港の数を基礎情報として掲載します。浸水想定面積・深さ別人口・避難施設は想定地震と公表年を固定した沿岸GIS計算後に追加し、内陸県をゼロ扱いしません。', category: 'safety', metrics: [['disaster-damage-amount', '災害被害額', 'primary'], ['disaster-recovery-expenses-prefecture', '災害復旧費'], ['fishing-port-count-ksj', '漁港数']], keywords: ['津波', '沿岸防災', '浸水', '避難'] },
  { key: 'cultural-participation', title: '文化芸術への参加', description: '美術・演劇などの鑑賞行動者率、図書館利用、博物館数を参加・施設の軸に分けて比較します。行動者率と施設数を合算しません。', category: 'education', metrics: [['hobby-participation-rate-art-appreciation', '美術鑑賞の行動者率', 'primary'], ['hobby-participation-rate-theater', '演芸・演劇・舞踊鑑賞の行動者率'], ['library-lending-books', '図書館館外貸出冊数'], ['total-museum-count', '博物館総数']], keywords: ['文化', '芸術', '図書館', '博物館'] },
  { key: 'sports-participation', title: 'スポーツ施設と利用', description: 'スポーツの年間行動者率・観覧率と社会体育施設数を参加と供給に分けて比較します。施設数から利用者数は推計しません。', category: 'education', metrics: [['sports-annual-participation-rate-10plus', 'スポーツ年間行動者率', 'primary'], ['hobby-participation-rate-sports-spectating', 'スポーツ観覧の行動者率'], ['community-sports-facility-count-per-million', '社会体育施設数'], ['sports-park-count', '運動公園数']], keywords: ['スポーツ', '施設', '運動', '観覧'] },
  { key: 'local-government-digital', title: '自治体DX', description: '自治体のオンライン手続きに関する公式系列を追加する前段として、行政サービスに関連する事業所・情報通信基盤を掲載します。申請率を未取得データから推定しません。', category: 'finance', metrics: [['information-communication-coefficient', '情報通信係数', 'primary'], ['number-of-establishments-information-communication', '情報通信業事業所数'], ['information-communication-expenditure', '情報通信関係費']], keywords: ['自治体DX', 'オンライン申請', '行政', 'デジタル'] },
  { key: 'gender-participation', title: '地域の男女共同参画', description: '男女間賃金格差、女性・男性の労働力人口比率、女性パートタイム賃金を別軸で比較します。賃金格差から管理職比率を推定しません。', category: 'economy', metrics: [['gender-wage-gap', '男女間賃金格差', 'primary'], ['labor-force-population-ratio-woman', '女性労働力人口比率'], ['labor-force-population-ratio-man', '男性労働力人口比率'], ['female-part-time-hourly-wage', '女性パートタイム給与']], keywords: ['男女共同参画', '女性就業', '賃金格差'] },
  { key: 'community-participation', title: '市民参加と地域活動', description: 'ボランティア活動の年間行動者率と選挙投票率、図書館登録者数を市民参加の異なる側面として比較します。異なる母数の率を合算しません。', category: 'demographics', metrics: [['volunteer-activity-annual-participation-rate-10plus', 'ボランティア年間行動者率', 'primary'], ['voter-turnout-governor', '都道府県知事選挙投票率'], ['library-registered-users', '図書館登録者数']], keywords: ['市民参加', 'ボランティア', '投票率', '地域活動'] },
];

export const EXPANDED_THEME_CATALOGS: Record<string, ThemeCatalog> = Object.fromEntries(SPECS.map((spec) => [spec.key, makeCatalog(spec)]));

/** 既存テーマへ追加する67章。候補の問いごとに、既存の実値を独立カードで配置する。 */
export const EXISTING_THEME_SECTION_EXTENSIONS: Record<string, Array<{ candidateId: number; title: string; metrics: Array<[string, string]> }>> = {
  'living-housing': [
    { candidateId: 5, title: '住宅建設と新築需要', metrics: [['new-housing-starts', '着工新設住宅戸数']] },
    { candidateId: 6, title: '改修・リフォーム需要', metrics: [['renovation-rate', 'リフォーム工事実施率'], ['earthquake-renovation-rate', '耐震改修工事実施率']] },
    { candidateId: 8, title: '空き家と住宅ストック', metrics: [['vacant-housing-rate', '空き家率'], ['households', '一般世帯数']] },
    { candidateId: 44, title: '単身化と一人暮らし', metrics: [['single-person-household-ratio', '単独世帯割合']] },
    { candidateId: 45, title: '世帯構成の変化', metrics: [['households', '一般世帯数'], ['average-persons-per-general-household', '一般世帯の平均人員']] },
    { candidateId: 74, title: '住居費と住宅取得', metrics: [['private-rent-consumption-expenditure', '家賃支出'], ['current-liabilities-balance-multi-person-households-per-household', '負債現在高']] },
    { candidateId: 93, title: '都市化と土地利用', metrics: [['densely-inhabited-district-population-density', '人口集中地区人口密度']] },
    { candidateId: 94, title: '公園と都市緑地', metrics: [['urban-parks', '都市公園数'], ['urban-parks-area', '都市公園面積']] },
  ],
  manufacturing: [
    { candidateId: 12, title: '食品産業', metrics: [['food-business-establishments', '食品関係営業施設数']] },
    { candidateId: 22, title: '企業立地と工場投資', metrics: [['factory-location-area-annual', '工場立地敷地面積（年次）']] },
  ],
  'local-economy': [
    { candidateId: 16, title: '産業集積と地域の得意分野', metrics: [['number-of-establishments-economic-census-basic-survey', '経済センサス事業所数']] },
    { candidateId: 18, title: '企業の成長と生産性', metrics: [['annual-sales-amount', '商業年間商品販売額'], ['annual-sales-amount-per-employee', '従業者1人当たり商業販売額']] },
  ],
  tourism: [
    { candidateId: 25, title: '宿泊市場と稼働率', metrics: [['room-utilization-rate', '客室稼働率']] },
    { candidateId: 26, title: 'インバウンド', metrics: [['total-overnight-guests-foreign', '外国人延べ宿泊者数']] },
    { candidateId: 27, title: '観光消費と地域への還元', metrics: [['accommodation-consumption-expenditure', '宿泊料消費支出額']] },
    { candidateId: 28, title: '観光の季節性', metrics: [['total-overnight-guests', '延べ宿泊者数']] },
    { candidateId: 85, title: '空港と航空交通', metrics: [['airport-count', '空港数'], ['air-passenger-transport', '航空輸送人員']] },
  ],
  'labor-mobility': [
    { candidateId: 33, title: '人手不足と求人', metrics: [['active-job-opening-ratio', '有効求人倍率']] },
    { candidateId: 37, title: '非正規雇用と雇用の安定性', metrics: [['employment-mobility-rate', '雇用移動率']] },
    { candidateId: 38, title: '労働時間と休暇', metrics: [['monthly-average-actual-working-hours-male', '男性月間平均実労働時間'], ['monthly-average-actual-working-hours-female', '女性月間平均実労働時間']] },
    { candidateId: 39, title: 'テレワークと通勤', metrics: [['telework-rate', 'テレワーク実施率']] },
    { candidateId: 84, title: '通勤通学と昼間人口', metrics: [['day-time-population-ratio', '昼夜間人口比率'], ['commuter-ratio-to-other-municipalities', '他市区町村への通勤者比率']] },
  ],
  'labor-wages': [
    { candidateId: 35, title: '女性の就業と賃金', metrics: [['labor-force-population-ratio-woman', '女性労働力人口比率'], ['female-scheduled-earnings', '女性所定内給与額']] },
  ],
  'population-dynamics': [
    { candidateId: 34, title: '若者の就職と流出', metrics: [['outflow-commuter-student-population', '県外従業・通学流出人口']] },
    { candidateId: 41, title: '出生と子育て世代', metrics: [['births', '出生数'], ['total-fertility-rate', '合計特殊出生率']] },
    { candidateId: 43, title: '男女別・年齢別の人口移動', metrics: [['movers-in', '転入者数'], ['movers-out', '転出者数']] },
    { candidateId: 47, title: '人口の将来推計', metrics: [['population-growth-rate', '人口増減率']] },
  ],
  'aging-society': [
    { candidateId: 36, title: '高齢者の就業', metrics: [['employment-rate', '就業率（全体・参考）']] },
    { candidateId: 42, title: '婚姻と家族形成', metrics: [['marriages-per-total-population', '婚姻率'], ['divorces-per-total-population', '離婚率']] },
    { candidateId: 48, title: '過疎化と集落の維持', metrics: [['ratio-65-plus', '65歳以上人口割合']] },
  ],
  'local-finance': [
    { candidateId: 50, title: '子育て費用と支援', metrics: [['child-welfare-expenditure-ratio-pref-finance', '児童福祉費割合']] },
    { candidateId: 92, title: '公共施設の維持更新', metrics: [['per-capita-total-expenditure-pref-municipal', '住民1人当たり歳出']] },
    { candidateId: 121, title: '財政の持続性', metrics: [['current-balance-ratio', '経常収支比率'], ['future-burden-ratio', '将来負担比率']] },
    { candidateId: 122, title: '行政サービスの費用比較', metrics: [['per-capita-total-expenditure-pref-municipal', '住民1人当たり歳出']] },
    { candidateId: 123, title: '公務員と行政運営', metrics: [['prefectural-general-administration-staff', '一般行政部門職員数']] },
    { candidateId: 125, title: 'ふるさと納税', metrics: [['local-tax-ratio-pref-finance', '地方税割合']] },
  ],
  'education-culture': [
    { candidateId: 52, title: '学校の規模と統廃合', metrics: [['elementary-school-count', '小学校数'], ['junior-high-school-count', '中学校数']] },
    { candidateId: 53, title: '高校卒業後の進路', metrics: [['final-education-university-graduate-school-ratio', '大学等進学率']] },
    { candidateId: 54, title: '大学と地域人材', metrics: [['university-count', '大学数'], ['university-count-per-100k', '大学数（人口10万人当たり）']] },
    { candidateId: 55, title: '教育費と学習環境', metrics: [['elementary-school-education-cost-per-student', '小学校教育費']] },
    { candidateId: 56, title: '生涯学習と学び直し', metrics: [['study-participation-rate-business', '学習・自己啓発行動者率']] },
    { candidateId: 113, title: '図書館と読書環境', metrics: [['library-books', '図書館蔵書数'], ['library-lending-books', '図書館貸出冊数']] },
    { candidateId: 114, title: '博物館・美術館', metrics: [['total-museum-count', '博物館総数'], ['art-museum-count', '美術博物館数']] },
    { candidateId: 116, title: '文化財の保存と継承', metrics: [['total-museum-count', '博物館総数（関連施設・参考）']] },
  ],
  healthcare: [
    { candidateId: 57, title: '医療人材と地域偏在', metrics: [['physicians-in-medical-facilities-per-100k', '医師数'], ['nurses-in-medical-facilities-per-100k', '看護師数']] },
    { candidateId: 58, title: '救急医療と搬送', metrics: [['ambulance-hospital-arrival-time', '救急搬送病院収容所要時間'], ['annual-emergency-dispatches-per-1000', '救急出動件数']] },
    { candidateId: 59, title: '出産と周産期医療', metrics: [['maternal-health-guidance-per-100-births', '妊産婦保健指導数']] },
    { candidateId: 61, title: '在宅医療と地域ケア', metrics: [['home-care-worker-annual-income', '訪問介護従事者平均年収']] },
    { candidateId: 65, title: '健康寿命と長寿', metrics: [['healthy-life-expectancy-male', '男性健康寿命'], ['healthy-life-expectancy-female', '女性健康寿命']] },
    { candidateId: 67, title: '疾病と死亡要因', metrics: [['deaths-lifestyle-diseases-per-100k', '生活習慣病死亡率']] },
    { candidateId: 68, title: '心の健康と支援', metrics: [['treatment-rate-mood-disorder-outpatient', '気分障害外来受療率']] },
  ],
  'foreign-residents': [
    { candidateId: 40, title: '外国人材と地域産業', metrics: [['foreign-resident-population', '外国人住民人口'], ['foreign-resident-count', '外国人人口']] },
  ],
  'real-income': [
    { candidateId: 73, title: '可処分所得と生活費', metrics: [['disposable-income-worker-households', '可処分所得'], ['actual-income-worker-households-per-month', '実収入']] },
    { candidateId: 77, title: '家計の消費構造', metrics: [['consumption-expenditure-multi-person-households-per-month', '消費支出']] },
    { candidateId: 80, title: '所得格差と経済的困難', metrics: [['per-capita-prefectural-income-h27', '1人当たり県民所得（参考）']] },
  ],
  'consumer-prices': [
    { candidateId: 75, title: '光熱費と気候', metrics: [['consumer-price-difference-index-utilities', '光熱・水道物価地域差指数']] },
    { candidateId: 76, title: '食費と食料品価格', metrics: [['consumer-price-difference-index-food', '食料物価地域差指数']] },
  ],
  ports: [{ candidateId: 86, title: '港湾と国際物流', metrics: [['maritime-import-export-cargo', '海上出入貨物']] }],
  safety: [
    { candidateId: 88, title: '交通安全と事故要因', metrics: [['traffic-accident-count', '交通事故発生件数'], ['traffic-accident-deaths-per-100k', '交通事故死者数']] },
    { candidateId: 106, title: '洪水と浸水', metrics: [['flood-damage-general-assets', '水害一般資産等被害額'], ['flood-affected-municipalities', '水害被災市区町村数']] },
    { candidateId: 109, title: '災害被害と復旧', metrics: [['disaster-damage-amount-per-person', '1人当たり災害被害額']] },
    { candidateId: 110, title: '消防と救急体制', metrics: [['fire-department-water-count-per-100-thousand-people', '消防水利数'], ['annual-emergency-dispatches-per-1000', '救急出動件数']] },
    { candidateId: 111, title: '避難施設と要支援者支援', metrics: [['disaster-relief-expenses-prefecture', '災害救助費']] },
    { candidateId: 112, title: '犯罪と消費者被害', metrics: [['criminal-recognition-count', '刑法犯認知件数'], ['police-officer-count-per-population', '警察官数']] },
  ],
  roads: [{ candidateId: 89, title: 'インフラ老朽化', metrics: [['road-bridge-expenses-prefecture', '道路橋りょう費']] }],
  climate: [
    { candidateId: 96, title: '雪国の暮らしと除雪', metrics: [['annual-snow-days', '年間雪日数'], ['maximum-snow-depth', '最深積雪']] },
    { candidateId: 104, title: '暑さと気候への適応', metrics: [['maximum-temperature', '最高気温'], ['annual-sunshine-duration', '年間日照時間']] },
  ],
};

export function extensionMetric(metric: [string, string]): CatalogMetric {
  return {
    rankingKey: metric[0],
    shortLabel: metric[1],
    role: 'secondary',
    selection: { proposedBy: '128テーマ実現性調査・既存テーマ拡充', surveyedAt: '2026-09-09', rationale: `${metric[1]}を既存テーマの独立章へ追加する。` },
  };
}
