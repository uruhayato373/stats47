"""Sort display polygons spatially and pin per-part bounding boxes. Calculation artifacts unchanged."""
import argparse,json,pathlib,hashlib,math

def encode(v):return (json.dumps(v,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n').encode()
def coords(v):
 if isinstance(v[0],(int,float)):yield v
 else:
  for c in v:yield from coords(c)
def bnds(f):
 p=list(coords(f['geometry']['coordinates']));return [min(p0[0] for p0 in p),min(p0[1] for p0 in p),max(p0[0] for p0 in p),max(p0[1] for p0 in p)]
def run(root):
 proof=json.loads((root/'overlay-proof.json').read_text());maxsize=0
 for n in range(1,48):
  pref=f'{n:02}';p=root/'source'/f'{pref}.json';index=json.loads(p.read_text());features=[]
  for part in index['parts']:
   old=root/'source'/part['name'];b=old.read_bytes();assert hashlib.sha256(b).hexdigest()==part['sha256'];features.extend(json.loads(b)['features'])
  if not features:continue
  rows=[(bnds(f),f) for f in features];rows.sort(key=lambda a:(math.floor(a[0][0]*10),math.floor(a[0][1]*10),a[0]))
  chunks=[];current=[];size=0
  for b,f in rows:
   z=len(encode(f))
   if current and size+z>2000000:chunks.append(current);current=[];size=0
   current.append((b,f));size+=z
  if current:chunks.append(current)
  for part in index['parts']:(root/'source'/part['name']).unlink()
  parts=[]
  for i,c in enumerate(chunks):
   value={'type':'FeatureCollection','features':[f for _,f in c]};body=encode(value);assert len(body)<=5000000;name=f'{pref}-{i:03}.json';(root/'source'/name).write_bytes(body);bbox=[min(b[0] for b,_ in c),min(b[1] for b,_ in c),max(b[2] for b,_ in c),max(b[3] for b,_ in c)];parts.append({'name':name,'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest(),'records':len(c),'bounds':bbox});maxsize=max(maxsize,len(body))
  assert sum(x['records'] for x in parts)==len(features);index['parts']=parts;index['proof']['displayParts']=parts;p.write_bytes(encode(index));next(x for x in proof['sourceProofs'] if x['areaCode']==pref+'000')['displayParts']=parts
 proof['displayParts']=sum(len(x['displayParts']) for x in proof['sourceProofs']);proof['displayTiling']={'sort':'longitude/latitude 0.1-degree bin + exact bounds; no feature dropped','maxPartBytes':maxsize,'maxBytes':5000000};(root/'overlay-proof.json').write_bytes(encode(proof));print('PASS display tiles',proof['displayParts'],maxsize)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--work-root',type=pathlib.Path,required=True);a=p.parse_args();run(a.work_root)
