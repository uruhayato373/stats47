/**
 * Phase 1 S1: SSG 対象の政令指定都市 20 市
 *
 * area_profiles に強みデータが揃っており、indexed 化の効果が高い。
 *
 * 詳細: docs/02_実装計画/cities-revival-plan.md §2.2
 */
const STAGE_1_DESIGNATED_CITIES: Array<{ areaCode: string; cityCode: string }> = [
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
const STAGE_2_CITIES: Array<{ areaCode: string; cityCode: string }> = [
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
 * Phase 1 S3: 強み 5+ 件持つ中規模都市 280 市
 *
 * 選定基準: area_profiles strength count >= 5、level=2 (区を除く)、S1/S2 と重複なし。
 * 「県内 top 5 入り指標が 5 個以上ある」= 地域的個性が強い都市。
 *
 * 詳細: docs/02_実装計画/cities-revival-plan.md §2.2 Stage S3
 */
const STAGE_3_CITIES: Array<{ areaCode: string; cityCode: string }> = [
    { areaCode: "02000", cityCode: "02202" }, // 青森県 弘前市 (strengths: 7)
    { areaCode: "02000", cityCode: "02206" }, // 青森県 十和田市 (strengths: 7)
    { areaCode: "03000", cityCode: "03211" }, // 岩手県 釜石市 (strengths: 7)
    { areaCode: "03000", cityCode: "03215" }, // 岩手県 奥州市 (strengths: 7)
    { areaCode: "05000", cityCode: "05202" }, // 秋田県 能代市 (strengths: 7)
    { areaCode: "05000", cityCode: "05204" }, // 秋田県 大館市 (strengths: 7)
    { areaCode: "05000", cityCode: "05207" }, // 秋田県 湯沢市 (strengths: 7)
    { areaCode: "05000", cityCode: "05210" }, // 秋田県 由利本荘市 (strengths: 7)
    { areaCode: "06000", cityCode: "06204" }, // 山形県 酒田市 (strengths: 7)
    { areaCode: "06000", cityCode: "06210" }, // 山形県 天童市 (strengths: 7)
    { areaCode: "07000", cityCode: "07201" }, // 福島県 福島市 (strengths: 7)
    { areaCode: "07000", cityCode: "07203" }, // 福島県 郡山市 (strengths: 7)
    { areaCode: "07000", cityCode: "07204" }, // 福島県 いわき市 (strengths: 7)
    { areaCode: "08000", cityCode: "08201" }, // 茨城県 水戸市 (strengths: 7)
    { areaCode: "08000", cityCode: "08214" }, // 茨城県 高萩市 (strengths: 7)
    { areaCode: "09000", cityCode: "09206" }, // 栃木県 日光市 (strengths: 7)
    { areaCode: "10000", cityCode: "10202" }, // 群馬県 高崎市 (strengths: 7)
    { areaCode: "10000", cityCode: "10205" }, // 群馬県 太田市 (strengths: 7)
    { areaCode: "13000", cityCode: "13100" }, // 東京都 特別区部 (strengths: 7)
    { areaCode: "16000", cityCode: "16208" }, // 富山県 砺波市 (strengths: 7)
    { areaCode: "17000", cityCode: "17203" }, // 石川県 小松市 (strengths: 7)
    { areaCode: "17000", cityCode: "17206" }, // 石川県 加賀市 (strengths: 7)
    { areaCode: "18000", cityCode: "18501" }, // 福井県 若狭町 (strengths: 7)
    { areaCode: "20000", cityCode: "20201" }, // 長野県 長野市 (strengths: 7)
    { areaCode: "20000", cityCode: "20203" }, // 長野県 上田市 (strengths: 7)
    { areaCode: "24000", cityCode: "24202" }, // 三重県 四日市市 (strengths: 7)
    { areaCode: "24000", cityCode: "24203" }, // 三重県 伊勢市 (strengths: 7)
    { areaCode: "25000", cityCode: "25203" }, // 滋賀県 長浜市 (strengths: 7)
    { areaCode: "25000", cityCode: "25209" }, // 滋賀県 甲賀市 (strengths: 7)
    { areaCode: "25000", cityCode: "25441" }, // 滋賀県 豊郷町 (strengths: 7)
    { areaCode: "28000", cityCode: "28201" }, // 兵庫県 姫路市 (strengths: 7)
    { areaCode: "29000", cityCode: "29201" }, // 奈良県 奈良市 (strengths: 7)
    { areaCode: "29000", cityCode: "29203" }, // 奈良県 大和郡山市 (strengths: 7)
    { areaCode: "29000", cityCode: "29204" }, // 奈良県 天理市 (strengths: 7)
    { areaCode: "29000", cityCode: "29209" }, // 奈良県 生駒市 (strengths: 7)
    { areaCode: "29000", cityCode: "29425" }, // 奈良県 王寺町 (strengths: 7)
    { areaCode: "29000", cityCode: "29446" }, // 奈良県 天川村 (strengths: 7)
    { areaCode: "29000", cityCode: "29451" }, // 奈良県 上北山村 (strengths: 7)
    { areaCode: "29000", cityCode: "29452" }, // 奈良県 川上村 (strengths: 7)
    { areaCode: "30000", cityCode: "30201" }, // 和歌山県 和歌山市 (strengths: 7)
    { areaCode: "31000", cityCode: "31204" }, // 鳥取県 境港市 (strengths: 7)
    { areaCode: "31000", cityCode: "31384" }, // 鳥取県 日吉津村 (strengths: 7)
    { areaCode: "32000", cityCode: "32205" }, // 島根県 大田市 (strengths: 7)
    { areaCode: "32000", cityCode: "32209" }, // 島根県 雲南市 (strengths: 7)
    { areaCode: "32000", cityCode: "32526" }, // 島根県 西ノ島町 (strengths: 7)
    { areaCode: "32000", cityCode: "32528" }, // 島根県 隠岐の島町 (strengths: 7)
    { areaCode: "34000", cityCode: "34202" }, // 広島県 呉市 (strengths: 7)
    { areaCode: "35000", cityCode: "35201" }, // 山口県 下関市 (strengths: 7)
    { areaCode: "35000", cityCode: "35202" }, // 山口県 宇部市 (strengths: 7)
    { areaCode: "35000", cityCode: "35203" }, // 山口県 山口市 (strengths: 7)
    { areaCode: "36000", cityCode: "36205" }, // 徳島県 吉野川市 (strengths: 7)
    { areaCode: "36000", cityCode: "36401" }, // 徳島県 松茂町 (strengths: 7)
    { areaCode: "36000", cityCode: "36405" }, // 徳島県 上板町 (strengths: 7)
    { areaCode: "36000", cityCode: "36468" }, // 徳島県 つるぎ町 (strengths: 7)
    { areaCode: "36000", cityCode: "36489" }, // 徳島県 東みよし町 (strengths: 7)
    { areaCode: "37000", cityCode: "37202" }, // 香川県 丸亀市 (strengths: 7)
    { areaCode: "37000", cityCode: "37204" }, // 香川県 善通寺市 (strengths: 7)
    { areaCode: "37000", cityCode: "37322" }, // 香川県 土庄町 (strengths: 7)
    { areaCode: "37000", cityCode: "37386" }, // 香川県 宇多津町 (strengths: 7)
    { areaCode: "37000", cityCode: "37404" }, // 香川県 多度津町 (strengths: 7)
    { areaCode: "41000", cityCode: "41203" }, // 佐賀県 鳥栖市 (strengths: 7)
    { areaCode: "41000", cityCode: "41206" }, // 佐賀県 武雄市 (strengths: 7)
    { areaCode: "42000", cityCode: "42203" }, // 長崎県 島原市 (strengths: 7)
    { areaCode: "43000", cityCode: "43215" }, // 熊本県 天草市 (strengths: 7)
    { areaCode: "44000", cityCode: "44202" }, // 大分県 別府市 (strengths: 7)
    { areaCode: "44000", cityCode: "44204" }, // 大分県 日田市 (strengths: 7)
    { areaCode: "44000", cityCode: "44208" }, // 大分県 竹田市 (strengths: 7)
    { areaCode: "44000", cityCode: "44462" }, // 大分県 玖珠町 (strengths: 7)
    { areaCode: "45000", cityCode: "45201" }, // 宮崎県 宮崎市 (strengths: 7)
    { areaCode: "45000", cityCode: "45202" }, // 宮崎県 都城市 (strengths: 7)
    { areaCode: "45000", cityCode: "45204" }, // 宮崎県 日南市 (strengths: 7)
    { areaCode: "46000", cityCode: "46201" }, // 鹿児島県 鹿児島市 (strengths: 7)
    { areaCode: "47000", cityCode: "47213" }, // 沖縄県 うるま市 (strengths: 7)
    { areaCode: "02000", cityCode: "02205" }, // 青森県 五所川原市 (strengths: 6)
    { areaCode: "05000", cityCode: "05215" }, // 秋田県 仙北市 (strengths: 6)
    { areaCode: "05000", cityCode: "05361" }, // 秋田県 五城目町 (strengths: 6)
    { areaCode: "05000", cityCode: "05366" }, // 秋田県 井川町 (strengths: 6)
    { areaCode: "05000", cityCode: "05368" }, // 秋田県 大潟村 (strengths: 6)
    { areaCode: "06000", cityCode: "06205" }, // 山形県 新庄市 (strengths: 6)
    { areaCode: "06000", cityCode: "06209" }, // 山形県 長井市 (strengths: 6)
    { areaCode: "07000", cityCode: "07202" }, // 福島県 会津若松市 (strengths: 6)
    { areaCode: "08000", cityCode: "08203" }, // 茨城県 土浦市 (strengths: 6)
    { areaCode: "08000", cityCode: "08236" }, // 茨城県 小美玉市 (strengths: 6)
    { areaCode: "09000", cityCode: "09204" }, // 栃木県 佐野市 (strengths: 6)
    { areaCode: "09000", cityCode: "09205" }, // 栃木県 鹿沼市 (strengths: 6)
    { areaCode: "09000", cityCode: "09211" }, // 栃木県 矢板市 (strengths: 6)
    { areaCode: "10000", cityCode: "10203" }, // 群馬県 桐生市 (strengths: 6)
    { areaCode: "10000", cityCode: "10208" }, // 群馬県 渋川市 (strengths: 6)
    { areaCode: "11000", cityCode: "11222" }, // 埼玉県 越谷市 (strengths: 6)
    { areaCode: "15000", cityCode: "15202" }, // 新潟県 長岡市 (strengths: 6)
    { areaCode: "16000", cityCode: "16204" }, // 富山県 魚津市 (strengths: 6)
    { areaCode: "16000", cityCode: "16209" }, // 富山県 小矢部市 (strengths: 6)
    { areaCode: "17000", cityCode: "17212" }, // 石川県 野々市市 (strengths: 6)
    { areaCode: "17000", cityCode: "17461" }, // 石川県 穴水町 (strengths: 6)
    { areaCode: "18000", cityCode: "18204" }, // 福井県 小浜市 (strengths: 6)
    { areaCode: "18000", cityCode: "18210" }, // 福井県 坂井市 (strengths: 6)
    { areaCode: "18000", cityCode: "18322" }, // 福井県 永平寺町 (strengths: 6)
    { areaCode: "18000", cityCode: "18382" }, // 福井県 池田町 (strengths: 6)
    { areaCode: "20000", cityCode: "20205" }, // 長野県 飯田市 (strengths: 6)
    { areaCode: "20000", cityCode: "20217" }, // 長野県 佐久市 (strengths: 6)
    { areaCode: "21000", cityCode: "21220" }, // 岐阜県 下呂市 (strengths: 6)
    { areaCode: "21000", cityCode: "21361" }, // 岐阜県 垂井町 (strengths: 6)
    { areaCode: "23000", cityCode: "23211" }, // 愛知県 豊田市 (strengths: 6)
    { areaCode: "24000", cityCode: "24204" }, // 三重県 松阪市 (strengths: 6)
    { areaCode: "24000", cityCode: "24212" }, // 三重県 熊野市 (strengths: 6)
    { areaCode: "25000", cityCode: "25202" }, // 滋賀県 彦根市 (strengths: 6)
    { areaCode: "25000", cityCode: "25425" }, // 滋賀県 愛荘町 (strengths: 6)
    { areaCode: "28000", cityCode: "28204" }, // 兵庫県 西宮市 (strengths: 6)
    { areaCode: "29000", cityCode: "29202" }, // 奈良県 大和高田市 (strengths: 6)
    { areaCode: "29000", cityCode: "29208" }, // 奈良県 御所市 (strengths: 6)
    { areaCode: "29000", cityCode: "29212" }, // 奈良県 宇陀市 (strengths: 6)
    { areaCode: "29000", cityCode: "29322" }, // 奈良県 山添村 (strengths: 6)
    { areaCode: "29000", cityCode: "29342" }, // 奈良県 平群町 (strengths: 6)
    { areaCode: "29000", cityCode: "29361" }, // 奈良県 川西町 (strengths: 6)
    { areaCode: "29000", cityCode: "29363" }, // 奈良県 田原本町 (strengths: 6)
    { areaCode: "29000", cityCode: "29385" }, // 奈良県 曽爾村 (strengths: 6)
    { areaCode: "29000", cityCode: "29402" }, // 奈良県 明日香村 (strengths: 6)
    { areaCode: "29000", cityCode: "29427" }, // 奈良県 河合町 (strengths: 6)
    { areaCode: "29000", cityCode: "29442" }, // 奈良県 大淀町 (strengths: 6)
    { areaCode: "29000", cityCode: "29449" }, // 奈良県 十津川村 (strengths: 6)
    { areaCode: "29000", cityCode: "29453" }, // 奈良県 東吉野村 (strengths: 6)
    { areaCode: "30000", cityCode: "30202" }, // 和歌山県 海南市 (strengths: 6)
    { areaCode: "30000", cityCode: "30203" }, // 和歌山県 橋本市 (strengths: 6)
    { areaCode: "30000", cityCode: "30205" }, // 和歌山県 御坊市 (strengths: 6)
    { areaCode: "30000", cityCode: "30206" }, // 和歌山県 田辺市 (strengths: 6)
    { areaCode: "31000", cityCode: "31302" }, // 鳥取県 岩美町 (strengths: 6)
    { areaCode: "31000", cityCode: "31364" }, // 鳥取県 三朝町 (strengths: 6)
    { areaCode: "31000", cityCode: "31372" }, // 鳥取県 北栄町 (strengths: 6)
    { areaCode: "31000", cityCode: "31401" }, // 鳥取県 日南町 (strengths: 6)
    { areaCode: "32000", cityCode: "32501" }, // 島根県 津和野町 (strengths: 6)
    { areaCode: "32000", cityCode: "32505" }, // 島根県 吉賀町 (strengths: 6)
    { areaCode: "32000", cityCode: "32525" }, // 島根県 海士町 (strengths: 6)
    { areaCode: "33000", cityCode: "33203" }, // 岡山県 津山市 (strengths: 6)
    { areaCode: "35000", cityCode: "35204" }, // 山口県 萩市 (strengths: 6)
    { areaCode: "35000", cityCode: "35207" }, // 山口県 下松市 (strengths: 6)
    { areaCode: "36000", cityCode: "36207" }, // 徳島県 美馬市 (strengths: 6)
    { areaCode: "36000", cityCode: "36208" }, // 徳島県 三好市 (strengths: 6)
    { areaCode: "36000", cityCode: "36302" }, // 徳島県 上勝町 (strengths: 6)
    { areaCode: "36000", cityCode: "36321" }, // 徳島県 佐那河内村 (strengths: 6)
    { areaCode: "36000", cityCode: "36341" }, // 徳島県 石井町 (strengths: 6)
    { areaCode: "36000", cityCode: "36342" }, // 徳島県 神山町 (strengths: 6)
    { areaCode: "36000", cityCode: "36383" }, // 徳島県 牟岐町 (strengths: 6)
    { areaCode: "36000", cityCode: "36402" }, // 徳島県 北島町 (strengths: 6)
    { areaCode: "36000", cityCode: "36403" }, // 徳島県 藍住町 (strengths: 6)
    { areaCode: "37000", cityCode: "37208" }, // 香川県 三豊市 (strengths: 6)
    { areaCode: "37000", cityCode: "37324" }, // 香川県 小豆島町 (strengths: 6)
    { areaCode: "37000", cityCode: "37341" }, // 香川県 三木町 (strengths: 6)
    { areaCode: "37000", cityCode: "37403" }, // 香川県 琴平町 (strengths: 6)
    { areaCode: "38000", cityCode: "38202" }, // 愛媛県 今治市 (strengths: 6)
    { areaCode: "38000", cityCode: "38204" }, // 愛媛県 八幡浜市 (strengths: 6)
    { areaCode: "38000", cityCode: "38206" }, // 愛媛県 西条市 (strengths: 6)
    { areaCode: "39000", cityCode: "39201" }, // 高知県 高知市 (strengths: 6)
    { areaCode: "39000", cityCode: "39210" }, // 高知県 四万十市 (strengths: 6)
    { areaCode: "41000", cityCode: "41205" }, // 佐賀県 伊万里市 (strengths: 6)
    { areaCode: "41000", cityCode: "41209" }, // 佐賀県 嬉野市 (strengths: 6)
    { areaCode: "42000", cityCode: "42202" }, // 長崎県 佐世保市 (strengths: 6)
    { areaCode: "42000", cityCode: "42204" }, // 長崎県 諫早市 (strengths: 6)
    { areaCode: "42000", cityCode: "42205" }, // 長崎県 大村市 (strengths: 6)
    { areaCode: "43000", cityCode: "43203" }, // 熊本県 人吉市 (strengths: 6)
    { areaCode: "44000", cityCode: "44203" }, // 大分県 中津市 (strengths: 6)
    { areaCode: "44000", cityCode: "44213" }, // 大分県 由布市 (strengths: 6)
    { areaCode: "45000", cityCode: "45205" }, // 宮崎県 小林市 (strengths: 6)
    { areaCode: "46000", cityCode: "46215" }, // 鹿児島県 薩摩川内市 (strengths: 6)
    { areaCode: "02000", cityCode: "02203" }, // 青森県 八戸市 (strengths: 5)
    { areaCode: "02000", cityCode: "02207" }, // 青森県 三沢市 (strengths: 5)
    { areaCode: "02000", cityCode: "02402" }, // 青森県 七戸町 (strengths: 5)
    { areaCode: "03000", cityCode: "03207" }, // 岩手県 久慈市 (strengths: 5)
    { areaCode: "03000", cityCode: "03209" }, // 岩手県 一関市 (strengths: 5)
    { areaCode: "03000", cityCode: "03402" }, // 岩手県 平泉町 (strengths: 5)
    { areaCode: "04000", cityCode: "04215" }, // 宮城県 大崎市 (strengths: 5)
    { areaCode: "04000", cityCode: "04321" }, // 宮城県 大河原町 (strengths: 5)
    { areaCode: "04000", cityCode: "04421" }, // 宮城県 大和町 (strengths: 5)
    { areaCode: "05000", cityCode: "05206" }, // 秋田県 男鹿市 (strengths: 5)
    { areaCode: "05000", cityCode: "05211" }, // 秋田県 潟上市 (strengths: 5)
    { areaCode: "05000", cityCode: "05213" }, // 秋田県 北秋田市 (strengths: 5)
    { areaCode: "05000", cityCode: "05214" }, // 秋田県 にかほ市 (strengths: 5)
    { areaCode: "05000", cityCode: "05303" }, // 秋田県 小坂町 (strengths: 5)
    { areaCode: "05000", cityCode: "05346" }, // 秋田県 藤里町 (strengths: 5)
    { areaCode: "05000", cityCode: "05349" }, // 秋田県 八峰町 (strengths: 5)
    { areaCode: "05000", cityCode: "05363" }, // 秋田県 八郎潟町 (strengths: 5)
    { areaCode: "05000", cityCode: "05434" }, // 秋田県 美郷町 (strengths: 5)
    { areaCode: "05000", cityCode: "05464" }, // 秋田県 東成瀬村 (strengths: 5)
    { areaCode: "06000", cityCode: "06206" }, // 山形県 寒河江市 (strengths: 5)
    { areaCode: "06000", cityCode: "06213" }, // 山形県 南陽市 (strengths: 5)
    { areaCode: "08000", cityCode: "08205" }, // 茨城県 石岡市 (strengths: 5)
    { areaCode: "08000", cityCode: "08220" }, // 茨城県 つくば市 (strengths: 5)
    { areaCode: "08000", cityCode: "08232" }, // 茨城県 神栖市 (strengths: 5)
    { areaCode: "09000", cityCode: "09208" }, // 栃木県 小山市 (strengths: 5)
    { areaCode: "09000", cityCode: "09216" }, // 栃木県 下野市 (strengths: 5)
    { areaCode: "09000", cityCode: "09344" }, // 栃木県 市貝町 (strengths: 5)
    { areaCode: "09000", cityCode: "09407" }, // 栃木県 那須町 (strengths: 5)
    { areaCode: "10000", cityCode: "10201" }, // 群馬県 前橋市 (strengths: 5)
    { areaCode: "10000", cityCode: "10204" }, // 群馬県 伊勢崎市 (strengths: 5)
    { areaCode: "11000", cityCode: "11201" }, // 埼玉県 川越市 (strengths: 5)
    { areaCode: "12000", cityCode: "12204" }, // 千葉県 船橋市 (strengths: 5)
    { areaCode: "12000", cityCode: "12223" }, // 千葉県 鴨川市 (strengths: 5)
    { areaCode: "15000", cityCode: "15205" }, // 新潟県 柏崎市 (strengths: 5)
    { areaCode: "15000", cityCode: "15213" }, // 新潟県 燕市 (strengths: 5)
    { areaCode: "15000", cityCode: "15222" }, // 新潟県 上越市 (strengths: 5)
    { areaCode: "15000", cityCode: "15461" }, // 新潟県 湯沢町 (strengths: 5)
    { areaCode: "16000", cityCode: "16205" }, // 富山県 氷見市 (strengths: 5)
    { areaCode: "16000", cityCode: "16343" }, // 富山県 朝日町 (strengths: 5)
    { areaCode: "17000", cityCode: "17202" }, // 石川県 七尾市 (strengths: 5)
    { areaCode: "18000", cityCode: "18206" }, // 福井県 勝山市 (strengths: 5)
    { areaCode: "18000", cityCode: "18208" }, // 福井県 あわら市 (strengths: 5)
    { areaCode: "18000", cityCode: "18423" }, // 福井県 越前町 (strengths: 5)
    { areaCode: "18000", cityCode: "18483" }, // 福井県 おおい町 (strengths: 5)
    { areaCode: "19000", cityCode: "19211" }, // 山梨県 笛吹市 (strengths: 5)
    { areaCode: "20000", cityCode: "20202" }, // 長野県 松本市 (strengths: 5)
    { areaCode: "20000", cityCode: "20220" }, // 長野県 安曇野市 (strengths: 5)
    { areaCode: "21000", cityCode: "21202" }, // 岐阜県 大垣市 (strengths: 5)
    { areaCode: "21000", cityCode: "21219" }, // 岐阜県 郡上市 (strengths: 5)
    { areaCode: "24000", cityCode: "24205" }, // 三重県 桑名市 (strengths: 5)
    { areaCode: "24000", cityCode: "24207" }, // 三重県 鈴鹿市 (strengths: 5)
    { areaCode: "24000", cityCode: "24208" }, // 三重県 名張市 (strengths: 5)
    { areaCode: "24000", cityCode: "24209" }, // 三重県 尾鷲市 (strengths: 5)
    { areaCode: "25000", cityCode: "25206" }, // 滋賀県 草津市 (strengths: 5)
    { areaCode: "25000", cityCode: "25213" }, // 滋賀県 東近江市 (strengths: 5)
    { areaCode: "27000", cityCode: "27203" }, // 大阪府 豊中市 (strengths: 5)
    { areaCode: "29000", cityCode: "29206" }, // 奈良県 桜井市 (strengths: 5)
    { areaCode: "29000", cityCode: "29207" }, // 奈良県 五條市 (strengths: 5)
    { areaCode: "29000", cityCode: "29210" }, // 奈良県 香芝市 (strengths: 5)
    { areaCode: "29000", cityCode: "29211" }, // 奈良県 葛城市 (strengths: 5)
    { areaCode: "29000", cityCode: "29343" }, // 奈良県 三郷町 (strengths: 5)
    { areaCode: "29000", cityCode: "29344" }, // 奈良県 斑鳩町 (strengths: 5)
    { areaCode: "29000", cityCode: "29345" }, // 奈良県 安堵町 (strengths: 5)
    { areaCode: "29000", cityCode: "29362" }, // 奈良県 三宅町 (strengths: 5)
    { areaCode: "29000", cityCode: "29386" }, // 奈良県 御杖村 (strengths: 5)
    { areaCode: "29000", cityCode: "29401" }, // 奈良県 高取町 (strengths: 5)
    { areaCode: "29000", cityCode: "29424" }, // 奈良県 上牧町 (strengths: 5)
    { areaCode: "29000", cityCode: "29426" }, // 奈良県 広陵町 (strengths: 5)
    { areaCode: "29000", cityCode: "29443" }, // 奈良県 下市町 (strengths: 5)
    { areaCode: "29000", cityCode: "29444" }, // 奈良県 黒滝村 (strengths: 5)
    { areaCode: "29000", cityCode: "29447" }, // 奈良県 野迫川村 (strengths: 5)
    { areaCode: "29000", cityCode: "29450" }, // 奈良県 下北山村 (strengths: 5)
    { areaCode: "30000", cityCode: "30208" }, // 和歌山県 紀の川市 (strengths: 5)
    { areaCode: "30000", cityCode: "30209" }, // 和歌山県 岩出市 (strengths: 5)
    { areaCode: "30000", cityCode: "30344" }, // 和歌山県 高野町 (strengths: 5)
    { areaCode: "30000", cityCode: "30366" }, // 和歌山県 有田川町 (strengths: 5)
    { areaCode: "31000", cityCode: "31325" }, // 鳥取県 若桜町 (strengths: 5)
    { areaCode: "31000", cityCode: "31328" }, // 鳥取県 智頭町 (strengths: 5)
    { areaCode: "31000", cityCode: "31371" }, // 鳥取県 琴浦町 (strengths: 5)
    { areaCode: "31000", cityCode: "31389" }, // 鳥取県 南部町 (strengths: 5)
    { areaCode: "31000", cityCode: "31403" }, // 鳥取県 江府町 (strengths: 5)
    { areaCode: "32000", cityCode: "32206" }, // 島根県 安来市 (strengths: 5)
    { areaCode: "32000", cityCode: "32207" }, // 島根県 江津市 (strengths: 5)
    { areaCode: "32000", cityCode: "32386" }, // 島根県 飯南町 (strengths: 5)
    { areaCode: "32000", cityCode: "32448" }, // 島根県 美郷町 (strengths: 5)
    { areaCode: "32000", cityCode: "32527" }, // 島根県 知夫村 (strengths: 5)
    { areaCode: "33000", cityCode: "33214" }, // 岡山県 真庭市 (strengths: 5)
    { areaCode: "34000", cityCode: "34214" }, // 広島県 安芸高田市 (strengths: 5)
    { areaCode: "35000", cityCode: "35211" }, // 山口県 長門市 (strengths: 5)
    { areaCode: "35000", cityCode: "35212" }, // 山口県 柳井市 (strengths: 5)
    { areaCode: "36000", cityCode: "36206" }, // 徳島県 阿波市 (strengths: 5)
    { areaCode: "36000", cityCode: "36301" }, // 徳島県 勝浦町 (strengths: 5)
    { areaCode: "36000", cityCode: "36368" }, // 徳島県 那賀町 (strengths: 5)
    { areaCode: "36000", cityCode: "36404" }, // 徳島県 板野町 (strengths: 5)
    { areaCode: "37000", cityCode: "37207" }, // 香川県 東かがわ市 (strengths: 5)
    { areaCode: "37000", cityCode: "37364" }, // 香川県 直島町 (strengths: 5)
    { areaCode: "37000", cityCode: "37406" }, // 香川県 まんのう町 (strengths: 5)
    { areaCode: "38000", cityCode: "38213" }, // 愛媛県 四国中央市 (strengths: 5)
    { areaCode: "39000", cityCode: "39206" }, // 高知県 須崎市 (strengths: 5)
    { areaCode: "41000", cityCode: "41345" }, // 佐賀県 上峰町 (strengths: 5)
    { areaCode: "41000", cityCode: "41424" }, // 佐賀県 江北町 (strengths: 5)
    { areaCode: "41000", cityCode: "41425" }, // 佐賀県 白石町 (strengths: 5)
    { areaCode: "42000", cityCode: "42211" }, // 長崎県 五島市 (strengths: 5)
    { areaCode: "43000", cityCode: "43423" }, // 熊本県 南小国町 (strengths: 5)
    { areaCode: "43000", cityCode: "43428" }, // 熊本県 高森町 (strengths: 5)
    { areaCode: "43000", cityCode: "43442" }, // 熊本県 嘉島町 (strengths: 5)
    { areaCode: "44000", cityCode: "44205" }, // 大分県 佐伯市 (strengths: 5)
    { areaCode: "44000", cityCode: "44206" }, // 大分県 臼杵市 (strengths: 5)
    { areaCode: "44000", cityCode: "44209" }, // 大分県 豊後高田市 (strengths: 5)
    { areaCode: "44000", cityCode: "44211" }, // 大分県 宇佐市 (strengths: 5)
    { areaCode: "45000", cityCode: "45203" }, // 宮崎県 延岡市 (strengths: 5)
    { areaCode: "45000", cityCode: "45207" }, // 宮崎県 串間市 (strengths: 5)
    { areaCode: "45000", cityCode: "45382" }, // 宮崎県 国富町 (strengths: 5)
    { areaCode: "45000", cityCode: "45403" }, // 宮崎県 西米良村 (strengths: 5)
    { areaCode: "46000", cityCode: "46218" }, // 鹿児島県 霧島市 (strengths: 5)
    { areaCode: "47000", cityCode: "47210" }, // 沖縄県 糸満市 (strengths: 5)
    { areaCode: "47000", cityCode: "47350" }, // 沖縄県 南風原町 (strengths: 5)
];

/**
 * Phase 1 で SSG 化する全市区町村 (S1 + S2 + S3 = 360 cities)
 */
export const PHASE_1_SSG_CITIES: Array<{ areaCode: string; cityCode: string }> = [
    ...STAGE_1_DESIGNATED_CITIES,
    ...STAGE_2_CITIES,
    ...STAGE_3_CITIES,
];
