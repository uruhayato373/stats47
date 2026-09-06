/**
 * note マガジンレジストリ (git TS SSOT)
 *
 * NoteArticle.magazine が参照するキーの単一ソース。マガジンの追加・有料/無料・名称・
 * 束ねる vertical をここで管理する。note.com 上のマガジン URL は作成後に noteUrl へ書き戻す
 * (未作成は null)。
 *
 * 種別:
 *   - 無料キュレーション (isPaid=false): 回遊導線。有料記事をメンバーに含めてよい
 *   - 有料メンバーシップ (isPaid=true): 有料記事を束ねる収益ライン
 *
 * stats47-note (都道府県ランキング系) は e-Stat 17 カテゴリに 1:1 対応する
 * カテゴリ別マガジン (`s47-*`) で束ねる。行動者率 (社会生活基本調査) は件数が多く
 * 独立クラスタなので `s47-sports-culture` に分ける。各マガジンは既存記事の回遊導線であり、
 * 新規投稿の受け皿でもある (投稿を増やすときは既存カテゴリマガジンに足す)。
 */

import type { NoteMagazine } from "./types";

export const NOTE_MAGAZINES: NoteMagazine[] = [
  // ── koumuin 系 (既存フッター運用をカタログ化。マガジン未作成 = noteUrl null) ──
  // note.com 実在マガジン (2026-08-03 照合)。isPaid=true は buy-once の有料マガジンで、
  // 無料記事も束ねる note.com のモデル (validate の「有料マガジンに無料記事」warn は想定内)。
  {
    key: "koumuin-claude-code",
    name: "公務員 × Claude Code 実務活用ガイド",
    isPaid: true,
    description:
      "ターミナル未経験の公務員向けに Claude Code の導入〜実務活用を段階解説する有料マガジン (¥1,980)。",
    verticals: ["koumuin-claude-code"],
    noteUrl: "https://note.com/stats47/m/m512ad7023815",
    placeholder: "{{MAGAZINE_URL}}",
  },
  {
    key: "koumuin-estat-claude-code",
    name: "公務員のe-Stat×Claude Code実務ガイド",
    isPaid: true,
    description:
      "公的統計 (e-Stat) を Claude Code で取得・整形・可視化する自治体職員向け有料マガジン (¥1,480)。",
    verticals: ["koumuin-estat-claude-code"],
    noteUrl: "https://note.com/stats47/m/m1b836e4c8dce",
    placeholder: "{{ESTAT_MAGAZINE_URL}}",
  },
  {
    key: "koumuin-gis",
    name: "自治体職員のための GIS 入門",
    isPaid: false,
    description:
      "無料の国土数値情報で地域課題を可視化する GIS 入門シリーズ (過疎×医療 など)。note.com 未作成。",
    verticals: ["koumuin-gis"],
    noteUrl: "https://note.com/stats47/m/m599831c3769e",
    placeholder: "{{GIS_MAGAZINE_URL}}",
  },
  {
    key: "product-d3-colors",
    name: "D3.js 地図可視化のための配色完全ガイド",
    isPaid: true,
    description:
      "D3.js での地図可視化の配色を体系化した有料マガジン (¥500・全6章)。note.com 実在マガジン。",
    verticals: ["stats47-note", "koumuin-gis"],
    noteUrl: "https://note.com/stats47/m/mfe0fab2606eb",
  },

  // ── stats47-note ランキング系 (e-Stat 17 カテゴリ + 行動者率クラスタ) ──
  // 無料キュレーション。有料記事を含めてよい。記事の `magazine` を下記キーに設定して束ねる。
  {
    key: "s47-sports-culture",
    name: "都道府県ランキング｜趣味・スポーツ・文化活動",
    isPaid: false,
    description:
      "社会生活基本調査の行動者率で見る趣味・スポーツ・文化活動 (野球・ヨガ・読書・楽器・書道など) の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: "https://note.com/stats47/m/mef7c42c1c86c",
  },
  {
    key: "s47-fiscal",
    name: "都道府県ランキング｜自治体財政",
    isPaid: false,
    description:
      "財政力指数・実質公債費比率・自主財源比率・財政健全化指標・公務員数など、自治体財政と行政の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: "https://note.com/stats47/m/m30bb1cee28f7",
  },
  // ── 家計調査の読み方 (2026-09-06 新設) ──
  // s47-* は e-Stat 17 カテゴリに 1:1 対応する「分類マガジン」だが、これは軸が違う。
  // 「支出額をどう読むか」という方法のマガジンで、県別プロファイル 47 本と
  // 統計の読み違いを正す論点記事を束ねる。分類側 (s47-economy) は県別ランキング型の
  // 記事を持ち続け、粒度を壊さない。
  {
    key: "s47-kakei-reading",
    name: "家計調査の読み方｜47都道府県の家計を読み解く",
    isPaid: false,
    description:
      "家計調査の支出額を読み解くための無料マガジン。十大費目で見る47都道府県の家計プロファイルと、支出額の読み違いを正す論点記事を束ねる。",
    verticals: ["stats47-note"],
    noteUrl: null,
  },
  {
    key: "s47-economy",
    name: "都道府県ランキング｜家計・所得・物価",
    isPaid: false,
    description:
      "県民所得・貯蓄率・消費者物価・費目別支出など、家計と経済の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: "https://note.com/stats47/m/m2604e003aac4",
  },
  {
    key: "s47-population",
    name: "都道府県ランキング｜人口・世帯",
    isPaid: false,
    description:
      "出生率・初婚年齢・人口移動・世帯構造・高齢化など、人口と世帯の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: "https://note.com/stats47/m/meacbafeb15a1",
  },
  {
    key: "s47-education",
    name: "都道府県ランキング｜教育・学び",
    isPaid: false,
    description:
      "進学率・学力・体力・体格・教育費・図書館など、教育と学びの都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: "https://note.com/stats47/m/m72e6b89b155e",
  },
  {
    key: "s47-health",
    name: "都道府県ランキング｜医療・健康・社会保障",
    isPaid: false,
    description:
      "医療・病院・介護・健診・死亡率・平均寿命・社会保障など、健康と福祉の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: "https://note.com/stats47/m/m83c357247e0c",
  },
  {
    key: "s47-climate",
    name: "都道府県ランキング｜気候・自然",
    isPaid: false,
    description:
      "日照時間・気温・降水量・晴天日数・積雪など、気候と自然の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: "https://note.com/stats47/m/me574f67ac47f",
  },
  {
    key: "s47-agriculture",
    name: "都道府県ランキング｜農林水産",
    isPaid: false,
    description:
      "農業産出額・農業所得・漁獲量・畜産・特産品の消費量など、農林水産の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: "https://note.com/stats47/m/md6aa26278129",
  },
  {
    key: "s47-safety",
    name: "都道府県ランキング｜安全・環境",
    isPaid: false,
    description:
      "犯罪・交通事故・警察官数・災害・ごみ・公害など、安全と環境の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: "https://note.com/stats47/m/md7d4906a40ac",
  },
  {
    key: "s47-labor",
    name: "都道府県ランキング｜労働・雇用",
    isPaid: false,
    description:
      "賃金・初任給・通勤時間・有効求人倍率・休暇取得など、労働と雇用の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: "https://note.com/stats47/m/m4709a61adf77",
  },
  {
    key: "s47-tourism",
    name: "都道府県ランキング｜観光・宿泊",
    isPaid: false,
    description:
      "観光入込・宿泊者数・ホテル/旅館・温泉など、観光の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: "https://note.com/stats47/m/m87e6a79d821b",
  },
  {
    key: "s47-industry",
    name: "都道府県ランキング｜産業・商業",
    isPaid: false,
    description:
      "製造品出荷額・工業・商業・小売・店舗数など、産業と商業の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: "https://note.com/stats47/m/m8c84e9e6e4bd",
  },
  {
    key: "s47-housing",
    name: "都道府県ランキング｜住宅・建設",
    isPaid: false,
    description:
      "持ち家率・空き家率・家賃・地価・住宅床面積・普及率など、住宅と建設の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: "https://note.com/stats47/m/m940fb189a4c0",
  },
  {
    key: "s47-infrastructure",
    name: "都道府県ランキング｜交通・インフラ",
    isPaid: false,
    description:
      "道路・鉄道・駅・港湾・空港・自動車保有など、交通とインフラの都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: "https://note.com/stats47/m/md9ab5cabf8f8",
  },
  {
    key: "s47-ict",
    name: "都道府県ランキング｜情報通信",
    isPaid: false,
    description:
      "インターネット利用・スマートフォン・情報処理など、情報通信の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: null,
  },
  {
    key: "s47-international",
    name: "都道府県ランキング｜国際・外国人",
    isPaid: false,
    description:
      "在留外国人・貿易・訪日外国人など、国際の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: null,
  },
  {
    key: "s47-energy",
    name: "都道府県ランキング｜エネルギー・水",
    isPaid: false,
    description:
      "電力・ガス・水道・再生可能エネルギーなど、エネルギーと水の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: null,
  },
];

export const NOTE_MAGAZINE_KEYS = new Set(NOTE_MAGAZINES.map((m) => m.key));

export function getMagazine(key: string): NoteMagazine | undefined {
  return NOTE_MAGAZINES.find((m) => m.key === key);
}
