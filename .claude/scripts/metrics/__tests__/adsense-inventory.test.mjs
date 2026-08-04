/**
 * fetchAdUnitInventory のテスト — 1 client の失敗で inventory 全体を落とさない契約。
 *
 * 背景 (2026-08-04): このアカウントは content 用 `ca-pub-*` と AdSense for Search の
 * `partner-pub-*` を持つ。後者は adunits.list が NOT_FOUND を返すが per-client の
 * try/catch が無く、**inventory が一度も成功していなかった** (W30/W31 とも
 * status=error・rowCount=0)。その結果 slot↔unit の突き合わせが不能で、
 * 「どの広告枠がいくら稼いでいるか」をコード側 slot に接続できなかった。
 *
 * 全 PASS はゲートが何も見ていない状態と区別がつかないので、
 * 「1 件失敗 → 続行」と「全件失敗 → throw」の両方向を固定する。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchAdUnitInventory } from "../fetch-adsense-snapshot.mjs";

const AD_CODE = '<ins class="adsbygoogle" data-ad-client="ca-pub-1" data-ad-slot="1234567890"></ins>';

/**
 * @param clients  { [clientName]: units[] | Error }  Error なら adunits.list が throw する
 */
function stubAdsense(clients) {
  return {
    accounts: {
      adclients: {
        list: async () => ({
          data: { adClients: Object.keys(clients).map((name) => ({ name })) },
        }),
        adunits: {
          list: async ({ parent }) => {
            const v = clients[parent];
            if (v instanceof Error) throw v;
            return { data: { adUnits: v } };
          },
          getAdcode: async () => ({ data: { adCode: AD_CODE } }),
        },
      },
    },
  };
}

const unit = (id, name) => ({
  name: `accounts/pub-1/adclients/ca-pub-1/adunits/${id}`,
  reportingDimensionId: id,
  displayName: name,
  state: "ACTIVE",
  contentAdsSettings: { type: "DISPLAY", size: "RESPONSIVE" },
});

test("ad unit を持たない client があっても、他の client の inventory は取れる", async () => {
  const adsense = stubAdsense({
    "accounts/pub-1/adclients/ca-pub-1": [unit("u1", "サイドバー右上"), unit("u2", "広告")],
    "accounts/pub-1/adclients/partner-pub-1": new Error(
      "Couldn't find the ad client with name 'accounts/pub-1/adclients/partner-pub-1'.",
    ),
  });
  const r = await fetchAdUnitInventory(adsense, "accounts/pub-1");
  assert.equal(r.rows.length, 2, "content client のユニットが取れていない");
  assert.deepEqual(
    r.rows.map((x) => x.unit_id),
    ["u1", "u2"],
  );
  assert.equal(r.skippedClients.length, 1);
  assert.match(r.skippedClients[0], /partner-pub-1/);
  assert.equal(r.slotIdMissingCount, 0, "adCode から slot_id を抽出できているはず");
});

test("全 client が失敗したら throw する (0 件を『ユニット無し』と誤読させない)", async () => {
  const adsense = stubAdsense({
    "accounts/pub-1/adclients/partner-pub-1": new Error("NOT_FOUND a"),
    "accounts/pub-1/adclients/partner-pub-2": new Error("NOT_FOUND b"),
  });
  await assert.rejects(
    () => fetchAdUnitInventory(adsense, "accounts/pub-1"),
    /全 2 件の ad client で adunits.list に失敗/,
  );
});

test("client が 0 件なら throw せず空を返す (失敗ではなく在庫なし)", async () => {
  const r = await fetchAdUnitInventory(stubAdsense({}), "accounts/pub-1");
  assert.deepEqual(r.rows, []);
  assert.deepEqual(r.skippedClients, []);
});

test("adCode 取得が失敗しても行は落とさず slot_id を空にする", async () => {
  const adsense = stubAdsense({
    "accounts/pub-1/adclients/ca-pub-1": [unit("u1", "広告")],
  });
  adsense.accounts.adclients.adunits.getAdcode = async () => {
    throw new Error("permission denied");
  };
  const r = await fetchAdUnitInventory(adsense, "accounts/pub-1");
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0].slot_id, "");
  assert.equal(r.slotIdMissingCount, 1);
});

test("import しても main() が走らない (entry guard)", () => {
  // ここまでのテストが env 未設定で通っている事実がその証拠。明示的に固定しておく。
  assert.equal(typeof fetchAdUnitInventory, "function");
});
