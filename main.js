// Catch errors to display them visibly in case of catastrophic JS crash
window.addEventListener('error', function(event) {
    let errBanner = document.createElement('div');
    errBanner.style = "position:absolute;top:0;left:0;right:0;background:red;color:white;z-index:99999;padding:20px;font-size:20px;font-family:sans-serif;box-shadow:0 10px 30px rgba(0,0,0,0.5);";
    errBanner.innerHTML = "<strong>CRITICAL RENDER ERROR:</strong><br/>" + event.message + "<br/><small>" + event.filename + " Line: " + event.lineno + "</small>";
    document.body.appendChild(errBanner);
});

// High-Fidelity Scene Setup
const scene = new THREE.Scene();
scene.background = null; 

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(4, 2.5, 5.5); 

// Core Renderer Settings
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "default" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Switched to safer PCF shadow to prevent WebGL driver crashes
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35; 
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.05;
controls.target.set(0, 0.7, 0); 
controls.minDistance = 1.0; controls.maxDistance = 12;
controls.maxPolarAngle = Math.PI / 2 + 0.1;

// ==========================================
// FAIL-SAFE HDRI STUDIO ENVIRONMENT
// ==========================================
try {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0xe0e5ec);
    const envBox = new THREE.Mesh(new THREE.BoxGeometry(40, 10, 40), new THREE.MeshBasicMaterial({color: 0x050505}));
    envBox.position.set(0, 15, -15); envScene.add(envBox); 
    const envBox2 = new THREE.Mesh(new THREE.BoxGeometry(40, 40, 10), new THREE.MeshBasicMaterial({color: 0x010101}));
    envBox2.position.set(-20, 0, 0); envScene.add(envBox2);
    scene.environment = pmremGenerator.fromScene(envScene).texture;
} catch(e) {
    console.warn("HDRI Generation Not Supported:", e);
}

// Studio Lighting
const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
dirLight.position.set(6, 12, 4);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024; dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.bias = -0.001;
scene.add(dirLight);

const fillLight = new THREE.PointLight(0xaad4ff, 2.5, 15);
fillLight.position.set(-5, 3, 6);
scene.add(fillLight);


// =========================================================================
// BULLETPROOF TOPOLOGY GEOMETRY
// =========================================================================

const cartGroup = new THREE.Group();

const chromeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.15 });
const blackPlasticMat = new THREE.MeshStandardMaterial({ color: 0x0f0f10, metalness: 0.15, roughness: 0.55 });
const rubberMat = new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.05, roughness: 0.9 });
const screenGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x000000, metalness: 0.95, roughness: 0.0, clearcoat: 1.0 });
const redAccentMat = new THREE.MeshStandardMaterial({ color: 0xc62828, metalness: 0.3, roughness: 0.45 });

// 100% safe piping system utilizing fallback LineCurve3 and exception handling
function createIndustrialPipe(pointsArr, radius) {
    if(!pointsArr || pointsArr.length < 2) return new THREE.Group();
    
    try {
        // Fast-path LineCurve3 to absolutely prevent CatmullRom NaN failures on perfectly straight segments
        if(pointsArr.length === 2) {
            const path = new THREE.LineCurve3(pointsArr[0], pointsArr[1]);
            const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, 8, radius, 8, false), chromeMat);
            mesh.castShadow = true; mesh.receiveShadow = true;
            return mesh;
        }

        let curvePts = [pointsArr[0]];
        for(let i=1; i<pointsArr.length-1; i++) {
            let dP = pointsArr[i-1].distanceTo(pointsArr[i]);
            let dN = pointsArr[i+1].distanceTo(pointsArr[i]);
            let safeBendR = Math.min(0.08, dP * 0.45, dN * 0.45); 
            
            if(safeBendR < 0.001) { curvePts.push(pointsArr[i]); continue; }
            
            let vP = pointsArr[i-1].clone().sub(pointsArr[i]).normalize();
            let vN = pointsArr[i+1].clone().sub(pointsArr[i]).normalize();
            
            curvePts.push(pointsArr[i].clone().add(vP.multiplyScalar(safeBendR)));
            curvePts.push(pointsArr[i]); 
            curvePts.push(pointsArr[i].clone().add(vN.multiplyScalar(safeBendR)));
        }
        curvePts.push(pointsArr[pointsArr.length-1]);
        
        const path = new THREE.CatmullRomCurve3(curvePts, false, 'centripetal', 0.5);
        const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, 64, radius, 12, false), chromeMat);
        mesh.castShadow = true; mesh.receiveShadow = true;
        return mesh;
    } catch(e) {
        console.warn("Bypassed broken pipe geometry:", e);
        return new THREE.Group();
    }
}

function createPolishedBox(w, d, h, r, smoothness=4) {
    r = Math.max(0.001, Math.min(r, (w/2) - 0.001, (d/2) - 0.001));
    const shape = new THREE.Shape();
    const x = -w/2, y = -d/2; 
    shape.moveTo(x, y+r); 
    shape.lineTo(x, y+d-r); shape.quadraticCurveTo(x, y+d, x+r, y+d);
    shape.lineTo(x+w-r, y+d); shape.quadraticCurveTo(x+w, y+d, x+w, y+d-r);
    shape.lineTo(x+w, y+r); shape.quadraticCurveTo(x+w, y, x+w-r, y);
    shape.lineTo(x+r, y); shape.quadraticCurveTo(x, y, x, y+r);
    
    const geom = new THREE.ExtrudeGeometry(shape, {
        depth: h, bevelEnabled: true, bevelSegments: smoothness,
        steps: 1, bevelSize: r*0.3, bevelThickness: r*0.4,
    });
    geom.center(); geom.rotateX(Math.PI / 2); 
    return geom;
}

// --------- Structural Generation ---------
const tR = 0.016; 
const wB = 0.44, wT = 0.58; 
const zFW = -0.38, zRW = 0.35, zBck = 0.35; 
const hBase = 0.12, hMid = 0.55, hTop = 1.08;

cartGroup.add(createIndustrialPipe([
    new THREE.Vector3(wB/2, hBase, zRW), new THREE.Vector3(wB/2, hBase, zFW), 
    new THREE.Vector3(wB/2 - 0.05, hBase, zFW - 0.05), new THREE.Vector3(-wB/2 + 0.05, hBase, zFW - 0.05),
    new THREE.Vector3(-wB/2, hBase, zFW), new THREE.Vector3(-wB/2, hBase, zRW)
], tR));

cartGroup.add(createIndustrialPipe([new THREE.Vector3(wB/2, hBase, zRW - 0.05), new THREE.Vector3(wB/2, hMid, zBck), new THREE.Vector3(wB/2, hTop, zBck + 0.15)], tR));
cartGroup.add(createIndustrialPipe([new THREE.Vector3(-wB/2, hBase, zRW - 0.05), new THREE.Vector3(-wB/2, hMid, zBck), new THREE.Vector3(-wB/2, hTop, zBck + 0.15)], tR));

cartGroup.add(createIndustrialPipe([new THREE.Vector3(wB/2, hBase, zFW + 0.05), new THREE.Vector3(wB/2 - 0.02, hMid - 0.05, zBck - 0.05)], tR));
cartGroup.add(createIndustrialPipe([new THREE.Vector3(-wB/2, hBase, zFW + 0.05), new THREE.Vector3(-wB/2 + 0.02, hMid - 0.05, zBck - 0.05)], tR));

cartGroup.add(createIndustrialPipe([new THREE.Vector3(wB/2, hTop, zBck + 0.15), new THREE.Vector3(-wB/2, hTop, zBck + 0.15)], tR));

const grip = new THREE.Mesh(new THREE.CylinderGeometry(tR * 1.5, tR * 1.5, 0.45, 16), rubberMat);
grip.rotation.z = Math.PI/2; grip.position.set(0, hTop, zBck + 0.15);
cartGroup.add(grip);

const trayW = wB * 0.94, trayD = Math.abs(zFW - zRW) + 0.05;
const trayMesh = new THREE.Mesh(createPolishedBox(trayW, trayD, 0.05, 0.04), blackPlasticMat);
trayMesh.position.set(0, hBase + 0.03, (zFW + zRW)/2);
cartGroup.add(trayMesh);

const matMesh = new THREE.Mesh(createPolishedBox(trayW * 0.85, trayD * 0.85, 0.01, 0.03), rubberMat);
matMesh.position.set(0, hBase + 0.056, (zFW + zRW)/2);
cartGroup.add(matMesh);

function buildProCaster(x, z, front) {
    const grp = new THREE.Group();
    grp.position.set(x, 0.06, z); 
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.012, 16, 32), rubberMat); tire.rotation.y = Math.PI/2; tire.position.z = 0.02; grp.add(tire);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.02, 16), chromeMat); hub.rotation.z = Math.PI/2; hub.position.z = 0.02; grp.add(hub);
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.05, 8), chromeMat); axle.rotation.z = Math.PI/2; axle.position.z = 0.02; grp.add(axle);
    const fork = new THREE.Mesh(createPolishedBox(0.045, 0.06, 0.07, 0.015), blackPlasticMat); fork.position.set(0, 0.04, 0.01); grp.add(fork);
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.045, 8), chromeMat); bolt.position.set(0, 0.08, 0); grp.add(bolt);
    const lock = new THREE.Mesh(createPolishedBox(0.035, 0.04, 0.015, 0.005), redAccentMat); lock.position.set(0, 0.075, 0.04); lock.rotation.x = Math.PI / 6; grp.add(lock);
    if (front) { grp.rotation.y = Math.PI / 4; } else { grp.rotation.y = -Math.PI / 16; }
    return grp;
}
cartGroup.add(buildProCaster(wB/2, zFW, true));     
cartGroup.add(buildProCaster(-wB/2, zFW, true));    
cartGroup.add(buildProCaster(wB/2, zRW, false));    
cartGroup.add(buildProCaster(-wB/2, zRW, false));  

const basketGroup = new THREE.Group();
const wR = 0.0025; 
const bYBot = 0.52, bYTop = 0.96;
const bZFB = -0.36, bZFT = -0.58; 
const bZRB = 0.28, bZRT = 0.38;   
const bWBB = wB * 0.9, bWBT = wT * 0.94; 

basketGroup.add(createIndustrialPipe([new THREE.Vector3(bWBB/2, bYBot, bZFB), new THREE.Vector3(bWBB/2, bYBot, bZRB), new THREE.Vector3(-bWBB/2, bYBot, bZRB), new THREE.Vector3(-bWBB/2, bYBot, bZFB), new THREE.Vector3(bWBB/2, bYBot, bZFB)], 0.008));
basketGroup.add(createIndustrialPipe([new THREE.Vector3(bWBT/2, bYTop, bZFT), new THREE.Vector3(bWBT/2, bYTop, bZRT), new THREE.Vector3(-bWBT/2, bYTop, bZRT), new THREE.Vector3(-bWBT/2, bYTop, bZFT), new THREE.Vector3(bWBT/2, bYTop, bZFT)], 0.012));

for(let i=1; i<6; i++) {
    const t = i / 6;
    const y = THREE.MathUtils.lerp(bYBot, bYTop, t); const w = THREE.MathUtils.lerp(bWBB, bWBT, t);
    const zF = THREE.MathUtils.lerp(bZFB, bZFT, t); const zR = THREE.MathUtils.lerp(bZRB, bZRT, t);
    basketGroup.add(createIndustrialPipe([new THREE.Vector3(w/2, y, zF), new THREE.Vector3(w/2, y, zR), new THREE.Vector3(-w/2, y, zR), new THREE.Vector3(-w/2, y, zF), new THREE.Vector3(w/2, y, zF)], wR));
}

for(let i=1; i<15; i++) {
    const t = i / 15;
    const zBase = THREE.MathUtils.lerp(bZFB, bZRB, t); const zTop = THREE.MathUtils.lerp(bZFT, bZRT, t);
    basketGroup.add(createIndustrialPipe([new THREE.Vector3(bWBB/2, bYBot, zBase), new THREE.Vector3(bWBT/2, bYTop, zTop)], wR));
    basketGroup.add(createIndustrialPipe([new THREE.Vector3(-bWBB/2, bYBot, zBase), new THREE.Vector3(-bWBT/2, bYTop, zTop)], wR));
}

for(let i=1; i<17; i++) {
    const t = i / 17;
    const xBase = THREE.MathUtils.lerp(-bWBB/2, bWBB/2, t); const xTop = THREE.MathUtils.lerp(-bWBT/2, bWBT/2, t);
    basketGroup.add(createIndustrialPipe([new THREE.Vector3(xBase, bYBot, bZFB), new THREE.Vector3(xTop, bYTop, bZFT)], wR));
    if (i < 4 || i > 13) { basketGroup.add(createIndustrialPipe([new THREE.Vector3(xBase, bYBot, bZRB), new THREE.Vector3(xTop, bYTop, bZRT)], wR)); }
}
cartGroup.add(basketGroup);


// --------- Professional Dash ---------
function safeFillRect(ctx, x, y, width, height, radius, color) {
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(x + radius, y); ctx.lineTo(x + width - radius, y); ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius); ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height); ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius); ctx.quadraticCurveTo(x, y, x + radius, y); ctx.fill();
}

const dashGroup = new THREE.Group();
dashGroup.position.set(0, 1.05, 0.45); dashGroup.rotation.x = -Math.PI / 4.5; 

const dashW = 0.54, dashH = 0.35, dashD = 0.04;
const tabletHousing = new THREE.Mesh(createPolishedBox(dashW, dashH, dashD, 0.015, 8), blackPlasticMat);
dashGroup.add(tabletHousing);

const glassMesh = new THREE.Mesh(createPolishedBox(dashW - 0.035, dashH - 0.035, 0.006, 0.008, 4), screenGlassMat);
glassMesh.position.y = dashD / 2; dashGroup.add(glassMesh);

const uiCanvas = document.createElement('canvas'); uiCanvas.width = 1024; uiCanvas.height = 640;
const ctx = uiCanvas.getContext('2d');
ctx.fillStyle = '#101114'; ctx.fillRect(0,0,1024,640);
ctx.fillStyle = '#171a21'; ctx.fillRect(0,0,1024,80);
ctx.fillStyle = '#FFF'; ctx.font = 'bold 32px sans-serif'; ctx.fillText('SmartCart Enterprise', 30, 50);

safeFillRect(ctx, 30, 110, 320, 200, 20, '#1e2129');
ctx.fillStyle = '#838e9c'; ctx.font = '24px sans-serif'; ctx.fillText('Total Payment', 60, 160);
ctx.shadowColor = '#10b981'; ctx.shadowBlur = 12; ctx.fillStyle = '#fff'; ctx.font = 'bold 68px sans-serif'; ctx.fillText('$ 89.40', 60, 240); ctx.shadowBlur = 0;

safeFillRect(ctx, 30, 340, 320, 80, 20, '#10b981');
ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign='center'; ctx.fillText('Complete Checkout', 190, 390); ctx.textAlign='left';

safeFillRect(ctx, 380, 110, 610, 500, 20, '#1e2129');
ctx.fillStyle = '#fff'; ctx.font = '30px sans-serif'; ctx.fillText('Scanned Items', 420, 160);
const items = [{n: 'Organic Apple', p: '$1.49', c: '#ef4444'}, {n: 'Oat Milk Carton', p: '$4.99', c: '#eab308'}, {n: 'Fresh Salmon', p: '$12.00', c: '#3b82f6'}, {n: 'Greek Yogurt', p: '$3.50', c: '#d1d5db'}];
items.forEach((it, i) => {
    safeFillRect(ctx, 420, 200+(i*80), 45, 45, 8, it.c);
    ctx.fillStyle = '#d1d5db'; ctx.font = 'bold 24px sans-serif'; ctx.fillText(it.n, 490, 232+(i*80));
    ctx.fillStyle = '#9ca3af'; ctx.font = '24px sans-serif'; ctx.textAlign='right'; ctx.fillText(it.p, 960, 232+(i*80)); ctx.textAlign='left';
    ctx.fillStyle = '#2d333f'; ctx.fillRect(420, 265+(i*80), 540, 2);
});

const screenTex = new THREE.CanvasTexture(uiCanvas); screenTex.minFilter = THREE.LinearFilter;
const screenActual = new THREE.Mesh(new THREE.PlaneGeometry(dashW - 0.045, dashH - 0.045), new THREE.MeshBasicMaterial({ map: screenTex }));
screenActual.position.y = (dashD / 2) - 0.001; screenActual.rotation.x = -Math.PI/2; dashGroup.add(screenActual);

const scannerBox = new THREE.Mesh(createPolishedBox(0.12, 0.08, 0.1, 0.015), blackPlasticMat);
scannerBox.position.set(0.18, -0.06, 0.12); dashGroup.add(scannerBox);
const laserLens = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.04), new THREE.MeshBasicMaterial({color: 0xff0000}));
laserLens.position.set(0.18, -0.101, 0.16); laserLens.rotation.x = Math.PI/2; dashGroup.add(laserLens);

const eBox = new THREE.Mesh(createPolishedBox(0.36, 0.20, 0.12, 0.02, 4), blackPlasticMat);
eBox.position.set(0, -0.14, -0.06); dashGroup.add(eBox);
cartGroup.add(dashGroup);

cartGroup.position.y = 0; 
scene.add(cartGroup);


// ==========================================
// Animation Loop
// ==========================================

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
});

function transitionTo(targetPos) {
    const startPos = camera.position.clone();
    const startTime = performance.now();
    function update(t) {
        let p = Math.min((t - startTime) / 1400, 1);
        let ease = 1 - Math.pow(1 - p, 5); 
        camera.position.lerpVectors(startPos, targetPos, ease);
        controls.target.lerpVectors(controls.target, new THREE.Vector3(0, 0.6, 0), ease);
        camera.lookAt(controls.target); controls.update(); 
        if(p < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

document.getElementById('view-front').addEventListener('click', (e) => {
    document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active')); e.target.classList.add('active');
    transitionTo(new THREE.Vector3(0, 1.6, -6.5)); 
});
document.getElementById('view-side').addEventListener('click', (e) => {
    document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active')); e.target.classList.add('active');
    transitionTo(new THREE.Vector3(6.5, 1.8, 0)); 
});
document.getElementById('view-iso').addEventListener('click', (e) => {
    document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active')); e.target.classList.add('active');
    transitionTo(new THREE.Vector3(4, 2.8, 5.5)); 
});
