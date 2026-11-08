import assert from "node:assert/strict";
import { test } from "node:test";

import sharp from "sharp";

import { CELL_HEIGHT, CELL_WIDTH, isPrimaryFigure, renderContactSheet, sheetSize } from "../figure-contact-sheet-core.mjs";

const svg = (fill) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><rect width="1080" height="1350" fill="${fill}"/></svg>`);

test("小さな SVG 2 枚を 1 行の格子にする", async () => {
  const png = await renderContactSheet([
    { name: "a.svg", svg: svg("#ff0000") },
    { name: "b.svg", svg: svg("#0000ff") },
  ]);
  const meta = await sharp(png).metadata();
  assert.equal(meta.format, "png");
  assert.deepEqual({ width: meta.width, height: meta.height }, { width: CELL_WIDTH * 2, height: CELL_HEIGHT });
  // 1 枚目の中央は赤、2 枚目の中央は青
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const at = (x, y) => [...data.subarray((y * info.width + x) * info.channels, (y * info.width + x) * info.channels + 3)];
  assert.deepEqual(at(CELL_WIDTH / 2, 100), [255, 0, 0]);
  assert.deepEqual(at(CELL_WIDTH * 1.5, 100), [0, 0, 255]);
});

test("4 列で折り返す", () => {
  assert.deepEqual(sheetSize(20), { width: CELL_WIDTH * 4, height: CELL_HEIGHT * 5, rows: 5 });
  assert.deepEqual(sheetSize(5), { width: CELL_WIDTH * 4, height: CELL_HEIGHT * 2, rows: 2 });
});

test("ダーク・モバイル・Instagram の派生版は載せない", () => {
  const names = ["gap-steps-bars.svg", "gap-steps-bars-dark.svg", "gap-steps-bars-mobile.svg", "gap-ig.svg", "og.png", "steps-mobile-dark.svg"];
  assert.deepEqual(names.filter(isPrimaryFigure), ["gap-steps-bars.svg"]);
});
