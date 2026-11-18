from PIL import Image,ImageDraw,ImageFont,ImageFilter
from pathlib import Path
root=Path(__file__).parent;shots=root/'screenshots'
out=Image.new('RGB',(1800,1470),(13,27,21));d=ImageDraw.Draw(out)
f='/usr/share/fonts/opentype/inter/InterDisplay-SemiBold.otf'
fm='/usr/share/fonts/opentype/inter/InterDisplay-Medium.otf'
d.text((72,48),'D/K  /  THE ENGINEERING UNIVERSE',font=ImageFont.truetype(f,30),fill=(229,234,218))
d.text((74,104),'PORTFOLIO V8  •  INTERACTIVE WORLD  •  DEDICATED CASE STUDIES',font=ImageFont.truetype(fm,17),fill=(197,149,114))

def add(src,box,label,mode="cover"):
 x,y,w,h=box;im=Image.open(shots/src).convert('RGB');iw,ih=im.size
 scale=(min if mode=="contain" else max)(w/iw,h/ih);im=im.resize((int(iw*scale),int(ih*scale)),Image.Resampling.LANCZOS)
 if mode=="contain":
  bg=Image.new('RGB',(w,h),(22,38,31));bg.paste(im,((w-im.width)//2,(h-im.height)//2));im=bg
 else:
  xx=(im.width-w)//2;yy=(im.height-h)//2;im=im.crop((xx,yy,xx+w,yy+h))
 sh=Image.new('RGBA',(w+30,h+30),(0,0,0,0));ms=Image.new('L',(w,h),0);md=ImageDraw.Draw(ms);md.rounded_rectangle((0,0,w-1,h-1),radius=14,fill=255)
 rad=Image.new('RGBA',(w,h),(0,0,0,0));rad.paste(im,(0,0),ms)
 out.paste(rad,(x,y),rad)
 d.rounded_rectangle((x,y,x+w,y+h),radius=14,outline=(98,132,105),width=2)
 d.rectangle((x+14,y+14,x+18,y+28),fill=(215,145,103));d.text((x+27,y+12),label,font=ImageFont.truetype(fm,15),fill=(224,229,215))
add('hero-1440.png',(73,170,940,525),'01 / CINEMATIC LANDING')
add('case-srmedu.png',(1045,170,683,525),'02 / TECHNICAL CASE STUDIES','contain')
add('world-1440.png',(73,734,1178,650),'03 / EXPLORABLE 3D UNIVERSE')
add('hero-390.png',(1284,734,244,650),'04 / MOBILE LAYOUT')
d.rounded_rectangle((1553,734,1728,1384),radius=14,fill=(28,48,38),outline=(98,132,105),width=2)
d.text((1570,750),'05 / WORK',font=ImageFont.truetype(fm,14),fill=(225,173,132))
d.text((1580,856),'12',font=ImageFont.truetype(f,68),fill=(229,232,211))
d.text((1580,928),'CASE',font=ImageFont.truetype(fm,24),fill=(191,208,184))
d.text((1580,965),'STUDIES',font=ImageFont.truetype(fm,24),fill=(191,208,184))
d.text((1580,1065),'3D',font=ImageFont.truetype(f,48),fill=(229,175,139))
d.text((1580,1122),'WORLD',font=ImageFont.truetype(fm,18),fill=(178,201,179))
out.save(root/'Portfolio_V8_Design_Preview.png',optimize=True)
print('preview saved',out.size)
