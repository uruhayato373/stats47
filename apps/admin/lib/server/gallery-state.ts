import "server-only";

import fs from "node:fs";

import { galleryStatePath } from "./project-root";

/**
 * gallery 固有 state (.local/sns-gallery-state.json) の読み取り。
 * 更新は投稿エージェント側が担い、管理画面は書き込まない。
 */
export type GalleryState = { lastPublishXSuccess?: string } & Record<string, unknown>;

export function loadGalleryState(): GalleryState {
  try {
    return JSON.parse(fs.readFileSync(galleryStatePath(), "utf-8"));
  } catch {
    return {};
  }
}
