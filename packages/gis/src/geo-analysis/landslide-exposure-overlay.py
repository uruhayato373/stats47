"""A33-25 designated polygons × m250r6/PTN_2020 × P05-22.
Only deterministic spatial work. Prefecture 26 is unavailable, never zero.
6 bits: warning slope/debris/landslide, special slope/debris/landslide.
"""
import argparse,collections,hashlib,json,math,pathlib,sys,zipfile
import numpy as np
import shapely
from shapely.geometry import shape,mapping
from shapely import STRtree,union_all,make_valid
SLUG='population-landslide-exposure';VERSION='A33-25_m250r6-24_PTN2020_P05-22_center-v1';SCALE=10000
PERMISSION_SHA='5fb6cce7a63bb04c3b0e12d30aaa86106b7fd81b29468c86577f4179e550dc81'
def require(ok,m):
 if not ok:raise ValueError(m)
def sha(b):return hashlib.sha256(b).hexdigest()
def encode(v):return (json.dumps(v,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n').encode()
def write(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(encode(v))
def bounds(code):
 s=str(code);require(len(s)==10 and s.isdigit() and all(c in '01234567' for c in s[4:6]) and all(c in '1234' for c in s[8:]),'mesh code')
 south=int(s[:2])*2/3+int(s[4])/12+int(s[6])/120;west=100+int(s[2:4])+int(s[5])/8+int(s[7])/80;w,h=1/80,1/120
 for q in s[8:]:
  w/=2;h/=2;west+=((int(q)-1)%2)*w;south+=((int(q)-1)//2)*h
 require(122<=west<154 and 20<=south<46,'mesh bounds');return west,south,west+w,south+h

def polygon_only(g):
 if g.geom_type in ('Polygon','MultiPolygon'):return g
 return union_all([polygon_only(v) for v in g.geoms if v.geom_type in ('Polygon','MultiPolygon','GeometryCollection')])

def read_hazard(root,pin):
 b=(root/'raw'/pin['filename']).read_bytes();require(len(b)==pin['bytes'] and sha(b)==pin['sha256'],'A33 source pin')
 grouped=[[] for _ in range(6)];proof={'areaCode':pin['areaCode'],'dataDate':pin['dataDate'],'rawRecords':0,'polygonRecords':0,'designatedPolygonRecords':0,'preDesignationRecords':0,'lineRecords':0,'classes':{},'repairs':[],'exactDuplicateRecords':0,'specialUnassignedRecords':0,'members':[]};seen=set()
 with zipfile.ZipFile(root/'raw'/pin['filename']) as z:
  members=[n for n in z.namelist() if n.endswith('.geojson')];require(len(members)>0,'GeoJSON missing')
  for name in members:
   body=z.read(name);d=json.loads(body);require(d['type']=='FeatureCollection','feature collection');require(d.get('crs')=={'type':'name','properties':{'name':'urn:ogc:def:crs:EPSG::6668'}},'A33 CRS must be JGD2011');proof['members'].append({'name':name,'sha256':sha(body),'bytes':len(body),'records':len(d['features'])})
   for i,f in enumerate(d['features']):
    p=f['properties'];typ=p['A33_001'];zone=p['A33_002'];pref=p['A33_003'];require(typ in (1,2,3) and zone in (1,2,3,4) and pref==pin['areaCode'][:2],'A33 attribute or prefecture')
    g=shape(f['geometry']);require(not g.is_empty and np.isfinite(g.bounds).all(),'empty/nonfinite source geometry');require(-180<=g.bounds[0]<=g.bounds[2]<=180 and -90<=g.bounds[1]<=g.bounds[3]<=90,'source CRS coordinates')
    proof['rawRecords']+=1;k=f'{zone}:{typ}:{g.geom_type}';proof['classes'][k]=proof['classes'].get(k,0)+1
    identity=sha(encode(f));proof['exactDuplicateRecords']+=int(identity in seen);seen.add(identity)
    if zone in (3,4):proof['preDesignationRecords']+=1;continue
    if g.geom_type in ('LineString','MultiLineString'):
     proof['lineRecords']+=1;continue
    require(g.geom_type in ('Polygon','MultiPolygon'),'unsupported source geometry');proof['polygonRecords']+=1;proof['designatedPolygonRecords']+=1
    if p.get('A33_008')==1:proof['specialUnassignedRecords']+=1
    if not g.is_valid:
     original=g;reason=shapely.is_valid_reason(g);g=polygon_only(make_valid(g,method='linework'));require(g.is_valid and not g.is_empty,'invalid geometry repair')
     proof['repairs'].append({'member':name,'index':i,'zone':zone,'phenomenon':typ,'reason':reason,'originalWkbSha256':sha(shapely.to_wkb(original)),'originalAreaSquareDegrees':original.area,'repairedAreaSquareDegrees':g.area,'method':'GEOS make_valid linework; polygonal parts only'})
    grouped[(zone-1)*3+typ-1].append(g)
 geoms=[union_all(a) for a in grouped]
 require(all(g.is_valid for g in geoms),'union invalid')
 proof['nonEmptyGroups']=[not g.is_empty for g in geoms]
 return geoms,proof

def point_mask(polys,points):
 mask=np.zeros(len(points),dtype=np.uint8)
 for k,g in enumerate(polys):
  shapely.prepare(g);mask[shapely.covers(g,points)]|=1<<k
 return mask

def summarize(values,masks,lower,upper):
 def total(selected):return int(values[selected].sum())
 anymask=masks!=0;red=(masks&56)!=0;warning=(masks&7)!=0
 return {'totalScaled':int(values.sum()),'exclusiveScaled':[total(~anymask),total(anymask&~red),total(red)],'warningScaled':total(warning),'specialScaled':total(red),'redOutsideWarningScaled':total(red&~warning),'phenomenonScaled':[total((masks&b)!=0) for b in (9,18,36)],'warningPhenomenonScaled':[total((masks&(1<<i))!=0) for i in range(3)],'specialPhenomenonScaled':[total((masks&(1<<(i+3)))!=0) for i in range(3)],'lowerScaled':total(lower!=0),'upperScaled':total(upper!=0),'boundaryScaled':total((upper!=0)&(lower==0)),'exposedRecords':int(anymask.sum()),'records':len(values)}

def run(root,popdir,facilitydir):
 source=json.loads((root/'a33-source-manifest.json').read_text());require(source['permissions']['sha256']==PERMISSION_SHA,'permission pin');pins=source['prefectures'];require([p['areaCode'] for p in pins]==[f'{i:02}000' for i in range(1,48)],'47 source statuses');require([p['areaCode'] for p in pins if p['publication']!='allowed-with-attribution']==['26000'],'restricted scope')
 pops=json.loads((root/'population-evidence.json').read_text());allrows=[];allfac=[];ranges={};franges={};popnotes={};facnotes=[]
 for pin in pops:
  pref=pin['areaCode'][:2];b=(popdir/f'{pref}.json').read_bytes();require(sha(b)==pin['extractedSha256'],'prepared population SHA');p=json.loads(b);start=len(allrows);seen=set()
  for mesh,city,value in p['rows']:
   require(city.startswith(pref) and isinstance(value,int) and value>0 and (mesh,city) not in seen,'population identity/value');seen.add((mesh,city));allrows.append([int(mesh),int(city),value])
  ranges[pref]=(start,len(allrows));popnotes[pref]=p
  fb=(facilitydir/f'{pref}.geojson').read_bytes();f=json.loads(fb);require(f['type']=='FeatureCollection','facility collection');fstart=len(allfac)
  for i,v in enumerate(f['features']):
   a=v['properties'];require(v['geometry']['type']=='Point','facility point');city=str(a['P05_001']);kind=int(a['P05_002']);require(city.startswith(pref) and kind in (1,2,3,4,5),'facility code');x,y=v['geometry']['coordinates'][:2];require(122<x<154 and 20<y<46,'facility coordinate');allfac.append([f'P05-22:{pref}:{i}',city,kind,str(a.get('P05_003','')),x,y])
  franges[pref]=(fstart,len(allfac));facnotes.append({'areaCode':pref+'000','sha256':sha(fb),'bytes':len(fb),'records':len(f['features'])})
 require(len(allfac)==79532,'P05 source count');require(len(allrows)==1163495,'population source count')
 cellbounds=np.asarray([bounds(r[0]) for r in allrows]);points=shapely.points((cellbounds[:,0]+cellbounds[:,2])/2,(cellbounds[:,1]+cellbounds[:,3])/2);cells=shapely.box(*cellbounds.T);pointtree=STRtree(points);celltree=STRtree(cells)
 fp=shapely.points([f[4] for f in allfac],[f[5] for f in allfac]);ftree=STRtree(fp)
 masks=np.zeros(len(allrows),dtype=np.uint8);low=masks.copy();up=masks.copy();fmasks=np.zeros(len(allfac),dtype=np.uint8);cross=np.zeros(len(allrows),dtype=bool);proofs=[];sourceparts=[]
 for pin in pins:
  pref=pin['areaCode'][:2]
  if pref=='26':continue
  geoms,proof=read_hazard(root,pin);display=[]
  for k,g in enumerate(geoms):
   if g.is_empty:continue
   shapely.prepare(g);ids=pointtree.query(g);hit=ids[shapely.covers(g,points[ids])];masks[hit]|=1<<k
   ownstart,ownend=ranges[pref];cross[hit[(hit<ownstart)|(hit>=ownend)]]=True
   fi=ftree.query(g);fh=fi[shapely.covers(g,fp[fi])];fmasks[fh]|=1<<k
   ci=celltree.query(g);lo=ci[shapely.covers(g,cells[ci])];hi=ci[shapely.intersects(g,cells[ci])];low[lo]|=1<<k;up[hi]|=1<<k
   # Full unsimplified union is a reproducible intermediate; map uses a separately marked 0.00001-degree simplification.
   (root/'work/union').mkdir(parents=True,exist_ok=True);(root/'work/union'/f'{pref}-{k}.wkb').write_bytes(shapely.to_wkb(g))
   # Simplify disconnected polygons independently to avoid quadratic MultiPolygon topology checks.
   # This is display-only; both membership and sensitivity above use the unsimplified union.
   for component in (g.geoms if g.geom_type=='MultiPolygon' else [g]):
    display.append({'type':'Feature','properties':{'sourcePrefecture':pref,'mask':1<<k},'geometry':mapping(shapely.simplify(component,.00001,preserve_topology=True))})
  parts=[];chunk=[];size=0
  for f in display:
   n=len(encode(f))
   if chunk and size+n>2000000:
    name=f'{pref}-{len(parts):03}.json';body={'type':'FeatureCollection','features':chunk};write(root/'work/source'/name,body);parts.append({'name':name,'bytes':len(encode(body)),'sha256':sha(encode(body)),'records':len(chunk)});chunk=[];size=0
   chunk.append(f);size+=n
  if chunk:
   name=f'{pref}-{len(parts):03}.json';body={'type':'FeatureCollection','features':chunk};write(root/'work/source'/name,body);parts.append({'name':name,'bytes':len(encode(body)),'sha256':sha(encode(body)),'records':len(chunk)})
  proof['displayParts']=parts;proofs.append(proof);sourceparts.extend(parts);write(root/'work/source'/f'{pref}.json',{'schemaVersion':1,'slug':SLUG,'areaCode':pref+'000','displayOnly':True,'simplificationDegrees':.00001,'parts':parts,'source':pin,'proof':proof})
  print(pref,'source',proof['rawRecords'],'repairs',len(proof['repairs']),'parts',len(parts),'global matches',int((masks!=0).sum()),flush=True)
 require(bool(np.all((low&~masks)==0)) and bool(np.all((masks&~up)==0)),'point and cell bound inclusion')
 results=[]
 for pin in pins:
  pref=pin['areaCode'][:2];s,e=ranges[pref];fs,fe=franges[pref];vals=np.asarray([r[2] for r in allrows[s:e]],dtype=np.int64)
  if pref=='26':
   detail={'schemaVersion':1,'slug':SLUG,'dataVersion':VERSION,'areaCode':pin['areaCode'],'areaName':pin['areaName'],'status':'excluded-commercial-restriction','reason':'京都府 A33-25 は商用利用不可。曝露値は算出・配信対象外。','meshes':[],'facilities':[],'summary':None};write(root/'work/source'/'26.json',{'schemaVersion':1,'slug':SLUG,'areaCode':'26000','displayOnly':True,'parts':[],'source':pin,'proof':None})
  else:
   summary=summarize(vals,masks[s:e],low[s:e],up[s:e]);summary['zeroRecords']=popnotes[pref]['zeroRecords'];summary['rawRecords']=popnotes[pref]['rawRecords'];summary['crossSourcePrefectureRecords']=int(cross[s:e].sum());frows=allfac[fs:fe]
   summary['facilities']={group:summarize(np.ones(sum(f[2] in kinds for f in frows),dtype=np.int64),fmasks[fs:fe][[f[2] in kinds for f in frows]],fmasks[fs:fe][[f[2] in kinds for f in frows]],fmasks[fs:fe][[f[2] in kinds for f in frows]]) for group,kinds in [('administrative',(1,2,3)),('meeting',(4,5))]}
   detail={'schemaVersion':1,'slug':SLUG,'dataVersion':VERSION,'areaCode':pin['areaCode'],'areaName':pin['areaName'],'status':'available','populationScale':SCALE,'meshes':[r+[int(masks[i]),int(low[i]),int(up[i])] for i,r in enumerate(allrows[s:e],start=s)],'facilities':[f+[int(fmasks[i])] for i,f in enumerate(frows,start=fs)],'summary':summary}
   require(sum(summary['exclusiveScaled'])==summary['totalScaled'],'population conservation');require(summary['lowerScaled']<=sum(summary['exclusiveScaled'][1:])<=summary['upperScaled'],'sensitivity');require(summary['records']+summary['zeroRecords']==summary['rawRecords'],'mesh conservation')
  write(root/'work/pref'/f'{pref}.json',detail);require((root/'work/pref'/f'{pref}.json').stat().st_size<5000000,'pref detail > 5MB');results.append({'areaCode':pin['areaCode'],'areaName':pin['areaName'],'status':detail['status'],'summary':detail['summary']})
 proof={'status':'PASS','dataVersion':VERSION,'runtime':{'python':sys.version,'shapely':shapely.__version__,'geos':shapely.geos_version_string},'prefectures':47,'availablePrefectures':46,'excludedPrefectures':['26000'],'sourceRecords':sum(p['rawRecords'] for p in proofs),'preDesignationExcluded':sum(p['preDesignationRecords'] for p in proofs),'lineRecordsExcluded':sum(p['lineRecords'] for p in proofs),'geometryRepairs':sum(len(p['repairs']) for p in proofs),'displayParts':len(sourceparts),'populationRecordsAll47':len(allrows),'facilityRecordsAll47':len(allfac),'rows':results,'sourceProofs':proofs,'facilityInputs':facnotes}
 write(root/'work/overlay-proof.json',proof);print('PASS',len(results),proof['sourceRecords'],flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--work-root',required=True,type=pathlib.Path);p.add_argument('--population-prepared-dir',required=True,type=pathlib.Path);p.add_argument('--facility-dir',required=True,type=pathlib.Path);a=p.parse_args();run(a.work_root,a.population_prepared_dir,a.facility_dir)
