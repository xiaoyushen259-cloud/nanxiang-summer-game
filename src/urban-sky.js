import * as THREE from 'three';
export function makeUrbanSky(scene){
  scene.background=new THREE.Color('#bbcbd5');scene.fog=new THREE.Fog('#bbcbd5',52,135);
  const material=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{time:{value:0}},vertexShader:`varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
    varying vec3 direction;uniform float time;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    void main(){vec3 d=normalize(direction);float h=max(d.y,0.);vec3 c=mix(vec3(.73,.79,.82),vec3(.22,.43,.65),pow(h,.55));vec2 p=d.xz/(h+.20)*2.5+vec2(time*.002,0.);float n=noise(p)*.5+noise(p*2.1)*.27+noise(p*4.2)*.13+noise(p*8.)*.07;float clouds=smoothstep(.49,.68,n)*smoothstep(.03,.23,h);c=mix(c,vec3(.89,.89,.85),clouds*.82);gl_FragColor=vec4(c,1.);}
  `});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(120,32,16),material);sky.renderOrder=-10;sky.frustumCulled=false;sky.userData.update=t=>material.uniforms.time.value=t;scene.add(sky);return sky;
}
