// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color('#eaecee'); // Clean, bright studio grey to show off metal
scene.fog = new THREE.FogExp2('#eaecee', 0.015);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(4, 2.5, 5); // Crisp 3/4 presentation angle

// High-End Renderer Settings
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap; // Very soft, high-quality shadows
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1; // Bright, clean look
// Enable Physically Correct Lighting simulation
renderer.useLegacyLights = false; 
renderer.physicallyCorrectLights = true;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0.8, -0.1); // Focus directly on the center of the basket
controls.minDistance = 1.5;
controls.maxDistance = 10;
controls.maxPolarAngle = Math.PI / 2 + 0.1;

// ==========================================
// LIGHTING: Premium Clean Studio Setup
// ==========================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft fill
scene.add(ambientLight);

// Key Light (Main shadow caster from top right)
const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
dirLight.position.set(4, 8, 3);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 4096; // Ultra-crisp shadows for the wire mesh
dirLight.shadow.mapSize.height = 4096;
dirLight.shadow.bias = -0.0005;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 20;
dirLight.shadow.camera.left = -2;
dirLight.shadow.camera.right = 2;
dirLight.shadow.camera.top = 2;
dirLight.shadow.camera.bottom = -2;
scene.add(dirLight);

// Rim Light (Sharp edge highlights from back left)
const rimLight = new THREE.SpotLight(0xffffff, 5.0, 0, Math.PI/4, 0.5, 1);
rimLight.position.set(-4, 4, -4);
rimLight.lookAt(0, 0.8, 0);
scene.add(rimLight);

// Cool Fill Light (Shadow detail lift from bottom left front)
const fillLight = new THREE.PointLight(0xaad4ff, 1.5, 10);
fillLight.position.set(-3, 1, 4);
scene.add(fillLight);

// Clean floor with soft reflection
const planeGeo = new THREE.PlaneGeometry(100, 100);
const planeMat = new THREE.MeshStandardMaterial({ 
    color: '#ffffff',
    roughness: 0.15,
    metalness: 0.05
});
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.rotation.x = -Math.PI / 2;
plane.position.y = 0;
plane.receiveShadow = true;
scene.add(plane);

const grid = new THREE.GridHelper(20, 40, 0x000000, 0x000000);
grid.material.opacity = 0.03;
grid.material.transparent = true;
scene.add(grid);

// =========================================================================
// PREMIUM PROCEDURAL GEOMETRY (Hyper-Realistic Attempt)
// =========================================================================

const cartGroup = new THREE.Group();

// --- High-End Materials ---
// Polished chrome/steel for the main tubes and basket wires
const chromeMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    metalness: 0.95, 
    roughness: 0.15, // Highly polished
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
});
// Dark, slightly textured plastic for the base tray and modules
const plasticMat = new THREE.MeshStandardMaterial({ 
    color: 0x111112, 
    metalness: 0.2, 
    roughness: 0.6,
    clearcoat: 0.1,
});
// Grippy rubber for handle and tires
const rubberMat = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a1c, 
    metalness: 0.1, 
    roughness: 0.85 
});
// Shiny glass for tablet and camera
const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x000000, metalness: 0.9, roughness: 0.1, envMapIntensity: 1.0,
    clearcoat: 1.0, clearcoatRoughness: 0.1
});
// Red brake/lock accent
const redAccentMat = new THREE.MeshStandardMaterial({
    color: 0xe60000, metalness: 0.3, roughness: 0.4
});

// Helper: Create Beautifully Beveled/Rounded Rectangular Volumes
function createRoundedBoxGeometry(width, height, depth, radius, smoothness = 4) {
    const shape = new THREE.Shape();
    const x = -width/2, y = -depth/2; // Drawing on XY plane, then extruding along Z (height)
    shape.moveTo( x, y + radius );
    shape.lineTo( x, y + depth - radius );
    shape.quadraticCurveTo( x, y + depth, x + radius, y + depth );
    shape.lineTo( x + width - radius, y + depth );
    shape.quadraticCurveTo( x + width, y + depth, x + width, y + depth - radius );
    shape.lineTo( x + width, y + radius );
    shape.quadraticCurveTo( x + width, y, x + width - radius, y );
    shape.lineTo( x + radius, y );
    shape.quadraticCurveTo( x, y, x, y + radius );
    
    const extrudeSettings = {
        depth: height,
        bevelEnabled: true,
        bevelSegments: smoothness,
        steps: 1,
        bevelSize: radius * 0.4,
        bevelThickness: radius * 0.4,
    };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center(); // Center the geometry geometry after extruding
    geom.rotateX(Math.PI / 2); // Lay it flat if needed, adjust per use-case later
    return geom;
}


// --------- 1. Main Tubular Chassis (Smooth Continuous Curves) ---------
const tubeRadius = 0.018;

// Left Frame Tube: Front Wheel -> Base -> Rear Lift -> Handle
const framePointsL = [
    new THREE.Vector3(0.32, 0.12, -0.4),  // Front mount
    new THREE.Vector3(0.32, 0.12, 0.4),   // Rear base corner
    new THREE.Vector3(0.32, 0.8, 0.55),   // Upwards and backwards slope
    new THREE.Vector3(0.32, 1.15, 0.7),   // Near handle height
    new THREE.Vector3(0.1, 1.15, 0.7)     // Curving softly towards center handle
];
const frameCurveL = new THREE.CatmullRomCurve3(framePointsL, false, 'chordal', 0.5);
const frameTubeL = new THREE.Mesh(new THREE.TubeGeometry(frameCurveL, 64, tubeRadius, 16, false), chromeMat);
frameTubeL.castShadow = true; frameTubeL.receiveShadow = true;
cartGroup.add(frameTubeL);

// Right Frame Tube (Symmetrical)
const framePointsR = framePointsL.map(p => new THREE.Vector3(-p.x, p.y, p.z));
const frameCurveR = new THREE.CatmullRomCurve3(framePointsR, false, 'chordal', 0.5);
const frameTubeR = new THREE.Mesh(new THREE.TubeGeometry(frameCurveR, 64, tubeRadius, 16, false), chromeMat);
frameTubeR.castShadow = true; frameTubeR.receiveShadow = true;
cartGroup.add(frameTubeR);

// Connect Handle in the middle
const handleBarGeo = new THREE.CylinderGeometry(tubeRadius, tubeRadius, 0.2, 16);
const handleBar = new THREE.Mesh(handleBarGeo, chromeMat);
handleBar.rotation.z = Math.PI / 2;
handleBar.position.set(0, 1.15, 0.7);
cartGroup.add(handleBar);

// Rubber Ergonomic Grip on Handle
const gripGeo = new THREE.CylinderGeometry(tubeRadius * 1.5, tubeRadius * 1.5, 0.4, 32);
const grip = new THREE.Mesh(gripGeo, rubberMat);
grip.rotation.z = Math.PI / 2;
grip.position.set(0, 1.15, 0.7);
grip.castShadow = true;
cartGroup.add(grip);

// Base Tray Support Crossbars
const crossbar1 = new THREE.Mesh(new THREE.CylinderGeometry(tubeRadius, tubeRadius, 0.64, 16), chromeMat);
crossbar1.rotation.z = Math.PI / 2; crossbar1.position.set(0, 0.12, -0.3); cartGroup.add(crossbar1);
const crossbar2 = new THREE.Mesh(new THREE.CylinderGeometry(tubeRadius, tubeRadius, 0.64, 16), chromeMat);
crossbar2.rotation.z = Math.PI / 2; crossbar2.position.set(0, 0.12, 0.3); cartGroup.add(crossbar2);


// --------- 2. Beveled Base Platform Tray ---------
// Creates a beautifully sleek, chamfered tray that sits on the bottom tubes
const trayWidth = 0.62;
const trayDepth = 0.85;
const trayThickness = 0.05;
const trayGeo = createRoundedBoxGeometry(trayWidth, trayThickness, trayDepth, 0.05);

const tray = new THREE.Mesh(trayGeo, plasticMat);
tray.position.set(0, 0.17, 0); // Sits just above crossbars
tray.castShadow = true; tray.receiveShadow = true;
cartGroup.add(tray);

// Inset anti-slip mat geometry (darker rubber)
const matGeo = createRoundedBoxGeometry(trayWidth * 0.9, 0.01, trayDepth * 0.9, 0.03);
const matMesh = new THREE.Mesh(matGeo, rubberMat);
matMesh.position.set(0, 0.17 + trayThickness/2 + 0.006, 0); // Just above tray floor
matMesh.receiveShadow = true;
cartGroup.add(matMesh);


// --------- 3. High-Fidelity Detailed Wheels/Casters ---------
function buildHyperCaster(x, z, isFront) {
    const casterGroup = new THREE.Group();
    casterGroup.position.set(x, 0.06, z); // Wheels touch y=0
    
    // Tire & Hub
    const wheelRadius = 0.06;
    const tire = new THREE.Mesh(new THREE.TorusGeometry(wheelRadius - 0.015, 0.015, 16, 32), rubberMat);
    tire.rotation.y = Math.PI / 2;
    tire.castShadow = true;
    
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius - 0.015, wheelRadius - 0.015, 0.02, 32), plasticMat);
    hub.rotation.z = Math.PI / 2;
    
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.04, 16), chromeMat);
    axle.rotation.z = Math.PI / 2;
    
    casterGroup.add(tire); casterGroup.add(hub); casterGroup.add(axle);

    // Fork Assembly (Extruded shape)
    const forkGeo = new THREE.BoxGeometry(0.045, 0.08, 0.05);
    const forkL = new THREE.Mesh(forkGeo, plasticMat);
    forkL.position.set(0, 0.05, 0);
    // Move slightly forward to create a caster trail (swivel offset)
    tire.position.set(0, 0, 0.02);
    hub.position.set(0, 0, 0.02);
    axle.position.set(0, 0, 0.02);
    
    casterGroup.add(forkL);
    
    // Vertical attachment bolt to frame
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.04, 16), chromeMat);
    bolt.position.set(0, 0.1, 0);
    casterGroup.add(bolt);

    // Red Lock Mechanism
    if(isFront || true) { // Reference image shows red locks on casters
        const lock = new THREE.Mesh(createRoundedBoxGeometry(0.03, 0.02, 0.04, 0.005), redAccentMat);
        lock.position.set(0, 0.08, 0.04);
        lock.rotation.x = Math.PI / 8;
        casterGroup.add(lock);
    }
    
    // Default angles for realism
    if(isFront) { casterGroup.rotation.y = Math.PI / 6; }
    
    return casterGroup;
}
cartGroup.add(buildHyperCaster(0.32, -0.4, true));  // FL
cartGroup.add(buildHyperCaster(-0.32, -0.4, true)); // FR
cartGroup.add(buildHyperCaster(0.32, 0.38, false)); // RL
cartGroup.add(buildHyperCaster(-0.32, 0.38, false)); // RR


// --------- 4. True 3D Wire Mesh Basket ---------
// Instead of a transparent box, we literally generate the metal wire tubes. 
// It looks insanely realistic!
const basketGroup = new THREE.Group();
const wireRad = 0.0035;

// Define the geometric envelope of the basket
const bYBottom = 0.55;
const bYTop = 0.95;
const bZFrontBottom = -0.3;
const bZFrontTop = -0.45;
const bZRear = 0.45;
const bWidthBottom = 0.45;
const bWidthTop = 0.65;

// Horizontal Wire Rings (Hoops)
const numRings = 7;
for(let i=0; i<numRings; i++) {
    const t = i / (numRings - 1);
    const y = THREE.MathUtils.lerp(bYBottom, bYTop, t);
    const w = THREE.MathUtils.lerp(bWidthBottom, bWidthTop, t);
    const zF = THREE.MathUtils.lerp(bZFrontBottom, bZFrontTop, t);
    
    // Create continuous path for the ring
    const pts = [
        new THREE.Vector3(w/2, y, zF),
        new THREE.Vector3(w/2, y, bZRear),
        new THREE.Vector3(-w/2, y, bZRear),
        new THREE.Vector3(-w/2, y, zF),
        new THREE.Vector3(w/2, y, zF) // Close
    ];
    // Slightly rounded corners via CatmullRom
    const curve = new THREE.CatmullRomCurve3(pts, true, 'chordal', 0.1);
    
    // Top rim is significantly thicker
    const thick = (i === numRings - 1) ? 0.015 : wireRad;
    const ringMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, thick, 8, true), chromeMat);
    ringMesh.castShadow = true; ringMesh.receiveShadow = true;
    basketGroup.add(ringMesh);
}

// Vertical Wires (Front/Back)
const numVertFront = 12;
for(let i=0; i<numVertFront; i++) {
    const t = i / (numVertFront - 1);
    // Interpolate along the width for the bottom and top separately
    const xB = THREE.MathUtils.lerp(-bWidthBottom/2, bWidthBottom/2, t);
    const xT = THREE.MathUtils.lerp(-bWidthTop/2, bWidthTop/2, t);
    
    // Front Wires
    const frontPts = [new THREE.Vector3(xB, bYBottom, bZFrontBottom), new THREE.Vector3(xT, bYTop, bZFrontTop)];
    const frontWire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(frontPts[0], frontPts[1]), 1, wireRad, 6), chromeMat);
    frontWire.castShadow = true; basketGroup.add(frontWire);
    
    // Rear Wires (Slight gap for the handle/tablet area)
    if (i < 2 || i > 9) {
        const rearPts = [new THREE.Vector3(xB, bYBottom, bZRear), new THREE.Vector3(xT, bYTop, bZRear)];
        const rearWire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(rearPts[0], rearPts[1]), 1, wireRad, 6), chromeMat);
        rearWire.castShadow = true; basketGroup.add(rearWire);
    }
}

// Side Wires
const numVertSide = 10;
for(let i=1; i<numVertSide-1; i++) {
    const t = i / (numVertSide - 1);
    const zB = THREE.MathUtils.lerp(bZFrontBottom, bZRear, t);
    const zT = THREE.MathUtils.lerp(bZFrontTop, bZRear, t);
    
    const sidePtsL = [new THREE.Vector3(bWidthBottom/2, bYBottom, zB), new THREE.Vector3(bWidthTop/2, bYTop, zT)];
    const sideWireL = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(sidePtsL[0], sidePtsL[1]), 1, wireRad, 6), chromeMat);
    sideWireL.castShadow = true; basketGroup.add(sideWireL);
    
    const sidePtsR = [new THREE.Vector3(-bWidthBottom/2, bYBottom, zB), new THREE.Vector3(-bWidthTop/2, bYTop, zT)];
    const sideWireR = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(sidePtsR[0], sidePtsR[1]), 1, wireRad, 6), chromeMat);
    sideWireR.castShadow = true; basketGroup.add(sideWireR);
}

// Connect Basket to Frame
const basketPropL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2), chromeMat);
basketPropL.position.set(0.3, 0.45, 0.4); basketPropL.rotation.x = -Math.PI/10; cartGroup.add(basketPropL);
const basketPropR = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2), chromeMat);
basketPropR.position.set(-0.3, 0.45, 0.4); basketPropR.rotation.x = -Math.PI/10; cartGroup.add(basketPropR);

// Front Support props from base to basket
const frontPropGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.4, 16);
const pF1 = new THREE.Mesh(frontPropGeo, chromeMat);
pF1.position.set(0.2, 0.35, -0.3); pF1.rotation.x = -Math.PI / 10; cartGroup.add(pF1);
const pF2 = new THREE.Mesh(frontPropGeo, chromeMat);
pF2.position.set(-0.2, 0.35, -0.3); pF2.rotation.x = -Math.PI / 10; cartGroup.add(pF2);

cartGroup.add(basketGroup);


// --------- 5. The Advanced Smart Console (Tablet, Scanner, Electronics) ---------

const dashGroup = new THREE.Group();
// Position dashboard attached to the handle
dashGroup.position.set(0, 1.05, 0.53);
dashGroup.rotation.x = -Math.PI / 6; // Angled elegantly up at user

// 1. The main tablet housing (Thick, sleek, rounded edges)
const dashW = 0.52;
const dashH = 0.32;
const dashD = 0.045;
const tabletHousingGeo = createRoundedBoxGeometry(dashW, dashD, dashH, 0.015, 8);
const tabletHousing = new THREE.Mesh(tabletHousingGeo, plasticMat);
tabletHousing.castShadow = true;
dashGroup.add(tabletHousing);

// 2. The Glass Screen Plate Panel (inset slightly, glossy)
const glassGeo = createRoundedBoxGeometry(dashW - 0.04, 0.005, dashH - 0.04, 0.01);
const glassMesh = new THREE.Mesh(glassGeo, glassMat);
glassMesh.position.y = dashD / 2; // Front face
dashGroup.add(glassMesh);

// 3. UI Screen Canvas behind the glass
const uiCanvas = document.createElement('canvas');
uiCanvas.width = 1200; uiCanvas.height = 700;
const ctx = uiCanvas.getContext('2d');
// High-Res Detailed AI Grocery UI
ctx.fillStyle = '#101114'; ctx.fillRect(0,0,1200,700);
// Top Status Bar
ctx.fillStyle = '#1A1C20'; ctx.fillRect(0,0,1200,80);
ctx.fillStyle = '#FFF'; ctx.font = 'bold 32px -apple-system, sans-serif'; ctx.fillText('Store App', 30, 52);
ctx.fillStyle = '#4CAF50'; ctx.beginPath(); ctx.arc(1150, 40, 10, 0, Math.PI*2); ctx.fill(); 
ctx.font = '24px sans-serif'; ctx.fillText('Connected', 1010, 48);
// Left Side: Total & Recs
ctx.fillStyle = '#1c1e24'; ctx.beginPath(); ctx.roundRect(40, 110, 360, 220, 20); ctx.fill();
ctx.fillStyle = '#9aa0a6'; ctx.font = '28px sans-serif'; ctx.fillText('Current Balance', 80, 170);
ctx.fillStyle = '#fff'; ctx.font = 'bold 84px sans-serif'; ctx.fillText('$112.50', 70, 270);
// Checkout Button
ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.roundRect(40, 370, 360, 100, 30); ctx.fill();
ctx.fillStyle = '#fff'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign='center'; ctx.fillText('Tap to Checkout', 220, 435); ctx.textAlign='left';
// Right Side: Shopping List with Thumbnails
ctx.fillStyle = '#1c1e24'; ctx.beginPath(); ctx.roundRect(440, 110, 720, 540, 20); ctx.fill();
ctx.fillStyle = '#fff'; ctx.font = '36px sans-serif'; ctx.fillText('Cart Items (8)', 490, 170);
const items = [
    {n: 'Premium Olive Oil', p: '$14.99', c: '#eab308'},
    {n: 'Organic Spinach', p: '$4.50', c: '#22c55e'},
    {n: 'Almond Milk', p: '$5.25', c: '#d1d5db'},
    {n: 'Sourdough Loaf', p: '$6.00', c: '#b45309'},
    {n: 'Free-Range Eggs', p: '$7.50', c: '#fcd34d'}
];
items.forEach((it, i) => {
    // Thumbnail box
    ctx.fillStyle = it.c; ctx.beginPath(); ctx.roundRect(490, 220+(i*80), 60, 60, 10); ctx.fill();
    ctx.fillStyle = '#e5e7eb'; ctx.font = 'bold 30px sans-serif'; ctx.fillText(it.n, 580, 260+(i*80));
    ctx.fillStyle = '#9ca3af'; ctx.font = '30px sans-serif'; ctx.fillText(it.p, 1000, 260+(i*80));
    ctx.fillStyle = '#374151'; ctx.fillRect(490, 295+(i*80), 620, 2);
});

const screenTex = new THREE.CanvasTexture(uiCanvas);
screenTex.minFilter = THREE.LinearFilter;
// The screen glowing material physically underneath the glass layer
const screenMaterial = new THREE.MeshBasicMaterial({ map: screenTex });
const screenActual = new THREE.Mesh(new THREE.PlaneGeometry(dashW - 0.05, dashH - 0.05), screenMaterial);
screenActual.position.y = (dashD / 2) - 0.001;
screenActual.rotation.x = -Math.PI/2; // Lay flat facing up the housing
dashGroup.add(screenActual);

// 4. Scanner Module (Bottom right attachment)
const scannerGeo = createRoundedBoxGeometry(0.12, 0.08, 0.1, 0.015);
const scannerBox = new THREE.Mesh(scannerGeo, plasticMat);
scannerBox.position.set(0.15, -0.06, 0.1); 
dashGroup.add(scannerBox);

// Scanner Red Laser Window
const laserWindow = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.04), new THREE.MeshBasicMaterial({color: 0xff0000}));
laserWindow.position.set(0.15, -0.101, 0.15); // Bottom facing
laserWindow.rotation.x = Math.PI/2;
dashGroup.add(laserWindow);

// 5. Huge Electronics / Printer Box (hanging down into basket)
const eboxGeo = createRoundedBoxGeometry(0.3, 0.2, 0.15, 0.02, 6);
const eBox = new THREE.Mesh(eboxGeo, plasticMat);
eBox.position.set(0, -0.08, -0.05);
// Give it heat dissipation vents (ribs)
const ribsMat = new THREE.MeshStandardMaterial({color: 0x050505, roughness: 1.0});
for(let i=0; i<6; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.005, 0.155), ribsMat);
    rib.position.set(0, -0.05 - (i*0.02), -0.05);
    dashGroup.add(rib);
}
eBox.castShadow = true;
dashGroup.add(eBox);

// Attach the entire dashboard to the cart frame
cartGroup.add(dashGroup);

// Elevate cart slightly so wheels sit at Y=0 properly based on radii
cartGroup.position.y = 0; 
scene.add(cartGroup);

// ==========================================
// Cinematic Animation & Interaction
// ==========================================

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function transitionCamera(targetPos) {
    const startPos = camera.position.clone();
    const duration = 1400; // Slower, smoother transition
    const startTime = performance.now();
    
    function update(time) {
        let elapsed = time - startTime;
        let progress = Math.min(elapsed / duration, 1);
        
        // Easing (Quart Out)
        const easeAmount = 1 - Math.pow(1 - progress, 4);
        
        camera.position.lerpVectors(startPos, targetPos, easeAmount);
        
        // Focus stays smoothly on the basket center
        const targetFocus = new THREE.Vector3(0, 0.8, -0.1);
        controls.target.lerpVectors(controls.target, targetFocus, easeAmount);
        camera.lookAt(controls.target);
        controls.update(); 
        
        if(progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

document.getElementById('view-front').addEventListener('click', (e) => {
    document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    transitionCamera(new THREE.Vector3(0, 1.2, -4.5)); // Low dramatic front
});

document.getElementById('view-side').addEventListener('click', (e) => {
    document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    transitionCamera(new THREE.Vector3(4.5, 1.5, 0)); // Pure profile
});

document.getElementById('view-iso').addEventListener('click', (e) => {
    document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    transitionCamera(new THREE.Vector3(4, 2.5, 5)); // Hero 3/4
});
