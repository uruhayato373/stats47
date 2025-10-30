"use server";
import { subcategoryLayouts } from "../layouts/subcategory-layouts";
import { dataLoaders } from "../widgets/registry";

export async function loadDashboardData({ subcategoryId, areaCode }: { subcategoryId: string; areaCode: string }) {
  const layout = subcategoryLayouts[subcategoryId];
  if (!layout) return { layout: null, data: {} } as const;

  const entries = await Promise.all(
    layout.widgets.map(async (w) => {
      const loader = (dataLoaders as any)[w.loader] as (args: { areaCode: string }) => Promise<any>;
      const data = loader ? await loader({ areaCode }) : null;
      return [w.key, data] as const;
    })
  );
  const data = Object.fromEntries(entries);
  return { layout, data } as const;
}
