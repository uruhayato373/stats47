# 32_note公開済み

note.com で**公開が完了したヴァーティアル**の記事ソースを格納するディレクトリ。

## 31_note記事原稿 との使い分け

| 状態 | 置き場所 |
|---|---|
| 制作中（ヴァーティカルの全記事が公開完了していない） | `docs/31_note記事原稿/<vertical>/` |
| 公開完了（ヴァーティカルの全記事が公開済み） | `docs/32_note公開済み/<vertical>/` |

- **移動はヴァーティカル単位**。あるヴァーティカル（例: `koumuin-claude-code`）の全記事を note.com で公開し終えたら、`docs/31_note記事原稿/<vertical>/` フォルダを**まるごと** `docs/32_note公開済み/<vertical>/` へ移動する。
- **記事単位では移動しない。** 記事間の相対リンク（`../<slug>/draft.md`）を生かすため、ヴァーティカル内の記事は常に同じ階層に揃えておく。
- 個別記事の公開状況（slug → note URL）は `.claude/state/note-published-urls.json` で管理する。ディレクトリ位置ではなくこの JSON が公開状況の真実源。

## なぜ R2 ではなく docs/ なのか

- note 記事は **note.com 自身がホスト・配信**する。stats47.jp の Web アプリ（D1 → R2 → Cloudflare 配信）とは別系統で、R2 は配信に関与しない。
- ソースの真実源は `draft.md`（docs/ 配下）。docs/ は git 管理されるため、版管理もバックアップも自動で確保される。R2 アーカイブは不要。
- 旧 `publish-note` ルール（公開後 `.local/r2/note/` へ移動）は 2026-05-21 に廃止。

## 画像の扱い — SVG のみ保管、PNG は再生成方式

公開記事が増えるとローカル容量を圧迫するため、**このディレクトリには `draft.md` と `*.svg`（ベクターソース）のみを置く**。

- `*.png` は SVG から変換した派生物。1 枚 50〜380KB と重く、公開時点で note.com へアップ済み。永続保管する意味がないため**ヴァーティカル移動時に削除する**（SVG ソースを持つもののみ）。
- `*.svg` は 1 枚 2〜5KB と極小。これさえ残せば PNG はいつでも再生成できる。
- `docs/32_note公開済み/**/images/*.png` は `.gitignore` 済み（再生成物をコミットしない）。
- **例外**: SVG ソースを持たない旧記事（例: `a-maximum-temperature` のデータ図表 PNG）は、PNG が唯一のソースなので削除せず保管・追跡する（`.gitignore` の `!` 行で個別に追跡指定）。

PNG が必要になったとき（`--update` での再アップロード等）は次で再生成する:

```bash
.claude/scripts/note/regenerate-svg-png.sh docs/32_note公開済み/<vertical>
```

これにより 1 ヴァーティカルの永続容量は約 30MB → 約 1〜2MB に縮む。

## 修正フロー

公開済み記事を直す場合:

1. このディレクトリ（または制作中なら `31_note記事原稿/`）の `draft.md` / `*.svg` を修正する
2. PNG が必要なら `.claude/scripts/note/regenerate-svg-png.sh <記事 or ヴァーティカルのパス>` で再生成する
3. `/publish-note --update <slug>` で note.com の既存記事に反映する

note.com が配信元なので、「R2 に上書き」という工程は存在しない。

## 関連

- 投稿・更新スキル: `.claude/skills/note/publish-note/SKILL.md`
- 公開済み URL 対応表: `.claude/state/note-published-urls.json`
