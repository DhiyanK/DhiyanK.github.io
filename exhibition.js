'use strict';
document.addEventListener('DOMContentLoaded',()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const cards=[...document.querySelectorAll('.project-card')];
 const dialog=document.createElement('dialog');dialog.className='project-detail';dialog.setAttribute('aria-labelledby','detail-title');
 const close=document.createElement('button');close.textContent='Close project ×';close.className='terminal-button';
 const content=document.createElement('div');dialog.append(close,content);document.body.append(dialog);
 function dismiss(){if(reduced.matches){dialog.close();return;}dialog.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateY(20px) scale(.97)'}],{duration:180}).finished.then(()=>dialog.close());}close.addEventListener('click',dismiss);dialog.addEventListener('click',e=>{if(e.target===dialog)dismiss();});dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
 let trigger;
 dialog.addEventListener('close',()=>{document.body.classList.remove('project-open');trigger?.focus();});
 cards.forEach((card,i)=>{
 const button=document.createElement('button');button.className='terminal-button project-explore';button.textContent='Explore project ↗';button.setAttribute('aria-label','Explore '+card.querySelector('h3').textContent);card.append(button);
 button.addEventListener('click',()=>{trigger=button;content.replaceChildren();for(const child of card.children){if(child===button)continue;content.append(child.cloneNode(true));}const title=content.querySelector('h3');title.id='detail-title';dialog.showModal();document.body.classList.add('project-open');if(!reduced.matches)dialog.animate([{opacity:0,transform:'translateY(30px) scale(.94)'},{opacity:1,transform:'none'}],{duration:420,easing:'cubic-bezier(.2,.7,.2,1)'});close.focus();});
 card.addEventListener('pointermove',e=>{if(reduced.matches||e.pointerType==='touch')return;const r=card.getBoundingClientRect();card.style.setProperty('--mx',((e.clientX-r.left)/r.width-.5)*5+'deg');card.style.setProperty('--my',-((e.clientY-r.top)/r.height-.5)*5+'deg');});
 card.addEventListener('pointerleave',()=>{card.style.setProperty('--mx','0deg');card.style.setProperty('--my','0deg');});
 });
 const network=document.querySelector('.skill-network');if(!network)return;
 const data=[['Python','Languages','Python appears in Keystroke Auditor and Secure ATM Interface.'],['FastAPI','Cloud & API','FastAPI is part of my existing cloud and API toolkit.'],['Linux','Systems & Tools','Linux is part of my systems and security toolkit.'],['JavaScript','Languages','JavaScript is listed in my core language stack.'],['AWS','Cloud & API','AWS is listed in my cloud and API toolkit.'],['Pentesting','Security Focus','Penetration testing and API security are my stated areas of interest.']];
 const detail=network.querySelector('.network-detail');
 const graph=document.createElementNS('http://www.w3.org/2000/svg','svg');graph.setAttribute('viewBox','0 0 600 280');graph.setAttribute('aria-hidden','true');graph.classList.add('network-edges');[[0,1],[0,2],[1,4],[2,5],[3,1],[4,5]].forEach(([a,b])=>{const line=document.createElementNS(graph.namespaceURI,'line');line.setAttribute('x1',String(100+(a%3)*200));line.setAttribute('y1',String(70+Math.floor(a/3)*140));line.setAttribute('x2',String(100+(b%3)*200));line.setAttribute('y2',String(70+Math.floor(b/3)*140));line.dataset.nodes=a+' '+b;graph.append(line);});network.querySelector('.network-nodes').prepend(graph);
 const highlight=new MutationObserver(()=>{graph.querySelectorAll('line').forEach(line=>line.classList.toggle('lit',line.dataset.nodes.split(' ').includes(network.dataset.active)));});highlight.observe(network,{attributes:true,attributeFilter:['data-active']});addEventListener('pagehide',e=>{if(!e.persisted)highlight.disconnect();});
 data.forEach(([name,group,description],i)=>{const button=document.createElement('button');button.className='skill-node';button.textContent=name;button.style.setProperty('--node',i);button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>{network.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));detail.textContent=group+' — '+description;});network.querySelector('.network-nodes').append(button);button.addEventListener('focus',()=>network.dataset.active=String(i));button.addEventListener('pointerenter',()=>network.dataset.active=String(i));});
});
