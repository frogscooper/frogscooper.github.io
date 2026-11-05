// 27 Strata: rock strata in section, the hero's backdrop — near-level bands of sediment that bend
// and pinch as they drift, lined in caramel, darker and tighter toward the bottom.
// Runs on /_designs/latte-gl.js.
latteField(`
const vec3 TOP = vec3(.16, .10, .065), BOTTOM = vec3(.085, .055, .035), LINE = vec3(.80, .60, .38), BAND = vec3(.24, .155, .095);

void main() {
  vec2 css = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;   // CSS px from the top left
  vec2 p = (gl_FragCoord.xy - .5 * uRes) / uRes.y;                    // y up, screen heights
  float t = uT * .014;

  // depth: mostly the height on screen, folded by slow noise
  float fold = fbm(vec2(p.x * 1.1 + t, p.y * .6)) * .55 + fbm(vec2(p.x * 2.6 - t * .6, p.y * 1.4 + 3.)) * .18;
  float depth = -p.y + fold;
  vec3 col = mix(TOP, BOTTOM, ss(-.5, .7, -p.y));

  float k = depth * 22.;
  float layer = floor(k);
  col = mix(col, BAND, step(.5, hash(vec2(layer, 3.))) * .45);        // alternate beds a shade lighter
  float f = fract(k), d = min(f, 1. - f);                             // distance to the bed's edge
#ifdef HAS_DER
  float px = fwidth(k);
#else
  float px = .05;
#endif
  float major = 1. - step(.5, mod(layer, 4.));
  float lw = mix(.45, 1., major) * px;
  col = mix(col, LINE, (1. - ss(lw, lw + px, d)) * mix(.16, .4, major));

  col += (hash(floor(css)) - .5) * .02;
  gl_FragColor = vec4(col, 1.);
}
`, { scale: 1, speed: 1 });
