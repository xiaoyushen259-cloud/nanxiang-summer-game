import * as THREE from 'three';
import {box,cylinder,rod,mesh,group} from './art.js';
import {surfaceBox} from './scenery-detail.js';
import {shopGraphic} from './shop-graphics.js';
import {bottle,bowl} from './shop-props.js';

function graphic(p,kind,pos,w,h){
  const m=mesh(p,new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:shopGraphic(kind),roughness:.85}),pos,false);m.castShadow=false;return m;
}
function contactStrip(p,x,z,w,d){
  const c=Object.assign(document.createElement('canvas'),{width:16,height:128}),ctx=c.getContext('2d');
  const g=ctx.createLinearGradient(0,0,0,128);g.addColorStop(0,'rgba(28,32,35,.32)');g.addColorStop(1,'rgba(28,32,35,0)');ctx.fillStyle=g;ctx.fillRect(0,0,16,128);
  const t=new THREE.CanvasTexture(c),m=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  const plane=mesh(p,new THREE.PlaneGeometry(w,d,1,4),m,[x,.149,z],false);plane.rotation.x=-Math.PI/2;plane.castShadow=false;
}
function sillWeathering(p,x,y,z){
  const canvas=Object.assign(document.createElement('canvas'),{width:256,height:128}),c=canvas.getContext('2d');
  for(let i=0;i<19;i++){
    const a=8+i*13,len=20+(i*37%100),g=c.createLinearGradient(0,0,0,len);
    g.addColorStop(0,'rgba(57,48,40,.15)');g.addColorStop(1,'rgba(57,48,40,0)');c.fillStyle=g;c.fillRect(a,0,2+i%4,len);
  }
  const t=new THREE.CanvasTexture(canvas),m=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  const o=mesh(p,new THREE.PlaneGeometry(1.45,.34),m,[x,y,z],false);o.castShadow=false;
}
export function shopDressing(diner,store){
  // Decals sit on existing glass, leaving the doorway and upper sight line clear.
  graphic(store,'offer',[-1.24,1.35,2.723],.88,.66).rotation.z=-.035;
  graphic(store,'daily',[1.73,1.40,2.723],.72,.54);
  // Thin branded lower-window bands visually connect the shopfront.
  for(const [x,w]of [[-1.45,2.61],[1.70,.90]]){
    box(store,[x,.72,2.724],[w,.052,.007],'#d4aa4f',false);
    box(store,[x,.65,2.724],[w,.027,.007],'#e3d6ba',false);
  }
  graphic(diner,'menu',[2.08,1.65,-2.185],1.24,.93);
  for(const x of [-1.78,.34])sillWeathering(diner,x,3.55,.802);
  // Counter groups: condiment tray, chopsticks and nested clean dishes.
  const tray=group(diner,[.64,1.164,1.22]);
  surfaceBox(tray,[0,.012,0],[.44,.024,.33],'#624d3c','wood');
  bottle(tray,[-.11,.026,-.015],1).scale.setScalar(.85);
  cylinder(tray,[.095,.084,.035],.053,.047,.115,'#8e7456',20,false);
  for(let i=0;i<7;i++)rod(tray,[.077+(i%3)*.014,.048,.02+Math.floor(i/3)*.012],[.075+(i%3)*.018,.26+(i%2)*.025,.018+Math.floor(i/3)*.015],.003,'#c8ad75',6);
  const dishes=group(diner,[-2.58,1.165,1.25]);
  for(let i=0;i<3;i++)bowl(dishes,[0,i*.055,0],0).scale.setScalar(.67);
  // Price rails establish shelf scale; cards are flush with the rail, not goods.
  for(const y of [.56,1.05,1.55,2.05])for(let i=0;i<7;i++){
    box(store,[-2.34+i*.58,y,-2.105],[.16,.042,.009],i%3===0?'#d6a345':'#e3d9bd',false);
  }
  // Soft static crevice shading is local to the wall/floor junction.
  contactStrip(store,-.4,-2.05,4.8,.70);contactStrip(diner,-.8,-1.94,4.4,.38);
  for(const p of [diner,store]){
    p.traverse(o=>{
      if(!o.isMesh||!o.material.vertexColors||!o.geometry.attributes.color)return;
      const g=o.geometry,c=g.attributes.color,v=g.attributes.position;
      for(let i=0;i<v.count;i++){
        const z=v.getZ(i)+o.position.z,y=v.getY(i)+o.position.y;
        if(y>2.93)continue;
        const depth=THREE.MathUtils.smoothstep(-z,-.8,2.2),top=THREE.MathUtils.smoothstep(y,2.1,2.92);
        const shade=1-depth*.21-top*.08;
        c.setXYZ(i,c.getX(i)*shade,c.getY(i)*shade,c.getZ(i)*shade);
      }
    });
  }
  return {counterGroups:[tray,dishes]};
}
