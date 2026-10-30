import * as THREE from './vendor/three.module.js';

export function createMachine(container, onSelect) {
 const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
 const renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 container.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,80),machine=new THREE.Group();scene.add(machine);
 const cabinet=new THREE.Group();machine.add(cabinet);
 let theme='cyber';
 const mat=(color,metalness=.25,roughness=.3)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
 // One set of materials and one silhouette; the palettes blend in place.
 const cream=mat(0xf5dfbc,.05,.4),babyBlue=mat(0x5498c8,.12,.32),blueEdge=mat(0x397eae,.14,.36);
 const rose=mat(0xf09bb6,.08,.35),roseDark=mat(0xd56b92,.08,.4),butter=mat(0xf2cb62,.06,.4);
 const recess=mat(0x654a58,0,.8),outletInside=mat(0x9f776e,.05,.66),rimLight=mat(0xf0b8c5,.06,.36);
 const themeBindings=[],themeGroups=[];
 const morphPlates=[];
 const silver=mat(0xe8edf2,.93,.24),brushedSilver=mat(0xc1cedc,.87,.31),panelSeam=mat(0x526170,.42,.43);

 function colorBinding(object,key,day,night) {
  themeBindings.push({object,key,day:new THREE.Color(day),night:new THREE.Color(night),color:true});
 }
 function numberBinding(object,key,day,night) {themeBindings.push({object,key,day,night,color:false});}
 function materialTheme(material,day,night) {
  for(const key of Object.keys(day)) {
   if(key==='color'||key==='emissive')colorBinding(material,key,day[key],night[key]);
   else numberBinding(material,key,day[key],night[key]);
  }
 }
 // Scenery fades on its own materials so the shared cabinet never changes opacity.
 function sceneryTheme(group,daytime) {
  const materials=new Map(),objects=[];
  group.traverse(object=>{
   if(!object.material)return;
   const convert=source=>{
    if(!materials.has(source)){const copy=source.clone();copy.transparent=true;materials.set(source,copy);}
    return materials.get(source);
   };
   object.material=Array.isArray(object.material)?object.material.map(convert):convert(object.material);
   objects.push({object,castShadow:object.castShadow});
  });
  themeGroups.push({group,daytime,materials,objects});
 }
 // Saturated coated metal panels, with brighter bare-metal mechanisms and edges.
 materialTheme(babyBlue,{color:0x5498c8,metalness:.50,roughness:.31,emissive:0x000000,emissiveIntensity:0},{color:0x26245f,metalness:.58,roughness:.25,emissive:0x121f69,emissiveIntensity:.08});
 materialTheme(blueEdge,{color:0x397eae,metalness:.70,roughness:.29,emissive:0x000000,emissiveIntensity:0},{color:0x161d45,metalness:.76,roughness:.24,emissive:0x092b55,emissiveIntensity:.045});
 materialTheme(cream,{color:0xf5dfbc,metalness:.52,roughness:.33,emissive:0x000000,emissiveIntensity:0},{color:0x29234f,metalness:.60,roughness:.25,emissive:0x2b0d5b,emissiveIntensity:.035});
 materialTheme(rose,{color:0xf09bb6,metalness:.54,roughness:.30,emissive:0x000000,emissiveIntensity:0},{color:0x6432ad,metalness:.62,roughness:.24,emissive:0x6e1399,emissiveIntensity:.07});
 materialTheme(roseDark,{color:0xd56b92,metalness:.48,roughness:.33,emissive:0x000000,emissiveIntensity:0},{color:0xff75c9,metalness:.44,roughness:.27,emissive:0xe83fa5,emissiveIntensity:.65});
 materialTheme(butter,{color:0xf2cb62,metalness:.35,roughness:.29,emissive:0xffcd66,emissiveIntensity:.1},{color:0x9effed,metalness:.30,roughness:.23,emissive:0x5fffe4,emissiveIntensity:1.8});
 materialTheme(silver,{color:0xe8edf2,metalness:.93,roughness:.24},{color:0x83b7d4,metalness:.93,roughness:.21});
 materialTheme(brushedSilver,{color:0xc1cedc,metalness:.87,roughness:.31},{color:0x6385aa,metalness:.89,roughness:.26});
 materialTheme(panelSeam,{color:0x526170,roughness:.43},{color:0x29455a,roughness:.39});
 materialTheme(recess,{color:0x654a58},{color:0x142039});
 materialTheme(outletInside,{color:0x9f776e,metalness:.5,roughness:.35},{color:0x243452,metalness:.6,roughness:.31});
 materialTheme(rimLight,{color:0xf0b8c5,emissive:0xf0b8c5,emissiveIntensity:0},{color:0x03ffe9,emissive:0x00e7f5,emissiveIntensity:2.4});
 const heartMaterial=roseDark.clone();heartMaterial.transparent=true;heartMaterial.depthWrite=false;
 materialTheme(heartMaterial,{color:0xd56b92,metalness:.48,roughness:.33,emissive:0x000000,emissiveIntensity:0},{color:0xff75c9,metalness:.44,roughness:.27,emissive:0xe83fa5,emissiveIntensity:.65});
 numberBinding(heartMaterial,'opacity',1,0);
 function mesh(geo,material,parent,x=0,y=0,z=0){const o=new THREE.Mesh(geo,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function box(w,h,d,r,material,parent,x=0,y=0,z=0){r=Math.min(r,w/2,h/2);const s=new THREE.Shape(),a=-w/2,b=-h/2;s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+h-r);s.quadraticCurveTo(a+w,b+h,a+w-r,b+h);s.lineTo(a+r,b+h);s.quadraticCurveTo(a,b+h,a,b+h-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);const bevel=Math.min(r,d*.3);const g=new THREE.ExtrudeGeometry(s,{depth:Math.max(.001,d-2*bevel),bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:8});g.translate(0,0,-Math.max(.001,d-2*bevel)/2);return mesh(g,material,parent,x,y,z);}
 function cyl(rt,rb,h,material,parent,x=0,y=0,z=0){return mesh(new THREE.CylinderGeometry(rt,rb,h,48),material,parent,x,y,z);}
 function ring(radius,tube,material,parent,x=0,y=0,z=0){const o=mesh(new THREE.TorusGeometry(radius,tube,8,64),material,parent,x,y,z);o.rotation.x=Math.PI/2;return o;}
 function textTexture(text,color='#b3fff7',size=120,w=1024,h=256,glow=false){const cv=document.createElement('canvas');cv.width=w;cv.height=h;const ctx=cv.getContext('2d');ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`600 ${size}px "Arial", "PingFang SC", sans-serif`;ctx.fillStyle=color;if(glow){ctx.shadowColor=color;ctx.shadowBlur=9;}ctx.fillText(text,w/2,h/2);const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;return tx;}
 function label(text,w,h,parent,x,y,z,color='#b3fff7',size=45){const tx=textTexture(text,'#ffffff',size*1024/w/250,1024,Math.round(1024*h/w),false);return mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tx,color,transparent:true,depthWrite:false,side:THREE.DoubleSide}),parent,x,y,z);}
 function heart(size,material,parent,x,y,z){const s=new THREE.Shape();s.moveTo(0,-.46);s.bezierCurveTo(-.13,-.28,-.55,.02,-.5,.29);s.bezierCurveTo(-.46,.58,-.12,.64,0,.37);s.bezierCurveTo(.12,.64,.46,.58,.5,.29);s.bezierCurveTo(.55,.02,.13,-.28,0,-.46);const g=new THREE.ExtrudeGeometry(s,{depth:.035,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.015,bevelThickness:.015,curveSegments:8});g.scale(size,size,size);const h=mesh(g,material,parent,x,y,z);for(const axis of ['x','y','z'])numberBinding(h.scale,axis,1,0);return h;}
 // A solid plaque changes only its top contour: an arch by day, clipped metal by night.
 // Separate front, back and edge vertices keep the thin plate's edge normals crisp.
 function plaquePositions(outline,depth) {
  const points=[],n=outline.length,front=depth/2,back=-front;
  const push=(x,y,z)=>points.push(x,y,z);
  for(const z of [front,back]){push(0,.05,z);for(const [x,y]of outline)push(x,y,z);}
  for(let i=0;i<n;i++){const a=outline[i],b=outline[(i+1)%n];push(...a,front);push(...b,front);push(...a,back);push(...b,back);}
  return new Float32Array(points);
 }
 function morphPlaque(dayOutline,nightOutline,depth,material,parent,z=0) {
  const geometry=new THREE.BufferGeometry(),n=dayOutline.length,indices=[];
  for(let i=0;i<n;i++){const j=(i+1)%n;indices.push(0,1+j,1+i,n+1,n+2+i,n+2+j);const a=(n+1)*2+i*4;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  const day=plaquePositions(dayOutline,depth),night=plaquePositions(nightOutline,depth);
  geometry.setAttribute('position',new THREE.BufferAttribute(night.slice(),3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const plate=mesh(geometry,material,parent,0,0,z);plate.frustumCulled=false;
  morphPlates.push({geometry,day,night});return plate;
 }
 function metalTube(points,radius,material,parent) {
  const path=new THREE.CurvePath();for(let i=1;i<points.length;i++)path.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1]),new THREE.Vector3(...points[i])));
  return mesh(new THREE.TubeGeometry(path,Math.max(12,points.length*8),radius,8,false),material,parent);
 }
 function screw(parent,x,y,z) {
  const head=cyl(.032,.041,.016,silver,parent,x,y,z);head.rotation.x=Math.PI/2;
  const socket=cyl(.017,.017,.003,panelSeam,parent,x,y,z+.010);socket.rotation.x=Math.PI/2;
  box(.027,.004,.004,.001,brushedSilver,parent,x,y,z+.013);
 }
 // Long, high-contrast studio cards make legible metal reflections without noise.
 const reflectionStudio=new THREE.Scene();reflectionStudio.background=new THREE.Color(0x718095);
 for(const [c,pos,size,strength]of [[0xffffff,[0,7,1],[8,.65,7],1.85],[0xe8f3ff,[-4,3,3],[.55,7,5],2.0],[0xf9edf6,[4,4,-1],[.5,7,5],1.7],[0xb7c8dc,[1,3,-5],[5,6,.3],.9]]) {
  const card=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(strength)}));
  card.position.set(...pos);reflectionStudio.add(card);
 }
 const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(reflectionStudio,.06).texture;pmrem.dispose();
 const ambient=new THREE.HemisphereLight(0xc7d8ff,0x685485,2.4);scene.add(ambient);
 const key=new THREE.DirectionalLight(0xd8edff,4);key.position.set(-4,7,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=8;key.shadow.camera.bottom=-3;key.shadow.normalBias=.035;scene.add(key);
 const fill=new THREE.DirectionalLight(0xf2bfff,1.7);fill.position.set(5,4,5);scene.add(fill);
 const magentaLight=new THREE.PointLight(0xff62ce,38,14,2);magentaLight.position.set(4,4,1);scene.add(magentaLight);
 const blueLight=new THREE.PointLight(0x22eaff,32,13,2);blueLight.position.set(-4,3,3);scene.add(blueLight);
 // The common cabinet retains the blue-and-pink reference in both modes.
 box(3.65,.16,3.0,.25,cream,cabinet,0,.08,.02);box(2.85,.26,2.35,.13,rose,cabinet,0,.29);box(2.58,2.18,2.02,.09,babyBlue,cabinet,0,1.5);
 box(2.43,2.06,.10,.05,babyBlue,cabinet,0,1.51,1.065);
 for(const x of [-1.14,1.14])for(const z of [-.85,.85])cyl(.11,.12,.12,cream,cabinet,x,.16,z);
 box(1.03,.19,.09,.035,silver,cabinet,-.48,2.2,1.16);box(.85,.065,.025,.022,recess,cabinet,-.48,2.2,1.22);box(.81,.018,.022,.008,roseDark,cabinet,-.48,2.17,1.24);
 const knob=new THREE.Group();knob.position.set(-.48,1.49,1.18);cabinet.add(knob);const db=cyl(.43,.43,.11,brushedSilver,knob);db.rotation.x=Math.PI/2;const dc=cyl(.365,.365,.15,rose,knob,0,0,.09);dc.rotation.x=Math.PI/2;const dr=ring(.32,.014,silver,knob,0,0,.17);dr.rotation.x=0;box(.14,.59,.16,.035,brushedSilver,knob,0,0,.22);const turnLabel=label('TURN ME',.62,.13,cabinet,-.48,.94,1.18,'#edf7fc',18);colorBinding(turnLabel.material,'color',0xedf7fc,0xb4ffef);
 // Rounded arch outlet with a scoop projecting from the cabinet.
 box(.79,.91,.09,.29,silver,cabinet,.64,.91,1.17);box(.63,.76,.04,.28,outletInside,cabinet,.64,.93,1.235);box(.67,.08,.65,.035,brushedSilver,cabinet,.64,.54,1.43);box(.51,.035,.40,.04,rose,cabinet,.64,.62,1.49);
 for(const x of [.30,.98])box(.055,.16,.50,.018,silver,cabinet,x,.64,1.48);
 // Folded sheet edges, panel reveals and countersunk hardware anchor the metal finish.
 for(const x of [-1.16,1.16]) {
  box(.022,1.91,.024,.004,silver,cabinet,x,1.50,1.14);
  box(.010,1.82,.012,.002,panelSeam,cabinet,x*.955,1.5,1.13);
 }
 for(const y of [.54,2.46])box(2.34,.022,.025,.004,brushedSilver,cabinet,0,y,1.14);
 for(const x of [-1.07,1.07])for(const y of [.62,2.37])screw(cabinet,x,y,1.145);
 for(const x of [-.84,-.12])screw(cabinet,x,2.2,1.22);
 box(2.90,.026,2.37,.014,silver,cabinet,0,.423);
 // Pink side panel, blue ornament studs and little red hearts.
 box(.10,.8,1.40,.025,rose,cabinet,1.34,.96,.04);for(let j=0;j<4;j++){const stud=cyl(.08,.08,.24,blueEdge,cabinet,1.36,1.53,-.49+j*.32);}
 for(let j=0;j<3;j++){const h=heart(.17,heartMaterial,cabinet,1.405,1.05,-.4+j*.38);h.rotation.y=Math.PI/2;}
 box(2.72,.18,2.16,.06,blueEdge,cabinet,0,2.69);box(2.62,.09,2.06,.03,cream,cabinet,0,2.81);
 const chamberGlass=new THREE.MeshPhysicalMaterial({color:0xe6f5ff,metalness:0,roughness:.05,transparent:true,opacity:.085,side:THREE.DoubleSide,depthWrite:false});
 for(const [w,h,x,y,z,ry] of [[2.48,2.08,0,3.9,1.0,0],[2.48,2.08,0,3.9,-1.0,0],[2.0,2.08,1.24,3.9,0,Math.PI/2],[2.0,2.08,-1.24,3.9,0,Math.PI/2]]){const pane=mesh(new THREE.PlaneGeometry(w,h),chamberGlass,cabinet,x,y,z);pane.rotation.y=ry;pane.castShadow=false;}
 for(const x of [-1.27,1.27])for(const z of [-1.03,1.03])box(.15,2.20,.15,.025,babyBlue,cabinet,x,3.9,z);
 box(2.68,.16,2.16,.04,babyBlue,cabinet,0,5.01);
 // Cream overhanging roof with a continuous heart border.
 box(2.95,.25,2.42,.055,cream,cabinet,0,5.21);box(3.03,.10,2.48,.045,rose,cabinet,0,5.08);
 for(let j=0;j<10;j++)heart(.12,heartMaterial,cabinet,-1.28+j*.285,5.18,1.258);
 for(const side of [-1,1])for(let j=0;j<7;j++){const h=heart(.12,heartMaterial,cabinet,side*1.535,5.18,-.95+j*.3);h.rotation.y=side*Math.PI/2;}
 box(2.95,.026,2.42,.012,brushedSilver,cabinet,0,5.355);
 // Both modes share the base and thin sign plate, with one smoothly changing outline.
 const marquee=new THREE.Group();marquee.position.set(0,5.47,.14);cabinet.add(marquee);
 box(2.26,.10,.22,.022,brushedSilver,marquee,0,-.12,0);
 const topXs=[-1.12,-.92,...Array.from({length:25},(_,i)=>-.58+i*1.16/24),.92,1.12];
 const dayHeight=x=>.14+(Math.abs(x)<=.580001?Math.sqrt(Math.max(0,.58*.58-x*x)):0);
 const nightHeight=x=>.43-Math.max(0,Math.abs(x)-.92)*1.45;
 const contour=height=>[[-1.12,-.13],...topXs.map(x=>[x,height(x)]),[1.12,-.13]];
 const dayContour=contour(dayHeight),nightContour=contour(nightHeight);
 morphPlaque(dayContour,nightContour,.13,silver,marquee);
 const inset=points=>points.map(([x,y])=>[x*.948,.08+(y-.08)*.87]);
 morphPlaque(inset(dayContour),inset(nightContour),.065,babyBlue,marquee,.065);
 const nameplate=label('NEON',.96,.19,marquee,0,.10,.111,'#d5fff4',24);
 const nightNameTexture=nameplate.material.map;
 const dayNameTexture=textTexture('ORACLE','#ffffff',24*1024/.96/250,1024,Math.round(1024*.19/.96));
 colorBinding(nameplate.material,'color',0x264e69,0xd5fff4);
 for(let j=0;j<11;j++) {
  const x=-.99+j*.198;
  const bulb=mesh(new THREE.SphereGeometry(.022,10,8),butter,marquee,x,0,.112);
  numberBinding(bulb.position,'y',dayHeight(x)-.055,nightHeight(x)-.055);
 }
 const emblem=label('✦',.16,.17,marquee,0,.43,.116,'#ffffff',38);
 numberBinding(emblem.position,'y',.43,.278);colorBinding(emblem.material,'color',0xf0ca65,0x8affed);
 for(const x of [-1.025,1.025])screw(marquee,x,-.055,.108);
 // Slim inlays are physical trim by day and luminous accents by night.
 box(2.62,.026,.028,.01,rimLight,cabinet,0,2.79,1.14);
 box(2.90,.022,.028,.01,rimLight,cabinet,0,5.065,1.27);
 box(2.72,.020,.03,.008,rimLight,cabinet,0,.39,1.2);
 materialTheme(chamberGlass,{color:0xe6f5ff,roughness:.05,opacity:.085},{color:0xa6e1f5,roughness:.065,opacity:.10});
 // Capsule materials join the same uninterrupted color transition.
 const capsuleColors=[0x39dce3,0xf16ac3,0xa58af5,0xffcf64,0x7baff7],pastels=[0xf7b1cf,0xf9db7f,0xc9b4e8,0x9fd5e0,0xf8c8b6];
 function capsule(color,r=.29){const g=new THREE.Group();const top=mesh(new THREE.SphereGeometry(r,24,16,0,Math.PI*2,0,Math.PI/2),new THREE.MeshPhysicalMaterial({color,metalness:.12,roughness:.22,clearcoat:1,clearcoatRoughness:.15}),g);const bottom=mesh(new THREE.SphereGeometry(r,24,16,0,Math.PI*2,Math.PI/2,Math.PI/2),new THREE.MeshPhysicalMaterial({color:0xd8e8fa,metalness:.12,roughness:.23,clearcoat:.8}),g);const seam=ring(r,.009,mat(0xb4c7e0,.5,.3),g);g.userData={top,bottom,seam};return g;}
 const eggs=[];for(let level=0;level<4;level++){const count=level===3?4:7;for(let j=0;j<count;j++){const a=j/count*Math.PI*2+level*.68,rr=j===0?0:.79,e=capsule(capsuleColors[(j+level*2)%5]);e.position.set(Math.cos(a)*rr,3.14+level*.46,Math.sin(a)*rr);e.rotation.set(j*.7,level*.7,j*.9);e.userData.rest=e.position.clone();e.userData.rot=e.rotation.clone();e.userData.colorIndex=(j+level*2)%5;machine.add(e);eggs.push(e);}}
 // The token has separate stamped faces, a milled edge and a physical thickness.
 const token=new THREE.Group();machine.add(token);const tokenGold=new THREE.MeshPhysicalMaterial({color:0xffcb62,emissive:0xffaa25,emissiveIntensity:.16,metalness:.72,roughness:.23,clearcoat:.8});
 const tokenBody=cyl(.27,.27,.065,tokenGold,token);tokenBody.rotation.x=Math.PI/2;
 const coinFaces=[];for(const side of [-1,1]){const face=new THREE.Group();face.position.z=side*.04;token.add(face);const disc=cyl(.245,.245,.012,tokenGold,face);disc.rotation.x=Math.PI/2;const r=ring(.216,.009,mat(0xffedb9,.35,.28),face,0,0,side*.01);r.rotation.x=0;const emblem=label(side>0?'✦':'?',.29,.29,face,0,0,side*.018,'#fff5cd',65);if(side<0)emblem.rotation.y=Math.PI;coinFaces.push(face);}
 for(let j=0;j<32;j++){const a=j/32*Math.PI*2;const tick=box(.008,.028,.07,.002,tokenGold,token,Math.cos(a)*.264,Math.sin(a)*.264,0);tick.rotation.z=a-Math.PI/2;}
 token.visible=false;
 const prize=capsule(0xdf88ee,.34);machine.add(prize);prize.visible=false;
 // Minting choreography: orbiting question fragments, press faces, two halos, sparks.
 function glowTexture(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),gr=x.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.17,'rgba(255,255,255,.65)');gr.addColorStop(.45,'rgba(255,255,255,.12)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
 const glowMap=glowTexture(),mintFX=new THREE.Group();machine.add(mintFX);mintFX.visible=false;
 const mintHalos=[];for(let i=0;i<2;i++){const m=new THREE.MeshBasicMaterial({color:i?0xff87d4:0x8ffbff,transparent:true,opacity:0,depthWrite:false});const r=ring(.49+i*.17,.009,m,mintFX);r.rotation.x=i?Math.PI/3:0;mintHalos.push(r);}
 const mintFlash=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap,color:0xffd785,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));mintFlash.scale.setScalar(2.6);mintFX.add(mintFlash);
 const sparkCount=70,sparkPositions=new Float32Array(sparkCount*3),sparkColors=new Float32Array(sparkCount*3),sparkGeo=new THREE.BufferGeometry();for(let i=0;i<sparkCount;i++){const c=new THREE.Color([0x8cf7ff,0xffc6e8,0xffdf87][i%3]);sparkColors.set([c.r,c.g,c.b],i*3);}sparkGeo.setAttribute('position',new THREE.BufferAttribute(sparkPositions,3));sparkGeo.setAttribute('color',new THREE.BufferAttribute(sparkColors,3));const sparkMaterial=new THREE.PointsMaterial({map:glowMap,size:.12,vertexColors:true,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending});const sparks=new THREE.Points(sparkGeo,sparkMaterial);mintFX.add(sparks);sparks.frustumCulled=false;
 let glyphs=[];
 // A common floor and camera-facing halo anchor both sets of studio scenery.
 const floor=mesh(new THREE.PlaneGeometry(100,100),mat(0xf3d3c8,.02,.65),scene);floor.rotation.x=-Math.PI/2;floor.position.y=-.025;
 materialTheme(floor.material,{color:0xf3d3c8,roughness:.65,metalness:.02},{color:0x090d24,roughness:.32,metalness:.32});
 const backdrop=new THREE.Group(),haloGroup=new THREE.Group();scene.add(backdrop,haloGroup);
 const haloAnchor=new THREE.Vector3(),haloDirection=new THREE.Vector3();
 const diskMaterial=new THREE.MeshBasicMaterial({color:0xffebbb,transparent:true,opacity:.72,depthWrite:false});
 const disk=mesh(new THREE.CircleGeometry(2.6,64),diskMaterial,haloGroup);disk.castShadow=false;disk.receiveShadow=false;
 colorBinding(diskMaterial,'color',0xffebbb,0x171b46);numberBinding(diskMaterial,'opacity',.72,.25);
 const haloMaterial=new THREE.MeshBasicMaterial({color:0xedbb8f,transparent:true,opacity:.34,depthWrite:false});
 const halo=ring(2.66,.018,haloMaterial,haloGroup,0,0,.025);halo.rotation.x=0;halo.castShadow=false;
 colorBinding(haloMaterial,'color',0xe3b88d,0x00f5ef);numberBinding(haloMaterial,'opacity',.4,1);
 const haloOuterMaterial=haloMaterial.clone();const haloOuter=ring(2.77,.009,haloOuterMaterial,haloGroup,0,0,.015);haloOuter.rotation.x=0;haloOuter.castShadow=false;
 colorBinding(haloOuterMaterial,'color',0xf0c5b7,0xb62eff);numberBinding(haloOuterMaterial,'opacity',.35,.9);
 const ambientGlows=[],floorPuddles=[];
 for(const [dayColor,nightColor,x,y,z,size,period,phase]of [[0xf3b9ca,0x881ce3,2,3,-3.8,8,18,.6],[0xc8ddeb,0x00a2b9,-3,1,-3.8,7,16,2.1]]) {
  const glowMaterial=new THREE.SpriteMaterial({map:glowMap,color:dayColor,transparent:true,opacity:.08,blending:THREE.AdditiveBlending,depthWrite:false});
  const glow=new THREE.Sprite(glowMaterial);glow.position.set(x,y,z);glow.scale.setScalar(size);backdrop.add(glow);
  colorBinding(glowMaterial,'color',dayColor,nightColor);numberBinding(glowMaterial,'opacity',.06,.31);
  ambientGlows.push({object:glow,base:glow.position.clone(),size,period,phase});
 }
 const orbitSculpture=new THREE.Group();orbitSculpture.position.set(-3.65,0,-2.5);orbitSculpture.rotation.y=.22;backdrop.add(orbitSculpture);
 cyl(.54,.57,.035,brushedSilver,orbitSculpture,0,.018,0);
 const sculptureRing=ring(.65,.035,silver,orbitSculpture,0,.87,0);sculptureRing.rotation.x=0;
 const innerSculptureRing=ring(.52,.014,rose,orbitSculpture,0,.87,.02);innerSculptureRing.rotation.x=0;
 for(const x of [-.18,.18])metalTube([[x,.04,0],[x,.28,0]],.022,brushedSilver,orbitSculpture);
 const foldedSculpture=new THREE.Group();foldedSculpture.position.set(3.7,0,-3);foldedSculpture.rotation.y=-.18;backdrop.add(foldedSculpture);
 box(.95,.035,.6,.035,brushedSilver,foldedSculpture,0,.018,0);
 const zigzag=[[-.36,.045],[.33,.73],[-.28,1.24],[.27,1.85]];
 for(const z of [-.13,.13])metalTube(zigzag.map(([x,y])=>[x,y,z]),.029,silver,foldedSculpture);
 for(const [x,y]of zigzag)metalTube([[x,y,-.13],[x,y,.13]],.020,brushedSilver,foldedSculpture);
 metalTube(zigzag.map(([x,y])=>[x,y,.16]),.009,rimLight,foldedSculpture);
 sceneryTheme(orbitSculpture,false);sceneryTheme(foldedSculpture,false);
 // Original sunny blocks from b3ffa54 / e81a901, with coated sheet-metal details.
 const sunnyProps=new THREE.Group();backdrop.add(sunnyProps);
 const pastelPaint=color=>new THREE.MeshPhysicalMaterial({color,metalness:.48,roughness:.34,clearcoat:.42,clearcoatRoughness:.25});
 const peachPaint=pastelPaint(0xe6a5b5),creamPaint=pastelPaint(0xf1ddba),bluePaint=pastelPaint(0x7fb4d3);
 box(1.4,.75,1.3,.14,peachPaint,sunnyProps,-3.7,.35,-2.5);
 box(1.2,1.3,1.1,.12,creamPaint,sunnyProps,3.7,.62,-3);
 box(1.4,.28,1.2,.10,bluePaint,sunnyProps,3.7,1.4,-3);
 box(1.36,.028,1.25,.014,brushedSilver,sunnyProps,-3.7,.72,-2.5);
 box(1.18,.025,1.09,.012,brushedSilver,sunnyProps,3.7,1.28,-3);
 box(1.30,.025,1.15,.012,silver,sunnyProps,3.7,1.24,-3);
 for(const [x,y,z,w,h]of [[-3.7,.35,-1.815,1.12,.49],[3.7,.63,-2.416,.96,1.02]]) {
  box(w,.012,.012,.003,brushedSilver,sunnyProps,x,y-h/2,z);
  for(const side of [-1,1]) {
   box(.012,h,.012,.003,brushedSilver,sunnyProps,x+side*w/2,y,z);
   screw(sunnyProps,x+side*(w/2-.075),y+h/2-.07,z+.008);
  }
 }
 for(const x of [-4.20,-3.20])box(.16,.055,.90,.025,brushedSilver,sunnyProps,x,.005,-2.5);
 for(const x of [3.28,4.12])box(.14,.055,.78,.020,brushedSilver,sunnyProps,x,.005,-3);
 // A few shallow layers add depth behind the props without crowding the cabinet.
 const sunnyPanels=new THREE.Group();backdrop.add(sunnyPanels);
 const bluePanel=box(2.15,2.75,.09,.18,pastelPaint(0xc1d9e6),sunnyPanels,-4.8,1.34,-5.8);bluePanel.rotation.y=.12;
 const peachPanel=box(1.95,2.30,.10,.16,pastelPaint(0xecc4b7),sunnyPanels,4.75,1.10,-6.0);peachPanel.rotation.y=-.16;
 const creamPanel=box(1.35,1.67,.08,.16,pastelPaint(0xf1e5cd),sunnyPanels,3.60,.81,-5.5);creamPanel.rotation.y=-.10;
 for(const [x,z]of [[-4.8,-5.8],[4.75,-6.0],[3.60,-5.5]])box(.62,.045,.55,.025,brushedSilver,sunnyPanels,x,.012,z);
 const littleDisc=cyl(.16,.16,.035,creamPaint,sunnyProps,-3.75,.775,-2.5);littleDisc.rotation.z=.12;
 const littleRing=ring(.19,.017,silver,sunnyProps,-3.42,.80,-2.55);littleRing.rotation.x=.24;
 sceneryTheme(sunnyProps,true);sceneryTheme(sunnyPanels,true);
 for(let i=0;i<4;i++) {
  const ornament=label(i%2?'✦':'·',.22,.22,backdrop,(i-1.5)*1.7,3.2+(i%2)*1.8,-2.8,'#ffffff',60);ornament.rotation.z=i*.6;
  colorBinding(ornament.material,'color',i%2?0xe5ad66:0xe8aec2,i%2?0xb4fff1:0xd5b5f3);
 }
 // Night-specific light and engraving layers fade with the palette; geometry stays anchored.
 const cyberDetails=new THREE.Group();cabinet.add(cyberDetails);
 function nightMaterial(color,opacity=1,additive=true) {
  const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity:0,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,toneMapped:false});
  numberBinding(m,'opacity',0,opacity);return m;
 }
 const cyanCore=nightMaterial(0x00ebff,.98),pinkCore=nightMaterial(0xff00c8,.95),violetCore=nightMaterial(0xa435ff,.85);
 function noShadow(object){object.castShadow=false;object.receiveShadow=false;return object;}
 const stripCanvas=document.createElement('canvas');stripCanvas.width=64;stripCanvas.height=256;
 const stripContext=stripCanvas.getContext('2d');const stripGradient=stripContext.createLinearGradient(0,0,64,0);
 stripGradient.addColorStop(0,'rgba(255,255,255,0)');stripGradient.addColorStop(.35,'rgba(255,255,255,.12)');stripGradient.addColorStop(.5,'rgba(255,255,255,.7)');stripGradient.addColorStop(.65,'rgba(255,255,255,.12)');stripGradient.addColorStop(1,'rgba(255,255,255,0)');stripContext.fillStyle=stripGradient;stripContext.fillRect(0,0,64,256);
 const stripMap=new THREE.CanvasTexture(stripCanvas);
 function lightStrip(x,y,z,height,material,color) {
  noShadow(box(.026,height,.024,.008,material,cyberDetails,x,y,z));
  const halo=nightMaterial(color,.42);halo.map=stripMap;
  noShadow(mesh(new THREE.PlaneGeometry(.22,height+.08),halo,cyberDetails,x,y,z+.015));
 }
 for(const [x,core,color]of [[-1.23,cyanCore,0x00dbff],[1.23,pinkCore,0xff00c8]]) {
  lightStrip(x,1.5,1.15,1.83,core,color);
  lightStrip(x,3.9,1.12,2.08,core,color);
 }
 // Back chamber rails illuminate the colorful capsules and preserve the clear-glass outline.
 for(const [x,material]of [[-1.14,cyanCore],[1.14,pinkCore]])noShadow(box(.025,1.98,.025,.008,material,cyberDetails,x,3.89,-.83));
 noShadow(box(2.32,.025,.025,.008,cyanCore,cyberDetails,0,4.88,-.83));
 const innerCyan=new THREE.PointLight(0x00cfff,0,3.2,2);innerCyan.position.set(-.98,3.9,.05);cabinet.add(innerCyan);numberBinding(innerCyan,'intensity',0,3.2);
 const innerPink=new THREE.PointLight(0xff16ba,0,3.2,2);innerPink.position.set(.98,4.30,-.35);cabinet.add(innerPink);numberBinding(innerPink,'intensity',0,2.7);
 function circuit(points,material=cyanCore,radius=.008){return noShadow(metalTube(points,radius,material,cyberDetails));}
 circuit([[.15,1.97,1.14],[.79,1.97,1.14],[1.00,1.76,1.14],[1.00,1.45,1.14]]);
 circuit([[-1.00,.86,1.14],[-.86,.86,1.14],[-.67,.67,1.14],[-.24,.67,1.14]],violetCore);
 for(let j=0;j<6;j++)noShadow(box(.018,.07+(j%3)*.035,.010,.003,pinkCore,cyberDetails,.36+j*.065,1.72,1.15));
 for(const [text,x,y,w]of [['SECTOR / 01',.55,2.18,.67],['SYS READY',.58,1.52,.55],['ORCL 2049',-.57,.71,.58]]) {
  const marking=label(text,w,.10,cyberDetails,x,y,1.16,'#00eaff',14);marking.castShadow=false;marking.receiveShadow=false;marking.material.toneMapped=false;numberBinding(marking.material,'opacity',0,.85);
 }
 // The former heart positions become crisp paired cuts and circuit geometry at night.
 for(let j=0;j<10;j++) {
  const x=-1.28+j*.285;
  circuit([[x-.046,5.135,1.273],[x+.008,5.225,1.273]],j%2?pinkCore:cyanCore,.007);
  circuit([[x+.006,5.135,1.273],[x+.060,5.225,1.273]],j%2?pinkCore:cyanCore,.007);
 }
 for(const side of [-1,1])for(let j=0;j<7;j++) {
  const z=-.95+j*.3;
  circuit([[side*1.545,5.137,z-.035],[side*1.545,5.225,z+.025]],side<0?cyanCore:pinkCore,.007);
 }
 circuit([[1.412,.83,-.48],[1.412,1.02,-.28],[1.412,1.02,.02],[1.412,1.22,.22],[1.412,1.22,.53]],pinkCore,.008);
 // Broad light puddles read as reflections on the dark polished floor.
 for(const [color,x,z,w,h,opacity,period,phase]of [[0x00caff,-1.2,.6,5.1,3.3,.32,16,2.1],[0xe600d8,1.7,.45,4.6,3.1,.29,18,.6],[0x5d15ff,0,-1.9,5.5,3.6,.21,20,1.3]]) {
  const reflection=nightMaterial(color,opacity);reflection.map=glowMap;
  const puddle=noShadow(mesh(new THREE.PlaneGeometry(w,h),reflection,scene,x,-.013,z));puddle.rotation.x=-Math.PI/2;
  floorPuddles.push({object:puddle,base:puddle.position.clone(),opacity,period,phase});
 }
 const floorRing=noShadow(ring(2.12,.012,nightMaterial(0x00bfee,.58),scene,0,-.010,0));
 // A restrained perspective grid and vertical ambience restore a distinct night setting.
 const gridPositions=[];for(let i=-7;i<=7;i++){gridPositions.push(i*.8,-.016,-7,i*.8,-.016,6,-6,-.016,i*.8,6,-.016,i*.8);}
 const gridGeometry=new THREE.BufferGeometry();gridGeometry.setAttribute('position',new THREE.Float32BufferAttribute(gridPositions,3));
 const gridMaterial=new THREE.LineBasicMaterial({color:0x3357c2,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});numberBinding(gridMaterial,'opacity',0,.22);scene.add(new THREE.LineSegments(gridGeometry,gridMaterial));
 for(const [x,y,z,h,color]of [[-4.8,3.25,-5.3,6.0,0x0046c8],[4.8,3.8,-5.6,6.7,0x9700b2]]) {
  const beam=nightMaterial(color,.22);beam.map=stripMap;noShadow(mesh(new THREE.PlaneGeometry(.6,h),beam,backdrop,x,y,z));
 }
 for(const [radius,color,opacity]of [[2.66,0x00dce9,.13],[2.77,0xa312e9,.10]]) {
  const bloom=noShadow(ring(radius,.075,nightMaterial(color,opacity),haloGroup,0,0,-.01));bloom.rotation.x=0;
 }
 const knobGlow=noShadow(ring(.375,.012,cyanCore,knob,0,0,.175));knobGlow.rotation.x=0;
 let mode='idle',modeTime=0,elapsed=0,viewAngle=.27,targetAngle=.27,viewPitch=0,targetPitch=0,dragStart=null,dragMoved=0,animationResolve=null,mintResolve=null;
 const viewTarget=new THREE.Vector3(0,1.8,0);
 const ambientLights=[
  {object:magentaLight,base:magentaLight.position.clone(),intensity:62,period:18,phase:.6},
  {object:blueLight,base:blueLight.position.clone(),intensity:66,period:16,phase:2.1}
 ];
 const tokenRest=new THREE.Vector3(1.85,2.12,1.6),insertStart=new THREE.Vector3();
 // Interactions use fixed coordinates, independent of the light palette.
 const slot=()=>new THREE.Vector3(-.48,2.2,1.2);
 const eggRest=()=>new THREE.Vector3(.64,.84,1.62);
 for(const egg of [...eggs,prize]) {
  const i=egg===prize?0:egg.userData.colorIndex;
  materialTheme(egg.userData.top.material,{color:pastels[i%5],metalness:.02,roughness:.24},{color:capsuleColors[i%5],metalness:.12,roughness:.22});
  materialTheme(egg.userData.bottom.material,{color:pastels[(i+2)%5],metalness:.02,roughness:.25},{color:0xd8e8fa,metalness:.12,roughness:.23});
  colorBinding(egg.userData.seam.material,'color',0xf8e4dd,0xb4c7e0);
 }
 colorBinding(mintHalos[0].material,'color',0xefb647,0x8ffbff);
 colorBinding(mintHalos[1].material,'color',0xec9bb6,0xff87d4);
 numberBinding(tokenGold,'emissiveIntensity',.04,.16);
 const glyphColor={value:new THREE.Color(0xd3fbff)};colorBinding(glyphColor,'value',0x8c6575,0xd3fbff);
 const background={value:new THREE.Color(0x1c2e4a)};colorBinding(background,'value',0xf5d6cb,0x080a20);
 scene.fog=new THREE.FogExp2(0x1c2e4a,.016);
 colorBinding(scene.fog,'color',0xf5d6cb,0x080a20);numberBinding(scene.fog,'density',.012,.024);
 numberBinding(renderer,'toneMappingExposure',1,1.08);numberBinding(scene,'environmentIntensity',.85,.22);
 colorBinding(ambient,'color',0xfff5ec,0x6970e6);colorBinding(ambient,'groundColor',0xe8b8b1,0x25123f);numberBinding(ambient,'intensity',1.05,.48);
 colorBinding(key,'color',0xfff5e5,0x688bff);numberBinding(key,'intensity',2.5,2.1);
 colorBinding(fill,'color',0xd6eaff,0xe134e9);numberBinding(fill,'intensity',.9,1.85);
 colorBinding(magentaLight,'color',0xf3a2b9,0xff05c8);numberBinding(magentaLight,'intensity',0,62);
 colorBinding(blueLight,'color',0x99cde5,0x00dfff);numberBinding(blueLight,'intensity',0,66);
 let themeBlend=0,themeStart=0,themeTarget=0,themeTime=.8;
 function applyTheme() {
  for(const binding of themeBindings) {
   if(binding.color)binding.object[binding.key].lerpColors(binding.night,binding.day,themeBlend);
   else binding.object[binding.key]=THREE.MathUtils.lerp(binding.night,binding.day,themeBlend);
  }
  for(const {group,daytime,materials,objects}of themeGroups) {
   const amount=daytime?themeBlend:1-themeBlend;
   group.visible=amount>.001;
   for(const [source,copy]of materials) {
    for(const key of ['color','emissive'])if(source[key])copy[key].copy(source[key]);
    for(const key of ['metalness','roughness','emissiveIntensity'])if(key in source)copy[key]=source[key];
    copy.opacity=source.opacity*amount;
    copy.depthWrite=source.depthWrite&&amount>.995;
   }
   for(const item of objects)item.object.castShadow=item.castShadow&&amount>.995;
  }
  for(const plate of morphPlates) {
   const attribute=plate.geometry.attributes.position;
   for(let i=0;i<attribute.array.length;i++)attribute.array[i]=THREE.MathUtils.lerp(plate.night[i],plate.day[i],themeBlend);
   attribute.needsUpdate=true;plate.geometry.computeVertexNormals();
  }
  // One text plane switches its map, so the two names never overlap or z-fight.
  nameplate.material.map=themeBlend>=.5?dayNameTexture:nightNameTexture;
  renderer.setClearColor(background.value);
  for(const glyph of glyphs)glyph.material.color.copy(glyphColor.value);
 }
 function setTheme(next,immediate=false) {
  theme=next==='sunny'?'sunny':'cyber';themeStart=themeBlend;themeTarget=theme==='sunny'?1:0;themeTime=0;
  if(immediate||reduced){themeBlend=themeTarget;applyTheme();}
  renderer.domElement.setAttribute('aria-label',theme==='sunny'?'可左右上下拖动查看的晴光 3D 扭蛋机':'可左右上下拖动查看的霓虹 3D 扭蛋机');
 }
 function updateTheme(dt) {
  if(themeBlend===themeTarget)return;
  themeTime=Math.min(.8,themeTime+dt);const t=themeTime/.8;
  themeBlend=THREE.MathUtils.lerp(themeStart,themeTarget,t*t*(3-2*t));applyTheme();
 }
 function updateAmbience() {
  const night=1-themeBlend,motion=reduced?0:night;
  const phaseAt=item=>elapsed*Math.PI*2/item.period+item.phase;
  for(const item of ambientGlows) {
   const phase=phaseAt(item),wave=Math.sin(phase);
   item.object.position.copy(item.base);
   item.object.position.x+=Math.cos(phase)*.55*motion;
   item.object.position.y+=wave*.25*motion;
   item.object.scale.setScalar(item.size*(1+wave*.055*motion));
   item.object.material.opacity=THREE.MathUtils.lerp(.31,.06,themeBlend)*(1+wave*.12*motion);
  }
  for(const item of floorPuddles) {
   const phase=phaseAt(item),wave=Math.sin(phase);
   item.object.position.copy(item.base);
   item.object.position.x+=Math.cos(phase)*.42*motion;
   item.object.position.z+=wave*.32*motion;
   item.object.scale.set(1+wave*.055*motion,1-wave*.018*motion,1);
   item.object.material.opacity=item.opacity*night*(1+wave*.12*motion);
  }
  for(const item of ambientLights) {
   const phase=phaseAt(item),wave=Math.sin(phase);
   item.object.position.copy(item.base);
   item.object.position.x+=Math.cos(phase)*.55*motion;
   item.object.position.y+=wave*.25*motion;
   item.object.position.z+=wave*.10*motion;
   item.object.intensity=item.intensity*night*(1+wave*.12*motion);
  }
 }
 function adjustView(deltaYaw=0,deltaPitch=0) {
  if(Number.isFinite(deltaYaw))targetAngle=THREE.MathUtils.clamp(targetAngle+deltaYaw,-.7,.7);
  if(Number.isFinite(deltaPitch))targetPitch=THREE.MathUtils.clamp(targetPitch+deltaPitch,-.10,.10);
  if(reduced){viewAngle=targetAngle;viewPitch=targetPitch;}
 }
 function resetView(){targetAngle=.27;targetPitch=0;if(reduced){viewAngle=targetAngle;viewPitch=targetPitch;}}
 function updateView(dt) {
  const ease=reduced?1:1-Math.exp(-dt*6);
  viewAngle+=(targetAngle-viewAngle)*ease;viewPitch+=(targetPitch-viewPitch)*ease;
  // Offset zero exactly preserves the previous desktop and mobile camera positions.
  const distance=camera.aspect<.85?16:14.9,radius=Math.hypot(distance,2.75),pitch=Math.atan2(2.75,distance)+viewPitch;
  const horizontal=radius*Math.cos(pitch);
  camera.position.set(Math.sin(viewAngle)*horizontal,viewTarget.y+radius*Math.sin(pitch),Math.cos(viewAngle)*horizontal);
  camera.lookAt(viewTarget);camera.updateMatrixWorld();
  // Every halo layer lies on the same plane, centered on the cabinet's sight line.
  machine.updateMatrixWorld(true);
  haloAnchor.set(0,3.05,0).applyMatrix4(machine.matrixWorld);
  haloDirection.subVectors(haloAnchor,camera.position).normalize();
  haloGroup.position.copy(haloAnchor).addScaledVector(haloDirection,4.2);
  haloGroup.quaternion.copy(camera.quaternion);
 }
 setTheme('cyber',true);
 const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2(),canvas=renderer.domElement;
 canvas.style.touchAction='none';
 canvas.addEventListener('pointerdown',e=>{
  if(dragStart||e.isPrimary===false||(e.pointerType==='mouse'&&e.button!==0))return;
  dragStart={id:e.pointerId,x:e.clientX,y:e.clientY,angle:targetAngle,pitch:targetPitch};dragMoved=0;
  canvas.setPointerCapture(e.pointerId);
 });
 canvas.addEventListener('pointermove',e=>{
  if(!dragStart||e.pointerId!==dragStart.id)return;
  const dx=e.clientX-dragStart.x,dy=e.clientY-dragStart.y;
  dragMoved=Math.max(dragMoved,Math.hypot(dx,dy));
  if(dragMoved<7)return;
  targetAngle=THREE.MathUtils.clamp(dragStart.angle+dx*.006,-.7,.7);
  targetPitch=THREE.MathUtils.clamp(dragStart.pitch-dy*.003,-.10,.10);
 });
 function finishPointer(e,cancelled=false) {
  if(!dragStart||e.pointerId!==dragStart.id)return;
  const moved=Math.max(dragMoved,Math.hypot(e.clientX-dragStart.x,e.clientY-dragStart.y));
  dragStart=null;dragMoved=0;
  if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  if(cancelled||moved>=7)return;
  const b=canvas.getBoundingClientRect();
  mouse.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);
  raycaster.setFromCamera(mouse,camera);
  if(mode==='coin'&&raycaster.intersectObjects(token.children,true).length)onSelect('insert');
  else if(mode==='egg'&&raycaster.intersectObjects(prize.children,true).length)onSelect('open');
  else if(mode==='coin'&&raycaster.intersectObjects(cabinet.children,true).length)onSelect('insert');
 }
 canvas.addEventListener('pointerup',e=>finishPointer(e));
 canvas.addEventListener('pointercancel',e=>finishPointer(e,true));
 canvas.addEventListener('lostpointercapture',e=>{if(dragStart?.id===e.pointerId){dragStart=null;dragMoved=0;}});
 function resize(){const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(container);resize();
 function clearGlyphs(){for(const g of glyphs){mintFX.remove(g);g.material.map.dispose();g.material.dispose();}glyphs=[];}
 function mint(question='一个小小的问题'){mintResolve?.();mode='mint';modeTime=0;token.visible=true;token.scale.setScalar(.01);token.position.copy(tokenRest);token.rotation.set(0,0,0);mintFX.position.copy(tokenRest);mintFX.visible=!reduced;clearGlyphs();const chars=Array.from(question.trim()).filter(c=>c.trim()).slice(0,12);if(!chars.length)chars.push('心','中','的','问','题');chars.forEach((c,i)=>{const texture=textTexture(c,'#ffffff',140,192,192,true),g=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:glyphColor.value.clone(),transparent:true,depthWrite:false}));g.scale.setScalar(.22);g.userData.phase=i/chars.length*Math.PI*2;mintFX.add(g);glyphs.push(g);});return new Promise(r=>mintResolve=r);}
 const clock=new THREE.Clock();function update(){requestAnimationFrame(update);const dt=Math.min(clock.getDelta(),.05);elapsed+=dt;modeTime+=dt;updateTheme(dt);updateAmbience();machine.rotation.z=mode==='mix'&&!reduced?Math.sin(modeTime*35)*.012:0;updateView(dt);
 if(mode==='mint'){const duration=reduced?.65:2.65,t=Math.min(modeTime/duration,1),collect=Math.min(t/.65,1),ease=collect*collect*(3-2*collect),burst=Math.max(0,(t-.66)/.34);token.scale.setScalar(reduced?1:.01+Math.min(1,Math.max(0,(t-.15)/.56))*(1+.12*Math.sin(Math.min(1,burst)*Math.PI)));token.rotation.set(reduced?0:.12*Math.sin(t*Math.PI),reduced?0:(1-t)*Math.PI*4,reduced?0:-.12*Math.sin(t*Math.PI*2));coinFaces.forEach((f,i)=>f.position.z=(i?1:-1)*(.04+(reduced?0:(1-ease)*.7)));tokenBody.scale.y=reduced?1:.2+.8*ease;mintFlash.material.opacity=(Math.sin(Math.min(1,collect)*Math.PI)*.28+Math.sin(burst*Math.PI)*.8)*(reduced?.3:1);mintHalos.forEach((r,i)=>{r.material.opacity=Math.sin(t*Math.PI)*.8;r.scale.setScalar(.65+ease*.55+burst*(i+1));r.rotation.z=(i?1:-1)*modeTime*2;r.rotation.y=reduced?0:Math.sin(modeTime+i)*.4;});
 for(let i=0;i<sparkCount;i++){const a=i*2.399+modeTime*4,rad=(1-ease)*(1.0+(i%7)*.06)+burst*(.3+(i%9)*.1),y=Math.sin(i*1.71+modeTime*3)*rad;sparkPositions[i*3]=Math.cos(a)*rad;sparkPositions[i*3+1]=y;sparkPositions[i*3+2]=Math.sin(a)*rad*.6;}sparkGeo.attributes.position.needsUpdate=true;sparkMaterial.opacity=burst>0?1-burst:Math.sin(t*Math.PI)*.9;
 glyphs.forEach((g,i)=>{const a=g.userData.phase+modeTime*1.6,r=(1-ease)*1.35+.03;g.position.set(Math.cos(a)*r,Math.sin(a)*r*.8+.15*(1-ease),Math.sin(a*.8)*.5*(1-ease));g.material.opacity=Math.max(0,1-collect*collect);g.scale.setScalar(.22*(1-collect*.65));});if(t===1){mode='coin';modeTime=0;token.scale.setScalar(1);tokenBody.scale.y=1;coinFaces.forEach((f,i)=>f.position.z=(i?1:-1)*.04);mintFX.visible=false;clearGlyphs();mintResolve?.();mintResolve=null;}}
 if(mode==='coin'){token.position.copy(tokenRest);token.position.y+=reduced?0:Math.sin(elapsed*2)*.12;token.rotation.set(.08,reduced?0:Math.sin(elapsed*.9)*.55,Math.sin(elapsed)*.05);}
 if(mode==='insert'){const t=Math.min(modeTime/(reduced?.3:.95),1),e=t*t*(3-2*t),destination=slot();token.position.lerpVectors(insertStart,destination,e);token.position.y+=reduced?0:Math.sin(t*Math.PI)*.62;token.rotation.y=e*Math.PI*2;token.rotation.z=e*Math.PI/2;token.scale.setScalar(1-e*.7);if(t===1){token.visible=false;mode='mix';modeTime=0;}}
 if(mode==='mix'){knob.rotation.z=-modeTime*4;for(let i=0;i<eggs.length;i++){const egg=eggs[i];if(!reduced){const a=modeTime*(i%2?4:-3)+i*2.4,rr=.8*Math.sin(i*13.1+modeTime*1.7);egg.position.set(Math.cos(a)*rr,3.18+Math.abs(Math.sin(modeTime*3.8+i*1.4))*1.3,Math.sin(a)*rr);egg.rotation.x+=dt*(i%2?5:-4);egg.rotation.z+=dt*3;}else egg.position.copy(egg.userData.rest);}if(modeTime>(reduced?.6:2.5)){mode='drop';modeTime=0;eggs.forEach(e=>{e.position.copy(e.userData.rest);e.rotation.copy(e.userData.rot);});prize.visible=true;prize.scale.setScalar(.72);}}
 if(mode==='drop'){const t=Math.min(modeTime/(reduced?.3:1.1),1),rest=eggRest();prize.position.set(rest.x,rest.y+.6*(1-t)+(reduced?0:Math.abs(Math.sin(t*Math.PI*2))*.12),rest.z-.32*(1-t));prize.rotation.z=t*4;if(t===1){mode='egg';modeTime=0;animationResolve?.();animationResolve=null;}}
 if(mode==='egg')prize.position.y=eggRest().y+(reduced?0:Math.sin(elapsed*2)*.025);
 if(mode==='open'){const t=Math.min(modeTime/(reduced?.45:1.2),1),e=1-Math.pow(1-t,3);prize.position.lerpVectors(eggRest(),new THREE.Vector3(0,2.65,3.15),e);prize.scale.setScalar(.72+e*.8);prize.rotation.set(0,e*.5,0);prize.userData.top.position.y=e*.45;prize.userData.top.rotation.z=-e*.35;prize.userData.bottom.position.y=-e*.2;if(t===1){mode='revealed';animationResolve?.();animationResolve=null;}}
 renderer.render(scene,camera);}
 update();
 return {mint,setTheme,adjustView,resetView,insert(){mode='insert';modeTime=0;insertStart.copy(token.position);return new Promise(r=>animationResolve=r);},open(){mode='open';modeTime=0;return new Promise(r=>animationResolve=r);},reset(){mode='idle';modeTime=0;token.visible=false;mintFX.visible=false;clearGlyphs();mintResolve?.();mintResolve=null;animationResolve?.();animationResolve=null;prize.visible=false;prize.userData.top.position.y=0;prize.userData.top.rotation.z=0;prize.userData.bottom.position.y=0;knob.rotation.z=0;eggs.forEach(e=>{e.position.copy(e.userData.rest);e.rotation.copy(e.userData.rot);});},setSound(){}};
}
