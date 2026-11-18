from playwright.sync_api import sync_playwright
from pathlib import Path
import json
root=Path('/mnt/data/dharaksh-portfolio-v8');shots=root/'screenshots';shots.mkdir(exist_ok=True)
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-web-security'])
 for width,height in [(1440,900),(390,844),(320,700),(768,1024),(1920,1080)]:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda err: errors.append(str(err)))
  res=page.goto('http://127.0.0.1:8765/',wait_until='domcontentloaded',timeout=25000)
  page.wait_for_timeout(950)
  hero=page.locator('#top');hero.screenshot(path=str(shots/f'hero-{width}.png'),animations='disabled') if width in [1440,390] else None
  world=page.locator('#universe');world.scroll_into_view_if_needed(timeout=9000);page.wait_for_timeout(650)
  if width in [1440,390]:page.locator('#worldCanvasWrap').screenshot(path=str(shots/f'world-{width}.png'),animations='disabled')
  state=page.evaluate('window.portfolioWorld?.state')
  page.locator('[data-world-sector="2"]').click(timeout=4500)
  after=page.evaluate('window.portfolioWorld?.state')
  over=page.evaluate('document.documentElement.scrollWidth-window.innerWidth')
  projects=page.locator('.project-card').count()
  result={'width':width,'http':res.status,'world':state,'afterWorld':after,'overflow':over,'featured':projects,'errors':errors[:3],'kio':page.evaluate('window.portfolioGuide?.state')}
  results.append(result);print('MAIN',result,flush=True)
  page.close()
 for slug in ['srmedu','kv','projectmatch','metro','oodp','fairshift','regula']:
  page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda err: errors.append(str(err)))
  res=page.goto('http://127.0.0.1:8765/projects/'+slug+'.html',wait_until='domcontentloaded',timeout=20000);page.wait_for_timeout(350)
  if slug in ['srmedu','kv','metro']:page.locator('.cp-hero').screenshot(path=str(shots/f'case-{slug}.png'),animations='disabled')
  result={'page':slug,'http':res.status,'title':page.title(),'overflow':page.evaluate('document.documentElement.scrollWidth-innerWidth'),'errors':errors[:3],'caseHeading':page.locator('h1').inner_text(),'links':page.locator('.cp-actions a').count()}
  results.append(result);print('CASE',result,flush=True)
  page.close()
 browser.close()
(root/'QA_BROWSER.json').write_text(json.dumps(results,indent=2))
