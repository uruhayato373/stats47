import type { SampleCountSpec } from "../../../packages/data-configs/src/types";

/**
 * 賃金構造基本統計調査「一般_都道府県別_職種(特掲)」(0003445758) の推計労働者数。
 *
 * 表章項目「労働者数」は 2022 年が 13、その他の年が 45 で、単位は十人
 * (e-Stat の表の表示画面 https://www.e-stat.go.jp/dbview?sid=0003445758 の表章項目一覧、2026-11-14 取得)。
 * 年収の `tabCombination` が 08/40・12/44 を並べるのと同じ並びにする。
 * 推計 10 人未満の県・年は順位から外して参考値にする (DATA-WAGE-TEACHER-COVERAGE-01、2026-11-14 オーナー決定)。
 */
export const WAGE_STRUCTURE_SAMPLE_COUNT: SampleCountSpec = { cdTab: "13,45", factor: 10, minimum: 10 };

/**
 * 同じ表の職種別の指標が共有する注記 (40 指標で同じ文を手で書かない)。
 * 調査の範囲は厚生労働省「令和5年賃金構造基本統計調査 調査の概要」
 * (https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/z2023/dl/gaiyo.pdf、2026-10-08 取得)。
 * 推計がその職種の就業者の一部しか映さない理由は公式資料で確かめていないので、理由は書かない。
 */
export const WAGE_STRUCTURE_COVERAGE_NOTE =
  "賃金構造基本統計調査は5人以上の民営事業所と10人以上の公営事業所から選んだ標本の調査で、この値は標本から推計した労働者の平均である。推計の労働者数はその職種で働く人全体より少ないことがあり、職種と県によっては数十人にとどまる。推計の労働者数は表の下に示し、推計が10人未満の県・年は順位から外して参考値として示す。";
