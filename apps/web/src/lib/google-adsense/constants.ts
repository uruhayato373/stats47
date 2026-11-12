/**
 * Google AdSense 配置別スロット定数
 *
 * 広告ユニットの配置ごとに slotId と format を定義する。
 * 同一ページで複数広告を出す場合は、AdSense ポリシーに従い配置ごとに別スロットの利用を推奨。
 */

import type { AdFormat } from "./types";

/**
 * AdSense表示の全体スイッチ。
 *
 * 2026-08-16に一時停止し、2026-10-11に新アカウント (pub-9055416085403520) の
 * 審査承認を受けて再開した (backlog ADSENSE-RESTART-01)。再開時は手動枠だけ。
 * 自動広告は 2026-11-04 から AdSense の管理画面でオン (2026-11-11 オーナー決定で継続。収益化戦略 §3.1)。
 * falseの間は環境変数がtrueでも、script / preconnect / 手動枠 / AdSense fallbackを
 * 一切描画しない。止めるときはこの1箇所だけをfalseへ戻す。
 */
export const ADSENSE_DISPLAY_ENABLED: boolean = true;

/**
 * AdSense の script を読み込まないページか。広告を出さないページの接頭辞は GIS 台帳の利用条件から
 * サーバーで導き (`ad-free-paths.ts`)、ここは照合だけを行う。
 * 手動枠を置かないだけでなく script 自体を読まない (自動広告をオンにしても出ないように)。
 */
export function isAdFreePath(pathname: string | null, prefixes: readonly string[]): boolean {
  if (!pathname) return false;
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

// 以下の slotId はすべて新アカウントで 2026-10-11 に発行した広告ユニット。配置ごとに 1 ユニットを
// 割り当て、AdSense の広告ユニット別レポートで枠ごとの収益・視認率を比べられるようにしている
// (ユニット名は stats47-<配置>)。旧アカウント (pub-7995274743017484) の slotId は使えない。

export interface AdSlotConfig {
  /** 広告スロットID（AdSense 管理画面で発行）。空文字 = 未発行プレースホルダ（slot 部品は描画しない） */
  slotId: string;
  /** 広告フォーマット */
  format: AdFormat;
  /** インフィード広告の data-ad-layout-key (AdSense がユニットごとに発行する) */
  layoutKey?: string;
}

/**
 * ランキングページ: 右レールの最後 (PC だけ)。名前は旧の位置 (表の横) のまま。
 * 2026-11-12 オーナー決定: 300×600 をヘッダーの下に追従させる (台帳の adsense-rail-sticky)。変更前 W42〜W44 は
 * 300×250 で 1,000 表示あたり ¥8〜10・視認率 32〜33%。AdSense ユニット名: stats47-ranking-table-side
 */
export const RANKING_PAGE_TABLE_SIDE: AdSlotConfig = {
  slotId: "5182030050",
  format: "rectangle",
};

/**
 * 右レールのアフィリエイト枠 (AffiliateAdSlot position="sidebar") の AdSense フォールバック。
 * 意図が解決せずバナーもテキストも出ないページ (気候・身長など) で出る。ランキングでは
 * RANKING_PAGE_TABLE_SIDE と同じページに並ぶので、2026-10-11 の再開時に別ユニットへ分けた。
 * AdSense ユニット名: stats47-sidebar-affiliate-fallback
 */
export const SIDEBAR_AFFILIATE_FALLBACK: AdSlotConfig = {
  slotId: "4607314986",
  format: "rectangle",
};

/** ランキングページ: 右サイドバー上部。AdSense ユニット名: stats47-ranking-rail-top */
export const RANKING_SIDEBAR_TOP: AdSlotConfig = {
  slotId: "8897913786",
  format: "rectangle",
};

/**
 * 右レール共通のレクタングル枠（RailAdSlot 用）
 * 旧 MAIN_SIDEBAR（未使用スロット 7716393084）を転用。category / areas の右レールに配置する。
 * ADSENSE-SLOT-DEDUPE-01: 同一ページ内で slot を二重使用していた不具合
 * （category は 6137206504 を rail+本文で重複、areas は 6180558947 を 3 回）を、
 * 右レール専用の独立スロットに寄せて解消するためのユニット。
 * AdSense ユニット名: stats47-hub-rail
 */
export const RAIL_RECT: AdSlotConfig = {
  slotId: "9435960671",
  format: "rectangle",
};

/**
 * ランキングページ: メインコンテンツ最下部
 * ADSENSE-FOOTER-02 (2026-07-03): 旧 rectangle (slot 2607536637・W26 viewability 26.2%) を
 * Multiplex (関連コンテンツ型グリッド・横長) に差し替え。読了後の全幅フッターに適した形式。
 * 2026-10-31 (オーナー決定 AdSense は全て 300×250): 関連コンテンツ型 (2439393208) は固定の大きさにできず、
 * モバイルで 308×1503 まで伸びていた。2026-11-03 にこの配置専用の表示広告ユニットを作った。
 * 2026-11-12 オーナー決定: 出典の後の段はこのユニット 1 つだけを本文の幅いっぱい (上限 580px。台帳の
 * adsense-body-responsive) で出す。管理画面の設定は固定のままでも、広告コードを書き換えればレスポンシブにできる
 * (support.google.com/adsense/answer/10734935・2026-11-12 確認)。形は rectangle に絞る。
 * AdSense ユニット: stats47-ranking-footer-rect（ディスプレイ / 管理画面では固定 300×250 で作成）
 */
export const RANKING_PAGE_FOOTER: AdSlotConfig = {
  slotId: "3686603642",
  format: "rectangle",
};

/**
 * ランキングページ: 右レールの中段 (調査のカードと分野のランキング一覧の間)
 * 2026-11-12 オーナー決定: アフィリエイトの PR の枠 (固定のバナーと文脈のバナー) から替えた。
 * ユニットは 2026-10-30 まで一覧の右レールで縦長に使い、外してから使っていなかった stats47-ranking-rail-bottom を流用する
 * (ランキングの右レール専用のまま実績が混ざらない)。右レールの AdSense と同じ 300×250 の固定のコードで出す。
 * AdSense ユニット名: stats47-ranking-rail-bottom（名前は旧の位置のまま）
 */
export const RANKING_RAIL_MIDDLE: AdSlotConfig = {
  slotId: "2308454706",
  format: "rectangle",
};

/**
 * ランキングページ: ページの最後 (関連ランキング・記事の後)
 * 2026-11-12 オーナー決定: アフィリエイトの PR の列から替えた。ほかの枠と実績が混ざらないよう専用のユニットを作った
 * (同日に AdSense の管理画面で作成)。本文の幅いっぱい (上限 580px。台帳の adsense-body-responsive) で、形は rectangle に絞る。
 * AdSense ユニット: stats47-ranking-end（ディスプレイ / レスポンシブ）
 */
export const RANKING_PAGE_END: AdSlotConfig = {
  slotId: "3452480564",
  format: "rectangle",
};

/**
 * ブログ記事: 本文の 2 つ目・3 つ目の広告の段 (h2 の 4・6 番目の前) と記事の末尾。
 * 2026-11-12 オーナー決定: 本文の段を AdSense 1 つ・幅いっぱい (上限 580px) にし、PR を外した。それまでハブ・一覧と共用の
 * HUB_INCONTENT / CONTENT_FOOTER / THEMES_CONTENT を使っていて、ブログの実績を分けて測れなかったので、同日に専用のユニットを作った。
 * 1 つ目の段は従来どおり BLOG_ARTICLE_INLINE。どれも本文の幅いっぱいの箱 (台帳の adsense-body-responsive) で、形は rectangle に絞る。
 */
export const BLOG_ROW_2: AdSlotConfig = { slotId: "9307296688", format: "rectangle" }; // stats47-blog-row-2
export const BLOG_ROW_3: AdSlotConfig = { slotId: "4897424179", format: "rectangle" }; // stats47-blog-row-3
export const BLOG_END: AdSlotConfig = { slotId: "2394403971", format: "rectangle" }; // stats47-blog-end

/**
 * ブログ記事: 右レール (PC だけ)。2026-11-12 オーナー決定で、右レールの PR のバナー (最大 2 枚) を上段の AdSense に替え、
 * 右レールの最後に追従する 300×600 を足した (中身が本文より短く、PC で下が約 5,000px 空いていた)。同日に専用のユニットを作った。
 */
export const BLOG_RAIL: AdSlotConfig = { slotId: "1595814272", format: "rectangle" }; // stats47-blog-rail (300×250)
export const BLOG_RAIL_STICKY: AdSlotConfig = { slotId: "6270069803", format: "rectangle" }; // stats47-blog-rail-sticky (追従する 300×600)
/** 右レールの中段 (運営者のプロフィールの後・追従しない 300×250)。2026-11-12 オーナー決定で足し、同日に作成 */
export const BLOG_RAIL_MIDDLE: AdSlotConfig = { slotId: "4422635661", format: "rectangle" }; // stats47-blog-rail-middle

/**
 * 都道府県のページ: データブックの中の 3 段 (暮らし・気候・消費の節の前)・データブックの後・ページの最後。
 * 2026-11-12 オーナー決定 (推奨案): どれも AdSense 1 つを本文の幅いっぱい (上限 580px) に出し、PR を外した。それまでの
 * HUB_INCONTENT / CONTENT_FOOTER はハブ・一覧と共用で、県のページの分を測れなかったので、同日に専用のユニットを作った。
 */
export const AREA_DATABOOK_ROW_1: AdSlotConfig = { slotId: "3776748345", format: "rectangle" }; // stats47-area-databook-1
export const AREA_DATABOOK_ROW_2: AdSlotConfig = { slotId: "3704450369", format: "rectangle" }; // stats47-area-databook-2
export const AREA_DATABOOK_ROW_3: AdSlotConfig = { slotId: "3540944628", format: "rectangle" }; // stats47-area-databook-3
export const AREA_AFTER_DATABOOK: AdSlotConfig = { slotId: "4929902121", format: "rectangle" }; // stats47-area-after-databook
export const AREA_END: AdSlotConfig = { slotId: "4738330430", format: "rectangle" }; // stats47-area-end
/**
 * 都道府県のページ: 「この県の特徴を読み解く記事」の一覧の 3 件目の後に入れるインフィード広告 (2026-11-12 オーナー決定・同日作成)。
 * テンプレートは「横の画像」(一覧の行と同じ、左に画像・右に題名)。layoutKey は AdSense がユニットごとに発行する値で、変えると配信されない。
 * 「選択したディスプレイ広告を許可する」はオン (AdSense の既定) のまま。
 */
export const AREA_INFEED: AdSlotConfig = { slotId: "9371196667", format: "infeed", layoutKey: "-fb+5w+4e-db+86" }; // stats47-area-infeed

/**
 * 市区町村のランキング: 地図の後・順位の表とページ送りの後。ページの最後の段 (stats47-municipality-end・1042114655) は、同日に右レールを
 * 付けて表の後の段と近づいたので外した (ユニットは AdSense に残っている)。
 * 2026-11-12 オーナー決定: どれも AdSense 1 つを本文の幅いっぱい (上限 580px) に出し、PR を外した。それまでは解説の後の 1 段だけで
 * (AdSense・PR・AdSense の横並び。スマホでは先頭の 1 枠だけ)、ユニットはハブ・一覧と共用の HUB_INCONTENT / CONTENT_FOOTER だった。同日に専用のユニットを作った。
 */
export const MUNICIPALITY_AFTER_MAP: AdSlotConfig = { slotId: "7607523006", format: "rectangle" }; // stats47-municipality-after-map
export const MUNICIPALITY_AFTER_TABLE: AdSlotConfig = { slotId: "4981359660", format: "rectangle" }; // stats47-municipality-after-table
/**
 * 市区町村のランキング: 右レール (PC だけ)。2026-11-12 オーナー決定 (推奨案) で、本文が 1,131px に広がっていたページを都道府県の
 * ランキングと同じ右レール付きの枠にし、関連の一覧の後に 300×250、右レールの最後に追従する 300×600 を置いた。同日に作成
 */
export const MUNICIPALITY_RAIL: AdSlotConfig = { slotId: "3309698695", format: "rectangle" }; // stats47-municipality-rail
export const MUNICIPALITY_RAIL_STICKY: AdSlotConfig = { slotId: "5716370187", format: "rectangle" }; // stats47-municipality-rail-sticky (追従する 300×600)

/** ブログ記事内インライン広告（記事内 / fluid）。AdSense ユニット名: stats47-blog-inarticle */
export const BLOG_ARTICLE_INLINE: AdSlotConfig = {
  slotId: "6809797335",
  format: "article",
};

/**
 * ランキング詳細ページ: モバイル専用・解析セクション中盤の記事内広告
 *
 * モバイルはサイドバー広告が非表示で、収益のあるユニットが実質テーブル直後の
 * フッター 1 枠のみだった（W21 実測: Mobile Impressions/PV 0.32 / RPM ¥20）。
 * 解析セクションを読み進める層に中盤で 1 枠出すための専用スロット。
 * 2026-11-12 オーナー決定: 解説の後の段はこのユニット 1 つだけを本文の幅いっぱい (上限 580px。台帳の
 * adsense-body-responsive) で出す。ユニットは替えず、units.csv で変更前後を比べられるようにした。
 * AdSense ユニット名: stats47-ranking-incontent-mobile（記事内 / fluid）
 */
export const RANKING_INCONTENT_MOBILE: AdSlotConfig = {
  slotId: "2894688778",
  format: "article",
};

/**
 * テーマダッシュボードページ: ダッシュボード下のディスプレイ広告
 * 17 テーマページ共通（ThemePageLayout）。
 * AdSense ユニット名: stats47-themes-content（ディスプレイ広告 / auto）
 */
export const THEMES_CONTENT: AdSlotConfig = {
  slotId: "8298138821",
  format: "rectangle",
};

/**
 * ハブ / 一覧ページ共通の記事内広告（fluid / in-article）
 * top / category / theme / blog一覧 / survey / tag のセクション区切りに 1 枠だけ配置する。
 * ADSENSE-HUB-INCONTENT-01: モバイル imp/PV（W26 実測 0.37）改善のためハブ面に in-content を新設。
 * ranking 詳細の RANKING_INCONTENT_MOBILE とは別ユニットにして units.csv で効果を分離する。
 * AdSense ユニット名: stats47-hub-incontent（記事内 / fluid）
 */
export const HUB_INCONTENT: AdSlotConfig = {
  slotId: "9995373035",
  format: "article",
};

/**
 * コンテンツ / 一覧ページ共通フッター広告
 * 地域別カテゴリ・市区町村ページ・各一覧ページ（/blog, /survey, /ports 等）・/search の
 * メインコンテンツ最下部に配置する汎用スロット。
 * ADSENSE-FOOTER-02 (2026-07-03): 旧 rectangle (slot 6635359989・W26 viewability 49.1%) を
 * Multiplex に差し替え。2026-10-11 の再開時に RANKING_PAGE_FOOTER との slot 共用をやめ、
 * ランキング末尾とそれ以外の末尾を別ユニットで計測する。
 * 2026-10-31: RANKING_PAGE_FOOTER と同じ理由で関連コンテンツ型 (2005202370) をやめ、2026-11-03 に
 * この配置専用の表示広告ユニットを作った。
 * AdSense ユニット: stats47-content-footer-rect（ディスプレイ / 固定 300×250）
 */
export const CONTENT_FOOTER: AdSlotConfig = {
  slotId: "6994459114",
  format: "rectangle",
};
