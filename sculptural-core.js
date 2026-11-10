import * as T from './vendor/three.module.js';
import {FontLoader} from './vendor/FontLoader.js';
// Progressive WebGL enhancement. The existing canvas remains the fallback.
const slot=document.querySelector('.core-scene');
async function initialize(){
 if(!slot)return;
 let renderer;
 try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
 const canvas=renderer.domElement;canvas.className='sculptural-core';canvas.setAttribute('aria-hidden','true');slot.append(canvas);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.1,40);
 camera.position.z=7;
 scene.add(new T.HemisphereLight(0xeaffdf,0x18221d,2.5));
 const key=new T.DirectionalLight(0xffffff,4);key.position.set(-3,4,5);scene.add(key);
 const rim=new T.DirectionalLight(0xa6cf7a,3);rim.position.set(4,1,-2);scene.add(rim);
 const material=new T.MeshStandardMaterial({color:0xc7d7bd,metalness:.45,roughness:.28,transparent:true});
 const root=new T.Group();scene.add(root);
 let font;
 try{font=new FontLoader().parse(await (await fetch('./vendor/font.json')).json());}catch{renderer.dispose();canvas.remove();return;}
 const letters=[];let offset=0;
 for(const character of 'DHIYAN'){
 const geometry=new T.ExtrudeGeometry(font.generateShapes(character,.65),{depth:.16,bevelEnabled:true,bevelThickness:.018,bevelSize:.012,bevelSegments:2,steps:1,curveSegments:5});geometry.computeBoundingBox();
 const mesh=new T.Mesh(geometry,material);mesh.position.x=offset;root.add(mesh);letters.push(mesh);offset+=geometry.boundingBox.max.x+.065;
 }
 letters.forEach(mesh=>{mesh.position.x-=offset/2;mesh.position.y=-.3;mesh.userData.x=mesh.position.x;});
 const count=innerWidth<769?240:720;
 const shardGeometry=new T.TetrahedronGeometry(.025),shardMaterial=material.clone();
 const shards=new T.InstancedMesh(shardGeometry,shardMaterial,count);scene.add(shards);
 const origins=[];for(let i=0;i<count;i++){const letter=letters[i%6],positions=letter.geometry.attributes.position,index=(i*31)%positions.count;origins.push(new T.Vector3(positions.getX(index)+letter.position.x,positions.getY(index)-.3,positions.getZ(index)));}
 const dummy=new T.Object3D(),temp=new T.Vector3();let alive=true;
 renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<769?1.25:1.75));
 function resize(){const r=slot.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(slot);resize();
 const clamp=x=>Math.max(0,Math.min(1,x));const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
 function draw(event){if(!alive)return;const bounds=slot.getBoundingClientRect();if(bounds.bottom<0||bounds.top>innerHeight)return;const {p,a,pointerX,pointerY,simple}=event.detail;const split=smooth(.15,.45,p),scatter=smooth(.26,.65,p),settle=smooth(.60,.98,p);
 root.rotation.set(pointerY*.12,-.24+a*.36+pointerX*.1,0);root.position.z=smooth(0,.3,p)*.4;
 material.opacity=1-smooth(.24,.40,p);root.visible=material.opacity>.01;
 letters.forEach((mesh,i)=>{mesh.position.x=mesh.userData.x+(i-2.5)*split*.10;mesh.rotation.y=(i-2.5)*split*.06;});root.updateMatrixWorld(true);
 shards.visible=!simple&&p>.24&&p<.99;shardMaterial.opacity=smooth(.24,.36,p)*(1-smooth(.85,.99,p));
 for(let i=0;i<count&&shards.visible;i++){temp.copy(origins[i]).applyMatrix4(root.matrixWorld);const angle=i*2.399963;const radius=.7+(i%13)/13;
 temp.x+=Math.cos(angle)*radius*scatter;temp.y+=Math.sin(angle)*radius*scatter;temp.z+=Math.sin(i*1.7)*scatter*2.8;
 const col=i%3,row=Math.floor(i/3)%2;temp.lerp(new T.Vector3((col-1)*1.15+(i%11)/110,(row-.5)*.85,0),settle);
 dummy.position.copy(temp);dummy.rotation.set(scatter*i*.13,scatter*i*.07,scatter*i*.09);dummy.scale.setScalar(.65+(i%7)/8);dummy.updateMatrix();shards.setMatrixAt(i,dummy.matrix);}
 shards.instanceMatrix.needsUpdate=true;renderer.render(scene,camera);
 }
 document.addEventListener('core-frame',draw);document.body.classList.add('webgl-name-ready');
 function cleanup(){alive=false;document.removeEventListener('core-frame',draw);resizeObserver.disconnect();letters.forEach(m=>m.geometry.dispose());shardGeometry.dispose();shardMaterial.dispose();material.dispose();renderer.dispose();canvas.remove();document.body.classList.remove('webgl-name-ready');}
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cleanup();},{once:true});
 addEventListener('pagehide',e=>{if(!e.persisted)cleanup();},{once:true});
 dispatchEvent(new Event('scroll'));
}
initialize().catch(()=>{});
