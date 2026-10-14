// Modified from Carousel Lamp by 咕噜蛋Daria. Non-commercial license retained.
// Original architecture, horses, frames and ornaments retained. Muted palette and personal photographs.
import { photoSets } from './photo-data.js';
import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { createCarouselMotion } from './carousel-motion.js';
import { createHorse, addGarden, addPole } from './carousel-ornaments.js';
export function createHeroCarousel(el, onToggle, onError = () => { }) {
    const savedView = null;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.88;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.setAttribute('aria-label', '拖动旋转三维相框木马，点击点亮');
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 70);
    const home = new THREE.Vector3(5.95, 5.55, 10.8), homeTarget = new THREE.Vector3(0, 3.0, 0);
    camera.position.copy(home);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(homeTarget);
    if (savedView) {
        camera.position.fromArray(savedView.position);
        controls.target.fromArray(savedView.target);
        controls.update();
    }
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minDistance = 8;
    controls.maxDistance = 19;
    controls.minPolarAngle = Math.PI * .22;
    controls.maxPolarAngle = Math.PI * 0.445;
    const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment(), env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    room.dispose();
    const hemi = new THREE.HemisphereLight('#eef3ff', '#939dad', 1.1);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight('#eee3ff', 1.5);
    sun.position.set(-6, 7.5, 4);
    sun.target.position.set(0, 3, 0);
    scene.add(sun.target);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 8, bottom: -5 });
    sun.shadow.bias = -0.0003;
    sun.shadow.normalBias = .012;
    sun.shadow.radius = 2;
    scene.add(sun);
    const blue = new THREE.DirectionalLight('#a7c3ef', 0.55);
    blue.position.set(4, 3, -4);
    scene.add(blue);
    // Low side-window light reaches the horses below the overhanging canopy.
    const daylight = new THREE.SpotLight('#ffdfad', 0, 24, .55, .8, 2);
    daylight.position.set(-5.5, 5.8, 5.5);
    daylight.target.position.set(0, 2.1, 0);
    daylight.castShadow = true;
    daylight.shadow.mapSize.set(1024, 1024);
    daylight.shadow.bias = -.0002;
    daylight.shadow.normalBias = .015;
    scene.add(daylight, daylight.target);
    const daylightRim = new THREE.DirectionalLight('#fff1d6', 0);
    daylightRim.position.set(-4, 5, -5);
    daylightRim.target.position.set(0, 3, 0);
    scene.add(daylightRim, daylightRim.target);
    const bulbs = [], spots = [];
    for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3 + 0.4, x = Math.sin(angle) * 0.75, z = Math.cos(angle) * 0.75;
        const light = new THREE.PointLight('#f4d7ae', 0, 8, 2);
        light.position.set(x, 5.26, z);
        scene.add(light);
        bulbs.push(light);
        const beam = new THREE.SpotLight('#efd0b1', 0, 7, 0.56, 0.92, 1.5);
        beam.position.set(x, 5.22, z);
        beam.target.position.set(x * 1.35, 0.75, z * 1.35);
        beam.castShadow = i === 0;
        beam.shadow.mapSize.set(1024, 1024);
        beam.shadow.bias = -0.001;
        scene.add(beam, beam.target);
        spots.push(beam);
    }
    const root = new THREE.Group();
    scene.add(root);
    const textures = new Set();
    const material = (color, roughness = 0.65) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.03 });
    const cream = material('#eee7f1'), red = material('#9980ab'), sky = material('#909bc7'), green = material('#a0aaa8'), yellow = material('#cfbd97');
    const gold = new THREE.MeshStandardMaterial({
        color: '#bca98d',
        roughness: 0.34,
        metalness: 0.68,
    });
    const trimColors = [red, sky, green, yellow];
    function mesh(geometry, mat, parent = root, x = 0, y = 0, z = 0) {
        const m = new THREE.Mesh(geometry, mat);
        m.position.set(x, y, z);
        m.castShadow = true;
        m.receiveShadow = true;
        parent.add(m);
        return m;
    }
    function ring(radius, y, tube = 0.025, mat = gold) {
        const m = mesh(new THREE.TorusGeometry(radius, tube, 8, 96), mat, root, 0, y);
        m.rotation.x = Math.PI / 2;
        return m;
    }
    const loader = new THREE.TextureLoader();
    let alive = true, raf = 0, active = -1, selecting = false, gust = 0, night = savedView?.night ? 1 : 0, nightTarget = savedView?.night ? 1 : 0, rotating = savedView?.spinning ?? false, transition = false;
    function texture(path) {
        const t = loader.load(path, () => { }, undefined, () => {
            if (alive)
                onError('有一处装饰暂时没加载出来，请刷新重试。');
        });
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        textures.add(t);
        return t;
    }
    const painted = texture(new URL('assets/carousel/carousel-panels.png', import.meta.url).href), columnPaint = texture(new URL('assets/carousel/carousel-column.png', import.meta.url).href), basePaint = texture(new URL('assets/carousel/carousel-base.png', import.meta.url).href);
    function panels(repeat, source = painted, offset = 0, height = 1) {
        const t = source.clone();
        t.wrapS = THREE.RepeatWrapping;
        t.repeat.set(repeat, height);
        t.offset.y = offset;
        textures.add(t);
        return new THREE.MeshStandardMaterial({
            map: t,
            color: '#ffffff',
            roughness: 0.63,
            metalness: 0.035,
        });
    }
    const stageMetal = new THREE.MeshStandardMaterial({
        color: '#b68a26',
        roughness: 0.34,
        metalness: 0.72,
    });
    // Solid, tiered architecture remains real geometry so the whole lamp can be orbited.
    mesh(new THREE.CylinderGeometry(1.42, 1.36, 0.16, 96), sky, root, 0, 0.12);
    mesh(new THREE.CylinderGeometry(1.43, 1.43, 0.38, 96), panels(2, basePaint, 0, 0.56), root, 0, 0.39);
    mesh(new THREE.CylinderGeometry(1.5, 1.46, 0.1, 96), panels(2, basePaint, 0.56, 0.44), root, 0, 0.63);
    mesh(new THREE.CylinderGeometry(1.4, 1.46, 0.07, 96), stageMetal, root, 0, 0.71);
    ring(1.43, 0.2, 0.025);
    ring(1.44, 0.58, 0.025);
    ring(1.47, 0.7, 0.022);
    for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        const foot = mesh(new THREE.SphereGeometry(0.13, 16, 12), sky, root, Math.sin(a) * 1.08, 0.045, Math.cos(a) * 1.08);
        foot.scale.set(1, 0.48, 1);
    }
    const sections = [
        { y: 1.17, h: 0.86, r1: 0.34, r2: 0.48 },
        { y: 2.1, h: 1, r1: 0.28, r2: 0.34 },
        { y: 3.14, h: 1, r1: 0.32, r2: 0.28 },
        { y: 4.15, h: 1, r1: 0.44, r2: 0.32 },
    ];
    sections.forEach((s, i) => {
        // Reserve the red pointed-arch band for the capital above these sections.
        const sectionPaint = panels(1, columnPaint, [0, 0.23, 0.48, 0.23][i], [0.23, 0.25, 0.255, 0.25][i]);
        if (i === 3)
            sectionPaint.color.set('#a9cfff');
        mesh(new THREE.CylinderGeometry(s.r1, s.r2, s.h, 48), sectionPaint, root, 0, s.y);
        ring(s.r2 + 0.02, s.y - s.h / 2, 0.035, trimColors[i]);
        ring(s.r1 + 0.025, s.y + s.h / 2, 0.027, gold);
    });
    // The capital continues into the roof. Light comes from a concealed ring, not a loose white orb.
    mesh(new THREE.CylinderGeometry(0.53, 0.44, 0.52, 64), panels(1, columnPaint, 0.735, 0.265), root, 0, 4.91);
    ring(0.53, 5.17, 0.033, gold);
    mesh(new THREE.CylinderGeometry(0.24, 0.38, 0.92, 48), cream, root, 0, 5.61);
    mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 48), gold, root, 0, 6.1);
    const concealedLight = new THREE.MeshStandardMaterial({
        color: '#e0bd75',
        emissive: '#ffae4b',
        emissiveIntensity: 0,
        roughness: 0.45,
    });
    const lightRing = ring(0.75, 5.28, 0.042, concealedLight);
    lightRing.castShadow = false;
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6, from = new THREE.Vector3(0, 5.98, 0), to = new THREE.Vector3(Math.sin(angle) * 1.83, 5.4, Math.cos(angle) * 1.83), delta = to.clone().sub(from);
        const rib = mesh(new THREE.CylinderGeometry(0.012, 0.012, delta.length(), 8), gold);
        rib.position.copy(from).add(to).multiplyScalar(0.5);
        rib.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    }
    // A shallow striped canopy and scalloped fascia, with warm luminous lining.
    const roofProfile = [
        new THREE.Vector2(0.08, 6.22),
        new THREE.Vector2(0.22, 6.1),
        new THREE.Vector2(0.55, 5.93),
        new THREE.Vector2(1.04, 5.68),
        new THREE.Vector2(1.58, 5.46),
        new THREE.Vector2(2.13, 5.33),
    ];
    const roofMaterials = [
        material('#678fae'),
        material('#eee0bd'),
        material('#829ab1'),
        material('#eddfbd'),
    ];
    for (let i = 0; i < 16; i++) {
        const m = mesh(new THREE.LatheGeometry(roofProfile, 10, (i * Math.PI) / 8, Math.PI / 8 + 0.001), roofMaterials[i % 4]);
        m.material.side = THREE.DoubleSide;
    }
    const shadeMat = new THREE.MeshStandardMaterial({
        color: '#fff0ca',
        emissive: '#ffc276',
        emissiveIntensity: 0.15,
        roughness: 0.85,
        side: THREE.DoubleSide,
    });
    const lining = mesh(new THREE.LatheGeometry(roofProfile.map((p) => new THREE.Vector2(p.x * 0.985, p.y - 0.028)), 96), shadeMat, root);
    lining.castShadow = false;
    const fascia = new THREE.CylinderGeometry(2.15, 2.15, 0.62, 224, 1, true);
    const positions = fascia.attributes.position;
    for (let i = 0; i <= 224; i++) {
        const fraction = ((i / 224) * 14) % 1;
        positions.setY(i, 0.31 + Math.sin(fraction * Math.PI) * 0.15);
    }
    positions.needsUpdate = true;
    fascia.computeVertexNormals();
    // Crop to the flower arches, excluding the unrelated horizontal borders.
    const fasciaMaterial = panels(2, painted, .14, .68);
    fasciaMaterial.side = THREE.DoubleSide;
    mesh(fascia, fasciaMaterial, root, 0, 5.3);
    ring(2.15, 4.99, 0.035, red);
    for (let i = 0; i < 14; i++) {
        const a = (i * Math.PI * 2) / 14;
        mesh(new THREE.SphereGeometry(0.045, 12, 8), trimColors[i % 4], root, Math.sin(a) * 2.15, 5.49, Math.cos(a) * 2.15);
    }
    mesh(new THREE.SphereGeometry(0.13, 20, 16), red, root, 0, 6.33);
    ring(0.18, 6.18, 0.03, gold);
    // Intentionally no floor plane, contact-shadow decal, or ground glow.
    function glowTexture() {
        const cv = document.createElement('canvas');
        cv.width = cv.height = 128;
        const c = cv.getContext('2d');
        const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, 'rgba(255,213,149,.7)');
        g.addColorStop(0.4, 'rgba(255,186,110,.2)');
        g.addColorStop(1, 'rgba(255,178,105,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, 128, 128);
        const t = new THREE.CanvasTexture(cv);
        textures.add(t);
        return t;
    }
    const glowMap = glowTexture();
    const haloMat = new THREE.SpriteMaterial({
        map: glowMap,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Sprite(haloMat);
    halo.position.set(0, 5.26, 0);
    halo.scale.set(2.5, 1.3, 1);
    root.add(halo);
    // Local halation along the lit rim keeps the rest of the object crisp.
    const rimGlowMaterial = new THREE.SpriteMaterial({
        map: glowMap, transparent: true, opacity: 0, depthWrite: false,
        blending: THREE.AdditiveBlending, toneMapped: false,
    });
    for (let i = 0; i < 16; i++) {
        const angle = i * Math.PI * 2 / 16;
        const glint = new THREE.Sprite(rimGlowMaterial);
        glint.position.set(Math.sin(angle) * 2.1, 5.1, Math.cos(angle) * 2.1);
        glint.scale.set(0.65, 0.3, 1);
        root.add(glint);
    }
    // Soft shafts are real transparent volumes in the scene, with view-dependent edges.
    const volumeMaterial = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
            strength: { value: 0 },
            tint: { value: new THREE.Color('#ffd098') },
        },
        vertexShader: `varying vec2 beamUV;varying vec3 viewNormal;varying vec3 viewPosition;
      void main(){beamUV=uv;viewNormal=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.0);viewPosition=-p.xyz;gl_Position=projectionMatrix*p;}`,
        fragmentShader: `uniform float strength;uniform vec3 tint;varying vec2 beamUV;varying vec3 viewNormal;varying vec3 viewPosition;
      void main(){float facing=pow(abs(dot(normalize(viewNormal),normalize(viewPosition))),1.4);
      float ends=smoothstep(0.0,0.26,beamUV.y)*(1.0-smoothstep(0.85,1.0,beamUV.y));
      float taper=mix(0.12,0.75,beamUV.y);gl_FragColor=vec4(tint,strength*ends*taper*facing);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
    });
    for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3 + 0.4;
        const volume = mesh(new THREE.CylinderGeometry(0.18, 0.88, 3.7, 48, 1, true), volumeMaterial, root, Math.sin(angle) * 0.86, 3.3, Math.cos(angle) * 0.86);
        volume.castShadow = false;
        volume.receiveShadow = false;
        volume.renderOrder = 2;
    }
    const horses = [];
    const rotatingStage = new THREE.Group();
    rotatingStage.name = 'rotating-carousel-assembly';
    root.add(rotatingStage);
    const motion = createCarouselMotion();
    motion.restore(savedView?.angle ?? 0);
    motion.play(rotating);
    ring(0.96, 5.7, 0.014, gold);
    ring(0.96, 0.765, 0.012, gold);
    for (let i = 0; i < 3; i++) {
        const angle = 0.3 + (i * Math.PI * 2) / 3, x = Math.sin(angle) * 0.96, z = Math.cos(angle) * 0.96;
        const horse = createHorse(i);
        horse.position.set(x, 1.4, z);
        horse.rotation.y = angle;
        horse.scale.setScalar(1.05);
        rotatingStage.add(horse);
        horses.push(horse);
        addPole(rotatingStage, x, z, 5.7);
    }
    addGarden(root);
    const pivots = [], faces = [], hits = [], revisions = Array(16).fill(0);
    const neutral = material('#fff9e8');
    const faceFrames = [];
    function labelFrame(c, index) {
        c.fillStyle = '#fff9ed';
        c.fillRect(0, 560, 512, 80);
        c.fillStyle = '#856d5a';
        c.font = '22px sans-serif';
        c.textAlign = 'center';
        c.fillText(String(index + 1).padStart(2, '0') + '   /   dear memory', 256, 601);
    }
    function frameTexture(index, image) {
        const cv = document.createElement('canvas');
        cv.width = 512;
        cv.height = 640;
        const c = cv.getContext('2d');
        c.fillStyle = '#fff9ed';
        c.fillRect(0, 0, 512, 640);
        if (image) {
            const s = Math.min(440 / image.width, 520 / image.height);
            c.save();
            c.beginPath();
            c.rect(36, 30, 440, 520);
            c.clip();
            c.drawImage(image, 36 + (440 - image.width * s) / 2, 30 + (520 - image.height * s) / 2, image.width * s, image.height * s);
            c.restore();
        }
        else {
            c.fillStyle = '#e7dfd2';
            c.fillRect(36, 30, 440, 520);
        }
        labelFrame(c, index);
        const t = new THREE.CanvasTexture(cv);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        textures.add(t);
        return t;
    }
    function line(parent, length) {
        mesh(new THREE.CylinderGeometry(0.008, 0.008, length, 6), gold, parent, 0, -length / 2);
    }
    function gem(parent, y, index, size = 0.046) {
        const m = new THREE.MeshPhysicalMaterial({
            color: ['#b5cbdf', '#e6b5ae', '#e5d3a3', '#b7caab'][index % 4],
            roughness: 0.16,
            metalness: 0.1,
            transmission: 0.25,
            transparent: true,
            opacity: 0.9,
        });
        mesh(new THREE.IcosahedronGeometry(size, 1), m, parent, 0, y);
    }
    const charmShape = new THREE.Shape();
    for (let point = 0; point < 10; point++) {
        const angle = (point * Math.PI) / 5 + Math.PI / 2, radius = point % 2 ? 0.045 : 0.1;
        const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
        if (point === 0)
            charmShape.moveTo(x, y);
        else
            charmShape.lineTo(x, y);
    }
    charmShape.closePath();
    const charmGeometry = new THREE.ExtrudeGeometry(charmShape, {
        depth: 0.018,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.006,
        bevelThickness: 0.006,
    });
    const charmMaterial = new THREE.MeshPhysicalMaterial({
        color: '#e8d7b4',
        roughness: 0.2,
        metalness: 0.25,
        iridescence: 1,
        clearcoat: 1,
        transparent: true,
        opacity: 0.88,
    });
    for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI * 2) / 12 + 0.15, p = new THREE.Group();
        p.position.set(Math.sin(a) * 2.04, 5.12, Math.cos(a) * 2.04);
        p.rotation.y = a;
        p.userData.phase = i * 1.37;
        p.userData.sway = { x: 0, z: 0, vx: 0, vz: 0 };
        rotatingStage.add(p);
        pivots.push(p);
        const len = 0.8 + (i % 4) * 0.31, double = [1, 4, 7, 10].includes(i), total = len + 0.87 + (double ? 1.1 : 0);
        line(p, total);
        gem(p, -0.24, i);
        gem(p, -0.52, i + 1, 0.032);
        for (let j = 0; j < (double ? 2 : 1); j++) {
            const index = faces.length, group = new THREE.Group();
            group.position.y = -len - 0.42 - j * 1.1;
            group.rotation.z = Math.sin(i * 4.1 + j) * 0.07;
            p.add(group);
            const frame = mesh(new THREE.BoxGeometry(0.63, 0.8, 0.027), neutral.clone(), group);
            frame.userData.photo = index;
            hits.push(frame);
            faceFrames.push(frame);
            const face = mesh(new THREE.PlaneGeometry(0.62, 0.79), new THREE.MeshStandardMaterial({
                map: frameTexture(index),
                roughness: 0.83,
                side: THREE.DoubleSide,
            }), group, 0, 0, 0.017);
            face.userData.photo = index;
            faces.push(face);
            hits.push(face);
            const back = mesh(new THREE.PlaneGeometry(0.62, 0.79), face.material, group, 0, 0, -0.017);
            back.rotation.y = Math.PI;
            back.userData.photo = index;
            hits.push(back);
            mesh(new THREE.BoxGeometry(0.048, 0.14, 0.07), trimColors[index % 4], group, 0, 0.42, 0.04);
        }
        if (i % 3 === 1)
            mesh(charmGeometry, charmMaterial, p, 0, -total - 0.12);
        gem(p, -total, i + 2, 0.075);
        gem(p, -total + 0.18, i + 1, 0.035);
        if (i % 3 === 0) {
            const bell = mesh(new THREE.ConeGeometry(0.07, 0.1, 16, 1, true), gold, p, 0, -total - 0.14);
            bell.rotation.z = Math.PI;
        }
    }
    const selected = [...photoSets.landscape, ...photoSets.portrait];
    for (let i = selected.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [selected[i], selected[j]] = [selected[j], selected[i]];
    }
    faces.forEach((face, i) => { const image = new Image(); image.onload = () => { if (!alive)
        return; const old = face.material.map; face.material.map = frameTexture(i, image); face.material.needsUpdate = true; if (old) {
        old.dispose();
        textures.delete(old);
    } }; image.src = new URL('assets/' + selected[i % selected.length].src, import.meta.url).href; });
    let lit = false, visible = true, prev = performance.now(), down = null, dragging = false;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Pointer follow is applied to the whole model, independently of its spinning stage.
    const hero = el.closest('.hero'), follow = { x: 0, y: 0 };
    function followPointer(e) { if (reduced || e.pointerType === 'touch')
        return; const r = hero.getBoundingClientRect(); follow.x = (e.clientX - r.left) / r.width - .5; follow.y = (e.clientY - r.top) / r.height - .5; }
    function settlePointer() { follow.x = 0; follow.y = 0; }
    hero.addEventListener('pointermove', followPointer);
    hero.addEventListener('pointerleave', settlePointer);
    function setLit(on) { lit = on; nightTarget = on ? 1 : 0; rotating = on; motion.play(on); }
    renderer.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; dragging = false; });
    renderer.domElement.addEventListener('pointermove', e => { if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 7)
        dragging = true; });
    renderer.domElement.addEventListener('pointerup', () => { if (down && !dragging)
        onToggle(); down = null; });
    renderer.domElement.addEventListener('pointercancel', () => down = null);
    function resize() { const r = el.getBoundingClientRect(); if (!r.width || !r.height)
        return; renderer.setSize(r.width, r.height); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    const io = new IntersectionObserver(e => visible = e[0].isIntersecting);
    io.observe(el);
    function frame(now) {
        if (!alive)
            return;
        raf = requestAnimationFrame(frame);
        const dt = Math.min((now - prev) / 1000, .05);
        prev = now;
        if (!visible || document.hidden)
            return;
        const ease = 1 - Math.exp(-dt * 4.5);
        root.rotation.x = THREE.MathUtils.lerp(root.rotation.x, down ? 0 : follow.y * .055, ease);
        root.rotation.z = THREE.MathUtils.lerp(root.rotation.z, down ? 0 : -follow.x * .06, ease);
        root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, down ? 0 : follow.x * .085, ease);
        controls.update();
        const state = motion.update(dt, down !== null, reduced);
        rotatingStage.rotation.y = state.angle;
        horses.forEach((h, i) => h.position.y = state.heights[i]);
        pivots.forEach((b, i) => { b.rotation.z = lit && !reduced ? Math.sin(now * .0012 + i * 1.37) * .025 : 0; });
        night = THREE.MathUtils.lerp(night, nightTarget, 1 - Math.exp(-dt * 2.1));
        bulbs.forEach(l => l.intensity = night * 4.8);
        spots.forEach(l => l.intensity = night * 22);
        concealedLight.emissiveIntensity = night * 2.2;
        shadeMat.emissiveIntensity = .15 + night * .53;
        hemi.intensity = .85 - night * .28;
        sun.intensity = 1.5 - night * .85;
        blue.intensity = .55 - night * .15;
        haloMat.opacity = night * .36;
        rimGlowMaterial.opacity = night * .72;
        volumeMaterial.uniforms.strength.value = night * .16;
        scene.environmentIntensity = .35;
        renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(frame);
    return { setLit, reset() { settlePointer(); camera.position.copy(home); controls.target.copy(homeTarget); controls.update(); }, dispose() { hero.removeEventListener('pointermove', followPointer); hero.removeEventListener('pointerleave', settlePointer); alive = false; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); controls.dispose(); textures.forEach(t => t.dispose()); renderer.dispose(); } };
}
