/**
 * Topic — カテゴリ内グループ分類の SSOT 型
 *
 * 規約の正典: `packages/data-configs/src/topics/README.md`
 *
 * ## これは何か
 *
 * `/category/<key>` の一覧を「意味のあるまとまり」で束ねるためのラベル軸。
 * 例: laborwage の 110 件を「職業別の平均年収 / 生活時間 / 賃金・給与 / …」に分ける。
 *
 * ## 既存の 3 タクソノミーとの関係 (docs/01_技術設計/03_情報設計.md)
 *
 * 情報設計は第四の分類軸を「既存三軸で表現できない根拠のレビュー必須」としている。
 * topic が Category 軸の**内部整理**であって新軸ではない根拠は 3 点:
 *
 *   1. **URL を持たない** — `/topic/<key>` は作らない。category ページ内の見出しに閉じる
 *   2. **category の従属属性** — 1 metric は 1 category 文脈につき 1 topic (関数従属)。
 *      複数 topic に属させると Tag と機能が重複するため禁止
 *   3. **描画物を持たない** — theme (`/themes/*`) が「複数指標の解釈 + curated チャート」で
 *      URL とチャートを持つのに対し、topic は索引の可読性のためのラベルにすぎない
 *
 * ## 既存 `groupKey` との違い (混同注意)
 *
 * `MetricConfig.groupKey` は「同一指標の別カット (男女別・正規化違い) を束ねる」用途で、
 * 値は代表 metric の key と一致させる規約。`is-base-metric.ts` の派生判定や
 * sidebar の間引きが依存しており、意味を上書きすると壊れる。粒度も数件単位で細かい。
 * topic はその上位レイヤなので、別フィールド・別名にしてある。
 */
import type { CategoryKey } from "../types";

/**
 * metric を topic へ割り当てる規則。
 *
 * カタログ内の定義順に評価し、**最初に一致したものを採用する** (先勝ち)。
 * 順序が意味を持つので、広いパターンは後ろに置くこと。
 */
export type TopicMatcher =
  | {
      /** ランキング名 (title) の正規表現一致 */
      kind: "title";
      /** `RegExp` の source 文字列。フラグなしで評価する */
      pattern: string;
    }
  | {
      /**
       * 家計調査の品目コード (`source.filter.cdCat01`) の前方一致。
       *
       * 家計調査のコードは階層構造を持つ: 先頭 2 桁が 10 大費目 (01 食料 / 04 家具・家事用品 /
       * 08 教育 …)、続く 2 桁が中分類 (0102 魚介類 / 0105 野菜・海藻 / 0111 酒類 …)。
       * タイトルの語彙に頼らず出典側の分類をそのまま使えるため、economy の
       * 家計調査品目 690 件はこれで決定的に分類できる。
       */
      kind: "kakei-cat01";
      /** 前方一致させるコード。例: `["0102"]` = 魚介類 */
      prefixes: string[];
    };

/** 1 つのグループ (カード 1 枚に対応) */
export interface TopicDef {
  /** カタログ内で一意。kebab-case。`other` は予約語 */
  key: string;
  /** UI 見出しに出す日本語ラベル */
  label: string;
  /** 割り当て規則。空配列なら overrides でのみ到達できる */
  matchers: TopicMatcher[];
}

/** 1 カテゴリ分のカタログ */
export interface CategoryTopicCatalog {
  categoryKey: CategoryKey;
  /** 表示順 = この配列の順。`other` は含めない (該当があれば末尾に自動付与) */
  topics: TopicDef[];
  /**
   * 規則で拾えない / 誤分類される metric の個別指定。matchers より優先する。
   * key = metric key、value = topic key。
   */
  overrides?: Record<string, string>;
}

/**
 * 受け皿グループの予約キー。どの規則にも一致しなかった metric がここへ落ちる。
 *
 * カタログ側で `other` を定義することは禁止 (validator が error)。
 * ラベルと「末尾に置く」挙動を 1 箇所に固定するため。
 */
export const OTHER_TOPIC_KEY = "other";

/** 受け皿グループのラベル */
export const OTHER_TOPIC_LABEL = "その他";

/** `resolveTopicKey` の入力。MetricConfig から必要な分だけ抜き出したもの */
export interface TopicResolutionInput {
  /** metric key */
  key: string;
  /** ランキング名 */
  title: string;
  /** 家計調査品目コード。`source.kind === "kakei-chousa"` のときだけ入る */
  cdCat01?: string | null;
}
