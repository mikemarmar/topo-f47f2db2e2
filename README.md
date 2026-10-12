Source for the Saffres topo site (the `main` branch is the built site served by GitHub Pages).

- `data/sectors/*.json`: one file per sector. Each route is `[number, name, English gloss, grade, height, description, book page]`.
- `data/info.json`: info pages (access, intro, safety, glossary, history, geology, nature, tourism).
- `web/`: app shell (index.html, app.js, style.css, sw.js).
- `tools/build.py <workdir>`: builds `<workdir>/site` from `data/`, `web/` and `halves/*.png`. To edit only text, copy the existing `img/` from `main` into `site/img` first so the images are not regenerated.
