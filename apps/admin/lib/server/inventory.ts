import 'server-only';

import fs from 'node:fs';
import path from 'node:path';

import { localSnsDir, R2_BASE } from './project-root';
import { loadAll, postRevision, type Post } from './posts-store';
import { assetUrl } from './post-trace';
import { igScheduleEntries } from './instagram';
import { jstDateStr } from './time';
import { orderedPostAssets } from '@/lib/sns-ledger';

/**
 * インベントリ (posts ∪ ローカル素材 ∪ IG schedule) と表示候補メディア URL 解決。
 * 旧 server.mjs の mediaCandidates / decorate / scanLocalMaterials / buildInventory を忠実移植。
 */
export interface MediaCandidate {
  url: string | null;
  source: string;
  note?: string;
}

export type DecoratedPost = Post & { media_candidates: MediaCandidate[] };

/**
 * レコード → 表示候補メディア URL 群。ローカルにあれば /media/、無ければ R2 公開 URL。
 * R2 は list 不可のため既知の命名規約を候補として返し、クライアントが onerror で次候補へ。
 */
export function mediaCandidates(p: Partial<Post>): MediaCandidate[] {
  const out: MediaCandidate[] = [];
  // 投稿IDに紐づく保全済み素材を優先。ローカルミラーの掃除後も投稿時の画像を見られる。
  if (p.id) {
    for (const asset of orderedPostAssets(p.assets ?? [])) {
      const url = assetUrl(p.id, asset);
        if (url) out.push({ url, source: asset.r2 ? 'r2' : 'drive' });
    }
  }
  const base = localSnsDir();
  const push = (rel: string) => {
    const local = path.join(base, rel);
    if (fs.existsSync(local))
      out.push({ url: `/media/${rel}`, source: 'local' });
    else out.push({ url: `${R2_BASE}/sns/${rel}`, source: 'r2' });
  };
  // 保全素材が使えない場合は media_path、次に既知の命名規約へフォールバック
  if (p.media_path) {
    const value = String(p.media_path);
    const prefixes = ['.local/r2/sns/', './.local/r2/sns/', 'sns/', `${R2_BASE}/sns/`, `${base}/`];
    const prefix = prefixes.find(p => value.startsWith(p));
    const m = prefix ? value.slice(prefix.length) : value;
    if (m && m !== p.media_path) push(m);
    else if (fs.existsSync(String(p.media_path))) {
      // .local/r2/sns 外のローカル絶対パス (YT 動画等) — /media では配信不可なので R2 化しない
      out.push({
        url: null,
        source: 'local-outside',
        note: String(p.media_path),
      });
    }
  }
  const d = p.domain || 'ranking';
  const k = p.content_key;
  if (!k) return out;
  const plat = p.platform;
  const CANDIDATES: Record<string, string[]> = {
    instagram: [
      `${d}/${k}/instagram/reel.mp4`,
      `${d}/${k}/instagram/stills/slide-1-cover-1080x1350.png`,
      `${d}/${k}/instagram/stills/main-1080x1080.png`,
    ],
    x: [
      ...(['household-receipt', 'area-atlas', 'rank-routes', 'tile-change'].includes(d)
        ? [`${d}/${k}/x/stills/${k}.png`]
        : []),
      `${d}/${k}/x/stills/chart-x-1200x630.png`,
      `${d}/${k}/x/stills/choropleth-map-1200x630.png`,
      `${d}/${k}/x/reel.mp4`,
    ],
  };
  for (const rel of (plat && CANDIDATES[plat]) || []) push(rel);
  // 重複除去
  const seen = new Set<string>();
  return out.filter((c) =>
    c.url && !seen.has(c.url) ? (seen.add(c.url), true) : false
  );
}

export function decorate<T extends Record<string, unknown>>(
  p: T
): T & { media_candidates: MediaCandidate[]; revision?: string } {
  return {
    ...p,
    media_candidates: mediaCandidates(p as Partial<Post>),
    ...(typeof p.id === 'number'
      ? { revision: postRevision(p as unknown as Post) }
      : {}),
  };
}

/** .local/r2/sns/<domain>/<key>/<platform> のローカル素材を列挙。 */
export function scanLocalMaterials(): Array<{
  domain: string;
  content_key: string;
  platform: string;
}> {
  const out: Array<{ domain: string; content_key: string; platform: string }> =
    [];
  const base = localSnsDir();
  if (!fs.existsSync(base)) return out;
  for (const domain of fs.readdirSync(base)) {
    const dDir = path.join(base, domain);
    if (!fs.statSync(dDir).isDirectory()) continue;
    for (const key of fs.readdirSync(dDir)) {
      const kDir = path.join(dDir, key);
      if (!fs.statSync(kDir).isDirectory()) continue;
      for (const plat of fs.readdirSync(kDir)) {
        if (!['x', 'instagram'].includes(plat)) continue;
        out.push({ domain, content_key: key, platform: plat });
      }
    }
  }
  return out;
}

export interface InventoryExtra {
  platform: string;
  domain: string;
  content_key: string;
  status: string;
  _source: string;
  post_type?: string;
  scheduled_at?: string;
  media_candidates?: MediaCandidate[];
  [key: string]: unknown;
}

/** posts ∪ 未登録ローカル素材 ∪ 未来 IG schedule(json-only) を返す。 */
export function buildInventory(): {
  posts: DecoratedPost[];
  extras: Array<InventoryExtra & { media_candidates: MediaCandidate[] }>;
} {
  const allPosts = loadAll();
  const posts = allPosts.filter((p) => p.status !== 'deleted' && !p.deleted_at);
  // Deleted posts retain ownership of their files; aliases do not create new candidates.
  const known = new Set(
    allPosts.flatMap((p) => [
      `${p.platform}/${p.domain}/${p.content_key}`,
      ...(p.material_keys ?? []),
    ])
  );
  const extras: InventoryExtra[] = [];
  // ローカル素材で台帳未登録のもの
  for (const m of scanLocalMaterials()) {
    const id = `${m.platform}/${m.domain}/${m.content_key}`;
    if (!known.has(id)) {
      extras.push({ ...m, _source: 'local-material', status: 'unregistered' });
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
        platform: 'instagram',
        domain: e.domain,
        content_key: e.content_key,
        post_type: e.type,
        scheduled_at: `${e.date} ${e.time || '08:00'}`,
        _source: `ig-schedule (${e._file})`,
        status: 'scheduled-json-only',
      });
      known.add(id);
    }
  }
  return {
    posts: posts.map((p) => decorate(p)) as DecoratedPost[],
    extras: extras.map((e) => decorate(e)),
  };
}
