import importlib.util, pathlib, unittest
from shapely.geometry import box, Polygon, GeometryCollection
P=pathlib.Path(__file__).resolve().parents[1]/'snow-designation-overlay.py'
spec=importlib.util.spec_from_file_location('snow',P);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class SnowGeometryTests(unittest.TestCase):
 def setUp(self):
  self.code='5339452511';self.b=m.mesh_bounds(self.code);self.cell=box(*self.b);self.x=(self.b[0]+self.b[2])/2;self.y=(self.b[1]+self.b[3])/2;self.rows=[[self.code,'13101',12500]]
 def test_grid_quadrants_and_invalid_code(self):
  self.assertAlmostEqual(self.b[2]-self.b[0],1/320)
  self.assertAlmostEqual(self.b[3]-self.b[1],1/480)
  for code in ['53394525','5339852511','5339452501','not-a-mesh']:
   with self.assertRaises(ValueError):m.mesh_bounds(code)
 def test_complete_cell_conserves_integer_population(self):
  packed,p=m.classify((self.cell,GeometryCollection()),self.rows)
  self.assertEqual(p['populationScaled'],[0,12500,0]);self.assertEqual(p['lowerScaled'],[12500,0]);self.assertEqual(p['upperScaled'],[12500,0]);self.assertEqual(packed[0][4],3)
 def test_special_is_subset_and_has_priority(self):
  packed,p=m.classify((self.cell,self.cell),self.rows)
  self.assertEqual(p['populationScaled'],[0,0,12500]);self.assertEqual(packed[0][3],2)
 def test_hole_does_not_count_center_as_exposed(self):
  hole=box(self.x-.0001,self.y-.0001,self.x+.0001,self.y+.0001)
  g=Polygon(self.cell.exterior.coords,[hole.exterior.coords]);packed,p=m.classify((g,GeometryCollection()),self.rows)
  self.assertEqual(p['populationScaled'],[12500,0,0]);self.assertEqual(p['boundaryScaled'],[12500,0]);self.assertEqual(p['lowerScaled'],[0,0]);self.assertEqual(p['upperScaled'],[12500,0])
 def test_center_on_boundary_is_included_and_flagged(self):
  g=box(self.x,self.b[1],self.b[2],self.b[3]);packed,p=m.classify((g,GeometryCollection()),self.rows)
  self.assertEqual(p['populationScaled'],[0,12500,0]);self.assertEqual(p['exactEdgeCount'],1);self.assertTrue(packed[0][4]&32)
 def test_no_designation_is_observed_zero_not_missing(self):
  packed,p=m.classify((GeometryCollection(),GeometryCollection()),self.rows)
  self.assertEqual(p['populationScaled'],[12500,0,0]);self.assertEqual(p['upperScaled'],[0,0]);self.assertEqual(packed[0][4],0)
 def test_population_not_apportioned_by_polygon_area(self):
  g=box(self.b[0],self.b[1],self.x+.0000001,self.b[3]);_,p=m.classify((g,GeometryCollection()),self.rows)
  self.assertEqual(p['populationScaled'][1],12500)
 def test_different_prefecture_owners_share_grid_without_deduplication(self):
  for city,pop in [('13101',12500),('14101',5000)]:
   _,p=m.classify((self.cell,GeometryCollection()),[[self.code,city,pop]])
   self.assertEqual(sum(p['populationScaled']),pop)
 def test_non_nested_special_rejected(self):
  with self.assertRaises(ValueError):m.classify((GeometryCollection(),self.cell),self.rows)
 def test_area_partition_and_hole(self):
  hole=box(self.x-.0001,self.y-.0001,self.x+.0001,self.y+.0001);g=self.cell.difference(hole)
  self.assertAlmostEqual(m.area(g)+m.area(hole),m.area(self.cell),delta=.005)
if __name__=='__main__':unittest.main()
