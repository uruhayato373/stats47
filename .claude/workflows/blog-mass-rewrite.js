export const meta = {
  name: 'blog-mass-rewrite',
  description: 'must-fix ブログ記事を品質基準に沿って一括リライト (rewrite→quality-gate→critic)',
  phases: [
    { title: 'Rewrite', detail: 'article-writer が blocker を修正し quality-gate を通す' },
    { title: 'Critic', detail: 'blog-critic が review.md を生成 (PASS/REVISE)' },
  ],
}

// ★バッチ運用の規律 (2026-06-21 実測): 1 記事 ~217K トークン (rewrite+critic)。
//   112 件一括は 24.3M トークンでセッション上限に当たり critic ~50 件が失敗した。
//   → 1 バッチ 15〜20 件に分割し、SSOT で進捗を記録しながら順次回す。再リライト防止。
//
//   定型ループ (1 セッション 1 バッチ):
//     1. node .claude/scripts/blog/build-remediation-queue.mjs --next 15   # pending 上位15 slug
//     2. Workflow({scriptPath:".../blog-mass-rewrite.js", args:[その15 slug]})
//     3. node .claude/scripts/blog/sync-rewrite-progress.mjs --wave-id <date>-N  # docs/21→queue 記録
//        (PASS=done / rewrite済未PASS=in-progress。--next は pending しか返さない=再リライトしない)
//     4. 次セッションで 1 に戻る
//   正典: docs/02_実装計画/06_ブログ品質是正ループ.md

// args = ["slug1","slug2",...] または [{slug, blockers?}, ...] (combinedScore 優先順)
// args が文字列(JSON encoded)で届くケースに備えてパースする。
let raw = args
if (typeof raw === 'string') {
  try { raw = JSON.parse(raw) } catch (_e) { raw = [] }
}
if (!Array.isArray(raw)) raw = []
// slug 文字列 or {slug,...} を正規化
const entries = raw.map((e) => (typeof e === 'string' ? { slug: e } : e)).filter((e) => e && e.slug)
log(`args 受信: type=${typeof args} / entries=${entries.length} 件`)
log(`must-fix ブログ ${entries.length} 件をリライト (rewrite → gate → critic)`)

const REWRITE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    gatePassed: { type: 'boolean', description: 'quality-gate の blocker が 0 になったか' },
    remainingBlockers: { type: 'number', description: '残った blocker 数' },
    blockerDetail: { type: 'string', description: '残 blocker の要約 (なければ空)' },
    fixed: { type: 'array', items: { type: 'string' }, description: '修正した項目' },
    chartsGenerated: { type: 'number', description: '生成/再生成した SVG 数' },
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

function rewritePrompt(e) {
  const hint = Array.isArray(e.blockers) && e.blockers.length
    ? `\n## 参考: キュー記録の blocker (要確認・最新は quality-gate で取得)\n${e.blockers.map((b) => '- ' + b).join('\n')}\n`
    : ''
  return `OUTPUT は StructuredOutput tool で返す (人間向けテキスト不要)。

あなたは stats47 のブログ記事を品質基準に沿ってリライトする article-writer。対象 slug: ${e.slug}
${hint}
## 手順
1. 作業域を用意し R2 公開URLから記事を取得 (記事の SSOT は R2):
   mkdir -p docs/21_ブログ記事原稿/${e.slug}/data
   curl -fsS "https://storage.stats47.jp/app/blog/${e.slug}/article.md" -o docs/21_ブログ記事原稿/${e.slug}/article.md
   既存の data/*.json / *.svg があれば同様に取得 (記事本文の ![](data/<name>.svg) 参照名から判断)。
   取得後すぐ quality-gate を実行して**現在の blocker を確定**する (キュー記録より優先):
   node .claude/scripts/blog/quality-gate.mjs docs/21_ブログ記事原稿/${e.slug}/article.md
2. .claude/rules/blog-quality-standards.md と blog-svg-chart-standards.md / blog-data-schema.md を読み、検出された blocker を全て解消する。以下を厳守:
   - 記事内の「## 関連ランキング」「## 関連記事」等の見出しは削除 (ページ側コンポーネントが正典)。
   - callout は記事固有で 2 個以上 ([!NOTE] 定義 / [!WARNING] 限界 / [!TIP] 読み筋。定型コピペ禁止)。
   - インライン <svg> と <chart-placeholder> は禁止 → 生成画像 ![](data/<name>.svg) に置換。
   - markdown 表 (| … |) は全面禁止 → ランキングは「上位5+下位5」カード型 SVG に置換:
       ランキングデータを R2 から取得して data/*.json を作る:
         node .claude/scripts/blog/fetch-ranking-data-r2.mjs --slug ${e.slug} --keys <rankingKey> --data-name <name>
       (rankingKey は記事の <source-link href="/ranking/KEY"> や本文から特定。app/ranking/<key>/values.json が 200 で実在するキーを使う。命名ゆれに注意し実在確認する)
       SVG を生成: npx tsx .claude/scripts/blog/generate-article-charts.ts --base docs/21_ブログ記事原稿 --slug ${e.slug}
       本文に ![alt](data/<name>.svg) で埋め込み、各図の直下に <source-link href="/ranking/<key>"> をインライン配置 (末尾集約禁止)。
   - internalLinks を 3 個以上 (/ranking/ /areas/ /blog/ /category/ のいずれか。本文中に自然に)。
   - 地の文は「ですます調」に完全統一 (である調は copula「だ。である。」だけでなく動詞終止形「〜する。〜なる。」も全て直す。機械置換禁止・文単位で書き換える)。
   - 数値・順位・出典は改変しない (data/*.json と本文を突合。捏造禁止)。frontmatter の published は触らない。
3. 検証 (決定的): node .claude/scripts/blog/quality-gate.mjs docs/21_ブログ記事原稿/${e.slug}/article.md
   blocker が出たら修正を反復 (最大3回)。blocker 0 を目指す。
4. StructuredOutput で gatePassed / remainingBlockers / blockerDetail / fixed / chartsGenerated / notes を返す。

注意: 1記事のみ担当。他 slug には触らない。commit / push はしない (ドラフトを作るだけ)。`
}

function criticPrompt(slug) {
  return `OUTPUT は StructuredOutput tool で返す。

あなたは blog-critic。対象記事をリライト後の読者価値の観点でレビューする。
記事: docs/21_ブログ記事原稿/${slug}/article.md

1. 記事を読み、.claude/rules/blog-quality-standards.md の品質3層モデル②(意味レビュー)に従い評価:
   curiosity gap の真正性 / 図あたりの解釈の厚み / 冗長・図表重複の有無 / callout の情報量 / ですます調の一貫性 / 内部リンクの妥当性。
2. review.md を docs/21_ブログ記事原稿/${slug}/review.md に書き出す (frontmatter: slug/reviewer:blog-critic/verdict/date 無しでよいが verdict は明記。評価サマリ + 指摘[blocker/major/minor] + 判定理由)。
3. StructuredOutput で verdict(PASS/REVISE) / blockers(致命的指摘数) / summary(≤30字) を返す。
   実体のある分析で読者価値が十分なら PASS、水増し・図表重複・薄い解釈が残るなら REVISE。`
}

const results = await pipeline(
  entries,
  (e) =>
    agent(rewritePrompt(e), {
      label: `rw:${e.slug}`,
      phase: 'Rewrite',
      schema: REWRITE_SCHEMA,
      agentType: 'article-writer',
    }),
  (rw, e) => {
    if (!rw) return { slug: e.slug, realBlockersFixed: false, critic: null, error: 'rewrite-null' }
    // quality-gate は review.md(verdict:PASS) が無いと「critic レビュー未通過」を 1 blocker として残す。
    // article-writer は自己採点禁止なので remainingBlockers===1(critic項目のみ) は「実 blocker 解消済み」とみなし
    // blog-critic を走らせて review.md を生成する。実 blocker が 2 件以上残るならリライト未完 → critic に進まない。
    const rb = typeof rw.remainingBlockers === 'number' ? rw.remainingBlockers : 99
    if (rb > 1)
      return { slug: e.slug, realBlockersFixed: false, remainingBlockers: rb, blockerDetail: rw.blockerDetail, critic: null }
    return agent(criticPrompt(e.slug), {
      label: `cr:${e.slug}`,
      phase: 'Critic',
      schema: CRITIC_SCHEMA,
      agentType: 'blog-critic',
    }).then((c) => ({
      slug: e.slug,
      realBlockersFixed: true,
      chartsGenerated: rw.chartsGenerated,
      critic: c ? c.verdict : null,
      criticSummary: c ? c.summary : null,
      publishReady: !!c && c.verdict === 'PASS',
    }))
  },
)

const done = results.filter(Boolean)
const fixed = done.filter((r) => r.realBlockersFixed).length
const criticPass = done.filter((r) => r.critic === 'PASS').length
const publishReady = done.filter((r) => r.publishReady).length
log(`完了: 実blocker解消 ${fixed}/${done.length} / critic PASS ${criticPass} / 公開可 ${publishReady}`)
return { total: done.length, realBlockersFixed: fixed, criticPass, publishReady, results: done }
