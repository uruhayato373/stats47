/** Approved note hashtags: one git file per article, validated before it can reach note. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const HASHTAG_COUNT = 99;
export const HASHTAG_DIR = 'data/note/hashtags';
const MAX_LENGTH = 25;

/** Tags that describe note itself or ask for engagement, not the article's subject. */
export const GENERIC_HASHTAGS = new Set([
  '#note', '#noteクリエイター', '#毎日note', '#note記事', '#note初心者', '#読んで欲しい', '#フォロー',
  '#スキしてみて', '#クリエイター', '#情報発信', '#コンテンツ', '#マガジン', '#最新データ', '#まとめ',
  '#トレンド', '#注目', '#おすすめ', '#必読', '#知識', '#勉強', '#学び', '#インサイト', '#情報', '#知る',
  '#発見', '#無料', '#役立つ', '#保存版', '#シェアしたい', '#役に立つ情報', '#興味深い', '#面白い', '#へぇ',
  '#知らなかった', '#目からウロコ', '#なるほど', '#深い', '#勉強になる', '#ためになる', '#自己啓発',
  '#ライフスタイル', '#話題', '#人気', '#拡散希望', '#いいね', '#相互フォロー',
]);

const PREFECTURES = ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県',
  '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県',
  '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県',
  '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県',
  '沖縄県'];

export function plainText(html) {
  return String(html ?? '').replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

export const sourceSha256 = (title, text) => createHash('sha256').update(`${title}\n${text}`).digest('hex');

/** Prefectures named in the title must be findable by their own tag. */
export function requiredHashtags(title) {
  return PREFECTURES.filter((name) => title.includes(name)).map((name) => `#${name}`);
}

/** `text: null` re-checks a stored file without the article body (the year rule needs the body). */
export function validateHashtags(tags, { title, text }) {
  const errors = [];
  if (!Array.isArray(tags)) return { ok: false, errors: ['tags is not an array'] };
  const seen = new Set();
  for (const tag of tags) {
    if (typeof tag !== 'string' || !/^#[^#\s\-]+$/.test(tag)) errors.push(`format: ${tag}`);
    else if (/^#\d+$/.test(tag)) errors.push(`numbers only: ${tag}`);
    else if ([...tag].length > MAX_LENGTH) errors.push(`too long: ${tag}`);
    else if (GENERIC_HASHTAGS.has(tag)) errors.push(`generic: ${tag}`);
    else if (text != null && /^#(19|20)\d{2}年/.test(tag) && !`${title} ${text}`.includes(tag.slice(1, 6))) errors.push(`year not in article: ${tag}`);
    if (seen.has(tag)) errors.push(`duplicate: ${tag}`);
    seen.add(tag);
  }
  if (tags.length !== HASHTAG_COUNT) errors.push(`count ${tags.length} != ${HASHTAG_COUNT}`);
  for (const tag of requiredHashtags(title)) if (!seen.has(tag)) errors.push(`missing title region: ${tag}`);
  return { ok: errors.length === 0, errors };
}

export function hashtagFile(root, slug) {
  if (!/^[\w-]+$/.test(slug)) throw Error(`invalid slug: ${slug}`);
  return path.join(root, HASHTAG_DIR, `${slug}.json`);
}

/** Only a file whose tags still pass the gate for the recorded article may be published. */
export function readApprovedHashtags(root, slug, { noteUrl }) {
  const file = hashtagFile(root, slug);
  if (!fs.existsSync(file)) throw Error(`hashtag file missing: ${path.relative(root, file)}`);
  const record = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (record.slug !== slug || record.noteUrl !== noteUrl) throw Error(`hashtag file identity mismatch: ${slug}`);
  const check = validateHashtags(record.tags, { title: record.title, text: null });
  if (!check.ok) throw Error(`hashtag file invalid: ${slug}: ${check.errors.join('; ')}`);
  return record.tags;
}
