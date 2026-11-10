/* The original toroidal Security Core, projected in 3D without a WebGL dependency.
   All transformation phases are deterministic functions of native scroll progress. */
'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('security-core');
  const slot = document.querySelector('.core-scene');
  const track = document.getElementById('core-story');
  const stage = document.querySelector('.hero-stage');
  if (!canvas || !slot || !track || !stage) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    slot.classList.add('story-fallback');
    slot.insertAdjacentHTML('beforeend', '<p class="core-fallback">DHIYAN<br><small>SECURITY / SYSTEMS / SOFTWARE</small></p>');
    return;
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 768px)');
  const short = matchMedia('(max-height: 700px)');
  const control = document.getElementById('motion-control');
  const phase = document.getElementById('core-phase');
  const caption = document.getElementById('story-caption');
  const progressLine = document.querySelector('.story-progress span');
  const stopEvents = new AbortController();
  const options = { signal: stopEvents.signal, passive: true };
  const groupSelectors = ['.projects-window .project-card', '.skill-node', '#identity', '.contact-window'];
  const groups = groupSelectors.map(selector => [...document.querySelectorAll(selector)]);
  const protectedElements = [...document.querySelectorAll('.hero-statement, .section-heading, .hero-bottom, .stack-ribbon, .terminal-window:not(.projects-window), .project-card, .credential-tile, .site-footer, .core-label, .scene-caption, .motion-control')];
  const anchors = ['.projects-window', '.skill-network', '#identity', '.contact-window'].map(selector => document.querySelector(selector));
  let simple = reduced.matches, userReduced = false;
  let w = 0, h = 0, ratio = 1, frame = 0, lastFrame = 0, idle = 0, pointerX = 0, pointerY = 0;
  let geometry, dirty = true, destroyed = false, currentPhase = -1;
  const clamp = value => Math.max(0, Math.min(1, value));
  const mix = (a,b,t) => a+(b-a)*t;
  const smooth = (a,b,v) => { const t=clamp((v-a)/(b-a)); return t*t*(3-2*t); };
  document.body.append(canvas);
  canvas.classList.add('story-canvas');
  canvas.setAttribute('aria-hidden','true');

  function configure() {
    simple = reduced.matches || userReduced;
    document.body.classList.toggle('story-active', !simple);
    document.body.classList.toggle('story-reduced', simple);
    control.setAttribute('aria-pressed', String(simple));
    control.setAttribute('aria-label', simple ? 'Enable full motion' : 'Reduce motion');
    control.textContent = simple ? 'Full motion ▷' : 'Reduce motion Ⅱ';
    document.dispatchEvent(new Event('portfolio-motion-change'));
    dirty = true;
    schedule();
  }
  function size() {
    w = innerWidth; h = innerHeight;
    ratio = Math.min(devicePixelRatio || 1, compact.matches ? 1.5 : 2);
    canvas.width = Math.round(w*ratio); canvas.height = Math.round(h*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    dirty = true; schedule();
  }
  function measure() {
    const r = slot.getBoundingClientRect();
    const tr = track.getBoundingClientRect();
    const stageHeight = stage.getBoundingClientRect().height;
    const travel = Math.max(1,tr.height-stageHeight);
    let p = clamp(((compact.matches ? 78 : 86)-tr.top)/travel);
    if (short.matches) p = clamp(-r.top / Math.max(1,r.height*.8));
    geometry = {
      r, p: simple ? 0 : p,
      groups: groupSelectors.map(selector=>[...document.querySelectorAll(selector)].map(e=>e.getBoundingClientRect())),
      anchors: anchors.map(e=>e?.getBoundingClientRect().top ?? Infinity),
      protectedRects:protectedElements.map(e=>e.getBoundingClientRect()).filter(r=>r.bottom>0&&r.top<h),
      light:document.body.classList.contains('professional-theme')
    };
    dirty = false;
  }
  function project(x,y,z,a,b,zoom=1) {
    const xx=x*Math.cos(a)+z*Math.sin(a), zz=-x*Math.sin(a)+z*Math.cos(a);
    const yy=y*Math.cos(b)-zz*Math.sin(b), depth=y*Math.sin(b)+zz*Math.cos(b);
    const r=geometry.r;
    const scale=Math.min(r.width,r.height)*.29*zoom*4/(4+depth);
    return [r.left+r.width/2+xx*scale,r.top+r.height/2+yy*scale,depth,scale];
  }
  function shellPoint(u,shell) {
    let x=1.03*Math.cos(u),y=0,z=1.03*Math.sin(u);
    if(shell===1)[x,y,z]=[y,z,x];
    if(shell===2)[x,y,z]=[z*.707-y*.707,z*.707+y*.707,x];
    return [x,y,z];
  }
  function borderPoint(rect,t,padding=6) {
    const x=rect.left-padding,y=rect.top-padding,rw=rect.width+padding*2,rh=rect.height+padding*2;
    const distance=t*2*(rw+rh);
    if(distance<rw)return [x+distance,y,0];
    if(distance<rw+rh)return [x+rw,y+distance-rw,Math.PI/2];
    if(distance<rw*2+rh)return [x+rw-(distance-rw-rh),y+rh,Math.PI];
    return [x,y+rh-(distance-rw*2-rh),-Math.PI/2];
  }
  function tileRects() {
    const r=geometry.r, width=Math.min(r.width*.78,440), gap=12;
    const columns=compact.matches?2:3, rows=6/columns;
    const tw=(width-gap*(columns-1))/columns, th=compact.matches?61:92;
    return Array.from({length:6},(_,i)=>({left:r.left+(r.width-width)/2+(i%columns)*(tw+gap),top:r.top+(r.height-(th*rows+gap*(rows-1)))/2+Math.floor(i/columns)*(th+gap),width:tw,height:th}));
  }
  function groupPoint(rects,index,count) {
    const group=index%rects.length;
    const local=Math.floor(index/rects.length);
    const perGroup=Math.ceil((count-group)/rects.length);
    return borderPoint(rects[group],(local+.5)/perGroup);
  }
  function drawRings(a,b,zoom,alpha,rgb) {
    if(alpha<=.01)return;
    ctx.lineWidth=.65;
    const rings=compact.matches?8:12, steps=compact.matches?48:72;
    for(let shell=0;shell<3;shell++)for(let ring=0;ring<rings;ring++){
      const v=ring/rings*Math.PI*2;
      ctx.beginPath();
      for(let j=0;j<=steps;j++){
        const u=j/steps*Math.PI*2,r=1.03+.15*Math.cos(v);
        let x=r*Math.cos(u),y=.15*Math.sin(v),z=r*Math.sin(u);
        if(shell===1)[x,y,z]=[y,z,x];
        if(shell===2)[x,y,z]=[z*.707-y*.707,z*.707+y*.707,x];
        const p=project(x,y,z,a,b,zoom);j?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);
      }
      ctx.strokeStyle=`rgba(${rgb},${alpha*.44})`;ctx.stroke();
    }
    const vertices=[[0,-.7,0],[.6,0,0],[0,0,.6],[-.6,0,0],[0,0,-.6],[0,.7,0]].map(p=>project(...p,-a*1.7,.4,zoom));
    const faces=[[0,1,2],[0,2,3],[0,3,4],[0,4,1],[5,2,1],[5,3,2],[5,4,3],[5,1,4]];
    faces.sort((p,q)=>q.reduce((s,i)=>s+vertices[i][2],0)-p.reduce((s,i)=>s+vertices[i][2],0));
    faces.forEach((face,i)=>{ctx.beginPath();face.forEach((v,j)=>j?ctx.lineTo(vertices[v][0],vertices[v][1]):ctx.moveTo(vertices[v][0],vertices[v][1]));ctx.closePath();ctx.fillStyle=`rgba(${rgb},${(.04+i*.012)*alpha})`;ctx.fill();ctx.strokeStyle=`rgba(${rgb},${alpha*.42})`;ctx.stroke();});
  }
  function drawName(a,b,zoom,alpha,rgb) {
    if(alpha<.01||document.body.classList.contains('webgl-name-ready'))return;
    const letters='DHIYAN';
    for(let i=0;i<letters.length;i++){
      const x=(i-2.5)*.185;
      const origin=project(x,0,-.12,a,b,zoom),right=project(x+.14,0,-.12,a,b,zoom),up=project(x,-.18,-.12,a,b,zoom);
      ctx.save();
      ctx.transform((right[0]-origin[0])/20,(right[1]-origin[1])/20,(origin[0]-up[0])/26,(origin[1]-up[1])/26,origin[0],origin[1]);
      ctx.font='800 26px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.globalAlpha=alpha;ctx.fillStyle=geometry.light?'#163a20':'#e7ffd6';
      ctx.shadowColor=`rgba(${rgb},.4)`;ctx.shadowBlur=6;
      ctx.fillText(letters[i],0,0);ctx.restore();
    }
  }
  function render() {
    if(dirty||!geometry)measure();
    ctx.clearRect(0,0,w,h);
    const {r,p,light}=geometry;
    const rgb=light?'56,112,32':'181,255,98';
    const breakApart=smooth(.16,.58,p),form=smooth(.52,.96,p);
    // Idle motion fades out before fragmentation so reverse scrolling follows the same path.
    const a=-.32+(simple?0:Math.sin(idle*.22)*.48*(1-smooth(0,.18,p)))+p*.9+pointerX*.15*(1-breakApart);
    const b=.55+pointerY*.12*(1-breakApart),zoom=1+smooth(0,.25,p)*.14;
    document.dispatchEvent(new CustomEvent('core-frame',{detail:{p,a,pointerX,pointerY,simple}}));
    if(r.bottom>0&&r.top<h){
      const glow=ctx.createRadialGradient(r.left+r.width/2,r.top+r.height/2,0,r.left+r.width/2,r.top+r.height/2,r.height*.5);
      glow.addColorStop(0,`rgba(${rgb},${.07*(1-form)})`);glow.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=glow;ctx.fillRect(r.left,r.top,r.width,r.height);
      drawRings(a,b,zoom,1-smooth(.17,.42,p),rgb);
      drawName(a,b,zoom,1-smooth(.2,.5,p),rgb);
    }
    if(simple){
      phase.textContent='FIG. 01 / SECURITY CORE';
      caption.textContent='ONE CORE. MANY POSSIBILITIES.';
      currentPhase=-1;
      return;
    }
    const tiles=tileRects(),count=compact.matches?36:72, perShell=count/3;
    const stages=geometry.anchors.map(top=>smooth(0,1,(h*.94-top)/(h*.52)));
    const fragments=[];
    for(let i=0;i<count;i++){
      const shell=Math.floor(i/perShell),u=(i%perShell+.5)/perShell*Math.PI*2;
      const source=shellPoint(u,shell);
      const expansion=1+breakApart*.38;
      const exploded=project(source[0]*expansion,source[1]*expansion+Math.sin(u*2+shell)*breakApart*.24,source[2]*expansion,a+breakApart*.25,b,zoom);
      const target=groupPoint(tiles,i,count);
      let x=mix(exploded[0],target[0],form),y=mix(exploded[1],target[1],form);
      let angle=mix(u+a+breakApart*(shell%2?1:-1),target[2],form);
      let length=mix(20+(exploded[2]+1)*4,compact.matches?11:17,form),alpha=smooth(.17,.32,p)*.72;
      for(let j=0;j<groups.length;j++){
        if(!geometry.groups[j].length)continue;
        const destination=groupPoint(geometry.groups[j],i,count),t=stages[j];
        x=mix(x,destination[0],t);y=mix(y,destination[1],t);angle=mix(angle,destination[2],t);
        length=mix(length,j===3?8:13,t);alpha=mix(alpha,j===3?.14:.28,t);
      }
      if(x<-30||x>w+30||y<-30||y>h+30||alpha<.01)continue;
      if(geometry.protectedRects.some(rect=>x>rect.left-3&&x<rect.right+3&&y>rect.top-3&&y<rect.bottom+3))continue;
      fragments.push({x,y,angle,length,alpha,depth:exploded[2]});
    }
    fragments.sort((a,b)=>b.depth-a.depth);
    fragments.forEach(f=>{
      ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.angle);
      const thickness=mix(4,1.2,Math.max(form,...stages));
      ctx.beginPath();ctx.moveTo(-f.length/2,-thickness);ctx.lineTo(f.length/2,-thickness*.3);ctx.lineTo(f.length*.35,thickness);ctx.lineTo(-f.length*.5,thickness*.3);ctx.closePath();
      ctx.fillStyle=`rgba(${rgb},${f.alpha*.18})`;ctx.strokeStyle=`rgba(${rgb},${f.alpha})`;ctx.lineWidth=.8;ctx.fill();ctx.stroke();ctx.restore();
    });
    const labels=['PYTHON','FASTAPI','LINUX','API SECURITY','PENTESTING','BACKEND'];
    const tileAlpha=form*(1-stages[0]);
    if(tileAlpha>.01)tiles.forEach((tile,i)=>{
      if(tile.top>h||tile.top+tile.height<0)return;
      if(geometry.protectedRects.some(rect=>tile.left<rect.right&&tile.left+tile.width>rect.left&&tile.top<rect.bottom&&tile.top+tile.height>rect.top))return;
      ctx.fillStyle=light?`rgba(245,249,239,${tileAlpha*.9})`:`rgba(14,25,17,${tileAlpha*.9})`;ctx.fillRect(tile.left+2,tile.top+2,tile.width-4,tile.height-4);
      ctx.strokeStyle=`rgba(${rgb},${tileAlpha*.18})`;ctx.strokeRect(tile.left,tile.top,tile.width,tile.height);
      ctx.fillStyle=`rgba(${rgb},${tileAlpha*.85})`;ctx.font=`${compact.matches?8:9}px monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(labels[i],tile.left+tile.width/2,tile.top+tile.height/2);
    });
    const nextPhase=p<.2?0:p<.62?1:2;
    if(currentPhase!==nextPhase){
      currentPhase=nextPhase;
      phase.textContent=['FIG. 01 / SECURITY CORE','FIG. 02 / DECONSTRUCT','FIG. 03 / BUILD THE SYSTEM'][nextPhase];
      caption.textContent=['ONE CORE. MANY POSSIBILITIES.','UNDERSTAND EVERY LAYER.','TURN KNOWLEDGE INTO SYSTEMS.'][nextPhase];
    }
    progressLine.style.transform=`scaleX(${p})`;
  }
  function tick(now) {
    frame=0;
    if(destroyed||document.hidden)return;
    const elapsed=now-lastFrame;
    // Cap idle rendering at 30fps; scroll updates always render immediately.
    if(dirty||elapsed>=32){idle+=Math.min(elapsed/1000,.05);lastFrame=now;render();}
    if(!simple&&geometry&&geometry.p<.22&&geometry.r.bottom>0&&geometry.r.top<h)frame=requestAnimationFrame(tick);
  }
  function schedule(){if(!frame&&!destroyed&&!document.hidden)frame=requestAnimationFrame(tick);}
  function invalidate(){dirty=true;schedule();}
  function cleanup(){destroyed=true;cancelAnimationFrame(frame);frame=0;stopEvents.abort();resize.disconnect();theme.disconnect();}
  const resize=new ResizeObserver(invalidate);resize.observe(document.querySelector('main'));
  const theme=new MutationObserver(invalidate);theme.observe(document.body,{attributes:true,attributeFilter:['class']});
  addEventListener('scroll',invalidate,options);
  addEventListener('resize',size,options);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{lastFrame=performance.now();invalidate();}},options);
  slot.addEventListener('pointermove',e=>{if(simple)return;const r=slot.getBoundingClientRect();pointerX=(e.clientX-r.left)/r.width-.5;pointerY=(e.clientY-r.top)/r.height-.5;invalidate();},options);
  slot.addEventListener('pointerleave',()=>{pointerX=pointerY=0;invalidate();},options);
  control.addEventListener('click',()=>{userReduced=!simple;configure();}, {signal:stopEvents.signal});
  reduced.addEventListener('change',configure,{signal:stopEvents.signal});
  compact.addEventListener('change',size,{signal:stopEvents.signal});
  addEventListener('pagehide',e=>{if(!e.persisted)cleanup();else{cancelAnimationFrame(frame);frame=0;}},{signal:stopEvents.signal});
  addEventListener('pageshow',invalidate,options);
  configure();size();
});
