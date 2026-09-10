import copy,json,statistics,unittest
from collections import defaultdict
import aggregate as a
class AggregateTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.profile=json.loads((a.BASE/'property-prices.json').read_text())
  cls.row={'価格情報区分':'不動産取引価格情報','種類':'宅地(土地)','市区町村コード':'13101','都道府県名':'東京都','取引時期':'2025年第1四半期','地域':'住宅地','面積（㎡）':'150','取引価格（㎡単価）':'100000'}
 def test_median_and_quartiles_known_interpolation(self):
  self.assertEqual([a.quantile([10,20,30,40],p) for p in [.25,.5,.75]],[17.5,25,32.5])
 def test_empty_and_singleton_are_distinct(self):
  self.assertEqual(a.stats([]),{'count':0,'status':'no-data','q1':None,'median':None,'q3':None});self.assertEqual(a.stats([17])['median'],17);self.assertEqual(a.stats([17])['status'],'small-sample')
 def test_price_classification_contamination_stops(self):
  with self.assertRaisesRegex(ValueError,'classification'):a.transaction_row(self.row|{'価格情報区分':'成約価格情報'},'13')
 def test_wrong_property_type_stops(self):
  with self.assertRaisesRegex(ValueError,'property type'):a.transaction_row(self.row|{'種類':'宅地(土地と建物)'},'13')
 def test_wrong_prefecture_stops(self):
  with self.assertRaisesRegex(ValueError,'prefecture'):a.transaction_row(self.row|{'市区町村コード':'01101'},'13')
 def test_wrong_period_stops(self):
  with self.assertRaisesRegex(ValueError,'period'):a.transaction_row(self.row|{'取引時期':'2026年第1四半期'},'13')
 def test_area_bounds_are_inclusive_exclusive(self):
  self.assertIsNotNone(a.transaction_row(self.row|{'面積（㎡）':'100'},'13')[0]);self.assertEqual(a.transaction_row(self.row|{'面積（㎡）':'300'},'13')[1],'outside-area-band')
 def test_censored_area_not_parsed_as_2000(self):
  self.assertEqual(a.transaction_row(self.row|{'面積（㎡）':'2,000㎡以上'},'13')[1],'area-censored')
 def test_missing_and_zero_and_censored_prices_distinct(self):
  for value,reason in [('', 'unit-price-missing'),('0','unit-price-nonpositive'),('100以上','unit-price-censored'),('NaN','unit-price-invalid')]:self.assertEqual(a.transaction_row(self.row|{'取引価格（㎡単価）':value},'13')[1],reason)
 def test_official_other_use_is_not_residential(self):
  row={'年度':'2025','行政区域コード':'13101','番号用途区分':'005','地積':'150','価格R07':'100000'}
  self.assertEqual(a.official_row(row)[1],'other-use')
 def test_official_wrong_reference_year_rejected(self):
  with self.assertRaisesRegex(ValueError,'year'):a.official_row({'年度':'2024'})
 def test_official_area_band_matches_transaction_band(self):
  row={'年度':'2025','行政区域コード':'13101','番号用途区分':'000','地積':'100','価格R07':'100000'}
  self.assertEqual(a.official_row(row)[0]['areaM2'],100);self.assertEqual(a.official_row(row|{'地積':'300'})[1],'outside-area-band')
 def test_source_row_is_not_deduplicated(self):
  one=a.transaction_row(self.row,'13')[0]['value'];self.assertEqual(a.stats([one,one])['count'],2)
 def test_missing_prefecture_download_rejected(self):
  data=json.loads((a.BASE/'prefecture-downloads.json').read_text())[:-1]
  with self.assertRaisesRegex(ValueError,'47 unique'):a.assert_manifest(data)
 def test_wrong_source_hash_rejected(self):
  data=json.loads((a.BASE/'prefecture-downloads.json').read_text());data[0]['sha256']='0'*64
  with self.assertRaisesRegex(ValueError,'hash mismatch'):a.assert_manifest(data)
 def test_duplicate_raw_file_rejected(self):
  data=json.loads((a.BASE/'prefecture-downloads.json').read_text());data[1]['path']=data[0]['path'];data[1]['sha256']=data[0]['sha256']
  with self.assertRaisesRegex(ValueError,'duplicated input'):a.assert_manifest(data)
 def test_denominator_conservation(self):
  p=copy.deepcopy(self.profile);p['areas'][0]['transactions']['rawCount']+=1
  with self.assertRaisesRegex(ValueError,'conservation'):a.validate_profile(p)
 def test_all_96_distributions_match_standard_library(self):
  grouped=defaultdict(list)
  for r in json.loads((a.BASE/'normalized-values.json').read_text()):grouped[(r['areaCode'],r['dataset'])].append(r['value'])
  for area in self.profile['areas']:
   for kind in ['transactions','officialLandPrice']:
    vals=grouped[area['areaCode'],kind];qs=statistics.quantiles(vals,n=4,method='inclusive');d=area[kind]
    self.assertEqual(d['median'],statistics.median(vals));self.assertEqual(d['q1'],qs[0]);self.assertEqual(d['q3'],qs[2])
  for kind in ['transactions','officialLandPrice']:
   vals=[v for (area,ds),vs in grouped.items() if ds==kind for v in vs];qs=statistics.quantiles(vals,n=4,method='inclusive');d=self.profile['national'][kind]
   self.assertEqual(d['median'],statistics.median(vals));self.assertEqual(d['q1'],qs[0]);self.assertEqual(d['q3'],qs[2])
if __name__=='__main__':unittest.main(verbosity=2)
