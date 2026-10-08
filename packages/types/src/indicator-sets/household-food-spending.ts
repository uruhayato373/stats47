// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: data/themes/catalogs/household-food-spending.json
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const HOUSEHOLD_FOOD_SPENDING_SET: IndicatorSet = {
  "key": "household-food-spending",
  "title": "食卓と家計の支出",
  "description": "都道府県庁所在市の二人以上世帯について、食料費・外食・主食・魚介・肉・野菜・果物・飲料・酒類などの品目別の支出額と購入量を比べます。県全体の値ではなく、県庁所在市の家計調査の値です。",
  "category": "lifestyle",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "dining-out-consumption-expenditure",
      "shortLabel": "外食の支出額",
      "role": "primary"
    },
    {
      "rankingKey": "food-expenditure-total",
      "shortLabel": "食料費",
      "role": "primary"
    },
    {
      "rankingKey": "rice-consumption-expenditure",
      "shortLabel": "米の支出額",
      "role": "primary"
    },
    {
      "rankingKey": "bread-consumption-quantity",
      "shortLabel": "パンの購入量",
      "role": "secondary"
    },
    {
      "rankingKey": "confectionery-consumption-expenditure",
      "shortLabel": "菓子類の支出額",
      "role": "secondary"
    },
    {
      "rankingKey": "beef-consumption-quantity",
      "shortLabel": "牛肉の購入量",
      "role": "secondary"
    },
    {
      "rankingKey": "consumption-expenditure-total",
      "shortLabel": "消費支出総額",
      "role": "secondary"
    },
    {
      "rankingKey": "fresh-seafood-consumption-quantity",
      "shortLabel": "生鮮魚介の購入量",
      "role": "secondary"
    },
    {
      "rankingKey": "fresh-vegetables-consumption-quantity",
      "shortLabel": "生鮮野菜の購入量",
      "role": "secondary"
    },
    {
      "rankingKey": "pork-consumption-quantity",
      "shortLabel": "豚肉の購入量",
      "role": "secondary"
    },
    {
      "rankingKey": "apple-consumption-quantity",
      "shortLabel": "りんごの購入量",
      "role": "context"
    },
    {
      "rankingKey": "nhk-fee-consumption-expenditure",
      "shortLabel": "NHK放送受信料の支出額",
      "role": "context"
    },
    {
      "rankingKey": "clam-consumption-expenditure",
      "shortLabel": "あさりの支出額",
      "role": "context"
    },
    {
      "rankingKey": "horse-mackerel-consumption-expenditure",
      "shortLabel": "あじの支出額",
      "role": "context"
    },
    {
      "rankingKey": "squid-consumption-expenditure",
      "shortLabel": "いかの支出額",
      "role": "context"
    },
    {
      "rankingKey": "strawberry-consumption-quantity",
      "shortLabel": "いちごの購入量",
      "role": "context"
    },
    {
      "rankingKey": "sardine-consumption-expenditure",
      "shortLabel": "いわしの支出額",
      "role": "context"
    },
    {
      "rankingKey": "internet-fee-consumption-expenditure",
      "shortLabel": "インターネット接続料の支出額",
      "role": "context"
    },
    {
      "rankingKey": "whisky-consumption-expenditure",
      "shortLabel": "ウイスキーの支出額",
      "role": "context"
    },
    {
      "rankingKey": "shrimp-consumption-expenditure",
      "shortLabel": "えびの支出額",
      "role": "context"
    },
    {
      "rankingKey": "curtain-consumption-expenditure",
      "shortLabel": "カーテンの支出額",
      "role": "context"
    },
    {
      "rankingKey": "oyster-consumption-quantity",
      "shortLabel": "かき(貝)の購入量",
      "role": "context"
    },
    {
      "rankingKey": "katsuobushi-consumption-expenditure",
      "shortLabel": "かつお節・削り節の支出額",
      "role": "context"
    },
    {
      "rankingKey": "katsuobushi-consumption-quantity",
      "shortLabel": "かつお節・削り節の購入量",
      "role": "context"
    },
    {
      "rankingKey": "crab-consumption-expenditure",
      "shortLabel": "かにの支出額",
      "role": "context"
    },
    {
      "rankingKey": "flounder-consumption-expenditure",
      "shortLabel": "かれいの支出額",
      "role": "context"
    },
    {
      "rankingKey": "flounder-consumption-quantity",
      "shortLabel": "かれいの購入量",
      "role": "context"
    },
    {
      "rankingKey": "cabbage-consumption-quantity",
      "shortLabel": "キャベツの購入量",
      "role": "context"
    },
    {
      "rankingKey": "cucumber-consumption-quantity",
      "shortLabel": "きゅうりの購入量",
      "role": "context"
    },
    {
      "rankingKey": "gyoza-frozen-consumption-expenditure",
      "shortLabel": "ぎょうざの支出額",
      "role": "context"
    },
    {
      "rankingKey": "cable-tv-fee-consumption-expenditure",
      "shortLabel": "ケーブルテレビ放送受信料の支出額",
      "role": "context"
    },
    {
      "rankingKey": "coffee-consumption-expenditure",
      "shortLabel": "コーヒーの支出額",
      "role": "context"
    },
    {
      "rankingKey": "coffee-consumption-quantity",
      "shortLabel": "コーヒーの購入量",
      "role": "context"
    },
    {
      "rankingKey": "golf-green-fee-consumption-expenditure",
      "shortLabel": "ゴルフプレー料金の支出額",
      "role": "context"
    },
    {
      "rankingKey": "golf-equipment-consumption-expenditure",
      "shortLabel": "ゴルフ用具の支出額",
      "role": "context"
    },
    {
      "rankingKey": "konbu-consumption-expenditure",
      "shortLabel": "こんぶの支出額",
      "role": "context"
    },
    {
      "rankingKey": "konbu-consumption-quantity",
      "shortLabel": "こんぶの購入量",
      "role": "context"
    },
    {
      "rankingKey": "salmon-consumption-expenditure",
      "shortLabel": "さけの支出額",
      "role": "context"
    },
    {
      "rankingKey": "salmon-consumption-quantity",
      "shortLabel": "さけの購入量",
      "role": "context"
    },
    {
      "rankingKey": "mackerel-consumption-quantity",
      "shortLabel": "さばの購入量",
      "role": "context"
    },
    {
      "rankingKey": "green-beans-consumption-expenditure",
      "shortLabel": "さやまめの支出額",
      "role": "context"
    },
    {
      "rankingKey": "green-beans-consumption-quantity",
      "shortLabel": "さやまめの購入量",
      "role": "context"
    },
    {
      "rankingKey": "saury-consumption-quantity",
      "shortLabel": "さんまの購入量",
      "role": "context"
    },
    {
      "rankingKey": "freshwater-clam-consumption-expenditure",
      "shortLabel": "しじみの支出額",
      "role": "context"
    },
    {
      "rankingKey": "potato-consumption-quantity",
      "shortLabel": "じゃがいもの購入量",
      "role": "context"
    },
    {
      "rankingKey": "jam-consumption-expenditure",
      "shortLabel": "ジャムの支出額",
      "role": "context"
    },
    {
      "rankingKey": "soy-sauce-consumption-quantity",
      "shortLabel": "しょう油の購入量",
      "role": "context"
    },
    {
      "rankingKey": "watermelon-consumption-quantity",
      "shortLabel": "すいかの購入量",
      "role": "context"
    },
    {
      "rankingKey": "sushi-dining-consumption-expenditure",
      "shortLabel": "すし(外食)の支出額",
      "role": "context"
    },
    {
      "rankingKey": "sports-club-fee-consumption-expenditure",
      "shortLabel": "スポーツクラブ使用料の支出額",
      "role": "context"
    },
    {
      "rankingKey": "sports-spectating-consumption-expenditure",
      "shortLabel": "スポーツ観覧料の支出額",
      "role": "context"
    },
    {
      "rankingKey": "daikon-consumption-quantity",
      "shortLabel": "だいこんの購入量",
      "role": "context"
    },
    {
      "rankingKey": "sea-bream-consumption-expenditure",
      "shortLabel": "たいの支出額",
      "role": "context"
    },
    {
      "rankingKey": "sea-bream-consumption-quantity",
      "shortLabel": "たいの購入量",
      "role": "context"
    },
    {
      "rankingKey": "octopus-consumption-expenditure",
      "shortLabel": "たこの支出額",
      "role": "context"
    },
    {
      "rankingKey": "onion-consumption-quantity",
      "shortLabel": "たまねぎの購入量",
      "role": "context"
    },
    {
      "rankingKey": "tomato-consumption-quantity",
      "shortLabel": "トマトの購入量",
      "role": "context"
    },
    {
      "rankingKey": "carrot-consumption-quantity",
      "shortLabel": "にんじんの購入量",
      "role": "context"
    },
    {
      "rankingKey": "necktie-consumption-expenditure",
      "shortLabel": "ネクタイの支出額",
      "role": "context"
    },
    {
      "rankingKey": "necktie-consumption-quantity",
      "shortLabel": "ネクタイの購入量",
      "role": "context"
    },
    {
      "rankingKey": "chinese-cabbage-consumption-expenditure",
      "shortLabel": "はくさいの支出額",
      "role": "context"
    },
    {
      "rankingKey": "chinese-cabbage-consumption-quantity",
      "shortLabel": "はくさいの購入量",
      "role": "context"
    },
    {
      "rankingKey": "butter-consumption-expenditure",
      "shortLabel": "バターの支出額",
      "role": "context"
    },
    {
      "rankingKey": "banana-consumption-quantity",
      "shortLabel": "バナナの購入量",
      "role": "context"
    },
    {
      "rankingKey": "hamburger-consumption-expenditure",
      "shortLabel": "ハンバーガーの支出額",
      "role": "context"
    },
    {
      "rankingKey": "beer-consumption-expenditure",
      "shortLabel": "ビールの支出額",
      "role": "context"
    },
    {
      "rankingKey": "beer-consumption-quantity",
      "shortLabel": "ビールの購入量",
      "role": "context"
    },
    {
      "rankingKey": "spinach-consumption-expenditure",
      "shortLabel": "ほうれんそうの支出額",
      "role": "context"
    },
    {
      "rankingKey": "spinach-consumption-quantity",
      "shortLabel": "ほうれんそうの購入量",
      "role": "context"
    },
    {
      "rankingKey": "scallop-consumption-expenditure",
      "shortLabel": "ほたて貝の支出額",
      "role": "context"
    },
    {
      "rankingKey": "margarine-consumption-expenditure",
      "shortLabel": "マーガリンの支出額",
      "role": "context"
    },
    {
      "rankingKey": "margarine-consumption-quantity",
      "shortLabel": "マーガリンの購入量",
      "role": "context"
    },
    {
      "rankingKey": "mandarin-consumption-quantity",
      "shortLabel": "みかんの購入量",
      "role": "context"
    },
    {
      "rankingKey": "miso-consumption-quantity",
      "shortLabel": "みその購入量",
      "role": "context"
    },
    {
      "rankingKey": "mineral-water-consumption-expenditure",
      "shortLabel": "ミネラルウォーターの支出額",
      "role": "context"
    },
    {
      "rankingKey": "bean-sprouts-consumption-quantity",
      "shortLabel": "もやしの購入量",
      "role": "context"
    },
    {
      "rankingKey": "lettuce-consumption-quantity",
      "shortLabel": "レタスの購入量",
      "role": "context"
    },
    {
      "rankingKey": "lotus-root-consumption-expenditure",
      "shortLabel": "れんこんの支出額",
      "role": "context"
    },
    {
      "rankingKey": "lotus-root-consumption-quantity",
      "shortLabel": "れんこんの購入量",
      "role": "context"
    },
    {
      "rankingKey": "wine-consumption-expenditure",
      "shortLabel": "ワインの支出額",
      "role": "context"
    },
    {
      "rankingKey": "drinking-out-consumption-expenditure",
      "shortLabel": "飲酒代の支出額",
      "role": "context"
    },
    {
      "rankingKey": "movie-theater-consumption-expenditure",
      "shortLabel": "映画・演劇等入場料の支出額",
      "role": "context"
    },
    {
      "rankingKey": "shellfish-consumption-quantity",
      "shortLabel": "貝類の購入量",
      "role": "context"
    },
    {
      "rankingKey": "overseas-package-tour-consumption-expenditure",
      "shortLabel": "外国パック旅行費の支出額",
      "role": "context"
    },
    {
      "rankingKey": "coffee-shop-consumption-expenditure",
      "shortLabel": "喫茶代の支出額",
      "role": "context"
    },
    {
      "rankingKey": "beef-consumption-expenditure",
      "shortLabel": "牛肉の支出額",
      "role": "context"
    },
    {
      "rankingKey": "milk-consumption-quantity",
      "shortLabel": "牛乳の購入量",
      "role": "context"
    },
    {
      "rankingKey": "seafood-consumption-expenditure",
      "shortLabel": "魚介類の支出額",
      "role": "context"
    },
    {
      "rankingKey": "mobile-phone-bill-consumption-expenditure",
      "shortLabel": "携帯電話通信料の支出額",
      "role": "context"
    },
    {
      "rankingKey": "landline-bill-consumption-expenditure",
      "shortLabel": "固定電話通信料の支出額",
      "role": "context"
    },
    {
      "rankingKey": "black-tea-consumption-expenditure",
      "shortLabel": "紅茶の支出額",
      "role": "context"
    },
    {
      "rankingKey": "black-tea-consumption-quantity",
      "shortLabel": "紅茶の購入量",
      "role": "context"
    },
    {
      "rankingKey": "domestic-package-tour-consumption-expenditure",
      "shortLabel": "国内パック旅行費の支出額",
      "role": "context"
    },
    {
      "rankingKey": "domestic-student-remittance-consumption-expenditure",
      "shortLabel": "国内遊学仕送り金の支出額",
      "role": "context"
    },
    {
      "rankingKey": "sugar-consumption-quantity",
      "shortLabel": "砂糖の購入量",
      "role": "context"
    },
    {
      "rankingKey": "interior-decoration-consumption-expenditure",
      "shortLabel": "室内装飾品の支出額",
      "role": "context"
    },
    {
      "rankingKey": "tuition-consumption-expenditure",
      "shortLabel": "授業料等の支出額",
      "role": "context"
    },
    {
      "rankingKey": "accommodation-consumption-expenditure",
      "shortLabel": "宿泊料の支出額",
      "role": "context"
    },
    {
      "rankingKey": "shochu-consumption-expenditure",
      "shortLabel": "焼酎の支出額",
      "role": "context"
    },
    {
      "rankingKey": "shochu-consumption-quantity",
      "shortLabel": "焼酎の購入量",
      "role": "context"
    },
    {
      "rankingKey": "garden-maintenance-consumption-expenditure",
      "shortLabel": "植木・庭手入れ代の支出額",
      "role": "context"
    },
    {
      "rankingKey": "white-bread-consumption-expenditure",
      "shortLabel": "食パンの支出額",
      "role": "context"
    },
    {
      "rankingKey": "white-bread-consumption-quantity",
      "shortLabel": "食パンの購入量",
      "role": "context"
    },
    {
      "rankingKey": "table-salt-consumption-quantity",
      "shortLabel": "食塩の購入量",
      "role": "context"
    },
    {
      "rankingKey": "sake-consumption-expenditure",
      "shortLabel": "清酒の支出額",
      "role": "context"
    },
    {
      "rankingKey": "fresh-fruit-consumption-quantity",
      "shortLabel": "生鮮果物の購入量",
      "role": "context"
    },
    {
      "rankingKey": "fresh-vegetables-consumption-expenditure",
      "shortLabel": "生鮮野菜の支出額",
      "role": "context"
    },
    {
      "rankingKey": "instant-noodles-consumption-quantity",
      "shortLabel": "即席麺の購入量",
      "role": "context"
    },
    {
      "rankingKey": "other-bread-consumption-expenditure",
      "shortLabel": "他のパンの支出額",
      "role": "context"
    },
    {
      "rankingKey": "other-bread-consumption-quantity",
      "shortLabel": "他のパンの購入量",
      "role": "context"
    },
    {
      "rankingKey": "other-citrus-consumption-expenditure",
      "shortLabel": "他の柑きつ類の支出額",
      "role": "context"
    },
    {
      "rankingKey": "other-citrus-consumption-quantity",
      "shortLabel": "他の柑きつ類の購入量",
      "role": "context"
    },
    {
      "rankingKey": "other-meat-consumption-expenditure",
      "shortLabel": "他の生鮮肉の支出額",
      "role": "context"
    },
    {
      "rankingKey": "other-meat-consumption-quantity",
      "shortLabel": "他の生鮮肉の購入量",
      "role": "context"
    },
    {
      "rankingKey": "other-broadcast-fee-consumption-expenditure",
      "shortLabel": "他の放送受信料の支出額",
      "role": "context"
    },
    {
      "rankingKey": "carbonated-drink-consumption-expenditure",
      "shortLabel": "炭酸飲料の支出額",
      "role": "context"
    },
    {
      "rankingKey": "ramen-dining-consumption-expenditure",
      "shortLabel": "中華そばの支出額",
      "role": "context"
    },
    {
      "rankingKey": "chinese-food-dining-consumption-expenditure",
      "shortLabel": "中華食の支出額",
      "role": "context"
    },
    {
      "rankingKey": "kerosene-consumption-expenditure",
      "shortLabel": "灯油の支出額",
      "role": "context"
    },
    {
      "rankingKey": "pork-consumption-expenditure",
      "shortLabel": "豚肉の支出額",
      "role": "context"
    },
    {
      "rankingKey": "soba-udon-dining-consumption-expenditure",
      "shortLabel": "日本そば・うどんの支出額",
      "role": "context"
    },
    {
      "rankingKey": "natto-consumption-expenditure",
      "shortLabel": "納豆の支出額",
      "role": "context"
    },
    {
      "rankingKey": "happoshu-consumption-expenditure",
      "shortLabel": "発泡酒・ビール風アルコール飲料の支出額",
      "role": "context"
    },
    {
      "rankingKey": "happoshu-consumption-quantity",
      "shortLabel": "発泡酒・ビール風アルコール飲料の購入量",
      "role": "context"
    },
    {
      "rankingKey": "womens-stockings-consumption-expenditure",
      "shortLabel": "婦人用ストッキングの支出額",
      "role": "context"
    },
    {
      "rankingKey": "womens-stockings-consumption-quantity",
      "shortLabel": "婦人用ストッキングの購入量",
      "role": "context"
    },
    {
      "rankingKey": "cultural-facility-admission-consumption-expenditure",
      "shortLabel": "文化施設入場料の支出額",
      "role": "context"
    },
    {
      "rankingKey": "rice-consumption-quantity",
      "shortLabel": "米の購入量",
      "role": "context"
    },
    {
      "rankingKey": "hat-consumption-expenditure",
      "shortLabel": "帽子の支出額",
      "role": "context"
    },
    {
      "rankingKey": "hat-consumption-quantity",
      "shortLabel": "帽子の購入量",
      "role": "context"
    },
    {
      "rankingKey": "amusement-park-consumption-expenditure",
      "shortLabel": "遊園地入場・乗物代の支出額",
      "role": "context"
    },
    {
      "rankingKey": "western-food-dining-consumption-expenditure",
      "shortLabel": "洋食の支出額",
      "role": "context"
    },
    {
      "rankingKey": "green-tea-consumption-expenditure",
      "shortLabel": "緑茶の支出額",
      "role": "context"
    },
    {
      "rankingKey": "green-tea-consumption-quantity",
      "shortLabel": "緑茶の購入量",
      "role": "context"
    },
    {
      "rankingKey": "frozen-food-consumption-expenditure",
      "shortLabel": "冷凍調理食品の支出額",
      "role": "context"
    },
    {
      "rankingKey": "japanese-food-dining-consumption-expenditure",
      "shortLabel": "和食の支出額",
      "role": "context"
    }
  ],
  "keywords": [
    "食費",
    "家計調査",
    "消費支出",
    "外食",
    "米",
    "パン",
    "魚介",
    "肉",
    "野菜",
    "果物",
    "酒",
    "県庁所在市",
    "都道府県",
    "ランキング"
  ]
};
