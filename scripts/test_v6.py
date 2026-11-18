from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json
site=Path(__file__).resolve().parents[1]/'site'
base=(site/'index.html').read_text()
base=re.sub(r'<script defer src="[^"]+"></script>','',base)
base=re.sub(r'<link rel="stylesheet" href="[^"]+">','',base)
base=re.sub(r'<link[^>]+fonts.googleapis.com[^>]*>','',base)
base=re.sub(r'<link[^>]+fonts.gstatic.com[^>]*>','',base)
css=['styles.css','motion.css','immersive.css','v4-motion.css','guide.css','v6.css']
js=['projects.js','content-extra.js','hero.js','main.js','experience.js','immersive.js','v4-motion.js','guide.js','v6.js']

def inject(page):
  page.set_default_timeout(6000)
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(base,wait_until='domcontentloaded',timeout=10000)
  for f in css:page.add_style_tag(content=(site/f).read_text())
  for f in js:page.add_script_tag(content=(site/f).read_text())
  page.wait_for_timeout(1400)
  return errors

def safe(page,exp):return page.evaluate(exp)
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])
  allresults=[]
  for width in [320,390,768,1024,1440,1920]:
    page=browser.new_page(viewport={'width':width,'height':850},device_scale_factor=1,reduced_motion='reduce')
    errors=inject(page)
    x={'width':width,'errors':errors,'overflow':safe(page,'Math.max(0,document.documentElement.scrollWidth-innerWidth)'),
      'projectCount':page.locator('#projectsGrid .project-card').count(),
      'archiveCount':page.locator('#archiveList .archive-row').count(),
      'kioState':safe(page,'window.portfolioGuide?.state'),
      'proofState':safe(page,'window.portfolioProof?.state'),
      'bodyHeight':safe(page,'document.body.scrollHeight')}
    if width in (390,1440):
      page.screenshot(path=str(site.parent/'screenshots'/f'hero-{width}.png'),timeout=7000)
      page.locator('#proofFrame').scroll_into_view_if_needed(timeout=5000)
      page.locator('#proofFrame').screenshot(path=str(site.parent/'screenshots'/f'proof-study-{width}.png'),timeout=7000)
    if width==1440:
      page.locator('#proofTabMatch').click(timeout=5000)
      before=safe(page,'window.portfolioProof?.state')
      page.locator('#proofFactor0').fill('100')
      after=safe(page,'window.portfolioProof?.state')
      page.locator('#proofFrame').screenshot(path=str(site.parent/'screenshots'/'proof-match-1440.png'),timeout=7000)
      page.locator('#proofTabKv').click()
      page.locator('[data-budget="516"]').click()
      kv=safe(page,'window.portfolioProof?.state')
      page.locator('#proofFrame').screenshot(path=str(site.parent/'screenshots'/'proof-kv-1440.png'),timeout=7000)
      page.locator('#v6GuideToggle').click()
      kioShown=safe(page,'window.portfolioGuide?.state')
      page.locator('#kioHide').click()
      kioHidden=safe(page,'window.portfolioGuide?.state')
      page.locator('#v6GuideToggle').click()
      reopened=safe(page,'window.portfolioGuide?.state')
      # The header show/hide button is not a cross-window localStorage verification: about:blank has opaque origin.
      page.locator('.project-case-open').first.click()
      opened=safe(page,"document.querySelector('#caseOverlay').hidden===false")
      sharer=page.locator('.case-share-action').count()
      x['interactions']={'scoreBefore':before,'scoreAfter':after,'kv':kv,'kioShown':kioShown,'kioHidden':kioHidden,'kioReopened':reopened,'caseOpen':opened,'caseShare':sharer}
    allresults.append(x)
    page.close()
  browser.close()
  (site.parent/'QA_BROWSER.json').write_text(json.dumps(allresults,indent=2))
  for r in allresults:print(json.dumps(r,ensure_ascii=False)[:2000])
