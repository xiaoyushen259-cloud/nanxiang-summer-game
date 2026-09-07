import * as THREE from 'three';
import {streetSurfaceMaterial} from './street-surfaces.js';
import {authoredAsset} from './authored-assets.js';
import {box,cylinder,rod,mesh,group,sign,material,palette as P} from './art.js';
import {parcel,book,bowl,bottle,shopFinishing} from './shop-props.js';

// Small, tileable surface textures; generated locally and shared across the town.
let seed=714;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const reflectionMaterial=new THREE.MeshBasicMaterial({color:'#d7e8e6',transparent:true,opacity:.11,depthWrite:false});
const glassMaterial=new THREE.MeshPhysicalMaterial({color:'#bed8dc',transparent:true,opacity:.13,roughness:.19,metalness:.10,clearcoat:.65,envMapIntensity:.55,depthWrite:false});
const diffuserMaterial=new THREE.MeshBasicMaterial({color:'#fff0cb'});
export const surfaceMaterial=streetSurfaceMaterial;
export function surfaceBox(parent,pos,size,color,kind='plaster'){
  const g=new THREE.BoxGeometry(...size,Math.max(1,Math.ceil(size[0]/1.5)),size[1]>2?Math.ceil(size[1]/.3):1,Math.max(1,Math.ceil(size[2]/1.5)));
  const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,tile=kind==='brick'?1.5:kind==='paving'?2:kind==='wood'?.6:2;
  for(let i=0;i<p.count;i++){
    const u=Math.abs(n.getX(i))>.5?p.getZ(i):p.getX(i),v=Math.abs(n.getY(i))>.5?p.getZ(i):p.getY(i);
    uv.setXY(i,u/tile,v/tile);
  }
  const colors=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){
    // Ground contact and weathering belong to the wall base, never painted across windows.
    const y=p.getY(i)+size[1]/2;
    const foot=kind==='plaster'&&size[1]>2&&pos[1]-size[1]/2<.25?Math.exp(-y*4)*.16:0;
    colors.set([1-foot,1-foot*.94,1-foot*.82],i*3);
  }
  g.setAttribute('color',new THREE.BufferAttribute(colors,3));
  return mesh(parent,g,surfaceMaterial(kind,color),pos,false);
}

// Each leaf is a folded blade rather than a solid polygonal canopy.
const leafMaterial=new THREE.MeshLambertMaterial({color:'#91b47c',side:THREE.DoubleSide});
const darkLeafMaterial=new THREE.MeshLambertMaterial({color:'#6a9470',side:THREE.DoubleSide});
const leafGeometry=new THREE.BufferGeometry(),leafVertices=[0,.10,.5],leafIndices=[];
for(let i=0;i<10;i++){const a=i/10*Math.PI*2;leafVertices.push(Math.sin(a)*.48,0,.5+Math.cos(a)*.53);leafIndices.push(0,i+1,(i+1)%10+1);}
leafGeometry.setAttribute('position',new THREE.Float32BufferAttribute(leafVertices,3));leafGeometry.setIndex(leafIndices);leafGeometry.computeVertexNormals();
function leaf(parent,pos,length,width,yaw,tilt,dark=false){
  const l=mesh(parent,leafGeometry,dark?darkLeafMaterial:leafMaterial,pos,false);l.scale.set(width,length,length);l.rotation.set(tilt,yaw,(random()-.5)*.45);return l;
}
export function leafyTree(parent,x,z,scale=1){
  const t=group(parent,[x,0,z]);t.scale.setScalar(scale);
  const crown=authoredAsset('StreetTree');crown.position.y=.137;
  crown.rotation.y=Math.sin(x*13.7+z*.73)*Math.PI;
  const variety=Math.sin(x*7.3-z*.91);crown.scale.set(1+variety*.045,1+variety*.025,1-variety*.045);t.add(crown);
  surfaceBox(t,[0,.06,0],[1.35,.12,1.35],'#bdbcb2','paving');
  box(t,[0,.128,0],[1.13,.015,1.13],'#716d5d',false);
  for(let i=0;i<20;i++){const a=random()*6.28,r=.18+random()*.4;leaf(t,[Math.cos(a)*r,.15,Math.sin(a)*r],.18,.06,a,-.8);}
  return t;
}

export function roofTiles(parent,w,d,y){
  const slope=new THREE.Vector3(w/2,-1.1,0),length=slope.length();slope.normalize();
  const tileGeo=new THREE.CylinderGeometry(.10,.112,.35,7,1,true,0,Math.PI);
  const tileMat=material('#858d89',{side:THREE.DoubleSide});
  for(const s of [-1,1]){
    const direction=new THREE.Vector3(s*slope.x,slope.y,0);
    const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction);
    for(let z=-d/2+.1;z<d/2;z+=.22)for(let along=.16;along<length;along+=.30){
      const tile=mesh(parent,tileGeo,tileMat,[direction.x*along,y+1.1+direction.y*along+.018,z],false);tile.quaternion.copy(rotation);
    }
    rod(parent,[s*w/2,y,-d/2],[s*w/2,y,d/2],.055,'#747d78',10);
  }
}
export function pottedPlant(parent,x,y,z,scale=1,flowers=false){
  const asset=authoredAsset('Planter');if(asset){asset.position.set(x,y,z);asset.scale.setScalar(scale);parent.add(asset);return asset;}
  const p=group(parent,[x,y,z]);p.scale.setScalar(scale);
  cylinder(p,[0,.18,0],.2,.13,.36,'#ba907a',16,false);cylinder(p,[0,.36,0],.215,.215,.065,'#d0aa92',16,false);cylinder(p,[0,.385,0],.185,.185,.012,'#665c4c',16,false);
  for(let i=0;i<19;i++){
    const a=i*2.399,l=.22+random()*.26;rod(p,[0,.37,0],[Math.sin(a)*.12,.46+l*.55,Math.cos(a)*.12],.005,'#698166',5);
    leaf(p,[Math.sin(a)*.08,.44+l*.45,Math.cos(a)*.08],l,.07+random()*.07,a,-.45-random()*.65,i%3===0);
  }
  if(flowers)for(let i=0;i<5;i++){
    const a=i*2.399,x=Math.cos(a)*.18,z=Math.sin(a)*.18,y=.73+random()*.12;
    rod(p,[0,.4,0],[x,y,z],.006,'#698166',5);
    for(let j=0;j<5;j++){const petal=mesh(p,new THREE.SphereGeometry(.028,6,4),'#d5a3a5',[x+Math.cos(j*1.256)*.03,y,z+Math.sin(j*1.256)*.03],false);petal.scale.y=.45;}
  }
  return p;
}

export function windowDetail(p,x,y,z,w,h){
  // An inset reveal and two curtain folds give windows thickness at close range.
  for(const s of [-1,1]){
    box(p,[x+s*(w*.5+.045),y,z+.025],[.06,h+.12,.12],'#c9c9be',false);
    const curtain=surfaceBox(p,[x+s*w*.36,y,z+.077],[w*.17,h*.88,.015],'#d9d4c6','fabric');
    for(let i=0;i<3;i++)box(p,[curtain.position.x+(i-1)*w*.045,y,z+.088],[w*.012,h*.87,.012],'#c6c4b8',false);
  }
  const reflection=mesh(p,new THREE.PlaneGeometry(w*.12,h*.8),reflectionMaterial,[x+w*.09,y,z+.087],false);reflection.rotation.z=-.16;
}

export function shopDetail(p,{w,d,h,name,type,color}){
  const z=d/2;
  // Ceramic skirting, plaster cornices, door trim and a tiled threshold.
  surfaceBox(p,[0,.37,z+.052],[w,.65,.06],'#b6bab0','brick');
  box(p,[0,2.87,z+.10],[w+.10,.095,.21],'#eee6d8',false);
  box(p,[0,h-.19,z+.06],[w+.05,.085,.14],'#eee6d8',false);
  surfaceBox(p,[-w*.23,.17,z+.23],[1.29,.12,.48],'#cfc6b8','paving');
  for(const s of [-1,1])surfaceBox(p,[-w*.23+s*.53,1.1,z+.17],[.065,1.91,.08],'#927d6a','wood');
  if(!name)return;
  const shopX=w*.2,shopW=Math.max(1,w*.32),front=z+.18;
  // A shallow display bay lies in front of the wall, with shelves and a glazed frame.
  box(p,[shopX,1.21,front],[shopW-.05,1.40,.12],type==='noodle'?'#987c60':'#858e82',false);
  surfaceBox(p,[shopX,.52,front+.1],[shopW+.12,.085,.24],'#9c8066','wood');
  for(const sy of [.91,1.37]){
    surfaceBox(p,[shopX,sy,front+.105],[shopW-.12,.045,.22],'#b49a7c','wood');
    const count=Math.floor(shopW/.27);
    for(let i=0;i<count;i++){
      const x=shopX-shopW/2+.18+i*.27;
      if(type==='noodle'||name.includes('茶')){
        if(i%2===0)bowl(p,[x,sy+.023,front+.15],i);else bottle(p,[x,sy+.023,front+.15],i);
      }else if(type==='post')parcel(p,[x,sy+.023,front+.13],[.22,.17+(i%2)*.035,.15],i);
      else{book(p,[x,sy+.023,front+.13],i,[.10,.24,.16]).rotation.z=-.05;book(p,[x+.10,sy+.023,front+.13],i+1,[.085,.22,.16]);}
    }
  }
  shopFinishing(p,{w,d,name,type});
  for(const s of [-1,1])box(p,[shopX+s*shopW/2,1.21,front+.22],[.055,1.50,.07],P.dark,false);
  box(p,[shopX,1.96,front+.18],[shopW+.12,.065,.21],P.cream,false);
  box(p,[shopX,1.21,front+.23],[.04,1.45,.04],P.dark,false);
  const glass=mesh(p,new THREE.PlaneGeometry(shopW-.07,1.40),glassMaterial,[shopX,1.21,front+.25],false);glass.castShadow=false;
  sign(p,type==='post'?'营业中':type==='noodle'?'手作汤面':'欢迎光临',[-w*.23,1.52,z+.21],[.42,.16],{bg:'#f0e7d5',fg:'#637870',border:false,width:256,height:96});
  // Two wall lights, with a warm porcelain diffuser rather than extra shadow maps.
  for(const s of [-1,1]){
    rod(p,[s*w*.39,2.75,z+.14],[s*w*.39,2.8,z+.40],.022,P.ink);
    cylinder(p,[s*w*.39,2.77,z+.4],.065,.14,.1,P.ink,16,false);
    const glow=mesh(p,new THREE.SphereGeometry(.085,10,6),diffuserMaterial,[s*w*.39,2.70,z+.4],false);glow.scale.y=.38;
  }
  // Upper-floor balcony and flower box break up identical flat facades.
  if(h>6&&!name){
    const by=3.3;
    surfaceBox(p,[0,by-.66,z+.35],[w*.65,.1,.62],'#cbc4b7','paving');
    for(const sy of [by-.25,by+.1])rod(p,[-w*.33,sy,z+.62],[w*.33,sy,z+.62],.018,P.ink);
    for(let x=-w*.3;x<w*.31;x+=.27)rod(p,[x,by-.62,z+.62],[x,by+.1,z+.62],.014,P.ink,6);
    surfaceBox(p,[w*.2,by-.52,z+.42],[.84,.21,.23],'#b6957b','wood');
    for(let i=0;i<3;i++)pottedPlant(p,w*.2-.25+i*.25,by-.63,z+.43,.42,i%2===0);
  }
}

export function shopThreshold(p,x,z,yaw,kind){
  const g=group(p,[x,.145,z],yaw);
  if(kind==='books'&&authoredAsset('BookDisplay')){g.add(authoredAsset('BookDisplay'));return g;}
  if(kind==='books'){
    for(const x of [-.55,.55])surfaceBox(g,[x,.43,0],[.055,.86,.37],'#9b8165','wood');
    for(const y of [.08,.4,.72]){
      surfaceBox(g,[0,y,0],[1.15,.055,.39],'#b89a79','wood');
      for(let i=0;i<8;i++)surfaceBox(g,[-.47+i*.13,y+.12,.025],[.09,.20+random()*.055,.21],['#ac786d','#809082','#a4aab4','#c2ab7c'][i%4],'fabric').rotation.z=(random()-.5)*.14;
    }
  }else if(kind==='cafe'){
    cylinder(g,[0,.64,0],.35,.35,.055,'#c2a789',24,false);cylinder(g,[0,.33,0],.032,.045,.62,P.ink,10,false);
    for(const x of [-.58,.58]){surfaceBox(g,[x,.34,0],[.29,.045,.28],'#b19376','wood');for(const a of [-1,1])for(const b of [-1,1])rod(g,[x+a*.1,0,b*.10],[x+a*.1,.33,b*.1],.015,P.ink);}
    cylinder(g,[.12,.72,0],.043,.03,.09,P.cream,12,false);pottedPlant(g,-.12,.68,0,.24,true);
  }else if(kind==='flowers'){
    for(let i=0;i<5;i++)pottedPlant(g,(i-2)*.26,0,(i%2)*.23,.7+random()*.4,true);
  }
  return g;
}
