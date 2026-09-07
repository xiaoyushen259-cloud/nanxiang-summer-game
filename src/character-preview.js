import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {VRMLoaderPlugin,VRMUtils} from '@pixiv/three-vrm';
const candidates=[
 {id:'AvatarSample_A',title:'01 · 棕发日常款',tag:'优先推荐',text:'AvatarSample_A · 约 2.49 万三角面',license:'VRoid 官方条款',link:'https://vroid.pixiv.help/hc/en-us/articles/4402394424089'},
 {id:'Sendagaya_Shibu',title:'02 · 蓝发校服款',tag:'校服方向',text:'Sendagaya Shibu · 约 3.44 万三角面',license:'CC0',link:'https://vroid.pixiv.help/hc/en-us/articles/360012381793'},
 {id:'AvatarSample_B',title:'03 · 挑染街头款',tag:'个性角色备选',text:'AvatarSample_B · 约 2.83 万三角面',license:'VRoid 官方条款',link:'https://vroid.pixiv.help/hc/en-us/articles/4402394424089'},
];
window.previewReady=0;
const previews=[];
for(const item of candidates){
 const card=document.createElement('article');card.className='card';
 card.innerHTML=`<div class="view"><span class="status">正在载入模型…</span></div><div class="info"><div class="tag">${item.tag}</div><h2>${item.title}</h2><p>${item.text}<br>54 个人体骨骼节点 · 15 组表情<br><a href="${item.link}" target="_blank" rel="noopener">${item.license} / 官方说明</a></p></div>`;
 document.querySelector('#grid').append(card);
 const view=card.querySelector('.view'),status=card.querySelector('.status');
 const scene=new THREE.Scene();scene.background=new THREE.Color('#e2e9df');
 const camera=new THREE.PerspectiveCamera(28,1,.01,30);camera.position.set(0,1.05,4);
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));view.append(renderer.domElement);
 scene.add(new THREE.HemisphereLight('#fffdf5','#b3c8ab',2.0));
 const sun=new THREE.DirectionalLight('#fff5e3',1.3);sun.position.set(-2,4,4);scene.add(sun);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(2,80),new THREE.MeshBasicMaterial({color:'#cbd7c4'}));floor.rotation.x=-Math.PI/2;floor.position.y=-.005;scene.add(floor);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.85,0);controls.enablePan=false;controls.minDistance=1;controls.maxDistance=5;controls.maxPolarAngle=Math.PI*.55;controls.update();
 new ResizeObserver(()=>{const {width,height}=view.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix()}).observe(view);
 const loader=new GLTFLoader().register(parser=>new VRMLoaderPlugin(parser));
 const state={scene,camera,renderer,controls,vrm:null};previews.push(state);
 loader.load(`/art-source/candidates/${item.id}.vrm`,gltf=>{
  const vrm=gltf.userData.vrm;VRMUtils.rotateVRM0(vrm);
  vrm.humanoid.setNormalizedPose({leftUpperArm:{rotation:new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,1.12)).toArray()},rightUpperArm:{rotation:new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,-1.12)).toArray()}});
  vrm.update(0);scene.add(vrm.scene);state.vrm=vrm;
  status.textContent='模型已载入';window.previewReady++;
 },undefined,error=>{status.textContent='加载失败';console.error(error)});
}
const clock=new THREE.Clock();
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);for(const s of previews){s.vrm?.update(dt);s.controls.update();s.renderer.render(s.scene,s.camera)}}frame();
