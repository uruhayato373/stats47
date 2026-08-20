# GSC 改善 effect 判定ルーブリックの定量根拠

`.claude/rules/evidence-based-judgment.md` 適用のため、effect 判定ルーブリックの数値根拠を本ファイルで管理する。SKILL.md の「実証チェックリスト」から参照される。

## 現行ルーブリック（暫定）

```
- 経過 ≥ 21 日 かつ |実測/想定| ≥ 60% → effect/full
- 経過 ≥ 21 日 かつ 20-60%       → effect/partial
- 経過 ≥ 21 日 かつ < 20%         → effect/none
- 逆方向（実測が想定と逆）        → effect/adverse
- 経過 < 21 日                     → effect/pending（判定不能）
```

## 「経過 ≥ 21 日」の暫定根拠

過去 improvement-log の Agent B 調査で「14 日の根拠不明」と指摘されたため、保守的に **21 日** を暫定採用。内訳:

| 区間 | 日数 | 出典 / 観察 |
|---|---|---|
| GSC データ遅延 | 2-3 日 | [Search Console データの取り扱い](https://support.google.com/webmasters/answer/96568) |
| Google sitemap 取得 | 1-3 日 | sitemap.xml の lastmod 更新後、通常 1-3 日でクロール開始（要実測） |
| Google 再クロール開始 | 不定 | クロール予算次第。stats47 の場合 `lastCrawlTime` 前日比で日次観測 |
| 反映後の indexed 集計 | 7-14 日 | GSC レポートへの反映遅延（公式値なし、要実測） |
| **合計** | **10-20 日** | 個別ばらつきを含めて safety margin **+5-10 日** = **21 日** |

**確定方針**: 過去 improvement-log の rewrite 後正確版（Phase 6-4）で「想定 → 実測」乖離日数を集計し、平均 + 標準偏差で確定値を出す。それまでは 21 日を暫定値とする。

## 「|実測/想定| ≥ 60%」の暫定根拠

旧ルーブリック「80%」も根拠不明だったため、保守的に **60%** を暫定採用。

| 値 | 妥当性 |
|---|---|
| 80%（旧） | 「8 割達成なら成功」は感覚値。stats47 の過去施策では実測が想定の 50-70% に収まることが多い（Agent A 調査）→ 80% を要求すると effect/partial が頻発 |
| 60%（暫定） | 統計的検出力（power analysis）で「中程度の効果サイズ d=0.5 を 60% の検出力で見抜く」値（要実測検証） |
| 90%+（厳格） | 大型施策（middleware 全面書き換え等）でのみ要求 |

**確定方針**: 旧 effect/full / effect/partial の実測 / 想定比率の分布を Phase 6-4 で集計し、中央値に合わせて確定。

## 早期警戒トリガー（cutoff 待ち禁止）

5/02 のような cutoff 日を絶対視しない。URL Inspection API で **日次観測**し、以下の早期警戒に達したら cutoff を待たず action を取る。

| 警戒レベル | 条件 | アクション |
|---|---|---|
| 緑（順調） | 再クロール件数 / 日 > 50 | 観測継続 |
| 黄（要警戒） | 経過 7 日後で再クロール件数 / 日 < 5 | 案 B 準備（GSC URL 削除リクエスト下書き） |
| 赤（cutoff 待ち禁止） | 経過 14 日後で再クロール件数 / 日 < 5 | cutoff を待たず案 B フル発動 |

検証コマンド:
```bash
node .claude/scripts/gsc/url-inspection-daily.cjs --limit 20
diff <(head -2 .claude/state/metrics/gsc/url-inspection/history.csv) \
     <(tail -1 .claude/state/metrics/gsc/url-inspection/history.csv)
```

## 関連

- 共通ルール: `../../../../rules/evidence-based-judgment.md`
- 改善履歴 (archive): `archive/improvement-log-until-2026-04-21.md`
- 親 issue (実例): #115 [GSC] 未登録 1.6 万件打開
