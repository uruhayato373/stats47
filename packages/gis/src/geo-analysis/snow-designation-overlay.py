"""A22-16 × m250r6-24/PTN_2020. Deterministic geometry only; no population apportionment."""
import argparse, hashlib, json, math, pathlib, re, sys, zipfile
import numpy as np
import shapely
from shapely.geometry import shape, mapping, GeometryCollection
from shapely.ops import transform
from shapely import union_all, make_valid, orient_polygons
from pyproj import Geod, Transformer, __version__ as pyproj_version

SLUG = 'population-snow-designation'
SCALE = 10000
GEOD = Geod(ellps='GRS80')
TO_EQUAL = Transformer.from_crs('EPSG:6668', 'EPSG:6933', always_xy=True).transform
FROM_EQUAL = Transformer.from_crs('EPSG:6933', 'EPSG:6668', always_xy=True).transform
DESIGNATED = ['01','02','03','04','05','06','07','09','10','15','16','17','18','19','20','21','22','25','26','28','31','32','33','34']

def sha(b): return hashlib.sha256(b).hexdigest()
def encode(x): return (json.dumps(x,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n').encode()
def ensure(ok, message):
    if not ok: raise ValueError(message)
def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(encode(value))
def area(g):
    if g.is_empty: return 0.0
    if g.geom_type=='GeometryCollection': return sum(area(v) for v in g.geoms if v.geom_type in ('Polygon','MultiPolygon'))
    return abs(GEOD.geometry_area_perimeter(orient_polygons(g))[0])
def mesh_bounds(code):
    ensure(re.fullmatch(r'\d{4}[0-7]{2}\d{2}[1-4]{2}',code) is not None,'quarter-mesh code')
    south=int(code[:2])*2/3 + int(code[4])/12 + int(code[6])/120
    west=100+int(code[2:4])+int(code[5])/8+int(code[7])/80
    width,height=1/80,1/120
    for q in code[8:]:
        width/=2; height/=2; quadrant=int(q)-1
        west+=(quadrant%2)*width; south+=(quadrant//2)*height
    return west,south,west+width,south+height

def classify(polygons, rows):
    """Class 0 means center outside input geometry, not proven non-designation of residents."""
    bounds=np.asarray([mesh_bounds(r[0]) for r in rows],dtype=float)
    if not len(rows): return [], {'populationScaled':[0,0,0], 'lowerScaled':[0,0], 'upperScaled':[0,0], 'boundaryScaled':[0,0], 'exactEdgeCount':0}
    points=shapely.points((bounds[:,0]+bounds[:,2])/2,(bounds[:,1]+bounds[:,3])/2)
    cells=shapely.box(bounds[:,0],bounds[:,1],bounds[:,2],bounds[:,3])
    total,special=polygons
    for g in polygons: shapely.prepare(g)
    inside=shapely.covers(total,points); in_special=shapely.covers(special,points)
    ensure(bool(np.all(~in_special | inside)),'special not nested')
    lower=[shapely.covers(g,cells) for g in polygons]
    upper=[shapely.intersects(g,cells) for g in polygons]
    ensure(all(bool(np.all(~l|i)) and bool(np.all(~i|u)) for l,i,u in zip(lower,[inside,in_special],upper)),'inclusion bound')
    exact=(inside & ~shapely.contains(total,points)) | (in_special & ~shapely.contains(special,points))
    groups=np.where(in_special,2,np.where(inside,1,0)); values=np.asarray([r[2] for r in rows],dtype=np.int64)
    # 6 bits: total lower/upper, special lower/upper, total-boundary cell, exact-center edge.
    flags=lower[0].astype(int) + upper[0].astype(int)*2 + lower[1].astype(int)*4 + upper[1].astype(int)*8 + (upper[0]&~lower[0]).astype(int)*16 + exact.astype(int)*32
    packed=[[int(r[0]),int(r[1]),int(r[2]),int(c),int(f)] for r,c,f in zip(rows,groups,flags)]
    return packed, {'populationScaled':[int(values[groups==g].sum()) for g in range(3)], 'lowerScaled':[int(values[l].sum()) for l in lower], 'upperScaled':[int(values[u].sum()) for u in upper], 'boundaryScaled':[int(values[u&~l].sum()) for l,u in zip(lower,upper)], 'exactEdgeCount':int(exact.sum())}

def snow_geometry(raw, pin, pref):
    archive=raw/pin['filename']; b=archive.read_bytes()
    ensure(len(b)==pin['bytes'] and sha(b)==pin['sha256'],'snow source pin')
    with zipfile.ZipFile(archive) as z:
        name=f'A22-16_{pref}.geojson'; ensure(z.namelist().count(name)==1,'GeoJSON member'); member=z.read(name)
    data=json.loads(member);ensure(data['type']=='FeatureCollection','GeoJSON type')
    classes={1:[],2:[]}; records=[]; repairs=[]; ids={}; raw_areas={1:0.,2:0.}; exact_duplicates=[]; seen=set()
    for i,f in enumerate(data['features']):
        p=f['properties']; area_id=p['A22_001']; kind=int(p['A22_009'])
        ensure(re.fullmatch(pref+r'\d{3}',area_id) is not None and kind in classes,'snow county/class')
        ensure(f['geometry']['type'] in ('Polygon','MultiPolygon'),'snow geometry')
        # Area IDs legitimately repeat over islands: preserve every source row and require identical attributes.
        props=encode(p);ensure(area_id not in ids or ids[area_id]==props,'conflicting area attributes');ids[area_id]=props
        g=shape(f['geometry']);ensure(not g.is_empty,'empty snow geometry'); ensure(all(math.isfinite(c) for c in g.bounds),'nonfinite geometry')
        digest=sha(shapely.to_wkb(g));identity=(area_id,digest)
        if identity in seen: exact_duplicates.append(i)
        seen.add(identity)
        if not g.is_valid:
            ensure(pref=='07' and i==76,'unapproved geometry repair')
            before=area(g);reason=shapely.is_valid_reason(g);g=make_valid(g,method='linework')
            ensure(g.is_valid and g.geom_type in ('Polygon','MultiPolygon'),'repair topology')
            repairs.append({'recordIndex':i,'areaId':area_id,'originalWkbSha256':digest,'reason':reason,'method':'GEOS make_valid linework','originalGeodesicAreaM2':before,'repairedGeodesicAreaM2':area(g),'areaDifferenceM2':area(g)-before})
        classes[kind].append(g);raw_areas[kind]+=area(g);records.append([i,area_id,p['A22_002'],kind])
    regular=union_all(classes[1]); special=union_all(classes[2]); total=union_all([regular,special])
    overlap=regular.intersection(special);regular_only=regular.difference(special)
    ensure(total.is_valid and special.is_valid and regular_only.is_valid,'union validity')
    total_area=area(total);special_area=area(special);regular_area=area(regular_only)
    ensure(abs(total_area-special_area-regular_area)<max(.05,total_area*1e-9),'geodesic area partition')
    equal_area=transform(TO_EQUAL,total).area
    ensure(abs(equal_area-total_area)<max(1.,total_area*1e-4),'independent equal-area check')
    display=[]
    for kind,g in [(1,regular_only),(2,special)]:
        if not g.is_empty:
            simplified=transform(FROM_EQUAL,transform(TO_EQUAL,g).simplify(20,preserve_topology=True))
            display.append({'type':'Feature','properties':{'class':kind},'geometry':mapping(simplified)})
    proof={'featureCount':len(records),'uniqueAreaIds':len(ids),'geojsonMember':name,'geojsonSha256':sha(member),'geojsonBytes':len(member),'repairs':repairs,'exactDuplicateSourceRows':exact_duplicates,'sumSourceAreaM2':raw_areas,'classOverlapAreaM2':area(overlap),'regularOnlyAreaM2':regular_area,'specialAreaM2':special_area,'designatedAreaM2':total_area,'equalAreaProjectionM2':equal_area,'equalAreaRelativeDifference':(equal_area-total_area)/total_area,'displaySimplificationMetres':20}
    source={'schemaVersion':1,'slug':SLUG,'areaCode':pref+'000','source':pin,'member':name,'memberSha256':sha(member),'records':records,'displayOnly':True,'displayMethod':'EPSG:6933 20m topology-preserving simplification; never used for inclusion or area','features':display,'geometryProof':proof}
    return total,special,source,proof

def run(base):
    raw=base/'raw';work=base/'work';pins=json.loads((base/'source-manifest.json').read_text());snow={p['filename'][7:9]:p for p in pins if p['filename'].endswith('.zip')}
    ensure(sorted(snow)==DESIGNATED,'24 designated source coverage')
    population=json.loads((base/'population-evidence.json').read_text());ensure([p['areaCode'][:2] for p in population]==[f'{n:02}' for n in range(1,48)],'47 population coverage')
    results=[];mesh_owners={};geometry_records=0
    for p in population:
        pref=p['areaCode'][:2];pb=(work/'population'/f'{pref}.json').read_bytes();ensure(sha(pb)==p['extractedSha256'],'population extraction pin');pop=json.loads(pb)
        ensure(pop['pref']==pref and pop['sumScaled']==p['populationScaled'],'population identity or denominator')
        if pref in snow: total,special,source,geometry=snow_geometry(raw,snow[pref],pref)
        else:
            total=special=GeometryCollection();geometry={'featureCount':0,'uniqueAreaIds':0,'regularOnlyAreaM2':0.,'specialAreaM2':0.,'designatedAreaM2':0.,'repairs':[],'classOverlapAreaM2':0.}
            source={'schemaVersion':1,'slug':SLUG,'areaCode':pref+'000','source':None,'records':[],'displayOnly':True,'features':[],'coverage':'No designated region in complete A22-16 prefecture source list','geometryProof':geometry}
        for mesh,city,value in pop['rows']:
            ensure(city.startswith(pref) and isinstance(value,int) and value>0,'population row');mesh_owners.setdefault(mesh,set()).add(pref)
        cells,counts=classify((total,special),pop['rows']);ensure(sum(counts['populationScaled'])==pop['sumScaled'],'population conservation')
        ensure(len(cells)+pop['zeroRecords']==pop['rawRecords'],'zero record conservation')
        summary={**counts,'populationTotalScaled':pop['sumScaled'],'populatedRecords':len(cells),'rawRecords':pop['rawRecords'],'zeroRecords':pop['zeroRecords'],'regularOnlyAreaKm2':geometry['regularOnlyAreaM2']/1e6,'specialAreaKm2':geometry['specialAreaM2']/1e6,'designatedAreaKm2':geometry['designatedAreaM2']/1e6}
        detail={'schemaVersion':1,'slug':SLUG,'dataVersion':'A22-16_m250r6-24_PTN2020_center-v1','areaCode':pref+'000','areaName':p['areaName'],'populationScale':SCALE,'cellColumns':['meshCode','municipalityCode','population2020Scaled','centerClass','sensitivityFlags'],'classes':['center-outside-input-polygon','regular-only','special-heavy-snow'],'flagBits':{'totalLower':1,'totalUpper':2,'specialLower':4,'specialUpper':8,'totalBoundaryCell':16,'centerOnEdge':32},'meshes':cells,'summary':summary}
        write(work/'derived'/f'{pref}.json',detail);write(work/'source'/f'{pref}.json',source)
        ensure((work/'derived'/f'{pref}.json').stat().st_size<=5_000_000,'county artifact >5MB');ensure((work/'source'/f'{pref}.json').stat().st_size<=5_000_000,'display source artifact >5MB')
        results.append({'areaCode':pref+'000','areaName':p['areaName'],'summary':summary,'geometry':geometry});geometry_records+=geometry['featureCount']
        print(pref,len(cells),sum(counts['populationScaled'][1:])/SCALE,summary['designatedAreaKm2'],flush=True)
    population_scaled=[sum(r['summary']['populationScaled'][i] for r in results) for i in range(3)]
    national={'populationScaled':population_scaled,'populationTotalScaled':sum(p['populationScaled'] for p in population),'designatedAreaKm2':sum(r['summary']['designatedAreaKm2'] for r in results),'specialAreaKm2':sum(r['summary']['specialAreaKm2'] for r in results),'lowerScaled':[sum(r['summary']['lowerScaled'][i] for r in results) for i in range(2)],'upperScaled':[sum(r['summary']['upperScaled'][i] for r in results) for i in range(2)],'boundaryScaled':[sum(r['summary']['boundaryScaled'][i] for r in results) for i in range(2)],'exactEdgeCount':sum(r['summary']['exactEdgeCount'] for r in results)}
    ensure(sum(population_scaled)==national['populationTotalScaled'],'national conservation')
    proof={'status':'PASS','definitionVersion':'A22-16_m250r6-24_PTN2020_center-v1','runtime':{'python':sys.version,'shapely':shapely.__version__,'geos':shapely.geos_version_string,'pyproj':pyproj_version},'prefectureCount':47,'designatedPrefectureCount':24,'nonDesignatedPrefectureCount':23,'geometryRecords':geometry_records,'populatedRecords':sum(p['populatedRecords'] for p in population),'uniqueMeshCodes':len(mesh_owners),'crossPrefectureMeshCodes':sum(len(o)>1 for o in mesh_owners.values()),'national':national,'rows':results,'conservationChecks':47*4+3,'maxDetailBytes':max((work/'derived'/f'{n:02}.json').stat().st_size for n in range(1,48))}
    write(work/'overlay-proof.json',proof);return proof
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--work-root',type=pathlib.Path,required=True);args=parser.parse_args();run(args.work_root)
