import { describe, expect, it } from "vitest";
import { KINDLE_BOOKS } from "../book-catalog";
import { KDP_READINGS, KDP_READING_SOURCES } from "../kdp-reading";

describe("KDP reading source snapshots", () => {
  it("all catalog titles and subtitles match the human-verified reading source", () => {
    const mismatches = KINDLE_BOOKS.flatMap((book) => {
      const source = KDP_READING_SOURCES[book.id];
      if (!source) return [`${book.id}: source missing`];
      if (source.title !== book.title) return [`${book.id}: title ${source.title} -> ${book.title}`];
      if ((source.subtitle ?? null) !== (book.subtitle ?? null)) return [`${book.id}: subtitle mismatch`];
      if (!KDP_READINGS[book.id]) return [`${book.id}: reading missing`];
      return [];
    });
    expect(mismatches).toEqual([]);
  });
});
