"""Independent original DBF/SHP and county-border checks; argument: existing private work directory."""
import sys
import struct,zipfile,json,pathlib,decimal,hashlib,importlib.util
b=pathlib.Path(sys.argv[1])
spec=importlib.util.spec_from_file_location('snow',pathlib.Path(__file__).resolve().parents[4]/'packages/gis/src/geo-analysis/snow-designation-overlay.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
proof=json.loads((b/'population-evidence.json').read_text());checks=[]
for p in proof:
 pref=p['areaCode'][:2]
 with zipfile.ZipFile(p['path']) as z:
  with z.open(f'250m_mesh_2024_{pref}.dbf') as f:
   h=f.read(32);n=struct.unpack('<I',h[4:8])[0];hl,rl=struct.unpack('<HH',h[8:12]);rest=f.read(hl-32);fields={};offset=1
   for i in range(0,len(rest)-1,32):
    fd=rest[i:i+32]
    if fd[0]==13: break
    name=fd[:11].split(b'\0')[0].decode('ascii');size=fd[16];fields[name]=(offset,size);offset+=size
   total=0;positive=0;first=[]
   for i in range(n):
    row=f.read(rl);assert len(row)==rl and row[0]==32
    start,size=fields['PTN_2020'];d=decimal.Decimal(row[start:start+size].decode('ascii').strip())*10000;assert d==int(d) and d>=0;total+=int(d);positive+=d>0
    if i<32:
     start,size=fields['MESH_ID'];first.append(row[start:start+size].decode('ascii').strip())
   assert f.read() in (b'',b'\x1a')
  maxerr=0
  with z.open(f'250m_mesh_2024_{pref}.shp') as f:
   header=f.read(100);assert struct.unpack('>I',header[:4])[0]==9994
   for code in first:
    record_header=f.read(8);size=struct.unpack('>II',record_header)[1]*2;record=f.read(size);assert struct.unpack('<I',record[:4])[0]==5
    actual=struct.unpack('<4d',record[4:36]);expected=mod.mesh_bounds(code);err=max(abs(a-e) for a,e in zip(actual,expected));maxerr=max(maxerr,err);assert err<1e-8,(pref,code,err,actual,expected)
 assert total==p['populationScaled'] and positive==p['populatedRecords'] and n==p['dbf']['records']
 checks.append({'areaCode':p['areaCode'],'rawRecords':n,'positiveRecords':positive,'populationScaled':total,'shpMeshSamples':len(first),'maxBoundErrorDegrees':maxerr})
 print(pref,total/10000,maxerr,flush=True)
(b/'independent-original-proof.json').write_text(json.dumps({'status':'PASS','method':'Independent Python Decimal/struct DBF decoder versus canonical Node DBF output; raw SHP header/bounding boxes versus MESH_ID formula','prefectures':47,'shpSamples':sum(r['shpMeshSamples'] for r in checks),'nationalPopulationScaled':sum(r['populationScaled'] for r in checks),'rows':checks},ensure_ascii=False,indent=2)+'\n')

import pathlib,zipfile,json,shapely
from shapely.geometry import shape
from shapely.ops import transform
from pyproj import Geod,Transformer
b=pathlib.Path(sys.argv[1]);g=Geod(ellps='GRS80');geoms=[];pref=[]
for file in sorted((b/'raw').glob('A22-16_*.zip')):
 with zipfile.ZipFile(file) as z:
  rows=json.loads(z.read([n for n in z.namelist() if n.endswith('.geojson')][0]))['features']
  parts=[shape(x['geometry']) for x in rows]
  parts=[shapely.make_valid(x,method='linework') if not x.is_valid else x for x in parts]
  geoms.append(shapely.union_all(parts));pref.append(file.name[7:9])
 print('union',pref[-1],flush=True)
def area(x):return abs(g.geometry_area_perimeter(shapely.orient_polygons(x))[0]) if x.geom_type in ('Polygon','MultiPolygon') else sum(area(p) for p in getattr(x,'geoms',[]) if p.geom_type in ('Polygon','MultiPolygon'))
pairs=[];tree=shapely.STRtree(geoms)
for i,a in enumerate(geoms):
 for j in tree.query(a):
  if i>=j:continue
  intersection=a.intersection(geoms[j]);ar=area(intersection)
  pairs.append({'a':pref[i],'b':pref[j],'intersectionAreaM2':ar})
  assert ar<.1,(pref[i],pref[j],ar)
total=shapely.union_all(geoms);national_area=area(total);county_sum=sum(area(a) for a in geoms)
assert abs(national_area-county_sum)<.1
p=json.loads((b/'work/overlay-proof.json').read_text());assert abs(national_area-p['national']['designatedAreaKm2']*1e6)<.1
out={'status':'PASS','method':'Independent all-class county union + national union from raw GeoJSON, exact intersection check of all bbox-neighbour pairs; GRS80 ellipsoid','countyCount':len(pref),'pairChecks':len(pairs),'nationalUnionAreaKm2':national_area/1e6,'sumCountyAreaKm2':county_sum/1e6,'unionDifferenceM2':national_area-county_sum,'maximumOverlapAreaM2':max(x['intersectionAreaM2'] for x in pairs),'pairs':pairs}
(b/'national-boundary-proof.json').write_text(json.dumps(out,indent=2)+'\n');print(out,flush=True)
