// 26 Atlas: the contour map the plates are laid on — caramel contours drifting slowly over deep
// umber, every fifth heavier, under a faint graticule with survey crosses where its lines meet.
// Runs on /_designs/latte-gl.js.
latteField(`
const vec3 UMBER = vec3(.105, .068, .045), LIFT = vec3(.19, .12, .075), LINE = vec3(.80, .60, .38), GRID = vec3(.55, .40, .27);

void main() {
  vec2 css = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;   // CSS px from the top left
  vec2 p = (gl_FragCoord.xy - .5 * uRes) / uRes.y;
  float t = uT * .016;

  float h = fbm(p * 1.3 + vec2(t, -t * .5)) + .45 * fbm(p * 2.9 - vec2(t * .7, 0.));
  vec3 col = mix(UMBER, LIFT, ss(.45, 1.1, h));

  // contours at k = n + .5; d = distance to the nearest, in k units
  float k = h * 15.;
  float d = abs(fract(k) - .5);
#ifdef HAS_DER
  float px = fwidth(k);
#else
  float px = .04;
#endif
  float major = 1. - step(.5, mod(floor(k), 5.));
  float lw = mix(.5, 1.1, major) * px;
  col = mix(col, LINE, (1. - ss(lw, lw + px, d)) * mix(.3, .65, major));

  // graticule every 160 CSS px, with a cross at each meeting point
  vec2 g = abs(fract(css / 160.) - .5) * 160.;                        // px from the nearest line, per axis
  float grid = max(1. - ss(.4, 1.2, 80. - g.x), 1. - ss(.4, 1.2, 80. - g.y));
  vec2 c = 80. - g;                                                   // px from the nearest crossing
  float cross = (1. - ss(.6, 1.6, min(c.x, c.y))) * (1. - ss(6., 7., max(c.x, c.y)));
  col = mix(col, GRID, grid * .16 + cross * .55);

  col += (hash(floor(css)) - .5) * .02;
  gl_FragColor = vec4(col, 1.);
}
`, { scale: 1, speed: 1 });
