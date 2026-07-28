/**
 * select-candidates.cjs — X 量産バッチの候補選定 (決定的・LLM 不使用)
 *
 * 「今週どのランキングを、どのテンプレで、いつ投稿するか」を決定的に決める。
 * ランダム性は使わず、週ソルト付きの安定ハッシュでローテーションする (同じ週=同じ結果、
 * 週が変われば別の候補、が再現可能)。
 *
 * 入力:
 *   - 候補ユニバース: 公開済み ranking キー (packages/ranking KNOWN_RANKING_KEYS) ∩ metric 索引
 *   - metric 索引: .claude/state/sns/metric-discovery-index.json (無ければ build-discovery-index.ts で生成)
 *   - 台帳 posts.json: dedup (同 key×template 90日除外 / 同 key 30日除外) と category ローテ
 *   - 季節性: 当月テーマ語 (本ファイル MONTH_THEMES) に一致する title/category を加点
 *   - 頻度上限: x-catalog の quota (§1) — 1 日 X_DAILY_MAX 本で scheduled_at を割り付け。
 *     台帳の既存予約 (scheduled_at) で満杯の日はスキップし、空き日から割り付ける
 *   - センシティブ指標 (SENSITIVE_EXCLUDE_KEYS) は選定対象から除外
 *   - テンプレ割付: §2-8 相性表 (x-catalog getAffinity) の ◎/○ から §2-0 template を選ぶ
 *
 * 出力 (--out、既定 .local/r2/sns/_queue/candidates.json):
 *   [{ key, domain, category, title, unit, template, imageKind, scheduledAt, bestTime, reason }]
 *   キャプションは書かない (③執筆フェーズで LLM が §2-0 structure に沿って書く)。
 *
 * Usage:
 *   node .claude/skills/sns/post-x-batch/scripts/select-candidates.cjs \
 *     --count 10 [--start YYYY-MM-DD] [--out <path>] [--rebuild-index]
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const PROJECT_ROOT = path.resolve(__dirname, "../../../../..");
const catalog = require(
  path.join(PROJECT_ROOT, ".claude/scripts/lib/x-catalog.cjs"),
);
const store = require(
  path.join(PROJECT_ROOT, ".claude/scripts/lib/sns-posts-store.cjs"),
);

const INDEX_PATH = path.join(
  PROJECT_ROOT,
  ".claude/state/sns/metric-discovery-index.json",
);
const KNOWN_KEYS_PATH = path.join(
  PROJECT_ROOT,
  "packages/ranking/src/config/known-ranking-keys.ts",
);

// 当月テーマ語 (季節性の加点。title/category にこれらを含むと boost)。
// 決定的な弱シグナル (検索需要の季節変動を粗く反映)。厳密網羅は目的でない。
const MONTH_THEMES = {
  1: ["移住", "転入", "転出", "積雪", "降雪", "初詣", "受験", "インフルエンザ"],
  2: ["移住", "転入", "花粉", "受験", "確定申告", "積雪"],
  3: ["移住", "転入", "転出", "卒業", "引越", "花粉", "年度"],
  4: ["移住", "転入", "新生活", "入学", "就職", "花見", "桜"],
  5: ["観光", "宿泊", "連休", "新緑", "農業"],
  6: ["梅雨", "降水", "観光", "衛生", "食中毒", "結婚", "婚姻"],
  7: ["観光", "宿泊", "海", "気温", "電力", "熱中症", "祭"],
  8: ["観光", "宿泊", "帰省", "気温", "台風", "電力", "花火"],
  9: ["台風", "防災", "敬老", "高齢", "農業", "収穫", "スポーツ"],
  10: ["観光", "紅葉", "スポーツ", "食欲", "農業", "収穫"],
  11: ["紅葉", "観光", "医療", "インフルエンザ", "文化", "教育"],
  12: ["移住", "積雪", "降雪", "年末", "医療", "消費", "小売"],
};

// センシティブ指標の除外 (SNS のカジュアルなランキング投稿に不適。炎上・ブランド毀損リスク)。
// 2026-07-11 の 90 本バッチで suicide-count / early-neonatal-deaths を手動差し替えした再発防止。
// 追加はキーを 1 行足すだけ。判断基準: 死亡・自殺など、ランキング形式の軽いトーンで扱えない指標。
const SENSITIVE_EXCLUDE_KEYS = new Set([
  "suicide-count",
  "early-neonatal-deaths",
]);

// 相性表の角度 → §2-0 template id
const ANGLE_TO_TEMPLATES = {
  結論: ["shock", "versus"],
  理由: ["question"],
  体験: ["angle-experience"],
  反論: ["paradox"],
  数字: ["number"],
  ハウツー: ["angle-howto"],
};

function parseArgs(argv) {
  const args = argv.slice(2);
  const get = (flag, def) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : def;
  };
  return {
    count: Number(get("--count", "10")),
    start: get("--start", null),
    out: get(
      "--out",
      path.join(PROJECT_ROOT, ".local/r2/sns/_queue/candidates.json"),
    ),
    rebuildIndex: args.includes("--rebuild-index"),
  };
}

/** 安定ハッシュ (FNV-1a 32bit)。ランダム性を使わずローテーションする。 */
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function jstToday() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function loadKnownKeys() {
  const src = fs.readFileSync(KNOWN_KEYS_PATH, "utf8");
  const set = new Set();
  for (const m of src.matchAll(/"([a-z0-9][a-z0-9-]*)"/g)) set.add(m[1]);
  return set;
}

function loadIndex(rebuild) {
  if (rebuild || !fs.existsSync(INDEX_PATH)) {
    console.error("[select-candidates] discovery index を生成中...");
    execFileSync(
      (process.platform === "win32" ? "npx.cmd" : "npx"),
      ["tsx", path.join(PROJECT_ROOT, ".claude/scripts/sns/build-discovery-index.ts")],
      { stdio: "inherit" },
    );
  }
  const payload = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  return payload.entries || [];
}

/** テンプレ候補を ◎ → ○ の順で返す (先頭ほど相性が高い。バッチ均等化のタイブレークに使う)。 */
function templatesForCategory(category, affinity, templatesById) {
  const row = affinity[category];
  const pick = (mark) => {
    const out = [];
    if (!row) return out;
    for (const [angle, rating] of Object.entries(row)) {
      if (rating === mark) {
        for (const t of ANGLE_TO_TEMPLATES[angle] || []) {
          if (templatesById[t]) out.push(t);
        }
      }
    }
    return out;
  };
  const ordered = [...pick("◎"), ...pick("○")];
  const seen = new Set();
  const list = ordered.filter((t) => (seen.has(t) ? false : (seen.add(t), true)));
  // カテゴリ不明時は無難な shock/number を既定にする
  return list.length ? list : ["shock", "number"];
}

function main() {
  const opts = parseArgs(process.argv);
  const self = catalog.selfCheck(); // md ドリフト検出 (失敗は throw)
  const quota = catalog.getQuota();
  const affinity = catalog.getAffinity();
  const templates = catalog.getTemplates();
  const templatesById = Object.fromEntries(templates.map((t) => [t.template, t]));

  const known = loadKnownKeys();
  const index = loadIndex(opts.rebuildIndex);
  const startDay = opts.start || (() => {
    // 既定は「翌日 (JST)」。UTC 変換ズレを避けるため +9h してから日付を切る。
    const t = new Date(`${jstToday()}T00:00:00+09:00`);
    const tomorrow = new Date(t.getTime() + 24 * 60 * 60 * 1000);
    return new Date(tomorrow.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  })();
  const weekSalt = String(hash(startDay) % 100000);
  const month = Number(startDay.slice(5, 7));
  const themeWords = MONTH_THEMES[month] || [];

  // 台帳から dedup・ローテ用の履歴を作る
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const xPosts = store
    .loadAll()
    .filter((p) => p.platform === "x" && !p.deleted_at);
  const lastByKey = new Map(); // key -> 最新投稿日(ms)
  const seenKeyTemplate = new Set(); // "key|template" (90日以内)
  const recentCategoryCount = new Map(); // category -> 直近30日投稿数
  for (const p of xPosts) {
    const ts = Date.parse(p.posted_at || p.scheduled_at || p.created_at || "") || 0;
    if (p.content_key) {
      const prev = lastByKey.get(p.content_key) || 0;
      if (ts > prev) lastByKey.set(p.content_key, ts);
      if (p.template && now - ts < 90 * DAY) {
        seenKeyTemplate.add(`${p.content_key}|${p.template}`);
      }
    }
  }
  // category ローテは index から key→category を引く必要があるので後で使う
  const catByKey = new Map(index.map((e) => [e.key, e.category]));
  for (const p of xPosts) {
    const ts = Date.parse(p.posted_at || p.scheduled_at || p.created_at || "") || 0;
    if (now - ts < 30 * DAY && p.content_key) {
      const c = catByKey.get(p.content_key);
      if (c) recentCategoryCount.set(c, (recentCategoryCount.get(c) || 0) + 1);
    }
  }

  // スコアリング (決定的)
  const scored = [];
  for (const e of index) {
    if (!known.has(e.key)) continue; // 公開済みのみ
    if (SENSITIVE_EXCLUDE_KEYS.has(e.key)) continue; // センシティブ指標は選定しない
    const last = lastByKey.get(e.key) || 0;
    if (last && now - last < 30 * DAY) continue; // 同 key 30日以内は除外
    const text = `${e.title || ""} ${e.subtitle || ""} ${e.category || ""}`;
    let score = 0;
    // 季節性
    if (themeWords.some((w) => text.includes(w))) score += 3;
    // category ローテ (直近で少ないカテゴリを優先)
    const recentCat = recentCategoryCount.get(e.category) || 0;
    score += Math.max(0, 3 - recentCat);
    // 90日以内に投稿した key は軽い減点 (0 でなければ上で除外済みだが保険)
    if (last && now - last < 90 * DAY) score -= 2;
    // 安定ハッシュでタイブレーク兼週替わりローテ
    const tie = hash(`${e.key}|${weekSalt}`);
    scored.push({ e, score, tie });
  }
  scored.sort((a, b) => b.score - a.score || a.tie - b.tie);

  // 上位から count 件を distinct key で採り、テンプレを割り付ける。
  // テンプレはバッチ全体で均等化する (同じ template ばかりにならないよう、候補のうち
  // このバッチでの使用回数が最小のものを選ぶ。同数なら ◎→○ の相性順で決める)。
  const selected = [];
  const batchTemplateCount = new Map();
  for (const { e, score } of scored) {
    if (selected.length >= opts.count) break;
    const tmplChoices = templatesForCategory(e.category, affinity, templatesById).filter(
      (t) => !seenKeyTemplate.has(`${e.key}|${t}`), // 同 key×template 90日 dedup
    );
    if (tmplChoices.length === 0) continue; // 全 template が最近使用済み → スキップ
    // バッチ内使用回数が最小のものを選ぶ (安定: choices の並び順=相性順でタイブレーク)
    let chosen = tmplChoices[0];
    let best = batchTemplateCount.get(chosen) || 0;
    for (const t of tmplChoices) {
      const c = batchTemplateCount.get(t) || 0;
      if (c < best) {
        best = c;
        chosen = t;
      }
    }
    batchTemplateCount.set(chosen, (batchTemplateCount.get(chosen) || 0) + 1);
    const tmpl = templatesById[chosen];
    selected.push({
      key: e.key,
      domain: "ranking",
      category: e.category,
      title: e.title,
      unit: e.unit,
      template: chosen,
      imageKind: tmpl.imageKind,
      bestTime: tmpl.bestTime,
      charMax: tmpl.charMax,
      structure: tmpl.structure,
      score,
    });
  }

  // scheduled_at 割付: startDay から、1 日 X_DAILY_MAX 本まで、best_time の時間帯で
  const slotHours = { // best_time → 開始時 (JST)
    "weekday-07-09": 8,
    "weekday-10-12": 11,
    "weekday-12-13": 12,
    "weekday-18-20": 19,
    "weekday-21-23": 21,
    "weekend-09-11": 10,
    any: 12,
  };
  const perDay = new Map(); // "YYYY-MM-DD" -> 使用済み時刻(hour) セット
  // 台帳の既存予約 (draft/scheduled/posted の scheduled_at) で埋まっている枠を先に予約済み扱いにする。
  // これが無いと満杯日に draft を積んでしまい、publish 時の頻度ガードで弾かれて無駄 draft になる
  // (2026-07-11 の月次 90 本バッチで顕在化。以後は --start 明示不要で空き日から自動割付)。
  for (const p of xPosts) {
    const raw = p.scheduled_at || "";
    if (!raw) continue; // posted_at のみ (過去投稿) は未来の割付と重ならない
    const d = new Date(raw);
    if (isNaN(d.getTime())) continue;
    const jst = new Date(d.getTime() + 9 * 3600 * 1000);
    const dayKey = jst.toISOString().slice(0, 10);
    if (dayKey < startDay) continue;
    const used = perDay.get(dayKey) || new Set();
    used.add(jst.getUTCHours());
    perDay.set(dayKey, used);
  }
  let dayCursor = new Date(`${startDay}T00:00:00+09:00`);
  const withSchedule = [];
  for (const c of selected) {
    // その日が満杯 (X_DAILY_MAX) なら翌日へ
    let placed = false;
    let guard = 0;
    while (!placed && guard < 60) {
      guard++;
      const dayKey = new Date(dayCursor.getTime() + 9 * 3600 * 1000)
        .toISOString()
        .slice(0, 10);
      const used = perDay.get(dayKey) || new Set();
      if (used.size >= quota.dailyMax) {
        dayCursor = new Date(dayCursor.getTime() + DAY);
        continue;
      }
      let hour = slotHours[c.bestTime] ?? 12;
      // 同日で時刻衝突したら +2h ずらす
      while (used.has(hour) && hour < 23) hour += 2;
      used.add(hour);
      perDay.set(dayKey, used);
      const scheduledAt = `${dayKey}T${String(hour).padStart(2, "0")}:00:00+09:00`;
      withSchedule.push({
        ...c,
        scheduledAt,
        reason:
          `score=${c.score} template=${c.template}` +
          (themeWords.some((w) => `${c.title}${c.category}`.includes(w)) ? " (季節性)" : ""),
      });
      placed = true;
    }
  }

  fs.mkdirSync(path.dirname(opts.out), { recursive: true });
  fs.writeFileSync(opts.out, JSON.stringify(withSchedule, null, 2));
  console.log(
    `[select-candidates] ${withSchedule.length}/${opts.count} 件を選定 (universe=${scored.length}, ` +
      `catalog templates=${self.templateCount}) → ${path.relative(PROJECT_ROOT, opts.out)}`,
  );
  for (const c of withSchedule) {
    console.log(`  ${c.scheduledAt}  [${c.template}] ${c.key}  (${c.category})`);
  }
}

try {
  main();
} catch (e) {
  console.error(`[select-candidates] ${e.message}`);
  process.exit(1);
}
