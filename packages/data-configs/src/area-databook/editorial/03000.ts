/**
 * 岩手県 (03000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 北海道・東北エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const IWATE_EDITORIAL: AreaEditorial = {
  areaCode: "03000",
  symbols: {
    tree: "ナンブアカマツ",
    flower: "キリ",
    bird: "キジ",
    fish: "ナンブサケ",
    song: "岩手県民の歌",
    sourceUrl: "https://www.pref.iwate.jp/kensei/profile/1000650.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "warabi",
      name: "ワラビ",
      municipality: "西和賀町",
      description:
        "豪雪地帯の西和賀町で育つ「西わらび」は太くて粘りが強く、アクの少なさが特徴の山菜。雪解け水を蓄えた山あいの土壌が、柔らかく歯ごたえのある良質なワラビを育てる。",
      sourceUrl: "https://www.town.nishiwaga.lg.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "esashi-ringo",
      name: "江刺りんご",
      municipality: "奥州市",
      description:
        "奥州市江刺地区の完全無袋・わい化栽培によるりんご。袋をかけずに太陽光を浴びせて育てるため色づきと糖度が高まり、完熟したものは最高級品として市場で高値取引される。",
      sourceUrl: "https://www.city.oshu.iwate.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hoshi-awabi",
      name: "干しアワビ",
      municipality: "洋野町",
      description:
        "三陸の栄養豊かな海で育った肉厚なアワビを天日で乾燥させた乾物。中華料理の高級食材として古くから中国へ輸出され、清朝時代から続く俵物三品の一つとして知られる。",
      sourceUrl: "https://www.town.hirono.iwate.jp/doc/2006010101117/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "iwate-tankaku-wagyu",
      name: "いわて短角和牛",
      municipality: "岩泉町・久慈市・二戸市・盛岡市ほか",
      description:
        "夏は山、冬は里で育てる「夏山冬里方式」で飼養される日本短角種は、岩手県が飼育頭数で全国シェア約半数を占める。低脂肪でアミノ酸豊富な赤身肉が持ち味の希少和牛。",
      sourceUrl: "https://iwategyu.jp/iwate_tankaku_wagyu/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "nanbu-hanamagari-zake",
      name: "南部鼻曲り鮭",
      municipality: "宮古市・大船渡市・釜石市",
      description:
        "陸中海岸の河川で捕れる、産卵期に鼻先が曲がった雄のシロサケ。塩をした後に浜風で1〜2週間干し上げる寒風干しの製法は江戸期から続く伝統技術で、贈答用の新巻鮭として重宝される。",
      sourceUrl: "https://www.magariya.net/makers/nanbusake/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "amaranth",
      name: "アマランサス",
      municipality: "軽米町",
      description:
        "「雑穀王国」を掲げる軽米町で栽培される、国内生産量のほぼ全量を岩手県が占める雑穀。赤紫の花穂が初秋の畑を彩り、鉄分やカルシウムを豊富に含むスーパーフードとして注目される。",
      sourceUrl: "https://www.town.karumai.iwate.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "iwaizumi-matsutake",
      name: "岩泉まつたけ",
      municipality: "岩泉町",
      description:
        "清らかな水とアカマツ林に恵まれた岩泉町は古くからのマツタケの産地。本州最北に近く他産地より早く出荷が始まり、地元マイスターが厳選した味・香り・形の三拍子そろった逸品だけが名を冠する。",
      sourceUrl: "https://www.ginga.or.jp/matsutake/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "morioka-yogurt",
      name: "ヨーグルト",
      municipality: "県内広域",
      description:
        "盛岡市は乳製品への支出金額が全国トップクラスで知られ、酪農が盛んな県内各地で個性豊かなヨーグルトが作られている。冷涼な気候と豊富な牧草地が良質な生乳生産を支えている。",
      sourceUrl: "https://www.pref.iwate.jp/kensei/profile/1000655/1018314.html",
      accessedAt: "2026-07-18",
    },
  ],
};
