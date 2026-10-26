# Refresh the open source PR lists:
#   python3 scripts/prs.py index.html open-source/index.html
# Runs every 4h from .github/workflows/prs.yml, or by hand.
# Reads GitHub's public search API (no token needed, uses GITHUB_TOKEN if set). Only PRs to
# repos not owned by frogscooper, newest first.
#   index.html: the 5 latest, between <!-- prs:start --> and <!-- prs:end -->
#   open-source/index.html (optional 2nd arg): every PR, between <!-- prs-all:start --> and
#   <!-- prs-all:end -->, plus the count between <!-- prs-count:start --> and <!-- prs-count:end -->
import json, os, re, sys, html, datetime, urllib.parse, urllib.request

USER, N = 'frogscooper', 5

def get(url):
    headers = {'User-Agent': USER + '-site', 'Accept': 'application/vnd.github+json'}
    if os.environ.get('GITHUB_TOKEN'):
        headers['Authorization'] = 'Bearer ' + os.environ['GITHUB_TOKEN']
    req = urllib.request.Request(url, headers=headers)
    return json.load(urllib.request.urlopen(req, timeout=30))

q = urllib.parse.quote(f'is:pr author:{USER} -user:{USER}')
items = []
for page in range(1, 11):  # search API caps at 1000 results
    batch = get('https://api.github.com/search/issues?sort=created&order=desc&per_page=100&page=%d&q=%s'
                % (page, q))['items']
    items += batch
    if len(batch) < 100:
        break
if not items:
    sys.exit('search returned no PRs, leaving the pages alone')

def row(it, num):
    repo = it['repository_url'].split('/repos/')[1]
    state = 'merged' if it['pull_request'].get('merged_at') else it['state']  # open / merged / closed
    day = datetime.date.fromisoformat(it['created_at'][:10])
    return (f'<li class="pr"><span class="pr-repo">{html.escape(repo)}</span>'
            + (f'<span class="pr-num">#{it["number"]}</span>' if num else '')
            + f'<a class="pr-title" href="{html.escape(it["html_url"])}">{html.escape(it["title"])}</a>'
            f'<span class="pr-tag {state}">{state}</span>'
            f'<time class="pr-date" datetime="{day}">{day.strftime("%b %d %Y").lower()}</time></li>')

def fill(s, name, inner):
    s2, n = re.subn(r'<!-- %s:start -->.*?<!-- %s:end -->' % (name, name),
                    lambda m: '<!-- %s:start -->%s<!-- %s:end -->' % (name, inner, name), s, flags=re.S)
    assert n == 1, name + ' markers not found'
    return s2

def rows_block(rows):
    return '\n' + '\n'.join('                ' + r for r in rows) + '\n                '

def update(path, edits):
    s = open(path, encoding='utf-8').read()
    s2 = s
    for name, inner in edits:
        s2 = fill(s2, name, inner)
    if s2 != s:
        open(path, 'w', encoding='utf-8').write(s2)
    print(path, 'updated' if s2 != s else 'unchanged')

update(sys.argv[1], [('prs', rows_block([row(it, False) for it in items[:N]]))])
if len(sys.argv) > 2:
    update(sys.argv[2], [('prs-all', rows_block([row(it, True) for it in items])),
                         ('prs-count', str(len(items)))])
print(len(items), 'PRs total')
