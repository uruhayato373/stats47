export async function loadPrefectureTopology({ areaCode }: { areaCode: string }) {
  // PrefectureMapWidgetはareaCodeをpropsで受けて内部で取得するため、そのまま返す
  return { areaCode };
}
