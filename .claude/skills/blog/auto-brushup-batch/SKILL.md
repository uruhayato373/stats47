---
name: auto-brushup-batch
description: GSC で改善余地の大きい blog 記事を自律的に rewrite + R2 push + PR auto-merge する。/schedule で 1 日 1 回 cron 実行することを想定。Pro plan compute 利用、API 不使用。
argument-hint: [--count 5] [--dry-run]
disable-model-invocation: false
---

GSC で改善余地の大きい blog 記事を自律的に rewrite し、R2 push + PR auto-merge までを完結させる **schedule-friendly 自動化スキル**。

## 起動経路

- `/schedule` routine: cron で毎日 JST 03:00 起動 (推奨)
- 手動起動: `/auto-brushup-batch --count 3 --dry-run`

## 重要な設計原則 (これを守らないと品質劣化する)

### 1. NG パターン回避は絶対 (rice-harvest 失敗事例から学習)

`.claude/scripts/blog/quality-gate.mjs` が **以下を強制的に reject** する。rewrite 時に避けること:

- ❌ 「X倍格差」(数値倍率の sensationalism、本質的価値を伴わない)
- ❌ 「驚愕の」「衝撃の」「ヤバい」「信じられない」(扇情的形容)
- ❌ 「最大級」(根拠不明の主観形容)
- ❌ 「N位」だけのタイトル (curiosity gap 不足)

**rice-harvest 失敗事例の教訓**: 私は「新潟 vs 東京で1244倍」を curiosity gap として採用したが、東京は「米作りをやめた」ではなく「そもそも農地が無い」ため比較基準不成立だった。「1244倍格差」は数値として正確だが本質的価値ゼロ。**ユーザーから「1224倍や格差、という視点は必要なのだろうか」と指摘されて再構築した**。

### 2. 5 案 generate → 評価 → best 選択 (機械的 framing の防止)

1 つの記事に対し **必ず 5 つの framing 案を内的に生成**し、各案を以下の 4 軸で評価する:

| 評価軸 | 評価内容 | 重み |
|---|---|---|
| **practical_value** | 読者が明日使える知識か? (政策評価、業務、生活で応用可能か) | 30% |
| **structural_finding** | データから読み解ける構造的発見か? (3要件、二系統、逆転現象 等) | 30% |
| **data_grounding** | データを正確に反映しているか? (誇張・歪曲なし) | 25% |
| **non_sensational** | 扇情的でなく、curiosity gap が本質的か? | 15% |

各案 0-10 点で採点し、**合計 30 点以上** の案がなければその記事を skip。

### 3. quality gate を通らなければ skip (script-level の防壁)

`.claude/scripts/blog/quality-gate.mjs` が `exit 0` を返した記事だけ commit する。`exit 1` の記事は skip し、log に残す。

### 4. agent autonomy は補助、scripted gate が主防壁

agent (Claude Code) の判断は補助的。最終判断は scripted gate (quality-gate.mjs) が下す。理由: agent も rice-harvest で誤判定した。script の機械チェックを最後の砦に置く。

## 実行フロー (agent が自律的に行う)

### Step 1: 候補選定 (plan 優先 + fresh fallback)

#### 1-a. 30 日 plan の参照 (優先)

`.claude/state/blog/auto-brushup-plan.json` が存在し、かつ今日の date がプランに含まれていればそれを使う:

```bash
TODAY=$(date -u +%Y-%m-%d)
node -e "
const p = require('./.claude/state/blog/auto-brushup-plan.json');
const today = p.days.find(d => d.date === '$TODAY');
if (today) {
  for (const slot of today.slots) console.log(JSON.stringify(slot));
}
"
```

#### 1-b. fresh 候補補完 (plan の slot が dedup 済 or 空の場合)

```bash
node .claude/scripts/blog/select-brushup-candidates.mjs --count 5 > /tmp/candidates.jsonl
```

候補が 0 件なら exit 0 (今日は処理対象なし)。

#### 1-c. plan の rotation (週次)

毎週月曜の routine 起動時のみ、plan を refresh:

```bash
DOW=$(date -u +%u)  # 1=月曜
if [ "$DOW" = "1" ]; then
  node .claude/scripts/blog/generate-brushup-plan.mjs --days 30 --per-day 5
fi
```

これにより最新 GSC snapshot を反映した plan が継続的に更新される。

### Step 2: 各候補を 1 件ずつ rewrite

各候補について以下を agent (Claude Code) が実行:

#### 2-1. 既存記事の読み込みと診断

```bash
cat .local/r2/app/blog/<slug>/article.md
```

frontmatter (title, seoTitle, description, tags) + 本文 + 現在の H2 構成 + callout 数 + chart 数を把握。

#### 2-2. 関連 metrics 探索 (面白い対比探し)

D1 query で同じ category の関連 metric を 3-5 個ピックアップ:

```bash
sqlite3 ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite" \
  "SELECT key, title FROM metrics WHERE category_key='<カテゴリ>' AND is_active=1 LIMIT 20;"
```

「面積 vs 効率」「平均 vs 中央値」「総量 vs 比率」「TOP1 単独 vs TOP10 集中度」などの **対比軸** を 1-2 個発見。

#### 2-3. 5 案 framing 生成と評価 (内部の thinking で)

5 案を生成し、4 軸 (practical_value / structural_finding / data_grounding / non_sensational) で各 0-10 点採点。

合計 30 点以上の案がなければこの記事を skip し次の候補へ。

#### 2-4. best framing で rewrite

best 案で seoTitle, description, 本文を再構成。`docs/02_実装計画/cities-revival-plan.md` 周辺の rice-harvest 改修 (`/blog/rice-harvest-volume-prefecture-gap/article.md`) を参照実装として模倣。

構成テンプレ:
1. 冒頭 (緊張感セットアップ + 中核質問)
2. データ概要 (本テーマの全体像)
3. 構造的発見 1 (主要)
4. 構造的発見 2 (補助 or 対比)
5. 対立軸 or 限界
6. まとめ + 政策含意 / 実用 take-away
7. データの位置づけ (古いデータなら基準年フレーミング)
8. データ出典 + ライセンス
9. 関連ランキング・記事 (内部リンク 6+ 個)

必須要素:
- callout 3-4 個 ([!NOTE], [!WARNING], [!TIP] のミックス)
- chart 1-2 個 (SVG 直書き、TOP10 + 対比可視化)
- 内部リンク 6+ 個

#### 2-5. R2 書き込み

```bash
# article.md を上書き保存 (.local/r2/app/blog/<slug>/article.md)
```

#### 2-6. quality gate チェック

```bash
node .claude/scripts/blog/quality-gate.mjs <slug>
# exit 0 → 通過、commit OK
# exit 1 → skip、article を revert (git checkout)
```

通過 article のみ最終 commit 対象。

### Step 3: bulk sync + R2 push + commit

通過記事が 1 件以上ある場合のみ実行:

```bash
npm run articles:sync-from-r2 --workspace=packages/database
bash .claude/skills/db/sync-snapshots/run.sh --only blog

git checkout -b feature/auto-brushup-YYYY-MM-DD develop
git add .  # search-index.json 等の自動再生成 file
git commit -m "auto-brushup: N 記事 rewrite (slugs: ...)"
git checkout develop
git merge --no-ff feature/auto-brushup-YYYY-MM-DD -m "Merge auto-brushup YYYY-MM-DD"
git push origin develop
```

### Step 4: PR 作成 + auto-merge 設定

```bash
gh pr create --base main --head develop \
  --title "auto-brushup YYYY-MM-DD (N 記事)" \
  --body "$(cat /tmp/brushup-report.md)"

# CI 通過したら auto-merge
gh pr merge --auto --merge
```

PR 本文には:
- 処理対象 candidates 一覧 (impressions, CTR, expectedLift)
- 各記事の採用 framing + 棄却 4 案 + 採点根拠
- quality gate チェック結果

### Step 5: history 更新

```bash
# .claude/state/blog/auto-brushup-history.json に追記
# { "date": "YYYY-MM-DD", "slug": "...", "framing_score": N, "expectedLift": N }
```

90 日以内の re-brushup を防ぐため。

### Step 6: skip した記事の log

quality gate or framing 評価で skip した記事を `.claude/state/blog/auto-brushup-skipped.log` に記録。週次でレビューして prompt 改善の手がかりに。

## 安全装置

### Safety Limit 1: 1 日最大 5 記事

count > 5 の場合は強制的に 5 に clamp。一気に大量変更で site quality 判定リスクを避ける。

### Safety Limit 2: 全件 skip 日は何もせず終了

5 件全て quality gate fail なら commit せず終了。「変更なし」で安全側に倒す。

### Safety Limit 3: CI 失敗で halt

直近 24h で auto-brushup の PR が CI fail したら、次の routine 起動時にチェックし **当日は skip** (cooling period)。

### Safety Limit 4: roll-back monitoring

4 週後に GSC で各 brushup 対象記事の CTR を再計測。改修前より下落していたら **`/auto-brushup-revert <slug>`** を手動実行できるよう、コミット SHA を history に記録。

## /schedule routine 設定

```bash
/schedule create \
  --name "blog-auto-brushup-daily" \
  --cron "0 18 * * *" \   # UTC 18:00 = JST 03:00
  --prompt "/auto-brushup-batch --count 5"
```

または既存の `.github/workflows/` 配下に YAML を置く (代替手段、`/schedule` が使えない場合)。

## 関連ファイル

- script: `.claude/scripts/blog/select-brushup-candidates.mjs` (fresh 候補選定)
- script: `.claude/scripts/blog/quality-gate.mjs` (品質ゲート)
- script: `.claude/scripts/blog/generate-brushup-plan.mjs` (30 日 plan 生成、週次 refresh)
- 参照実装: `.local/r2/app/blog/rice-harvest-volume-prefecture-gap/article.md` (地理決定論軸 brushup の好例)
- 失敗事例 ledger: `docs/05_改善ログ/gsc.md` の BLOG-CTR-* 系
- 品質基準: `.claude/rules/blog-quality-standards.md`
- history: `.claude/state/blog/auto-brushup-history.json`
- skipped log: `.claude/state/blog/auto-brushup-skipped.log`
- 30 日 plan: `.claude/state/blog/auto-brushup-plan.json` (routine が daily 参照)
- 人間レビュー用 plan report: `docs/03_週次運用/blog-brushup-plan.md`
