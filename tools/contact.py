import sys, os
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
files = sorted(os.listdir(src))
W, H = 620, 240; cols = 3
for sheet in range(0, len(files), 18):
    chunk = files[sheet:sheet+18]
    rows = (len(chunk)+cols-1)//cols
    canvas = Image.new('RGB', (W*cols, (H+20)*rows), 'white')
    d = ImageDraw.Draw(canvas)
    for i, f in enumerate(chunk):
        im = Image.open(os.path.join(src, f)).convert('RGB')
        im = im.crop((0, 0, im.width, int(im.height*0.54))).resize((W-10, H))
        x, y = (i%cols)*W, (i//cols)*(H+20)
        canvas.paste(im, (x, y+20)); d.text((x+4, y+4), f, fill='red')
    canvas.save(f'{out}/sheet{sheet//18}.png')
