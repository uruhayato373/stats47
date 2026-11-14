import importlib.util, json, pathlib, subprocess, unittest

p = pathlib.Path(__file__).parents[1] / 'low-elevation-population-overlay.py'
s = importlib.util.spec_from_file_location('overlay', p)
m = importlib.util.module_from_spec(s)
s.loader.exec_module(m)

JS = 'node'
JS_ROUNDTRIP = "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>process.stdout.write(JSON.stringify(JSON.parse(s))+'\\n'))"


class JsKeyOrder(unittest.TestCase):
    """manifest.json は Web 側 JSON.stringify と同じバイト列でなければ、再直列化の SHA 照合から外れる。
    JS は整数風のキー(例 '10000')を昇順で先頭に並べ、それ以外は挿入順にする。Python の sorted() は '01000' を先にする。"""

    def manifest_like(self):
        # 実際の censusReference.populationByArea と同じ形 (都道府県コード + '000', sorted で '01000' が先頭)
        return {'populationByArea': {k + '000': 1 for k in sorted(['01', '09', '10', '13', '47'])}, 'a': 1}

    def test_integer_like_keys_come_first_in_ascending_order(self):
        body = m.encode(self.manifest_like()).decode()
        self.assertEqual(
            body,
            '{"populationByArea":{"10000":1,"13000":1,"47000":1,"01000":1,"09000":1},"a":1}\n',
        )

    def test_bytes_equal_js_json_stringify_of_the_parsed_value(self):
        body = m.encode(self.manifest_like())
        js = subprocess.run([JS, '-e', JS_ROUNDTRIP], input=body, capture_output=True, check=True).stdout
        self.assertEqual(body, js)

    def test_nested_and_list_dicts_are_reordered(self):
        body = m.encode({'x': [{'b': 1, '2': 1, '1': 1}]}).decode()
        self.assertEqual(body, '{"x":[{"1":1,"2":1,"b":1}]}\n')

    def test_pretty_layout_also_reordered(self):
        body = m.encode({'b': 1, '5': 1, '0': 1}, pretty=True).decode()
        self.assertEqual(body, '{\n  "0": 1,\n  "5": 1,\n  "b": 1\n}\n')

    def test_leading_zero_and_non_canonical_numbers_are_not_integer_like(self):
        body = m.encode({'b': 1, '01': 1, '-1': 1, '1.5': 1, '2': 1}).decode()
        self.assertEqual(body, '{"2":1,"b":1,"01":1,"-1":1,"1.5":1}\n')


if __name__ == '__main__':
    unittest.main()
