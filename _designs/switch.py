# Put one design live by copying its folder over the served pages:
#   python3 _designs/switch.py 03          (or 03-star-trails, star-trails)
#   python3 _designs/switch.py original    (the site as it was before the designs)
# Overwrites index.html, open-source/, research/ and contact/ at the repo root, and assets/theme/.
# Everything else (slime/, assets/, the workflows) is untouched. Review with git diff, then commit.
import os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

def find(name):
    for d in sorted(os.listdir(HERE)):
        full = os.path.join(HERE, d)
        if os.path.isdir(full) and d != 'src' and (d == name or d.split('-', 1)[0] == name.zfill(2) or d.split('-', 1)[-1] == name):
            return full
    sys.exit(f'no design called {name!r}; pick one of: ' + ', '.join(d for d in sorted(os.listdir(HERE)) if os.path.isdir(os.path.join(HERE, d)) and d != 'src'))

if len(sys.argv) != 2:
    sys.exit(__doc__ or 'usage: python3 _designs/switch.py NN')
src = find(sys.argv[1])
for dirpath, _, files in os.walk(src):
    for f in files:
        rel = os.path.relpath(os.path.join(dirpath, f), src)
        dst = os.path.join(ROOT, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copyfile(os.path.join(dirpath, f), dst)
        print('wrote', rel.replace(os.sep, '/'))
print('now live:', os.path.basename(src))
