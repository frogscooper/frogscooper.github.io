# GitHub bits baked into the home profile card:
#   python3 scripts/gh.py index.html
# Runs every 4h from .github/workflows/prs.yml, or by hand. Public REST API, no token needed
# (uses GITHUB_TOKEN if set).
#   <!-- merged:start/end -->    the most-starred repos I don't own that merged a PR of mine
#   <!-- gh-repos:start/end -->  my public non-fork repo count
# The profile picture needs nothing here: the card loads it straight from GitHub by user id.
import html, json, os, re, sys, urllib.parse, urllib.request

USER, N = 'frogscooper', 4

def get(url):
    headers = {'User-Agent': USER + '-site', 'Accept': 'application/vnd.github+json'}
    if os.environ.get('GITHUB_TOKEN'):
        headers['Authorization'] = 'Bearer ' + os.environ['GITHUB_TOKEN']
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=30))

def stars(n):
    return f'{n / 1000:.1f}k'.replace('.0k', 'k') if n >= 1000 else str(n)

q = urllib.parse.quote(f'is:pr is:merged author:{USER} -user:{USER}')
items = get(f'https://api.github.com/search/issues?per_page=100&q={q}')['items']
names = sorted({it['repository_url'].split('/repos/')[1] for it in items})
if not names:
    sys.exit('no merged PRs found, leaving the page alone')
repos = sorted((get('https://api.github.com/repos/' + n) for n in names), key=lambda r: -r['stargazers_count'])

def chip(r):
    owner, name = r['full_name'].split('/')
    prs = 'https://github.com/%s/pulls?q=%s' % (r['full_name'], urllib.parse.quote(f'is:pr is:merged author:{USER}'))
    return (f'<a class="repo" href="{html.escape(prs)}" title="{r["stargazers_count"]:,} stars">'
            f'<img src="{html.escape(r["owner"]["avatar_url"])}&amp;s=32" alt="" width="16" height="16" loading="lazy">'
            f'<span>{html.escape(owner)}/<b>{html.escape(name)}</b></span><em>★ {stars(r["stargazers_count"])}</em></a>')

own = get(f'https://api.github.com/users/{USER}/repos?type=owner&per_page=100')
count = sum(1 for r in own if not r['fork'])

path = sys.argv[1]
s = open(path, encoding='utf-8').read()
s2 = s
for name, inner in [('merged', ''.join(chip(r) for r in repos[:N])), ('gh-repos', str(count))]:
    s2, n = re.subn(r'<!-- %s:start -->.*?<!-- %s:end -->' % (name, name),
                    lambda m: '<!-- %s:start -->%s<!-- %s:end -->' % (name, inner, name), s2, flags=re.S)
    assert n == 1, name + ' markers not found'
if s2 != s:
    open(path, 'w', encoding='utf-8').write(s2)
print(path, 'updated' if s2 != s else 'unchanged', [r['full_name'] for r in repos], count, 'repos')
