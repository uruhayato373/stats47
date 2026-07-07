export const meta = {
  name: 'blog-critic-followup',
  description: 'rewrite 済みブログに blog-critic を追走し review.md を生成 (PASS/REVISE)',
  phases: [{ title: 'Critic', detail: 'blog-critic が docs/21 の記事を意味レビュー → review.md' }],
}

// args = ["slug1","slug2",...] (rewrite 済・review.md 無しの critic 未実施記事)
let raw = args
if (typeof raw === 'string') {
  try { raw = JSON.parse(raw) } catch (_e) { raw = [] }
}
if (!Array.isArray(raw)) raw = []
const slugs = raw.filter((s) => typeof s === 'string' && s)
log(`critic 追走 ${slugs.length} 件 (rewrite 済・critic のみ走らせる)`)

// 行動契約 (凝縮版)。正典 .claude/rules/agent-output-contract.md「行動契約 (凝縮版)」。
const BEHAVIOR = `BEHAVIOR CONTRACT (命令):
- 即行動: 前置きせず評価に入る。採らない選択肢の陳列をしない。
- 進捗の実証: 各指摘を記事本文・data/*.json と突合。「品質低そう」の推測禁止 (具体箇所・定量で指摘)。
- 境界: article.md は read-only。書き込みは review.md のみ。commit/push しない。`

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

function criticPrompt(slug) {
  return `${BEHAVIOR}

OUTPUT は StructuredOutput tool で返す (人間向けテキスト不要)。

あなたは blog-critic。**既に rewrite 済み**の記事を読者価値の観点で **mode: full** で意味レビューする。リライトは行わない。
記事: docs/21_ブログ記事原稿/${slug}/article.md

1. 記事を読み、.claude/rules/blog-quality-standards.md の品質3層モデル②(意味レビュー)で評価する:
   curiosity gap の真正性 / 図あたりの解釈の厚み / 冗長・図表重複の有無 / callout の情報量 /
   ですます調の一貫性 / 内部リンクの妥当性 / 記事アーキタイプ(A-E)の必須分析視点が満たされているか /
   数値・順位が data/*.json と矛盾しないか。
2. review.md を docs/21_ブログ記事原稿/${slug}/review.md に書き出す (frontmatter に slug/reviewer:blog-critic/verdict/date、
   本文に 評価サマリ + 指摘[blocker/major/minor] + 判定理由)。verdict は必ず PASS か REVISE を明記。
3. StructuredOutput で verdict(PASS/REVISE) / blockers(致命的指摘数) / summary(≤30字) を返す。
   実体ある分析で読者価値が十分なら PASS、図表重複・水増し・薄い解釈・事実矛盾が残るなら REVISE。

注意: 1記事のみ担当。article.md は変更しない (read-only レビュー)。commit/push しない。`
}

const results = await parallel(
  slugs.map((slug) => () =>
    agent(criticPrompt(slug), {
      label: `cr:${slug}`,
      phase: 'Critic',
      schema: CRITIC_SCHEMA,
      agentType: 'blog-critic',
    }).then((c) => ({ slug, verdict: c ? c.verdict : null, summary: c ? c.summary : null })),
  ),
)

const done = results.filter(Boolean)
const pass = done.filter((r) => r.verdict === 'PASS').length
const revise = done.filter((r) => r.verdict === 'REVISE').length
log(`完了: PASS ${pass} / REVISE ${revise} / 計 ${done.length}`)
return { total: done.length, pass, revise, results: done }
