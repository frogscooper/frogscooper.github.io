// 23 Silk: folds of caramel and cream silk drifting slowly behind the page, with light catching
// the ridges. Abstract; latte is only the palette. Runs on /_designs/latte-gl.js.
latteField(`
const vec3 MOCHA = vec3(.42, .25, .14), CARAMEL = vec3(.69, .46, .27), SAND = vec3(.85, .67, .47), CREAM = vec3(.984, .962, .925);

void main() {
  vec2 css = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;   // CSS px from the top left
  vec2 p = (gl_FragCoord.xy - .5 * uRes) / uRes.y;
  float t = uT * .018;

  // two layers of warped noise give long, soft folds
  vec2 q = p * vec2(1.05, 1.5);
  vec2 w = vec2(fbm(q * 1.3 + vec2(t, 0.)), fbm(q * 1.3 + vec2(3.1, 7.7) - t));
  float m = fbm(q + 1.9 * w + vec2(0., t * .6));
  vec3 col = mix(MOCHA, CARAMEL, ss(.22, .55, m));
  col = mix(col, SAND, ss(.5, .7, m));

  // sheen: bright where the folds crest, falling off softly on either side
  float crest = 1. - abs(fract(m * 6. + w.x * 1.2) - .5) * 2.;
  col = mix(col, CREAM, pow(crest, 6.) * ss(.35, .7, m) * .55);
  col = mix(col, CREAM, ss(.71, .78, m) * .85);

  col += (hash(floor(css)) - .5) * .02;                               // fine grain, still
  gl_FragColor = vec4(col, 1.);
}
`, { scale: .6, speed: 1 });
