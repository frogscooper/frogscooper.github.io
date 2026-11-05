// frogscooper.dev, Instrument (from _designs/28-instrument): the board behind every page. One
// full-screen shader on a fixed canvas; it renders at most ~30 fps, stops while the tab is hidden,
// and draws one still frame for visitors who prefer reduced motion. Without WebGL the html
// background colour from instrument.css shows instead.
window.latteField = (src, { scale = .6, speed = 1 } = {}) => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const c = document.createElement('canvas');
  c.setAttribute('aria-hidden', 'true');
  c.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100vh;height:100lvh;z-index:-1;display:block;pointer-events:none';
  document.body.prepend(c);
  const gl = c.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) { c.remove(); return; }
  // fwidth() for crisp lines where the GPU has it; shaders check #ifdef HAS_DER for a fallback.
  const der = gl.getExtension('OES_standard_derivatives');
  const FS = `${der ? '#extension GL_OES_standard_derivatives : enable\n#define HAS_DER\n' : ''}precision highp float;
uniform vec2 uRes;uniform float uT,uDpr;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}
// smoothstep that also takes falling edges (a > b), which GLSL leaves undefined
float ss(float a,float b,float x){return a<b?smoothstep(a,b,x):1.-smoothstep(b,a,x);}
${src}`;
  const sh = (type, s) => {
    const o = gl.createShader(type); gl.shaderSource(o, s); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.warn('latte shader:', gl.getShaderInfoLog(o));
    return o;
  };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.bindAttribLocation(pr, 0, 'a'); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.warn('latte program:', gl.getProgramInfoLog(pr)); c.remove(); return; }
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(pr, 'uRes'), uT = gl.getUniformLocation(pr, 'uT'), uDpr = gl.getUniformLocation(pr, 'uDpr');

  let t = 40, last = 0, shown = 0, raf = 0;
  const draw = () => { gl.uniform1f(uT, t); gl.drawArrays(gl.TRIANGLES, 0, 3); };
  const fit = () => {
    // Sized to the large viewport, so phones showing/hiding the address bar don't force a rebuild.
    const d = Math.min(devicePixelRatio || 1, 2) * scale, box = c.getBoundingClientRect();
    const w = Math.max(1, Math.round(box.width * d)), h = Math.max(1, Math.round(box.height * d));
    if (w === c.width && h === c.height) return;
    c.width = w; c.height = h;
    gl.viewport(0, 0, w, h); gl.uniform2f(uRes, w, h); gl.uniform1f(uDpr, d);
    draw();
  };
  const loop = now => {
    raf = requestAnimationFrame(loop);
    if (now - shown < 32) return;
    t += (last ? Math.min(.1, (now - last) / 1000) : 0) * speed; last = now; shown = now;
    draw();
  };
  const go = () => { if (!reduce && !raf && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : go()));
  addEventListener('resize', fit);
  fit(); go();
};

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
