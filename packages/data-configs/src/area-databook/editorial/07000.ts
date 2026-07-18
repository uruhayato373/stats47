/**
 * 福島県 (07000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 北海道・東北エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const FUKUSHIMA_EDITORIAL: AreaEditorial = {
  areaCode: "07000",
  symbols: {
    tree: "ケヤキ",
    flower: "ネモトシャクナゲ",
    bird: "キビタキ",
    song: "福島県民の歌",
    sourceUrl: "https://www.pref.fukushima.lg.jp/site/ken-no-sugata/hana-tori-ki.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "aka-kabocha",
      name: "赤かぼちゃ",
      municipality: "金山町",
      description:
        "奥会津・金山町で昭和30年頃から作り続けられる濃いオレンジ色のかぼちゃ。生産者協議会が出荷基準を定めて厳しく検査し、基準を満たしたものだけが「奥会津金山赤カボチャ」を名乗れる、甘みとホクホク感が持ち味の一品。",
      sourceUrl: "https://www.town.kaneyama.fukushima.jp/site/kanko/akakabotyakensa.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "akatsuki-momo",
      name: "あかつき（桃）",
      municipality: "福島市",
      description:
        "福島県が育成し全国生産量の半数以上を占める桃の代表品種。大玉・果肉緻密・強い甘みの三拍子がそろい「桃の王様」とも呼ばれる。名前は福島市で江戸時代から続く「信夫三山あかつき詣り」に由来する。",
      sourceUrl: "https://www.f-kankou.jp/pickup/32249",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hokkigai",
      name: "ホッキガイ",
      municipality: "相馬市",
      description:
        "親潮と黒潮がぶつかる相双沖は生育の速い暖流の影響を受け、甘みと柔らかさに優れたホッキガイが揚がる。相馬市磯部漁港が主な水揚げ地で、ご飯に貝の出汁を吸わせた郷土料理「ほっき飯」で親しまれる。",
      sourceUrl: "https://www.minyu-net.com/gourmet/syoku-story/FM20161120-128628.php",
      accessedAt: "2026-07-18",
    },
    {
      slug: "azuma-shizuku",
      name: "あづましずく",
      municipality: "県内広域",
      description:
        "福島県農業総合センター果樹研究所が「ブラックオリンピア」と「4倍体ヒムロット」を交配し2004年に登録した県オリジナルの黒ぶどう。種なし大粒で酸味が少なく、巨峰に負けない甘みと皮離れの良さが魅力。",
      sourceUrl: "https://www.pref.fukushima.lg.jp/sec/36005b/hinsyu-00.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "mehikari",
      name: "メヒカリ",
      municipality: "いわき市ほか",
      description:
        "正式名アオメエソ、青く光る大きな目が特徴の深海魚で、いわき市の市魚にも制定されている。常磐沖で揚がる「常磐もの」は他地域産より脂の乗りが良いと調査で確認されており、唐揚げが地元のソウルフード。",
      sourceUrl: "https://fukushima-oiseafood.jp/column/373/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "aizu-asparagus",
      name: "アスパラガス",
      municipality: "会津地方ほか",
      description:
        "福島県は作付面積全国3位のアスパラガス産地で、うち会津地方が9割超を占める。南会津では緑・白・紫の三色を栽培する珍しい産地でもあり、紫は流通量の少ない希少品種でポリフェノールを豊富に含む。",
      sourceUrl: "https://aizu-shokuno-jin.jp/aizu_asparagus/",
      accessedAt: "2026-07-18",
    },
  ],
};
