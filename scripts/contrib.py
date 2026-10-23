import re, json, sys, datetime
s = open(sys.argv[1], encoding='utf-8').read()
total = int(re.search(r'([\d,]+)\s*contributions\s*in the last year', s).group(1).replace(',', ''))
cells = {m.group(2): (m.group(1), m.group(3)) for m in re.finditer(r'data-date="([\d-]+)" id="(contribution-day-component-\d+-\d+)" data-level="(\d)"', s)}
if not cells:  # attribute order fallback
    for td in re.findall(r'<td[^>]*ContributionCalendar-day[^>]*>', s):
        d = re.search(r'data-date="([\d-]+)"', td).group(1); i = re.search(r'id="([^"]+)"', td).group(1); l = re.search(r'data-level="(\d)"', td).group(1)
        cells[i] = (d, l)
days = {}
for m in re.finditer(r'for="(contribution-day-component-\d+-\d+)"[^>]*>([^<]*)<', s):
    d, l = cells[m.group(1)]; t = m.group(2)
    n = 0 if t.startswith('No contributions') else int(re.match(r'([\d,]+)', t).group(1).replace(',', ''))
    days[d] = [n, int(l)]
out = {"user": "frogscooper", "total": total, "from": min(days), "to": max(days),
       "fetched": datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
       "days": [[d] + days[d] for d in sorted(days)]}
assert sum(v[0] for v in days.values()) == total, (sum(v[0] for v in days.values()), total)
try:  # nothing new: leave the file alone so the scheduled job doesn't commit a bare timestamp
    old = json.load(open(sys.argv[2], encoding='utf-8'))
except (OSError, ValueError):
    old = None
if old and old.get('total') == total and old.get('days') == out['days']:
    print('unchanged', total)
    sys.exit(0)
json.dump(out, open(sys.argv[2], 'w'), separators=(',', ':'))
print(total, out['from'], out['to'], len(days), 'active days', sum(1 for v in days.values() if v[0]), 'max', max(v[0] for v in days.values()))
