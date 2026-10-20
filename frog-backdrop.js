/*! frog-backdrop.js · two dithered WebGL backdrops for frogscooper.dev with a toggle switch.
 *  No dependencies. Put <span data-frog-toggle></span> where the switch should go (e.g. in your nav),
 *  then load this file from your page with a deferred script tag (src="/frog-backdrop.js").
 *  Keep html/body backgrounds transparent so the canvas shows through. */
(() => {
  const SCENES = [{"id":"paper-lilypad","label":"Pond","name":"Paper Lilypad","pal":["#f4f1e8","#e3e2cc","#c3c99b","#8a9e5c","#4c6b34","#1d3318"],"px":3,"inks":5,"range":0.6,"speed":0.8},{"id":"swiss-contour","label":"Contour","name":"Swiss Contour","pal":["#ffffff","#eef1ec","#cfd8cc","#9aae95","#4f6b4f","#18261a"],"px":2,"inks":5,"range":0.8,"speed":1}];
  const KEY = 'frog-bg';
  let cur = 0;
  try { cur = Math.max(0, SCENES.findIndex(s => s.id === localStorage.getItem(KEY))); } catch (e) {}

  const FS = `precision highp float;
uniform vec2 uRes;uniform float uT,uMix,uFrom,uTo;
uniform vec3 uA0,uA1,uA2,uA3,uA4,uA5,uB0,uB1,uB2,uB3,uB4,uB5;
uniform vec4 uCfgA,uCfgB; // px, inks, range, field-id
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}
float b2(vec2 a){a=floor(a);return fract(a.x/2.+a.y*a.y*.75);}
float b4(vec2 a){return b2(.5*a)*.25+b2(a);}
float b8(vec2 a){return b4(.5*a)*.25+b2(a);}
float field0(vec2 p,float t){float f=0.;{f=.2+.14*fbm(p*3.+t*.04);
  for(int i=0;i<3;i++){float fi=float(i);float cy=t*.15+fi*.33;
   vec2 c=vec2(hash(vec2(fi,floor(cy)))*1.4-.7,hash(vec2(fi+9.,floor(cy)))*.8-.4);
   float ph=fract(cy);float r=length(p-c);
   f+=.32*(1.-ph)*(exp(-pow((r-ph*.55)*28.,2.))+.5*exp(-pow((r-ph*.38)*34.,2.)));}
  for(int i=0;i<5;i++){float fi=float(i);
   vec2 c=vec2(-.62+fi*.31+.04*sin(t*.11+fi*2.),.22*sin(fi*2.7)+.03*cos(t*.13+fi));
   float R=.085+.035*fract(fi*.61);vec2 d=p-c;float l=length(d);
   f-=.12*(1.-smoothstep(R,R+.035,length(d+vec2(-.012,.016))));
   float a=atan(d.y,d.x)-(t*.04*(fi-2.)+fi*1.3);
   if(l<R&&cos(a)<.965){float rr=l/R;
    f=.5+.16*(1.-rr)+.07*(.5+.5*cos(a*11.))*rr+.18*smoothstep(.86,.98,rr);
    if(i==2&&l<R*.32)f=.97-.25*l/(R*.32);}}
  f=clamp(f,0.,1.);}return clamp(f,0.,1.);}
float field1(vec2 p,float t){float f=0.;{float h=fbm(p*1.6+vec2(t*.015,-t*.01));
  float x=h*14.;float d=min(fract(x),1.-fract(x));
  float line=1.-smoothstep(0.,.09,d);
  float major=1.-smoothstep(0.,.05,min(fract(x/5.),1.-fract(x/5.))*5.);
  f=clamp(.12+.3*h+.22*line+.25*major,0.,1.);}return clamp(f,0.,1.);}
vec3 palA(float x){x=clamp(x,0.,1.)*5.;vec3 c=mix(uA0,uA1,clamp(x,0.,1.));c=mix(c,uA2,clamp(x-1.,0.,1.));c=mix(c,uA3,clamp(x-2.,0.,1.));c=mix(c,uA4,clamp(x-3.,0.,1.));return mix(c,uA5,clamp(x-4.,0.,1.));}
vec3 palB(float x){x=clamp(x,0.,1.)*5.;vec3 c=mix(uB0,uB1,clamp(x,0.,1.));c=mix(c,uB2,clamp(x-1.,0.,1.));c=mix(c,uB3,clamp(x-2.,0.,1.));c=mix(c,uB4,clamp(x-3.,0.,1.));return mix(c,uB5,clamp(x-4.,0.,1.));}
float quant(float f,float th,float L){float t=clamp(f,0.,1.)*(L-1.);float b=floor(t);return (b+step(th,t-b))/(L-1.);}
float scene(float id,vec2 p,float t){return id<.5?field0(p,t):field1(p,t);}
vec3 render(vec4 cfg,bool useA,float t){
 vec2 cell=floor(gl_FragCoord.xy/cfg.x);
 vec2 p=((cell+.5)*cfg.x-.5*uRes)/uRes.y;
 float q=quant(scene(cfg.w,p,t)*cfg.z,b8(cell),cfg.y);
 return useA?palA(q):palB(q);}
void main(){
 vec3 col;
 if(uMix>=1.)col=render(uCfgB,false,uT);
 else{
  vec3 from=render(uCfgA,true,uT);
  if(uMix<=0.)col=from;
  else{vec3 to=render(uCfgB,false,uT);col=b8(floor(gl_FragCoord.xy/max(uCfgA.x,uCfgB.x))+3.)<uMix?to:from;}
 }
 gl_FragColor=vec4(col,1.);
}`;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const root = document.documentElement;
  const setGround = () => { root.style.backgroundColor = SCENES[cur].pal[0]; };
  setGround();

  function init() {
    const c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;display:block;pointer-events:none';
    document.body.prepend(c);
    const gl = c.getContext('webgl', { antialias: false, alpha: false });

    // ---- toggle ----
    const css = document.createElement('style');
    css.textContent = `.frog-bg-toggle{appearance:none;background:none;border:0;padding:4px 0;margin:0;color:inherit;font:inherit;letter-spacing:inherit;text-transform:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:.5em;line-height:1}
.frog-bg-toggle .fb-l{opacity:.45;transition:opacity .2s}.frog-bg-toggle .fb-l.on{opacity:1}
.frog-bg-toggle .fb-t{position:relative;width:28px;height:16px;border:1px solid currentColor;border-radius:999px;box-sizing:border-box;flex:none}
.frog-bg-toggle .fb-k{position:absolute;top:2px;left:2px;width:10px;height:10px;border-radius:50%;background:currentColor;transition:transform .25s}
.frog-bg-toggle[aria-checked="true"] .fb-k{transform:translateX(12px)}
.frog-bg-toggle:focus-visible{outline:2px solid currentColor;outline-offset:3px;border-radius:4px}
.frog-bg-float{position:fixed;z-index:10;top:calc(12px + env(safe-area-inset-top,0px));right:max(12px,env(safe-area-inset-right,0px))}
@media (prefers-reduced-motion:reduce){.frog-bg-toggle .fb-k{transition:none}}`;
    document.head.appendChild(css);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'frog-bg-toggle';
    btn.setAttribute('role', 'switch');
    btn.innerHTML = `<span class="fb-l">${SCENES[0].label}</span><span class="fb-t"><span class="fb-k"></span></span><span class="fb-l">${SCENES[1].label}</span>`;
    const slot = document.querySelector('[data-frog-toggle]');
    if (slot) slot.appendChild(btn); else { btn.classList.add('frog-bg-float'); document.body.appendChild(btn); }
    const labels = btn.querySelectorAll('.fb-l');
    const syncBtn = () => {
      btn.setAttribute('aria-checked', String(cur === 1));
      btn.setAttribute('aria-label', `${SCENES[1].label} background`);
      btn.title = `Background: ${SCENES[cur].name}`;
      labels[0].classList.toggle('on', cur === 0); labels[1].classList.toggle('on', cur === 1);
    };
    syncBtn();

    if (!gl) { btn.hidden = true; return; }
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.bindAttribLocation(pr, 0, 'a'); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { btn.hidden = true; c.remove(); return; }
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const u = n => gl.getUniformLocation(pr, n);

    let dpr = 1, from = cur, mix = 1, t = 17, last = 0, running = false;
    const bind = (slotName, i) => {
      const s = SCENES[i];
      s.pal.forEach((h, j) => gl.uniform3f(u('u' + slotName + j), ...hex(h)));
      gl.uniform4f(u('uCfg' + slotName), Math.max(1, Math.round(s.px * dpr)), s.inks, s.range, i);
    };
    const draw = () => {
      gl.uniform1f(u('uT'), t); gl.uniform1f(u('uMix'), mix);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const fit = () => {
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      c.width = Math.round(innerWidth * dpr); c.height = Math.round(innerHeight * dpr);
      gl.viewport(0, 0, c.width, c.height); gl.uniform2f(u('uRes'), c.width, c.height);
      bind('A', from); bind('B', cur); draw();
    };
    const loop = now => {
      const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
      if (!reduce) t += dt * SCENES[cur].speed;
      if (mix < 1) mix = Math.min(1, mix + dt / .7);
      draw();
      if (!reduce || mix < 1) requestAnimationFrame(loop); else { running = false; last = 0; }
    };
    const start = () => { if (!running) { running = true; last = 0; requestAnimationFrame(loop); } };

    btn.addEventListener('click', () => {
      from = cur; cur = 1 - cur; mix = reduce ? 1 : 0;
      try { localStorage.setItem(KEY, SCENES[cur].id); } catch (e) {}
      bind('A', from); bind('B', cur); setGround(); syncBtn();
      if (reduce) draw(); else start();
    });
    addEventListener('resize', fit);
    fit();
    if (!reduce) start();
  }
  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);
})();
