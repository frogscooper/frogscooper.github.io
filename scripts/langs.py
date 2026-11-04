# Language mix across frogscooper's own (non-fork) repos, for the bar on the home profile card.
# Writes assets/langs.json as [[name, color, percent], ...], biggest first, small ones folded into
# "other". Needs a token for GitHub's GraphQL API:
#   GITHUB_TOKEN=$(gh auth token) python3 scripts/langs.py
# The site repo itself is skipped (it is mostly this site's markup and vendored JS), and so is
# markup/config that says nothing about what I write.
import json, os, sys, urllib.request

USER, OUT = 'frogscooper', os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'langs.json')
SKIP_REPOS = {'frogscooper.github.io', 'dotfiles'}
SKIP_LANGS = {'HTML', 'CSS', 'TeX', 'Makefile', 'Dockerfile', 'Shell', 'PowerShell', 'Batchfile', 'Nix'}
MIN = 2.0  # percent below which a language goes into "other"

q = '{user(login:"%s"){repositories(first:100,ownerAffiliations:OWNER,isFork:false){nodes{name languages(first:20){edges{size node{name color}}}}}}}' % USER
req = urllib.request.Request('https://api.github.com/graphql', json.dumps({'query': q}).encode(), {
    'Authorization': 'bearer ' + os.environ['GITHUB_TOKEN'], 'User-Agent': 'frogscooper-pages-langs'})
repos = json.load(urllib.request.urlopen(req))['data']['user']['repositories']['nodes']

size, color = {}, {}
for r in repos:
    if r['name'] in SKIP_REPOS:
        continue
    for e in r['languages']['edges']:
        n = e['node']['name']
        if n in SKIP_LANGS:
            continue
        size[n] = size.get(n, 0) + e['size']
        color[n] = e['node']['color'] or '#8a8a8a'

total = sum(size.values())
rows, other = [], 0.0
for n, s in sorted(size.items(), key=lambda kv: -kv[1]):
    p = 100 * s / total
    if p < MIN:
        other += p
    else:
        rows.append([n, color[n], round(p, 1)])
if other:
    rows.append(['other', '#c9c9c4', round(other, 1)])

try:
    if json.load(open(OUT, encoding='utf-8')) == rows:
        print('unchanged'); sys.exit(0)
except (OSError, ValueError):
    pass
json.dump(rows, open(OUT, 'w', encoding='utf-8', newline='\n'), separators=(',', ':'))
print(rows)
