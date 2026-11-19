#!/usr/bin/env python3
"""Private official HTML/PDF acquisition and deterministic facts-only extraction.
HTML CSRF/session values stay in the private source directory and never enter output.
"""
import argparse, concurrent.futures, datetime, hashlib, html, http.cookiejar, json, re, threading, urllib.parse, urllib.request
from html.parser import HTMLParser
from pathlib import Path

class Tables(HTMLParser):
    def __init__(self):
        super().__init__(); self.rows=[]; self.stack=[]; self.cells=[]
    def handle_starttag(self, tag, attrs):
        if tag=='tr': self.stack.append([])
        if tag in ('td','th'): self.cells.append([])
        if tag=='br' and self.cells: self.cells[-1].append('\n')
    def handle_data(self, data):
        if self.cells: self.cells[-1].append(data)
    def handle_endtag(self, tag):
        if tag in ('td','th') and self.cells:
            value=re.sub(r'[ \t\r\f\v]+',' ',''.join(self.cells.pop())).strip()
            if self.stack: self.stack[-1].append(re.sub(r'\n\s*','\n',value))
        if tag=='tr' and self.stack: self.rows.append(self.stack.pop())
def fields(body):
    parser=Tables(); parser.feed(body)
    rows=[row for row in parser.rows if len(row)==3 and row[1]=='：']
    assert len({row[0].strip() for row in rows})==len(rows), 'duplicate field label'
    return {row[0].strip():row[2].strip() for row in rows}
def sha(body): return hashlib.sha256(body).hexdigest()
def plain(body):
    return re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',re.sub(r'<(script|style)\b[^>]*>.*?</\1>','',body,flags=re.S|re.I)))).strip()
def query_ids(body, labels):
    match=re.search(r'検索条件：(.*?)</div>',body,re.S)
    assert match and all(label in match[1] for label in labels), 'official search conditions changed'
    ids=sorted(set(re.findall('/heritage/detail/401/([0-9]+)',body)),key=int)
    count=re.search(r'([\d,]+)\s*件中',body)
    if count: total=int(count[1].replace(',',''))
    else:
        assert 'データがありません' in body or '該当する' in body, 'unverified empty search'
        total=0
    assert total==len(ids) and total<=100, 'truncated/paginated result'
    return ids

def acquire(folder, definition, prefs):
    """Resume cached private sources; a fresh directory captures a fresh version."""
    folder.mkdir(parents=True,exist_ok=True,mode=0o700); folder.chmod(0o700)
    local=threading.local(); base=definition['url']; search='https://kunishitei.bunka.go.jp/bsys/searchlist'
    def get_session():
        if not hasattr(local,'op'):
            local.op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
            body=local.op.open(base,timeout=45).read().decode()
            local.csrf=re.search(r'name="_csrfToken"[^>]*value="([^"]+)"',body)[1]
        return local.op
    def one(job):
        filename,url,params=job; path=folder/filename
        if path.exists() and (folder/(filename+'.source.json')).exists(): return
        if params:
            op=get_session(); request=urllib.request.Request(url,data=urllib.parse.urlencode(params+[('_csrfToken',local.csrf)]).encode(),headers={'Referer':base})
            response=op.open(request,timeout=60)
        else: response=urllib.request.urlopen(url,timeout=60)
        body=response.read()
        if params:
            local.csrf=re.search(r'name="_csrfToken"[^>]*value="([^"]+)"',body.decode())[1]
        receipt={'url':url,'method':'POST' if params else 'GET','sha256':sha(body),'bytes':len(body),'fetchedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
        if params: receipt['query']=params
        path.write_bytes(body); (folder/(filename+'.source.json')).write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
    for category in definition['categories']:
        one((category['queryFilename'],search,[('register_sub_id','401'),('pageSize','100'),('entry_kind1_401[]',category['label'])]))
        assert query_ids((folder/category['queryFilename']).read_text(),[category['label']])==category['recordIds'], 'scope changed; review source pins before fetching details'
    jobs=[('detail-'+id+'.html',definition['detailUrlPrefix']+id,None) for id in definition['recordPrefectures']]
    jobs += [('pref-'+p['prefCode']+'.html',search,[('register_sub_id','401'),('pageSize','100'),('seat_pref',p['prefName'])]+[('entry_kind1_401[]',c['label']) for c in definition['categories']]) for p in prefs]
    jobs += [(r['filename'],r['url'],None) for r in definition['rights']]
    jobs += [(r['filename'],r['url'],None) for r in definition['geographyEvidence'].values() if r['filename'].startswith('supplement-')]
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: list(pool.map(one,jobs))

def extract(folder, definition, prefs):
    manifest=[]
    def read(filename,url,query=None):
        body=(folder/filename).read_bytes(); receipt=json.loads((folder/(filename+'.source.json')).read_text())
        assert receipt['url']==url and receipt['sha256']==sha(body) and receipt['bytes']==len(body), 'raw receipt identity/hash/length'
        assert datetime.datetime.fromisoformat(receipt['fetchedAt']).tzinfo, 'actual timezone-aware acquisition time required'
        if query:
            assert receipt.get('method')=='POST', 'search must POST exact filters'
            rawquery=receipt['query']
            actual=sorted(rawquery.items() if isinstance(rawquery,dict) else (tuple(pair) for pair in rawquery))
            assert actual==sorted(query), 'receipt query does not match selection'
        entry={'filename':filename,**{key:receipt[key] for key in ('url','sha256','bytes','fetchedAt')}}
        if query: entry.update({'method':'POST','query':query})
        manifest.append(entry)
        return body,receipt
    search='https://kunishitei.bunka.go.jp/bsys/searchlist'; labels=[c['label'] for c in definition['categories']]
    queries={}
    for c in definition['categories']:
        body,_=read(c['queryFilename'],search,[('register_sub_id','401'),('pageSize','100'),('entry_kind1_401[]',c['label'])])
        queries[c['key']]=query_ids(body.decode(),[c['label']])
        assert queries[c['key']]==c['recordIds'], 'original complete category membership changed'
    pqueries={}
    for p in prefs:
        params=[('register_sub_id','401'),('pageSize','100'),('seat_pref',p['prefName'])]+[('entry_kind1_401[]',label) for label in labels]
        body,_=read('pref-'+p['prefCode']+'.html',search,params)
        pqueries[p['prefCode']]=query_ids(body.decode(),[p['prefName']]+labels)
    for r in definition['rights']:
        body,_=read(r['filename'],r['url'])
        assert sha(plain(body.decode()).encode())==r['textSha256'], 'usage/scope terms changed; review required'
    supplements={}
    for id,geo in definition['geographyEvidence'].items():
        if geo['filename'].startswith('supplement-'):
            body,receipt=read(geo['filename'],geo['url'])
            # Supplement geography facts were reviewed against these exact primary bodies.
            assert receipt['sha256']==geo['sha256'], 'supplement body changed; recheck geography evidence'
            supplements[id]=receipt
    names={p['prefCode']:p['prefName'] for p in prefs}; rows=[]
    for id in sorted(definition['recordPrefectures'],key=int):
        url=definition['detailUrlPrefix']+id;body,receipt=read('detail-'+id+'.html',url);raw=fields(body.decode())
        kinds=[c['key'] for c in definition['categories'] if id in queries[c['key']]]
        assert set(c['label'] for c in definition['categories'] if c['key'] in kinds)==set(raw[k] for k in ('種別１','種別２') if raw[k].startswith('特別')), 'detail types disagree with original queries'
        codes=definition['recordPrefectures'][id];geo='unspecified' if not codes else 'prefecture' if len(codes)==1 else 'multi-prefecture'
        expected='地域を定めない' if not codes else names[codes[0]] if len(codes)==1 else '２県以上'
        assert raw['所在都道府県']==expected, 'raw geography changed'
        observed=sorted(code for code,ids in pqueries.items() if id in ids)
        assert observed==(codes if len(codes)==1 or id=='3088' else []), 'official county query drift'
        basis='名称・種別1/2・所在都道府県・所在地（市区町村）欄を照合。'
        if id=='3081':
            assert '青森秋田兩縣下ニ跨リ' in body.decode(), 'Towada source geography changed'
            basis+='同ページの青森・秋田両県にまたがる説明の事実から県帰属を確認。'
        evidence=[{'url':url,'sha256':receipt['sha256'],'retrievedAt':receipt['fetchedAt'],'basis':basis}]
        if id in supplements:
            g=definition['geographyEvidence'][id];r=supplements[id]
            evidence.append({k:g[k] for k in ('url','basis','pdfPage') if k in g}|{'sha256':r['sha256'],'retrievedAt':r['fetchedAt']})
        rows.append({'id':id,'name':raw['名称'],'kinds':kinds,'rawPrefecture':raw['所在都道府県'],'location':raw['所在地（市区町村）'] or None,'geography':geo,'prefectureCodes':codes,'officialUrl':url,'evidence':evidence})
    facts=[{k:r[k] for k in ('id','name','kinds','rawPrefecture','location','geography','prefectureCodes','officialUrl')} for r in rows]
    assert sha(json.dumps(facts,ensure_ascii=False,separators=(',',':')).encode())==definition['factsSha256'], 'normalized facts changed; review and repin required'
    return {'records':rows,'manifest':manifest,'checks':{'detailRecords':len(rows),'prefectureQueries':len(prefs),'categoryQueries':len(queries),'sourceBodies':len(manifest),'stableFactsSha256':definition['factsSha256'],'geographySupplements':len(supplements),'unassignedNotAllocated':sum(not r['prefectureCodes'] for r in rows)}}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--definition',required=True);parser.add_argument('--prefectures',required=True);parser.add_argument('--source-dir',required=True);parser.add_argument('--output',required=True);parser.add_argument('--download',action='store_true');args=parser.parse_args()
    definition=json.loads(Path(args.definition).read_text());prefs=json.loads(Path(args.prefectures).read_text());folder=Path(args.source_dir)
    assert len(prefs)==47
    if args.download: acquire(folder,definition,prefs)
    Path(args.output).write_text(json.dumps(extract(folder,definition,prefs),ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__': main()
