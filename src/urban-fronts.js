import * as THREE from 'three';
import {box,rod,cylinder,mesh,group,wire} from './art.js';
import {softBox,bowl,bottle,printedCard} from './shop-props.js';
import {landscapePoint,curveYaw} from './landscape.js';

// Original neighborhood graphics: bold hierarchy and individual shop identities.
// Reference is the density and lighting of Sixth Street, not its logos or artwork.
const brands={post:['#29474d','#dbd1a8','POST / 01'],noodle:['#bd493c','#fff0ca','SOUP & NOODLES'],books:['#4a415f','#c6b8e3','BOOKS / RECORDS'],photo:['#294d72','#e6edef','PHOTO STUDIO'],repair:['#c8a461','#252a31','REPAIR SERVICE'],tea:['#446b61','#e8ce96','COFFEE & TEA'],barber:['#d6d1c4','#405966','BARBER / EST. 1996'],flowers:['#557766','#e3d9b5','FLOWERS & PLANTS'],shop:['#c1bc9f','#35494b','DAILY STORE']};
export const urbanColors=(name,type)=>brands[shopKind(name,type)];
export function shopKind(name='',type){return type==='post'||type==='noodle'?type:name.includes('书')?'books':name.includes('照相')?'photo':name.includes('修理')?'repair':name.includes('茶')?'tea':name.includes('理发')?'barber':name.includes('花')?'flowers':'shop'}
export function urbanSign(p,text,pos,size,kind='shop',blade=false){
  const [bg,fg,subtitle]=brands[kind],c=document.createElement('canvas');c.width=blade?256:1024;c.height=blade?768:256;
  const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);
  ctx.fillStyle=fg;
  if(blade){ctx.fillRect(18,20,c.width-36,9);ctx.textAlign='center';ctx.font="900 126px 'Microsoft YaHei'";[...text].slice(0,4).forEach((ch,i)=>ctx.fillText(ch,128,180+i*157));ctx.font='bold 26px monospace';ctx.fillText('N X / 06',128,730);}
  else{
    ctx.fillRect(24,24,130,208);ctx.fillStyle=bg;ctx.font='900 72px Arial';ctx.textAlign='center';ctx.fillText(kind==='post'?'01':kind==='noodle'?'02':'NX',89,123);ctx.font='bold 20px Arial';ctx.fillText('NANXIANG',89,169);
    ctx.fillStyle=fg;ctx.textAlign='left';ctx.font=`900 ${Math.min(115,775/(text.length+.1))}px 'Microsoft YaHei'`;ctx.fillText(text,181,150);ctx.font='bold 26px Arial';ctx.fillText(subtitle+'   /   OPEN DAILY',188,208);
    ctx.fillRect(185,39,785,5);
  }
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
  softBox(p,pos,[size[0]+.13,size[1]+.13,.18],'#20262e');
  const board=mesh(p,new THREE.PlaneGeometry(...size),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}),[pos[0],pos[1],pos[2]+.095],false);board.castShadow=false;
  if(blade){const back=mesh(p,new THREE.PlaneGeometry(...size),board.material,[pos[0],pos[1],pos[2]-.095],false);back.rotation.y=Math.PI;back.castShadow=false;}
  for(const s of [-1,1])rod(p,[pos[0]+s*size[0]*.47,pos[1]-size[1]/2-.06,pos[2]+.105],[pos[0]+s*size[0]*.47,pos[1]+size[1]/2+.06,pos[2]+.105],.008,'#8b9897',6);
  return board;
}
export function urbanFront(p,{w,d,name,type}){
  if(!name)return;
  const kind=shopKind(name,type),[bg,fg]=brands[kind],z=d/2;
  // Deep painted portal, exposed metal brackets and a large projecting lightbox.
  for(const s of [-1,1]){
    softBox(p,[s*(w/2-.10),1.4,z+.14],[.21,2.8,.25],bg);
    for(let i=0;i<8;i++)box(p,[s*(w/2-.12),.35+i*.26,z+.272],[.13,.025,.025],'#65706f',false);
  }
  const bracket=group(p,[w*.40,3.75,z+.67],Math.PI/2);
  urbanSign(bracket,kind==='post'?'邮便':kind==='noodle'?'热汤面':name.includes('书')?'旧书店':name.slice(0,4),[0,0,0],[.68,1.74],kind,true);
  wire(p,[[w*.40,4.7,z+.04],[w*.40,4.8,z+.35],[w*.40,4.65,z+1.05]],'#272f36',.034);
  // Vent strip and roller shutter reveal above the shopfront.
  for(let i=0;i<6;i++)box(p,[0,2.88+i*.075,z+.06],[w*.87,.035,.055],'#5b6262',false);
  urbanSign(p,name,[0,2.52,z+.17],[w*.87,.78],kind);
  if(kind==='noodle'){
    // Warm serving bay and counter with room for the existing NPC in front.
    box(p,[-.55,1.3,z+.26],[w*.73,1.43,.25],'#382f2f',false);
    box(p,[-.55,1.62,z+.4],[w*.68,.035,.04],'#c69454',false);
    for(let i=0;i<9;i++){const x=-w*.39+i*.43;box(p,[x,.97,z+.405],[.019,1.0,.02],'#816256',false);bottle(p,[x,1.65,z+.43],i);}
    softBox(p,[-.55,.89,z+.62],[w*.74,.11,.55],'#aa7255');
    for(let i=0;i<4;i++)bowl(p,[-1.75+i*.61,.955,z+.67],i);
    for(const x of [-1.6,-.8]){
      cylinder(p,[x,.50,z+.95],.18,.18,.08,'#b7493d',20,false);
      for(const s of [-1,1])rod(p,[x+s*.13,.12,z+.95],[x+s*.10,.49,z+.95],.019,'#343b3b');
      const ring=mesh(p,new THREE.TorusGeometry(.14,.009,6,20),'#5c6562',[x,.25,z+.95],false);ring.rotation.x=Math.PI/2;
    }
    for(const x of [-w*.35,w*.34]){
      rod(p,[x,2.14,z+.66],[x,1.91,z+.66],.012,'#252b32');
      const lamp=mesh(p,new THREE.SphereGeometry(.15,18,12),new THREE.MeshBasicMaterial({color:'#ffbe71',toneMapped:false}),[x,1.83,z+.66],false);lamp.scale.y=1.3;
      for(let j=0;j<6;j++){const ring=mesh(p,new THREE.TorusGeometry(.147*Math.sin((j+1)/7*Math.PI),.004,4,18),'#b4643d',[x,1.83-.18+(j+1)*.052,z+.66],false);ring.rotation.x=Math.PI/2;}
    }
    const emblem=group(p,[-w*.26,4.23,z+.29]);
    const disc=cylinder(emblem,[0,0,0],.67,.67,.12,'#c24c3d',32,false);disc.rotation.x=Math.PI/2;
    for(let i=0;i<3;i++)wire(emblem,[[-.26+i*.24,.08,.08],[-.32+i*.24,.24,.08],[-.24+i*.24,.40,.08]],'#f0d5aa',.022);
    const bowlMark=mesh(emblem,new THREE.TorusGeometry(.43,.035,8,32,Math.PI),'#f0d5aa',[0,-.05,.09],false);bowlMark.rotation.z=Math.PI;
  }else{
    // Independent lower facade colors and horizontal ceramic bands.
    box(p,[0,.36,z+.115],[w-.3,.55,.065],bg,false);
    for(let i=0;i<Math.floor(w/.18);i++)box(p,[-w/2+.2+i*.18,.37,z+.155],[.008,.49,.008],'#55625d',false);
    box(p,[0,.66,z+.17],[w-.15,.025,.028],fg,false);
  }
  // Poster cluster, utilities and hazard stripes break up blank wall areas.
  for(let i=0;i<3;i++){const card=printedCard(p,[-w*.41+i*.17,1.48+(i%2)*.17,z+.31],.24,.34,(i+kind.length)%16);card.rotation.z=(i-1)*.10;}
  softBox(p,[w*.43,.93,z+.32],[.26,.42,.17],'#697579');
  for(let i=0;i<4;i++)box(p,[w*.43,.82+i*.052,z+.41],[.17,.015,.008],'#2b343c',false);
}

export function urbanEffects(scene){
  const ambient=[];
  for(const [x,y,z,color,intensity] of [[8.5,2.3,8.2,'#ffd6a5',3.8],[9.1,2.7,.25,'#d8ebed',2.6],[-5,2,7,'#dee7d0',.8],[5,2,-6,'#b9cede',.7]]){
    const light=new THREE.PointLight(color,intensity,6,2);light.position.copy(landscapePoint(new THREE.Vector3(x,y,z)));scene.add(light);
  }
  const fan=group(scene,landscapePoint(new THREE.Vector3(11.04,2.66,8.2)).toArray());fan.rotation.y=curveYaw(8.2);
  for(let i=0;i<3;i++){const blade=softBox(fan,[0,Math.cos(i*2.094)*.12,Math.sin(i*2.094)*.12],[.018,.21,.065],'#878f8c');blade.rotation.x=i*2.094;}
  const steamCanvas=document.createElement('canvas');steamCanvas.width=steamCanvas.height=64;const ctx=steamCanvas.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(234,222,209,.20)');g.addColorStop(1,'rgba(234,222,209,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);const texture=new THREE.CanvasTexture(steamCanvas);
  for(let i=0;i<5;i++){const puff=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));scene.add(puff);ambient.push(puff);}
  return time=>{
    fan.rotation.x=time*4.5;
    ambient.forEach((p,i)=>{const age=(time*.35+i*.2)%1;p.position.copy(landscapePoint(new THREE.Vector3(10.36+Math.sin(age*4+i)*.06,1.55+age*.8,7.6)));p.scale.setScalar(.12+age*.36);p.material.opacity=Math.sin(age*Math.PI)*.55;});
  };
}
