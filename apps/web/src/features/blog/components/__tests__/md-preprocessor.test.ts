import { describe, it, expect } from "vitest";

import { migrateLegacyDataSourceSection, preprocessCallouts } from "../md-preprocessor";

describe("preprocessCallouts", () => {
  it("NOTE callout を callout 要素に変換し、本文を Markdown として残す", () => {
    const source = `> [!NOTE]
> これは注記です。
> 2行目です。`;

    const result = preprocessCallouts(source);

    expect(result).toContain('<callout type="note">');
    expect(result).not.toContain("class=");
    expect(result).toContain("これは注記です。");
    expect(result).toContain("2行目です。");
  });

  it("TIP callout を変換する", () => {
    const source = `> [!TIP]
> ヒントです。`;

    const result = preprocessCallouts(source);

    expect(result).toContain('<callout type="tip">');
  });

  it("WARNING callout を変換する", () => {
    const source = `> [!WARNING]
> 警告です。`;

    const result = preprocessCallouts(source);

    expect(result).toContain('<callout type="warning">');
  });

  it("IMPORTANT callout を変換する", () => {
    const source = `> [!IMPORTANT]
> 重要です。`;

    const result = preprocessCallouts(source);

    expect(result).toContain('<callout type="important">');
  });

  it("CAUTION callout を変換する", () => {
    const source = `> [!CAUTION]
> 注意です。`;

    const result = preprocessCallouts(source);

    expect(result).toContain('<callout type="caution">');
  });

  it("段落の直後に続く callout も前後に空行を置いて独立したブロックにする", () => {
    // 独自タグの HTML ブロックは段落の途中から始められない (CommonMark type 7)。空行が無いと段落に吸収される
    const result = preprocessCallouts(["本文の段落", "> [!NOTE]", "> 注記", "続く段落"].join("\n"));

    expect(result).toContain(["本文の段落", "", '<callout type="note">', "", "注記", "", "</callout>", ""].join("\n"));
  });

  it("callout でない通常行はそのまま保持する", () => {
    const source = `通常のテキスト
2行目`;

    const result = preprocessCallouts(source);

    expect(result).toBe(source);
  });

  it("関連記事セクションを related-articles 要素に変換する", () => {
    const source = `### 関連記事

- [記事1](/blog/article-1)
- [記事2](/blog/article-2)`;

    const result = preprocessCallouts(source);

    expect(result).toContain("<related-articles>");
    expect(result).toContain('href="/blog/article-1"');
    expect(result).toContain("</related-articles>");
  });

  it("relatedArticleTitles がある場合にタイトルを置換する", () => {
    const source = `### 関連記事

- [リンクテキスト](/blog/my-article)`;

    const result = preprocessCallouts(source, { "my-article": "実際のタイトル" });

    expect(result).toContain("実際のタイトル");
  });

  it("callout と通常テキストの混在", () => {
    const source = `前のテキスト

> [!NOTE]
> 注記

後のテキスト`;

    const result = preprocessCallouts(source);

    expect(result).toContain("前のテキスト");
    expect(result).toContain('<callout type="note">');
    expect(result).toContain("後のテキスト");
  });

  it("WARNING と TIP が連続すると WARNING だけをカードに残す", () => {
    const source = `> [!WARNING]
> 注意です。

> [!TIP]
> 読み方です。`;

    const result = preprocessCallouts(source);

    expect(result.match(/<callout /g)).toHaveLength(1);
    expect(result).toContain('<callout type="warning">');
    expect(result).toContain("**読み解きのポイント:** 読み方です。");
  });

  it("NOTE・WARNING・TIP の連続では最重要の WARNING だけをカードに残す", () => {
    const source = `> [!NOTE]
> 定義です。

> [!WARNING]
> 注意です。

> [!TIP]
> 読み方です。`;

    const result = preprocessCallouts(source);

    expect(result.match(/<callout /g)).toHaveLength(1);
    expect(result).toContain("**補足:** 定義です。");
    expect(result).toContain('<callout type="warning">');
    expect(result).toContain("**読み解きのポイント:** 読み方です。");
  });

  it("通常本文を挟む callout はどちらもカードとして表示する", () => {
    const source = `> [!WARNING]
> 注意です。

本文です。

> [!TIP]
> 読み方です。`;

    const result = preprocessCallouts(source);

    expect(result.match(/<callout /g)).toHaveLength(2);
  });
});

describe("migrateLegacyDataSourceSection", () => {
  it("末尾の手書きデータ出典節を見出しごと除く", () => {
    const source = [
      "本文です。",
      "",
      "## データ出典",
      "",
      "- 総務省統計局「家計調査」",
      "- 集計期間は2000年〜2024年",
      "",
    ].join("\n");
    expect(migrateLegacyDataSourceSection(source).content).toBe("本文です。\n");
  });

  it("次の見出しの手前で止め、後続の節は残す", () => {
    const source = [
      "本文",
      "",
      "### データ出典",
      "",
      "出典: 社会・人口統計体系",
      "",
      "## まとめ",
      "",
      "まとめ本文",
      "",
    ].join("\n");
    expect(migrateLegacyDataSourceSection(source).content).toBe(
      ["本文", "", "## まとめ", "", "まとめ本文", ""].join("\n"),
    );
  });

  it("節の直前の区切り線も除き、末尾に水平線だけが残らないようにする", () => {
    const source = ["本文", "", "---", "", "## データ出典", "", "- e-Stat", ""].join("\n");
    expect(migrateLegacyDataSourceSection(source).content).toBe("本文\n");
  });

  it("データ出典の節が無い本文は変更しない", () => {
    const source = ["本文", "", "## 出典の読み方", "", "解説", ""].join("\n");
    expect(migrateLegacyDataSourceSection(source)).toEqual({ content: source, action: "none" });
  });

  it("計算方法や定義を含む節は削除せず「データについて」へ改名して説明を残す", () => {
    const source = [
      "本文",
      "",
      "### データ出典",
      "",
      "- 厚生労働省「賃金構造基本統計調査」(2023年)",
      "- 平均年収は、きまって支給する現金給与額×12＋年間賞与で算出",
      "",
    ].join("\n");
    expect(migrateLegacyDataSourceSection(source)).toEqual({
      content: source.replace("### データ出典", "### データについて"),
      action: "renamed",
    });
  });

  it("注記 callout を含む節も改名して残す", () => {
    const source = ["本文", "", "## データ出典", "", "> [!NOTE]", "> 金額の指標です。", ""].join("\n");
    expect(migrateLegacyDataSourceSection(source).action).toBe("renamed");
  });
});

