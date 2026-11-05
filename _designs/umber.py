# Builds the Umber-vibe redesigns (26 Atlas, 27 Strata, 28 Instrument) from the live pages:
#   python3 _designs/umber.py
# The live site is 24 Umber (assets/pond.css + assets/umber.css + assets/umber.js). Each design here
# swaps umber.css/umber.js for its own style.css and bg.js and lays the same markup out a whole new
# way, so content, links and every demo stay exactly the live ones: rerun this after editing a
# live page. Hand-edit only NN-name/style.css and NN-name/bg.js; the .html files are output.
#
# Markup changes, the same for all three (the rest is CSS):
#   - <body> gets the design and page as classes (d-atlas page-home, ...)
#   - the wrapper around the profile sheet gets class "top"
#   - nav links stay inside the design folder, so the whole site can be clicked through
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.join(ROOT, '_designs')
PAGES = {'index.html': 'home', 'open-source/index.html': 'os', 'research/index.html': 'research',
         'contact/index.html': 'contact', '404.html': '404'}
DESIGNS = {
    '26-atlas': dict(cls='atlas', color='#1c120c',
                     fonts='family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Zilla+Slab:wght@500;600;700'),
    '27-strata': dict(cls='strata', color='#1c120c',
                      fonts='family=Inter+Tight:wght@400;500;600&family=Zilla+Slab:wght@500;700'),
    '28-instrument': dict(cls='instrument', color='#17100b',
                          fonts='family=IBM+Plex+Sans:wght@400;500;600&family=Zilla+Slab:wght@500;700'),
}


def sub(s, pat, rep, want, what, flags=0):
    s2, n = re.subn(pat, rep, s, flags=flags)
    assert n == want, f'{what}: expected {want} change(s), got {n}'
    return s2


def build(name, d):
    base = f'/_designs/{name}/'
    for page, kind in PAGES.items():
        s = open(os.path.join(ROOT, page), encoding='utf-8').read()
        what = f'{name} {page}'
        # styles: the live base sheet, then this design (Umber's own sheet and font come out)
        s = sub(s, r'\n  <link rel="stylesheet" href="https://fonts\.googleapis\.com/css2\?family=Zilla\+Slab[^"]*">', '', 1, what + ' umber font')
        s = sub(s, r'<link rel="stylesheet" href="/assets/umber\.css[^"]*">',
                lambda m: '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?' + d['fonts'].replace('&', '&amp;') + '&amp;display=swap">'
                + '\n  <link rel="stylesheet" href="/_designs/latte-base.css">'
                + f'\n  <link rel="stylesheet" href="{base}style.css">', 1, what + ' css')
        s = sub(s, r'<meta name="theme-color" content="[^"]*">', f'<meta name="theme-color" content="{d["color"]}">', 1, what + ' theme-color')
        s = sub(s, r'(<meta charset="utf-8">)', r'\1\n  <meta name="robots" content="noindex">', 1, what + ' noindex')
        s = sub(s, r'<script src="/assets/umber\.js[^"]*" defer></script>',
                lambda m: f'<script src="/_designs/latte-gl.js" defer></script>\n  <script src="{base}bg.js" defer></script>', 1, what + ' background')
        s = sub(s, r'<body>', f'<body class="d-{d["cls"]} page-{kind}">', 1, what + ' body')
        s = sub(s, r'<div class="wrap">(\s*<section class="profile)', r'<div class="wrap top">\1', 1, what + ' top')
        s = re.sub(r'href="/(|open-source/|research/|contact/|#projects)"', lambda m: f'href="{base}{m.group(1)}"', s)
        out = os.path.join(HERE, name, page)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, 'w', encoding='utf-8', newline='\n').write(s)
    print('built', name)


# Built from the Umber pages (the live site 2026-11-05). 28 Instrument went live the same day, so
# those pages are gone and the 26-28 folders are the snapshot from then; this refuses to run
# rather than build them wrong.
if '/assets/umber.css' not in open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read():
    raise SystemExit('the live pages are 28 Instrument now, not the Umber pages these designs are built from; '
                     'the design folders are a snapshot, edit them by hand')
for name, d in DESIGNS.items():
    build(name, d)
