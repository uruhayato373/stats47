from pathlib import Path
import json,hashlib,os
b=Path(os.environ.get('STATS47_PROPERTY_SOURCE_DIR', Path(__file__).resolve().parent)).resolve()
p=json.loads((b/'property-prices.json').read_text())
full_sources=p.pop('sourceFiles');notes=p.pop('notes')
manifest={'schemaVersion':1,'dataYear':'2025','retrievedAt':'2026-09-10','files':full_sources,'licenses':[{'name':'PDL1.0','source':'不動産取引価格情報','url':'https://www.reinfolib.mlit.go.jp/help/termsOfUse/','commercialUse':'allowed','evidenceUrl':'https://www.reinfolib.mlit.go.jp/help/contents/'},{'name':'CC-BY-4.0','source':'国土数値情報 地価公示2025','url':'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-L01-2025.html','commercialUse':'allowed'}]}
mb=(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n').encode();(b/'source-manifest.json').write_bytes(mb);manifest_sha=hashlib.sha256(mb).hexdigest();p['sourceManifestSha256']=manifest_sha;(b/'property-prices.json').write_text(json.dumps(p,ensure_ascii=False,separators=(',',':'))+'\n')
metrics=[{'key':'residential-land-transaction-median-price','exportName':'residentialLandTransactionMedianPrice','title':'住宅地の取引単価中央値（100〜300㎡未満）','dataset':'transactions','statistic':'median','unit':'円/m2'}, {'key':'residential-land-transaction-sample-count','exportName':'residentialLandTransactionSampleCount','title':'住宅地の取引価格標本数（100〜300㎡未満）','dataset':'transactions','statistic':'count','unit':'件'}, {'key':'residential-official-land-median-price','exportName':'residentialOfficialLandMedianPrice','title':'住宅地の公示価格中央値（100〜300㎡未満）','dataset':'officialLandPrice','statistic':'median','unit':'円/m2'}, {'key':'residential-official-land-point-count','exportName':'residentialOfficialLandPointCount','title':'住宅地の公示標準地数（100〜300㎡未満）','dataset':'officialLandPrice','statistic':'count','unit':'地点'}]
sources=[{'id':'transactions','title':'国土交通省 不動産情報ライブラリ 不動産取引価格情報 2025年','url':'https://www.reinfolib.mlit.go.jp/','downloadPageUrl':'https://www.reinfolib.mlit.go.jp/realEstatePrices/','accessedAt':'2026-09-10','license':'PDL1.0','unitColumn':'取引価格（㎡単価）','rawUnit':'円/m2','calculation':'CSV公表単価を直接使用。総額/面積の再計算はしない。'}, {'id':'officialLandPrice','title':'国土交通省 国土数値情報 地価公示 2025年1月1日','url':'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-L01-2025.html','downloadUrl':'https://nlftp.mlit.go.jp/ksj/old/data/L01/L01-2025P/L01-2025P-48-01.0a.zip','accessedAt':'2026-09-10','license':'CC-BY-4.0','unitColumn':'価格R07','rawUnit':'円/m2','calculation':'1標準地1行の公示価格を使用。鑑定士ごとの鑑定評価額は使用しない。'}]
source={'r2Key':'app/themes/land-property-market/property-prices.json','profileKey':'property-price-distribution','year':'2025','unit':'円/m2','displayUnit':'円/㎡','sourceManifestSha256':manifest_sha,'definition':p['definition'],'metrics':metrics,'sources':sources,'notes':notes}
(b/'property-price-distribution-source.ts').write_text('export const PROPERTY_PRICE_DISTRIBUTION_SOURCE = '+json.dumps(source,ensure_ascii=False,indent=2)+' as const;\n')
obs=[]
for m in metrics:
 rows=[{'areaCode':r['areaCode'],'areaName':r['areaName'],'yearCode':'2025','yearName':'2025年中' if m['dataset']=='transactions' else '2025年1月1日','value':r[m['dataset']][m['statistic']],'unit':m['unit']} for r in p['areas']]
 obs.append({'metricKey':m['key'],'unit':m['unit'],'rows':rows})
(b/'metric-values.json').write_text(json.dumps(obs,ensure_ascii=False,indent=2)+'\n')
(b/'metric-definitions.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2)+'\n')
print('SOURCE MANIFEST SHA',manifest_sha)
