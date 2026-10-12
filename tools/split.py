import sys, os
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
for f in sorted(os.listdir(src)):
    im = Image.open(os.path.join(src, f)).convert('RGB')
    if im.width > 2300:
        L, R, H = (60, 0, 1300, 950), (1265, 0, 2480, 950), None
    else:
        L, R = (0, 0, 935, 900), (925, 0, 2149, 900)
    base = f[:-4]
    im.crop(L).save(os.path.join(out, base + 'L.png'))
    im.crop(R).save(os.path.join(out, base + 'R.png'))
