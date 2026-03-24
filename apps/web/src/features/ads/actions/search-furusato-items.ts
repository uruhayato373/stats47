"use server";

import {
  type RakutenItem,
  searchFurusatoItems,
} from "../lib/rakuten-api";

export async function searchFurusatoItemsAction(
  prefName: string,
): Promise<RakutenItem[]> {
  return searchFurusatoItems(prefName);
}
