/**
 * register-drafts.cjs — lint PASS 済みキャプションを posts.json に draft 登録する
 *
 * ③執筆 → ④lint PASS を経た captions.json を読み、UTM URL を決定的に構築して
 * `{{url}}` を置換 → store.insert で status=draft のレコードを積む。
 * 投稿は publish-x --from-queue (ローカル) が消化する。
 *
 * ★UTM は §4 規則に従い**ここで決定的に構築**する (LLM に URL を書かせない = 捏造防止)。
 *   base: https://stats47.jp/ranking/<key>
 *   params: utm_source=x / utm_medium=social / utm_campaign=<key> / utm_content=<template>
 *
 * media_path は入力の mediaPath を優先し、無い場合だけ §2-9 image catalog の
 * out_path (<key> 置換) を使う。
 *
 * 冪等: 同 content_key×template×scheduled_at の draft/scheduled が既にあればスキップ。
 *
 * Usage:
 *   node .claude/skills/sns/post-x-batch/scripts/register-drafts.cjs --in <captions.json> [--dry-run] [--sync-media] [--sync-draft]
 *
 * --sync-media: 同一キーの既存 draft/scheduled の media_path だけを入力値へ同期する。
 *               posted は更新しない。
 * --sync-draft: 同一 content_key の既存 draft 1件を、検証済み入力の caption / UTM /
 *               template / schedule / media / metric_keys へ同期する。scheduled/posted は更新しない。
 * exit: 0 = ok / 1 = 入力不正・未 lint など
 */

const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "../../../../..");
const catalog = require(
  path.join(PROJECT_ROOT, ".claude/scripts/lib/x-catalog.cjs"),
);
const store = require(
  path.join(PROJECT_ROOT, ".claude/scripts/lib/sns-posts-store.cjs"),
);
// UTM は正典 sns-utm.cjs に一本化 (CP5)。ranking domain の campaign=<key> / content=<template>。
const snsUtm = require(path.join(PROJECT_ROOT, ".claude/scripts/lib/sns-utm.cjs"));

function parseArgs(argv) {
  const args = argv.slice(2);
  const i = args.indexOf("--in");
  return {
    in: i >= 0 ? args[i + 1] : path.join(PROJECT_ROOT, ".local/r2/sns/_queue/captions.json"),
    dryRun: args.includes("--dry-run"),
    syncMedia: args.includes("--sync-media"),
    syncDraft: args.includes("--sync-draft"),
  };
}

function buildUtmUrl(item, key, template) {
  if (item.canonicalUrl && item.campaign) {
    return snsUtm.buildUtmUrl({
      canonicalUrl: item.canonicalUrl,
      platform: "x",
      campaign: item.campaign,
      variant: template,
    });
  }
  // 正典 util へ委譲 (ranking domain: campaign=<key> / content=<template>)。従来と同一出力。
  return snsUtm.buildUtmForDomain({
    domain: "ranking",
    domainParams: { rankingKey: key },
    canonicalUrl: `/ranking/${key}`,
    platform: "x",
    variant: template,
  });
}

function resolveMediaPath(imageKind, key) {
  const kind = catalog.getImageKind(imageKind);
  if (!kind || !kind.outPath || kind.outPath === "—") return "";
  return kind.outPath.replace(/<key>/g, key);
}

function main() {
  const opts = parseArgs(process.argv);
  catalog.selfCheck();

  if (!fs.existsSync(opts.in)) {
    console.error(`[register-drafts] 入力が見つかりません: ${opts.in}`);
    process.exit(1);
  }
  const items = JSON.parse(fs.readFileSync(opts.in, "utf8"));
  if (!Array.isArray(items) || items.length === 0) {
    console.error("[register-drafts] captions.json が空です");
    process.exit(1);
  }

  const existing = store.loadAll();
  const findExisting = (key, template, scheduledAt) =>
    existing.find(
      (p) =>
        p.platform === "x" &&
        p.content_key === key &&
        p.template === template &&
        p.scheduled_at === scheduledAt &&
        (p.status === "draft" || p.status === "scheduled"),
    );

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  for (const it of items) {
    const key = it.key;
    const template = it.template;
    const cap = String(it.caption || "");
    if (!key || !template || !cap.trim()) {
      console.log(`⏭  スキップ (不完全): ${key || "?"} / ${template || "?"}`);
      skipped++;
      continue;
    }
    if (!cap.includes("{{url}}")) {
      console.log(`⏭  スキップ (未 lint? {{url}} なし): ${key}`);
      skipped++;
      continue;
    }
    const scheduledAt = it.scheduledAt || null;
    const mediaPath = it.mediaPath
      ? String(it.mediaPath)
      : resolveMediaPath(
          it.imageKind || "ranking-card",
          it.mediaKey || key,
        );
    if (!mediaPath) {
      console.log(`⏭  スキップ (media_path解決失敗): ${key}`);
      skipped++;
      continue;
    }
    const registered = scheduledAt
      ? findExisting(key, template, scheduledAt)
      : undefined;
    const draftCandidates = existing.filter(
      (post) =>
        post.platform === "x" &&
        post.content_key === key &&
        post.status === "draft" &&
        !post.deleted_at,
    );
    if (opts.syncDraft && draftCandidates.length > 1) {
      throw new Error(`${key} の既存draftが複数あります: ${draftCandidates.length}`);
    }
    const draftToSync = opts.syncDraft ? draftCandidates[0] : undefined;
    const utmUrl = buildUtmUrl(it, key, template);
    const caption = cap.replace(/\{\{url\}\}/g, utmUrl);
    const metricKeys = Array.isArray(it.metricKeys)
      ? it.metricKeys.join(",")
      : it.metricKeys || key;
    if (draftToSync) {
      const patch = {
        post_type: "original",
        domain: it.domain || "ranking",
        caption,
        utm_url: utmUrl,
        has_link: 1,
        media_path: mediaPath,
        scheduled_at: scheduledAt,
        template,
        metric_keys: metricKeys,
        geo_role: it.geoRole || null,
        analysis_ids: Array.isArray(it.analysisIds) ? it.analysisIds.join(",") : null,
        claim_metric_key: it.claimMetricKey || null,
      };
      if (opts.dryRun) {
        console.log(`♻️  (dry-run) draft同期: id=${draftToSync.id} ${key}`);
      } else {
        store.updateById(draftToSync.id, patch);
        console.log(`♻️  draft同期: id=${draftToSync.id} ${key}`);
      }
      updated++;
      continue;
    }
    if (registered) {
      if (opts.syncMedia && registered.media_path !== mediaPath) {
        if (opts.dryRun) {
          console.log(`🖼  (dry-run) media更新: id=${registered.id} ${key}`);
        } else {
          store.updateById(registered.id, { media_path: mediaPath });
          console.log(`🖼  media更新: id=${registered.id} ${key}`);
        }
        console.log(`     ${registered.media_path || "(なし)"} → ${mediaPath}`);
        updated++;
      } else {
        console.log(`⏭  スキップ (既存 draft/scheduled): ${key} [${template}] ${scheduledAt}`);
        skipped++;
      }
      continue;
    }
    const record = {
      platform: "x",
      post_type: "original",
      domain: it.domain || "ranking",
      content_key: key,
      caption,
      utm_url: utmUrl,
      has_link: 1,
      media_path: mediaPath,
      status: "draft",
      scheduled_at: scheduledAt,
      template,
      metric_keys: metricKeys,
      geo_role: it.geoRole || null,
      analysis_ids: Array.isArray(it.analysisIds) ? it.analysisIds.join(",") : null,
      claim_metric_key: it.claimMetricKey || null,
    };

    if (opts.dryRun) {
      console.log(`📝 (dry-run) draft: ${key} [${template}] ${scheduledAt}`);
      console.log(`     media: ${mediaPath}`);
    } else {
      const row = store.insert(record);
      console.log(`📝 draft id=${row.id}: ${key} [${template}] ${scheduledAt}`);
    }
    inserted++;
  }

  console.log(
    `\n[register-drafts] ${opts.dryRun ? "(dry-run) " : ""}登録 ${inserted} 件 / 同期 ${updated} 件 / スキップ ${skipped} 件`,
  );
}

try {
  main();
} catch (e) {
  console.error(`[register-drafts] ${e.message}`);
  process.exit(1);
}
