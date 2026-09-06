import * as THREE from 'three';

export interface MapData {
  objects: THREE.Object3D[];
  colliders: THREE.Box3[];
  spawnPointsT: THREE.Vector3[];
  spawnPointsCT: THREE.Vector3[];
  bombSites: {
    siteA: THREE.Vector3;
    siteB: THREE.Vector3;
  };
  patrolWaypoints: THREE.Vector3[];
}

export function buildDust2Map(scene: THREE.Scene): MapData {
  const objects: THREE.Object3D[] = [];
  const colliders: THREE.Box3[] = [];

  // Procedural Textures using Canvas for crisp, realistic Dust II surfaces
  function createSandTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#d9b27a';
    ctx.fillRect(0, 0, 512, 512);

    // Grain & sand variation
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 2 + 1;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(180, 140, 80, 0.15)' : 'rgba(235, 205, 150, 0.18)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(16, 16);
    return tex;
  }

  function createWallTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#c79f66';
    ctx.fillRect(0, 0, 512, 512);

    // Weathered plaster bricks pattern
    ctx.strokeStyle = 'rgba(120, 90, 55, 0.25)';
    ctx.lineWidth = 3;
    const rows = 16;
    const rowH = 512 / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      const offset = (r % 2) * 32;
      for (let x = offset; x < 512; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rowH);
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }

  function createCrateTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(0, 0, 256, 256);

    // Wood planks
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#7a4e24' : '#8b5a2b';
      ctx.fillRect(0, i * 64, 256, 64);
      ctx.strokeStyle = '#543314';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, i * 64, 256, 64);
    }
    // Cross brace
    ctx.strokeStyle = '#543314';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(246, 246);
    ctx.moveTo(246, 10);
    ctx.lineTo(10, 246);
    ctx.stroke();

    // Border
    ctx.lineWidth = 18;
    ctx.strokeRect(0, 0, 256, 256);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  const sandTex = createSandTexture();
  const wallTex = createWallTexture();
  const crateTex = createCrateTexture();

  // Materials
  const groundMat = new THREE.MeshStandardMaterial({
    map: sandTex,
    roughness: 0.95,
    metalness: 0.05
  });

  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.85,
    metalness: 0.05
  });

  const boxMat = new THREE.MeshStandardMaterial({
    map: crateTex,
    roughness: 0.75,
    metalness: 0.1
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x3d434d,
    roughness: 0.5,
    metalness: 0.7
  });

  // Ground plane
  const groundGeo = new THREE.PlaneGeometry(300, 300);
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);
  objects.push(groundMesh);

  // Helper function to build solid blocks and register colliders
  function addBlock(x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material = wallMat, castShadow = true): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);

    const box = new THREE.Box3().setFromObject(mesh);
    colliders.push(box);
    return mesh;
  }

  // Outer Map Boundaries
  addBlock(0, 0, -125, 250, 16, 10); // North boundary (CT)
  addBlock(0, 0, 125, 250, 16, 10);  // South boundary (T)
  addBlock(-125, 0, 0, 10, 16, 250); // West boundary (B tunnels)
  addBlock(125, 0, 0, 10, 16, 250);  // East boundary (Long A)

  // ==========================================
  // MID CORRIDOR & MID DOORS
  // ==========================================
  addBlock(-26, 0, 10, 10, 12, 170); // West Mid Wall
  addBlock(26, 0, 10, 10, 12, 170);  // East Mid Wall

  // Mid Doors with doorway opening
  addBlock(-12, 0, -15, 18, 9, 3, darkMetalMat);
  addBlock(12, 0, -15, 18, 9, 3, darkMetalMat);

  // Xbox Crate (jump to catwalk from lower mid)
  addBlock(0, 0, 20, 6.5, 5, 6.5, boxMat);

  // Mid Sandbags & Barriers (provides tactical cover)
  addBlock(-12, 0, 48, 16, 3.5, 4, boxMat);
  addBlock(10, 0, -3, 14, 3.5, 4, boxMat);
  addBlock(-10, 0, -42, 14, 3.5, 4, boxMat);

  // Palm tree trunk at Mid
  const palmGeo = new THREE.CylinderGeometry(0.5, 0.7, 14);
  const palmMat = new THREE.MeshStandardMaterial({ color: 0x6e4726 });
  const palmMesh = new THREE.Mesh(palmGeo, palmMat);
  palmMesh.position.set(16, 7, 30);
  scene.add(palmMesh);
  objects.push(palmMesh);

  // Palm leaves
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e6b2c, roughness: 0.8 });
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(3, 7, 4), leafMat);
    leaf.position.set(16, 14, 30);
    leaf.rotation.z = 1.2;
    leaf.rotation.y = (i * Math.PI) / 3;
    scene.add(leaf);
    objects.push(leaf);
  }

  // ==========================================
  // BOMBSITE A: OPEN PLATFORM WITH 3 STEPS
  // ==========================================
  // Ground floor base & foundation
  addBlock(65, 0, -65, 46, 0.8, 46, wallMat);

  // -------------------------------------------------------------
  // SMALL STAIRCASE TO PLATFORM (پله‌های کوتاه)
  // -------------------------------------------------------------
  // 3 Stair Steps rising from ground y=0.8 to upper floor y=2.0
  const numSteps = 3;
  const stairStartX = 65;
  const stairStartZ = -40;
  const stepDepth = 2.0;
  const stepWidth = 14.0;
  const stepHeight = 1.2 / numSteps; // ~0.4m per step

  for (let s = 0; s < numSteps; s++) {
    const currentStepY = 0.8 + s * stepHeight;
    const currentStepZ = stairStartZ - s * stepDepth;
    // Solid step tread and riser
    addBlock(stairStartX, 0, currentStepZ, stepWidth, currentStepY, stepDepth, wallMat);
  }

  // Staircase Top Landing Platform (Open Space)
  addBlock(65, 0, -45, 14, 2.0, 5, wallMat);

  // -------------------------------------------------------------
  // PLATFORM SLAB
  // -------------------------------------------------------------
  // Concrete Slab at y = 2.0
  addBlock(65, 1.0, -65, 44, 1.0, 44, wallMat);

  // -------------------------------------------------------------
  // THE ARMORED SAFE (سیف کاشت بمب در فضای باز)
  // -------------------------------------------------------------
  // Heavy Steel Safe Outer Body (Dark Titanium Metallic)
  const safeBodyMat = new THREE.MeshStandardMaterial({
    color: 0x1f242c,
    roughness: 0.35,
    metalness: 0.85
  });
  const safeGoldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.3,
    metalness: 0.9
  });

  // Safe Housing Base on Platform
  addBlock(65, 2.0, -68, 5.5, 4.2, 4.5, safeBodyMat);

  // Safe Open Heavy Door with Dial Wheel
  const safeDoor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.8, 3.8), safeBodyMat);
  safeDoor.position.set(62, 4.1, -66);
  safeDoor.rotation.y = 0.65;
  safeDoor.castShadow = true;
  safeDoor.receiveShadow = true;
  scene.add(safeDoor);
  objects.push(safeDoor);

  // Safe Dial Wheel
  const dialGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.3, 16);
  const dialMesh = new THREE.Mesh(dialGeo, safeGoldMat);
  dialMesh.rotation.z = Math.PI / 2;
  dialMesh.position.set(61.6, 4.1, -66);
  scene.add(dialMesh);
  objects.push(dialMesh);

  // Gold Bullion Bars inside the Safe
  for (let g = 0; g < 4; g++) {
    const goldBar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 1.8), safeGoldMat);
    goldBar.position.set(64.2 + (g % 2) * 1.1, 2.4 + Math.floor(g / 2) * 0.45, -68);
    scene.add(goldBar);
    objects.push(goldBar);
  }

  // Safe Room Tactical Computer Terminal & High-Tech Crates
  addBlock(76, 2.0, -78, 5.0, 3.5, 5.0, boxMat);
  addBlock(54, 2.0, -78, 4.5, 3.5, 4.5, boxMat);
  addBlock(78, 2.0, -58, 4.0, 3.2, 4.0, boxMat);

  // Warning Light
  const safeLight = new THREE.PointLight(0xff3322, 4.5, 18);
  safeLight.position.set(65, 6.0, -65);
  scene.add(safeLight);

  // Long A Dividing Walls & Long Doors (Solid thick doors)
  addBlock(70, 0, 15, 8, 12, 100, wallMat); // Long A West Wall
  addBlock(100, 0, 50, 20, 12, 5, darkMetalMat); // Long Doors arch
  addBlock(92, 0, 50, 7.5, 8.5, 2.5, darkMetalMat); // Long Door Left panel
  addBlock(108, 0, 50, 7.5, 8.5, 2.5, darkMetalMat); // Long Door Right panel
  addBlock(85, 0, 80, 8, 10, 40, wallMat); // Pit approach

  // Pit depression cover crates
  addBlock(110, 0, 30, 6, 4, 6, boxMat);
  addBlock(105, 0, -10, 5, 3.5, 5, boxMat);

  // ==========================================
  // BOMBSITE B & TUNNELS
  // ==========================================
  // B-Site enclosing walls
  addBlock(-65, 0, -65, 50, 14, 50, wallMat); // B-Site outer wall
  addBlock(-42, 0, -42, 6, 8, 20, wallMat); // B Doorway wall

  // B Site Crates (Default Plant, Big Box, Double Stack)
  addBlock(-65, 0, -65, 8, 6, 8, boxMat); // Big Box
  addBlock(-54, 0, -78, 6, 4.5, 6, boxMat); // B Back Site
  addBlock(-78, 0, -52, 6, 4.5, 6, boxMat); // B Window Box
  addBlock(-78, 4.5, -52, 4.5, 3.5, 4.5, boxMat);

  // Upper B Tunnel (covered route from T Spawn)
  addBlock(-65, 0, 35, 24, 11, 75, wallMat);
  addBlock(-80, 0, 35, 8, 11, 75, wallMat);

  // C4 Sites Hologram / Marker Rings
  const ringGeo = new THREE.RingGeometry(3.5, 5.0, 32);
  const ringMatA = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
  const markerA = new THREE.Mesh(ringGeo, ringMatA);
  markerA.rotation.x = -Math.PI / 2;
  markerA.position.set(65, 6.05, -65);
  scene.add(markerA);
  objects.push(markerA);

  const markerB = new THREE.Mesh(ringGeo, ringMatA.clone());
  markerB.rotation.x = -Math.PI / 2;
  markerB.position.set(-65, 0.1, -65);
  scene.add(markerB);
  objects.push(markerB);

  // Spawn positions
  const spawnPointsT: THREE.Vector3[] = [];
  const spawnPointsCT: THREE.Vector3[] = [];

  for (let i = -10; i <= 10; i += 3.5) {
    for (let j = 0; j <= 2; j++) {
      spawnPointsT.push(new THREE.Vector3(i, 2.5, 95 + j * 5));
      spawnPointsCT.push(new THREE.Vector3(i, 2.5, -95 - j * 5));
    }
  }

  // Key Tactical Waypoints for bots (including climbing the stairs to the 2nd floor safe room)
  const patrolWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 2.5, 0),       // Mid Center
    new THREE.Vector3(0, 2.5, 40),      // Mid T-side
    new THREE.Vector3(0, 2.5, -40),     // Mid CT-side
    new THREE.Vector3(65, 2.5, -15),    // Base of Stairs
    new THREE.Vector3(65, 5.0, -32),    // Mid-way up Stairs
    new THREE.Vector3(65, 8.5, -46),    // Top of Stairs Landing
    new THREE.Vector3(65, 8.5, -65),    // 2nd Floor Safe Room (Site A)
    new THREE.Vector3(100, 2.5, 20),    // Long A Pit
    new THREE.Vector3(75, 2.5, -10),    // Long A Corner
    new THREE.Vector3(-65, 2.5, -65),   // Bombsite B
    new THREE.Vector3(-65, 2.5, 10),    // Upper B Tunnels
    new THREE.Vector3(-15, 2.5, -75),   // CT Spawn Alley
    new THREE.Vector3(15, 2.5, 75)      // T Spawn Courtyard
  ];

  return {
    objects,
    colliders,
    spawnPointsT,
    spawnPointsCT,
    bombSites: {
      siteA: new THREE.Vector3(65, 6.05, -65),
      siteB: new THREE.Vector3(-65, 0.1, -65)
    },
    patrolWaypoints
  };
}
