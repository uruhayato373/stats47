export async function loadTotalPopulation({ areaCode }: { areaCode: string }) {
  // TODO: features/estat-api servicesから実データ取得に置換
  return { title: "総人口", value: "—" };
}

export async function loadPopulationTimeSeries({ areaCode }: { areaCode: string }) {
  // TODO: 実データに差し替え
  return { title: "人口推移", points: [] };
}
