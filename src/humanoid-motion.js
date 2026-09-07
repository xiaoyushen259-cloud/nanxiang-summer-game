import * as THREE from 'three';

let library;const references={};
const rigMap={pelvis:'hips',spine_01:'spine',spine_02:'chest',spine_03:'upperChest',neck_01:'neck',head:'head'};
for(const [side,letter] of [['left','l'],['right','r']]){
  for(const [source,target] of Object.entries({clavicle:'Shoulder',upperarm:'UpperArm',lowerarm:'LowerArm',hand:'Hand',thigh:'UpperLeg',calf:'LowerLeg',foot:'Foot',ball:'Toes'}))rigMap[`${source}_${letter}`]=side+target;
  for(const [finger,target] of [['thumb','Thumb'],['index','Index'],['middle','Middle'],['ring','Ring'],['pinky','Little']]){
    const segments=finger==='thumb'?['Metacarpal','Proximal','Distal']:['Proximal','Intermediate','Distal'];
    segments.forEach((segment,i)=>rigMap[`${finger}_0${i+1}_${letter}`]=side+target+segment);
  }
}
Object.assign(rigMap,{'mixamorig:Hips':'hips','mixamorig:Spine':'spine','mixamorig:Spine1':'chest','mixamorig:Spine2':'upperChest','mixamorig:Neck':'neck','mixamorig:Head':'head'});
for(const side of ['Left','Right']){
  for(const [source,target] of Object.entries({Shoulder:'Shoulder',Arm:'UpperArm',ForeArm:'LowerArm',Hand:'Hand',UpLeg:'UpperLeg',Leg:'LowerLeg',Foot:'Foot',ToeBase:'Toes'}))rigMap[`mixamorig:${side}${source}`]=side.toLowerCase()+target;
  for(const finger of ['Thumb','Index','Middle','Ring','Pinky'])for(let i=1;i<=3;i++)rigMap[`mixamorig:${side}Hand${finger}${i}`]=side.toLowerCase()+(finger==='Pinky'?'Little':finger)+(finger==='Thumb'?['Metacarpal','Proximal','Distal']:['Proximal','Intermediate','Distal'])[i-1];
}

export async function loadMotionLibrary(){
  const response=await fetch(`${import.meta.env.BASE_URL}animations/human-motion.json`);
  if(!response.ok)throw new Error('人物动作加载失败');
  library=await response.json();
  for(const [key,rest] of Object.entries({default:library.rest,...library.references})){
    const nodes=rest.map(n=>{const o=new THREE.Object3D();o.name=n.name;o.position.fromArray(n.translation??[0,0,0]);o.quaternion.fromArray(n.rotation??[0,0,0,1]);o.scale.fromArray(n.scale??[1,1,1]);return o;});
    rest.forEach((n,i)=>n.children?.forEach(child=>nodes[i].add(nodes[child])));
    const reference=new THREE.Group();nodes.filter(n=>!n.parent).forEach(n=>reference.add(n));reference.updateMatrixWorld(true);references[key]=reference;
  }
}

function retarget(vrm,sourceName,label){
  const reference=references[library.clipReferences?.[sourceName]??'default'];
  const tracks=[],sourceHips=reference.getObjectByName(sourceName.startsWith('Everyday_')?'mixamorig:Hips':'pelvis');
  const sourceHeight=sourceHips.getWorldPosition(new THREE.Vector3()).y;
  const targetHips=vrm.humanoid.getNormalizedBoneNode('hips'),ratio=targetHips.position.y/sourceHeight;
  const vrm0=vrm.meta.metaVersion==='0';
  for(const track of library.clips[sourceName]){
    if(!rigMap[track.node])continue;
    const bone=vrm.humanoid.getNormalizedBoneNode(rigMap[track.node]);
    const source=reference.getObjectByName(track.node);
    if(!bone||!source)continue;
    const values=[];
    if(track.path==='rotation'){
      const parentRest=source.parent.getWorldQuaternion(new THREE.Quaternion());
      const inverseRest=source.getWorldQuaternion(new THREE.Quaternion()).invert();
      const q=new THREE.Quaternion(),euler=new THREE.Euler(0,0,0,'YXZ');
      for(let i=0;i<track.values.length;i+=4){
        q.fromArray(track.values,i).premultiply(parentRest).multiply(inverseRest).normalize();
        if(sourceName==='Everyday_Walk'){
          // The narrow VRoid hip spacing exaggerates the source rig's adduction.
          // Keep sagittal stride/knee motion but remove the crossover-catwalk pose.
          if(['leftUpperLeg','rightUpperLeg'].includes(rigMap[track.node])){euler.setFromQuaternion(q,'YXZ');euler.z*=.2;euler.y*=.65;q.setFromEuler(euler);}
          if(rigMap[track.node]==='hips'){euler.setFromQuaternion(q,'YXZ');euler.z*=.55;q.setFromEuler(euler);}
        }
        if(vrm0){q.x=-q.x;q.z=-q.z;}
        values.push(q.x,q.y,q.z,q.w);
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(`${bone.uuid}.quaternion`,track.times,values));
    }else if(rigMap[track.node]==='hips'){
      const rest=source.getWorldPosition(new THREE.Vector3()),p=new THREE.Vector3();
      for(let i=0;i<track.values.length;i+=3){
        p.fromArray(track.values,i).applyMatrix4(source.parent.matrixWorld).sub(rest).multiplyScalar(ratio);
        if(vrm0){p.x=-p.x;p.z=-p.z;}
        values.push(targetHips.position.x+p.x,targetHips.position.y+p.y,targetHips.position.z+p.z);
      }
      tracks.push(new THREE.VectorKeyframeTrack(`${bone.uuid}.position`,track.times,values));
    }
  }
  return new THREE.AnimationClip(label,-1,tracks);
}

export function createCharacterMotion(vrm,{idleProfile=0,walk='Everyday_Walk',run='Everyday_Run'}={}){
  const mixer=new THREE.AnimationMixer(vrm.scene),actions={};
  // The hand-on-hip Listening clip intersects these avatars' clothing.
  // Use hands-free standing clips for both rest variation and conversation.
  for(const [label,source] of Object.entries({Idle:'Idle_Subtle',RestShift:'Everyday_Idle',Talk:'Idle_Subtle',Greet:'Greeting',Walk:walk,Run:run,Jump:'Jump_air'})){
    const clip=retarget(vrm,source,label);
    if(label==='Greet'){
      // The greeting also puts its non-waving left hand on the hip. Replace the
      // whole left arm chain, including fingers, with the authored relaxed arm.
      const relaxed=retarget(vrm,'Idle_Subtle','RelaxedArm');
      const names=new Set(Object.values(rigMap).filter(n=>/^left(Shoulder|UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/.test(n)).map(n=>vrm.humanoid.getNormalizedBoneNode(n)).filter(Boolean).map(b=>`${b.uuid}.quaternion`));
      clip.tracks=clip.tracks.filter(t=>!names.has(t.name));
      for(const sourceTrack of relaxed.tracks){
        if(!names.has(sourceTrack.name))continue;
        const track=sourceTrack.clone();track.scale(clip.duration/relaxed.duration);clip.tracks.push(track);
      }
    }
    actions[label]=mixer.clipAction(clip);
  }
  actions.Greet.setLoop(THREE.LoopOnce,1);actions.Greet.clampWhenFinished=true;
  const bones=Object.fromEntries(Object.values(rigMap).map(n=>[n,vrm.humanoid.getNormalizedBoneNode(n)]).filter(([,n])=>n));
  // Nodding is an additive head/neck response; the supporting stance stays planted.
  const nod=retarget(vrm,'Head Nod','Nod');
  const headNames=new Set(['head','neck'].map(n=>`${bones[n].uuid}.quaternion`));nod.tracks=nod.tracks.filter(t=>headNames.has(t.name));
  THREE.AnimationUtils.makeClipAdditive(nod,0,nod);
  actions.Nod=mixer.clipAction(nod);actions.Nod.setLoop(THREE.LoopOnce,1);actions.Nod.clampWhenFinished=true;
  actions.Idle.play();actions.Idle.time=Math.random()*actions.Idle.getClip().duration;
  let active='Idle',playing='Idle',time=0,idleTime=idleProfile*1.7,greeted=false,awayTime=0,lastGreet=-30,nodWait=1.4+idleProfile*.2;
  const switchTo=next=>{
    if(next===playing)return;
    const previous=actions[playing],following=actions[next];
    following.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
    following.crossFadeFrom(previous,next==='Walk'||next==='Run'||next==='Jump'?.28:.6,false);playing=next;
  };
  return {mixer,actions,bones,get active(){return active},get time(){return time},get pose(){return playing},get phase(){return actions[playing].time},
    update(dt,speed,{speaking=false,grounded=true,attentive=false}={}){
      time+=dt;
      active=!grounded?'Jump':speed>.08?(speed>2.2?'Run':'Walk'):speaking?'Talk':'Idle';
      awayTime=attentive?0:awayTime+dt;if(awayTime>4)greeted=false;
      let next=active;
      if(active==='Idle'){
        idleTime+=dt;
        const cycle=15+idleProfile*.7;
        next=idleTime%cycle>9+idleProfile*.25?'RestShift':'Idle';
        if(playing==='Greet'&&actions.Greet.time<actions.Greet.getClip().duration-.6)next='Greet';
        else if(idleProfile!==0&&attentive&&!greeted&&time-lastGreet>18){next='Greet';greeted=true;lastGreet=time;}
      }else idleTime=idleProfile*1.7;
      switchTo(next);
      if(speaking&&grounded&&speed<=.08){
        nodWait-=dt;if(nodWait<=0){actions.Nod.reset().setEffectiveWeight(.55).play();nodWait=4.5+idleProfile*.25;}
      }else{actions.Nod.stop();nodWait=1.4+idleProfile*.2;}
      actions.Walk.timeScale=THREE.MathUtils.clamp(speed/(walk==='Everyday_Walk'?1.3:.74),.05,2.5);
      actions.Run.timeScale=THREE.MathUtils.clamp(speed/3,.8,1.3);
      mixer.update(dt);
    }
  };
}
