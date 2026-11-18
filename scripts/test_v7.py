from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json
root=Path(__file__).resolve().parents[1]
site=root/'site'; base=(site/'index.html').read_text()
base=re.sub(r'<script defer src="[^"]+"></script>','',base)
base=re.sub(r'<link rel="stylesheet" href="[^"]+">','',base)
base=re.sub(r'<link[^>]+fonts.googleapis.com[^>]*>','',base)
base=re.sub(r'<link[^>]+fonts.gstatic.com[^>]*>','',base)
css=['styles.css','motion.css','immersive.css','v4-motion.css','guide.css','v6.css','v7.css']
js=['projects.js','content-extra.js','hero.js','main.js','experience.js','immersive.js','v4-motion.js','guide.js','v6.js']
def inject(page):
  errors=[];page.set_default_timeout(6000);page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(base,wait_until='domcontentloaded',timeout=15000)
  for f in css:page.add_style_tag(content=(site/f).read_text())
  for f in js:page.add_script_tag(content=(site/f).read_text())
  page.wait_for_timeout(450)
  return errors
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])
  results=[]
  for width in (320,390,768,1024,1440,1920):
    page=browser.new_page(viewport={'width':width,'height':850},device_scale_factor=1,reduced_motion='reduce')
    errors=inject(page)
    data=page.evaluate('''() => ({
      overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
      projects:document.querySelectorAll('#projectsGrid .project-card').length,
      archive:document.querySelectorAll('#archiveList .archive-row').length,
      challenges:[...document.querySelectorAll('#challengeGrid .challenge-index')].map(n=>n.textContent.trim()),
      challengeNames:[...document.querySelectorAll('#challengeGrid .challenge-card strong')].map(n=>n.textContent.trim()),
      kioWidth:Math.round(document.getElementById('kioGuide').getBoundingClientRect().width),
      kioHeight:Math.round(document.getElementById('kioGuide').getBoundingClientRect().height),
      defaultSize:document.getElementById('kioGuide').classList.contains('kio-balanced'),
      gamePrivacy:!([...(document.querySelectorAll('a[href]'))].some(n=>/dharaksh2807-svg\\/ss|subway|metro-runner\\.(com|in)/i.test(n.href)))
    })''')
    data['width']=width;data['errors']=errors
    assert data['overflow']==0,(width,data['overflow'])
    assert data['projects']==6
    assert data['archive']==6
    assert data['challenges']==['01','03','04','05'],data['challenges']
    assert data['defaultSize']==True
    assert data['gamePrivacy']==True
    if width in (390,1440):
      page.locator('#recognition').scroll_into_view_if_needed(timeout=4500)
      page.screenshot(path=str(root/'screenshots'/f'competitions-{width}.png'),timeout=4500)
      page.locator('#v6GuideToggle').click()
      assert page.locator('#kioPanel').is_visible()
      large=page.evaluate('''() => ({width:document.querySelector('.kio-shell').getBoundingClientRect().width,height:document.querySelector('.kio-shell').getBoundingClientRect().height})''')
      page.screenshot(path=str(root/'screenshots'/f'kio-balanced-{width}.png'),timeout=4500)
      page.locator('#kioSize').click()
      assert page.locator('#kioGuide.kio-compact').count()==1
      assert page.locator('#kioSize').inner_text()=='LARGER KIO'
      small=page.evaluate('''() => ({width:document.querySelector('.kio-shell').getBoundingClientRect().width,height:document.querySelector('.kio-shell').getBoundingClientRect().height})''')
      assert large['width']>small['width'],(large,small)
      page.locator('#kioSize').click()
      assert page.locator('#kioGuide.kio-balanced').count()==1
      page.locator('#kioHide').click()
      assert page.locator('#kioGuide.kio-suppressed').count()==1
      page.locator('#v6GuideToggle').click()
      assert page.locator('#kioGuide.kio-suppressed').count()==0
      data['interactions']={'balanced':large,'compact':small,'hideReopen':'passed'}
    results.append(data)
    page.close()
  browser.close()
  (root/'QA_BROWSER.json').write_text(json.dumps(results,indent=2))
  for r in results: print(json.dumps(r)[:1300])
