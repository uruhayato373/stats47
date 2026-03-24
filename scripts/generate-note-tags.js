const fs = require('fs');
const path = require('path');

const BASE_DIR = 'docs/31_note記事原稿';

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

const FIXED_TAGS = [
  '都道府県ランキング', '統計データ', '都道府県比較', 'stats47',
  '地域格差', 'データ分析', '行動者率', '社会生活基本調査',
  '都道府県', '47都道府県', 'ランキング', '全国ランキング',
  '地域差', '日本', '統計'
];

const THEME_TAGS = {
  'art-appreciation': ['美術鑑賞', '美術', '美術館', '芸術鑑賞', '芸術', 'アート', '文化', '趣味', '教養', '美術展', 'ギャラリー', '絵画鑑賞'],
  'calligraphy': ['書道', '習字', '毛筆', '書', '伝統文化', '日本文化', '趣味', '和文化', '書道教室', '文化活動'],
  'camping': ['キャンプ', 'アウトドア', 'レジャー', '趣味', 'キャンプ場', 'BBQ', 'バーベキュー', '自然', 'テント', 'グランピング', 'ソロキャンプ', 'ファミリーキャンプ', 'アウトドアライフ'],
  'chorus': ['コーラス', '声楽', '合唱', '音楽', '歌', '趣味', '合唱団', '音楽活動', 'ハーモニー', '文化活動', '歌唱'],
  'cinema': ['映画', '映画鑑賞', '映画館', 'シネマ', 'エンタメ', '趣味', 'レジャー', '娯楽', '映画好き', 'シネコン'],
  'classical-music': ['クラシック', 'クラシック音楽', 'クラシック鑑賞', '音楽鑑賞', '音楽', 'コンサート', 'オーケストラ', '趣味', '教養', '文化', 'クラシックコンサート'],
  'cooking': ['料理', '菓子作り', 'お菓子作り', '趣味', '料理好き', 'クッキング', '家庭料理', '手作り', '食文化', 'グルメ', '料理教室', 'スイーツ作り'],
  'diy': ['DIY', '日曜大工', '趣味', 'ものづくり', 'ハンドメイド', '手作り', 'ホームセンター', 'リフォーム', 'クラフト', '工作', 'セルフリノベーション'],
  'flower-arrangement': ['華道', '生け花', 'いけばな', 'フラワーアレンジメント', '花', '伝統文化', '日本文化', '趣味', '和文化', '文化活動', '花道'],
  'gardening': ['園芸', 'ガーデニング', '趣味', '植物', '花', '家庭菜園', '庭づくり', '緑化', '栽培', 'プランター', 'ベランダ菜園', '園芸店'],
  'go': ['囲碁', 'ボードゲーム', '趣味', '頭脳スポーツ', '知的遊戯', '伝統文化', '囲碁教室', '対局', '棋士', '碁盤'],
  'home-movie': ['映画鑑賞', '動画視聴', 'サブスク', 'Netflix', 'Amazon Prime', '趣味', '娯楽', 'エンタメ', 'VOD', '配信', 'ストリーミング', '自宅映画'],
  'instrument': ['楽器', '楽器演奏', '音楽', '趣味', 'ピアノ', 'ギター', '吹奏楽', '演奏', '音楽教室', '三線', 'バンド'],
  'japanese-dance': ['邦舞', '日本舞踊', 'おどり', '踊り', '伝統文化', '日本文化', '趣味', '舞踊', '和文化', '伝統芸能', '盆踊り'],
  'japanese-music': ['邦楽', '日本音楽', '三味線', '琴', '尺八', '和楽器', '伝統音楽', '日本文化', '趣味', '伝統文化', '三線', '沖縄音楽'],
  'karaoke': ['カラオケ', '歌', '趣味', '娯楽', 'レジャー', 'エンタメ', '歌唱', 'ヒトカラ', 'カラオケボックス'],
  'knitting': ['編み物', '手芸', 'ハンドメイド', '趣味', '手作り', 'クラフト', '毛糸', 'ニット', '手編み', '手芸店'],
  'manga': ['マンガ', '漫画', '読書', '趣味', '娯楽', 'エンタメ', 'コミック', '電子書籍', '少年漫画', '少女漫画', '漫画好き'],
  'music-listening': ['音楽鑑賞', '音楽', 'CD', 'スマートフォン', 'スマホ', 'ストリーミング', 'サブスク', '趣味', 'Spotify', 'Apple Music', '音楽好き'],
  'pachinko': ['パチンコ', 'パチスロ', 'ギャンブル', '娯楽', 'レジャー', '趣味', 'アミューズメント', '遊技', 'ホール'],
  'painting': ['絵画', '彫刻', 'アート', '美術', '趣味', '創作', 'ものづくり', '油絵', '水彩画', 'デッサン', '芸術活動', '美術制作'],
  'photography': ['写真', 'カメラ', '趣味', 'フォト', '撮影', '写真撮影', 'プリント', 'スマホ写真', '一眼レフ', 'ミラーレス', 'フォトグラフィー'],
  'popular-music': ['ポピュラー音楽', 'J-POP', 'ポップス', 'ロック', '音楽鑑賞', '音楽', 'ライブ', 'コンサート', '趣味', 'フェス', '音楽フェス'],
  'pottery': ['陶芸', '工芸', '趣味', 'ものづくり', 'ハンドメイド', '伝統工芸', '焼き物', '陶芸教室', 'クラフト', '窯元', '手びねり'],
  'reading': ['読書', '本', '趣味', '教養', '図書館', '書店', '小説', 'ノンフィクション', '電子書籍', '読書好き', '読書習慣', '活字離れ'],
  'sewing': ['和裁', '洋裁', '裁縫', '手芸', 'ハンドメイド', '趣味', '手作り', 'ソーイング', '服作り', 'ミシン'],
  'shogi': ['将棋', 'ボードゲーム', '趣味', '頭脳スポーツ', '知的遊戯', '藤井聡太', '棋士', '将棋教室', '対局'],
  'sports-spectating': ['スポーツ観覧', 'スポーツ観戦', '趣味', 'プロ野球', 'Jリーグ', 'サッカー', '野球', 'スポーツ', 'スタジアム', '応援', '観戦'],
  'tea-ceremony': ['茶道', 'お茶', '抹茶', '伝統文化', '日本文化', '趣味', '和文化', '茶道教室', '裏千家', '表千家', '茶の湯'],
  'theater': ['演芸', '演劇', '舞踊', '鑑賞', '芸術', '文化', '趣味', '劇場', '舞台', 'ミュージカル', '観劇', 'エンタメ', '歌舞伎', '落語'],
  'theme-parks': ['遊園地', '動物園', '植物園', '水族館', 'テーマパーク', 'レジャー', '趣味', '娯楽', 'ディズニー', 'USJ', 'お出かけ', 'ファミリー'],
  'video-games': ['ゲーム', 'テレビゲーム', 'ビデオゲーム', '趣味', '娯楽', 'エンタメ', 'eスポーツ', 'Switch', 'PlayStation', 'スマホゲーム', 'ゲーマー'],
  'western-dance': ['洋舞', '社交ダンス', 'ダンス', 'バレエ', '趣味', '運動', 'フィットネス', 'ダンス教室', 'ヒップホップ', 'ジャズダンス'],
  'writing': ['創作', '詩', '和歌', '俳句', '小説', '執筆', '文芸', '趣味', '文学', '短歌', '川柳', '同人', '小説家になろう', '創作活動'],
  'badminton': ['バドミントン', 'スポーツ', '趣味', '運動', 'ラケットスポーツ', 'シャトル', 'バドミントン部', '体育館'],
  'baseball': ['野球', '草野球', 'プロ野球', 'スポーツ', '趣味', '甲子園', '高校野球', 'ベースボール', '野球好き', '少年野球'],
  'basketball': ['バスケットボール', 'バスケ', 'Bリーグ', 'NBA', 'スポーツ', '趣味', '運動', 'ミニバス', 'バスケ部'],
  'bowling': ['ボウリング', 'レジャー', 'スポーツ', '趣味', '娯楽', 'ボウリング場', 'ストライク'],
  'cycling': ['サイクリング', '自転車', 'ロードバイク', 'スポーツ', '趣味', '運動', 'フィットネス', 'ポタリング', 'クロスバイク', 'ツーリング'],
  'fishing': ['つり', '釣り', 'フィッシング', 'スポーツ', '趣味', 'レジャー', 'アウトドア', '海釣り', '渓流釣り', 'バス釣り', '釣り好き'],
  'golf': ['ゴルフ', 'スポーツ', '趣味', 'ゴルフ場', '打ちっぱなし', 'ゴルフコース', 'ラウンド', 'スコア', 'ゴルフ好き'],
  'ground-golf': ['グラウンドゴルフ', 'グラウンドゴルフ場', 'スポーツ', '趣味', '高齢者スポーツ', 'シニアスポーツ', '健康づくり', '生涯スポーツ'],
  'gym-training': ['トレーニング', '筋トレ', 'ジム', 'フィットネス', 'スポーツ', '趣味', '運動', 'ウエイトトレーニング', 'フィットネスジム', '健康', 'ボディメイク'],
  'hiking': ['登山', 'ハイキング', '山登り', 'スポーツ', '趣味', 'アウトドア', 'トレッキング', '山岳', '低山ハイク', '百名山'],
  'jogging': ['ジョギング', 'マラソン', 'ランニング', 'スポーツ', '趣味', '運動', '健康', 'フルマラソン', 'ハーフマラソン', 'ランナー', '市民マラソン'],
  'judo': ['柔道', '武道', 'スポーツ', '格闘技', '日本文化', '趣味', '柔道場', '段位', '柔道部'],
  'kendo': ['剣道', '武道', 'スポーツ', '格闘技', '日本文化', '趣味', '剣道場', '段位', '剣道部', '竹刀'],
  'skiing': ['スキー', 'スノーボード', 'ウィンタースポーツ', 'スポーツ', '趣味', 'スキー場', 'ゲレンデ', '雪山', '冬', 'スノボ'],
  'soccer': ['サッカー', 'Jリーグ', 'フットサル', 'スポーツ', '趣味', '運動', 'フットボール', 'サッカー部', 'サッカー好き'],
  'softball': ['ソフトボール', 'スポーツ', '趣味', '運動', '野球', 'ソフトボール部', '地域スポーツ'],
  'swimming': ['水泳', 'プール', 'スポーツ', '趣味', '運動', 'フィットネス', '健康', 'スイミング', 'スイミングスクール', '競泳'],
  'table-tennis': ['卓球', 'スポーツ', '趣味', '運動', 'ラケットスポーツ', '卓球台', '卓球部', 'ピンポン'],
  'tennis': ['テニス', 'スポーツ', '趣味', '運動', 'ラケットスポーツ', 'テニスコート', 'テニス部', '硬式テニス'],
  'volleyball': ['バレーボール', 'バレー', 'スポーツ', '趣味', '運動', 'ママさんバレー', 'バレー部', 'Vリーグ'],
  'walking': ['ウォーキング', '体操', '散歩', 'スポーツ', '趣味', '運動', '健康', 'フィットネス', '健康づくり', '歩く', '軽い運動'],
  'yoga': ['ヨガ', 'フィットネス', 'スポーツ', '趣味', '運動', '健康', 'ピラティス', 'ヨガ教室', 'ストレッチ', 'マインドフルネス', 'リラクゼーション'],
  'day-trip': ['日帰り旅行', '行楽', 'お出かけ', '日帰り', 'レジャー', '趣味', 'ドライブ', '観光', '小旅行', 'お出かけスポット'],
  'domestic': ['国内旅行', '旅行', '旅', '観光', 'トラベル', '趣味', 'レジャー', '宿泊', 'ホテル', '温泉旅行', '一人旅'],
  'domestic-tourism': ['国内観光', '観光旅行', '旅行', '観光', '趣味', 'レジャー', '観光地', '名所', '絶景', '旅先'],
  'homecoming': ['帰省', '訪問', '旅行', '里帰り', 'お盆', '年末年始', 'ふるさと', '故郷', '家族', '帰省ラッシュ'],
  'overnight': ['宿泊旅行', '旅行', '旅', '宿泊', 'ホテル', '旅館', '趣味', 'レジャー', '温泉', '一泊二日'],
  'overseas': ['海外旅行', '海外観光', '旅行', '海外', '趣味', 'レジャー', 'コロナ', 'パスポート', '渡航', '海外渡航'],
  'academic': ['人文科学', '社会科学', '自然科学', '学習', '教育', '教養', '生涯学習', '学び直し', 'リカレント教育'],
  'arts-culture': ['芸術', '文化', '学習', '教養', '生涯学習', '文化活動', '芸術活動', 'カルチャースクール'],
  'business': ['商業実務', 'ビジネス', '学習', 'スキルアップ', 'キャリア', '資格', '自己研鑽', 'ビジネススキル'],
  'business-skills': ['商業実務', 'ビジネス', '学習', 'スキルアップ', 'キャリア', '資格', '自己研鑽', 'ビジネススキル', '情報処理除く'],
  'computer': ['パソコン', '情報処理', 'IT', 'プログラミング', '学習', 'スキルアップ', 'PC', 'デジタルスキル', 'リテラシー', 'DX'],
  'english': ['英語', '英語学習', '英会話', '語学', '学習', '教育', 'TOEIC', 'TOEFL', '英検', 'グローバル', '外国語'],
  'foreign-language': ['外国語', '語学', '語学学習', '学習', '教育', '英語', '中国語', '韓国語', 'グローバル', '多言語'],
  'home-economics': ['家政', '家事', '料理', '学習', '生活', '家庭科', '生涯学習', '家事スキル'],
  'nursing-care': ['介護', '福祉', '学習', '資格', 'ヘルパー', '介護福祉士', '高齢化', '高齢者', 'ケアマネ', '介護職'],
  'other-language': ['外国語', '語学', '英語以外', '学習', '中国語', '韓国語', 'フランス語', 'スペイン語', 'ドイツ語', '多言語'],
  'volunteer-activity-annual': ['ボランティア', '社会貢献', '地域活動', '奉仕活動', 'NPO', '市民活動', '地域づくり', '町内会', '社会参加'],
  'overseas-travel-annual': ['海外旅行', '海外渡航', '旅行', '海外', 'パスポート', 'コロナ', '渡航', '国際', 'グローバル'],
  'sports-annual': ['スポーツ', '運動', '健康', 'フィットネス', '体力', '生涯スポーツ', 'スポーツ振興', '運動不足', '体育'],
  'travel-leisure-annual': ['旅行', '行楽', 'レジャー', '観光', '旅', 'お出かけ', '余暇', '休日', 'レクリエーション'],
};

function getThemeKey(slug) {
  const name = slug.replace(/^a-/, '');
  if (name.startsWith('volunteer-activity-annual')) return 'volunteer-activity-annual';
  if (name.startsWith('overseas-travel-annual')) return 'overseas-travel-annual';
  if (name.startsWith('sports-annual')) return 'sports-annual';
  if (name.startsWith('travel-leisure-annual')) return 'travel-leisure-annual';
  const match = name.match(/(?:hobby-participation-rate-|sports-participation-rate-|travel-participation-rate-|study-participation-rate-)(.+)/);
  if (match) return match[1];
  return null;
}

function extractMainKeyword(title) {
  const match = title.match(/「(.+?)(?:の行動者率|の年間行動者率)」/);
  return match ? match[1] : null;
}

function getCategory(slug) {
  if (slug.includes('hobby-participation')) return '趣味・娯楽';
  if (slug.includes('sports-participation') || slug.includes('sports-annual')) return 'スポーツ';
  if (slug.includes('travel') || slug.includes('overseas-travel')) return '旅行・レジャー';
  if (slug.includes('study-participation')) return '学習・自己研鑽';
  if (slug.includes('volunteer')) return 'ボランティア・社会参加';
  return '生活・文化';
}

function generateLongTailTags(keyword) {
  if (!keyword) return [];
  const base = keyword.replace(/の$/, '');
  return [
    `${base} ランキング`, `${base} 都道府県`, `${base} 1位`,
    `${base} 全国`, `${base} 比較`, `${base} 統計`,
    `${base} 地域差`, `${base} 都道府県別`, `${base} 日本`, `${base} データ`,
  ];
}

const dirs = fs.readdirSync(BASE_DIR).filter(d => {
  return (d.startsWith('a-hobby-participation') ||
          d.startsWith('a-sports-participation') ||
          d.startsWith('a-sports-annual') ||
          d.startsWith('a-travel') ||
          d.startsWith('a-study-participation') ||
          d.startsWith('a-volunteer') ||
          d.startsWith('a-overseas')) &&
         fs.statSync(path.join(BASE_DIR, d)).isDirectory();
});

let updated = 0;
for (const slug of dirs) {
  const dirPath = path.join(BASE_DIR, slug);
  const notePath = path.join(dirPath, 'note.md');
  const tagsPath = path.join(dirPath, 'tags.txt');
  if (!fs.existsSync(notePath)) continue;

  const content = fs.readFileSync(notePath, 'utf8');
  const titleMatch = content.match(/title:\s*"(.+?)"/);
  const title = titleMatch ? titleMatch[1] : '';
  const mainKeyword = extractMainKeyword(title);
  const themeKey = getThemeKey(slug);
  const themeTags = themeKey && THEME_TAGS[themeKey] ? THEME_TAGS[themeKey] : [];
  const category = getCategory(slug);

  let topAreas = [], bottomAreas = [];
  try {
    const chartData = JSON.parse(fs.readFileSync(path.join(dirPath, 'chart-data.json'), 'utf8'));
    if (chartData.data) {
      topAreas = chartData.data.slice(0, 5).map(d => d.areaName);
      bottomAreas = chartData.data.slice(-5).map(d => d.areaName);
    }
  } catch (e) {}

  const longTailTags = generateLongTailTags(mainKeyword);
  const allTags = new Set();

  FIXED_TAGS.forEach(t => allTags.add(t));
  allTags.add(category);
  themeTags.forEach(t => allTags.add(t));
  if (mainKeyword) {
    allTags.add(mainKeyword);
    allTags.add(`${mainKeyword}の行動者率`);
  }
  longTailTags.forEach(t => allTags.add(t));
  topAreas.forEach(a => allTags.add(a));
  bottomAreas.forEach(a => allTags.add(a));
  PREFECTURES.forEach(p => { if (allTags.size < 99) allTags.add(p); });

  if (mainKeyword && allTags.size < 99) {
    const extras = [
      `${mainKeyword} 人口`, `${mainKeyword} 割合`, `${mainKeyword} 率`,
      '2021年', '2021年版', '最新', '行動者率ランキング',
      `${mainKeyword} 最下位`, `${mainKeyword} ワースト`,
      `${mainKeyword} 人気`, `${mainKeyword} 地方`,
      '余暇', '余暇活動', '生活時間', '暮らし', '生活',
    ];
    extras.forEach(t => { if (allTags.size < 99) allTags.add(t); });
  }

  fs.writeFileSync(tagsPath, [...allTags].slice(0, 99).join('\n') + '\n');
  updated++;
}

console.log(`Updated: ${updated} articles`);
console.log(`Sample: ${fs.readFileSync(path.join(BASE_DIR, dirs[0], 'tags.txt'), 'utf8').trim().split('\n').length} tags`);
