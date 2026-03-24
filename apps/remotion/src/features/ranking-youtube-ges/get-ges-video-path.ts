import { staticFile } from "remotion";

/**
 * 都道府県コードから GES 背景動画の staticFile パスを取得する
 * 
 * @param areaCode 都道府県コード (JIS 5桁, 例: "01000")
 * @param aspect アスペクト比 ("portrait" | "landscape")
 * @returns staticFile 用のパス
 */
export const getGesVideoPath = (areaCode: string | undefined, aspect: "portrait" | "landscape" = "portrait") => {
  if (!areaCode) return "";

  // 5桁コードであることを確認 (例: "01" -> "01000")
  const code = areaCode.length === 2 ? `${areaCode}000` : areaCode;
  
  // public/backgrounds/ges/{aspect}/{code}.mp4
  return staticFile(`backgrounds/ges/${aspect}/${code}.mp4`);
};
