/* A dependency-free, perspective-projected 3D security sculpture. */
'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('terminal-input');
  if (input) input.setAttribute('aria-label', 'Terminal command');
  const canvas = document.getElementById('security-core');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const control = document.getElementById('motion-control');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches, visible = true, frame = 0, last = 0, time = .65;
  let w = 0, h = 0, pointerX = 0, pointerY = 0;
  function size() {
    const rect = canvas.getBoundingClientRect();
    w = rect.width; h = rect.height;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    render();
  }
  function project(x, y, z, a, b) {
    const xx = x * Math.cos(a) + z * Math.sin(a);
    const zz = -x * Math.sin(a) + z * Math.cos(a);
    const yy = y * Math.cos(b) - zz * Math.sin(b);
    const depth = y * Math.sin(b) + zz * Math.cos(b);
    const scale = Math.min(w, h) * .29 * 4 / (4 + depth);
    return [w / 2 + xx * scale, h / 2 + yy * scale, depth];
  }
  function render() {
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const light = document.body.classList.contains('professional-theme');
    const rgb = light ? '56,112,32' : '181,255,98';
    const glow = ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,h*.48);
    glow.addColorStop(0,`rgba(${rgb},.09)`); glow.addColorStop(1,`rgba(${rgb},0)`);
    ctx.fillStyle=glow; ctx.fillRect(0,0,w,h);
    const a=time*.22+pointerX*.25, b=.55+pointerY*.2;
    const paths=[];
    // Three intersecting toroidal shells: each is a real 3D point mesh.
    for(let shell=0;shell<3;shell++) {
      for(let ring=0;ring<16;ring++) {
        const pts=[];
        for(let j=0;j<=96;j++) {
          const u=j/96*Math.PI*2,v=ring/16*Math.PI*2;
          const r=1.03+.15*Math.cos(v);
          let x=r*Math.cos(u),y=.15*Math.sin(v),z=r*Math.sin(u);
          if(shell===1) [x,y,z]=[y,z,x];
          if(shell===2) [x,y,z]=[z*.707-y*.707,z*.707+y*.707,x];
          pts.push(project(x,y,z,a,b));
        }
        paths.push(pts);
      }
    }
    paths.sort((p,q)=>q.reduce((v,p)=>v+p[2],0)-p.reduce((v,p)=>v+p[2],0));
    for(const pts of paths) {
      ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
      ctx.strokeStyle=`rgba(${rgb},${light?.27:.34})`;ctx.lineWidth=.65;ctx.stroke();
    }
    // Faceted inner octahedron with depth-sorted translucent faces.
    const vertices=[[0,-.7,0],[.6,0,0],[0,0,.6],[-.6,0,0],[0,0,-.6],[0,.7,0]].map(p=>project(...p,-a*1.7,.4));
    const faces=[[0,1,2],[0,2,3],[0,3,4],[0,4,1],[5,2,1],[5,3,2],[5,4,3],[5,1,4]];
    faces.sort((p,q)=>q.reduce((s,i)=>s+vertices[i][2],0)-p.reduce((s,i)=>s+vertices[i][2],0));
    faces.forEach((face,i)=>{ctx.beginPath();face.forEach((v,j)=>j?ctx.lineTo(vertices[v][0],vertices[v][1]):ctx.moveTo(vertices[v][0],vertices[v][1]));ctx.closePath();ctx.fillStyle=`rgba(${rgb},${.04+i*.012})`;ctx.fill();ctx.strokeStyle=`rgba(${rgb},.7)`;ctx.lineWidth=1;ctx.stroke();});
    for(let i=0;i<12;i++){const u=i/12*Math.PI*2;const p=project(1.43*Math.cos(u),0,1.43*Math.sin(u),a,b);ctx.fillStyle=`rgba(${rgb},.75)`;ctx.fillRect(p[0]-1.5,p[1]-1.5,3,3);}
    ctx.strokeStyle=`rgba(${rgb},.25)`;ctx.lineWidth=.7;
    [[20,52],[w-20,52],[20,h-50],[w-20,h-50]].forEach(([x,y])=>{ctx.beginPath();ctx.moveTo(x-5,y);ctx.lineTo(x+5,y);ctx.moveTo(x,y-5);ctx.lineTo(x,y+5);ctx.stroke();});
  }
  function tick(now){frame=0;if(paused||!visible||document.hidden)return;if(last)time+=Math.min((now-last)/1000,.05);last=now;render();frame=requestAnimationFrame(tick);}
  function sync(){cancelAnimationFrame(frame);frame=0;last=0;control.setAttribute('aria-pressed',String(paused));control.setAttribute('aria-label',paused?'Play 3D animation':'Pause 3D animation');control.textContent=paused?'Play motion ▷':'Pause motion Ⅱ';render();if(!paused&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
  control.addEventListener('click',()=>{paused=!paused;sync();});
  reduced.addEventListener('change',e=>{paused=e.matches;sync();});
  canvas.addEventListener('pointermove',e=>{if(paused)return;const r=canvas.getBoundingClientRect();pointerX=(e.clientX-r.left)/r.width-.5;pointerY=(e.clientY-r.top)/r.height-.5;});
  canvas.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;});
  new ResizeObserver(size).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(canvas);
  new MutationObserver(render).observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',sync);
  size();sync();
});
