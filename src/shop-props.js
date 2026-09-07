import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {box,cylinder,rod,mesh,group,material} from './art.js';

// One print atlas for postage labels, book covers and shop cards.
const paper=document.createElement('canvas');paper.width=paper.height=1024;
const ctx=paper.getContext('2d');
const titles=['南巷邮便','书信与夏天','小满食堂','青木商店','长夏照相','旧书与信','慢慢喝茶','顺风修理','南巷花店','白日理发','周末书单','今日来信','夏日特调','营业时间','街区小报','南巷地图'];
const colors=['#e9dfc7','#c9d8cf','#e2bbaa','#d8d3ba'];
for(let i=0;i<16;i++){
  const x=i%4*256,y=Math.floor(i/4)*256;
  ctx.fillStyle=colors[i%4];ctx.fillRect(x,y,256,256);ctx.strokeStyle='#817567';ctx.lineWidth=2;ctx.strokeRect(x+13,y+13,230,230);
  ctx.fillStyle='#4b625c';ctx.textAlign='center';ctx.font="bold 28px 'Microsoft YaHei'";ctx.fillText(titles[i],x+128,y+53);
  ctx.font="13px 'Microsoft YaHei'";ctx.fillText(i===0?'收件地址 · 南巷街 07 号':'NANXIANG / SUMMER DAYS',x+128,y+78);
  ctx.strokeStyle='#8a9d87';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+128,y+140,37,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+93,y+143);ctx.lineTo(x+128,y+168);ctx.lineTo(x+166,y+120);ctx.stroke();
  ctx.font='12px monospace';ctx.fillStyle='#786b5a';ctx.fillText('1986 — 2026',x+128,y+207);
  for(let j=0;j<32;j++)ctx.fillRect(x+52+j*5,y+220,j%3===0?3:1,12);
}
const printTexture=new THREE.CanvasTexture(paper);printTexture.colorSpace=THREE.SRGBColorSpace;printTexture.anisotropy=8;
const printMaterial=new THREE.MeshLambertMaterial({map:printTexture});
export function printedCard(p,pos,w,h,index=0){
  const g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv,col=index%4,row=Math.floor(index/4);
  for(let i=0;i<uv.count;i++)uv.setXY(i,(col+.012+uv.getX(i)*.976)/4,(3-row+.012+uv.getY(i)*.976)/4);
  const card=mesh(p,g,printMaterial,pos,false);card.castShadow=false;return card;
}
const shapes=new Map();
export function softBox(p,pos,size,color){
  const key=size.join(',');if(!shapes.has(key))shapes.set(key,new RoundedBoxGeometry(...size,2,Math.min(...size)*.08));
  return mesh(p,shapes.get(key),color,pos,false);
}
export function parcel(p,pos,size=[.22,.17,.15],index=0){
  const g=group(p,pos),[w,h,d]=size;
  softBox(g,[0,h/2,0],size,index%2?'#c0a384':'#cdb292');
  box(g,[0,h+.0007,0],[w*.14,.001,d+.002],'#e1cfac',false);
  box(g,[0,h/2,d/2+.001],[w*.14,h,.002],'#e1cfac',false);
  printedCard(g,[w*.12,h*.52,d/2+.003],w*.48,h*.60,0);
  box(g,[-w*.32,h*.77,d/2+.003],[w*.09,h*.13,.002],'#986e61',false);
  return g;
}
export function book(p,pos,index=0,size=[.10,.24,.17]){
  const b=group(p,pos),[w,h,d]=size,color=['#ae796c','#7e9b89','#8b95ad','#c0a16e'][index%4];
  box(b,[0,h/2,0],[w-.01,h-.012,d-.012],'#e8dfce',false);
  for(const s of [-1,1])box(b,[s*(w/2-.003),h/2,0],[.006,h,d],color,false);
  softBox(b,[0,h/2,d/2],[w,h,.016],color);
  printedCard(b,[0,h/2,d/2+.01],w*.85,h*.8,(index%5)+1);
  for(let j=1;j<5;j++)box(b,[0,h*j/5,-d/2+.004],[w-.012,.001,.002],'#cbbfa9',false);
  return b;
}
export function bowl(p,pos,index=0,utensils=true){
  const b=group(p,pos);const points=[new THREE.Vector2(.025,0),new THREE.Vector2(.04,.014),new THREE.Vector2(.077,.055),new THREE.Vector2(.079,.067),new THREE.Vector2(.071,.067),new THREE.Vector2(.065,.052),new THREE.Vector2(.022,.009)];
  mesh(b,new THREE.LatheGeometry(points,20),index%2?'#b6c7ba':'#e7dac3',[0,0,0],false);
  cylinder(b,[0,.049,0],.061,.061,.003,'#ac8450',20,false);
  for(let i=0;i<4;i++){const noodle=mesh(b,new THREE.TorusGeometry(.023+i*.006,.002,4,18,4.5),'#ecddb7',[(i-1.5)*.003,.053+i*.001,0],false);noodle.rotation.x=Math.PI/2;noodle.rotation.z=i;}
  for(let i=0;i<5;i++)box(b,[(i-2)*.012,.059,Math.sin(i)*.023],[.009,.003,.014],'#79966e',false);
  if(utensils)for(const x of [-.011,.011])rod(b,[x,.09,-.09],[x+.015,.078,.086],.003,'#9d7551',5);
  return b;
}
export function bottle(p,pos,index=0){
  const b=group(p,pos),color=['#8ba797','#bca179','#879db1'][index%3];
  cylinder(b,[0,.075,0],.028,.03,.15,color,12,false);cylinder(b,[0,.16,0],.017,.027,.024,color,12,false);cylinder(b,[0,.19,0],.012,.017,.04,color,10,false);cylinder(b,[0,.215,0],.015,.015,.012,'#d3c7ad',10,false);
  printedCard(b,[0,.08,.031],.045,.065,index%2?6:12);
  return b;
}

export function shopFinishing(p,{w,d,name,type}){
  if(!name)return;
  const z=d/2;
  // Fabric valance with a scalloped hem and stitched stripe edges.
  const count=Math.floor(w/.32),strip=w/count;
  for(let i=0;i<count&&!name.includes('修理')&&!name.includes('照相');i++){
    const x=-w/2+(i+.5)*strip;
    const shape=new THREE.Shape();shape.moveTo(-strip/2,.10);shape.lineTo(strip/2,.10);shape.lineTo(strip/2,-.015);shape.quadraticCurveTo(0,-.10,-strip/2,-.015);shape.closePath();
    const hem=mesh(p,new THREE.ShapeGeometry(shape,8),material(i%2?'#e8e0cf':type==='noodle'?'#bc8572':'#78958b',{side:THREE.DoubleSide}),[x,1.855,z+1.122],false);
    rod(p,[x-strip/2,1.97,z+1.124],[x-strip/2,1.85,z+1.124],.003,'#bdbaa8',4);
  }
  // Notice board and a small dimensional frame at eye level.
  const x=-w*.42;softBox(p,[x,1.18,z+.19],[.43,.58,.055],'#977e66');
  printedCard(p,[x,1.18,z+.221],.38,.53,type==='post'?11:type==='noodle'?2:13);
  for(const yy of [.94,1.42])for(const xx of [-.16,.16])cylinder(p,[x+xx,yy,z+.225],.005,.005,.007,'#c6bba5',6,false).rotation.x=Math.PI/2;
  // Round door handle and hinges replace the flat painted bar.
  for(const yy of [.55,1.6])softBox(p,[-w*.23-.46,yy,z+.175],[.023,.10,.018],'#aaa38f');
  const handleX=-w*.23+.30;rod(p,[handleX,.79,z+.18],[handleX,.79,z+.26],.009,'#c0b9a1',8);rod(p,[handleX,1.02,z+.18],[handleX,1.02,z+.26],.009,'#c0b9a1',8);rod(p,[handleX,.79,z+.26],[handleX,1.02,z+.26],.012,'#c0b9a1',10);
}
