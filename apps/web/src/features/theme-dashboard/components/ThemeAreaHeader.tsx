"use client";

import { PageHeader } from "@/components/layout";

import { PrefectureSelect } from "./PrefectureSelect";
import { useThemePrefecture } from "./ThemePrefectureContext";

/**
 * エリア連動のテーマ見出し。
 * 全国時は「{テーマ名}」、都道府県選択時は「{県名}の{テーマ名}」を H1 に表示する。
 * SSR では全国 (テーマ名) を描画し、選択時にクライアントで更新する。
 *
 * 都道府県セレクタは xl+ では左レール (ThemeSideNav) に集約したため、ここでは
 * 狭幅 (xl 未満・左レール非表示) のときだけ actions スロットに出す。
 */
export function ThemeAreaHeader({
  themeTitle,
  description,
}: {
  themeTitle: string;
  description?: string;
}) {
  const { selectedAreaName } = useThemePrefecture();
  const title = selectedAreaName ? `${selectedAreaName}の${themeTitle}` : themeTitle;
  return (
    <PageHeader
      title={title}
      description={description}
      actions={
        // 境界は PageShell の左レール (hidden lg:block) と一致させる。
        // ずれると左レールと二重に地域セレクタが出る。
        <div className="lg:hidden">
          <PrefectureSelect />
        </div>
      }
    />
  );
}
