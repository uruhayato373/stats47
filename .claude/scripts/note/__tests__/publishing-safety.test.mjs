import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const NOTE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLISHER = readFileSync(join(NOTE_DIR, "publish-new-note.sh"), "utf8");
const HELPERS = readFileSync(join(NOTE_DIR, "editor-helpers.sh"), "utf8");
const MAGAZINES = readFileSync(join(NOTE_DIR, "note-magazine.mjs"), "utf8");
const KAKEI = readFileSync(join(NOTE_DIR, "publish-kakei-one.sh"), "utf8");
const PUBLISH_LIB = readFileSync(join(NOTE_DIR, "note-publish-lib.sh"), "utf8");
const HASHTAG_UPDATER = readFileSync(join(NOTE_DIR, "update-published-hashtags.mjs"), "utf8");

test("new note publication serializes Profile 5 access and removes temporary Chrome state", () => {
  assert.match(PUBLISHER, /stats47-note-profile5\.lock/);
  assert.match(PUBLISHER, /kill -0 "\$holder"/);
  assert.match(PUBLISHER, /browser-use-user-data-dir-\*/);
  assert.match(PUBLISHER, /URL of t contains "editor\.note\.com"/);
});

test("publisher fails closed on image, magazine, settings, and submit failures", () => {
  assert.match(PUBLISHER, /FAIL image insert/);
  assert.match(PUBLISHER, /FAIL magazine assignment/);
  assert.match(PUBLISHER, /FAIL 公開に進む 未検出/);
  assert.match(PUBLISHER, /FAIL 投稿する 未検出/);
  assert.match(HELPERS, /\[FAIL\] image upload failed/);
  assert.match(HELPERS, /\[ -d "\$ARTICLE_DIR" \] \|\| ARTICLE_DIR=/);
});

test("publisher verifies ownership, state, title, price, hashtags, and embeds through the live API", () => {
  assert.match(PUBLISHER, /api\/v3\/notes\/\$\{process\.env\.NOTE_KEY\}/);
  for (const key of ["account", "status", "title", "price", "hashtags", "embedded"]) {
    assert.match(PUBLISHER, new RegExp(`\\b${key}:`));
  }
  assert.match(PUBLISHER, /hashtag_notes\?\.length \|\| 0\) >= 95/);
});

test("magazine assignment falls back to an owned published note lookup", () => {
  assert.match(MAGAZINES, /fetchOwnedPublishedNoteId/);
  assert.match(MAGAZINES, /note\?\.status !== "published"/);
  assert.match(MAGAZINES, /note\?\.user\?\.urlname !== "stats47"/);
});

test("nested kakei publication owns the full-session lock, cleanup, and payload guard", () => {
  assert.match(PUBLISHER, /NOTE_PROFILE_LOCK_HELD/);
  assert.match(KAKEI, /stats47-note-profile5\.lock/);
  assert.match(KAKEI, /NOTE_PROFILE_LOCK_HELD=1 bash/);
  assert.match(KAKEI, /np_install_publish_guard/);
  assert.match(KAKEI, /np_verify_publish_guard/);
  assert.match(KAKEI, /np_update_published_hashtags/);
  assert.match(KAKEI, /head -5 "\$ADIR\/hashtags\.txt"/);
  assert.match(PUBLISH_LIB, /free body too short/);
  assert.match(PUBLISH_LIB, /body\.hashtags=tags/);
  assert.match(PUBLISH_LIB, /hashtag_notes\?\.length \|\| 0\) >= 95/);
});

test("published hashtag updates lock Profile 5 and clean only resolved temporary profiles", () => {
  assert.match(HASHTAG_UPDATER, /stats47-note-profile5\.lock/);
  assert.match(HASHTAG_UPDATER, /acquireProfileLock\(\)/);
  assert.match(HASHTAG_UPDATER, /entry\.name\.startsWith\('browser-use-user-data-dir-'\)/);
  assert.doesNotMatch(HASHTAG_UPDATER, /rm -rf .*browser-use-user-data-dir/);
  assert.match(HASHTAG_UPDATER, /if \(options\.auditOnly\) return;\s+\n\s*acquireProfileLock\(\)/);
});
