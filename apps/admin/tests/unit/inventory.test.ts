import { afterEach, describe, expect, it, vi } from "vitest";

import {
  cleanupFixtureRoot,
  makeFixtureRoot,
  type SeedPost,
} from "../helpers/fixture-root";

/**
 * inventory.ts の mediaCandidates 優先順 / scanLocalMaterials / buildInventory extras を検証。
 * ローカル素材の有無で /media/ URL か R2 fallback かが切り替わる点を fixture で作り分ける。
 */
describe("inventory", () => {
  let root: string;

  afterEach(() => {
    vi.useRealTimers();
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
  });

  async function load(opts: Parameters<typeof makeFixtureRoot>[0]) {
    root = makeFixtureRoot(opts);
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();
    return import("@/lib/server/inventory");
  }

  describe("mediaCandidates", () => {
    it("ローカルに素材があれば /media/ URL (local)、無ければ R2 URL (r2)", async () => {
      const { mediaCandidates } = await load({
        posts: [],
        // x の 1 枚目候補だけローカルに置く
        localSnsFiles: ["ranking/my-key/x/stills/chart-x-1200x630.png"],
      });
      const cands = mediaCandidates({
        platform: "x",
        domain: "ranking",
        content_key: "my-key",
      });
      const local = cands.find((c) => c.url === "/media/ranking/my-key/x/stills/chart-x-1200x630.png");
      expect(local?.source).toBe("local");
      // 2 枚目候補 (choropleth) はローカルに無い → R2 URL。
      const r2 = cands.find((c) => c.url?.includes("choropleth-map-1200x630.png"));
      expect(r2?.source).toBe("r2");
      expect(r2?.url).toContain("/sns/ranking/my-key/x/stills/");
    });

    it("media_path が .local/r2/sns 配下なら最優先で候補化される", async () => {
      const { mediaCandidates } = await load({
        posts: [],
        localSnsFiles: ["ranking/mp-key/instagram/reel.mp4"],
      });
      const cands = mediaCandidates({
        platform: "instagram",
        domain: "ranking",
        content_key: "mp-key",
        media_path: ".local/r2/sns/ranking/mp-key/instagram/reel.mp4",
      });
      // 先頭が media_path 由来の候補。
      expect(cands[0].url).toBe("/media/ranking/mp-key/instagram/reel.mp4");
      expect(cands[0].source).toBe("local");
    });

    it("content_key が無ければ platform 候補を出さない", async () => {
      const { mediaCandidates } = await load({ posts: [] });
      const cands = mediaCandidates({ platform: "x", domain: "ranking" });
      expect(cands.length).toBe(0);
    });

    it("重複 URL を除去する", async () => {
      const { mediaCandidates } = await load({
        posts: [],
        // media_path と platform 候補が同じ reel.mp4 を指す
        localSnsFiles: ["ranking/dup/instagram/reel.mp4"],
      });
      const cands = mediaCandidates({
        platform: "instagram",
        domain: "ranking",
        content_key: "dup",
        media_path: ".local/r2/sns/ranking/dup/instagram/reel.mp4",
      });
      const reelUrls = cands.filter((c) => c.url === "/media/ranking/dup/instagram/reel.mp4");
      expect(reelUrls.length).toBe(1);
    });
  });

  describe("scanLocalMaterials", () => {
    it("<domain>/<key>/<platform> の階層を列挙する", async () => {
      const { scanLocalMaterials } = await load({
        posts: [],
        localSnsFiles: [
          "ranking/key-a/x/stills/a.png",
          "ranking/key-a/instagram/reel.mp4",
          // YouTube は撤退済でホワイトリスト外 (新規素材ディレクトリは走査しない)
          "compare/key-b/youtube/reel.mp4",
          // platform 以外のディレクトリ (無視される)
          "ranking/key-a/misc/note.txt",
        ],
      });
      const mats = scanLocalMaterials();
      expect(mats).toContainEqual({ domain: "ranking", content_key: "key-a", platform: "x" });
      expect(mats).toContainEqual({ domain: "ranking", content_key: "key-a", platform: "instagram" });
      // "youtube" と "misc" は platform ホワイトリスト外なので列挙されない。
      expect(mats.some((m) => m.platform === "youtube")).toBe(false);
      expect(mats.some((m) => m.platform === "misc")).toBe(false);
    });

    it("素材ディレクトリが無ければ空配列", async () => {
      const { scanLocalMaterials } = await load({ posts: [] });
      expect(scanLocalMaterials()).toEqual([]);
    });
  });

  describe("buildInventory", () => {
    it("台帳未登録のローカル素材を extras (local-material) に出す", async () => {
      const posts: SeedPost[] = [
        // 登録済み素材
        { id: 1, platform: "x", status: "posted", domain: "ranking", content_key: "known" },
      ];
      const { buildInventory } = await load({
        posts,
        localSnsFiles: [
          "ranking/known/x/stills/a.png", // 登録済み → extras に出ない
          "ranking/unknown/x/stills/b.png", // 未登録 → extras に出る
        ],
      });
      const inv = buildInventory();
      expect(inv.posts.length).toBe(1);
      const extra = inv.extras.find((e) => e.content_key === "unknown");
      expect(extra).toBeDefined();
      expect(extra?._source).toBe("local-material");
      expect(extra?.status).toBe("unregistered");
      // 登録済み素材は extras に重複表示されない。
      expect(inv.extras.some((e) => e.content_key === "known")).toBe(false);
    });

    it("posts に無い未来 IG schedule を extras (scheduled-json-only) に出す", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-07-15T03:00:00Z")); // JST 2026-07-15
      const { buildInventory } = await load({
        posts: [],
        igSchedules: {
          "instagram-w29-schedule.json": [
            { date: "2026-07-20", type: "reel", domain: "ranking", content_key: "future-ig" },
            { date: "2026-07-01", type: "reel", domain: "ranking", content_key: "past-ig" }, // 過去 → 出ない
          ],
        },
      });
      const inv = buildInventory();
      const e = inv.extras.find((x) => x.content_key === "future-ig");
      expect(e).toBeDefined();
      expect(e?.status).toBe("scheduled-json-only");
      expect(inv.extras.some((x) => x.content_key === "past-ig")).toBe(false);
    });

    it("deleted 状態の post は inventory から除外する", async () => {
      const posts: SeedPost[] = [
        { id: 1, platform: "x", status: "deleted", domain: "ranking", content_key: "gone" },
        { id: 2, platform: "x", status: "posted", domain: "ranking", content_key: "live" },
      ];
      const { buildInventory } = await load({ posts });
      const inv = buildInventory();
      expect(inv.posts.map((p) => p.content_key)).toEqual(["live"]);
    });
  });
});
