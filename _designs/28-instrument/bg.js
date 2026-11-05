// 28 Instrument: the dark board the panels are mounted on — a fine measuring grid (every 24 CSS px,
// heavier every 120) over faint caramel contours drifting slowly, like a plotter's underlay.
// Runs on /_designs/latte-gl.js.
latteField(`
const vec3 BOARD = vec3(.09, .062, .043), GRID = vec3(.30, .22, .15), LINE = vec3(.80, .60, .38);

void main() {
  vec2 css = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;   // CSS px from the top left
  vec2 p = (gl_FragCoord.xy - .5 * uRes) / uRes.y;
  float t = uT * .015;
  vec3 col = BOARD;

  // grid: px from the nearest line per axis, fine and major
  vec2 f = abs(fract(css / 24.) - .5) * 24., F = abs(fract(css / 120.) - .5) * 120.;
  float fine = max(1. - ss(.3, 1., 12. - f.x), 1. - ss(.3, 1., 12. - f.y));
  float big = max(1. - ss(.4, 1.2, 60. - F.x), 1. - ss(.4, 1.2, 60. - F.y));
  col = mix(col, GRID, fine * .22 + big * .35);

  // faint contours, every fourth a little stronger
  float h = fbm(p * 1.2 + vec2(t, -t * .4)) + .4 * fbm(p * 2.7 - vec2(t * .6, 0.));
  float k = h * 13.;
  float d = abs(fract(k) - .5);
#ifdef HAS_DER
  float px = fwidth(k);
#else
  float px = .04;
#endif
  float major = 1. - step(.5, mod(floor(k), 4.));
  float lw = mix(.45, .9, major) * px;
  col = mix(col, LINE, (1. - ss(lw, lw + px, d)) * mix(.14, .3, major));

  col += (hash(floor(css)) - .5) * .015;
  gl_FragColor = vec4(col, 1.);
}
`, { scale: 1, speed: 1 });
