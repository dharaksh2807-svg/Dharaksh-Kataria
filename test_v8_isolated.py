from playwright.sync_api import sync_playwright
from pathlib import Path
import re,json
root=Path(__file__).parent;site=root/'site'; shots=root/'screenshots';shots.mkdir(exist_ok=True)
css=['styles.css','motion.css','immersive.css','v4-motion.css','guide.css','v6.css','v7.css','v8.css']
js=['projects.js','content-extra.js','hero.js','main.js','experience.js','immersive.js','v4-motion.js','guide.js','v6.js','world.js','v8.js']
base=(site/'index.html').read_text()
base=re.sub(r'<script defer src="[^"]+"></script>','',base)
base=re.sub(r'<link rel="stylesheet" href="[^"]+">','',base)
base=re.sub(r'<link[^>]+fonts.googleapis.com[^>]*>','',base)
base=re.sub(r'<link[^>]+fonts.gstatic.com[^>]*>','',base)
results=[]
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--no-proxy-server'])
  for width,height in [(1440,900),(390,844),(320,700),(768,1024),(1920,1080)]:
    page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1,reduced_motion='reduce')
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(base,wait_until='domcontentloaded',timeout=12000)
    for f in css:page.add_style_tag(content=(site/f).read_text())
    for f in js:page.add_script_tag(content=(site/f).read_text())
    page.wait_for_timeout(500)
    if width in (1440,390):
      page.locator('#top').screenshot(path=str(shots/f'hero-{width}.png'),animations='disabled',timeout=8000)
      page.locator('#worldCanvasWrap').scroll_into_view_if_needed();page.wait_for_timeout(250)
      page.locator('#worldShell').screenshot(path=str(shots/f'world-{width}.png'),animations='disabled',timeout=8000)
    state=page.evaluate('window.portfolioWorld?.state')
    page.evaluate('window.portfolioWorld?.focus(2)')
    after=page.evaluate('window.portfolioWorld?.state')
    result={'width':width,'overflow':page.evaluate('Math.max(0,document.documentElement.scrollWidth-innerWidth)'),'featured':page.locator('#projectsGrid .project-card').count(),'archive':page.locator('#archiveList .archive-row').count(),'worldBefore':state,'worldAfter':after,'errors':errors[:8],'kio':page.evaluate('window.portfolioGuide?.state'),'competition':page.locator('#challengeGrid .challenge-index').all_text_contents(),'worldMarkers':page.locator('.world-marker').count(),'metroSourcePresent':page.evaluate('Array.from(document.querySelectorAll("a[href]")).some(a=>a.href.includes("dharaksh2807-svg/ss"))')}
    results.append(result);print('MAIN',result,flush=True);page.close()
  for slug in ['srmedu','kv','projectmatch','metro','oodp','fairshift','regula']:
    page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1,reduced_motion='reduce')
    errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
    src=(site/'projects'/f'{slug}.html').read_text();src=re.sub(r'<script defer src="[^"]+">\s*</script>','',src);src=re.sub(r'<link rel="stylesheet" href="[^"]+">','',src)
    src=re.sub(r'<link[^>]+fonts.googleapis.com[^>]*>','',src);src=re.sub(r'<link[^>]+fonts.gstatic.com[^>]*>','',src)
    page.set_content(src,wait_until='domcontentloaded',timeout=12000)
    page.add_style_tag(content=(site/'case.css').read_text());page.add_script_tag(content=(site/'case.js').read_text());page.wait_for_timeout(190)
    if slug in ('srmedu','kv','metro'):page.locator('.cp-hero').screenshot(path=str(shots/f'case-{slug}.png'),animations='disabled')
    result={'slug':slug,'overflow':page.evaluate('Math.max(0,document.documentElement.scrollWidth-innerWidth)'),'errors':errs[:8],'title':page.locator('h1').inner_text(),'realPreview':page.locator('#cpLoadPreview').count(),'privateLink':page.evaluate('Array.from(document.querySelectorAll("a[href]")).some(a=>a.href.includes("dharaksh2807-svg/ss"))')}
    results.append(result);print('CASE',result,flush=True);page.close()
  browser.close()
(root/'QA_BROWSER.json').write_text(json.dumps(results,indent=2))
