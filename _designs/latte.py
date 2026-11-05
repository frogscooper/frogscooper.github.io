# Builds the latte designs (23 Silk, 24 Umber, 25 Folio) from the live pages:
#   python3 _designs/latte.py
# "Latte" is the colour scheme only (foam, caramel, mocha, espresso); the designs themselves are
# abstract. Each is its own theme.css + bg.js layered over the live assets/pond.css, so the content
# always matches the live site: rerun this after editing a live page. Hand-edit only
# NN-name/theme.css and NN-name/bg.js; the .html files and assets/contrib.js are output.
#
# What every design changes on top of the live pages:
#   - its own background (bg.js) in place of the frog backdrop and its Contour/Pond switch
#   - the pfp loses the frog badge, and the inner pages show the pfp instead of the frog avatar
#   - its own fonts, browser theme colour, and (23, 24) a plain glyph for the contribution graph
#     instead of the frog
#   - nav links stay inside the design folder, so the whole site can be clicked through
# The frog stays as the favicon and on the 404 in every design, and 25 keeps the frog graph too
# (in its own copy of contrib.js, like 23 and 24's glyphs).
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.join(ROOT, '_designs')
PAGES = ['index.html', 'open-source/index.html', 'research/index.html', 'contact/index.html', '404.html']
PFP = ('<a class="pfp" href="https://github.com/frogscooper" aria-label="frogscooper on GitHub">'
       '<img src="https://avatars.githubusercontent.com/u/187351941?s=152" alt="" width="76" height="76"></a>')

DESIGNS = {
    '23-silk': dict(
        color='#fbf6ee', icon=None, gl=True,
        fonts='family=DM+Sans:opsz,wght@9..40,400..700&family=Fraunces:ital,opsz,wght,SOFT@0,9..144,400..700,0..100;1,9..144,400..700,0..100',
        cap='one tile per day, darker tile, more commits',
        # a rounded tile
        sprite=['.XXXXXXXXX.',
                'XXXXXXXXXXX',
                'XXXXXXXXXXX',
                'XXXXXXXXXXX',
                'XXXXXXXXXXX',
                'XXXXXXXXXXX',
                'XXXXXXXXXXX',
                '.XXXXXXXXX.'],
        rules='{}'),
    '24-umber': dict(
        color='#1c120c', icon=None, gl=True,
        fonts='family=Zilla+Slab:wght@500;700',
        cap='one dot per day, darker dot, more commits',
        # a round dot
        sprite=['...XXXXX...',
                '.XXXXXXXXX.',
                'XXXXXXXXXXX',
                'XXXXXXXXXXX',
                'XXXXXXXXXXX',
                'XXXXXXXXXXX',
                '.XXXXXXXXX.',
                '...XXXXX...'],
        rules='{}'),
    '25-folio': dict(
        color='#efe6d8', icon=None, gl=False,
        fonts='family=Instrument+Sans:wght@400;500;700&family=Instrument+Serif:ital@0;1',
        cap='one frog per day, darker frog, more commits',
        # the frog, kept here: its own copy, since the live graph moved to dots with 24 Umber
        sprite=['.XXXX.XXXX.',
                'XEOEXXXEOEX',
                'XEOEXXXEOEX',
                'XSXXXXXXXSX',
                'XXXSXXXSXXX',
                'XMXXXXXXXMX',
                'XXMMMMMMMXX',
                '.XXXXXXXXX.'],
        rules="{ E: [1, 'var(--eye)'], O: [1, 'var(--cg-ink)'], M: [2, 'var(--cg-ink)'], S: [4, 'var(--dk)'] }"),
}


def sub(s, pat, rep, want, what, flags=0):
    s2, n = re.subn(pat, rep, s, flags=flags)
    assert n == want, f'{what}: expected {want} change(s), got {n}'
    return s2


def contrib_js(d):
    s = open(os.path.join(ROOT, 'assets', 'contrib.js'), encoding='utf-8').read()
    rows = ''.join(f"\n  '{r}'," for r in d['sprite'])
    assert all(len(r) == 11 for r in d['sprite']) and len(d['sprite']) == 8, 'sprites are 11x8, like the frog'
    s = sub(s, r'const SPRITE = \[.*?\];', lambda m: 'const SPRITE = [' + rows + '\n];', 1, 'sprite', re.S)
    s = sub(s, r'const RULES = \{.*?\};', lambda m: 'const RULES = ' + d['rules'] + ';', 1, 'rules')
    return '// Built by _designs/latte.py from /assets/contrib.js with this design\'s glyph. Do not edit.\n' + s


def build(name, d):
    base = f'/_designs/{name}/'
    for page in PAGES:
        s = open(os.path.join(ROOT, page), encoding='utf-8').read()
        # styles: the live sheet, then the shared latte fixes, then this design
        s = sub(s, r'(<link rel="stylesheet" href="/assets/pond\.css[^"]*">)',
                lambda m: m.group(1) + '\n  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?' + d['fonts'].replace('&', '&amp;') + '&amp;display=swap">'
                + '\n  <link rel="stylesheet" href="/_designs/latte-base.css">'
                + f'\n  <link rel="stylesheet" href="{base}theme.css">', 1, page + ' css')
        s = sub(s, r'<meta name="theme-color" content="[^"]*">', f'<meta name="theme-color" content="{d["color"]}">', 1, page + ' theme-color')
        s = sub(s, r'<meta name="robots"[^>]*>\n?', '', s.count('<meta name="robots"'), page + ' robots')
        s = sub(s, r'(<meta charset="utf-8">)', r'\1\n  <meta name="robots" content="noindex">', 1, page + ' noindex')
        if d['icon']:
            s = sub(s, r'<link rel="icon" type="image/svg\+xml" href="/assets/frog\.svg">',
                    f'<link rel="icon" type="image/svg+xml" href="{base}{d["icon"]}">', 1, page + ' icon')
        # background: this design's instead of the frog backdrop and its switch
        bg = (f'<script src="/_designs/latte-gl.js" defer></script>\n  ' if d['gl'] else '') + f'<script src="{base}bg.js" defer></script>'
        s = sub(s, r'<script src="/frog-backdrop\.js[^"]*" defer></script>', lambda m: bg, 1, page + ' backdrop')
        s = sub(s, r'\s*<span data-frog-toggle></span>', '', 1, page + ' toggle')
        # frogs out of the header, except on the 404
        if page == 'index.html':
            s = sub(s, r'\s*<span class="avatar" aria-hidden="true"></span>', '', 1, 'pfp badge')
            if d['sprite']:
                s = sub(s, r'<script type="module" src="/assets/contrib\.js[^"]*"></script>',
                        f'<script type="module" src="{base}assets/contrib.js"></script>', 1, 'contrib')
                s = sub(s, r'one frog per day, darker frog, more commits', d['cap'], 1, 'caption')
        elif page != '404.html':
            s = sub(s, r'<div class="avatar" aria-hidden="true"></div>', PFP, 1, page + ' avatar')
        # site links stay inside the design
        s = re.sub(r'href="/(|open-source/|research/|contact/|#projects)"', lambda m: f'href="{base}{m.group(1)}"', s)
        out = os.path.join(HERE, name, page)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, 'w', encoding='utf-8', newline='\n').write(s)
    if d['sprite']:
        os.makedirs(os.path.join(HERE, name, 'assets'), exist_ok=True)
        open(os.path.join(HERE, name, 'assets', 'contrib.js'), 'w', encoding='utf-8', newline='\n').write(contrib_js(d))
    print('built', name)


# The designs are built from the pond-feed pages (the live site until 2026-11-05). Since 24 Umber
# went live the pages no longer have the frog backdrop to swap out, so the folders here are the
# snapshot from then; this refuses to run rather than build them wrong.
if '/frog-backdrop.js' not in open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read():
    raise SystemExit('the live pages are 24 Umber now, not the pond feed these designs are built from; '
                     'the design folders are a snapshot, edit them by hand')
for name, d in DESIGNS.items():
    build(name, d)
