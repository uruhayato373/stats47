import importlib.util,pathlib,tempfile,zipfile,json,unittest
import numpy as np
import shapely
from shapely.geometry import Polygon,Point,box,mapping
p=pathlib.Path(__file__).parents[1]/'landslide-exposure-overlay.py';s=importlib.util.spec_from_file_location('overlay',p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class OverlayContract(unittest.TestCase):
 def test_boundary_is_closed(self):
  ps=[box(0,0,2,2)]+[Polygon()]*5
  self.assertEqual(m.point_mask(ps,shapely.points([[0,1],[1,1],[3,1]])).tolist(),[1,1,0])
 def test_hole_interior_not_exposed_but_boundary_is(self):
  p=Polygon([(0,0),(4,0),(4,4),(0,4)],holes=[[(1,1),(3,1),(3,3),(1,3)]])
  self.assertEqual(m.point_mask([p]+[Polygon()]*5,shapely.points([[2,2],[1,2],[.5,.5]])).tolist(),[0,1,1])
 def test_overlap_and_duplicate_count_once(self):
  p=box(0,0,2,2);u=shapely.union_all([p,p]);masks=m.point_mask([u,p,Polygon(),p,Polygon(),Polygon()],shapely.points([[1,1]]));s=m.summarize(np.array([101]),masks,masks,masks)
  self.assertEqual(s['totalScaled'],101);self.assertEqual(s['exclusiveScaled'],[0,0,101]);self.assertEqual(s['phenomenonScaled'],[101,101,0])
 def test_red_not_assumed_nested(self):
  masks=np.array([8],dtype=np.uint8);s=m.summarize(np.array([50]),masks,masks,masks);self.assertEqual(s['warningScaled'],0);self.assertEqual(s['specialScaled'],50);self.assertEqual(s['redOutsideWarningScaled'],50)
 def test_cross_pref_points_not_filtered_by_source_pref(self):
  self.assertEqual(m.point_mask([box(0,0,2,2)]+[Polygon()]*5,shapely.points([[1,1],[1,1]])).tolist(),[1,1])
 def test_mesh_code_quadrants(self):
  a=m.bounds('5339451211');b=m.bounds('5339451212');self.assertAlmostEqual(a[2],b[0]);self.assertAlmostEqual(a[1],b[1])
 def test_bad_mesh_rejected(self):
  for c in ['5339451200','5339451281','5339x51211','1','9999999999']:
   with self.assertRaises(ValueError):m.bounds(c)
 def test_unknown_phenomenon_and_wrong_pref_rejected(self):
  for typ,pref in [(9,'01'),(1,'02')]:
   with self.assertRaises(ValueError):self.read([self.feature(typ,1,pref)])
 def test_pre_designation_and_line_excluded(self):
  features=[self.feature(1,1,'01'),self.feature(1,3,'01'),self.feature(2,4,'01'),self.feature(2,2,'01',{'type':'LineString','coordinates':[[1,1],[2,2]]})]
  _,p=self.read(features);self.assertEqual(p['rawRecords'],4);self.assertEqual(p['preDesignationRecords'],2);self.assertEqual(p['lineRecords'],1);self.assertEqual(p['designatedPolygonRecords'],1)
 def test_source_hash_rejected(self):
  with tempfile.TemporaryDirectory() as t:
   r=pathlib.Path(t);(r/'raw').mkdir();(r/'raw/x.zip').write_bytes(b'bad')
   with self.assertRaises(ValueError):m.read_hazard(r,{'filename':'x.zip','bytes':3,'sha256':'0'*64})
 def test_zero_population_and_facility_group_conservation(self):
  masks=np.array([0,1,8,9]);s=m.summarize(np.array([0,10,20,30]),masks,masks,masks);self.assertEqual(s['totalScaled'],sum(s['exclusiveScaled']));self.assertEqual(s['records'],4)
 def feature(self,typ,zone,pref,g=None):return {'type':'Feature','geometry':g or mapping(box(1,1,2,2)),'properties':{'A33_001':typ,'A33_002':zone,'A33_003':pref,'A33_008':0}}
 def read(self,features):
  with tempfile.TemporaryDirectory() as t:
   r=pathlib.Path(t);(r/'raw').mkdir();f=r/'raw/x.zip'
   with zipfile.ZipFile(f,'w') as z:z.writestr('x.geojson',json.dumps({'type':'FeatureCollection','crs':{'type':'name','properties':{'name':'urn:ogc:def:crs:EPSG::6668'}},'features':features}))
   b=f.read_bytes();return m.read_hazard(r,{'filename':'x.zip','areaCode':'01000','dataDate':'2025','bytes':len(b),'sha256':m.sha(b)})
if __name__=='__main__':unittest.main()
