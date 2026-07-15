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
 */

import type { NoteMagazine } from "./types";

export const NOTE_MAGAZINES: NoteMagazine[] = [
  // ── koumuin 系 (既存フッター運用をカタログ化。マガジン未作成 = noteUrl null) ──
  {
    key: "koumuin-claude-code",
    name: "自治体職員のための Claude Code 実務ガイド",
    isPaid: false,
    description:
      "ターミナル未経験の公務員向けに Claude Code の導入〜実務活用を段階解説するシリーズ。",
    verticals: ["koumuin-claude-code"],
    noteUrl: null,
    placeholder: "{{MAGAZINE_URL}}",
  },
  {
    key: "koumuin-estat-claude-code",
    name: "自治体職員のための e-Stat × Claude Code",
    isPaid: false,
    description:
      "公的統計 (e-Stat) を Claude Code で取得・整形・可視化する自治体職員向けシリーズ。",
    verticals: ["koumuin-estat-claude-code"],
    noteUrl: null,
    placeholder: "{{ESTAT_MAGAZINE_URL}}",
  },
  {
    key: "koumuin-gis",
    name: "自治体職員のための GIS 入門",
    isPaid: false,
    description:
      "無料の国土数値情報で地域課題を可視化する GIS 入門シリーズ (過疎×医療 など)。",
    verticals: ["koumuin-gis"],
    noteUrl: null,
    placeholder: "{{GIS_MAGAZINE_URL}}",
  },

  // ── stats47-note ランキング系 (無料キュレーション。編集で記事を割り当てる) ──
  // 「類似記事を 1 つの無料マガジンに束ねる」設計の受け皿。
  // 各記事の magazine フィールドを下記キーに設定して束ねる (回遊を作る)。
  {
    key: "s47-fiscal",
    name: "都道府県ランキング｜自治体財政",
    isPaid: false,
    description:
      "財政力指数・実質公債費比率・地方債現在高比率・財政健全化指標など、自治体財政の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: null,
  },
  {
    key: "s47-climate",
    name: "都道府県ランキング｜気候・自然",
    isPaid: false,
    description:
      "日照時間・気温・降水量・晴天日数など、気候と自然の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: null,
  },
  {
    key: "s47-population",
    name: "都道府県ランキング｜人口・世帯",
    isPaid: false,
    description:
      "出生率・初婚年齢・人口移動・世帯構造など、人口と世帯の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: null,
  },
  {
    key: "s47-labor",
    name: "都道府県ランキング｜労働・所得",
    isPaid: false,
    description:
      "県民所得・賃金・通勤時間・有効求人倍率など、労働と所得の都道府県ランキングを束ねる無料マガジン。",
    verticals: ["stats47-note"],
    noteUrl: null,
  },
];

export const NOTE_MAGAZINE_KEYS = new Set(NOTE_MAGAZINES.map((m) => m.key));

export function getMagazine(key: string): NoteMagazine | undefined {
  return NOTE_MAGAZINES.find((m) => m.key === key);
}
