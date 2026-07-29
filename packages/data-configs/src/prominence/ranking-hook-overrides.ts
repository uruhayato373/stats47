/**
 * 問いかけコピー (hook) の手動上書き。**例外だけ**を置く。
 *
 * 原則は `derive-ranking-hook.ts` の導出規則で賄い、ここには
 * 「規則では意味が変わってしまう」「規則では長すぎる」ものだけを書く。
 * 全ランキングぶんを列挙しないこと — それをやると `isFeatured` (2,295 件中 8 件しか
 * 設定されなかった) と同じく維持されなくなる。
 *
 * 追加する前に、まず導出規則側を直せないか検討する。1 件のために規則を歪めるくらいなら
 * ここへ 1 行足す方が良いが、同じ形の不自然さが 10 件以上あるなら規則の不足を疑う。
 *
 * 初期値は旧 `HOME_FEATURED_RANKINGS` の hook 8 本。人が書いた編集コピーなので捨てない。
 * このモジュールは何も import しない。
 */

export const RANKING_HOOK_OVERRIDES: Readonly<Record<string, string>> = {
  // 「年間日照時間」から「年間」を落とす編集判断。導出では落とさない。
  "annual-sunshine-duration": "日照時間が最も長い県は？",
  // 「総人口」→「人口」。
  "total-population": "人口が最も多い県は？",
  // 将来推計。「最も多い/高い」ではなく「増える」を問う。導出では表現できない。
  "future-population-change-rate-2050": "2050年、人口が増える県は？",
  "agricultural-output": "農業産出額が最も多い県は？",
  // 「財政力指数」→「財政力」。指数という語を落として平易にする編集判断。
  "fiscal-strength-index-prefecture": "財政力が最も高い県は？",
  // 予想を裏切る形の問い。導出では作れない。
  "annual-clear-days": "快晴日数1位は沖縄？",
  "retirement-allowance-admin-prefecture": "退職手当が最も多い県は？",
  // 「1世帯当たり1か月間の消費支出」相当の長い title を短く言い換える。
  "consumption-expenditure-multi-person-households-per-month":
    "最も消費支出が多い県は？",
};
