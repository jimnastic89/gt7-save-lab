"""Render the simple code-designed launcher icon. Requires Pillow only at build time."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parent
image=Image.new('RGB',(512,512),'#101719');draw=ImageDraw.Draw(image)
draw.rounded_rectangle((28,28,484,484),radius=42,fill='#192326',outline='#90dfbe',width=3)
font_candidates=[Path('C:/Windows/Fonts/arialbd.ttf'),Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')]
font=next(p for p in font_candidates if p.exists())
draw.line((96,111,416,111),fill='#90dfbe',width=5);draw.line((96,123,322,123),fill='#90dfbe',width=5)
draw.text((75,145),'GT7',font=ImageFont.truetype(str(font),138),fill='#e7efec')
draw.text((83,301),'SAVE LAB',font=ImageFont.truetype(str(font),43),fill='#90dfbe')
for x in (85,164,243):draw.line((x,402,x+61,402),fill='#ffcb83',width=12)
image.save(root/'icon0.png')
