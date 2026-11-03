# Builds the site designs from one copy of the content. Run from anywhere:
#   python3 _designs/build.py
# Writes _designs/NN-name/ (index, open-source, research, contact, assets/theme/) for each design in
# DESIGNS, plus _designs/index.html, a gallery for previewing them locally. Each folder mirrors the
# served site, so `python3 _designs/switch.py NN` can copy it over the live pages.
# Edit the content here (HOME, PROJECTS, RESEARCH, ...) or a design's tokens, then rebuild.
# Links between pages are relative, so a design works both from its folder and once switched in.
import html, os, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src')

FONTS = {
    'cond': ('IBM+Plex+Sans+Condensed:ital,wght@0,400;0,500;1,400', '"IBM Plex Sans Condensed", "Arial Narrow", sans-serif'),
    'news': ('Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400', '"Newsreader", "Iowan Old Style", Georgia, serif'),
    'serif': ('Instrument+Serif:ital@0;1', '"Instrument Serif", "Iowan Old Style", Georgia, serif'),
    'corm': ('Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400', '"Cormorant Garamond", "Iowan Old Style", Georgia, serif'),
    'mono': ('JetBrains+Mono:wght@400;500;700', '"JetBrains Mono", ui-monospace, Consolas, monospace'),
    'garamond': ('EB+Garamond:ital,wght@0,400;0,500;1,400', '"EB Garamond", Garamond, Georgia, serif'),
    'fraunces': ('Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300', '"Fraunces", Georgia, serif'),
    'spectral': ('Spectral:ital,wght@0,300;0,400;0,500;1,300;1,400', '"Spectral", Georgia, serif'),
    'bodoni': ('Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400', '"Bodoni Moda", Didot, Georgia, serif'),
    'grotesk': ('Hanken+Grotesk:ital,wght@0,300;0,400;0,500;1,400', '"Hanken Grotesk", "Helvetica Neue", Arial, sans-serif'),
}

# field: which generator in src/field.js. layout: top | full | left | right | frame (see src/base.css).
# display/body: keys of FONTS. extra: CSS appended after the tokens.
DESIGNS = [
    dict(n='01', key='moire', name='Moiré', field='moire', layout='top', display='cond', body='cond',
         bg='#f4f4f1', ink='#121a33', mute='#5d6785', acc='#3c4f86',
         idea='Two fine line gratings laid over each other at a slight angle; slow bands appear where they drift in and out of step.',
         rule='Each project tilts the second grating by a different angle.',
         tokens='--h-weight: 500; --h-case: uppercase; --h-track: -.01em; --h1: clamp(44px, 11vw, 150px); --body-size: 17px;'),
    dict(n='02', key='cyanotype', name='Cyanotype', field='cyanotype', layout='left', display='news', body='news',
         bg='#173a6b', ink='#f4f2ea', mute='#9fb3d1', acc='#c3d0e2',
         idea='A sun print on blueprint paper: plant forms in white on Prussian blue, swaying slightly.',
         rule='Each project grows a different number of stems.',
         tokens='--h-weight: 400; --em-style: italic; --body-size: 18px;'),
    dict(n='03', key='star-trails', name='Star trails', field='stars', layout='full', display='serif', body='news',
         bg='#070b16', ink='#eef2fb', mute='#7f8bab', acc='#9aa8c9',
         idea='A camera left open all night. Stars wheel around the pole and draw arcs.',
         rule='Each project moves the pole to a different point in the sky.',
         tokens='--h1: clamp(64px, 13vw, 170px); --body-size: 18px;'),
    dict(n='04', key='chladni', name='Chladni', field='chladni', layout='full', display='corm', body='corm',
         bg='#0f0f10', ink='#f6f1e7', mute='#8c8273', acc='#d8cfbf',
         idea='Sand on a vibrating plate gathers on the lines that stay still, and the plate drifts toward its next note.',
         rule='Each project is a vibration mode, a pair of whole numbers.',
         tokens='--h-weight: 400; --body-weight: 500; --body-size: 19px; --h1: clamp(64px, 12vw, 160px);'),
    dict(n='05', key='phyllotaxis', name='Phyllotaxis', field='phyllo', layout='left', display='news', body='news',
         bg='#f2eee2', ink='#28311a', mute='#6f7348', acc='#8a7a2a',
         idea='Seeds placed 137.5° apart, the way a sunflower packs its head. The spiral turns very slowly.',
         rule='Each project turns its seeds by a slightly different angle; only 137.5° packs them evenly.',
         tokens='--body-size: 18px; --radius: 4px;'),
    dict(n='06', key='riso', name='Riso', field='riso', layout='top', display='cond', body='cond',
         bg='#f3eee4', ink='#1f2a55', mute='#6b6f86', acc='#d9467a',
         idea='A two-colour risograph print in pink and blue. Halftone dots overlap where the inks meet.',
         rule='Each project is a new print with its own sun and horizon.',
         tokens='--h-weight: 500; --h-case: uppercase; --h1: clamp(44px, 11vw, 150px); --body-size: 17px;'),
    dict(n='07', key='phosphor', name='Phosphor', field='lissajous', layout='full', display='mono', body='mono',
         bg='#0f0b07', ink='#ffe2b0', mute='#9a7a52', acc='#e09a3a',
         idea='An oscilloscope in amber. Two waves at different speeds draw one closed figure that slowly turns.',
         rule='Each project is a frequency ratio.',
         tokens='--h-weight: 500; --h-track: -.03em; --h1: clamp(46px, 9vw, 112px); --h1-sub: clamp(40px, 7vw, 80px); --body-size: 15px;'),
    dict(n='08', key='glass', name='Glass', field='voronoi', layout='left', display='serif', body='news',
         bg='#1a1220', ink='#f4e2e2', mute='#a98a9c', acc='#c88a9a',
         idea='Stained glass from a Voronoi diagram: each pane is the ground closest to one drifting seed.',
         rule='Each project adds more seeds, so its glass gets finer.',
         tokens='--body-size: 18px; --radius: 6px;'),
    dict(n='09', key='ridgelines', name='Ridgelines', field='fog', layout='top', display='corm', body='corm',
         bg='#f1e6dc', ink='#2c2640', mute='#7d6f86', acc='#6b5b7b',
         idea='Mountain ridges fading into dusk haze. The nearer the ridge, the darker it is.',
         rule='Each project brings a different ridge forward.',
         tokens='--body-weight: 500; --body-size: 19px; --h1: clamp(64px, 12vw, 160px);'),
    dict(n='10', key='filings', name='Filings', field='filings', layout='full', display='news', body='news',
         bg='#efebe3', ink='#1b1a18', mute='#7a756b', acc='#9a3b2a',
         idea='Iron filings on paper, lined up along the field between magnetic poles.',
         rule='Each project sets out its poles differently.',
         tokens='--h1: clamp(60px, 12vw, 150px); --body-size: 18px;'),
    dict(n='11', key='survey', name='Survey', field='topo', layout='frame', display='spectral', body='spectral',
         bg='#f4efe3', ink='#2f2416', mute='#857257', acc='#b0452b',
         idea='A survey sheet: contour lines over a lake, with every fifth line inked heavier. The water rises very slowly and the contours creep uphill.',
         rule='Each project is a different sheet of the same country.',
         tokens='--h-weight: 300; --body-size: 18px;'),
    dict(n='12', key='ebru', name='Ebru', field='marble', layout='frame', display='garamond', body='garamond',
         bg='#f1e9d8', ink='#1f2b44', mute='#7d7668', acc='#a2462e',
         idea='Turkish paper marbling. Drops of ink float as stones, then a stylus and combs draw through them.',
         rule='Each project is a traditional pattern: battal, gel-git, taraklı, şal, bülbül yuvası.',
         tokens='--body-size: 19px; --h1: clamp(60px, 11vw, 150px);'),
    dict(n='13', key='loom', name='Loom', field='weave', layout='top', display='fraunces', body='news',
         bg='#f1ebdf', ink='#1d2540', mute='#7b7464', acc='#a8432c',
         idea='A loom, one cell per thread crossing. Cloth is woven at the fell line and wound upward; the bare warp hangs below.',
         rule='Each project is a different weave draft, from goose-eye twill to houndstooth.',
         tokens='--h-weight: 300; --h1: clamp(56px, 11vw, 150px); --body-size: 18px;'),
    dict(n='14', key='pool', name='Pool', field='caustic', layout='full', display='grotesk', body='grotesk',
         bg='#eaf6f3', ink='#0f3a43', mute='#5a8489', acc='#127a84',
         idea='Sunlight through moving water, focused into bright nets on the tiles of a pool floor.',
         rule='Each project is a pool of a different depth.',
         tokens='--h-weight: 300; --h-track: -.035em; --h1: clamp(60px, 12vw, 168px); --body-size: 17px;'),
    dict(n='15', key='aurora', name='Aurora', field='aurora', layout='full', display='fraunces', body='grotesk',
         bg='#070b14', ink='#e9f3ee', mute='#7f91a0', acc='#7fe0b0',
         idea='Curtains of aurora over a ridge at night, green at the hem and violet higher up.',
         rule='Each project is a geomagnetic storm level; the higher the Kp, the lower and brighter the curtains.',
         tokens='--h-weight: 300; --h1: clamp(60px, 12vw, 160px); --body-size: 17px;'),
    dict(n='16', key='physarum', name='Physarum', field='slime', layout='right', display='serif', body='grotesk',
         bg='#efecd9', ink='#2b2712', mute='#7b7553', acc='#a8740c',
         idea='The slime mould from the slime studies, live: thousands of agents lay and follow a trail, and a network grows between the food.',
         rule='Each project feeds it a different number of food sources and changes how wide it senses.',
         tokens='--h1: clamp(64px, 12vw, 160px); --body-size: 17px; --radius: 10px;'),
    dict(n='17', key='herbarium', name='Herbarium', field='herb', layout='left', display='bodoni', body='garamond',
         bg='#f2ecdd', ink='#3a2e1c', mute='#86775c', acc='#6c6a33',
         idea='A herbarium sheet: a pressed plant drawn in sepia ink, taped down at the stem. Its tips stir as if in a draught.',
         rule='Each project is a different plant, grown from its own L-system.',
         tokens='--em-style: italic; --body-size: 19px; --h1: clamp(56px, 10vw, 128px);'),
    dict(n='18', key='orrery', name='Orrery', field='orrery', layout='right', display='corm', body='spectral',
         bg='#0e1a2e', ink='#efe4c8', mute='#8f97a6', acc='#c9a96a',
         idea='A brass orrery on a star chart. A chord is drawn between two planets as they go round, and over a full cycle it traces a rose.',
         rule='Each project is an orbital resonance. Home is 8:13, the pentagram of Earth and Venus.',
         tokens='--h-weight: 500; --h-case: uppercase; --h-track: .05em; --h1: clamp(44px, 8vw, 104px); --h1-sub: clamp(40px, 6vw, 80px); --body-size: 18px;'),
    dict(n='19', key='zellige', name='Zellige', field='zellige', layout='top', display='serif', body='grotesk',
         bg='#f5f2ea', ink='#123438', mute='#6b8580', acc='#2b6b66',
         idea='Glazed tilework from a quasicrystal: plane waves at evenly spaced angles, summed. The pattern never repeats.',
         rule='Each project has a different order of symmetry.',
         tokens='--h1: clamp(64px, 13vw, 176px); --body-size: 17px;'),
    dict(n='20', key='rain', name='Rain', field='rain', layout='full', display='spectral', body='news',
         bg='#0e1519', ink='#e3ecef', mute='#7c8f97', acc='#9cc3cf',
         idea='Rain on a pond at night. Each drop sends out rings, flattened by the low angle, and the rings cross.',
         rule='Each project is a heavier or lighter shower.',
         tokens='--h-weight: 300; --h1: clamp(60px, 12vw, 160px); --body-size: 18px;'),
]
LAYOUTS = {'top': 'top band', 'full': 'full screen', 'left': 'pinned left', 'right': 'pinned right', 'frame': 'mounted sheet'}

EMAIL = 'stemboy@posteo.com'
GITHUB = 'https://github.com/frogscooper'
LILYPAD = 'https://lilypad.frogscooper.dev'
# 100 / (width of "frogscooper" in ems) in each design's display face, measured in a browser and
# rounded down a little; the hero name is capped at that many cqi so it always fits its column.
FIT = {'moire': 15.3, 'cyanotype': 18.2, 'star-trails': 24.4, 'chladni': 21.2, 'phyllotaxis': 18.2, 'riso': 15,
       'phosphor': 15.4, 'glass': 24.4, 'ridgelines': 21.2, 'filings': 18.2, 'survey': 18.7, 'ebru': 21.4,
       'loom': 22.1, 'pool': 19.3, 'aurora': 22.1, 'physarum': 24.4, 'herbarium': 17.4, 'orrery': 12.6,
       'zellige': 24.4, 'rain': 18.7}
DESC ='CS sophomore @ OSU. I build software with 3 priorities: efficiency, precision, and aura.'

PAGES = {  # path: (title, description, field p, nav href)
    'index.html': ('frogscooper | CS @ Ohio State', 'frogscooper, CS sophomore @ Ohio State. Projects, research, and contact.', 0, ''),
    'open-source/index.html': ('Open source contributions | frogscooper', 'Open source pull requests by frogscooper.', 7, 'open-source/'),
    'research/index.html': ('Research | frogscooper', 'Research by frogscooper on algorithms, simulation, and systems.', 8, 'research/'),
    'contact/index.html': ('Contact | frogscooper', 'Get in touch with frogscooper about research, technical collaborations, or interesting projects.', 9, 'contact/'),
}
NAV = [('Home', ''), ('Open Source', 'open-source/'), ('Research', 'research/'), ('Contact', 'contact/'),
       ('Lilypad', LILYPAD), ('GitHub', GITHUB)]

e = html.escape

def head(d, path, pre):
    title, desc, _, href = PAGES[path]
    url = 'https://frogscooper.dev/' + href
    fams = sorted({FONTS[d['display']][0], FONTS[d['body']][0], FONTS['mono'][0]})
    font_url = 'https://fonts.googleapis.com/css2?' + '&'.join('family=' + f for f in fams) + '&display=swap'
    return f'''<!doctype html>
<html lang="en" data-field="{d['field']}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="{font_url}">
  <title>{e(title)}</title>
  <meta name="description" content="{e(desc)}">
  <link rel="canonical" href="{url}">
  <meta name="theme-color" content="{d['bg']}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="frogscooper">
  <meta property="og:title" content="{e(title)}">
  <meta property="og:description" content="{e(desc)}">
  <meta property="og:url" content="{url}">
  <meta name="twitter:card" content="summary">
  <meta name="google-adsense-account" content="ca-pub-9008261213236010">
  <link rel="stylesheet" href="{pre}assets/theme/style.css">
  <script src="{pre}assets/theme/field.js" defer></script>
  <script src="{pre}assets/theme/site.js" defer></script>
</head>
'''

def nav(pre, here):
    out = []
    for label, href in NAV:
        if href.startswith('http'):
            out.append(f'<a class="ext" href="{href}">{label}</a>')
        else:
            cur = ' aria-current="page"' if href == here else ''
            out.append(f'<a href="{pre}{href or "./"}"{cur}>{label}</a>')
    return ('<header class="site-header">\n'
            f'      <a class="brand" href="{pre or "./"}"><strong>frogscooper</strong><span>CS @ Ohio State</span></a>\n'
            f'      <nav class="site-nav" aria-label="Primary">{"".join(out)}</nav>\n'
            '    </header>')

def field(p, cls='hero-field', cap=True):
    c = '<span class="field-cap" aria-hidden="true"></span>' if cap else ''
    return f'<div class="field-box {cls}"><canvas class="field" data-p="{p}" aria-hidden="true"></canvas>{c}</div>'

def footer(pre):
    return f'''<footer class="wrap">
      <span>frogscooper · {datestamp()}</span>
      <div><a href="mailto:{EMAIL}">Email</a><a href="{GITHUB}">GitHub</a><a href="{pre}contact/">Contact</a></div>
    </footer>'''

def datestamp():
    return 'updated oct 2026'

# ---------------------------------------------------------------- content: home

FACTS = [
    ('currently', 'creating machine learning simulations of <i>Physarum polycephalum</i>. im making it play pokemon and pong, and reproducing Tero et al. with San Francisco'),
    ('shipped', f'<a href="{LILYPAD}">lilypad</a>, 32 tools in 4 languages, 11x faster than heictojpg.com'),
    ('research', '<a href="{pre}research/">non-intersecting corridor routing in BSP-generated spaces</a>'),
    ('stack', 'Rust, TypeScript, Python'),
    ('looking for', 'SWE internship'),
]

def facts(pre, cls='facts'):
    rows = ''.join(f'<div class="fact{" hl" if k == "looking for" else ""}"><dt>{k}</dt><dd>{v.replace("{pre}", pre)}</dd></div>' for k, v in FACTS)
    return f'<dl class="{cls}">{rows}</dl>'

def hero_text(pre, with_facts=True):
    return f'''<div class="hero-grid">
          <div>
            <span class="eyebrow">Readme</span>
            <h1>frogscooper</h1>
            <p class="lede">{DESC}</p>
            <div class="acts"><a class="btn solid" href="mailto:{EMAIL}">Email</a><a class="btn" href="{GITHUB}">GitHub</a><a class="btn" href="#projects">Projects</a></div>
          </div>
          {facts(pre) if with_facts else ''}
        </div>'''

STATS = [('0 <small>bytes</small>', 'uploaded', '7 of the 8 say they upload your file'),
         ('never', 'stored', 'the rest keep them 2 hours to 7 days'),
         ('11x', 'faster on the same photo', '0.8 s vs 8.9 s on heictojpg.com'),
         ('2.6 <small>s</small>', 'to load on a phone', 'median 8.3 s, simulated 3G'),
         ('4.6x', 'lighter page', '236 KB vs a median of 1,096 KB'),
         ('no cap', 'on daily conversions', "Zamzar's free tier allows 2 files a day")]

AGENT_PY = '''"""A scripted agent loop (no model) that runs a two-step plan through agent-once."""
import os
import sys
import time
from once import Hooks, Once
once = Once("agent.db", hooks=Hooks(
    on_replay=lambda e: print("  once: saved result, not run again")))
PLAN = [("charge_card", {"order": "A12", "cents": 1000}),
        ("send_receipt", {"order": "A12", "charge": "$charge_card"})]
@once.tool
def charge_card(order: str, cents: int) -> str:
    print(f"  ** charging card for {order}: ${cents / 100:.2f}")
    return "ch_1"
@once.tool
def send_receipt(order: str, charge: str) -> str:
    print(f"  ** emailing receipt for {order} ({charge})")
    return "msg_1"
TOOLS = {"charge_card": charge_card, "send_receipt": send_receipt}
crash_after = sys.argv[2] if sys.argv[1:2] == ["--crash-after"] else None
results = {}
with once.scope("run_42"):
    for name, args in PLAN:
        time.sleep(0.5)  # stand-in for the model picking the next step
        args = {k: results.get(v[1:], v) if isinstance(v, str) and v.startswith("$") else v
                for k, v in args.items()}
        print(f"-> {name}({', '.join(f'{k}={v!r}' for k, v in args.items())})")
        results[name] = TOOLS[name](**args)
        print(f"  <- {results[name]!r}")
        if name == crash_after:
            time.sleep(0.4)
            print("!! worker killed (simulated timeout)")
            sys.stdout.flush()
            os._exit(137)
print("agent: plan done")'''

TERM = '''<span class="p">$ python agent.py --crash-after charge_card</span>
-&gt; charge_card(order=&#x27;A12&#x27;, cents=1000)
<span class="fx">  ** charging card for A12: $10.00</span>
<span class="ret">  &lt;- &#x27;ch_1&#x27;</span>
<span class="kill">!! worker killed (simulated timeout)</span>
<span class="p">$ python agent.py</span>
-&gt; charge_card(order=&#x27;A12&#x27;, cents=1000)
<span class="hit">  once: saved result, not run again</span>
<span class="ret">  &lt;- &#x27;ch_1&#x27;</span>
-&gt; send_receipt(order=&#x27;A12&#x27;, charge=&#x27;ch_1&#x27;)
<span class="fx">  ** emailing receipt for A12 (ch_1)</span>
<span class="ret">  &lt;- &#x27;msg_1&#x27;</span>
agent: plan done'''

def media_lilypad():
    stats = ''.join(f'<div class="stat"><b>{b}</b>{l}<span>{s}</span></div>' for b, l, s in STATS)
    return f'''<figure class="media">
              <a class="stats-link" href="{LILYPAD}"><div class="stats-head">lilypad vs 8 popular online converters</div><div class="stats">{stats}</div></a>
              <figcaption class="media-cap"><span>measured oct 2026 in headless chrome, median of 3 runs</span><span>benchmarks</span></figcaption>
            </figure>'''

def media_once():
    return f'''<figure class="media">
              <div class="once-term" id="once-term"><pre class="term" aria-label="terminal recording: an agent is killed after charging a card, then retries the run"><code>{TERM}</code></pre></div>
              <figcaption class="media-cap"><span>killed after the charge, retried, charged once</span><span>real agent-once 0.1.0 output</span></figcaption>
            </figure>'''

def media_grch():
    return '''<figure class="media">
              <div class="grch-demo" id="grch-demo">
                <a href="https://github.com/frogscooper/grch-procedural-gen"><img src="/assets/grch_obj_top_angle.png" alt="GRCH procedural generator render: a BSP dungeon from above" loading="lazy"></a>
                <button type="button" class="grch-run" hidden>run grch</button>
              </div>
              <figcaption class="media-cap"><span>bsp dungeon, top view</span><span class="grch-cap">obj export</span></figcaption>
            </figure>'''

def media_slime():
    return '''<figure class="media">
              <div class="slime-tabs" role="tablist" aria-label="Slime study" hidden>
                <button type="button" role="tab" id="slime-tab-battle" aria-controls="slime-demo" aria-selected="true" data-study="battle">pokémon</button>
                <button type="button" role="tab" id="slime-tab-pong" aria-controls="slime-demo" aria-selected="false" tabindex="-1" data-study="pong">pong</button>
                <button type="button" role="tab" id="slime-tab-bayarea" aria-controls="slime-demo" aria-selected="false" tabindex="-1" data-study="bayarea">bay area transit</button>
              </div>
              <div class="slime-demo" id="slime-demo" role="tabpanel" aria-labelledby="slime-tab-battle">
                <iframe src="/slime/battle.html?embed" title="Slime Battler: a slime mould making the decisions in a Pokémon battle" loading="lazy"></iframe>
              </div>
              <figcaption class="media-cap"><span id="slime-cap">recorded battle, slime regrown live</span><span>jones agent model, in your browser</span></figcaption>
            </figure>'''

PROJECTS = [
    dict(id='lilypad', title='Lilypad', href=LILYPAD, meta='Web · 2026', media=media_lilypad, text=f'''<p>Free image and PDF tools that run entirely in the browser. Batch format conversion (HEIC, WebP, AVIF, PNG, JPG), merging, splitting, and compressing PDFs, QR codes, and more. Nothing gets uploaded.</p>
              <div class="try-row"><a class="btn solid" href="{LILYPAD}">Try it →</a><span class="try-hint">no signup, nothing uploaded. drop a HEIC and watch.</span></div>'''),
    dict(id='once', title='once', href='https://github.com/frogscooper/once', meta='Python · 2026', media=media_once, text=f'''<p>A Python library that makes side-effecting tool calls safe for AI agents to retry. Each call gets an idempotency key stored in SQLite or Postgres, so a retried "charge the card" or "send the email" returns the saved result instead of running twice.</p>
              <div class="install"><code>$ pip install agent-once</code><button type="button" class="once-copy" data-copy="pip install agent-once" hidden>copy</button><span class="try-hint">python 3.10+, no dependencies</span></div>
              <details class="src"><summary>view agent.py</summary><pre><code>{e(AGENT_PY)}</code></pre></details>
              <div class="links"><a href="https://pypi.org/project/agent-once/">PyPI ↗</a><a href="https://frogscooper.dev/once/">Docs ↗</a><a href="https://github.com/frogscooper/once">Source ↗</a></div>'''),
    dict(id='grch', title='GRCH Procedural Generator', href='https://github.com/frogscooper/grch-procedural-gen', meta='Rust · 2026', media=media_grch, text='''<p>A 3D procedural dungeon generator built around binary space partitioning. I wrote a constructive routing algorithm that moves corridors through the BSP partition while avoiding rooms they aren't supposed to intersect.</p>
              <div class="links"><a href="https://github.com/frogscooper/grch-procedural-gen">Source ↗</a><a href="{pre}research/">Research →</a></div>'''),
    dict(id='slime', title='Slime Studies', href='/slime/battle.html', meta='TypeScript · Python · 2026', media=media_slime, text='''<p>A simulated <i>Physarum</i> slime mould (Jeff Jones's agent model) put to work. In each study something places food, the slime grows toward it, and wherever it gathers is the answer.</p>
              <p id="slime-desc">Every decision in a Pokémon battle. Ten food sites ring the slime, one per move or switch, and the option it gathers on is played. One slime is fed by a PPO network; the other was evolved with CMA-ES to play on its own senses, and beats the network (71% against the strongest-move bot).</p>
              <div class="links"><a href="/slime/battle.html" id="slime-full">Full page ↗</a></div>
              <p class="fine" id="slime-tm">Pokémon names are trademarks of Nintendo, Creatures and GAME FREAK. Not affiliated or endorsed; battles simulated on a local Pokémon Showdown server.</p>'''),
    dict(id='cbtorrent', title='cbtorrent', href='https://github.com/frogscooper/cbtorrent', meta='Python · 2026', media=None, text='''<p>A Python BitTorrent client with online ML peer selection and a tkinter GUI. My first deliberately AI-assisted project. An experiment in how far that workflow goes on real protocol and learning code, not a claim that AI shipped a finished client.</p>
              <div class="links"><a href="https://github.com/frogscooper/cbtorrent">Source ↗</a></div>'''),
    dict(id='fly-osu', title='fly-osu', href=None, meta='In progress', media=None, text='''<p>An experiment using the reconstructed male fruit fly CNS as a controller for osu!. I'm building a connectome simulator that encodes beatmap and game-state information into neural input, then decodes network activity into cursor movement and click timing.</p>'''),
]

LATEST_PR = '<li class="pr"><span class="pr-repo">toss/es-toolkit</span><a class="pr-title" href="https://github.com/toss/es-toolkit/pull/2169">fix[invert, omit, pick]: handle null and undefined without throwing</a><span class="pr-tag open">open</span><time class="pr-date" datetime="2026-10-27">oct 27 2026</time></li>'

def project(pr, i, pre):
    p = i + 1
    title = f'<a href="{pr["href"]}">{pr["title"]}</a>' if pr['href'] else pr['title']
    media = pr['media']() if pr['media'] else ''
    small = '' if media else ' small'
    return f'''<article class="project{small}" id="{pr['id']}" data-stage-p="{p}">
          {field(p, 'strip')}
          <header class="p-head"><span class="p-num">{p:02d}</span><h3>{title}</h3><span class="p-meta">{pr['meta']}</span></header>
          <div class="p-body">
            <div class="p-text">
              {pr['text'].replace('{pre}', pre)}
            </div>
            {media}
          </div>
        </article>'''

def home_main(pre):
    projects = '\n        '.join(project(pr, i, pre) for i, pr in enumerate(PROJECTS))
    return f'''<section class="work" id="projects" aria-labelledby="projects-h">
        <div class="sec-head"><h2 id="projects-h">Projects</h2><span>Selected work, 2026</span></div>
        {projects}
      </section>
      <div class="duo">
        <section class="contrib" id="activity" aria-labelledby="activity-h">
          <h2 id="activity-h">Activity</h2>
          <strong class="big"><span class="contrib-total">301</span></strong>
          <small>github contributions, last 6 months · <span class="contrib-range"></span></small>
          <div class="contrib-grid"><p class="note">The contribution grid needs JavaScript. See it on <a href="{GITHUB}">github.com/frogscooper</a>.</p></div>
        </section>
        <section id="open-source" aria-labelledby="os-h">
          <h2 id="os-h">Open source</h2>
          <ul class="pr-list">
                <!-- prs:start -->
                {LATEST_PR}
                <!-- prs:end -->
          </ul>
          <div class="acts"><a class="btn" href="{pre}open-source/">All open source work</a></div>
        </section>
      </div>
      <section class="about" aria-labelledby="about-h">
        <h2 id="about-h">About</h2>
        <p>I'm a computer science student at The Ohio State University. I enjoy algorithms, systems programming, simulation, and building projects that are (hopefully) unique.</p>
      </section>'''

# ---------------------------------------------------------------- content: other pages

OS_ROWS = '''<li class="os-pr"><a href="https://github.com/toss/es-toolkit/pull/2169">fix[invert, omit, pick]: handle null and undefined without throwing</a><span class="os-state open" role="img" aria-label="Open"><svg aria-hidden="true" focusable="false"><use href="#oi-open"/></svg></span><span class="os-meta">toss/es-toolkit #2169 &middot; <time datetime="2026-10-27">oct 27 2026</time></span></li>
        <li class="os-pr"><a href="https://github.com/toss/es-toolkit/pull/2168">fix[findLast, some]: do not treat length as an element of array-likes</a><span class="os-state merged" role="img" aria-label="Merged"><svg aria-hidden="true" focusable="false"><use href="#oi-merged"/></svg></span><span class="os-meta">toss/es-toolkit #2168 &middot; <time datetime="2026-10-26">oct 26 2026</time></span></li>
        <li class="os-pr"><a href="https://github.com/toss/es-toolkit/pull/2165">fix[pickBy]: do not treat objects with a numeric length as array-like</a><span class="os-state merged" role="img" aria-label="Merged"><svg aria-hidden="true" focusable="false"><use href="#oi-merged"/></svg></span><span class="os-meta">toss/es-toolkit #2165 &middot; <time datetime="2026-10-25">oct 25 2026</time></span></li>
        <li class="os-pr"><a href="https://github.com/toss/es-toolkit/pull/2157">fix[groupBy, keyBy, countBy]: keep __proto__ as an own property</a><span class="os-state open" role="img" aria-label="Open"><svg aria-hidden="true" focusable="false"><use href="#oi-open"/></svg></span><span class="os-meta">toss/es-toolkit #2157 &middot; <time datetime="2026-10-23">oct 23 2026</time></span></li>'''

SPRITE = '''<svg class="os-sprite" aria-hidden="true" focusable="false">
        <symbol id="oi-open" viewBox="0 0 16 16"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"/></symbol>
        <symbol id="oi-merged" viewBox="0 0 16 16"><path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z"/></symbol>
        <symbol id="oi-closed" viewBox="0 0 16 16"><path d="M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 5.5a.75.75 0 0 1 .75.75v3.378a2.251 2.251 0 1 1-1.5 0V7.25a.75.75 0 0 1 .75-.75Zm-2.03-5.273a.75.75 0 0 1 1.06 0l.97.97.97-.97a.748.748 0 0 1 1.265.332.75.75 0 0 1-.205.729l-.97.97.97.97a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-.97-.97-.97.97a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l.97-.97-.97-.97a.75.75 0 0 1 0-1.06ZM2.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0ZM3.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"/></symbol>
        <symbol id="oi-draft" viewBox="0 0 16 16"><path d="M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.251 2.251 0 0 1 3.25 1Zm9.5 14a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5ZM2.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0ZM3.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM14 7.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm0-4.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z"/></symbol>
      </svg>'''

def os_intro():
    return ('Contributions', 'Open <em>source</em>',
            'Pull requests I have opened to repositories I don\'t own, newest first. This list refreshes itself every few hours.')

def os_main(pre):
    return f'''{SPRITE}
      <div class="sec-head"><h2><!-- prs-count:start -->4<!-- prs-count:end --> pull requests</h2><span>to repos i don't own</span></div>
      <ul class="os-list">
        <!-- prs-all:start -->
        {OS_ROWS}
        <!-- prs-all:end -->
      </ul>
      <div class="acts"><a class="btn" href="https://github.com/search?q=author%3Afrogscooper+is%3Apr+-user%3Afrogscooper&amp;type=pullrequests&amp;s=created&amp;o=desc">View on GitHub →</a></div>'''

RESEARCH = [
    dict(year='2026', title='Constructive Non-Intersecting Routing in BSP-Generated Spaces',
         tags='Procedural generation · computational geometry · algorithms',
         body='An investigation into constructive routing methods for connecting recursively partitioned spaces while avoiding unintended room intersections. The idea stems from my procedural generation project and explores how the method can be generalized beyond three dimensions.',
         links=[('Original project', 'https://github.com/frogscooper/grch-procedural-gen'), ('N-dimensional version', 'https://github.com/frogscooper/nD-grch'), ('Paper', '/assets/papers/BSP_preprint_v0_5.pdf')]),
    dict(year='2026', title='A Smaller Artin Group with No Geometric CAT(0) Action',
         tags='Geometric group theory · Lean · AI-assisted',
         body="An edit of OpenAI's preprint that refutes the CAT(0) conjecture for Artin groups. A shorter bound on braid translation lengths cuts their example from 116 generators to 29, with the full proof checked in Lean. A further version gets it to 11 generators, checked except for one standard assumption (van der Lek's theorem on parabolic subgroups). This was almost entirely AI-driven. I'm listing it as an experiment in that workflow, not as my own math.",
         links=[('Repo and Lean proof', 'https://github.com/frogscooper/artin-cat0-29'), ('Paper', 'https://github.com/frogscooper/artin-cat0-29/blob/HEAD/paper/artin-cat0-29.pdf'), ('Original (openai/math)', 'https://github.com/openai/math')]),
]

def research_intro():
    return ('Research', 'Research',
            "Research isn't something I plan to spend my life on, but I enjoy exploring questions that fall somewhere between algorithms, simulation, and systems. Hopefully this page grows over the years.")

def research_main(pre):
    rows = ''.join(f'''
      <article class="entry">
        <span class="k">{r['year']}</span>
        <div>
          <h2>{r['title']}</h2>
          <div class="tags">{r['tags']}</div>
          <p>{e(r['body'])}</p>
          <div class="links">{''.join(f'<a href="{h}">{l} ↗</a>' for l, h in r['links'])}</div>
        </div>
      </article>''' for r in RESEARCH)
    return f'''<div class="sec-head"><h2>Projects</h2><span>{len(RESEARCH)} so far</span></div>{rows}
      <div class="ctx">
        <div><span class="k">Areas of interest</span><p>Algorithms, systems programming, simulation, computational geometry, reinforcement learning, and machine learning.</p></div>
        <div><span class="k">Current</span><p>Computer science student at The Ohio State University.</p></div>
      </div>'''

def contact_intro():
    return ('Contact', 'Say <em>hello</em>',
            "I'd be happy to hear about internships, research, technical collaborations, interesting projects, or questions related to my work.")

def contact_main(pre):
    return f'''<div class="ways">
        <a class="way" href="mailto:{EMAIL}"><span class="k">Email</span><strong>{EMAIL}</strong><small>Best for anything significant</small></a>
        <a class="way" href="{GITHUB}"><span class="k">GitHub</span><strong>github.com/frogscooper</strong><small>Code and projects</small></a>
      </div>
      <p class="note">If you're contacting me about an opportunity, including the role, timeline, and any relevant links is helpful.</p>
      <div class="ctx">
        <div><span class="k">My areas of interest</span><p>Algorithms, systems programming, simulation, computational geometry, RL/ML.</p></div>
        <div><span class="k">Current</span><p>Computer science student at The Ohio State University</p></div>
      </div>'''

SUB = {
    'open-source/index.html': (os_intro, os_main),
    'research/index.html': (research_intro, research_main),
    'contact/index.html': (contact_intro, contact_main),
}

# ---------------------------------------------------------------- page assembly

def page(d, path):
    pre = '../' * path.count('/')
    here = PAGES[path][3]
    p = PAGES[path][2]
    lay = d['layout']
    body_cls = ('layout-left flip' if lay == 'right' else f'layout-{lay}') + f' d-{d["key"]}'
    hdr = nav(pre, here)
    if path == 'index.html':
        top_text = hero_text(pre, lay != 'full')
        main = home_main(pre)
        if lay == 'full':  # the band over the field stays short; the facts open the page below it
            main = facts(pre, 'facts facts-wide') + main
    else:
        intro, mainf = SUB[path]
        eyebrow, h1, lede = intro()
        top_text = f'''<div class="page-intro">
          <span class="eyebrow">{eyebrow}</span>
          <h1>{h1}</h1>
          <p>{lede}</p>
        </div>'''
        main = mainf(pre)
    home = path == 'index.html'
    scripts = '\n  <script src="/assets/prs.js?v=1" defer></script>' if path in ('index.html', 'open-source/index.html') else ''

    if lay == 'frame':
        body = f'''<div class="stage">{field(p, 'hero-field')}</div>
  <div class="mount">
    <div class="wrap">{hdr}</div>
    <div class="sheet{'' if home else ' sub'}">
      <main id="main" class="wrap">
        {top_text}
        {main}
      </main>
      {footer(pre)}
    </div>
  </div>'''
    elif lay in ('left', 'right'):
        body = f'''<div class="page">
    <div class="stage">{field(p, 'hero-field')}</div>
    <div class="content">
      <div class="wrap">
        {hdr}
        <main id="main">
        {top_text}
        {main}
        </main>
      </div>
      {footer(pre)}
    </div>
  </div>'''
    elif lay == 'top':
        body = f'''<div class="wrap">{hdr}</div>
  {field(p, 'hero-field' if home else 'sub-field')}
  <main id="main" class="wrap">
    {top_text}
    {main}
  </main>
  {footer(pre)}'''
    else:  # full
        cls = 'hero' if home else 'sub-hero'
        body = f'''<section class="{cls}">
    {field(p, 'hero-field')}
    <div class="wrap">{hdr}</div>
    <div class="band"><div class="wrap">{top_text}</div></div>
  </section>
  <main id="main" class="wrap">
    {main}
  </main>
  {footer(pre)}'''
    return (head(d, path, pre) + f'<body class="{body_cls}">\n  <a class="skip" href="#main">Skip to content</a>\n  {body}{scripts}\n</body>\n</html>\n')

def css(d):
    disp, body = FONTS[d['display']][1], FONTS[d['body']][1]
    base = open(os.path.join(SRC, 'base.css'), encoding='utf-8').read()
    return (f'/* {d["n"]} {d["name"]}: {d["idea"]} {d["rule"]}\n   Built by _designs/build.py from src/base.css; edit there, not here. */\n'
            f':root {{\n  color-scheme: {"dark" if is_dark(d["bg"]) else "light"};\n  --bg: {d["bg"]}; --ink: {d["ink"]}; --mute: {d["mute"]}; --acc: {d["acc"]};\n'
            f'  --display: {disp}; --body: {body}; --fit: {FIT[d["key"]]};\n  {d["tokens"]}\n}}\n' + base + d.get('extra', ''))

def is_dark(hexc):
    r, g, b = (int(hexc[i:i + 2], 16) for i in (1, 3, 5))
    return 0.299 * r + 0.587 * g + 0.114 * b < 128

# Designs written by hand rather than built here; main() leaves their folders alone.
HAND_CARDS = '''
    <a class="card" href="21-bili/" style="--bg:#f6f7f9;--ink:#18191c;--acc:#f0679a">
      <span>21</span><strong>Bili</strong><em>creator profile</em><p>A video-site creator page: banner, avatar, tabs, and projects as video cards whose covers preview on hover.</p><small>The banner is one of the twenty fields above, a different one each day. Home page only, hand-written.</small>
    </a>
    <a class="card" href="22-pond-feed/" style="--bg:#fafaf8;--ink:#101010;--acc:#4c6b34">
      <span>22</span><strong>Pond feed</strong><em>creator profile</em><p>21's layout in the original site's own look: the pond backdrop as the banner, paper and ink, hard shadows, the frog-per-day graph.</p><small>Projects are cards whose covers run on hover. Home page only, hand-written.</small>
    </a>'''

def gallery():
    cards = ''.join(f'''
    <a class="card" href="{d['n']}-{d['key']}/" style="--bg:{d['bg']};--ink:{d['ink']};--acc:{d['acc']}">
      <span>{d['n']}</span><strong>{d['name']}</strong><em>{LAYOUTS[d['layout']]}</em><p>{e(d['idea'])}</p><small>{e(d['rule'])}</small>
    </a>''' for d in DESIGNS) + HAND_CARDS
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Site designs</title>
  <meta name="robots" content="noindex">
  <style>
    :root {{ color-scheme: dark; }}
    body {{ margin: 0; background: #0d0d0f; color: #e8e4da; font: 14px/1.5 ui-monospace, Consolas, monospace; }}
    main {{ max-width: 1100px; margin: 0 auto; padding: 40px max(16px, env(safe-area-inset-left)); }}
    h1 {{ font: 400 40px/1 Georgia, serif; margin: 0 0 8px; }}
    main > p {{ color: #8b877d; max-width: 70ch; }}
    code {{ color: #e8e4da; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 14px; margin-top: 28px; }}
    .card {{ display: grid; gap: 6px; padding: 18px; background: var(--bg); color: var(--ink); text-decoration: none; border-radius: 6px; min-height: 220px; align-content: start; }}
    .card strong {{ font: 400 30px/1 Georgia, serif; }}
    .card em {{ color: var(--acc); font-style: normal; }}
    .card p {{ margin: 6px 0 0; }}
    .card small {{ opacity: .7; }}
  </style>
</head>
<body>
<main>
  <h1>Site designs</h1>
  <p>{len(DESIGNS)} full designs of frogscooper.dev, built from one copy of the content by <code>_designs/build.py</code>. Nothing in <code>_designs/</code> is published. To put one live, run <code>python3 _designs/switch.py 03</code> (or any number), check it, and commit. <code>python3 _designs/switch.py original</code> restores the old site.</p>
  <div class="grid">{cards}
  </div>
</main>
</body>
</html>
'''

def main():
    for d in DESIGNS:
        out = os.path.join(HERE, f'{d["n"]}-{d["key"]}')
        if os.path.isdir(out):
            shutil.rmtree(out)
        theme = os.path.join(out, 'assets', 'theme')
        os.makedirs(theme)
        for path in PAGES:
            dst = os.path.join(out, path)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            with open(dst, 'w', encoding='utf-8', newline='\n') as f:
                f.write(page(d, path))
        with open(os.path.join(theme, 'style.css'), 'w', encoding='utf-8', newline='\n') as f:
            f.write(css(d))
        for js in ('field.js', 'site.js'):
            shutil.copyfile(os.path.join(SRC, js), os.path.join(theme, js))
        print('built', os.path.relpath(out, os.path.dirname(HERE)))
    with open(os.path.join(HERE, 'index.html'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(gallery())

if __name__ == '__main__':
    main()
