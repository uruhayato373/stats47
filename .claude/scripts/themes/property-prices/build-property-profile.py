"""Rebuild local profile and 4-metric observations from the SHA-fixed official CSV bundle.
No network, database, or R2 writes. Parent staging pipeline owns publication.
"""
import argparse,os,subprocess,sys,json,hashlib
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--source-dir',type=Path,required=True)
args=parser.parse_args(); source=args.source_dir.resolve();scripts=Path(__file__).resolve().parent
if not source.is_dir():parser.error('source-dir must contain the raw acquisition bundle')
env=os.environ|{'STATS47_PROPERTY_SOURCE_DIR':str(source)}
for script in ['aggregate.py','prepare-proposal.py']:
 subprocess.run([sys.executable,str(scripts/script)],env=env,check=True)
files=['property-prices.json','metric-values.json','source-manifest.json','aggregate-audit.json']
print(json.dumps({'sourceDir':str(source),'files':[{'file':f,'sha256':hashlib.sha256((source/f).read_bytes()).hexdigest()} for f in files]},ensure_ascii=False))
