#!/usr/bin/env node
/**
 * SNS 投稿ギャラリー管理サーバー (ローカル専用・依存ゼロ)
 *
 * X / Instagram / YouTube の投稿素材 (動画・画像) をギャラリーで確認しながら
 * 投稿 / 予約投稿し、キャプション微調整・メトリクス閲覧を行う localhost UI。
 *
 * 設計 (正典: .claude/rules/sns-content-standards.md):
 * - 投稿台帳 SSOT は .claude/state/sns/posts.json。書込は sns-posts-store.cjs 経由のみ
 * - 依存追加ゼロ (node:http / node:fs / node:child_process)。127.0.0.1 bind 固定
 * - 投稿実行はハイブリッド:
 *     X  = publish-x.ts を spawn (dry-run / 予約 / 即時)
 *     IG = schedule JSON + posts.json への予約登録のみ (実投稿は GHA cron)
 *     YT = upload.js を spawn (月1 + 重複ガードは upload.js 内蔵)
 * - メディアはローカル (.local/r2/sns) 優先、無ければ R2 公開 URL 直参照
 *
 * 起動: npm run sns:gallery  (= node .claude/scripts/sns/gallery-server.mjs)
 * 停止: Ctrl-C
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const require = createRequire(import.meta.url);
const store = require(path.join(PROJECT_ROOT, ".claude/scripts/lib/sns-posts-store.cjs"));

const PORT = Number(process.env.PORT || 4747);
const HOST = "127.0.0.1";
const R2_BASE = process.env.SNS_R2_BASE || "https://storage.stats47.jp";
const LOCAL_SNS_DIR = path.join(PROJECT_ROOT, ".local/r2/sns");
const STATE_DIR = path.join(PROJECT_ROOT, ".claude/state");
const HTML_PATH = path.join(__dirname, "gallery.html");
const GALLERY_STATE = path.join(PROJECT_ROOT, ".local/sns-gallery-state.json");
const PUBLISH_X_SCRIPT = path.join(PROJECT_ROOT, ".claude/skills/sns/publish-x/publish-x.ts");
const YT_UPLOAD_SCRIPT = path.join(PROJECT_ROOT, ".claude/scripts/youtube/upload.js");

// ─── 頻度リミット (正典: sns-content-standards.md §1) ───────────────
const LIMITS = {
  x: { per: "week", max: 3, label: "X 週2-3" },
  instagram: { per: "week", max: 3, label: "IG カルーセル2+リール1/週" },
  youtube: { per: "month", max: 1, label: "YouTube 月1" },
};

// ─── util ───────────────────────────────────────────
const json = (res, code, obj) => {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
};
const readBody = (req) =>
  new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (c) => (buf += c));
    req.on("end", () => {
      try {
        resolve(buf ? JSON.parse(buf) : {});
      } catch (e) {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });

const jstNow = () => new Date(Date.now() + 9 * 3600 * 1000);
const jstDateStr = (d = jstNow()) => d.toISOString().slice(0, 10);

/** JST 基準の今週月曜 (YYYY-MM-DD) */
function weekStartJst() {
  const d = jstNow();
  const dow = d.getUTCDay() || 7; // Mon=1..Sun=7
  d.setUTCDate(d.getUTCDate() - (dow - 1));
  return d.toISOString().slice(0, 10);
}
function monthStartJst() {
  return jstDateStr().slice(0, 8) + "01";
}

// ─── メディア URL 解決 ────────────────────────────────
/**
 * レコード → 表示候補メディア URL 群。ローカルにあれば /media/、無ければ R2 公開 URL。
 * R2 は list 不可のため既知の命名規約 (reel.mp4 / stills/*.png) を候補として返し、
 * クライアントが onerror で次候補にフォールバックする。
 */
function mediaCandidates(p) {
  const out = [];
  const push = (rel) => {
    const local = path.join(LOCAL_SNS_DIR, rel);
    if (fs.existsSync(local)) out.push({ url: `/media/${rel}`, source: "local" });
    else out.push({ url: `${R2_BASE}/sns/${rel}`, source: "r2" });
  };
  // media_path が具体パスならそれを最優先
  if (p.media_path) {
    const m = String(p.media_path).replace(/^\.?\/?\.local\/r2\/sns\//, "");
    if (m && m !== p.media_path) push(m);
    else if (fs.existsSync(p.media_path)) {
      // .local/r2/sns 外のローカル絶対パス (YT 動画等) — /media では配信できないので R2 化しない
      out.push({ url: null, source: "local-outside", note: p.media_path });
    }
  }
  const d = p.domain || "ranking";
  const k = p.content_key;
  if (!k) return out;
  const plat = p.platform;
  const CANDIDATES = {
    instagram: [
      `${d}/${k}/instagram/reel.mp4`,
      `${d}/${k}/instagram/stills/slide-1-cover-1080x1350.png`,
      `${d}/${k}/instagram/stills/main-1080x1080.png`,
    ],
    x: [
      `${d}/${k}/x/stills/chart-x-1200x630.png`,
      `${d}/${k}/x/stills/choropleth-map-1200x630.png`,
      `${d}/${k}/x/reel.mp4`,
    ],
    youtube: [`${d}/${k}/youtube/reel.mp4`, `${d}/${k}/youtube/stills/thumbnail-1280x720.png`],
  };
  for (const rel of CANDIDATES[plat] || []) push(rel);
  // 重複除去
  const seen = new Set();
  return out.filter((c) => (c.url && !seen.has(c.url) ? (seen.add(c.url), true) : false));
}

function decorate(p) {
  return { ...p, media_candidates: mediaCandidates(p) };
}

// ─── IG schedule JSON ────────────────────────────────
function igScheduleFiles() {
  return fs
    .readdirSync(STATE_DIR)
    .filter((f) => /^instagram-w\d+-schedule\.json$/.test(f))
    .sort()
    .map((f) => path.join(STATE_DIR, f));
}
function igScheduleEntries() {
  const out = [];
  for (const f of igScheduleFiles()) {
    try {
      const entries = JSON.parse(fs.readFileSync(f, "utf-8"));
      if (Array.isArray(entries)) for (const e of entries) out.push({ ...e, _file: path.basename(f) });
    } catch {}
  }
  return out;
}

// ─── 残枠計算 ────────────────────────────────────────
function computeLimits() {
  const posts = store.loadAll();
  const wk = weekStartJst();
  const mo = monthStartJst();
  const today = jstDateStr();
  const igScheduled = igScheduleEntries().filter((e) => e.date >= today).length;
  const count = (platform, since) =>
    posts.filter(
      (p) =>
        p.platform === platform &&
        (p.status === "posted" || p.status === "scheduled") &&
        ((p.posted_at || "") >= since || (p.scheduled_at || "") >= since),
    ).length;
  return {
    x: { used: count("x", wk), max: LIMITS.x.max, window: `week from ${wk}`, label: LIMITS.x.label },
    instagram: {
      used: Math.max(count("instagram", wk), 0) + 0,
      scheduledInJson: igScheduled,
      max: LIMITS.instagram.max,
      window: `week from ${wk}`,
      label: LIMITS.instagram.label,
    },
    youtube: { used: count("youtube", mo), max: LIMITS.youtube.max, window: `month from ${mo}`, label: LIMITS.youtube.label },
  };
}

// ─── インベントリ (posts ∪ ローカル素材 ∪ IG schedule) ──────────────
function scanLocalMaterials() {
  const out = [];
  if (!fs.existsSync(LOCAL_SNS_DIR)) return out;
  for (const domain of fs.readdirSync(LOCAL_SNS_DIR)) {
    const dDir = path.join(LOCAL_SNS_DIR, domain);
    if (!fs.statSync(dDir).isDirectory()) continue;
    for (const key of fs.readdirSync(dDir)) {
      const kDir = path.join(dDir, key);
      if (!fs.statSync(kDir).isDirectory()) continue;
      for (const plat of fs.readdirSync(kDir)) {
        if (!["x", "instagram", "youtube"].includes(plat)) continue;
        out.push({ domain, content_key: key, platform: plat });
      }
    }
  }
  return out;
}

function buildInventory() {
  const posts = store.loadAll().filter((p) => p.status !== "deleted");
  const known = new Set(posts.map((p) => `${p.platform}/${p.domain}/${p.content_key}`));
  const extras = [];
  // ローカル素材で台帳未登録のもの
  for (const m of scanLocalMaterials()) {
    const id = `${m.platform}/${m.domain}/${m.content_key}`;
    if (!known.has(id)) {
      extras.push({ ...m, _source: "local-material", status: "unregistered" });
      known.add(id);
    }
  }
  // IG schedule JSON にあるが posts.json に scheduled が無いもの (合成表示)
  const today = jstDateStr();
  for (const e of igScheduleEntries()) {
    if (e.date < today) continue;
    const id = `instagram/${e.domain}/${e.content_key}`;
    if (!known.has(id)) {
      extras.push({
        platform: "instagram",
        domain: e.domain,
        content_key: e.content_key,
        post_type: e.type,
        scheduled_at: `${e.date} ${e.time || "09:00"}`,
        _source: `ig-schedule (${e._file})`,
        status: "scheduled-json-only",
      });
      known.add(id);
    }
  }
  return { posts: posts.map(decorate), extras: extras.map(decorate) };
}

// ─── IG 整合性 (schedule JSON vs posts.json) ─────────────
function igConsistency() {
  const today = jstDateStr();
  const jsonEntries = igScheduleEntries().filter((e) => e.date >= today);
  const posts = store.query(
    (p) => p.platform === "instagram" && p.status === "scheduled" && !p.deleted_at,
  );
  const jsonKeys = new Set(jsonEntries.map((e) => `${e.date}|${e.content_key}`));
  const postKeys = new Set(posts.map((p) => `${(p.scheduled_at || "").slice(0, 10)}|${p.content_key}`));
  return {
    onlyInJson: jsonEntries.filter((e) => !postKeys.has(`${e.date}|${e.content_key}`)),
    onlyInPosts: posts
      .filter((p) => !jsonKeys.has(`${(p.scheduled_at || "").slice(0, 10)}|${p.content_key}`))
      .map((p) => ({ id: p.id, date: (p.scheduled_at || "").slice(0, 10), content_key: p.content_key })),
  };
}

// ─── ジョブ管理 (spawn、同時実行 1) ────────────────────
const jobs = new Map();
let jobSeq = 1;
let runningJob = null;

function startJob(kind, cmd, args) {
  if (runningJob && jobs.get(runningJob)?.status === "running") {
    return { error: `別のジョブ (#${runningJob}) が実行中。完了を待ってください` };
  }
  const id = jobSeq++;
  const job = { id, kind, cmd: `${cmd} ${args.join(" ")}`, status: "running", log: [], startedAt: new Date().toISOString() };
  jobs.set(id, job);
  runningJob = id;
  const child = spawn(cmd, args, { cwd: PROJECT_ROOT, env: { ...process.env } });
  const append = (buf) => {
    for (const line of String(buf).split("\n")) if (line.trim()) job.log.push(line);
    if (job.log.length > 500) job.log.splice(0, job.log.length - 500);
  };
  child.stdout.on("data", append);
  child.stderr.on("data", append);
  child.on("close", (code) => {
    job.status = code === 0 ? "success" : "failed";
    job.exitCode = code;
    job.endedAt = new Date().toISOString();
    if (job.kind === "publish-x" && code === 0) saveGalleryState({ lastPublishXSuccess: job.endedAt });
  });
  child.on("error", (err) => {
    job.status = "failed";
    job.log.push(`spawn error: ${err.message}`);
  });
  return { id };
}

function loadGalleryState() {
  try {
    return JSON.parse(fs.readFileSync(GALLERY_STATE, "utf-8"));
  } catch {
    return {};
  }
}
function saveGalleryState(patch) {
  const cur = loadGalleryState();
  fs.writeFileSync(GALLERY_STATE, JSON.stringify({ ...cur, ...patch }, null, 2));
}

// ─── /media 静的配信 (Range 対応 — video 再生に必須) ─────────────
const MIME = { ".mp4": "video/mp4", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".txt": "text/plain; charset=utf-8", ".json": "application/json" };
function serveMedia(req, res, rel) {
  const file = path.resolve(LOCAL_SNS_DIR, rel);
  if (!file.startsWith(LOCAL_SNS_DIR + path.sep)) return json(res, 403, { error: "forbidden" }); // path traversal 防止
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return json(res, 404, { error: "not found" });
  const stat = fs.statSync(file);
  const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let start = m && m[1] ? parseInt(m[1], 10) : 0;
    let end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1;
    if (start >= stat.size) {
      res.writeHead(416, { "content-range": `bytes */${stat.size}` });
      return res.end();
    }
    end = Math.min(end, stat.size - 1);
    res.writeHead(206, {
      "content-type": type,
      "content-length": end - start + 1,
      "content-range": `bytes ${start}-${end}/${stat.size}`,
      "accept-ranges": "bytes",
    });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { "content-type": type, "content-length": stat.size, "accept-ranges": "bytes" });
    fs.createReadStream(file).pipe(res);
  }
}

// ─── R2 探索 (HEAD probe — list 不可の代替) ─────────────
async function probeR2(domain, contentKey) {
  const rels = [
    `instagram/caption.txt`, `instagram/reel.mp4`, `instagram/stills/slide-1-cover-1080x1350.png`,
    `x/caption.txt`, `x/stills/chart-x-1200x630.png`,
    `youtube/reel.mp4`,
  ];
  const found = [];
  await Promise.all(
    rels.map(async (rel) => {
      try {
        const r = await fetch(`${R2_BASE}/sns/${domain}/${contentKey}/${rel}`, { method: "HEAD" });
        if (r.ok) found.push({ rel, size: Number(r.headers.get("content-length") || 0) });
      } catch {}
    }),
  );
  return found;
}

// ─── IG 予約登録 (schedule JSON + posts.json 同時) ─────────────
function scheduleIg({ date, time = "09:00", type, domain, content_key, caption }) {
  if (!date || !type || !domain || !content_key) throw new Error("date/type/domain/content_key は必須");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("date は YYYY-MM-DD");
  if (date < jstDateStr()) throw new Error("過去日は指定不可");
  // 追記先: その date を含む週ファイル。無ければ最新ファイル
  const files = igScheduleFiles();
  if (files.length === 0) throw new Error("instagram-w*-schedule.json が見つからない");
  let target = null;
  for (const f of files) {
    try {
      const entries = JSON.parse(fs.readFileSync(f, "utf-8"));
      const dates = entries.map((e) => e.date).sort();
      if (dates.length && date >= dates[0] && date <= dates[dates.length - 1]) { target = f; break; }
    } catch {}
  }
  if (!target) target = files[files.length - 1];
  const entries = JSON.parse(fs.readFileSync(target, "utf-8"));
  if (entries.some((e) => e.date === date)) {
    throw new Error(`${date} には既に予約あり (${path.basename(target)})。IG cron は 1 日 1 件`);
  }
  entries.push({ date, time, type, domain, content_key });
  entries.sort((a, b) => (a.date < b.date ? -1 : 1));
  fs.writeFileSync(target, JSON.stringify(entries, null, 2) + "\n");
  // posts.json にも scheduled を insert (SSOT へ反映)
  const row = store.insert({
    platform: "instagram",
    post_type: type,
    domain,
    content_key,
    caption: caption ?? null,
    status: "scheduled",
    scheduled_at: `${date} ${time}:00`,
    template: null,
  });
  return { file: path.basename(target), postId: row.id };
}

// ─── HTTP ハンドラ ────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const p = url.pathname;
  try {
    // ── 静的
    if (req.method === "GET" && p === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(fs.readFileSync(HTML_PATH));
    }
    if (req.method === "GET" && p.startsWith("/media/")) {
      return serveMedia(req, res, decodeURIComponent(p.slice("/media/".length)));
    }
    // ── 読取 API
    if (req.method === "GET" && p === "/api/posts") {
      const { platform, status, domain, q } = Object.fromEntries(url.searchParams);
      let posts = store.loadAll().filter((x) => x.status !== "deleted");
      if (platform) posts = posts.filter((x) => x.platform === platform);
      if (status) posts = posts.filter((x) => x.status === status);
      if (domain) posts = posts.filter((x) => x.domain === domain);
      if (q) posts = posts.filter((x) => (x.content_key || "").includes(q) || (x.caption || "").includes(q));
      posts.sort((a, b) => (b.posted_at || b.scheduled_at || b.created_at || "").localeCompare(a.posted_at || a.scheduled_at || a.created_at || ""));
      return json(res, 200, { count: posts.length, posts: posts.map(decorate) });
    }
    if (req.method === "GET" && p === "/api/inventory") return json(res, 200, buildInventory());
    if (req.method === "GET" && p === "/api/limits") return json(res, 200, { limits: computeLimits(), galleryState: loadGalleryState() });
    if (req.method === "GET" && p === "/api/ig-consistency") return json(res, 200, igConsistency());
    if (req.method === "GET" && /^\/api\/jobs\/\d+$/.test(p)) {
      const job = jobs.get(Number(p.split("/").pop()));
      return job ? json(res, 200, job) : json(res, 404, { error: "job not found" });
    }
    // ── 書込 API
    if (req.method === "PATCH" && /^\/api\/posts\/\d+$/.test(p)) {
      const id = Number(p.split("/").pop());
      const body = await readBody(req);
      const patch = {};
      // ホワイトリスト: caption / scheduled_at のみ (SSOT の他フィールドは守る)
      if (typeof body.caption === "string") patch.caption = body.caption;
      if (typeof body.scheduled_at === "string" || body.scheduled_at === null) patch.scheduled_at = body.scheduled_at;
      if (Object.keys(patch).length === 0) return json(res, 400, { error: "caption / scheduled_at のみ編集可" });
      const row = store.updateById(id, patch);
      return row ? json(res, 200, decorate(row)) : json(res, 404, { error: "post not found" });
    }
    if (req.method === "POST" && p === "/api/posts") {
      const body = await readBody(req);
      const { platform, domain, content_key } = body;
      if (!platform || !domain || !content_key) return json(res, 400, { error: "platform/domain/content_key は必須" });
      const row = store.insert({
        platform,
        post_type: body.post_type ?? null,
        domain,
        content_key,
        caption: body.caption ?? null,
        status: "draft",
        media_path: body.media_path ?? null,
      });
      return json(res, 201, decorate(row));
    }
    if (req.method === "POST" && p === "/api/probe-r2") {
      const { domain, content_key } = await readBody(req);
      if (!domain || !content_key) return json(res, 400, { error: "domain/content_key は必須" });
      return json(res, 200, { found: await probeR2(domain, content_key) });
    }
    // ── アクション
    if (req.method === "POST" && p === "/api/actions/schedule-ig") {
      const body = await readBody(req);
      try {
        return json(res, 200, scheduleIg(body));
      } catch (e) {
        return json(res, 400, { error: e.message });
      }
    }
    if (req.method === "POST" && p === "/api/actions/publish-x") {
      const body = await readBody(req);
      const { content_key, datetime, domain = "ranking", dry_run = false, immediate = false } = body;
      if (!content_key) return json(res, 400, { error: "content_key は必須" });
      if (!dry_run && !immediate && !datetime) return json(res, 400, { error: "予約には datetime (YYYY-MM-DDTHH:MM) が必要" });
      // 誤即時投稿ガード: 最終成功から 7 日超なら dry-run を先に強制
      const st = loadGalleryState();
      const last = st.lastPublishXSuccess ? Date.now() - Date.parse(st.lastPublishXSuccess) : Infinity;
      if (!dry_run && last > 7 * 24 * 3600 * 1000 && !body.force) {
        return json(res, 428, { error: "publish-x の成功実績が 7 日以上ない。まず dry-run で UI 変化を確認してください (force:true で強行可)" });
      }
      const args = ["tsx", PUBLISH_X_SCRIPT, content_key];
      if (datetime && !immediate) args.push(datetime);
      args.push("--domain", domain);
      if (immediate) args.push("--immediate");
      if (dry_run) args.push("--dry-run");
      const r = startJob("publish-x", "npx", args);
      return r.error ? json(res, 409, r) : json(res, 202, r);
    }
    if (req.method === "POST" && p === "/api/actions/publish-yt") {
      const body = await readBody(req);
      if (body.confirm !== true) return json(res, 400, { error: "confirm:true が必須 (月1運用の明示確認)" });
      const { video_file, title, content_key, thumbnail, description } = body;
      if (!video_file || !title) return json(res, 400, { error: "video_file / title は必須" });
      if (!fs.existsSync(video_file)) return json(res, 400, { error: `video_file が存在しない: ${video_file}` });
      const args = [YT_UPLOAD_SCRIPT, video_file, "--title", title];
      if (description) args.push("--description", description);
      if (thumbnail) args.push("--thumbnail", thumbnail);
      if (content_key) args.push("--content-key", content_key);
      // 月1 + 重複ガードは upload.js が内蔵 (check-youtube-post-budget / check-youtube-duplicate)
      const r = startJob("publish-yt", "node", args);
      return r.error ? json(res, 409, r) : json(res, 202, r);
    }
    return json(res, 404, { error: `unknown route: ${req.method} ${p}` });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`SNS gallery: http://${HOST}:${PORT}/  (Ctrl-C で停止)`);
  console.log(`- 台帳: ${store.STORE_PATH}`);
  console.log(`- ローカル素材: ${LOCAL_SNS_DIR}`);
  console.log(`- R2: ${R2_BASE}/sns/`);
});
