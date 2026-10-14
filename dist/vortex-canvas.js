import * as THREE from './vendor/three.module.js';

// Independent implementation of the cylindrical photo-flow interaction studied in
// https://github.com/J0SUKE/vortex-gallery (downloaded reference retained separately).
// Only the portfolio owner's photographs are used; no reference assets or shaders.
export function createVortexGallery(host, initialPhotos, onSelect) {
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-label','三维旋转摄影展，滚动或拖动浏览，点击暂停');
  host.append(renderer.domElement);
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(50,1,.1,180);
  camera.position.z=5;
  const cylinder=new THREE.Group();scene.add(cylinder);
  const feature=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xffffff}));
  scene.add(feature);
  const mat=new THREE.Object3D(),cache=new Map(),loader=new THREE.TextureLoader();
  let photos=[],batches=[],travel=0,target=0,direction=1,focus=-1,width=0,height=0,zoom=1,alive=true,wasPaused=false;
  const layerCount=40,ringCount=15,pitch=3,range=layerCount*pitch;
  function textureFor(src){if(!cache.has(src)){const texture=loader.load(src,()=>{if(alive)renderer.render(scene,camera)});texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());cache.set(src,texture)}return cache.get(src)}
  function clearBatches(){batches.forEach(b=>{cylinder.remove(b.mesh);b.mesh.geometry.dispose();b.mesh.material.dispose();b.mesh.dispose()});batches=[]}
  function setPhotos(next){photos=next;clearBatches();travel=0;target=0;focus=-1;
    const slots=Array.from({length:photos.length},()=>[]);
    // Offset the rings so the wall reads as a continuous helix instead of stacked rows.
    for(let i=0;i<ringCount*layerCount;i++){const layer=i%layerCount,ring=Math.floor(i/layerCount),image=(ring*11+layer*5+Math.floor(layer/3))%photos.length;slots[image].push({angle:(ring+layer/layerCount)/ringCount*Math.PI*2,y:layer*pitch-range/2,speed:.84+((layer*13)%17)/100});}
    photos.forEach((photo,i)=>{const ratio=photo.width/photo.height;const geometry=new THREE.PlaneGeometry(1.5,1.5/ratio);const material=new THREE.MeshBasicMaterial({map:textureFor(photo.src),side:THREE.DoubleSide});const mesh=new THREE.InstancedMesh(geometry,material,slots[i].length);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;cylinder.add(mesh);batches.push({mesh,slots:slots[i]});});
    updateFocus(0);updateMatrices();renderer.render(scene,camera);
  }
  function updateFocus(index){if(index===focus)return;focus=index;const photo=photos[focus],ratio=photo.width/photo.height;feature.material.map=textureFor(photo.src);feature.material.needsUpdate=true;const maxW=camera.aspect<.8?1.8:2.3,maxH=2.6;feature.scale.set(Math.min(maxW,maxH*ratio),Math.min(maxH,maxW/ratio),1);onSelect(focus)}
  function updateMatrices(){for(const batch of batches){batch.slots.forEach((slot,i)=>{const theta=slot.angle+travel*.4*slot.speed,y=((slot.y+travel+range/2)%range+range)%range-range/2;mat.position.set(Math.cos(theta)*6,y,Math.sin(theta)*6);mat.rotation.set(0,-Math.PI/2-theta,0);mat.updateMatrix();batch.mesh.setMatrixAt(i,mat.matrix)});batch.mesh.instanceMatrix.needsUpdate=true}}
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h||w===width&&h===height)return;width=w;height=h;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(focus>=0){const current=focus;focus=-1;updateFocus(current)}}
  function move(amount){if(!Number.isFinite(amount)||!amount)return;direction=Math.sign(amount);target+=amount;}
  function step(dir){direction=Math.sign(dir)||1;const index=(focus+direction+photos.length)%photos.length;target=Math.ceil(target)+direction;travel=target;updateFocus(index);updateMatrices();renderer.render(scene,camera);}
  // Hold a manual selection for a moment, then resume the continuous exhibition.
  let selectedHold=0;const selectStep=dir=>{step(dir);selectedHold=1.8};
  function render(dt,paused,dragging){if(!alive||!width||!photos.length)return;if(paused&&!wasPaused)target=travel;wasPaused=paused;
    if(!paused&&!dragging)target+=dt*.9*direction;
    travel=THREE.MathUtils.lerp(travel,target,1-Math.exp(-dt*6));
    if(!paused)selectedHold=Math.max(0,selectedHold-dt);
    if(!selectedHold)updateFocus(((Math.floor(travel)%photos.length)+photos.length)%photos.length);
    updateMatrices();renderer.render(scene,camera);
  }
  function setZoom(value){zoom=value;camera.zoom=zoom;camera.updateProjectionMatrix()}
  function dispose(){alive=false;clearBatches();cache.forEach(t=>t.dispose());feature.geometry.dispose();feature.material.dispose();renderer.dispose();renderer.domElement.remove()}
  resize();setPhotos(initialPhotos);
  return {setPhotos,resize,move,step:selectStep,render,setZoom,dispose};
}
