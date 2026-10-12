"""Build the static site: data/ + halves/ + web/ -> site/"""
import json, os, sys, glob, hashlib, shutil, subprocess
S = sys.argv[1]
SITE = os.path.join(S, 'site'); IMG = os.path.join(SITE, 'img')
os.makedirs(IMG, exist_ok=True)

sectors = [json.load(open(f)) for f in sorted(glob.glob(f'{S}/data/sectors/*.json'))]
info = json.load(open(f'{S}/data/info.json'))

# every half-page image referenced anywhere
pages = set()
for s in sectors:
    pages.add(s['intro'])
    pages.update(t['page'] for t in s['topos'])
    pages.update(r[6] for r in s['routes'])
for sec in info['sections']:
    pages.update(sec.get('pages', []))
pages.update(info.get('extra_pages', []))

images = []
for p in sorted(pages):
    for side in 'LR':
        name = f'{p}{side}.webp'; out = os.path.join(IMG, name)
        src = os.path.join(S, 'halves', f'{p}{side}.png')
        if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(src):
            subprocess.run(['cwebp', '-quiet', '-q', '72', '-m', '6', src, '-o', out], check=True)
        images.append('img/' + name)
for stale in set(os.listdir(IMG)) - {i[4:] for i in images}:
    os.remove(os.path.join(IMG, stale))

h = hashlib.sha256()
for i in images: h.update(i.encode()); h.update(open(os.path.join(SITE, i), 'rb').read())
img_ver = h.hexdigest()[:10]

for f in os.listdir(f'{S}/web'):
    shutil.copy(os.path.join(S, 'web', f), os.path.join(SITE, f))

data = {'sectors': sectors, 'info': info, 'images': images, 'imgCache': 'saffres-img-' + img_ver}
open(os.path.join(SITE, 'data.js'), 'w').write('window.TOPO=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')

shell = ['./', 'index.html', 'app.js', 'style.css', 'data.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']
sh = hashlib.sha256()
for f in shell[1:]: sh.update(open(os.path.join(SITE, f), 'rb').read())
sw = open(os.path.join(SITE, 'sw.js')).read()
sw = sw.replace('__SHELL_VER__', sh.hexdigest()[:10]).replace('__IMG_CACHE__', data['imgCache']).replace('__SHELL__', json.dumps(shell))
open(os.path.join(SITE, 'sw.js'), 'w').write(sw)

total = sum(os.path.getsize(os.path.join(SITE, i)) for i in images)
print(f'{len(sectors)} sectors, {sum(len(s["routes"]) for s in sectors)} routes, {len(images)} images, {total/1e6:.1f} MB images')
