/** Ask headless Claude for 99 tags and accept only a set that passes the deterministic gate. */
import { spawn } from 'node:child_process';
import { HASHTAG_COUNT, HASHTAG_MODEL, GENERIC_HASHTAGS, requiredHashtags, validateHashtags } from './note-hashtags.mjs';

const BODY_CHARS = 6000;
const ATTEMPTS = 3;

function prompt({ title, vertical, text, errors, previous }) {
  return [
    `note 記事に付けるハッシュタグをちょうど${HASHTAG_COUNT}個提案してください。`,
    '目的: この記事を読みたい人が、テーマ・地域・データ・用途の言葉で検索したときに見つけられるようにすること。',
    '',
    '条件:',
    '- すべてのタグが、この記事の主題・地域・使っているデータや統計・分析の方法・想定読者・読者が一緒に調べそうな関連テーマのどれかを表すこと。',
    '- 記事と関係のない人気タグ、note 自体やフォローを促すタグ、「面白い」「おすすめ」のような中身を表さない言葉は使わないこと。',
    `- 使ってはいけない例: ${[...GENERIC_HASHTAGS].slice(0, 20).join(' ')}`,
    '- 1つの県を主題にした記事では、ほかの県名タグは本文で主な比較相手として論じている県だけにし、多くても5個まで。全国の県を並べるランキング記事では、本文で取り上げた上位・下位の県を入れてよい。',
    '- 人が検索しない細かい語 (ファイル形式・拡張子・機器の型番・製品の細かいプラン名) は使わないこと。',
    '- 記事が想定していない読者層 (例: 子ども向けの「自由研究」「社会科」) のタグは使わないこと。',
    '- 形式: 先頭に # を1つ、空白・ハイフン・#を含めない、数字だけにしない、25文字以内、重複なし (大文字小文字の違いも重複)。',
    '- 使える文字は ひらがな・カタカナ・漢字・英数字・長音・中黒・アンダースコアだけ (ギリシャ文字・記号は note が落とす)。',
    '- 年のタグ (例: #2024年) は記事に出てくる年だけ。',
    ...(requiredHashtags(title).length ? [`- 必ず含める: ${requiredHashtags(title).join(' ')}`] : []),
    '- 具体的な言葉 (品目名・地名・指標名・制度名) を中心に、少し広いテーマの言葉も混ぜること。',
    '',
    `記事のシリーズ: ${vertical}`,
    `タイトル: ${title}`,
    `本文 (先頭): ${text.slice(0, BODY_CHARS)}`,
    ...(errors ? ['', `前回の提案は次の理由で不合格でした。直して${HASHTAG_COUNT}個を出し直してください: ${errors.join(' / ')}`, `前回の提案: ${JSON.stringify(previous)}`] : []),
    '',
    '出力: JSON だけを1行で返す。形式 {"tags":["#...", ...]}。説明文は書かない。',
  ].join('\n');
}

function askClaude(input, cwd) {
  const args = ['-p', prompt(input), '--model', HASHTAG_MODEL, '--tools', '', '--strict-mcp-config', '--no-session-persistence',
    '--setting-sources', 'project', '--settings', '{"disableAllHooks":true}', '--output-format', 'json'];
  return new Promise((resolve, reject) => {
    const child = spawn('claude', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), 5 * 60 * 1000);
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', reject);
    child.on('close', () => {
      clearTimeout(timer);
      try {
        const envelope = JSON.parse(stdout || '{}');
        if (envelope.is_error || typeof envelope.result !== 'string') throw Error(`claude failed: ${(envelope.result || stderr || stdout).slice(0, 300)}`);
        const json = envelope.result.match(/\{[\s\S]*\}/)?.[0];
        if (!json) throw Error('claude returned no JSON');
        resolve({ tags: JSON.parse(json).tags, costUsd: envelope.total_cost_usd ?? 0 });
      } catch (error) { reject(error); }
    });
  });
}

/** `text` is the article body as plain text; returns gate-passing tags or throws with the last violations. */
export async function proposeHashtags({ title, vertical, text, cwd }) {
  let tags, errors, costUsd = 0;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    const answer = await askClaude({ title, vertical, text, errors, previous: tags }, cwd);
    costUsd += answer.costUsd;
    tags = answer.tags;
    const check = validateHashtags(tags, { title, text });
    if (check.ok) return { tags, costUsd };
    errors = check.errors;
  }
  throw Error(`gate failed after ${ATTEMPTS} attempts: ${errors.slice(0, 5).join('; ')}`);
}
