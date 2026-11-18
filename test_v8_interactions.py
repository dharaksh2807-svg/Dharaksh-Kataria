from pathlib import Path
from playwright.sync_api import sync_playwright
import re,json
root=Path(__file__).parent;site=root/'site';base=(site/'index.html').read_text();base=re.sub(r'<script defer src="[^"]+"></script>','',base);base=re.sub(r'<link rel="stylesheet" href="[^"]+">','',base);base=re.sub(r'<link[^>]+fonts.googleapis.com[^>]*>','',base);base=re.sub(r'<link[^>]+fonts.gstatic.com[^>]*>','',base)
css=['styles.css','motion.css','immersive.css','v4-motion.css','guide.css','v6.css','v7.css','v8.css'];js=['projects.js','content-extra.js','hero.js','main.js','experience.js','immersive.js','v4-motion.js','guide.js','v6.js','world.js','v8.js'];out={}
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])
 page=b.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce')
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(base,wait_until='domcontentloaded');[page.add_style_tag(content=(site/f).read_text()) for f in css];[page.add_script_tag(content=(site/f).read_text()) for f in js]
 page.wait_for_timeout(200)
 page.locator('#v6GuideToggle').click();out['guideOpen']=page.locator('#kioPanel').is_visible();out['kioWidth']=page.evaluate('Math.round(document.getElementById("kioGuide").getBoundingClientRect().width)')
 page.locator('[data-kio-jump="universe"]').click();out['guideWorldStep']=page.evaluate('window.portfolioGuide?.state.step')
 page.locator('#kioClose').click();page.locator('#worldSound').click();out['audioToggle']=page.locator('#worldSound').get_attribute('aria-pressed');page.locator('#worldSound').click()
 page.locator('#worldReset').click();page.locator('[data-world-sector="3"]').click();out['metroDistrict']=page.evaluate('window.portfolioWorld?.state.label');out['metroURL']=page.locator('#worldInspectorLink').get_attribute('href')
 out['featuredPageButtons']=page.locator('#projectsGrid .project-case-open').count()
 out['casePageRouteCount']=len(list((site/'projects').glob('*.html')))
 out['errors']=errors
 b.close()
 print(json.dumps(out,indent=2))
 (root/'QA_INTERACTIONS.json').write_text(json.dumps(out,indent=2))
