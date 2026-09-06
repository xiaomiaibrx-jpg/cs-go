import * as THREE from 'three';
import { Team, WeaponId } from '../types';

export interface CharacterModelRef {
  group: THREE.Group;
  headMesh: THREE.Mesh;
  torsoMesh: THREE.Mesh;
  helmetMesh?: THREE.Mesh;
  vestMesh?: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  gunMesh: THREE.Group;
}

export function createCharacterModel(team: Team, weaponId: WeaponId = 'ak47', hasHelmet: boolean = true): CharacterModelRef {
  const group = new THREE.Group();

  // Colors & Materials
  const isT = team === 'T';

  // Uniform base colors
  const uniformColor = isT ? 0x8a6240 : 0x243242; // Desert camo brown (T) vs Navy swat blue (CT)
  const pantsColor = isT ? 0x473827 : 0x1b2430;
  const vestColor = isT ? 0x2d241c : 0x12171f;
  const helmetColor = isT ? 0x3d3023 : 0x2c3b4d;
  const skinColor = 0xd9a073;

  const uniformMat = new THREE.MeshStandardMaterial({ color: uniformColor, roughness: 0.8 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.85 });
  const vestMat = new THREE.MeshStandardMaterial({ color: vestColor, roughness: 0.65, metalness: 0.1 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.75 });
  const helmetMat = new THREE.MeshStandardMaterial({ color: helmetColor, roughness: 0.5, metalness: 0.3 });
  const goggleMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.9 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 });

  // 1. Head
  const headGeo = new THREE.BoxGeometry(0.7, 0.75, 0.7);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.position.set(0, 2.7, 0);
  headMesh.castShadow = true;
  headMesh.userData = { isHead: true };
  group.add(headMesh);

  // Helmet / Balaclava
  let helmetMesh: THREE.Mesh | undefined;
  if (hasHelmet || !isT) {
    const helmetGeo = new THREE.BoxGeometry(0.78, 0.45, 0.78);
    helmetMesh = new THREE.Mesh(helmetGeo, helmetMat);
    helmetMesh.position.set(0, 2.9, 0);
    helmetMesh.castShadow = true;
    helmetMesh.userData = { isHead: true, isHelmet: true };
    group.add(helmetMesh);

    // Goggles / visor
    const goggleGeo = new THREE.BoxGeometry(0.6, 0.18, 0.15);
    const goggleMesh = new THREE.Mesh(goggleGeo, goggleMat);
    goggleMesh.position.set(0, 2.75, -0.38);
    group.add(goggleMesh);
  } else {
    // Terrorist Balaclava / Scarf
    const scarfGeo = new THREE.BoxGeometry(0.74, 0.35, 0.74);
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.9 });
    const scarf = new THREE.Mesh(scarfGeo, scarfMat);
    scarf.position.set(0, 2.55, 0);
    group.add(scarf);
  }

  // 2. Torso (Body)
  const torsoGeo = new THREE.BoxGeometry(1.2, 1.45, 0.65);
  const torsoMesh = new THREE.Mesh(torsoGeo, uniformMat);
  torsoMesh.position.set(0, 1.6, 0);
  torsoMesh.castShadow = true;
  torsoMesh.userData = { isBody: true };
  group.add(torsoMesh);

  // Tactical Kevlar Vest over torso
  const vestGeo = new THREE.BoxGeometry(1.28, 1.2, 0.74);
  const vestMesh = new THREE.Mesh(vestGeo, vestMat);
  vestMesh.position.set(0, 1.65, 0);
  vestMesh.castShadow = true;
  vestMesh.userData = { isBody: true, isVest: true };
  group.add(vestMesh);

  // Team identification band on chest
  const bandColor = isT ? 0xef4444 : 0x3b82f6;
  const bandMat = new THREE.MeshBasicMaterial({ color: bandColor });
  const teamBand = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.02), bandMat);
  teamBand.position.set(0, 1.95, -0.38);
  group.add(teamBand);

  // 3. Arms
  const armGeo = new THREE.BoxGeometry(0.38, 1.3, 0.38);

  const leftArm = new THREE.Mesh(armGeo, uniformMat);
  leftArm.position.set(-0.82, 1.55, -0.15);
  leftArm.rotation.x = -0.45;
  leftArm.rotation.z = -0.2;
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, uniformMat);
  rightArm.position.set(0.82, 1.55, -0.2);
  rightArm.rotation.x = -0.55;
  rightArm.rotation.z = 0.2;
  rightArm.castShadow = true;
  group.add(rightArm);

  // 4. Legs
  const legGeo = new THREE.BoxGeometry(0.45, 1.35, 0.45);

  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(-0.35, 0.7, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(0.35, 0.7, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // Combat Boots
  const bootGeo = new THREE.BoxGeometry(0.48, 0.25, 0.6);
  const leftBoot = new THREE.Mesh(bootGeo, bootMat);
  leftBoot.position.set(-0.35, 0.12, -0.06);
  group.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeo, bootMat);
  rightBoot.position.set(0.35, 0.12, -0.06);
  group.add(rightBoot);

  // 5. Held Weapon
  const gunMesh = new THREE.Group();
  const gunSteelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 });

  if (weaponId === 'awp') {
    const awpBody = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 1.4), new THREE.MeshStandardMaterial({ color: 0x3b5323 }));
    const awpBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0), gunSteelMat);
    awpBarrel.rotation.x = Math.PI / 2;
    awpBarrel.position.set(0, 0.05, -1.0);
    gunMesh.add(awpBody, awpBarrel);
  } else if (weaponId === 'famas') {
    // FAMAS bullpup silhouette in hand
    const famasBody = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.9), gunSteelMat);
    const famasHandle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.8), gunSteelMat);
    famasHandle.position.set(0, 0.16, 0);
    gunMesh.add(famasBody, famasHandle);
  } else {
    // Standard rifle / SMG mesh
    const rifleBody = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 1.0), gunSteelMat);
    const rifleBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6), gunSteelMat);
    rifleBarrel.rotation.x = Math.PI / 2;
    rifleBarrel.position.set(0, 0.05, -0.7);
    gunMesh.add(rifleBody, rifleBarrel);
  }

  gunMesh.position.set(0.4, 1.45, -0.6);
  group.add(gunMesh);

  return {
    group,
    headMesh,
    torsoMesh,
    helmetMesh,
    vestMesh,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    gunMesh
  };
}
