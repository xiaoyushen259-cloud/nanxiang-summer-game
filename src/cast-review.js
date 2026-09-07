import * as THREE from 'three';
import {loadCharacters,createCharacter} from './vrm-characters.js';
const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#cast'),antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
const scene=new THREE.Scene();scene.background=new THREE.Color('#e1e6e3');
const camera=new THREE.OrthographicCamera(-4.3,4.3,1.3,-1.3,.1,40);camera.position.set(0,.95,10);camera.lookAt(0,.95,0);
scene.add(new THREE.HemisphereLight('#fff5ed','#9faec2',1.65));
const sun=new THREE.DirectionalLight('#fff0df',1.8);sun.position.set(-3,7,4);scene.add(sun);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshBasicMaterial({color:'#d0d7d1'}));floor.rotation.x=-Math.PI/2;floor.position.y=-.005;scene.add(floor);
const roles=[['courier','旅人 · 主角'],['post','小夏 · 邮局'],['vendor','阿满 · 食堂'],['reader','阿青 · 旧书店'],['river','阿遥 · 河边'],['walker','散步的邻居']];
const actors=[];
function resize(){renderer.setSize(innerWidth,innerWidth*2.6/8.6);}resize();addEventListener('resize',resize);
await loadCharacters();
for(const [i,[variant,name]] of roles.entries()){
 const actor=await createCharacter(scene,{variant,name,x:-3.5+i*1.4});actors.push(actor);
 const label=document.createElement('div');label.innerHTML=`<b>${name}</b><small>${actor.asset}</small>`;document.querySelector('#labels').append(label);
}
document.querySelector('#status').textContent='角色外观各不相同 · 使用游戏内材质与待机动作';
window.castReady=true;window.castDiagnostics=()=>actors.map(a=>a.diagnostics);
const reviewPose=new URLSearchParams(location.search).get('pose');const speaking=reviewPose==='talk',attentive=reviewPose==='greet';
const clock=new THREE.Clock();
renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);actors.forEach(a=>a.update(dt,0,{speaking,attentive}));renderer.render(scene,camera)});
