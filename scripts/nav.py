# One nav for every page. Edit NAV, then run from the repo root:
#   python3 scripts/nav.py
# Rewrites, in every served .html page that has them:
#   <!-- nav:start --> ... <!-- nav:end -->      the tabs under the page header (links on this site),
#                                                marking the current page with aria-current="page"
#   <!-- links:start --> ... <!-- links:end -->  the top bar's links that leave the site (http...)
# Folders starting with _ or . are skipped (Jekyll doesn't serve them, and _designs keeps its own nav).
# Styles live in assets/pond.css.
import os, re, sys

NAV = [
    ('Home', '/'),
    ('Open Source', '/open-source/'),
    ('Research', '/research/'),
    ('Contact', '/contact/'),
    ('Lilypad', 'https://lilypad.frogscooper.dev'),
    ('GitHub', 'https://github.com/frogscooper'),
]

def tabs(here):
    ind, cur = ' ' * 8, ' aria-current="page"'
    return '\n' + ''.join(f'{ind}<a href="{h}"{cur if h == here else ""}>{l}</a>\n'
                          for l, h in NAV if not h.startswith('http')) + ind[:-2]

def links():
    ind = ' ' * 8
    return '\n' + ''.join(f'{ind}<a class="ext" href="{h}">{l} ↗</a>\n' for l, h in NAV if h.startswith('http')) + ind[:-2]

def fill(s, start, end, inner, path):
    s2, n = re.subn(re.escape(start) + '.*?' + re.escape(end), lambda m: start + inner + end, s, flags=re.S)
    assert n == 1, f'{path}: expected one {start}'
    return s2

root = sys.argv[1] if len(sys.argv) > 1 else '.'
for dirpath, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if not d.startswith(('.', '_')) and d != 'node_modules']
    for f in sorted(files):
        if not f.endswith('.html'):
            continue
        path = os.path.join(dirpath, f)
        s = open(path, encoding='utf-8').read()
        if '<!-- nav:start -->' not in s:
            continue
        rel = os.path.relpath(path, root).replace(os.sep, '/')
        here = '/' + rel[:-len('index.html')] if rel.endswith('index.html') else '/' + rel
        s2 = fill(s, '<!-- nav:start -->', '<!-- nav:end -->', tabs(here), path)
        if '<!-- links:start -->' in s2:
            s2 = fill(s2, '<!-- links:start -->', '<!-- links:end -->', links(), path)
        if s2 != s:
            open(path, 'w', encoding='utf-8', newline='\n').write(s2)
        print(rel, 'updated' if s2 != s else 'unchanged')
