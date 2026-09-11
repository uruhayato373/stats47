import importlib.util, unittest, tempfile, zipfile, hashlib
from pathlib import Path
spec=importlib.util.spec_from_file_location('bridge_extract',Path(__file__).with_name('extract-bridge-inspection-age.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
SOURCE={'year':'2025','bands':[
 {'key':'0-9','minDifference':0,'maxDifference':9},{'key':'10-19','minDifference':10,'maxDifference':19},
 {'key':'20-29','minDifference':20,'maxDifference':29},{'key':'30-39','minDifference':30,'maxDifference':39},
 {'key':'40-49','minDifference':40,'maxDifference':49},{'key':'50-plus','minDifference':50,'maxDifference':None},
 {'key':'unknown','minDifference':None,'maxDifference':None}], 'sources':[{'id':'mlit'}]}
class ExtractTests(unittest.TestCase):
 def test_year_difference_boundaries(self):
  for year,key in [(2025,'0-9'),(2016,'0-9'),(2015,'10-19'),(2006,'10-19'),(2005,'20-29'),(1996,'20-29'),(1995,'30-39'),(1986,'30-39'),(1985,'40-49'),(1976,'40-49'),(1975,'50-plus'),(1818,'50-plus'),(None,'unknown')]:
   with self.subTest(year=year):self.assertEqual(m.band_for(year,SOURCE),key)
 def test_unknown_is_null_not_zero(self):self.assertIsNone(m.construction_year('不明',2025))
 def test_invalid_years_rejected(self):
  for raw in ['',None,'0','0000','2026','2030','9999','平成元年','1975?','1975.0',1975]:
   with self.subTest(raw=raw):
    with self.assertRaises(ValueError):m.construction_year(raw,2025)
 def test_known_year_is_not_unknown(self):self.assertEqual(m.construction_year('1975',2025),1975)
 def test_distinct_published_rows_not_deduped(self):
  d=m.new_distribution(SOURCE)
  m.add(d,'mlit',1975,SOURCE);m.add(d,'mlit',1975,SOURCE);m.add(d,'mlit',None,SOURCE)
  result=m.finish(d)
  self.assertEqual(result['publishedCount'],3);self.assertEqual(result['knownYearCount'],2);self.assertEqual(result['unknownYearCount'],1)
  self.assertEqual(result['cohorts'],[{'constructionFiscalYear':1975,'count':2}])
 def test_conservation_rejects_unknown_drop(self):
  d=m.new_distribution(SOURCE);m.add(d,'mlit',None,SOURCE);d['unknownYearCount']=0
  with self.assertRaises(AssertionError):m.finish(d)
 def make_workbook(self,path,formula=False):
  ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
  with zipfile.ZipFile(path,'w') as z:
   z.writestr('xl/workbook.xml',f'<workbook xmlns="{ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="sample" r:id="rId1"/></sheets></workbook>')
   z.writestr('xl/_rels/workbook.xml.rels','<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>')
   z.writestr('xl/sharedStrings.xml',f'<sst xmlns="{ns}"><si><t>架設年度</t><rPh><t>ネンド</t></rPh></si><si><r><t>1975</t></r><rPh><t>セン</t></rPh></si></sst>')
   f='<f>1+1</f>' if formula else ''
   z.writestr('xl/worksheets/sheet1.xml',f'<worksheet xmlns="{ns}"><sheetData><row r="1"><c r="D1" t="s"><v>0</v></c><c r="H1" t="inlineStr"><is><t>北海道</t><rPh><t>ホッカイドウ</t></rPh></is></c></row><row r="2"><c r="D2" t="s">{f}<v>1</v></c></row></sheetData></worksheet>')
 def test_furigana_metadata_is_not_appended_to_values(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'test.xlsx';self.make_workbook(p)
   self.assertEqual(list(m.xlsx_rows(p,'sample')),[(1,{'D':'架設年度','H':'北海道'}),(2,{'D':'1975'})])
 def test_formula_values_not_silently_used(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'test.xlsx';self.make_workbook(p,True)
   with self.assertRaises(ValueError):list(m.xlsx_rows(p,'sample'))
 def test_wrong_worksheet_not_read(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'test.xlsx';self.make_workbook(p)
   with self.assertRaises(ValueError):list(m.xlsx_rows(p,'other'))
 def test_bad_sha_stops_before_rows(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'test.xlsx';p.write_bytes(b'wrong file')
   job={'sourceDir':d,'prefectures':[{'prefCode':f'{i:02d}000','prefName':str(i)} for i in range(1,48)],'source':{**SOURCE,'sources':[{'id':'mlit','file':'test.xlsx','sha256':'0'*64,'bytes':10}]}}
   with self.assertRaisesRegex(ValueError,'SHA/size'):m.run(job)
if __name__=='__main__':unittest.main(verbosity=2)
