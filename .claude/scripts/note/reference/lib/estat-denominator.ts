/**
 * 指標の表示名に分母 (「人口100万人当たり」など) が無いとき、e-Stat の項目名から分母を補う。
 * ランキングの表示名は分母を落としているものがある (博物館数 = 人口100万人当たりなのに「博物館数」「館」)。
 * キー名の per-1000 などからは分母を推測できない (人口・世帯・出生など) ので、項目名だけを正典にする。
 * 項目名は e-Stat メタ情報の控え (data/estat/meta/<統計表ID>.json) を先に読み、無ければ API で引く。
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { datasetDir } from '../../../../../config/datasets.mjs';

const ROOT = path.resolve(__dirname, '../../../../..');
const META_API = 'https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo';
const cache = new Map<string, Map<string, string>>();

type Recipe = { kind?: string; estatParams?: { statsDataId?: string; cdCat01?: string } } | undefined;

function appId() {
  const env = readFileSync(path.join(ROOT, 'apps/web/.env.development'), 'utf8');
  return env.match(/NEXT_PUBLIC_ESTAT_APP_ID=(\S+)/)?.[1] ?? null;
}

async function cat01Names(statsDataId: string): Promise<Map<string, string>> {
  const hit = cache.get(statsDataId);
  if (hit) return hit;
  const names = new Map<string, string>();
  const file = path.join(ROOT, datasetDir('estat.meta'), `${statsDataId}.json`);
  const local = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
  const dim = local?.dimensions?.find((d: { id: string }) => d.id === 'cat01');
  if (dim && dim.sampleValues?.length === dim.valueCount) {
    for (const v of dim.sampleValues) names.set(v.code, v.name);
  } else {
    const id = appId();
    if (id) {
      const json = await (await fetch(`${META_API}?appId=${id}&statsDataId=${statsDataId}`)).json();
      const cls = json?.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ;
      const cat = [].concat(cls ?? []).find((c: Record<string, string>) => c['@id'] === 'cat01') as Record<string, unknown> | undefined;
      for (const c of [].concat((cat?.CLASS ?? []) as never[]) as Record<string, string>[]) names.set(c['@code'], c['@name']);
    }
  }
  cache.set(statsDataId, names);
  return names;
}

/** e-Stat の項目名の末尾の括弧から分母 (「…当たり」) を取り出す。無ければ null */
export function denominatorFromName(name: string): string | null {
  const m = name.match(/[（(]([^（）()]*(?:当たり|あたり)[^（）()]*)[）)]\s*$/);
  return m ? m[1] : null;
}

/** 表示名に分母が無ければ e-Stat の項目名の分母を添える */
export async function qualifyLabel(label: string, recipe: Recipe): Promise<string> {
  if (/当たり|あたり/.test(label)) return label;
  const id = recipe?.estatParams?.statsDataId, code = recipe?.estatParams?.cdCat01;
  if (recipe?.kind !== 'estat' || !id || !code) return label;
  const denominator = denominatorFromName((await cat01Names(id)).get(code) ?? '');
  return denominator ? `${label}（${denominator}）` : label;
}
