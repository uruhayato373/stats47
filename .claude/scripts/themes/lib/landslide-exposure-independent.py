"""Independent original-polygon ray casting; STRtree only narrows candidate bounding boxes.
Compare every eligible P05 point plus deterministic stratified mesh centers.
"""
import argparse,json,pathlib,zipfile,hashlib,math,sys
import numpy as np
import shapely
from shapely.geometry import shape

def ring(x,y,r):
 inside=False
 for i in range(len(r)-1):
  a,b=r[i],r[i+1];ax,ay=a[:2];bx,by=b[:2]
  cross=(x-ax)*(by-ay)-(y-ay)*(bx-ax)
  if cross==0 and min(ax,bx)<=x<=max(ax,bx) and min(ay,by)<=y<=max(ay,by):return 2
  if (ay>y)!=(by>y) and x<(bx-ax)*(y-ay)/(by-ay)+ax:inside=not inside
 return int(inside)
def polygon(x,y,coords):
 outer=ring(x,y,coords[0])
 if outer==2:return True
 if not outer:return False
 for r in coords[1:]:
  h=ring(x,y,r)
  if h==2:return True
  if h==1:return False
 return True
def covers(x,y,g):
 if g['type']=='Polygon':return polygon(x,y,g['coordinates'])
 if g['type']=='MultiPolygon':return any(polygon(x,y,p) for p in g['coordinates'])
 if g['type']=='GeometryCollection':return any(covers(x,y,p) for p in g['geometries'])
 return False
def center(code):
 s=str(code);y=int(s[:2])*2/3+int(s[4])/12+int(s[6])/120;x=100+int(s[2:4])+int(s[5])/8+int(s[7])/80;w,h=1/80,1/120
 for c in s[8:]:w/=2;h/=2;x+=(int(c)%2==0)*w;y+=(int(c)>=3)*h
 return x+w/2,y+h/2

def run(root):
 cases=[];mesh_count=0;facility_count=0;artifact_pins=[]
 for n in range(1,48):
  pref=f'{n:02}';file=root/'work/pref'/f'{pref}.json';b=file.read_bytes();artifact_pins.append({'pref':pref,'sha256':hashlib.sha256(b).hexdigest()});d=json.loads(b)
  if d['status']!='available':continue
  mesh=d['meshes'];selected=set(range(0,len(mesh),max(1,len(mesh)//100)))
  for bit in [0,1,2,4,8,16,32]:
   ids=[i for i,r in enumerate(mesh) if (r[3]==0 if bit==0 else r[3]&bit)]
   selected.update(ids[::max(1,len(ids)//30)]);selected.update(ids[:2]);selected.update(ids[-2:])
  for i in sorted(selected):
   r=mesh[i];x,y=center(r[0]);cases.append([f'mesh:{pref}:{r[1]}:{r[0]}',x,y,r[3]]);mesh_count+=1
  for f in d['facilities']:cases.append([f[0],f[4],f[5],f[6]]);facility_count+=1
 points=shapely.points([c[1] for c in cases],[c[2] for c in cases]);actual=np.zeros(len(cases),dtype=np.uint8);candidate_checks=0;source_receipts=[]
 pins=json.loads((root/'a33-source-manifest.json').read_text())['prefectures']
 for p in pins:
  if p['areaCode']=='26000':continue
  f=root/'raw'/p['filename'];b=f.read_bytes();assert hashlib.sha256(b).hexdigest()==p['sha256'];source_receipts.append({'areaCode':p['areaCode'],'sha256':p['sha256']});gs=[];raw=[];bits=[]
  with zipfile.ZipFile(f) as z:
   for name in z.namelist():
    if not name.endswith('.geojson'):continue
    for f in json.loads(z.read(name))['features']:
     a=f['properties'];g=f['geometry']
     if a['A33_002'] not in (1,2) or g['type'] not in ('Polygon','MultiPolygon'):continue
     geo=shape(g)
     if not geo.is_valid:geo=shapely.make_valid(geo);g=shapely.geometry.mapping(geo)
     gs.append(geo);raw.append(g);bits.append(1<<((a['A33_002']-1)*3+a['A33_001']-1))
  pairs=shapely.STRtree(gs).query(points)
  for pointid,featureid in pairs.T:
   bit=bits[featureid]
   if int(actual[pointid])&bit:continue
   c=cases[pointid];candidate_checks+=1
   if covers(c[1],c[2],raw[featureid]):actual[pointid]|=bit
  print(p['areaCode'],len(gs),'candidates',pairs.shape[1],flush=True)
 bad=[{'id':c[0],'x':c[1],'y':c[2],'expected':c[3],'actual':int(a)} for c,a in zip(cases,actual) if c[3]!=a]
 proof={'status':'FAIL' if bad else 'PASS','method':'original source polygon bounding boxes + independent pure Python even/odd ring ray casting (GEOS containment/union not used)','meshCenters':mesh_count,'allEligibleFacilityPoints':facility_count,'valueComparisons':len(cases),'candidateChecks':candidate_checks,'mismatches':bad,'sourceReceipts':source_receipts,'detailArtifactPins':artifact_pins,'runtime':{'python':sys.version,'shapely':shapely.__version__}}
 (root/'independent-proof.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n');assert not bad,bad[:5];print('PASS',len(cases),candidate_checks,flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--work-root',type=pathlib.Path,required=True);a=p.parse_args();run(a.work_root)
