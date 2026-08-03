/**
 * マガジン + 所属記事数を JSON で dump (note-operator CLI が読む)。
 * 実行: npx tsx .claude/scripts/note/catalog/dump-magazines-json.ts
 */
import { NOTE_MAGAZINES, NOTE_ARTICLES } from "./index";

const out = NOTE_MAGAZINES.map((m) => {
  const members = NOTE_ARTICLES.filter((a) => a.magazine === m.key);
  return {
    key: m.key,
    name: m.name,
    description: m.description,
    isPaid: m.isPaid,
    noteUrl: m.noteUrl,
    verticals: m.verticals,
    memberCount: members.length,
    publishedMemberCount: members.filter((a) => a.status === "published").length,
    // 追加対象になりうる公開済みメンバーの noteUrl (add-article 用)
    publishedMembers: members
      .filter((a) => a.status === "published" && a.noteUrl)
      .map((a) => ({ key: a.key, title: a.title, noteUrl: a.noteUrl, isPaid: a.isPaid })),
  };
});
console.log(JSON.stringify(out));
