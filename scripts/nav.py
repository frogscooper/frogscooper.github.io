# One nav for every page. Edit NAV, then run from the repo root:
#   python3 scripts/nav.py
# Rewrites <!-- nav:start --> ... <!-- nav:end --> and /* nav-css:start */ ... /* nav-css:end */
# in every .html page that has them, and marks the current page with aria-current="page".
# Links starting with http are shown as leaving the site (grouped last, with a small arrow).
import os, re, sys

NAV = [
    ('Home', '/'),
    ('Open Source', '/open-source/'),
    ('Research', '/research/'),
    ('Lilypad', 'https://lilypad.frogscooper.dev'),
    ('Contact', '/contact/'),
    ('GitHub', 'https://github.com/frogscooper'),
]

CSS = '''
    .site-header nav { gap: 8px 20px; }
    .nav-group { display: flex; flex-wrap: wrap; gap: 8px 20px; }
    .nav-group a { color: var(--muted); }
    .nav-group a:hover, .nav-group a[aria-current="page"] { color: var(--ink); }
    .nav-group a[aria-current="page"] { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 5px; }
    .nav-ext { padding-left: 20px; border-left: 1px solid var(--line); }
    .nav-ext a::after { content: "\\2197"; content: "\\2197" / ""; margin-left: 3px; font-size: 0.9em; }
    @media (max-width: 760px) {
      .site-header nav { flex-direction: column; align-items: flex-start; }
      .nav-ext { padding-left: 0; border-left: 0; }
    }
    '''

def block(here):
    def a(label, href, ind):
        cur = ' aria-current="page"' if href == here else ''
        return f'{ind}<a href="{href}"{cur}>{label}</a>\n'
    ind = ' ' * 10
    internal = ''.join(a(l, h, ind) for l, h in NAV if not h.startswith('http'))
    external = ''.join(a(l, h, ind) for l, h in NAV if h.startswith('http'))
    return ('\n      <nav aria-label="Primary">\n'
            f'        <div class="nav-group">\n{internal}        </div>\n'
            f'        <div class="nav-group nav-ext">\n{external}        </div>\n'
            '      </nav>\n      ')

def fill(s, start, end, inner, path):
    s2, n = re.subn(re.escape(start) + '.*?' + re.escape(end), lambda m: start + inner + end, s, flags=re.S)
    assert n == 1, f'{path}: expected one {start}'
    return s2

root = sys.argv[1] if len(sys.argv) > 1 else '.'
for dirpath, dirs, files in os.walk(root):
    dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
    for f in sorted(files):
        if not f.endswith('.html'):
            continue
        path = os.path.join(dirpath, f)
        s = open(path, encoding='utf-8').read()
        if '<!-- nav:start -->' not in s:
            continue
        rel = os.path.relpath(path, root).replace(os.sep, '/')
        here = '/' + rel[:-len('index.html')] if rel.endswith('index.html') else '/' + rel
        s2 = fill(s, '<!-- nav:start -->', '<!-- nav:end -->', block(here), path)
        s2 = fill(s2, '/* nav-css:start */', '/* nav-css:end */', CSS, path)
        if s2 != s:
            open(path, 'w', encoding='utf-8').write(s2)
        print(rel, 'updated' if s2 != s else 'unchanged')
