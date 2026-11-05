# Site designs

Twenty full redesigns of frogscooper.dev, plus the site as it was before them. Nothing in this folder is published:
GitHub Pages builds the site with Jekyll, and Jekyll skips folders whose names start with `_`.

| # | Design | Layout | Field |
|---|--------|--------|-------|
| 00 | original | | the site as it was on 2026-11-01 |
| 01 | Moiré | top band | two line gratings, each project tilts one |
| 02 | Cyanotype | pinned left | sun-printed stems on blueprint blue |
| 03 | Star trails | full screen | stars wheeling round a pole that moves per project |
| 04 | Chladni | full screen | sand on a vibrating plate, one mode per project |
| 05 | Phyllotaxis | pinned left | a sunflower head, each project a different divergence angle |
| 06 | Riso | top band | two-ink halftone print, pink over blue |
| 07 | Phosphor | full screen | amber Lissajous figures, one frequency ratio per project |
| 08 | Glass | pinned left | Voronoi stained glass, finer per project |
| 09 | Ridgelines | top band | ridges in dusk haze, each project brings one forward |
| 10 | Filings | full screen | iron filings between magnets, poles set per project |
| 11 | Survey | mounted sheet | contour lines over a lake on a survey sheet; the water slowly rises |
| 12 | Ebru | mounted sheet | Turkish paper marbling, one traditional pattern per project |
| 13 | Loom | top band | cloth woven at the fell line, one weave draft per project |
| 14 | Pool | full screen | caustic light on pool tiles, a different depth per project |
| 15 | Aurora | full screen | aurora curtains over a ridge, one storm level (Kp) per project |
| 16 | Physarum | pinned right | the live slime mould model, fed different food per project |
| 17 | Herbarium | pinned left | a pressed L-system plant, a different species per project |
| 18 | Orrery | pinned right | two planets in resonance tracing a rose, one ratio per project |
| 19 | Zellige | top band | quasicrystal tilework, a different symmetry per project |
| 20 | Rain | full screen | rain rings on a night pond breaking up the moon's reflection |
| 21 | Bili | creator profile | banner, avatar and tabs; projects as video cards that preview on hover |
| 22 | Pond feed | creator profile | 21's layout in the original look: pond backdrop, paper and ink, frog graph |
| 23 | Silk | creator profile | latte palette: rounded cream sheets over slow caramel silk folds; tile graph |
| 24 | Umber | creator profile | latte palette: tan paper sheets over a drifting topographic map in the dark; dot graph |
| 25 | Folio | creator profile | latte palette: hairline sheets on dotted-grid paper, serif headings; the frog graph stays |

23-25 retheme the live site (22) in a latte colour scheme (foam, caramel, mocha, espresso), every
page; the designs themselves are abstract. They're generated, not copied: `python3 _designs/latte.py`
rebuilds their pages from the live ones, so rerun it after editing the site. Each design is only
its `theme.css` (over `/assets/pond.css` and the shared `latte-base.css`) and its `bg.js`
background (23 and 24 run a shader through the shared `latte-gl.js`; 25 is a still canvas). The
frog leaves the profile card and page headers in all three and stays as the favicon and on the
404; 25 also keeps it in the contribution graph.

24 Umber was the live site for part of 2026-11-05 (as `/assets/umber.css` and `umber.js`, since
removed; 28 Instrument replaced it the same day), and the live graph has drawn dots since. The
23-25 folders are the snapshot built from the pond-feed pages just before; `latte.py` refuses to
run now that those pages are gone, so edit the folders by hand.

| # | Design | Layout | Field |
|---|--------|--------|-------|
| 26 | Atlas | pinned legend | a field atlas: fixed left legend with the plate index, numbered plates with ruler edges, contours under a graticule |
| 27 | Strata | editorial beds | giant slab name over drifting rock strata, full-width tan and umber beds, projects as a numbered index |
| 28 | Instrument | dashboard | dark tiled panels with caramel hairlines on a gridded board, a segmented page switch |

26-28 are total redesigns in the live site's Umber palette and mood (deep umber, tan paper,
caramel contours, Zilla Slab). `python3 _designs/umber.py` builds them from the live Umber pages,
so rerun it after editing the site. Each is a `style.css` that lays the same markup out its own
way over `/assets/pond.css` (the only markup changes are classes on `<body>` and the profile
wrapper), plus a `bg.js` shader through `latte-gl.js`. Every demo, filter and live preview works
as on the live site.

28 Instrument is the live site since 2026-11-05 (after 24 Umber, the same day): its look is
`/assets/instrument.css` and `/assets/instrument.js` over `pond.css`, and the live pages carry
its body classes. The 26-28 folders are the snapshot built from the Umber pages; `umber.py`
refuses to run now that those are gone, so edit the folders by hand. 24 Umber's own folder still
works on its own `theme.css`.

21 and 22 are hand-written prototypes, not built by `build.py`: only the home page exists
(`21-bili/index.html`, with `assets/theme/field.js` copied from `src/`; `22-pond-feed/index.html`,
which loads the live `/frog-backdrop.js` and `/assets/contrib.js`), and their links to the other
pages assume they are served from `_designs/NN-name/`, so `switch.py` can't put them live yet.
21's banner picks one of the twenty fields by the date; `?b=riso` (any field key) picks one.

22 is the live site since 2026-11-02, built out to every page without the research shelf on home.
The served pages are now the source for it: `assets/pond.css` (shared styles), `assets/pond.js`
(the avatar frog), `assets/frog.svg` (favicon), and `scripts/nav.py` for the tabs and top-bar links.
`22-pond-feed/` is left as the prototype it started from.

Layouts: *top band* puts the image above the text; *full screen* fills the first screen with it;
*pinned left/right* keeps it in a side column that changes with the project in view (a band on
phones); *mounted sheet* fills the window with it behind the page, like a print in a mat, and it
also changes with the project in view.

Every page has the real content: home (with the Lilypad benchmarks, the once terminal replay,
the GRCH wasm demo and the slime studies), open source, research and contact. Every project gets
its own variant of the design's field. On the pinned-left designs the field follows whichever
project is on screen.

## Preview

From the repo root:

    python3 -m http.server 8765

then open http://localhost:8765/_designs/ for the gallery. Serve from the root, not from this
folder, because the designs load `/assets/...` and `/slime/...` from the live site.

## Put one live

    python3 _designs/switch.py 03        # or 03-star-trails, or star-trails
    git diff                             # check it
    git commit -am "Switch to star trails"

This overwrites `index.html`, `open-source/`, `research/`, `contact/` and adds `assets/theme/`.
`python3 _designs/switch.py original` puts the old site back.

The PR and contribution workflows keep working: every design keeps the `prs`, `prs-all` and
`prs-count` markers that `scripts/prs.py` rewrites, and reads `assets/contrib.json`.
`scripts/nav.py` doesn't apply to the designs (their nav is generated by `build.py`).

## Change a design

The design folders are generated. Edit the source, then rebuild:

    python3 _designs/build.py

- `build.py`: all page content, and each design's colours, fonts and layout (`DESIGNS`)
- `src/base.css`: the shared layout every design's `style.css` is built from
- `src/field.js`: the generative fields
- `src/site.js`: demos, slime tabs, contribution grid, pinned-field behaviour

If you edit content in the live pages after switching, also edit it in `build.py`, or the next
switch will undo it.
