import * as THREE from 'three';
import {updateFoliage} from './foliage-motion.js';
import {cityBackdrop} from './city-backdrop.js';
import {streetWear} from './street-wear.js';
import {authoredAsset} from './authored-assets.js';
import {palette as P,material,mesh,box,sphere,cylinder,rod,wire,group,sign,batchStatic} from './art.js';
import {surfaceBox,leafyTree,pottedPlant,windowDetail,shopDetail,shopThreshold,roofTiles} from './scenery-detail.js';
import {softBox} from './shop-props.js';
import {urbanFront,urbanColors,urbanEffects,shopKind} from './urban-fronts.js';
import {architecture} from './architecture.js';
import {makeCornerBlock} from './corner-block.js';
export const colliders=[];
let seed=48;
const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
function solid(x,z,w,d){colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2})}

function windowUnit(p,x,y,z,w=1.0,h=1.2,shutter=false){
 box(p,[x,y,z],[w+.14,h+.14,.09],P.cream);box(p,[x,y,z+.058],[w,h,.025],P.dark,false);
 for(const dx of [-w/2,0,w/2])box(p,[x+dx,y,z+.083],[.042,h,.047],P.mint,false);
 box(p,[x,y-.11,z+.085],[w,.032,.041],P.mint,false);
 box(p,[x,y-h/2-.065,z+.14],[w+.27,.075,.27],P.wall);
 if(shutter){for(const s of [-1,1]){const sh=group(p,[x+s*(w/2+.18),y,z]);sh.rotation.y=s*.18;box(sh,[0,0,0],[.30,h,.055],P.mint);for(let i=0;i<8;i++)box(sh,[0,-h*.43+i*h/8,.036],[.28,.026,.023],P.ink,false)}}
 else{box(p,[x-w*.23,y+.04,z+.073],[w*.38,h*.85,.01],'#9caaa0',false)}
 windowDetail(p,x,y,z,w,h);
}
function ac(p,x,y,z){box(p,[x,y,z],[.85,.52,.38],'#a9b6a1');box(p,[x+.19,y,z+.201],[.34,.37,.017],P.dark);const fan=cylinder(p,[x+.19,y,z+.22],.147,.147,.026,P.wall,16);fan.rotation.x=Math.PI/2;for(let i=0;i<5;i++)box(p,[x-.22,y-.16+i*.077,z+.204],[.24,.022,.012],P.ink,false);wire(p,[[x+.42,y-.14,z],[x+.54,y-.15,z],[x+.54,y-.52,z-.2],[x+.6,y-.65,z-.2]],'#7c8d77',.025)}
function roof(p,w,d,y,color){
 const v=[-w/2,y,d/2,w/2,y,d/2,0,y+1.1,d/2,-w/2,y,-d/2,w/2,y,-d/2,0,y+1.1,-d/2];const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex([0,1,2,5,4,3,0,2,5,0,5,3,2,1,4,2,4,5]);g.computeVertexNormals();mesh(p,g,color);
 for(const s of [-1,1])rod(p,[s*(w/2+.12),y+.04,d/2+.12],[0,y+1.19,d/2+.12],.065,P.ink);rod(p,[0,y+1.18,-d/2-.12],[0,y+1.18,d/2+.12],.058,P.ink)
 if(d<5)roofTiles(p,w,d,y);
}
function building(parent,{x,z,w,d,h,yaw=0,color=P.wall,name,type='shop',roofed=false}){
 const p=group(parent,[x,0,z],yaw);surfaceBox(p,[0,h/2,0],[w,h,d],color,'plaster');solid(x,z,yaw?w===d?w:d:w,yaw?w:d);
 const front=d/2;box(p,[0,.22,0],[w+.13,.44,d+.1],'#9aa48e');
 // Deliberately sparse plaster seams instead of full surface noise.
 for(let i=1;i<3;i++)box(p,[0,h*i/3,front+.009],[w,.014,.012],'#b4b5a9',false);
 for(const sx of [-1,1])box(p,[sx*(w/2-.07),h/2,front+.034],[.075,h,.06],'#a3b19a',false);
 if(roofed)roof(p,w+.24,d+.24,h,P.ink);else{box(p,[0,h+.06,0],[w+.25,.18,d+.24],P.cream);box(p,[0,h+.31,-d/2+.09],[w,.47,.18],color);for(const s of [-1,1])box(p,[s*(w/2-.09),h+.28,0],[.18,.42,d],color);cylinder(p,[w*.22,h+.59,-.18],.61,.62,1.1,'#95a68c',12);rod(p,[w*.22,h+1.2,-.18],[w*.22,h+1.45,-.18],.065,P.ink);rod(p,[-w*.31,h+.1,0],[-w*.31,h+2.2,0],.018,P.ink);for(let i=0;i<3;i++)rod(p,[-w*.31-.4+i*.10,h+1.7+i*.14,0],[-w*.31+.4-i*.10,h+1.7+i*.14,0],.013,P.ink)}
 const floors=name?0:Math.max(1,Math.floor((h-2.3)/1.9));for(let level=0;level<floors;level++){const y=3.3+level*1.8;if(y+.6>h)continue;for(let i=0;i<Math.floor(w/1.8);i++)windowUnit(p,(i-(Math.floor(w/1.8)-1)/2)*1.7,y,front+.04,1.03,1.12,(level+i)%3===0)}
 // Ground floor: an actual inset doorway, with an illustrated shop front.
 box(p,[-w*.23,1.06,front+.047],[1.13,2.0,.09],P.ink);box(p,[-w*.23,1.02,front+.109],[.96,1.89,.05],'#425d50');box(p,[-w*.23,1.36,front+.142],[.69,.92,.014],'#8eab96',false);box(p,[-w*.23+.29,.9,front+.2],[.035,.24,.05],P.cream);box(p,[-w*.23,.08,front+.21],[1.32,.16,.51],P.cream);
 windowUnit(p,w*.20,1.21,front+.08,Math.max(1,w*.32),1.52);
 if(name&&!['repair','photo'].includes(shopKind(name,type))){
 const aw=group(p,[0,2.08,front+.56]);const awning=box(aw,[0,0,0],[w+.16,.06,1.10],urbanColors(name,type)[0]);awning.rotation.x=.18;for(let i=0;i<Math.floor(w/.32);i++)box(aw,[-w/2+i*.32+.16,-.009,.08],[.155,.055,.93],P.cream,false).rotation.x=.18;box(p,[0,1.97,front+1.08],[w+.18,.22,.07],urbanColors(name,type)[0]);
 }
 if(!name)ac(p,w*.31,Math.min(h-.65,3.9),front+.22);
 for(const s of [-1,1])rod(p,[s*(w/2-.15),.12,front+.12],[s*(w/2-.15),h-.12,front+.12],.045,'#798e78');
 sign(p,'巷',[w/2-.39,1.9,front+.17],[.38,.35],{bg:'#dbe0c5',fg:'#427367',border:false,width:128,height:128});
 if(type==='post'){const hanging=group(p,[-w/2-.3,3.65,front-.1],Math.PI/2);sign(hanging,'邮便',[0,0,0],[.66,1.6],{bg:'#bb9458',fg:'#f1e6ca',vertical:true,width:192,height:512});rod(p,[-w/2+.1,4.52,front-.1],[-w/2-.65,4.52,front-.1],.036,P.ink)}
 // Side facade windows make the oblique view feel like a lived-in block.
 const side=group(p,[w/2+.02,0,0],Math.PI/2);for(let j=0;j<Math.floor(d/1.6);j++){windowUnit(side,(j-(Math.floor(d/1.6)-1)/2)*1.5,3.3,0,.83,1.1);if(h>6)windowUnit(side,(j-(Math.floor(d/1.6)-1)/2)*1.5,5.2,0,.83,1.1)}
 shopDetail(p,{w,d,h,name,type,color});
 urbanFront(p,{w,d,name,type});
 architecture(p,{w,d,h,name,type});
 return p;
}
function tree(p,x,z,s=1){solid(x,z,.36*s,.36*s);return leafyTree(p,x,z,s)}
function pot(p,x,y,z,s=1){solid(x,z,.43*s,.43*s);return pottedPlant(p,x,y,z,s,true)}
function bench(p,x,z,yaw=0){const b=group(p,[x,0,z],yaw);for(let i=0;i<4;i++)box(b,[0,.46,-.19+i*.12],[1.8,.045,.10],'#b9aa7d');for(let i=0;i<3;i++)box(b,[0,.70+i*.13,.25],[1.8,.09,.06],'#b9aa7d');for(const s of [-1,1]){box(b,[s*.68,.23,0],[.06,.46,.37],P.ink);rod(b,[s*.68,.22,.25],[s*.68,1.02,.25],.032,P.ink)}solid(x,z,yaw? .7:1.9,yaw?1.9:.7);return b}
function lamp(p,x,z){cylinder(p,[x,2.65,z],.055,.085,5.3,'#54705f',9);wire(p,[[x,5.25,z],[x,5.56,z],[x+.3,5.68,z],[x+.62,5.52,z]],P.ink,.045);const shade=cylinder(p,[x+.61,5.46,z],.07,.26,.17,P.ink,12);cylinder(p,[x+.61,5.365,z],.20,.20,.018,P.cream,12,false);solid(x,z,.25,.25)}
function pole(p,x,z){cylinder(p,[x,3.7,z],.071,.12,7.4,'#748071',9);box(p,[x,6.7,z],[1.13,.09,.09],P.ink);for(let i=0;i<3;i++){cylinder(p,[x-.43+i*.43,6.84,z],.065,.065,.19,P.cream,7);wire(p,[[x-.43+i*.43,6.94,z],[x-.40+i*.43,5.9,z-6],[x-.43+i*.43,6.94,z-13]],P.ink,.012)}for(let i=0;i<2;i++)box(p,[x,1.1+i*.30,z+.096],[.17,.22,.009],P.cream,false);solid(x,z,.3,.3)}
function bicycle(p,x,z,yaw=0){const b=authoredAsset('Bicycle');if(!b)return;b.position.set(x,.145,z);b.rotation.y=yaw;p.add(b);return b;}
function vending(p,x,z,yaw=0){const v=group(p,[x,0,z],yaw);box(v,[0,.94,0],[.9,1.85,.64],'#639b8c');box(v,[-.06,1.10,.33],[.66,1.13,.03],P.cream);for(let i=0;i<3;i++)for(let j=0;j<4;j++){cylinder(v,[-.29+j*.15,.72+i*.32,.368],.045,.045,.19,['#b78665','#c7cdb2','#86a294','#d5b879'][(i+j)%4],8,false);box(v,[-.29+j*.15,.58+i*.32,.37],[.08,.025,.01],P.ink,false)}box(v,[0,.29,.34],[.57,.20,.022],P.dark);box(v,[.34,.88,.34],[.07,.22,.024],P.ink);solid(x,z,.95,.75)}
function mailbox(p,x,z){const m=group(p,[x,0,z]);box(m,[0,.75,0],[.62,1.50,.49],P.red);const top=cylinder(m,[0,1.46,0],.33,.33,.50,P.red,16);top.rotation.x=Math.PI/2;box(m,[0,1.27,.261],[.39,.07,.018],P.ink);sign(m,'邮',[0,.97,.27],[.24,.3],{bg:'#b36a53',fg:'#eee6cc',border:false,width:128,height:128});box(m,[0,.24,.25],[.40,.31,.018],P.red);solid(x,z,.65,.60)}
function cat(p,x,z){const c=group(p,[x,.15,z],.5);sphere(c,[0,.16,0],[.22,.20,.34],'#c69c6b',2);sphere(c,[0,.38,-.22],[.18,.16,.16],'#c69c6b',2);for(const s of [-1,1]){const ear=mesh(c,new THREE.ConeGeometry(.088,.17,3),P.red,[s*.11,.55,-.21],false);ear.rotation.z=-s*.2;sphere(c,[s*.075,.405,-.36],[.018,.016,.011],P.ink,1);box(c,[s*.13,.005,-.18],[.10,.06,.21],P.cream,false)}wire(c,[[.10,.15,.23],[.31,.17,.42],[.4,.31,.38],[.36,.38,.28]],'#ad8259',.037);return c}
export function makeWorld(scene){
 const root=new THREE.Group();
 // The main street opens into a set-back corner court and an east-running alley.
 box(root,[0,-.22,-7.5],[42,.4,65],'#bbc2a5',false);surfaceBox(root,[0,-.005,-2],[8,.08,54],'#919d9f','asphalt');
 for(const s of [-1,1]){surfaceBox(root,[s*4.9,.055,-2],[1.85,.17,54],'#e1dbce','paving');for(let curbZ=-28;curbZ<25;curbZ+=.72){if(s===1&&curbZ>2.5&&curbZ<6)continue;softBox(root,[s*4.03,.13,curbZ+.35],[.15,.14,.70],'#d5ccbd');}if(s===-1)box(root,[s*3.54,.052,-2],[.065,.008,53],'#eee9dd',false);else for(const [z,d] of [[-12.5,31],[15.7,18]])box(root,[3.54,.052,z],[.065,.008,d],'#eee9dd',false);}
 // Small broken center marks, a manhole, patched asphalt and crossing.
 for(let z=-28;z<25;z+=4.4)box(root,[0,.045,z],[.11,.012,1.75],'#f4e9d5',false);
 for(let i=0;i<8;i++)box(root,[-2.7+i*.78,.052,4.2],[.40,.012,2.1],'#f2e8d7',false);
 for(let i=0;i<12;i++){const x=(rnd()-.5)*6.5,z=rnd()*46-24;wire(root,[[x,.038,z],[x+.12,.038,z+.16],[x-.04,.038,z+.3]],'#7c8988',.003)}
 const configs=[
 {x:-7.7,z:7,w:5.1,d:4.2,h:5.5,yaw:Math.PI/2,name:'南巷邮局',type:'post',roofed:true,color:'#d7c9b9'},
 {x:-7.7,z:.4,w:5.6,d:4.2,h:7.3,yaw:Math.PI/2,name:'白日理发',color:'#cad9d5'},
 {x:-7.8,z:-6.6,w:5.5,d:4.3,h:6.1,yaw:Math.PI/2,color:'#d5c4b7',name:'顺风修理'},
 {x:7.9,z:-6.2,w:5.4,d:4.5,h:8.3,yaw:-Math.PI/2,color:'#b8cad3',name:'长夏照相馆'},
 {x:-7.6,z:-13.4,w:5.0,d:4.0,h:7.0,yaw:Math.PI/2,color:'#d2bab0',name:'旧书与信'},
 {x:7.7,z:-13.8,w:6.2,d:4.2,h:5.9,yaw:-Math.PI/2,color:'#d4dfd8',name:'慢慢茶室',roofed:true},
 {x:-7.5,z:-20,w:4.9,d:4.1,h:5.4,yaw:Math.PI/2,color:'#c4d4c7',name:'南巷花店'},
 {x:7.7,z:-21,w:5.4,d:4.2,h:7.4,yaw:-Math.PI/2,color:'#ddd0c3'},
 {x:-7.7,z:17,w:5.8,d:4.2,h:6.7,yaw:Math.PI/2,color:'#c3cbd4'},
 {x:7.7,z:18,w:6.5,d:4.3,h:5.6,yaw:-Math.PI/2,color:'#d5c8c2',roofed:true}
 ];
 configs.forEach(c=>building(root,c));
 const corner=makeCornerBlock(root,solid);
 // Courtyards and a second row of houses close the empty gaps between shops.
 for(const s of [-1,1]){
  if(s===-1)surfaceBox(root,[s*10.6,.82,-1],[.18,1.64,53],'#c3c2b3','brick');
  else for(const [z,d]of [[-15,24],[20,12]])surfaceBox(root,[10.6,.82,z],[.18,1.64,d],'#c3c2b3','brick');
  for(const [i,z] of [-21,-8,6,20].entries()){
   if(s===1&&z===6)continue;
   const h=4.7+(i%3)*1.1,b=group(root,[s*14,0,z],-s*Math.PI/2);
   surfaceBox(b,[0,h/2,0],[9.2,h,5.5],['#ccc8b9','#c1c9c3','#d2c6b8'][i%3],'plaster');
   roof(b,9.4,5.7,h,'#8d9793');
   for(const y of [1.35,3.35])for(const x of [-3,-1,1,3])windowUnit(b,x,y,2.78,.88,1.15);
  }
 }
 shopThreshold(root,-5.1,-14.4,Math.PI/2,'books');solid(-5.1,-14.4,.4,1.15);
 shopThreshold(root,5.1,-15.8,-Math.PI/2,'cafe');solid(5.1,-15.8,.75,1.55);
 shopThreshold(root,-5.08,-21.35,Math.PI/2,'flowers');solid(-5.08,-21.35,.6,1.35);
 // Rooftop balconies, exterior stairs, rails and an elevated walkway.
 const stairs=group(root,[-10.4,0,-7],Math.PI/2);for(let i=0;i<14;i++)box(stairs,[0,.11+i*.22,-i*.26],[1.3,.18,.29],P.mint);for(const s of [-1,1]){rod(stairs,[s*.64,.8,.1],[s*.64,3.85,-3.4],.025,P.ink);for(let i=0;i<7;i++)rod(stairs,[s*.64,i*.44,-i*.52],[s*.64,.88+i*.44,-i*.52],.018,P.ink)}
 for(const [x,z] of [[-5.0,11.5],[4.7,-1.8],[-4.8,-10.2],[4.9,-18.1],[-4.8,21]])tree(root,x,z,1.1);
 for(const z of [17,3,-10,-23]){lamp(root,3.98,z===3?1.8:z);pole(root,-4.05,z)}
 for(let i=0;i<18;i++){const s=i%2===0?1:-1,z=-23+i*2.3;if(s===1&&z>-3&&z<14)continue;if((s<0&&Math.abs(z-2.35)<1.5)||(s>0&&Math.abs(z+10.3)<1.5)||(s<0&&z>-17&&z<-13))continue;pot(root,s*4.67,.145,z,.8+rnd()*.25)}
 mailbox(root,-4.65,8.2);vending(root,-5.01,-3.7,Math.PI/2);bicycle(root,-4.65,2.35,Math.PI/2);bicycle(root,4.65,-10.3,-Math.PI/2);
 for(const [x,z] of [[-4.65,2.35],[4.65,-10.3]])solid(x,z,.72,1.86);
 // Handwritten sandwich boards, crates, street notices and drain grates.
 for(const [x,z,name] of [[6.4,7,'SoupSign'],[-4.45,-15.65,'BookSign'],[4.45,-14.35,'TeaSign']]){const a=authoredAsset(name);a.position.set(x,.145,z);a.rotation.y=x>0?-Math.PI/2:Math.PI/2;root.add(a);solid(x,z,.55,.68);}
 for(let i=0;i<4;i++){const b=group(root,[-5.0,.17+i*.25,1.0]);box(b,[0,0,0],[.59,.23,.48],'#9c9972');for(let j=0;j<4;j++)box(b,[-.23+j*.15,0,.245],[.018,.20,.01],P.ink,false)}
 for(let z=-23;z<23;z+=7){box(root,[3.77,.06,z],[.31,.012,.54],P.dark,false);for(let j=0;j<6;j++)box(root,[3.77,.073,z-.22+j*.085],[.3,.012,.03],P.wall,false)}
 // Circular stop sign and quiet delivery van.
 const stop=group(root,[-4.05,0,13.1],Math.PI/2);rod(stop,[0,0,0],[0,2.9,0],.029,P.wall);const disk=cylinder(stop,[0,2.69,0],.40,.40,.08,P.red,12);disk.rotation.x=Math.PI/2;sign(stop,'慢',[0,2.69,.049],[.43,.43],{border:false,bg:'#d9ddbd',fg:'#557864',width:128,height:128});
 const van=authoredAsset('DeliveryVan');van.position.set(2.5,.035,-26);van.rotation.y=Math.PI;root.add(van);solid(2.5,-26,2.00,3.02);
 // Open river square at the end of the street.
 surfaceBox(root,[0,.075,-34],[18,.2,13],'#d8d3c6','paving');
 for(const x of [-8.1,8.1]){for(let z=-40;z<-27;z+=2.0){cylinder(root,[x,.75,z],.052,.07,1.2,P.cream,7);rod(root,[x,1.08,z],[x,1.08,z+2],.042,P.cream)}}
 for(const x of [-6,6]){tree(root,x,-33,1.7);bench(root,x,-36,0)}
 bench(root,-4.78,-18.3,Math.PI/2);
 const catNode=cat(scene,[-4.20][0],-17.1);
 // The water and its painted highlights sit below the quay.
 box(root,[0,-.56,-40],[18,1.3,.22],'#829b80');box(root,[0,-.66,-54],[80,.12,30],'#76ac98',false);for(let i=0;i<70;i++)box(root,[(rnd()-.5)*65,-.59,-41-rnd()*26],[.5+rnd()*3,.01,.025],'#b4cbb0',false);
 for(let x=-8;x<=8;x+=2){cylinder(root,[x,.73,-40],.055,.07,1.1,P.cream,7);rod(root,[x,1.06,-40],[x+2,1.06,-40],.037,P.cream)}
 // A few distant houses complete the skyline without competing with the street.
 box(root,[0,-.22,-77],[85,.4,24],'#9dae92',false);
 cityBackdrop(root);
 // Ground beyond the play space is enclosed by unobtrusive edge colliders.
 colliders.push({minX:-50,maxX:50,minZ:24,maxZ:70},{minX:-50,maxX:50,minZ:-80,maxZ:-39.3},{minX:-50,maxX:-8,minZ:-42,maxZ:-27},{minX:8,maxX:50,minZ:-42,maxZ:-27});
 streetWear(root);
 scene.add(batchStatic(root));
 const effects=urbanEffects(scene);
 return {update:time=>{effects(time);updateFoliage(time)},placementChecks:corner.placementChecks,cat:catNode,bench:{x:-4.25,z:-18.3},spawn:new THREE.Vector3(.45,0,13.2)};
}

export function makeSky(scene){
 scene.background=new THREE.Color(P.sky);scene.fog=new THREE.Fog(P.sky,42,115);
 const sky=new THREE.Group();
 // Flat irregular cloud silhouettes, like cut paper painted into the sky.
 for(let i=0;i<24;i++){const a=i*2.399,dist=72+rnd()*35,y=19+rnd()*26;const shape=new THREE.Shape();const count=24;
 for(let j=0;j<count;j++){const b=j/count*Math.PI*2;const rr=1+Math.sin(j*2.8)*.15;const x=Math.cos(b)*(7+rnd()*2)*rr;const yy=Math.sin(b)*(1.3+rnd()*1.1)*rr;if(j===0)shape.moveTo(x,yy);else shape.lineTo(x,yy)}shape.closePath();const m=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:i%3?'#f3eee7':'#e1e8e6',side:THREE.DoubleSide,fog:false}));m.position.set(Math.cos(a)*dist,y,Math.sin(a)*dist);m.lookAt(0,2,0);m.rotation.z=(rnd()-.5)*.5;sky.add(m)}
 scene.add(sky);return sky;
}
