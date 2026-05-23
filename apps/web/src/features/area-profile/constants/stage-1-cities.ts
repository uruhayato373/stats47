/**
 * Phase 1 S1: SSG 対象の政令指定都市 20 市
 *
 * area_profiles に強みデータが揃っており、indexed 化の効果が高い。
 *
 * 詳細: docs/02_実装計画/cities-revival-plan.md §2.2
 */
export const STAGE_1_DESIGNATED_CITIES: Array<{ areaCode: string; cityCode: string }> = [
    { areaCode: "01000", cityCode: "01100" }, // 札幌市
    { areaCode: "04000", cityCode: "04100" }, // 仙台市
    { areaCode: "11000", cityCode: "11100" }, // さいたま市
    { areaCode: "12000", cityCode: "12100" }, // 千葉市
    { areaCode: "14000", cityCode: "14100" }, // 横浜市
    { areaCode: "14000", cityCode: "14130" }, // 川崎市
    { areaCode: "14000", cityCode: "14150" }, // 相模原市
    { areaCode: "15000", cityCode: "15100" }, // 新潟市
    { areaCode: "22000", cityCode: "22100" }, // 静岡市
    { areaCode: "22000", cityCode: "22130" }, // 浜松市
    { areaCode: "23000", cityCode: "23100" }, // 名古屋市
    { areaCode: "26000", cityCode: "26100" }, // 京都市
    { areaCode: "27000", cityCode: "27100" }, // 大阪市
    { areaCode: "27000", cityCode: "27140" }, // 堺市
    { areaCode: "28000", cityCode: "28100" }, // 神戸市
    { areaCode: "33000", cityCode: "33100" }, // 岡山市
    { areaCode: "34000", cityCode: "34100" }, // 広島市
    { areaCode: "40000", cityCode: "40100" }, // 北九州市
    { areaCode: "40000", cityCode: "40130" }, // 福岡市
    { areaCode: "43000", cityCode: "43100" }, // 熊本市
];

/**
 * Phase 1 S2: 強みデータ豊富な中核市・県庁所在地 60 市
 *
 * 選定基準: area_profiles の strength count 上位、level=2 (区を除く)、S1 と重複なし。
 * 中核市 + 県庁所在地 + 強み 7+ 件持つ中規模都市の組み合わせ。
 *
 * 詳細: docs/02_実装計画/cities-revival-plan.md §2.2 Stage S2
 */
export const STAGE_2_CITIES: Array<{ areaCode: string; cityCode: string }> = [
    { areaCode: "16000", cityCode: "16202" }, // 富山県 高岡市
    { areaCode: "18000", cityCode: "18201" }, // 福井県 福井市
    { areaCode: "31000", cityCode: "31203" }, // 鳥取県 倉吉市
    { areaCode: "03000", cityCode: "03201" }, // 岩手県 盛岡市
    { areaCode: "19000", cityCode: "19201" }, // 山梨県 甲府市
    { areaCode: "31000", cityCode: "31201" }, // 鳥取県 鳥取市
    { areaCode: "31000", cityCode: "31202" }, // 鳥取県 米子市
    { areaCode: "37000", cityCode: "37201" }, // 香川県 高松市
    { areaCode: "41000", cityCode: "41201" }, // 佐賀県 佐賀市
    { areaCode: "05000", cityCode: "05201" }, // 秋田県 秋田市
    { areaCode: "05000", cityCode: "05203" }, // 秋田県 横手市
    { areaCode: "06000", cityCode: "06201" }, // 山形県 山形市
    { areaCode: "16000", cityCode: "16201" }, // 富山県 富山市
    { areaCode: "17000", cityCode: "17201" }, // 石川県 金沢市
    { areaCode: "18000", cityCode: "18202" }, // 福井県 敦賀市
    { areaCode: "18000", cityCode: "18207" }, // 福井県 鯖江市
    { areaCode: "18000", cityCode: "18209" }, // 福井県 越前市
    { areaCode: "25000", cityCode: "25201" }, // 滋賀県 大津市
    { areaCode: "32000", cityCode: "32201" }, // 島根県 松江市
    { areaCode: "32000", cityCode: "32204" }, // 島根県 益田市
    { areaCode: "36000", cityCode: "36201" }, // 徳島県 徳島市
    { areaCode: "36000", cityCode: "36202" }, // 徳島県 鳴門市
    { areaCode: "37000", cityCode: "37203" }, // 香川県 坂出市
    { areaCode: "42000", cityCode: "42201" }, // 長崎県 長崎市
    { areaCode: "03000", cityCode: "03206" }, // 岩手県 北上市
    { areaCode: "05000", cityCode: "05212" }, // 秋田県 大仙市
    { areaCode: "06000", cityCode: "06202" }, // 山形県 米沢市
    { areaCode: "06000", cityCode: "06203" }, // 山形県 鶴岡市
    { areaCode: "08000", cityCode: "08202" }, // 茨城県 日立市
    { areaCode: "09000", cityCode: "09201" }, // 栃木県 宇都宮市
    { areaCode: "09000", cityCode: "09202" }, // 栃木県 足利市
    { areaCode: "16000", cityCode: "16211" }, // 富山県 射水市
    { areaCode: "18000", cityCode: "18205" }, // 福井県 大野市
    { areaCode: "21000", cityCode: "21201" }, // 岐阜県 岐阜市
    { areaCode: "21000", cityCode: "21203" }, // 岐阜県 高山市
    { areaCode: "24000", cityCode: "24201" }, // 三重県 津市
    { areaCode: "25000", cityCode: "25204" }, // 滋賀県 近江八幡市
    { areaCode: "29000", cityCode: "29205" }, // 奈良県 橿原市
    { areaCode: "29000", cityCode: "29441" }, // 奈良県 吉野町
    { areaCode: "30000", cityCode: "30207" }, // 和歌山県 新宮市
    { areaCode: "31000", cityCode: "31402" }, // 鳥取県 日野町
    { areaCode: "32000", cityCode: "32202" }, // 島根県 浜田市
    { areaCode: "32000", cityCode: "32203" }, // 島根県 出雲市
    { areaCode: "33000", cityCode: "33202" }, // 岡山県 倉敷市
    { areaCode: "35000", cityCode: "35208" }, // 山口県 岩国市
    { areaCode: "35000", cityCode: "35215" }, // 山口県 周南市
    { areaCode: "36000", cityCode: "36203" }, // 徳島県 小松島市
    { areaCode: "36000", cityCode: "36204" }, // 徳島県 阿南市
    { areaCode: "36000", cityCode: "36387" }, // 徳島県 美波町
    { areaCode: "36000", cityCode: "36388" }, // 徳島県 海陽町
    { areaCode: "37000", cityCode: "37205" }, // 香川県 観音寺市
    { areaCode: "38000", cityCode: "38201" }, // 愛媛県 松山市
    { areaCode: "38000", cityCode: "38203" }, // 愛媛県 宇和島市
    { areaCode: "38000", cityCode: "38205" }, // 愛媛県 新居浜市
    { areaCode: "38000", cityCode: "38207" }, // 愛媛県 大洲市
    { areaCode: "41000", cityCode: "41202" }, // 佐賀県 唐津市
    { areaCode: "44000", cityCode: "44201" }, // 大分県 大分市
    { areaCode: "45000", cityCode: "45206" }, // 宮崎県 日向市
    { areaCode: "01000", cityCode: "01204" }, // 北海道 旭川市
    { areaCode: "02000", cityCode: "02201" }, // 青森県 青森市
];

/**
 * Phase 1 で SSG 化する全市区町村 (S1 + S2 = 80 市)
 */
export const PHASE_1_SSG_CITIES: Array<{ areaCode: string; cityCode: string }> = [
    ...STAGE_1_DESIGNATED_CITIES,
    ...STAGE_2_CITIES,
];
