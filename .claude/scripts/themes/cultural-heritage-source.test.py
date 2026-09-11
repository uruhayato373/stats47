"""No network, local observations or external Python packages required."""
import importlib.util, unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('heritage_source',Path(__file__).with_name('cultural-heritage-source.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def result(label='特別史跡',count=2,ids=('7','00003445')):
    return '<div>検索条件：'+label+'</div><p>'+str(count)+' 件中</p>'+''.join('<a href="/heritage/detail/401/'+id+'">名</a>' for id in ids)
class OfficialSourceTests(unittest.TestCase):
    def test_preserves_original_ids_and_verifies_entire_query(self):
        self.assertEqual(m.query_ids(result(),['特別史跡']),['7','00003445'])
    def test_rejects_truncated_pagination(self):
        with self.assertRaises(AssertionError):m.query_ids(result(count=66),['特別史跡'])
    def test_rejects_ignored_filter(self):
        with self.assertRaises(AssertionError):m.query_ids(result(label='全て'),['特別史跡'])
    def test_rejects_unknown_empty_response(self):
        with self.assertRaises(AssertionError):m.query_ids('<div>検索条件：特別史跡</div>', ['特別史跡'])
    def test_accepts_official_explicit_empty_response(self):
        self.assertEqual(m.query_ids('<div>検索条件：特別史跡</div>データがありません', ['特別史跡']),[])
    def test_detail_rejects_duplicate_field_labels(self):
        row='<tr><td>名称</td><td>：</td><td>合成資料</td></tr>'
        with self.assertRaises(AssertionError):m.fields('<table>'+row+row+'</table>')
    def test_facts_keep_linebreaks_without_publishing_markup(self):
        self.assertEqual(m.fields('<table><tr><td>所在地（市区町村）</td><td>：</td><td>合成市<br>合成町</td></tr></table>'), {'所在地（市区町村）':'合成市\n合成町'})
    def test_rights_text_hash_ignores_dynamic_scripts_but_not_changed_terms(self):
        one='<div>出典を記載</div><script>nonce=1</script>';two='<div>出典を記載</div><script>nonce=2</script>'
        self.assertEqual(m.plain(one),m.plain(two));self.assertNotEqual(m.plain(one),m.plain(one.replace('出典','利用料')))
if __name__=='__main__': unittest.main()
