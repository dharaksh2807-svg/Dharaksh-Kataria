from pathlib import Path
import re
site=Path(__file__).parent/'site'
s=(site/'index.html').read_text(encoding='utf-8')
js=[]
def add_style(m):
 f=m.group(1)
 if not f.endswith('.css'):return m.group(0)
 return f'<style data-source="{f}">\n{(site/f).read_text(encoding="utf-8")}\n</style>'
s=re.sub(r'<link\s+rel="stylesheet"\s+href="([^"]+)"\s*>',add_style,s)
def queue_script(m):
 f=m.group(1)
 if not f.endswith('.js'):return m.group(0)
 js.append(f)
 return ''
s=re.sub(r'<script\s+defer\s+src="([^"]+)"\s*></script>',queue_script,s)
# Inline local scripts at end of body in the exact original dependency order.
embedded='\n'.join(f'<script data-source="{f}">\n{(site/f).read_text(encoding="utf-8")}\n</script>' for f in js)
s=s.replace('</body>',embedded+'\n</body>')
(site/'preview-standalone.html').write_text(s,encoding='utf-8')
print('Standalone generated',len(s),'chars','embedded',len(js),'scripts')
