#!/usr/bin/env python3
"""Patch absolute canonical and social meta URLs after user chooses the real domain."""
from pathlib import Path
import argparse,re
from urllib.parse import urlparse
root=Path(__file__).resolve().parents[1]/'site'
p=argparse.ArgumentParser(description='Prepare social metadata for a real portfolio HTTPS domain')
p.add_argument('--origin',required=True,help='e.g. https://portfolio.yourdomain.com')
a=p.parse_args();origin=a.origin.rstrip('/')
u=urlparse(origin)
if u.scheme!='https' or not u.netloc or u.path or u.query or u.fragment:raise SystemExit('Use a real HTTPS origin only, without path or query: https://your-domain.com')
files=[root/'index.html',*sorted((root/'projects').glob('*.html'))]
for f in files:
 t=f.read_text()
 current=origin+'/' if f.name=='index.html' else origin+'/projects/'+f.name
 t=re.sub(r'<link rel="canonical" href="[^"]*">','',t)
 t=t.replace('</head>',f'<link rel="canonical" href="{current}"><meta property="og:url" content="{current}"></head>')
 t=re.sub(r'(<meta (?:property="og:image"|name="twitter:image") content=")([^\"]+)(")',lambda m:m.group(1)+(origin+'/assets/og-cover.png' if f.name=='index.html' else origin+'/assets/og/'+f.stem+'.png')+m.group(3),t)
 f.write_text(t)
print('Updated',len(files),'pages for',origin)
