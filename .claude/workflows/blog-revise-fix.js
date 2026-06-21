export const meta = {
  name: 'blog-revise-fix',
  description: 'critic REVISE 記事を指摘点に絞って修正 → 再 critic (PASS 目標)',
  phases: [
    { title: 'Fix', detail: 'article-writer が review.md の blocker/MAJOR を修正 + SVG 再生成' },
    { title: 'ReCritic', detail: 'blog-critic が再レビュー → review.md 更新' },
  ],
}

// args = ["slug1",...] (review.md verdict:REVISE の記事)
let raw = args
if (typeof raw === 'string') {
  try { raw = JSON.parse(raw) } catch (_e) { raw = [] }
}
if (!Array.isArray(raw)) raw = []
const slugs = raw.filter((s) => typeof s === 'string' && s)
log(`REVISE 修正 ${slugs.length} 件 (指摘点修正 → 再 critic)`)

const FIX_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    gatePassed: { type: 'boolean' },
    remainingBlockers: { type: 'number' },
    fixedIssues: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['gatePassed', 'remainingBlockers'],
}
const CRITIC_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    verdict: { type: 'string', enum: ['PASS', 'REVISE'] },
    blockers: { type: 'number' },
    summary: { type: 'string' },
  },
  required: ['verdict'],
}

function fixPrompt(slug) {
  return `OUTPUT は StructuredOutput tool で返す (人間向けテキスト不要)。

あなたは article-writer。**既に rewrite 済みだが blog-critic が REVISE 判定**した記事を、指摘点に絞って修正する。
記事: docs/21_ブログ記事原稿/${slug}/article.md
critic レビュー: docs/21_ブログ記事原稿/${slug}/review.md ← **まずこれを読み、blocker/MAJOR 指摘を把握する**

## 手順
1. review.md を読み、verdict:REVISE の理由 (blocker/MAJOR の具体指摘) を特定する。
   典型: 数値/順位がデータと矛盾 (散布図の県位置・callout 集計値の誤り)、SVG の順位反転、
   SVG 系譜欠落 (data/*.json・source.json 不在で図が再生成不能)、C/B 型の必須図 (時系列折れ線・散布図) 欠落 等。
2. 指摘された箇所のみ外科的に修正する (記事全体の作り直しはしない):
   - **数値・順位の矛盾**: data/*.json (SSOT) を真実として本文・callout・図を一致させる。捏造しない。
   - **SVG の誤り/系譜欠落/欠落図**: fetch-ranking-data-r2.mjs で正データ取得 → generate-article-charts.ts で再生成
     (.claude/rules/blog-data-schema.md §1.5/1.6・blog-svg-chart-standards.md に準拠。3点セット + columns/portrait)。
   - 数値・出典・順位は data/*.json と必ず突合 (捏造禁止)。frontmatter published は触らない。
3. 検証: node .claude/scripts/blog/quality-gate.mjs docs/21_ブログ記事原稿/${slug}/article.md
   blocker 0 を目指して反復 (最大3回)。
4. StructuredOutput で gatePassed / remainingBlockers / fixedIssues / notes を返す。

注意: 1記事のみ。指摘点に絞った外科的修正。commit/push しない。`
}

function criticPrompt(slug) {
  return `OUTPUT は StructuredOutput tool で返す。

あなたは blog-critic。**REVISE 後に修正された**記事を再レビューする。
記事: docs/21_ブログ記事原稿/${slug}/article.md / 既存レビュー: docs/21_ブログ記事原稿/${slug}/review.md

1. .claude/rules/blog-quality-standards.md の品質3層モデル② で再評価。前回の REVISE 指摘が解消されたか必ず確認。
   数値・順位が data/*.json と一致するか、欠落図が追加されたか、SVG 系譜が揃ったかを点検。
2. review.md を上書き更新 (frontmatter verdict + 指摘 + 判定理由)。
3. StructuredOutput で verdict(PASS/REVISE) / blockers / summary(≤30字) を返す。指摘が解消され読者価値が十分なら PASS。`
}

const results = await pipeline(
  slugs,
  (slug) =>
    agent(fixPrompt(slug), {
      label: `fix:${slug}`,
      phase: 'Fix',
      schema: FIX_SCHEMA,
      agentType: 'article-writer',
    }),
  (fix, slug) => {
    if (!fix) return { slug, gatePassed: false, critic: null, error: 'fix-null' }
    const rb = typeof fix.remainingBlockers === 'number' ? fix.remainingBlockers : 99
    if (rb > 1) return { slug, gatePassed: false, remainingBlockers: rb, critic: null }
    return agent(criticPrompt(slug), {
      label: `recr:${slug}`,
      phase: 'ReCritic',
      schema: CRITIC_SCHEMA,
      agentType: 'blog-critic',
    }).then((c) => ({ slug, gatePassed: true, critic: c ? c.verdict : null, criticSummary: c ? c.summary : null }))
  },
)

const done = results.filter(Boolean)
const pass = done.filter((r) => r.critic === 'PASS').length
const stillRevise = done.filter((r) => r.critic === 'REVISE').length
log(`完了: PASS ${pass} / なお REVISE ${stillRevise} / gate 未達 ${done.filter((r) => !r.gatePassed).length}`)
return { total: done.length, pass, stillRevise, results: done }
