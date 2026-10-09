"""Read-only client for an already-running GT7 Save Lab payload."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import urllib.request

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url',required=True,help='Example: http://10.0.0.24:8097')
    parser.add_argument('--label',default='snapshot')
    parser.add_argument('--output-dir',default=str(Path(__file__).parent/'live_snapshots'))
    args=parser.parse_args()
    base=args.url.rstrip('/')
    with urllib.request.urlopen(base+'/api/info',timeout=20) as response:info=json.load(response)
    token=info.pop('token')
    request=urllib.request.Request(base+'/api/save',headers={'X-Editor-Token':token})
    with urllib.request.urlopen(request,timeout=45) as response:data=response.read(16*1024*1024+1)
    if not data or len(data)>16*1024*1024:raise ValueError('Invalid save size')
    folder=Path(args.output_dir);folder.mkdir(parents=True,exist_ok=True)
    now=datetime.now(timezone.utc)
    label=''.join(c if c.isalnum() or c in '-_' else '-' for c in args.label)[:80]
    stem=now.strftime('%Y%m%dT%H%M%S.%fZ')+'-'+label
    path=folder/(stem+'.bin')
    with path.open('xb') as stream:stream.write(data)
    metadata={'captured_utc':now.isoformat(),'label':args.label,'source':base,'payload':info,
              'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
    (folder/(stem+'.json')).write_text(json.dumps(metadata,indent=2),encoding='utf-8')
    print(json.dumps({'file':str(path),**metadata},indent=2))

if __name__=='__main__':main()
