import "server-only";

import fs from "node:fs";

import { galleryStatePath } from "./project-root";

/**
 * gallery 固有の永続 state (.local/sns-gallery-state.json)。
 * 旧 server.mjs の loadGalleryState / saveGalleryState を忠実移植。
 * lastPublishXSuccess (publish-x 成功時刻) 等の運用フラグを保持する。
 */
export type GalleryState = { lastPublishXSuccess?: string } & Record<string, unknown>;

export function loadGalleryState(): GalleryState {
  try {
    return JSON.parse(fs.readFileSync(galleryStatePath(), "utf-8"));
  } catch {
    return {};
  }
}

export function saveGalleryState(patch: GalleryState): GalleryState {
  const cur = loadGalleryState();
  const next = { ...cur, ...patch };
  fs.writeFileSync(galleryStatePath(), JSON.stringify(next, null, 2));
  return next;
}
