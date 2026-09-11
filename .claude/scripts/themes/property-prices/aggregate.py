"""Official CSV-only property profile; deterministic extraction, no network or database writes."""
from pathlib import Path
from zipfile import ZipFile
from collections import Counter
from datetime import datetime, timezone
import csv, io, json, hashlib, re, math, os
BASE = Path(os.environ.get('STATS47_PROPERTY_SOURCE_DIR', Path(__file__).resolve().parent)).resolve()
YEAR = '2025'
AREA_MIN = 100
AREA_MAX_EXCLUSIVE = 300
PREFECTURES = {r['prefCode'][:2]:r['prefName'] for r in json.loads((BASE/'prefectures.json').read_text())}
MISSING = {'', '_', '-', 'NA', 'N/A'}

def sha(b): return hashlib.sha256(b).hexdigest()
def raw_path(record):
    archived = BASE/'raw'/Path(record['path']).name
    return archived if archived.is_file() else Path(record['path'])
def csv_zip(path):
    with ZipFile(path) as z:
        names=[n for n in z.namelist() if n.lower().endswith('.csv')]
        if len(names)!=1: raise ValueError('one CSV required: '+str(path))
        data=z.read(names[0]); text=data.decode('cp932',errors='strict')
    reader=csv.reader(io.StringIO(text),strict=True); header=next(reader)
    if len(set(header))!=len(header): raise ValueError('duplicate CSV header')
    rows=[]
    for line,values in enumerate(reader,start=2):
        if len(values)!=len(header): raise ValueError(f'column count {path}:{line}')
        rows.append((line,dict(zip(header,values))))
    return rows,dict(member=names[0],encoding='CP932 / Shift_JIS',sha256=sha(data),bytes=len(data),rawRows=len(rows),columns=header)

def number(text):
    if text in MISSING: return None,'missing'
    if re.fullmatch(r'[0-9]+(?:\.[0-9]+)?',text):
        v=float(text)
        if not math.isfinite(v): return None,'invalid'
        return (int(v) if v.is_integer() else v),None
    if any(x in text for x in ['以上','未満','超','以下','>','<']): return None,'censored'
    return None,'invalid'

def quantile(values,p):
    if not values: return None
    xs=sorted(values); i=(len(xs)-1)*p; lo=math.floor(i); hi=math.ceil(i)
    return xs[lo]+(xs[hi]-xs[lo])*(i-lo)

def stats(values):
    n=len(values)
    return {'count':n,'status':'no-data' if n==0 else ('small-sample' if n<10 else 'available'),
            'q1':quantile(values,.25),'median':quantile(values,.5),'q3':quantile(values,.75)}

def transaction_row(row,pref):
    if row['価格情報区分']!='不動産取引価格情報': raise ValueError('price classification contamination')
    if row['種類']!='宅地(土地)': raise ValueError('property type contamination')
    if not re.fullmatch(pref+r'[0-9]{3}',row['市区町村コード']) or row['都道府県名']!=PREFECTURES[pref]: raise ValueError('prefecture contamination')
    period=re.fullmatch(YEAR+r'年第([1-4])四半期',row['取引時期'])
    if not period: raise ValueError('period contamination')
    if row['地域']!='住宅地': return None,'other-region'
    area,error=number(row['面積（㎡）'])
    if error: return None,'area-'+error
    if not AREA_MIN<=area<AREA_MAX_EXCLUSIVE: return None,'outside-area-band'
    price,error=number(row['取引価格（㎡単価）'])
    if error: return None,'unit-price-'+error
    if price<=0: return None,'unit-price-nonpositive'
    return {'areaM2':area,'value':price,'quarter':int(period.group(1))},None

def official_row(row):
    if row['年度']!=YEAR: raise ValueError('official year contamination')
    if not re.fullmatch(r'[0-9]{5}',row['行政区域コード']) or row['行政区域コード'][:2] not in PREFECTURES: raise ValueError('official prefecture contamination')
    if row['番号用途区分']!='000': return None,'other-use'
    area,error=number(row['地積'])
    if error: return None,'area-'+error
    if not AREA_MIN<=area<AREA_MAX_EXCLUSIVE: return None,'outside-area-band'
    price,error=number(row['価格R07'])
    if error: return None,'unit-price-'+error
    if price<=0: return None,'unit-price-nonpositive'
    return {'areaM2':area,'value':price},None

def assert_manifest(downloads):
    if len(downloads)!=47 or {r['prefecture'] for r in downloads}!=set(PREFECTURES): raise ValueError('47 unique prefecture downloads required')
    if any(not r['pass'] for r in downloads): raise ValueError('unfinished download')
    for d in downloads:
        if sha(raw_path(d).read_bytes())!=d['sha256']: raise ValueError('raw hash mismatch')
    if len({d['sha256'] for d in downloads})!=47: raise ValueError('duplicated input file')

def validate_profile(profile):
    if len(profile['areas'])!=47 or {r['areaCode'] for r in profile['areas']}!={p+'000' for p in PREFECTURES}: raise ValueError('47 unique rows required')
    for area in [profile['national'],*profile['areas']]:
        for kind in ['transactions','officialLandPrice']:
            d=area[kind]; n=d['count']; q=[d['q1'],d['median'],d['q3']]
            if n<0 or int(n)!=n: raise ValueError('invalid denominator')
            if sum(d['excluded'].values())+n!=d['rawCount']: raise ValueError('row conservation failure')
            if n==0 and any(v is not None for v in q): raise ValueError('no sample must be null')
            if n>0 and (any(v is None or not math.isfinite(v) or v<=0 for v in q) or q!=sorted(q)): raise ValueError('invalid quartiles')

def build():
    downloads=json.loads((BASE/'prefecture-downloads.json').read_text());assert_manifest(downloads)
    official_downloads=json.loads((BASE/'ksj-downloads.json').read_text())
    for d in official_downloads:
        if sha(raw_path(d).read_bytes())!=d['sha256']: raise ValueError('KSJ hash mismatch')
    rows,official_csv=csv_zip(BASE/'raw/L01-2025P-48-01.0a.zip')
    with ZipFile(BASE/'raw/L01-25_GML.zip') as z:
        name=next(n for n in z.namelist() if n.endswith('.geojson')); geo_bytes=z.read(name);geo=json.loads(geo_bytes)
    def sid(r): return '-'.join(r[k] for k in ['行政区域コード','番号用途区分','番号連番'])
    geos={ '-'.join(str(f['properties'][k]) for k in ['L01_001','L01_002','L01_003']):f['properties'] for f in geo['features'] }
    if len(geos)!=len(geo['features']) or len({sid(r) for _,r in rows})!=len(rows): raise ValueError('duplicate official standard point')
    if len(rows)!=25563 or {sid(r) for _,r in rows}!=set(geos): raise ValueError('CSV/GeoJSON standard-point mismatch')
    for _,r in rows:
        g=geos[sid(r)]
        if int(r['価格R07'])!=g['L01_008'] or int(r['地積'])!=g['L01_027'] or int(r['年度'])!=g['L01_007']: raise ValueError('CSV/GeoJSON value mismatch '+sid(r))
    bypref={p:[] for p in PREFECTURES}
    for line,r in rows:bypref[r['行政区域コード'][:2]].append((line,r))
    sources=[]; rejects=[]; normalized=[]; areas=[]; all_values={'transactions':[],'officialLandPrice':[]}; duplicate_report=[]
    for download in sorted(downloads,key=lambda d:d['prefecture']):
        pref=download['prefecture'];tx,csvmeta=csv_zip(raw_path(download));source_id='transactions-'+pref
        stated=re.search(r'([\d,]+)件',download['conditionText'])
        if not stated or int(stated.group(1).replace(',',''))!=len(tx):raise ValueError('UI/CSV row count mismatch '+pref)
        sources.append({'id':source_id,'prefectureCode':pref,'zipSha256':download['sha256'],'zipBytes':download['bytes'],'csv':csvmeta,'query':{'page':'https://www.reinfolib.mlit.go.jp/realEstatePrices/','prefecture':pref,'priceClassification':'01','type':'place','start':'20251','end':'20254'},'downloadFilename':download['suggestedFilename']})
        counts=Counter(json.dumps(r,ensure_ascii=False,sort_keys=True) for _,r in tx)
        duplicate_report.append({'prefectureCode':pref,'equalRowGroups':sum(v>1 for v in counts.values()),'equalRowsBeyondFirst':sum(v-1 for v in counts.values()),'retained':True,'reason':'CSV has no transaction ID. Equality after anonymization does not prove the same transaction; each source row remains one sample.'})
        area={'areaCode':pref+'000','areaName':PREFECTURES[pref]}
        for kind,data,parse in [('transactions',tx,lambda r:transaction_row(r,pref)),('officialLandPrice',bypref[pref],official_row)]:
            values=[];excluded=Counter();quarters=Counter(); raw_flags=Counter()
            for line,r in data:
                if kind=='transactions':
                    for col,name in [('面積（㎡）','area'),('取引価格（㎡単価）','unitPrice')]:
                        _,error=number(r[col])
                        if error:raw_flags[name+'-'+error]+=1
                value,reason=parse(r)
                if reason:
                    excluded[reason]+=1;rejects.append({'dataset':kind,'areaCode':pref+'000','sourceRow':line,'sourceId':source_id if kind=='transactions' else 'official','reason':reason});continue
                values.append(value['value']);quarters[str(value.get('quarter'))]+=1
                normalized.append({'dataset':kind,'areaCode':pref+'000','sourceRow':line,'sourceId':source_id if kind=='transactions' else 'official',**value})
            area[kind]={**stats(values),'rawCount':len(data),'excluded':dict(sorted(excluded.items())),'rawQualityFlags':dict(raw_flags)}
            if kind=='transactions':area[kind]['quarterCounts']={str(q):quarters[str(q)] for q in range(1,5)}
            all_values[kind]+=values
        areas.append(area)
    national={}
    for kind,values in all_values.items():
        excluded=Counter()
        for a in areas:excluded.update(a[kind]['excluded'])
        national[kind]={**stats(values),'rawCount':sum(a[kind]['rawCount'] for a in areas),'excluded':dict(sorted(excluded.items()))}
    profile={'schemaVersion':1,'profileKey':'property-price-distribution','generatedAt':datetime.now(timezone.utc).isoformat(),'year':YEAR,'unit':'円/m2',
      'definition':{'areaM2':{'minInclusive':AREA_MIN,'maxExclusive':AREA_MAX_EXCLUSIVE},'transactionType':'宅地(土地)','transactionRegion':'住宅地','priceClassification':'01','transactionPeriod':{'from':'2025-Q1','to':'2025-Q4'},'officialUseCode':'000','officialPriceDate':'2025-01-01','quantileMethod':'Hyndman-Fan type 7: sorted x; h=(n-1)p; linear interpolation','nationalAggregation':'pooled selected rows; not average of prefecture quantiles'},
      'sourceFiles':sources+[{'id':'official','csv':official_csv,'downloads':official_downloads,'geoJsonSha256':sha(geo_bytes)}],
      'notes':['取引価格は回答された取引を個別物件が特定されないよう加工したサンプルであり、全物件の相場や全取引件数を示しません。','取引は地域区分「住宅地」、地価公示は用途区分「住宅地」を用い、公表面積帯を揃えています。地域区分と用途区分は同一の分類ではなく、立地・接道・形状等も統制していません。価格を時点調整していないため、2025年中の取引と2025年1月1日の公示価格を比率や割安・割高の判定に使いません。','取引面積は公表時点で丸められており、100㎡以上300㎡未満は公表された面積値で判定します。上限表記・欠測は数値に置換せず除外数を表示します。','取引単価は原表の円/㎡列を使い、丸め済み総額を丸め済み面積で割り直しません。','各CSV行を1標本として保持します。匿名化後の完全一致行は同一取引と断定できないため自動削除していません。取引価格01のみを用い、成約価格02を混ぜていません。','地価公示は2025年に調査した25,563標準地から抽出します。26,000地点のうち隔年調査430地点、福島第一原発事故6地点、能登半島地震1地点は当年調査休止です。','全国表示は条件に合う公表行をまとめた当サイトの集計であり、公的機関が公表した全国中央値ではありません。','該当標本がない場合は価格を表示せず、10件未満は標本が少ないことを示します。今後の追加回答で原表が更新されるため、2026年9月10日に取得したデータを用いています。'],
      'national':national,'areas':areas}
    validate_profile(profile)
    for filename,data in [('property-prices.json',profile),('normalized-values.json',normalized),('exclusions.json',rejects),('duplicates.json',duplicate_report)]:
        (BASE/filename).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
    audit={'pass':True,'transactionPrefectures':len(downloads),'transactionRawRows':national['transactions']['rawCount'],'transactionIncluded':national['transactions']['count'],'transactionExcluded':national['transactions']['excluded'],'officialRawRows':len(rows),'officialIncluded':national['officialLandPrice']['count'],'officialExcluded':national['officialLandPrice']['excluded'],'officialCsvGeoJsonRowsCompared':len(rows),'officialNumericFieldsCompared':len(rows)*3,'transactionUiCsvCountsCompared':len(downloads),'duplicateGroups':sum(d['equalRowGroups'] for d in duplicate_report),'duplicateRowsRetained':sum(d['equalRowsBeyondFirst'] for d in duplicate_report),'areas':[{k:a[k] for k in ['areaCode','areaName']}|{kind:{k:a[kind][k] for k in ['count','status','q1','median','q3']} for kind in ['transactions','officialLandPrice']} for a in areas]}
    (BASE/'aggregate-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in audit.items() if k!='areas'},ensure_ascii=False))
if __name__=='__main__':build()
