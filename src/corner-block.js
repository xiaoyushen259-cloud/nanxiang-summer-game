import * as THREE from 'three';
import {replaceBuildingTop,authoredAsset} from './authored-assets.js';
import {box,rod,cylinder,mesh,group,sign,wire} from './art.js';
import {surfaceBox,pottedPlant} from './scenery-detail.js';
import {softBox,bowl,bottle,parcel} from './shop-props.js';
import {cornerFinishing} from './corner-finishing.js';
import {shopDressing} from './shop-dressing.js';

// Logical metres. These volumes replace two complete buildings, not their facades.
export const cornerWalkAreas=[
  {minX:3.9,maxX:12.2,minZ:5.7,maxZ:13.6}, // diner court and open entrance
  {minX:3.9,maxX:16.5,minZ:3.3,maxZ:5.7}, // east-running alley
  {minX:3.9,maxX:12.3,minZ:-2.6,maxZ:3.3}, // convenience store
  {minX:12.2,maxX:16.5,minZ:5.7,maxZ:11.9}, // back court
];
export const insideCorner=(x,z)=>cornerWalkAreas.some(a=>x>=a.minX&&x<=a.maxX&&z>=a.minZ&&z<=a.maxZ);
export const dinerActor={x:6.03,z:9.35,yaw:-1.35};
const C={metal:new THREE.MeshStandardMaterial({color:'#344b55',roughness:.47,metalness:.42,envMapIntensity:.6}),cream:'#e6ded0',tile:'#aeafa5',red:'#aa493c',wood:'#8f654b',teal:'#397d7c'};
const glass=new THREE.MeshPhysicalMaterial({color:'#b8d8dc',transparent:true,opacity:.17,roughness:.14,metalness:.12,clearcoat:.8,clearcoatRoughness:.12,envMapIntensity:.65,depthWrite:false,side:THREE.DoubleSide});
const glow=new THREE.MeshBasicMaterial({color:'#ffe2aa',toneMapped:false});
const coolGlow=new THREE.MeshBasicMaterial({color:'#dcefe3',toneMapped:false});

function prism(p,points,y,h,color){
  const shape=new THREE.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,steps:1});geo.rotateX(-Math.PI/2);
  return mesh(p,geo,color,[0,y,0],false);
}
function rail(p,a,b,y=3.65){
  for(const dy of [0,.67])rod(p,[a[0],y+dy,a[1]],[b[0],y+dy,b[1]],.025,C.metal);
  const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.25);
  for(let i=0;i<=n;i++){const t=i/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;rod(p,[x,y,z],[x,y+.67,z],.014,C.metal);}
}
function pane(p,x,y,z,w,h){
  mesh(p,new THREE.PlaneGeometry(w,h),glass,[x,y,z],false).castShadow=false;
  for(const dx of [-w/2,w/2])softBox(p,[x+dx,y,z],[.055,h+.07,.075],C.metal);
  for(const dy of [-h/2,h/2])box(p,[x,y+dy,z],[w,.055,.075],C.metal,false);
}
function poster(p,pos,w,h,kind){
  const c=document.createElement('canvas');c.width=512;c.height=768;const t=c.getContext('2d');
  t.fillStyle=kind==='music'?'#314957':kind==='drink'?'#e9bb5e':'#e3dcc9';t.fillRect(0,0,512,768);
  t.fillStyle=kind==='music'?'#e8d4ad':'#294b4b';t.font='bold 35px Microsoft YaHei';t.fillText('南 巷 / NEIGHBORHOOD',30,60);
  if(kind==='music'){
    for(let i=0;i<8;i++){t.strokeStyle=i%2?'#b4ccbe':'#d87657';t.lineWidth=13;t.beginPath();t.arc(270,325,60+i*21,.2,Math.PI*1.85);t.stroke();}
    t.fillStyle='#f0dfc3';t.font='900 78px Microsoft YaHei';t.fillText('周末放映',30,640);t.font='28px monospace';t.fillText('SAT 19:30 / ROOFTOP',30,707);
  }else if(kind==='drink'){
    t.fillStyle='#568d7f';t.beginPath();t.moveTo(150,190);t.lineTo(370,190);t.lineTo(338,510);t.lineTo(180,510);t.fill();
    t.fillStyle='#f5e9bd';t.beginPath();t.arc(255,300,64,0,7);t.fill();t.fillStyle='#d9a84e';t.beginPath();t.arc(255,300,48,0,7);t.fill();t.fillStyle='#244e51';t.fillRect(315,120,13,110);
    t.font='900 91px Microsoft YaHei';t.fillText('青柠夏日',25,635);t.font='32px monospace';t.fillText('FRESH / EVERY DAY',30,706);
  }else{
    t.strokeStyle='#bc5d47';t.lineWidth=20;t.beginPath();t.arc(256,350,145,0,Math.PI);t.stroke();
    for(let i=0;i<3;i++){t.beginPath();t.moveTo(160+i*90,280);t.bezierCurveTo(100+i*90,220,240+i*70,185,170+i*80,135);t.stroke();}
    t.font='900 100px Microsoft YaHei';t.fillText('一碗热汤',28,640);t.font='30px monospace';t.fillText('SLOW FOOD, GOOD DAY.',25,705);
  }
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
  softBox(p,pos,[w+.04,h+.04,.035],C.metal);
  mesh(p,new THREE.PlaneGeometry(w,h),new THREE.MeshLambertMaterial({map:tex}),[pos[0],pos[1],pos[2]+.022],false).castShadow=false;
}
function stool(p,x,z,solidLocal){
  cylinder(p,[x,.62,z],.21,.21,.085,C.red,24,false);
  for(const s of [-1,1])for(const t of [-1,1])rod(p,[x+s*.15,.145,z+t*.15],[x+s*.12,.59,z+t*.12],.018,C.metal);
  solidLocal(x,z,.44,.44);
}
function pendant(p,x,y,z){
  cylinder(p,[x,2.911,z],.06,.06,.027,C.metal,16,false);
  rod(p,[x,2.911,z],[x,y+.12,z],.014,C.metal);
  cylinder(p,[x,y,z],.08,.27,.20,C.metal,24,false);
  cylinder(p,[x,y-.104,z],.21,.21,.01,glow,24,false);
}
const packageMaterials=new Map();
function grocery(p,pos,index){
  const a=authoredAsset(['TeaTin','DrinkCarton','SnackBag'][index%3]),variant=Math.floor(index/3)%3;
  a.traverse(o=>{if(!o.isMesh||!['NX_PackageGreen','NX_PackageOchre'].includes(o.material.name))return;
    const key=o.material.uuid+variant;if(!packageMaterials.has(key)){const m=o.material.clone();m.color.set(['#477d72','#b87645','#758796'][variant]);packageMaterials.set(key,m);}o.material=packageMaterials.get(key);
  });
  a.position.set(...pos);a.rotation.y=(index%3-1)*.045;p.add(a);return a;
}

export function makeCornerBlock(root,solid){
  const spices=[],counterware=[];
  // All ground surfaces share the sidewalk height; no invisible steps in doorways.
  surfaceBox(root,[8.1,.055,9.65],[8.2,.18,7.9],'#d2ccbf','paving');
  surfaceBox(root,[10.5,.055,4.5],[13,.18,2.4],'#909b9d','asphalt');
  surfaceBox(root,[8.2,.055,.25],[8.4,.18,6.1],'#c6cbc2','paving');
  surfaceBox(root,[14.35,.055,8.8],[4.3,.18,6.2],'#beb9ab','paving');
  // An open mouth at the junction replaces the continuous curb.
  for(const z of [3.35,5.65])box(root,[10.65,.153,z],[11.7,.025,.11],'#e8d9ae',false);
  for(let x=5.0;x<14;x+=1.3)box(root,[x,.151,4.5],[.55,.008,.07],'#d0c8b4',false);

  // Diner: chamfered street corner, open working bay, recessed entrance, roof terrace.
  const diner=group(root,[9,0,9],-Math.PI/2);
  const ds=(x,z,w,d)=>solid(9-z,9+x,d,w);
  const outline=[[-3.2,-2.4],[3.2,-2.4],[3.2,.9],[1.9,2.2],[-3.2,2.2]];
  prism(diner,outline,2.94,.25,C.cream);
  // A separate underside avoids self-shadow striping on the deep cantilever.
  const soffit=prism(diner,outline,2.925,.008,'#9b9385');soffit.receiveShadow=false;soffit.castShadow=false;
  surfaceBox(diner,[0,1.57,-2.3],[6.4,2.85,.2],'#bba18d','plaster');ds(0,-2.3,6.4,.2);
  surfaceBox(diner,[-3.1,1.55,-.05],[.2,2.8,4.5],'#b9937c','brick');ds(-3.1,-.05,.2,4.5);
  const serviceWall=group(diner,[-3.215,0,-.12],-Math.PI/2);
  softBox(serviceWall,[.25,1.24,0],[1.13,2.17,.08],'#57726e');
  for(let i=0;i<6;i++)box(serviceWall,[.25,1.86+i*.042,.045],[.80,.022,.018],'#304c51',false);
  rod(serviceWall,[.66,1.05,.08],[.66,1.30,.08],.014,C.cream);
  sign(serviceWall,'小满后厨',[.25,2.52,.06],[1.35,.30],{bg:C.red,fg:'#ead7b6',border:false});
  poster(serviceWall,[-1.1,1.55,.01],.62,.93,'soup');
  surfaceBox(diner,[3.1,1.55,-.7],[.2,2.8,3.2],'#c5ad96','plaster');ds(3.1,-.7,.2,3.2);
  for(const x of [-3.08,1.70]){surfaceBox(diner,[x,1.55,2.10],[.22,2.8,.22],C.red,'plaster');ds(x,2.1,.22,.22);}
  // Preparation wall is over three metres behind the front edge.
  surfaceBox(diner,[-.85,1.30,-2.17],[4.2,2.25,.055],'#d3c8af','brick');
  for(const y of [1.52,2.04]){
    surfaceBox(diner,[-.85,y,-1.92],[3.9,.08,.4],C.wood,'wood');
    for(const [i,x]of [-2.60,-2.37,-2.14,-1.36,-1.10,-.82].entries()){
      const b=bottle(diner,[x,y+.045,-1.86],i);b.scale.setScalar(.82+(i%3)*.09);spices.push(b);
    }
    for(const [i,x]of [-.2,.22,.64].entries()){
      const jar=group(diner,[x,y+.045,-1.88]),height=.19+i*.025;
      cylinder(jar,[0,height/2,0],.084,.084,height,['#a36c46','#bac1a9','#899b9e'][i],24,false);
      cylinder(jar,[0,height+.009,0],.09,.09,.018,'#43545a',24,false);
      box(jar,[0,height*.54,.084],[.10,.085,.003],'#e4d7b8',false);spices.push(jar);
    }
  }
  const kitchenCabinet=softBox(diner,[-1.6,.66,-1.38],[2.5,1.02,.86],'#7c8885');ds(-1.6,-1.38,2.6,.94);
  const worktop=softBox(diner,[-1.6,1.21,-1.38],[2.6,.08,.94],'#bac3bd');
  // Pot rests on the hob; the wall shelves now clear the worktop and extractor.
  const hob=cylinder(diner,[-1.4,1.269,-1.36],.28,.28,.038,C.metal,28,false);
  const pot=cylinder(diner,[-1.4,1.443,-1.36],.25,.22,.31,'#8b989b',28,false);
  for(const s of [-1,1])wire(diner,[[-1.4+s*.23,1.51,-1.36],[-1.4+s*.32,1.51,-1.36],[-1.4+s*.32,1.41,-1.36],[-1.4+s*.23,1.41,-1.36]],C.metal,.016);
  for(const x of [-2.35,-1.56,-.77]){
    softBox(diner,[x,.70,-.937],[.72,.76,.025],'#91a19e');
    rod(diner,[x-.15,.99,-.908],[x+.15,.99,-.908],.012,C.metal);
    cylinder(diner,[x,1.105,-.908],.033,.033,.022,C.metal,16,false).rotation.x=Math.PI/2;
  }
  softBox(diner,[-1.6,2.55,-1.38],[2.8,.28,1.1],'#697c80');
  softBox(diner,[-.8,2.66,-2.15],[.57,.49,.10],C.metal);
  const fanRing=mesh(diner,new THREE.TorusGeometry(.205,.022,8,32),'#9bacaa',[-.8,2.66,-2.07],false);
  for(let i=0;i<13;i++)box(diner,[-2.78+i*.19,2.48,-.818],[.08,.09,.01],'#a7b0a7',false);
  // Low counter leaves the interior visible. Entry at the chamfer stays clear.
  surfaceBox(diner,[-.9,.61,1.21],[3.92,.93,.48],'#425d5a','brick');ds(-.9,1.23,4.08,.72);
  const counter=surfaceBox(diner,[-.9,1.10,1.23],[4.08,.12,.72],C.wood,'wood');
  for(const [i,x]of [-1.92,-.90,-.10].entries()){const dish=bowl(diner,[x,1.165,1.27],i);dish.scale.setScalar(1.18);counterware.push(dish);}
  for(const x of [-2.28,-1.2,-.12])stool(diner,x,2.12,ds);
  for(const x of [-2.2,-.3,1.35])pendant(diner,x,2.35,.56);
  // Short noren panels are cut above eye level; they frame rather than hide the room.
  for(let i=0;i<7;i++){
    surfaceBox(diner,[-2.70+i*.58,2.61,2.24],[.55,.55,.024],i%3===0?'#a34f3e':'#dbcdac','fabric');
    if(i===2||i===3)sign(diner,i===2?'小':'满',[-2.70+i*.58,2.60,2.26],[.28,.31],{bg:'#dbcdac',fg:'#714635',border:false});
  }
  // The large angled sign belongs to the clipped corner, visible from the arrival street.
  const bevel=group(diner,[2.54,0,1.55],Math.PI/4);
  sign(bevel,'小满食堂',[0,3.57,.02],[1.72,.76],{bg:C.red,fg:'#f3dfb7',small:'HOT SOUP / 1986',border:false});
  box(bevel,[0,3.0,.09],[2.02,.18,.48],C.red,false);
  const southWall=group(diner,[3.215,0,-.72],Math.PI/2);
  poster(southWall,[.40,1.70,0],.80,1.24,'soup');
  sign(southWall,'每日熬汤 / 11:00 开门',[-.50,2.58,.025],[2.35,.24],{bg:'#c5ad96',fg:'#714c3f',border:false});
  sign(diner,'热汤 · 手作面',[-.90,3.49,2.23],[3.40,.49],{bg:'#9b493c',fg:'#eadbbf',border:false});
  // Setback upper volume exposes a full terrace, not another row of the same windows.
  surfaceBox(diner,[-.60,4.49,-.55],[5.15,2.60,2.70],'#cfb6a0','plaster');
  box(diner,[-.60,5.82,-.52],[5.48,.18,3.05],C.metal,false);
  for(const x of [-1.75,.3]){
    box(diner,[x,4.51,.81],[1.36,1.45,.035],'#526a70',false);
    pane(diner,x,4.51,.85,1.34,1.44);
    for(const dx of [-.44,.44])surfaceBox(diner,[x+dx,4.52,.835],[.19,1.37,.012],'#c4b591','fabric');
  }
  rail(diner,[-3.2,2.18],[1.9,2.18],3.23);rail(diner,[1.9,2.18],[3.2,.9],3.23);
  for(const x of [-2.7,.9])pottedPlant(diner,x,3.2,1.65,.8);
  const shade=box(diner,[-.8,5.15,1.59],[4.45,.075,1.70],'#866f54',false);shade.rotation.x=-.07;
  box(diner,[-.80,5.13,2.2],[4.46,.11,.11],C.metal,false);
  for(const x of [-2.88,1.25]){
    rod(diner,[x,3.2,2.2],[x,5.185,2.2],.035,C.metal);
    softBox(diner,[x,3.215,2.2],[.16,.05,.16],C.metal);
  }
  // Landmark chimney and tank sit asymmetrically, keeping a recognizable skyline.
  softBox(diner,[-2.7,4.1,-2.0],[.48,6.0,.46],'#7b9093');
  cylinder(diner,[-2.7,7.13,-2],.36,.25,.18,C.metal,24,false);
  cylinder(diner,[1.1,6.35,-.9],.62,.62,.88,'#afb7ad',28,false);
  for(const x of [.7,1.5])rod(diner,[x,5.9,-.9],[x,5.7,-.9],.04,C.metal);

  // Convenience store: one low, wide glass volume and a high sign blade.
  const store=group(root,[9.1,0,.25],-Math.PI/2);
  const cs=(x,z,w,d)=>solid(9.1-z,.25+x,d,w);
  surfaceBox(store,[0,1.68,-2.7],[6,3.06,.2],'#c5cdbf','plaster');cs(0,-2.7,6,.2);
  surfaceBox(store,[-2.9,1.68,0],[.2,3.06,5.4],'#c5cdbf','plaster');cs(-2.9,0,.2,5.4);
  box(store,[0,3.22,0],[6.25,.22,5.85],C.metal,false);
  box(store,[0,3.39,.14],[6.40,.16,6.02],C.cream,false);
  box(store,[0,2.96,2.82],[6.27,.42,.15],C.teal,false);
  box(store,[0,2.71,2.93],[6.31,.075,.34],'#d6a955',false);
  sign(store,'青木便利',[-.6,3.04,2.92],[2.10,.43],{bg:C.teal,fg:'#f0e4c9',border:false});
  sign(store,'07:00 — 23:00',[1.82,3.04,2.92],[1.35,.23],{bg:C.teal,fg:'#f0e4c9',border:false});
  // Two large windows and an open doorway with a genuine view through to shelving.
  for(const x of [-1.45,1.70]){
    const w=x<0?2.7:1.0;pane(store,x,1.52,2.72,w,2.24);cs(x,2.72,w,.08);
    surfaceBox(store,[x,.28,2.72],[w,.27,.14],C.teal,'brick');
  }
  // Entrance opening spans local x .0 to 1.17 (over a metre clear).
  const door=group(store,[1.13,0,2.70],-Math.PI/2);pane(door,-.53,1.40,0,1.06,2.46);cs(1.13,2.17,.10,1.12);
  rod(door,[-.96,1.10,.06],[-.96,1.55,.06],.017,C.cream);
  softBox(door,[-.53,.285,0],[1.02,.22,.065],'#849b9b');
  for(const y of [.38,2.36])cylinder(door,[0,y,0],.022,.022,.09,'#b8c0b6',12,false);
  box(store,[.55,.151,2.70],[1.14,.012,.32],'#8c9d9a',false);
  surfaceBox(store,[.54,.150,2.00],[.90,.008,.76],'#667775','fabric');
  // The alley side is also glazed, so the junction has two active frontages.
  const side=group(store,[2.98,0,0],Math.PI/2);
  for(const x of [-1.60,0,1.60])pane(side,x,1.52,0,1.53,2.24);
  surfaceBox(side,[0,.28,0],[5.48,.27,.13],C.teal,'brick');
  cs(2.98,0,.10,5.4);
  box(side,[0,2.96,.04],[5.7,.42,.14],C.teal,false);
  sign(side,'AOKI / DAILY STORE',[0,2.97,.12],[4.4,.3],{bg:C.teal,fg:'#efdfbd',border:false});
  for(const x of [-2.85,-.05,1.18,2.92]){box(store,[x,1.495,2.73],[.09,2.70,.10],C.metal,false);cs(x,2.73,.09,.1);}
  // Lit back shelves, varied package silhouettes, separate payment counter.
  for(const y of [.56,1.05,1.55,2.05]){
    box(store,[-.5,y,-2.38],[4.48,.06,.46],C.metal,false);
    box(store,[-.5,y+.038,-2.13],[4.48,.035,.015],coolGlow,false);
    for(let i=0;i<19;i++){
      if(i===8&&y>1.5)continue;
      const x=-2.57+i*.233;
      if(y>2&&i<4)bottle(store,[x,y+.035,-2.3],i).scale.setScalar(1.35);
      else grocery(store,[x,y+.035,-2.29+(i%2)*.018],Math.floor(i/4)+Math.round(y*7));
    }
  }
  cs(-.5,-2.36,4.6,.48);
  for(const x of [-1.65,-.58]){
    box(store,[x,.78,-.05],[.10,1.26,2.2],'#859b92',false);cs(x,-.05,.63,2.2);
    for(const y of [.38,.79,1.20]){
      box(store,[x,y,-.05],[.68,.045,2.20],'#aab8a9',false);
      for(let j=0;j<6;j++)for(const s of [-1,1])grocery(store,[x+s*.19,y+.025,-.90+j*.32],Math.floor(j/3)+Math.round(y*6)+(s>0?3:0));
    }
  }
  softBox(store,[2.04,.67,1.42],[1.05,1.05,.92],C.teal);cs(2.04,1.42,1.15,1.0);
  box(store,[2.04,1.23,1.42],[1.15,.08,1.0],C.cream,false);
  softBox(store,[2.04,1.285,1.40],[.24,.03,.22],C.metal);
  rod(store,[2.04,1.30,1.40],[2.04,1.46,1.33],.025,C.metal);
  softBox(store,[2.04,1.53,1.32],[.32,.22,.07],C.metal).rotation.x=-.2;
  for(const z of [-1.8,.5])box(store,[0,3.085,z],[3.4,.04,.12],coolGlow,false);
  
  const tower=group(store,[2.68,0,2.35]);
  box(tower,[0,4.56,0],[.65,2.12,.48],C.teal,false);
  sign(tower,'青木',[0,4.62,.26],[.50,1.64],{bg:C.teal,fg:'#eadeb8',vertical:true,border:false});
  // Rooftop billboard has a distinct horizontal mass rather than another pitched roof.
  const roofSign=group(store,[-.25,0,-1.0]);
  for(const x of [-1.5,1.5])rod(roofSign,[x,3.48,0],[x,5.06,0],.045,C.metal);
  sign(roofSign,'日常，刚刚好。',[0,4.66,0],[3.78,1.06],{bg:'#d6af61',fg:'#304e53',small:'AOKI — YOUR CORNER STORE',border:false});

  // The alley terminates in a small delivery court, with a stair silhouette at its end.
  // A taller service building closes the northern view; no exposed map edge past the shop.
  surfaceBox(root,[14.45,3.65,.25],[4.1,7.3,5.8],'#a9b2ac','plaster');solid(14.45,.25,4.1,5.8);
  box(root,[14.45,7.40,.25],[4.35,.20,6.02],C.metal,false);
  const workshop=group(root,[14.45,0,3.17]);
  surfaceBox(workshop,[0,1.20,0],[3.25,2.1,.09],'#748b8b','plaster');
  for(let y=.25;y<2.3;y+=.12)box(workshop,[0,y,.052],[3.22,.032,.025],'#9aacaa',false);
  sign(workshop,'南巷 · 配送站',[0,2.62,.06],[3.05,.36],{bg:'#344b55',fg:'#d6c6a6',border:false});
  for(const y of [4.0,5.9]){
    box(workshop,[0,y,.02],[3.14,1.05,.04],'#485f69',false);pane(workshop,0,y,.065,3.08,1.0);
    for(const x of [-1,0,1])box(workshop,[x,y,.10],[.045,1.0,.055],'#a5b1ac',false);
  }
  surfaceBox(root,[16.55,1.68,7.6],[.20,3.06,8.8],'#b6aaa0','brick');solid(16.55,7.6,.2,8.8);
  surfaceBox(root,[14.2,1.65,12.0],[4.8,3.0,.2],'#b6aaa0','plaster');solid(14.2,12,4.8,.2);
  const end=group(root,[16.42,0,5.0],-Math.PI/2);
  poster(end,[0,1.7,0],.88,1.30,'music');
  sign(end,'配送后院 →',[0,2.72,.02],[1.7,.3],{bg:'#344b55',fg:'#e7cc96',border:false});
  const steps=group(root,[13.1,0,11.35]);
  for(let i=0;i<16;i++){
    box(steps,[0,.25+i*.185,-i*.29],[1.20,.12,.32],'#819294',false);
    for(const s of [-1,1])rod(steps,[s*.57,.30+i*.185,-i*.29],[s*.57,1.13+i*.185,-i*.29],.013,C.metal);
  }
  for(const s of [-1,1])rod(steps,[s*.57,1.13,0],[s*.57,3.9,-4.35],.032,C.metal);
  // Steel stringers connect the tread undersides to actual footings and landing.
  for(const s of [-1,1]){
    rod(steps,[s*.46,.15,.10],[s*.46,2.965,-4.47],.085,C.metal,4);
    softBox(steps,[s*.46,.165,.06],[.30,.04,.32],C.metal);
  }
  solid(13.1,9.2,1.32,4.7); // stairs are scenic; no unsupported vertical navigation
  surfaceBox(root,[13.6,3.16,6.6],[2.4,.20,1.15],'#a7b1ad','paving');
  for(const x of [12.52,14.67]){
    box(root,[x,1.60,6.6],[.12,2.91,.12],C.metal,false);
    softBox(root,[x,.17,6.6],[.28,.05,.28],C.metal);solid(x,6.6,.28,.28);
  }
  rail(root,[12.43,6.08],[14.76,6.08],3.29);rail(root,[14.76,6.08],[14.76,7.10],3.29);
  for(let i=0;i<3;i++)parcel(root,[15.2+(i%2)*.46,.15,9.8+Math.floor(i/2)*.5],[.4,.38,.4],i);
  solid(15.45,10.05,1.0,1.0);
  pottedPlant(root,15.8,.145,6.6,1.3);solid(15.8,6.6,.55,.55);
  // Diner forecourt stays asymmetrical and navigable; seats sit away from the NPC.
  const table=group(root,[5.35,0,11.8]);
  cylinder(table,[0,.87,0],.40,.40,.065,C.wood,32,false);rod(table,[0,.15,0],[0,.83,0],.04,C.metal);
  bowl(table,[-.13,.91,0],0);bottle(table,[.17,.91,.03],1);solid(5.35,11.8,.82,.82);
  for(const z of [11.10,12.50])stool(root,5.35,z,solid);
  pottedPlant(root,6.8,.145,13.1,1.1);solid(6.8,13.1,.5,.5);
  // A dark drain anchors the narrow passage and reinforces its direction.
  box(root,[13.0,.151,3.6],[5.9,.012,.17],C.metal,false);
  for(let x=10.1;x<16;x+=.12)box(root,[x,.16,3.6],[.025,.008,.16],'#abb2a9',false);
  // Both ends bolt into real service walls; no unsupported end in the open sky.
  wire(root,[[9.70,2.72,5.76],[12.05,2.57,4.55],[14.45,3.0,3.22]],C.metal,.015);
  box(root,[9.70,2.72,5.779],[.15,.20,.045],C.metal,false);
  box(root,[14.45,3.0,3.175],[.18,.22,.06],C.metal,false);
  cornerFinishing(diner,store,ds,cs);
  replaceBuildingTop(diner,'DinerUpper',2.925);
  replaceBuildingTop(store,'StoreCrown',2.67);
  counterware.push(...shopDressing(diner,store).counterGroups);
  // Geometry-derived checks run before static batching/landscape bending. Contact
  // is allowed, but overlap beyond 2 mm or a support gap above 1 cm is a defect.
  root.updateMatrixWorld(true);
  const bounds=o=>new THREE.Box3().setFromObject(o);
  const intersects=(a,b)=>['x','y','z'].every(k=>Math.min(a.max[k],b.max[k])-Math.max(a.min[k],b.min[k])>.002);
  const cabinetBounds=bounds(kitchenCabinet),topBounds=bounds(worktop),counterBounds=bounds(counter);
  const supported=(item,support)=>{const b=bounds(item),s=bounds(support);return b.min.y>=s.max.y-.002&&b.min.y-s.max.y<.01;};
  const placementChecks={
    调料瓶避开操作台:spices.every(b=>!intersects(bounds(b),cabinetBounds)&&!intersects(bounds(b),topBounds)),
    餐具贴合台面:counterware.every(b=>supported(b,counter)),
    餐具位于台面以内:counterware.every(o=>{const b=bounds(o);return b.min.x>counterBounds.min.x&&b.max.x<counterBounds.max.x&&b.min.z>counterBounds.min.z&&b.max.z<counterBounds.max.z;}),
    汤锅落在炉盘上:supported(pot,hob),
    门框底部贴合地面:Math.abs(bounds(door).min.y-.145)<.015,
  };
  return {diner,store,placementChecks};
}
