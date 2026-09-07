import './style.css';
import {loadAuthoredAssets} from './authored-assets.js';
import * as THREE from 'three';
import {makeWorld,colliders} from './world.js';
import {makeUrbanSky} from './urban-sky.js';
import {loadCharacters,createCharacter} from './vrm-characters.js';
import {landscapePoint,curveYaw,curveY,groundHeight} from './landscape.js';
import {dinerActor} from './corner-block.js';
import {isBlocked} from './navigation.js';
import {streetLighting} from './street-lighting.js';

const $=id=>document.getElementById(id);
const canvas=$('world');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(57,innerWidth/innerHeight,.045,180);camera.rotation.order='YXZ';
const sun=streetLighting(renderer,scene);if(innerWidth<=800)sun.shadow.mapSize.set(2048,2048);
await loadAuthoredAssets();
const world=makeWorld(scene),sky=makeUrbanSky(scene);
const catLogical=world.cat.position.clone();landscapePoint(world.cat.position);
const player={pos:world.spawn.clone(),yaw:-.28,pitch:-.015,height:1.62,vy:0,grounded:true};
let started=false,thirdPerson=false,dialogue=null,target=null,seated=false,muted=true,elapsed=0,last=performance.now(),frameCount=0,fps=0,fpsTime=0;
let avatar,npcs=[];const keys=new Set();let touchMove={x:0,y:0};let drag=null;let audio;
const SAVE_KEY='nanxiang-three-letters-v1';
let state={accepted:false,delivered:[]};try{const old=JSON.parse(localStorage.getItem(SAVE_KEY));if(old&&typeof old.accepted==='boolean'&&Array.isArray(old.delivered))state={accepted:old.accepted,delivered:old.delivered.filter(id=>['noodle','books','river'].includes(id))}}catch{}
const letters=[{id:'noodle',name:'给小满食堂的阿满',hint:'邮局对面，红色遮阳棚下。',text:'爸：我学会煮你教的那碗面了。就是葱花切得还不够细。下个周末，我回家。'},{id:'books',name:'给旧书店的阿青',hint:'沿街往河边走，左手边的旧书与信。',text:'夹在第七十三页的叶子，是去年夏天捡的。书先借你，夏天也一起借给你。'},{id:'river',name:'给河边的阿遥',hint:'走到街道尽头，在大树和长椅旁。',text:'今天没什么特别的事。只是风吹过的时候，忽然很想和你一起坐一会儿。'}];
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state))}catch{}}
function refreshQuest(){
 $('mail-count').textContent=`${state.delivered.length} / 3`;
 const next=letters.find(l=>!state.delivered.includes(l.id));$('objective').textContent=!state.accepted?'去邮筒旁，和小夏聊聊。':next?`送信给${next.name.replace('给','')}。`:'三封信都送到了。去河边坐一会儿吧。';
 $('letters').replaceChildren(...letters.map(l=>{const li=document.createElement('li'),b=document.createElement('b'),s=document.createElement('span'),small=document.createElement('small');b.textContent=l.name;s.className='letter-state';s.textContent=state.delivered.includes(l.id)?'已送达':state.accepted?'待送达':'未领取';small.textContent=l.hint;li.append(b,s,small);return li}));
}
refreshQuest();
let toastTimer;
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3300)}
function panelsOpen(){return !$('journal').hidden||!$('help').hidden}
function release(){keys.clear();document.exitPointerLock?.()}
function lock(){if(started&&!dialogue&&!panelsOpen()&&!isTouch)canvas.requestPointerLock?.().catch(()=>{toast('按住画面拖动，也可以环顾四周。')})}
const isTouch=matchMedia('(pointer: coarse)').matches;
if(isTouch)document.querySelector('.start-help').textContent='左侧摇杆行走 · 拖动画面环顾 · E 互动';
function start(){if(!avatar)return;started=true;$('start').hidden=true;$('crosshair').hidden=false;$('touch-controls').hidden=!isTouch;lock();toast('先去左侧邮筒旁，和小夏打个招呼。')}
$('start-btn').addEventListener('click',start);
function panel(id,open){$(id).hidden=!open;if(open){release();$('journal').hidden=id!=='journal';$('help').hidden=id!=='help'}else lock()}
$('journal-btn').onclick=()=>panel('journal',$('journal').hidden);$('menu-btn').onclick=()=>panel('help',$('help').hidden);$('resume-btn').onclick=()=>panel('help',false);
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>panel(b.dataset.close,false));
$('reset-btn').onclick=()=>{state={accepted:false,delivered:[]};save();refreshQuest();toast('三封信已经放回邮局。')};
function switchView(){thirdPerson=!thirdPerson;$('view-btn').querySelector('span').textContent=thirdPerson?'第三人称':'第一人称';if(avatar)avatar.root.visible=thirdPerson;toast(thirdPerson?'第三人称 · 鼠标调整方向':'第一人称 · 走近看看')}
$('view-btn').onclick=switchView;
function setupAudio(){
 const ctx=new AudioContext(),master=ctx.createGain();master.gain.value=.11;master.connect(ctx.destination);
 const len=ctx.sampleRate*4,buffer=ctx.createBuffer(1,len,ctx.sampleRate),data=buffer.getChannelData(0);let v=0;for(let i=0;i<len;i++){v=(v+Math.random()*.025-.0125)*.998;data[i]=v}const noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650;noise.connect(filter);filter.connect(master);noise.start();
 const chirp=()=>{if(muted||document.hidden)return;for(let i=0;i<2;i++){const osc=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+i*.14;osc.type='sine';osc.frequency.setValueAtTime(2400,t);osc.frequency.exponentialRampToValueAtTime(3600,t+.05);osc.frequency.exponentialRampToValueAtTime(2200,t+.13);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.08,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.15);osc.connect(g);g.connect(master);osc.start(t);osc.stop(t+.18)}};setInterval(chirp,5300);return {ctx,master};
}
async function sound(){muted=!muted;if(!muted){audio??=setupAudio();await audio.ctx.resume()}else if(audio)await audio.ctx.suspend();$('sound-btn').querySelector('span').textContent=muted?'声音关':'声音开';$('sound-btn').setAttribute('aria-label',muted?'开启环境声':'关闭环境声')}
$('sound-btn').onclick=sound;
function photo(){renderer.render(scene,camera);const a=document.createElement('a');a.download=`南巷-${Date.now()}.png`;a.href=canvas.toDataURL('image/png');a.click();toast('画面已保存。')}$('photo-btn').onclick=photo;

function talk(name,pages,onFinish){release();dialogue={name,pages,index:0,onFinish,npc:target?.npc};$('dialogue').hidden=false;$('speaker').textContent=name;$('dialogue-text').textContent=pages[0];$('next-dialogue').innerHTML=pages.length>1?'继续 <span>↵</span>':'收好这句话 <span>↵</span>';if(target?.npc){const dx=player.pos.x-target.npc.logical.x,dz=player.pos.z-target.npc.logical.z;target.npc.facing=Math.atan2(dx,dz)}}
function nextDialogue(){if(!dialogue)return;if(++dialogue.index<dialogue.pages.length){$('dialogue-text').textContent=dialogue.pages[dialogue.index];$('next-dialogue').innerHTML=dialogue.index===dialogue.pages.length-1?'收好这句话 <span>↵</span>':'继续 <span>↵</span>'}else{const done=dialogue.onFinish;dialogue=null;$('dialogue').hidden=true;done?.();lock()}}
$('next-dialogue').onclick=nextDialogue;
function interact(){
 if(dialogue){nextDialogue();return}if(!started||panelsOpen())return;if(seated){seated=false;player.height=1.62;toast('起身，继续走走。');return}if(!target)return;
 const id=target.id;
 if(id==='post'){if(!state.accepted)talk('小夏 · 邮局',[ '你来得正好。今天有三封信，都是寄给这条街上的人。','一封给食堂的阿满，一封给旧书店的阿青，还有一封给河边的阿遥。','不用赶时间。邮筒旁的风，刚刚好。'],()=>{state.accepted=true;save();refreshQuest();toast('收到三封信。按 J 查看收件人。')});else talk('小夏 · 邮局',[state.delivered.length===3?'都送到了？辛苦你啦。今天的南巷，又多了三个开心的人。':'顺着这条路慢慢走，就能找到他们。按 J 可以再看看信封上的地址。'])}
 else if(letters.some(l=>l.id===id)){const l=letters.find(l=>l.id===id);if(!state.accepted)talk(target.npc.name,['你好呀。今天街上很安静。邮局的小夏好像在等你。']);else if(state.delivered.includes(id))talk(target.npc.name,[id==='noodle'?'下次来，我请你吃碗面。多加一把葱花。':id==='books'?'有空来翻翻书。有些夏天，就藏在书页里。':'别着急回去，再听一会儿风吧。']);else talk(target.npc.name,['这是给我的信？谢谢你走这一趟。',`「${l.text}」`,id==='noodle'?'这孩子……我得把周末的菜先备好。':id==='books'?'原来那片叶子还在。我以为，这个约定早就忘了。':'那就坐一会儿吧。这张长椅，一直留着一个位置。'],()=>{state.delivered.push(id);save();refreshQuest();toast(state.delivered.length===3?'三封信，全都送到了。谢谢你替夏天跑这一趟。':'信已送达。还有一些想说的话，在路上。')})}
 else if(id==='cat'){world.cat.rotation.y=Math.atan2(player.pos.x-catLogical.x,player.pos.z-catLogical.z)+Math.PI;world.cat.userData.petted=elapsed;toast('咪——  橘子蹭了蹭你的手。')}
 else if(id==='bench'){seated=true;player.height=.92;toast('坐下了。再按 E 起身。')}
 else if(id==='walker')talk(target.npc.name,['前面的树荫很凉快。走到路口，记得抬头看看云。']);
}
$('interaction').onclick=interact;$('touch-action').onclick=interact;

window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;
 if(e.code==='Escape'){if(dialogue){dialogue=null;$('dialogue').hidden=true}else if(panelsOpen()){$('journal').hidden=true;$('help').hidden=true}keys.clear();return}
 if(e.code==='KeyE'||e.code==='Enter'&&dialogue){interact();return}if(e.code==='KeyJ'){panel('journal',$('journal').hidden);return}if(e.code==='KeyV'){switchView();return}if(e.code==='KeyM'){sound();return}if(e.code==='KeyP'){photo();return}
 if(started&&!dialogue&&!panelsOpen()){keys.add(e.code);if(e.code==='Space'&&player.grounded&&!seated){player.vy=3.7;player.grounded=false}}
});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();touchMove={x:0,y:0}});document.addEventListener('visibilitychange',()=>{keys.clear();last=performance.now()});document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement)keys.clear()});
function look(dx,dy){player.yaw-=dx*.0025;player.pitch=THREE.MathUtils.clamp(player.pitch-dy*.0022,-1.05,1.03)}
document.addEventListener('mousemove',e=>{if(started&&!dialogue&&!panelsOpen()&&document.pointerLockElement===canvas)look(e.movementX,e.movementY)});
canvas.addEventListener('pointerdown',e=>{if(!started||dialogue||panelsOpen())return;if(!isTouch&&!document.pointerLockElement)lock();drag={id:e.pointerId,x:e.clientX,y:e.clientY};if(isTouch)canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(drag?.id===e.pointerId&&!document.pointerLockElement){look(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY}});window.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
const joy=$('joystick');let joyId;
joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;joy.setPointerCapture(joyId);moveJoy(e)});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)moveJoy(e)});function moveJoy(e){const b=joy.getBoundingClientRect();const dx=e.clientX-b.x-50,dy=e.clientY-b.y-50,l=Math.max(35,Math.hypot(dx,dy));touchMove={x:dx/l,y:-dy/l};joy.firstElementChild.style.transform=`translate(${touchMove.x*30}px,${-touchMove.y*30}px)`}function stopJoy(){joyId=null;touchMove={x:0,y:0};joy.firstElementChild.style.transform=''}joy.addEventListener('pointerup',stopJoy);joy.addEventListener('pointercancel',stopJoy);

function blocked(x,z){return isBlocked(x,z,colliders,npcs)}
const velocity=new THREE.Vector2();
let avatarFacing=player.yaw+Math.PI;
function smoothAngle(current,target,rate,dt){return current+Math.atan2(Math.sin(target-current),Math.cos(target-current))*(1-Math.exp(-rate*dt));}
function movePlayer(dt){
 const canMove=started&&!dialogue&&!panelsOpen()&&!seated;
 let desiredX=0,desiredZ=0;
 if(canMove){
  let f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+touchMove.y;
  let s=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+touchMove.x;
  const len=Math.max(1,Math.hypot(f,s)),v=keys.has('ShiftLeft')?3:1.28;f/=len;s/=len;
  desiredX=(-Math.sin(player.yaw)*f+Math.cos(player.yaw)*s)*v;
  desiredZ=(-Math.cos(player.yaw)*f-Math.sin(player.yaw)*s)*v;
  velocity.x=THREE.MathUtils.damp(velocity.x,desiredX,10,dt);velocity.y=THREE.MathUtils.damp(velocity.y,desiredZ,10,dt);
 }else velocity.set(0,0);
 const ox=player.pos.x,oz=player.pos.z;
 if(!blocked(ox+velocity.x*dt,oz))player.pos.x+=velocity.x*dt;else velocity.x=0;
 if(!blocked(player.pos.x,oz+velocity.y*dt))player.pos.z+=velocity.y*dt;else velocity.y=0;
 const dx=player.pos.x-ox,dz=player.pos.z-oz,speed=Math.hypot(dx,dz)/Math.max(dt,.001);
 if(speed>.08)avatarFacing=Math.atan2(dx,dz);
 if(!player.grounded){player.vy-=10.5*dt;player.pos.y+=player.vy*dt;if(player.pos.y<=0){player.pos.y=0;player.vy=0;player.grounded=true}}
 return speed;
}
const aim=new THREE.Vector3(),desiredCam=new THREE.Vector3(),forward=new THREE.Vector3(),raycaster=new THREE.Raycaster();
function updateCamera(speed){const base=player.pos.clone().add(new THREE.Vector3(0,player.height+groundHeight(player.pos.x,player.pos.z),0));if(thirdPerson){const dist=2.8;desiredCam.set(player.pos.x+Math.sin(player.yaw)*dist,player.pos.y+1.83-Math.sin(player.pitch)*1.5,player.pos.z+Math.cos(player.yaw)*dist);aim.set(player.pos.x,player.pos.y+1.15,player.pos.z);const diff=desiredCam.clone().sub(aim);let frac=1;for(let i=1;i<=14;i++){const t=i/14;if(blocked(aim.x+diff.x*t,aim.z+diff.z*t)){frac=Math.max(.12,(i-1)/14);break}}camera.position.copy(aim).addScaledVector(diff,frac);landscapePoint(camera.position);const look=landscapePoint(new THREE.Vector3(aim.x-Math.sin(player.yaw)*2,aim.y+player.pitch*2,aim.z-Math.cos(player.yaw)*2));camera.lookAt(look)}else{camera.position.copy(landscapePoint(base));camera.rotation.set(player.pitch,player.yaw+curveYaw(player.pos.z),0)}if(avatar){avatar.root.position.copy(player.pos);avatar.root.position.y+=groundHeight(player.pos.x,player.pos.z);landscapePoint(avatar.root.position);avatar.root.rotation.y=smoothAngle(avatar.root.rotation.y,avatarFacing+curveYaw(player.pos.z),10,delta);avatar.root.visible=thirdPerson;avatar.update(Math.min(.05,delta),speed,{grounded:player.grounded,elevation:player.pos.y})}}
const interactables=[];
function updateTarget(){target=null;if(!started||dialogue||panelsOpen()){$('interaction').hidden=true;return}if(seated){$('interaction').hidden=false;$('interaction').querySelector('span').textContent='起身';return}camera.getWorldDirection(forward);let best=Infinity;for(const o of interactables){const p=o.npc?o.npc.logical:o.pos;const d=Math.hypot(player.pos.x-p.x,player.pos.z-p.z);if(d>2.55)continue;const toward=landscapePoint(new THREE.Vector3(p.x,1.03,p.z)).sub(camera.position).normalize();if(toward.dot(forward)<.65)continue;
 // Interaction cannot reach through a building, even when a target is close.
 const dx=p.x-player.pos.x,dz=p.z-player.pos.z;let occluded=false;for(let i=1;i<8;i++){const x=player.pos.x+dx*i/8,z=player.pos.z+dz*i/8;if(colliders.some(c=>x>c.minX&&x<c.maxX&&z>c.minZ&&z<c.maxZ)){occluded=true;break}}if(occluded&&o.id!=='bench')continue;
 if(d<best){best=d;target=o}}$('interaction').hidden=!target;if(target)$('interaction').querySelector('span').textContent=target.label;
}
let delta=.016;
function animate(now){requestAnimationFrame(animate);delta=Math.min((now-last)/1000,.05);last=now;elapsed+=delta;const speed=movePlayer(delta);updateCamera(speed);
 for(const n of npcs){
  let walkSpeed=0;
  if(n.route&&dialogue?.npc!==n){
   const route=n.route,destination=route.points[route.index];
   const dx=destination.x-n.logical.x,dz=destination.z-n.logical.z,distance=Math.hypot(dx,dz);
   if(route.pause>0)route.pause-=delta;
   else if(distance<.06){route.pause=1.8;route.index=(route.index+1)%route.points.length;}
   else{const step=Math.min(distance,delta*1.02);n.logical.x+=dx/distance*step;n.logical.z+=dz/distance*step;walkSpeed=step/Math.max(delta,.001);n.facing=Math.atan2(dx,dz);}
  }
  n.logical.y=groundHeight(n.logical.x,n.logical.z);n.root.position.copy(n.logical);landscapePoint(n.root.position);
  const nearby=Math.hypot(player.pos.x-n.logical.x,player.pos.z-n.logical.z)<3.15;
  const attentive=started&&nearby&&walkSpeed<.08;
  const facing=attentive?Math.atan2(player.pos.x-n.logical.x,player.pos.z-n.logical.z):n.facing;
  n.root.rotation.y=smoothAngle(n.root.rotation.y,facing+curveYaw(n.logical.z),attentive?3:7,delta);
  n.update(delta,walkSpeed,{speaking:dialogue?.npc===n,attentive});
 }

 world.update?.(elapsed);sky.userData.update?.(elapsed);
 const pet=elapsed-(world.cat.userData.petted??-100);world.cat.position.y=.15+curveY(catLogical.z)+(pet<2?Math.sin(pet*8)*.018:0);
 $('place-name').textContent=player.pos.x>6&&player.pos.z>3.3&&player.pos.z<5.7?'青木侧巷':player.pos.x>5.5&&player.pos.z>=5.7&&player.pos.z<14?'小满食堂前庭':player.pos.z<-27?'沿河小广场':player.pos.z<-10?'旧书店街口':player.pos.z<3?'青木街':'南巷邮局';updateTarget();renderer.render(scene,camera);frameCount++;fpsTime+=delta;if(fpsTime>=1){fps=frameCount/fpsTime;frameCount=0;fpsTime=0}}
requestAnimationFrame(animate);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('loading').hidden=false;$('loading-text').textContent='画面暂时中断，请刷新页面继续。'});
try{
 await loadCharacters();
 $('loading-text').textContent='正在准备人物 · 1 / 6';
 avatar=await createCharacter(scene);avatar.root.visible=false;
 const add=async(id,label,options)=>{$('loading-text').textContent=`正在准备人物 · ${npcs.length+2} / 6`;const n=await createCharacter(scene,options);n.logical=n.root.position.clone();n.facing=options.yaw||0;npcs.push(n);interactables.push({id,label,npc:n});return n};
 await add('post','和小夏聊聊',{name:'小夏 · 邮局',variant:'post',x:-2.85,z:8.05,yaw:1.1});
 await add('noodle','把信交给阿满',{name:'阿满 · 食堂',variant:'vendor',...dinerActor,scale:1});
 await add('books','和阿青聊聊',{name:'阿青 · 旧书店',variant:'reader',x:-4.48,z:-12.2,yaw:1.2,scale:1});
 await add('river','和阿遥聊聊',{name:'阿遥 · 河边',variant:'river',x:2.0,z:-34.8,yaw:2.2});
 const n=await add('walker','打个招呼',{name:'散步的邻居',variant:'walker',x:1.7,z:-7,yaw:Math.PI,scale:1});n.route={points:[{x:1.7,z:-7},{x:.7,z:-20}],index:1,pause:0};
 interactables.push({id:'cat',label:'摸摸橘子',pos:catLogical},{id:'bench',label:'坐下歇一会儿',pos:new THREE.Vector3(-4.25,0,-18.3)},{id:'bench',label:'坐下看看河',pos:new THREE.Vector3(6,0,-35.4)});
 $('loading').hidden=true;$('start-btn').disabled=false;$('start-btn').innerHTML='走进南巷 <span>→</span>';
}catch(error){console.error(error);$('loading-text').textContent='人物载入失败，请刷新页面重试。'}
// Read-only diagnostics for repeatable local QA. No hidden movement/quest shortcuts.
window.__nanxiang={get state(){return JSON.parse(JSON.stringify(state))},get player(){return {x:player.pos.x,y:player.pos.y,z:player.pos.z,yaw:player.yaw,pitch:player.pitch,grounded:player.grounded,seated}},get status(){return {ready:!!avatar,started,thirdPerson,target:target?.id,dialogue:dialogue?.name,fps,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,characters:npcs.length,animations:avatar?Object.keys(avatar.actions):[],colliders:colliders.length}},get characterDetails(){return [avatar,...npcs].filter(Boolean).map(n=>({name:n.name,...n.diagnostics}))},get gpu(){return {...renderer.info.memory}},get actors(){return npcs.map(n=>({name:n.name,x:n.logical.x,z:n.logical.z,yaw:n.facing}))}};
