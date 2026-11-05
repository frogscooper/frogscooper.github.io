// 24 Umber: a topographic map drifting slowly in the dark: caramel contour lines over deep umber,
// every fifth line heavier, lit a little toward the top. Abstract; latte is only the palette.
// Runs on /_designs/latte-gl.js.
latteField(`
const vec3 UMBER = vec3(.105, .068, .045), LIFT = vec3(.19, .12, .075), LINE = vec3(.80, .60, .38);

void main() {
  vec2 css = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;   // CSS px from the top left
  vec2 p = (gl_FragCoord.xy - .5 * uRes) / uRes.y;                    // y up, screen heights
  float t = uT * .02;

  float h = fbm(p * 1.4 + vec2(t, -t * .5)) + .45 * fbm(p * 3.1 - vec2(t * .7, 0.));
  vec3 col = mix(UMBER, LIFT, ss(.45, 1.1, h));

  // contours sit at k = n + .5; d is the distance to the nearest one, in k units
  float k = h * 16.;
  float d = abs(fract(k) - .5);
#ifdef HAS_DER
  float px = fwidth(k);                                               // k units per pixel: lines stay ~1px
#else
  float px = .04;
#endif
  float major = 1. - step(.5, mod(floor(k), 5.));                     // every fifth contour
  float lw = mix(.5, 1.1, major) * px;                                // half-width
  float line = 1. - ss(lw, lw + px, d);
  line *= mix(.35, .75, major);
  float glow = ss(-.8, .55, p.y);                                     // brighter toward the top
  col = mix(col, LINE, line * (.55 + .45 * glow));

  col += (hash(floor(css)) - .5) * .02;
  gl_FragColor = vec4(col, 1.);
}
`, { scale: 1, speed: 1 });
