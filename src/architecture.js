import * as THREE from 'three';
import {box,rod,wire,cylinder,mesh,group,sign} from './art.js';
import {surfaceBox,pottedPlant} from './scenery-detail.js';
import {softBox,printedCard} from './shop-props.js';
import {shopKind,urbanColors} from './urban-fronts.js';

const metal='#46525b',concrete='#aaa9a1',edge='#ded9cf';
const glazing=new THREE.MeshPhongMaterial({color:'#536f80',shininess:75,specular:'#c0cbd2'});
function rail(p,x,y,z,w){
  for(const yy of [y,y+.62])rod(p,[x-w/2,yy,z],[x+w/2,yy,z],.022,metal);
  for(let xx=x-w/2;xx<x+w/2+.01;xx+=.21)rod(p,[xx,y,z],[xx,y+.62,z],.012,metal);
}
function windowBay(p,x,y,z,w,h,project=.24,warm=false){
  // Shadow-box recess, deep sill and lintel, rubber seals, opening sash and glass.
  box(p,[x,y,z],[w+.19,h+.19,.09],'#3a414b',false);
  box(p,[x,y,z+project*.48],[w+.12,h+.10,project],metal,false);
  mesh(p,new THREE.PlaneGeometry(w-.08,h-.08),warm?'#a89a81':glazing,[x,y,z+project+.005],false);
  for(const sx of [-1,1])box(p,[x+sx*w/2,y,z+project+.03],[.045,h+.08,.08],edge,false);
  for(const sy of [-1,1])softBox(p,[x,y+sy*h/2,z+project+.06],[w+.24,.075,.20],concrete);
  box(p,[x,y,z+project+.04],[.043,h,.05],metal,false);
  box(p,[x,y-.14,z+project+.04],[w,.035,.05],metal,false);
  box(p,[x+w*.34,y,z+project+.046],[.015,h*.82,.012],'#b5bbb5',false);
  box(p,[x+w*.06,y-.04,z+project+.082],[.025,.10,.025],'#a4b2b8',false);
  if(warm)for(let i=0;i<5;i++)box(p,[x-w*.35+i*.14,y,z+project+.02],[.044,h*.84,.01],'#c8bda9',false);
}
function compressor(p,x,y,z){
  softBox(p,[x,y,z],[.80,.47,.34],'#b6b8b0');
  const disk=cylinder(p,[x-.14,y,z+.182],.167,.167,.02,'#343e45',24,false);disk.rotation.x=Math.PI/2;
  for(let i=0;i<4;i++){const ring=mesh(p,new THREE.TorusGeometry(.045+i*.035,.0035,4,24),'#8b9698',[x-.14,y,z+.199],false);}
  for(let i=0;i<8;i++)rod(p,[x-.295+i*.044,y-.11,z+.2],[x-.295+i*.044,y+.11,z+.2],.003,'#8b9698',4);
  for(let i=0;i<6;i++)box(p,[x+.25,y-.15+i*.055,z+.177],[.16,.018,.01],'#747e80',false);
  for(const s of [-1,1])wire(p,[[x+s*.28,y-.15,z-.08],[x+s*.28,y-.33,z-.08],[x+s*.28,y-.33,z+.21]],metal,.018);
  wire(p,[[x+.4,y-.03,z],[x+.52,y-.05,z],[x+.53,y-.52,z-.16],[x+.59,y-.61,z-.16]],'#d3cbbc',.025);
}
function ladder(p,x,y,z,height){
  for(const s of [-1,1])rod(p,[x+s*.24,y,z],[x+s*.24,y+height,z],.024,metal);
  for(let yy=y+.12;yy<y+height;yy+=.26)rod(p,[x-.24,yy,z],[x+.24,yy,z],.017,metal);
  for(let yy=y+.4;yy<y+height;yy+=1.2)for(const s of [-1,1])rod(p,[x+s*.24,yy,z],[x+s*.24,yy,z-.22],.022,metal);
}
export function architecture(p,{w,d,h,name,type}){
  if(!name)return;
  const z=d/2,kind=shopKind(name,type),[bg,accent]=urbanColors(name,type);
  const industrial=['repair','photo'].includes(kind),brick=['post','books'].includes(kind);
  // Replace the upper facade rather than stacking detail over the old windows.
  surfaceBox(p,[0,(h+3)/2,z+.025],[w-.24,h-3,.085],brick?'#ada398':industrial?'#929d9f':'#c3b6a5',brick?'brick':'plaster');
  for(let y=3.02;y+1.55<h;y+=1.8){
    softBox(p,[0,y,z+.105],[w+.06,.13,.22],edge);
    if(kind==='photo'){
      // Projecting studio glazing with diagonal fins and a contrasting side tower.
      for(const x of [-w*.26,0,w*.26])windowBay(p,x,y+.86,z+.15,w*.24,1.32,.35);
      for(const x of [-w*.40,w*.40]){const fin=box(p,[x,y+.8,z+.48],[.13,1.64,.50],bg,false);fin.rotation.y=.22;}
    }else if(kind==='noodle'){
      windowBay(p,-w*.23,y+.81,z+.14,w*.35,1.24,.29,true);
      windowBay(p,w*.19,y+.81,z+.10,w*.28,1.24,.16);
      surfaceBox(p,[-w*.23,y+.12,z+.53],[w*.42,.13,.87],'#b8b5ad','paving');
      rail(p,-w*.23,y+.21,z+.91,w*.43);
      for(let i=0;i<2;i++)pottedPlant(p,-w*.32+i*.48,y+.20,z+.64,.55);
    }else if(kind==='post'){
      for(const x of [-w*.24,w*.24])windowBay(p,x,y+.84,z+.11,w*.32,1.17,.22,true);
      for(const x of [-w*.46,0,w*.46])surfaceBox(p,[x,y+.86,z+.12],[.17,1.68,.25],'#d8d1c4','plaster');
    }else{
      windowBay(p,-w*.23,y+.86,z+.10,w*.32,1.18,.22,kind==='books');
      windowBay(p,w*.20,y+.86,z+.10,w*.30,1.18,.13);
      if(y+1.5<h)compressor(p,w*.30,y+.14,z+.39);
    }
  }
  // Roof overhang and two-tier cornice give a strong silhouette in oblique views.
  softBox(p,[0,h+.02,z+.15],[w+.38,.14,.56],metal);
  softBox(p,[0,h-.19,z+.13],[w+.17,.11,.30],edge);
  for(let x=-w/2+.3;x<w/2;x+=.43)box(p,[x,h-.29,z+.15],[.10,.16,.23],concrete,false);
  // External service spine: elbows, pipe clamps and a junction box, not flat lines.
  const px=w*.46;
  wire(p,[[px,.3,z+.26],[px,.5,z+.26],[px,h-.55,z+.26],[px-.20,h-.32,z+.26],[px-.20,h+.25,z+.1]],'#646d70',.054);
  for(let y=.65;y<h-.3;y+=.88){box(p,[px,y,z+.21],[.15,.055,.12],metal,false);for(const s of [-1,1])cylinder(p,[px+s*.062,y,z+.28],.009,.009,.009,'#d2ccc0',6,false).rotation.x=Math.PI/2;}
  wire(p,[[-w*.45,2.98,z+.22],[-w*.18,2.99,z+.23],[w*.26,3.06,z+.26],[w*.39,3.22,z+.28]],'#343a43',.018);
  if(kind==='noodle'){
    // Stainless extraction chimney, wall brackets and louvred cap.
    const vx=-w*.45;
    softBox(p,[vx,4.3,z+.52],[.34,2.8,.31],'#909da1');
    for(let y=3.1;y<5.8;y+=.38)box(p,[vx,y,z+.688],[.35,.03,.025],'#56636c',false);
    softBox(p,[vx,5.82,z+.35],[.55,.27,.64],'#626e76');
    for(let y=5.74;y<5.95;y+=.055)box(p,[vx,y,z+.682],[.46,.025,.02],'#b1b6b0',false);
    sign(p,'小满\n热汤研究所',[w*.20,5.52,z+.44],[1.1,.66],{bg:'#b44939',fg:'#f0e2c7',small:'SINCE 1986',border:false});
  }
  if(kind==='photo'||kind==='repair'){
    // Hard cantilever canopies replace striped fabric on industrial shop fronts.
    softBox(p,[0,2.03,z+.57],[w+.22,.17,1.20],bg);
    for(let x=-w/2+.3;x<w/2;x+=.36)box(p,[x,2.14,z+.55],[.042,.08,1.1],metal,false);
    for(const s of [-1,1])rod(p,[s*w*.42,2.05,z+1.1],[s*w*.42,2.95,z+.17],.019,metal);
    if(kind==='repair'){
      surfaceBox(p,[w*.19,1.16,z+.46],[w*.36,1.6,.08],'#74817b','plaster');
      for(let yy=.42;yy<1.91;yy+=.075)box(p,[w*.19,yy,z+.51],[w*.36,.025,.04],'#a2aba3',false);
      sign(p,'修理 / 轮胎',[w*.19,1.25,z+.54],[1.22,.32],{bg:'#39474c',fg:'#d2ad5c',border:false});
    }
  }
  if(kind==='books'){
    surfaceBox(p,[-w*.18,4.90,z+.49],[w*.58,.12,.85],'#ada69a','paving');
    rail(p,-w*.18,4.98,z+.87,w*.60);ladder(p,w*.39,3.02,z+.53,h-2.85);
    sign(p,'BOOKS & RECORDS',[0,3.06,z+.3],[w*.76,.24],{bg,fg:accent,border:false});
  }
  // Door transom, metal kickplate and intercom make the eye-level entrance readable.
  const dx=-w*.23;
  softBox(p,[dx,.24,z+.27],[.86,.28,.055],metal);
  box(p,[dx,1.82,z+.22],[.90,.035,.03],metal,false);
  softBox(p,[dx+.64,1.34,z+.31],[.12,.22,.075],'#aab0aa');
  for(let i=0;i<4;i++)box(p,[dx+.64,1.36+i*.02,z+.35],[.06,.006,.01],'#424b52',false);
  sign(p,String(Math.round(w*7)),[dx-.67,1.72,z+.29],[.22,.14],{bg:'#314753',fg:'#efdfb6',width:128,height:96,border:false});
  // Asymmetric sticker and notice cluster beside, rather than across, the doorway.
  for(let i=0;i<3;i++)printedCard(p,[w*.41,1.40-i*.25,z+.42],.20,.22,8+i).rotation.z=(i-1)*.065;
}
