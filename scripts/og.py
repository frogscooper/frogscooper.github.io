# Renders the social preview image. Edit _designs/og/card.html, then run from the repo root:
#   python3 scripts/og.py
# Serves the repo on a free local port (the card loads /assets/pond.css, /frog-backdrop.js and the
# frog from the live site's files), screenshots the card at 1200x630 with headless Chrome or Edge,
# and writes assets/og.png. Set CHROME to the browser's path if it isn't found.
import functools, http.server, os, shutil, socketserver, subprocess, sys, tempfile, threading

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'og.png')
CANDIDATES = [
    os.environ.get('CHROME', ''),
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    *filter(None, map(shutil.which, ['google-chrome', 'chromium', 'chromium-browser', 'chrome', 'msedge'])),
]
browser = next((c for c in CANDIDATES if c and os.path.exists(c)), None)
if not browser:
    sys.exit('no Chrome/Chromium/Edge found; set CHROME to its path')

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

with socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT)) as srv:
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{srv.server_address[1]}/_designs/og/card.html'
    with tempfile.TemporaryDirectory() as profile:
        subprocess.run([browser, '--headless=new', '--hide-scrollbars', '--window-size=1200,630',
                        # the backdrop is WebGL: render it in software so this works without a GPU
                        '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
                        '--virtual-time-budget=5000', f'--user-data-dir={profile}',
                        f'--screenshot={OUT}', url], check=True, capture_output=True)
    srv.shutdown()
print(os.path.relpath(OUT, ROOT), os.path.getsize(OUT) // 1024, 'KB')
