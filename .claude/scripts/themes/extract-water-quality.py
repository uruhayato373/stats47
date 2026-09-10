import xml.etree.ElementTree as E,json,pathlib,re,collections,argparse
a=argparse.ArgumentParser();a.add_argument('--bbox',required=True);a.add_argument('--out',required=True);args=a.parse_args()
ns={'h':'http://www.w3.org/1999/xhtml'};pages=E.parse(args.bbox).findall('.//h:page',ns);rows=[];anomalies=[]
thresholds={'river':dict(AA=1,A=2,B=3,C=5,D=8,E=10),'lake':dict(AA=1,A=3,B=5,C=8),'sea':dict(A=2,B=3,C=8)}
for pagei,page in enumerate(pages[1:46],2):
 kind='river' if pagei<=34 else 'lake' if pagei<=37 else 'sea'
 bounds=([70,107,237,390,414,444,480,507,540] if kind=='river' else [80,116,239,388,407,437,470,500,540] if kind=='lake' else [70,109,232,385,408,440,479,508,540])
 words=[{'text':w.text or '', 'x':float(w.attrib['xMin']),'y':float(w.attrib['yMin'])} for w in page.findall('.//h:word',ns)]
 anchors=sorted([w['y'] for w in words if bounds[6]<=w['x']<bounds[7] and w['text'] in ['○','×']]);assert anchors,pagei
 headerbottom=max(w['y'] for w in words if w['text'] in ['都道府県','水域名','類型','最大値'] and w['y']<anchors[0])+7
 pref_groups=[];pending=[]
 for w in sorted([w for w in words if bounds[0]<=w['x']<bounds[1] and w['y']>=headerbottom and re.fullmatch(r'.{2,3}[都道府県]・?',w['text'])],key=lambda w:w['y']):
  pending.append(w)
  if not w['text'].endswith('・'):
   pref_groups.append(pending);pending=[]
 assert not pending and len(pref_groups)==len(anchors),(pagei,len(pref_groups),len(anchors),pending)
 for i,y in enumerate(anchors):
  lo=(y+anchors[i-1])/2 if i else headerbottom;hi=(y+anchors[i+1])/2 if i+1<len(anchors) else y+18
  cells=[''.join(w['text'] for w in sorted([w for w in words if bounds[col]<=w['x']<bounds[col+1] and lo<=w['y']<hi and w['text'] not in ['（mg/L）','(mg/L)','判定']],key=lambda w:(w['y'],w['x']))) for col in range(8)]
  group=pref_groups[i];cells[0]=''.join(w['text'] for w in group)
  assert abs((group[0]['y']+group[-1]['y'])/2-y)<5,(pagei,y,group)
  pref,name,kana,cls,limit,value,judgment,mean=cells
  assert cls in thresholds[kind],(pagei,y,cells)
  if limit!=str(thresholds[kind][cls]):anomalies.append({'page':pagei,'cells':cells,'reason':'class-limit-mismatch'})
  assert re.fullmatch(r'<?\d+(\.\d+)?',value),(pagei,y,cells)
  assert re.fullmatch(r'<?\d+(\.\d+)?',mean),(pagei,y,cells)
  assert judgment in ['○','×'],cells
  if (float(value.lstrip('<'))<=float(limit))!=(judgment=='○'):anomalies.append({'page':pagei,'cells':cells,'reason':'value-judgment-mismatch'})
  prefs=pref.split('・');assert all(re.fullmatch(r'.{2,3}[都道府県]',v) for v in prefs),(pagei,y,cells)
  rows.append({'id':f'{kind}-p{pagei:03}-r{i+1:03}','kind':kind,'page':pagei,'y':y,'prefectures':prefs,'name':name,'kana':kana,'class':cls,'limit':float(limit),'value75':value,'judgment':judgment,'mean':mean})
assert dict(collections.Counter(r['kind'] for r in rows))=={'river':2614,'lake':198,'sea':615},'全3付表の原表掲載行数'
assert len(anomalies)==1 and anomalies[0]['cells']==['香川県','西汐入川','ニシシオイリガワ','C','8','3.7','○','3.0'],'原表の既知相違を超える異常'
pathlib.Path(args.out).write_text(json.dumps({'rows':rows,'anomalies':anomalies},ensure_ascii=False,indent=2))
