import * as THREE from 'three';
import { WeaponId } from '../types';

export function createWeaponViewModel(weaponId: WeaponId, isSilenced: boolean = false): THREE.Group {
  const root = new THREE.Group();

  // Materials
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x22262d,
    roughness: 0.35,
    metalness: 0.85
  });

  const gunMetalMat = new THREE.MeshStandardMaterial({
    color: 0x383e47,
    roughness: 0.45,
    metalness: 0.75
  });

  const polymerDarkMat = new THREE.MeshStandardMaterial({
    color: 0x1a1c20,
    roughness: 0.7,
    metalness: 0.2
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8a4513,
    roughness: 0.65,
    metalness: 0.1
  });

  const awpGreenMat = new THREE.MeshStandardMaterial({
    color: 0x3b5323,
    roughness: 0.6,
    metalness: 0.25
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd8dde5,
    roughness: 0.2,
    metalness: 0.95
  });

  const scopeGlassMat = new THREE.MeshStandardMaterial({
    color: 0x051b2e,
    roughness: 0.1,
    metalness: 0.9
  });

  switch (weaponId) {
    case 'famas': {
      // FAMAS F1 Bullpup Assault Rifle
      // 1. Main lower receiver (composite black/grey)
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.62), polymerDarkMat);
      body.position.set(0, 0, 0);

      // 2. High-profile Top Carry Handle with Integrated Sights (Iconic FAMAS silhouette)
      const handleTop = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.54), polymerDarkMat);
      handleTop.position.set(0, 0.14, -0.02);

      const handlePillarFront = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.08, 0.06), polymerDarkMat);
      handlePillarFront.position.set(0, 0.09, -0.24);

      const handlePillarRear = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.08, 0.06), polymerDarkMat);
      handlePillarRear.position.set(0, 0.09, 0.2);

      // 3. Barrel & Flash Hider
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.4), steelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.03, -0.42);

      const flashHider = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.08, 8), steelMat);
      flashHider.rotation.x = Math.PI / 2;
      flashHider.position.set(0, 0.03, -0.63);

      // 4. Pistol Grip (in middle)
      const pistolGrip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.19, 0.08), polymerDarkMat);
      pistolGrip.position.set(0, -0.13, -0.02);
      pistolGrip.rotation.x = -0.25;

      // 5. Bullpup Magazine (Positioned BEHIND the grip towards rear stock)
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.22, 0.08), steelMat);
      mag.position.set(0, -0.12, 0.22);
      mag.rotation.x = 0.15;

      // 6. Buttplate
      const butt = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.16, 0.05), polymerDarkMat);
      butt.position.set(0, 0, 0.33);

      root.add(body, handleTop, handlePillarFront, handlePillarRear, barrel, flashHider, pistolGrip, mag, butt);
      break;
    }

    case 'ak47': {
      // AK-47 Kalashnikov: Stamped steel, curved banana mag, wood stock & foregrip
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.12, 0.52), steelMat);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.48), gunMetalMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.03, -0.46);

      const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.32), gunMetalMat);
      gasTube.rotation.x = Math.PI / 2;
      gasTube.position.set(0, 0.065, -0.36);

      const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.1, 0.26), woodMat);
      handguard.position.set(0, 0.02, -0.22);

      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.13, 0.34), woodMat);
      stock.position.set(0, -0.02, 0.38);

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.07), woodMat);
      grip.position.set(0, -0.13, 0.05);
      grip.rotation.x = -0.3;

      // Iconic curved 30-round steel banana magazine
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.32, 0.09), steelMat);
      mag.position.set(0, -0.19, -0.06);
      mag.rotation.x = 0.35;

      root.add(receiver, barrel, gasTube, handguard, stock, grip, mag);
      break;
    }

    case 'm4a1': {
      // M4A1-S Carbine with optional sound suppressor
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.13, 0.48), steelMat);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42), gunMetalMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.04, -0.42);

      // Handguard with picatinny quad-rails
      const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.28), polymerDarkMat);
      handguard.position.set(0, 0.04, -0.24);

      // Suppressor (silencer)
      const silencer = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.34), gunMetalMat);
      silencer.rotation.x = Math.PI / 2;
      silencer.position.set(0, 0.04, -0.74);

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.07), polymerDarkMat);
      grip.position.set(0, -0.13, 0.08);
      grip.rotation.x = -0.25;

      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.26, 0.08), steelMat);
      mag.position.set(0, -0.16, -0.05);

      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.3), polymerDarkMat);
      stock.position.set(0, -0.01, 0.36);

      root.add(receiver, barrel, handguard, silencer, grip, mag, stock);
      break;
    }

    case 'awp': {
      // AWP Magnum Sniper Rifle (Olive Green Chassis, Giant Scope)
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.15, 0.85), awpGreenMat);

      // Heavy fluted barrel
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.75), steelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.05, -0.72);

      // Muzzle brake
      const brake = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.1), steelMat);
      brake.position.set(0, 0.05, -1.12);

      // Large Telescopic Scope
      const scopeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.44), steelMat);
      scopeBody.rotation.x = Math.PI / 2;
      scopeBody.position.set(0, 0.17, -0.08);

      const scopeLensFront = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.08), steelMat);
      scopeLensFront.rotation.x = Math.PI / 2;
      scopeLensFront.position.set(0, 0.17, -0.32);

      const scopeGlass = new THREE.Mesh(new THREE.CircleGeometry(0.042, 16), scopeGlassMat);
      scopeGlass.position.set(0, 0.17, -0.36);

      // Bolt handle
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1), chromeMat);
      bolt.position.set(0.07, 0.08, 0.08);
      bolt.rotation.z = Math.PI / 3;

      // Thumbhole stock
      const thumbhole = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.38), awpGreenMat);
      thumbhole.position.set(0, -0.05, 0.46);

      root.add(body, barrel, brake, scopeBody, scopeLensFront, scopeGlass, bolt, thumbhole);
      break;
    }

    case 'scout': {
      // SSG 08 Scout Sniper
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.12, 0.72), polymerDarkMat);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65), steelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.04, -0.62);

      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.34), steelMat);
      scope.rotation.x = Math.PI / 2;
      scope.position.set(0, 0.14, -0.08);

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.18, 0.07), polymerDarkMat);
      grip.position.set(0, -0.12, 0.1);
      grip.rotation.x = -0.25;

      root.add(body, barrel, scope, grip);
      break;
    }

    case 'negev': {
      // Negev LMG: Heavy box receiver, huge 150-rd ammo drum underneath, heavy barrel with vented shroud & bipod
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.65), gunMetalMat);

      // Heavy barrel
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.52), steelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.04, -0.56);

      // Perforated heat shroud around barrel
      const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.35, 12), steelMat);
      shroud.rotation.x = Math.PI / 2;
      shroud.position.set(0, 0.04, -0.42);

      // Heavy muzzle brake
      const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.1, 8), gunMetalMat);
      muzzleBrake.rotation.x = Math.PI / 2;
      muzzleBrake.position.set(0, 0.04, -0.84);

      // Huge 150-round olive green ammo drum box
      const drumMat = new THREE.MeshStandardMaterial({ color: 0x3f4d38, roughness: 0.6, metalness: 0.3 });
      const ammoBox = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 0.22), drumMat);
      ammoBox.position.set(0, -0.18, 0.02);

      // Folded bipod under barrel
      const bipod = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.26), steelMat);
      bipod.position.set(0, -0.02, -0.48);

      // Grip and heavy stock
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.08), polymerDarkMat);
      grip.position.set(0, -0.15, 0.24);
      grip.rotation.x = -0.22;

      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.14, 0.28), polymerDarkMat);
      stock.position.set(0, 0.01, 0.46);

      root.add(body, barrel, shroud, muzzleBrake, ammoBox, bipod, grip, stock);
      break;
    }

    case 'm249': {
      // M249 Para SAW: Squad Automatic Weapon with belt feed mechanism, carry handle, top rail, heavy stock
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.15, 0.62), steelMat);

      // Heavy ribbed heat guard
      const heatGuard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.36), polymerDarkMat);
      heatGuard.position.set(0, 0.05, -0.32);

      // Barrel & flash suppressor
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.48), steelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.04, -0.52);

      const flashSuppressor = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.026, 0.08, 6), steelMat);
      flashSuppressor.rotation.x = Math.PI / 2;
      flashSuppressor.position.set(0, 0.04, -0.78);

      // 100-round soft ammo pouch (OD Green / Desert)
      const pouchMat = new THREE.MeshStandardMaterial({ color: 0x5a5438, roughness: 0.8, metalness: 0.1 });
      const ammoPouch = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.22, 0.24), pouchMat);
      ammoPouch.position.set(0.04, -0.17, 0.02);

      // Folded carry handle
      const carryHandle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.07, 0.2), gunMetalMat);
      carryHandle.position.set(-0.05, 0.12, -0.16);
      carryHandle.rotation.z = -0.3;

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.08), polymerDarkMat);
      grip.position.set(0, -0.14, 0.22);
      grip.rotation.x = -0.25;

      const paraStock = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3), steelMat);
      paraStock.rotation.x = Math.PI / 2;
      paraStock.position.set(0, 0, 0.44);

      root.add(receiver, heatGuard, barrel, flashSuppressor, ammoPouch, carryHandle, grip, paraStock);
      break;
    }

    case 'xm1014': {
      // XM1014 Auto-Shotgun: Long dual-tube system (barrel + 7-round magazine tube), pump guard, combat stock
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.13, 0.46), gunMetalMat);

      // Top shotgun barrel (smoothbore)
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.58), steelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.05, -0.5);

      // Underneath magazine tube
      const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.54), steelMat);
      magTube.rotation.x = Math.PI / 2;
      magTube.position.set(0, 0.01, -0.48);

      // Ribbed front handguard
      const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.32), polymerDarkMat);
      handguard.position.set(0, 0.03, -0.32);

      // Combat pistol grip
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.18, 0.075), polymerDarkMat);
      grip.position.set(0, -0.13, 0.14);
      grip.rotation.x = -0.3;

      // Tactical skeleton stock
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.28), polymerDarkMat);
      stock.position.set(0, 0, 0.36);

      root.add(receiver, barrel, magTube, handguard, grip, stock);
      break;
    }

    case 'nova': {
      // Nova Pump Shotgun: Long sleek receiver, grooved ribbed pump slide, tubular magazine, lightweight polymer stock
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.12, 0.48), steelMat);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.64), gunMetalMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.04, -0.54);

      const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.58), steelMat);
      magTube.rotation.x = Math.PI / 2;
      magTube.position.set(0, 0.0, -0.51);

      // Ribbed pump handle (movable slide)
      const pumpHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.22, 12), polymerDarkMat);
      pumpHandle.rotation.x = Math.PI / 2;
      pumpHandle.position.set(0, 0.01, -0.38);

      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.35), polymerDarkMat);
      stock.position.set(0, -0.04, 0.38);
      stock.rotation.x = 0.08;

      root.add(receiver, barrel, magTube, pumpHandle, stock);
      break;
    }

    case 'mag7': {
      // MAG-7: Compact boxy CQB tactical shotgun, magazine in pistol grip
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.42), gunMetalMat);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.38), steelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.04, -0.38);

      // Front grip / pump with hand stop
      const foregrip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.18), polymerDarkMat);
      foregrip.position.set(0, -0.05, -0.22);

      // Thick pistol grip containing the box magazine
      const magGrip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.1), polymerDarkMat);
      magGrip.position.set(0, -0.15, 0.08);
      magGrip.rotation.x = -0.18;

      const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.36), steelMat);
      topRail.position.set(0, 0.08, -0.02);

      root.add(receiver, barrel, foregrip, magGrip, topRail);
      break;
    }

    case 'sawedoff': {
      // Sawed-Off: Dual side-by-side or stacked short blued steel barrels, polished wood handle & forearm
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.11, 0.32), steelMat);

      const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.34), steelMat);
      barrel1.rotation.x = Math.PI / 2;
      barrel1.position.set(-0.022, 0.02, -0.32);

      const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.34), steelMat);
      barrel2.rotation.x = Math.PI / 2;
      barrel2.position.set(0.022, 0.02, -0.32);

      const woodForearm = new THREE.Mesh(new THREE.BoxGeometry(0.076, 0.06, 0.22), woodMat);
      woodForearm.position.set(0, -0.04, -0.24);

      // Curved wooden pistol grip (Sawed-off stock)
      const woodGrip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.09), woodMat);
      woodGrip.position.set(0, -0.12, 0.15);
      woodGrip.rotation.x = -0.45;

      root.add(receiver, barrel1, barrel2, woodForearm, woodGrip);
      break;
    }

    case 'spas12': {
      // SPAS-12 Combat Shotgun: Heavy heat shield barrel, folded metal top stock, polymer pump grip
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.13, 0.48), steelMat);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.54), steelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.04, -0.48);

      const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5), gunMetalMat);
      magTube.rotation.x = Math.PI / 2;
      magTube.position.set(0, -0.01, -0.46);

      // Vented heat shield over barrel
      const heatShield = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.38, 8), gunMetalMat);
      heatShield.rotation.x = Math.PI / 2;
      heatShield.position.set(0, 0.04, -0.4);

      // Combat pump handle
      const pumpHandle = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.08, 0.24), polymerDarkMat);
      pumpHandle.position.set(0, -0.02, -0.32);

      // Folded metal stock on top
      const foldedStock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.46), steelMat);
      foldedStock.position.set(0, 0.09, 0.04);

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.18, 0.075), polymerDarkMat);
      grip.position.set(0, -0.14, 0.16);
      grip.rotation.x = -0.28;

      root.add(receiver, barrel, magTube, heatShield, pumpHandle, foldedStock, grip);
      break;
    }

    case 'bizon': {
      // PP-19 Bizon: Distinctive cylindrical helical magazine mounted parallel beneath the barrel
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.11, 0.44), steelMat);

      // Helical cylinder drum magazine (64 rounds)
      const drumMat = new THREE.MeshStandardMaterial({ color: 0x282c34, roughness: 0.45, metalness: 0.7 });
      const helicalDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.36, 16), drumMat);
      helicalDrum.rotation.x = Math.PI / 2;
      helicalDrum.position.set(0, -0.06, -0.2);

      // Short barrel and flash hider
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.28), steelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.03, -0.34);

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.17, 0.07), polymerDarkMat);
      grip.position.set(0, -0.13, 0.12);
      grip.rotation.x = -0.22;

      // Folding wire stock
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.24), steelMat);
      stock.position.set(0, 0.02, 0.32);

      root.add(receiver, helicalDrum, barrel, grip, stock);
      break;
    }

    case 'p90': {
      // FN P90: Compact bullpup with top horizontal magazine
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.18, 0.52), polymerDarkMat);

      // Top 50-round horizontal mag
      const topMagMat = new THREE.MeshStandardMaterial({ color: 0xc8aa66, roughness: 0.3, metalness: 0.4 });
      const topMag = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.38), topMagMat);
      topMag.position.set(0, 0.11, -0.02);

      // Short barrel
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.18), steelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.04, -0.32);

      // Front thumbhole grip
      const frontGrip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.08), polymerDarkMat);
      frontGrip.position.set(0, -0.14, -0.12);

      root.add(body, topMag, barrel, frontGrip);
      break;
    }

    case 'mp5sd': {
      // MP5-SD with integrated silencer
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.42), steelMat);

      const bigSilencer = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.38), gunMetalMat);
      bigSilencer.rotation.x = Math.PI / 2;
      bigSilencer.position.set(0, 0.03, -0.36);

      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.24, 0.06), steelMat);
      mag.position.set(0, -0.14, -0.04);
      mag.rotation.x = 0.25;

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.17, 0.07), polymerDarkMat);
      grip.position.set(0, -0.12, 0.08);

      root.add(receiver, bigSilencer, mag, grip);
      break;
    }

    case 'deagle': {
      // Desert Eagle .50 AE: Iconic heavy chrome/steel hand cannon
      const slide = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.12, 0.35), chromeMat);
      slide.position.set(0, 0.03, 0);

      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.06, 0.32), steelMat);
      frame.position.set(0, -0.05, 0.01);

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.21, 0.11), polymerDarkMat);
      grip.position.set(0, -0.14, 0.1);
      grip.rotation.x = -0.22;

      const barrelHole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05), steelMat);
      barrelHole.rotation.x = Math.PI / 2;
      barrelHole.position.set(0, 0.05, -0.18);

      root.add(slide, frame, grip, barrelHole);
      break;
    }

    case 'glock': {
      // Glock-18: Squared slide with burst selector switch
      const slide = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.28), steelMat);

      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.05, 0.27), polymerDarkMat);
      frame.position.set(0, -0.06, 0.01);

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.19, 0.09), polymerDarkMat);
      grip.position.set(0, -0.15, 0.07);
      grip.rotation.x = -0.28;

      // Burst mode selector switch on left slide
      const selector = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.02, 0.03), chromeMat);
      selector.position.set(-0.035, 0.02, 0.1);

      root.add(slide, frame, grip, selector);
      break;
    }

    case 'usps': {
      // USP-S Tactical with cylindrical suppressor
      const slide = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.09, 0.3), steelMat);

      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.05, 0.28), polymerDarkMat);
      frame.position.set(0, -0.06, 0.01);

      const silencer = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.26), gunMetalMat);
      silencer.rotation.x = Math.PI / 2;
      silencer.position.set(0, 0.02, -0.28);

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.19, 0.09), polymerDarkMat);
      grip.position.set(0, -0.15, 0.08);
      grip.rotation.x = -0.25;

      root.add(slide, frame, silencer, grip);
      break;
    }

    case 'knife': {
      // Tactical Combat Knife
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.32), chromeMat);
      blade.position.set(0, 0.06, -0.16);

      // Serrated edge back
      const bladeTip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 4), chromeMat);
      bladeTip.rotation.x = -Math.PI / 2;
      bladeTip.position.set(0, 0.06, -0.34);

      const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.025), steelMat);
      crossguard.position.set(0, 0.04, 0);

      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.03, 0.22), polymerDarkMat);
      handle.position.set(0, 0.02, 0.12);
      handle.rotation.x = Math.PI / 2;

      root.add(blade, bladeTip, crossguard, handle);
      break;
    }

    case 'he_grenade': {
      // High Explosive Grenade (Pineapple / Spherical OD green)
      const heMat = new THREE.MeshStandardMaterial({ color: 0x2e4222, roughness: 0.7 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), heMat);

      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.06), steelMat);
      neck.position.set(0, 0.09, 0);

      const spoon = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.14, 0.025), chromeMat);
      spoon.position.set(0.04, 0.04, 0);
      spoon.rotation.z = 0.1;

      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.005, 8, 16), chromeMat);
      ring.position.set(-0.04, 0.1, 0);

      root.add(body, neck, spoon, ring);
      break;
    }

    case 'flashbang': {
      // Flashbang Grenade (Sleek silver/grey cylinder with ports)
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 12), chromeMat);

      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.04), steelMat);
      band.position.set(0, 0.02, 0);

      const spoon = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.15, 0.025), steelMat);
      spoon.position.set(0.04, 0.04, 0);

      root.add(body, band, spoon);
      break;
    }

    case 'smoke': {
      // Smoke Grenade (Tall green canister with white band)
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x485548, roughness: 0.6 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 12), bodyMat);

      const whiteBandMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
      const whiteBand = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.05), whiteBandMat);
      whiteBand.position.set(0, 0.04, 0);

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04), steelMat);
      cap.position.set(0, 0.13, 0);

      root.add(body, whiteBand, cap);
      break;
    }

    case 'c4': {
      // C4 Explosive Pack: Plastic explosive bricks with keypad timer
      const semtexMat = new THREE.MeshStandardMaterial({ color: 0xbfa37a, roughness: 0.85 }); // Clay/plastic explosive
      const tapeMat = new THREE.MeshStandardMaterial({ color: 0x664422, roughness: 0.6 }); // Duct tape
      const ledMat = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Blinking red LED

      // 4 Bricks of C4
      const brick1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.32), semtexMat);
      brick1.position.set(-0.08, 0, 0);
      const brick2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.32), semtexMat);
      brick2.position.set(0.08, 0, 0);

      // Black strapping tape
      const strap1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.085, 0.06), tapeMat);
      strap1.position.set(0, 0, -0.08);
      const strap2 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.085, 0.06), tapeMat);
      strap2.position.set(0, 0, 0.08);

      // Digital Timer Unit (Black box on top)
      const timerUnit = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.18), polymerDarkMat);
      timerUnit.position.set(0, 0.06, 0);

      // LCD Screen (Greenish digital display)
      const lcdMat = new THREE.MeshBasicMaterial({ color: 0x22ee44 });
      const lcd = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.01, 0.06), lcdMat);
      lcd.position.set(0, 0.095, -0.03);

      // Keypad buttons
      const keypad = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.01, 0.06), gunMetalMat);
      keypad.position.set(0, 0.095, 0.04);

      // Red blinking LED
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), ledMat);
      led.position.set(0.07, 0.1, -0.06);

      // Detonator wires
      const wireMat = new THREE.MeshBasicMaterial({ color: 0x1144ff });
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.12), wireMat);
      wire.position.set(-0.06, 0.08, 0);
      wire.rotation.z = Math.PI / 3;

      root.add(brick1, brick2, strap1, strap2, timerUnit, lcd, keypad, led, wire);
      break;
    }
  }

  // Set default viewmodel scale and placement on right side of camera
  root.position.set(0.35, -0.28, -0.58);
  return root;
}

export function createPlantedC4Mesh(): { group: THREE.Group; light: THREE.PointLight; ledMesh: THREE.Mesh } {
  const group = new THREE.Group();

  const semtexMat = new THREE.MeshStandardMaterial({ color: 0xbfa37a, roughness: 0.85 });
  const tapeMat = new THREE.MeshStandardMaterial({ color: 0x553311, roughness: 0.6 });
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.6, metalness: 0.4 });
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

  // Main explosive body on ground
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.16, 0.65), semtexMat);
  b1.position.set(-0.18, 0.08, 0);
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.16, 0.65), semtexMat);
  b2.position.set(0.18, 0.08, 0);

  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.17, 0.14), tapeMat);
  strap.position.set(0, 0.08, 0);

  // Arming control box
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.36), boxMat);
  box.position.set(0, 0.19, 0);

  // Digital countdown screen
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.12), new THREE.MeshBasicMaterial({ color: 0x11ee33 }));
  screen.position.set(0, 0.255, -0.08);

  // Red LED & Point Light
  const ledMesh = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), ledMat);
  ledMesh.position.set(0.16, 0.27, 0.12);

  const light = new THREE.PointLight(0xff0000, 6, 8);
  light.position.set(0.16, 0.4, 0.12);

  group.add(b1, b2, strap, box, screen, ledMesh, light);
  return { group, light, ledMesh };
}
