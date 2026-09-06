import * as THREE from 'three';
import { RemotePlayerState, Team, WeaponId, KillFeedItem } from '../types';
import { createCharacterModel, CharacterModelRef } from './characterModels';
import { createWeaponViewModel } from './viewmodels';
import { soundManager } from '../audio/soundManager';
import { WEAPON_REGISTRY } from '../constants/weapons';
import { mpClient } from '../network/multiplayerClient';

export interface RemotePlayerEntry {
  state: RemotePlayerState;
  modelRef: CharacterModelRef;
  nametag: THREE.Sprite;
  targetPosition: THREE.Vector3;
  targetYaw: number;
  targetPitch: number;
  walkCycle: number;
  activeWeaponId: WeaponId;
  currentGunGroup?: THREE.Group;
}

export class MultiplayerManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  public remotePlayers: Map<string, RemotePlayerEntry> = new Map();
  public isConnected: boolean = false;
  public currentRoomId: string | null = null;
  public myPlayerId: string | null = null;
  private lastTransformSentTime: number = 0;
  private onKillFeedCallback?: (item: KillFeedItem) => void;
  private onScreenMessageCallback?: (title: string, subtitle?: string) => void;
  private onHitMarkerCallback?: () => void;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    callbacks?: {
      onKillFeed?: (item: KillFeedItem) => void;
      onScreenMessage?: (title: string, subtitle?: string) => void;
      onHitMarker?: () => void;
    }
  ) {
    this.scene = scene;
    this.camera = camera;
    this.onKillFeedCallback = callbacks?.onKillFeed;
    this.onScreenMessageCallback = callbacks?.onScreenMessage;
    this.onHitMarkerCallback = callbacks?.onHitMarker;
  }

  public initListeners() {
    return mpClient.subscribe((event) => {
      switch (event.type) {
        case 'room_joined': {
          this.currentRoomId = event.roomId;
          this.myPlayerId = event.playerId;
          this.clearAllRemotePlayers();

          if (Array.isArray(event.players)) {
            event.players.forEach((p: RemotePlayerState) => {
              if (p.id !== this.myPlayerId) {
                this.addRemotePlayer(p);
              }
            });
          }
          break;
        }

        case 'player_joined': {
          if (event.player && event.player.id !== this.myPlayerId) {
            this.addRemotePlayer(event.player);
            this.onScreenMessageCallback?.('بازیکن جدید', `${event.player.name} به بازی پیوست`);
          }
          break;
        }

        case 'player_left': {
          this.removeRemotePlayer(event.playerId);
          if (event.playerName) {
            this.onScreenMessageCallback?.('خروج بازیکن', `${event.playerName} بازی را ترک کرد`);
          }
          break;
        }

        case 'player_transformed': {
          if (event.playerId !== this.myPlayerId) {
            this.updateRemotePlayerTransform(event.playerId, event.data);
          }
          break;
        }

        case 'player_shot': {
          if (event.playerId !== this.myPlayerId) {
            this.handleRemoteShot(event.playerId, event.weaponId, event.origin, event.direction);
          }
          break;
        }

        case 'kill_event': {
          this.handleRemoteKill(event);
          break;
        }

        case 'player_damaged': {
          this.handleRemoteDamage(event.victimId, event.health);
          break;
        }
      }
    });
  }

  public addRemotePlayer(player: RemotePlayerState) {
    if (this.remotePlayers.has(player.id)) return;

    const initialWeapon = (player.activeWeaponId as WeaponId) || 'ak47';
    const modelRef = createCharacterModel(player.team, initialWeapon, player.hasHelmet ?? true);
    
    const posX = player.position?.x ?? 0;
    const posY = player.position?.y ?? 0;
    const posZ = player.position?.z ?? 0;

    modelRef.group.position.set(posX, posY, posZ);
    modelRef.group.rotation.y = player.yaw ?? 0;

    // Create Nametag Sprite
    const nametag = this.createNametagSprite(player.name, player.team);
    modelRef.group.add(nametag);

    // Tag meshes for Raycasting Hits
    modelRef.group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.userData.remotePlayerId = player.id;
        child.userData.remotePlayerTeam = player.team;
        child.userData.isHead = child === modelRef.headMesh || child === modelRef.helmetMesh;
      }
    });

    this.scene.add(modelRef.group);

    const entry: RemotePlayerEntry = {
      state: { ...player },
      modelRef,
      nametag,
      targetPosition: new THREE.Vector3(posX, posY, posZ),
      targetYaw: player.yaw ?? 0,
      targetPitch: player.pitch ?? 0,
      walkCycle: 0,
      activeWeaponId: initialWeapon
    };

    this.remotePlayers.set(player.id, entry);
  }

  public updateRemotePlayerTransform(playerId: string, data: Partial<RemotePlayerState>) {
    const entry = this.remotePlayers.get(playerId);
    if (!entry) return;

    Object.assign(entry.state, data);

    if (data.position) {
      entry.targetPosition.set(data.position.x, data.position.y, data.position.z);
    }
    if (data.yaw !== undefined) {
      entry.targetYaw = data.yaw;
    }
    if (data.pitch !== undefined) {
      entry.targetPitch = data.pitch;
    }
    if (data.activeWeaponId && data.activeWeaponId !== entry.activeWeaponId) {
      this.switchRemoteWeapon(entry, data.activeWeaponId as WeaponId);
    }
  }

  private switchRemoteWeapon(entry: RemotePlayerEntry, newWeaponId: WeaponId) {
    entry.activeWeaponId = newWeaponId;
    if (entry.modelRef.gunMesh) {
      entry.modelRef.group.remove(entry.modelRef.gunMesh);
    }

    const newGun = createWeaponViewModel(newWeaponId);
    newGun.scale.set(0.7, 0.7, 0.7);
    newGun.position.set(0.45, 1.4, -0.6);
    newGun.rotation.set(0, 0, 0);

    entry.modelRef.gunMesh = newGun;
    entry.modelRef.group.add(newGun);
  }

  public removeRemotePlayer(playerId: string) {
    const entry = this.remotePlayers.get(playerId);
    if (!entry) return;

    this.scene.remove(entry.modelRef.group);
    this.remotePlayers.delete(playerId);
  }

  public clearAllRemotePlayers() {
    this.remotePlayers.forEach((entry) => {
      this.scene.remove(entry.modelRef.group);
    });
    this.remotePlayers.clear();
  }

  public handleRemoteShot(playerId: string, weaponId: WeaponId, origin: any, direction: any) {
    soundManager.playWeaponShot(weaponId || 'ak47');

    if (origin && direction) {
      const from = new THREE.Vector3(origin.x, origin.y, origin.z);
      const dir = new THREE.Vector3(direction.x, direction.y, direction.z).normalize();
      const to = from.clone().add(dir.multiplyScalar(60));
      this.createRemoteTracer(from, to);
    }

    const entry = this.remotePlayers.get(playerId);
    if (entry && entry.modelRef.gunMesh) {
      // Gun recoil animation
      entry.modelRef.gunMesh.position.z += 0.15;
      setTimeout(() => {
        if (entry.modelRef.gunMesh) {
          entry.modelRef.gunMesh.position.z = -0.6;
        }
      }, 70);
    }
  }

  private handleRemoteDamage(victimId: string, health: number) {
    const entry = this.remotePlayers.get(victimId);
    if (entry) {
      entry.state.health = health;
    }
  }

  private handleRemoteKill(event: any) {
    const { killerName, killerTeam, victimId, victimName, victimTeam, weaponName, isHeadshot } = event;

    this.onKillFeedCallback?.({
      id: Math.random().toString(36).substring(2, 9),
      killerName: killerName || 'Player',
      killerTeam: (killerTeam as Team) || 'CT',
      victimName: victimName || 'Player',
      victimTeam: (victimTeam as Team) || 'T',
      weaponName: weaponName || 'اسلحه',
      weaponId: (event.weaponId as WeaponId) || 'ak47',
      isHeadshot: !!isHeadshot
    });

    const entry = this.remotePlayers.get(victimId);
    if (entry) {
      entry.state.isDead = true;
      // Ragdoll collapse animation
      entry.modelRef.group.rotation.x = Math.PI / 2;
      entry.modelRef.group.position.y = 0.2;
    }
  }

  public update(delta: number, localPlayerPos: THREE.Vector3, localYaw: number, localPitch: number, localState: any) {
    // 1. Throttle sending local transform to server (every 45ms ~ 22 FPS network tick)
    const now = performance.now();
    if (now - this.lastTransformSentTime > 45 && mpClient.isConnected && mpClient.currentRoomId) {
      this.lastTransformSentTime = now;
      mpClient.sendTransform({
        position: { x: localPlayerPos.x, y: localPlayerPos.y - 1.7, z: localPlayerPos.z },
        yaw: localYaw,
        pitch: localPitch,
        activeWeaponId: localState.activeWeaponId,
        isFiring: localState.isFiring,
        isCrouching: localState.isCrouching,
        isJumping: localState.isJumping,
        health: localState.health,
        isDead: localState.health <= 0
      });
    }

    // 2. Animate and smooth remote players
    this.remotePlayers.forEach((entry) => {
      if (entry.state.isDead) return;

      // Position Lerp
      const currentPos = entry.modelRef.group.position;
      currentPos.lerp(entry.targetPosition, Math.min(1, delta * 14));

      // Rotation Slerp / Lerp
      let diffYaw = entry.targetYaw - entry.modelRef.group.rotation.y;
      while (diffYaw < -Math.PI) diffYaw += Math.PI * 2;
      while (diffYaw > Math.PI) diffYaw -= Math.PI * 2;
      entry.modelRef.group.rotation.y += diffYaw * Math.min(1, delta * 15);

      // Walk Animation
      const distMoved = currentPos.distanceTo(entry.targetPosition);
      if (distMoved > 0.05) {
        entry.walkCycle += delta * 10;
        const legAngle = Math.sin(entry.walkCycle) * 0.55;
        entry.modelRef.leftLeg.rotation.x = legAngle;
        entry.modelRef.rightLeg.rotation.x = -legAngle;
        entry.modelRef.leftArm.rotation.x = -legAngle * 0.6;
      } else {
        entry.modelRef.leftLeg.rotation.x = 0;
        entry.modelRef.rightLeg.rotation.x = 0;
        entry.modelRef.leftArm.rotation.x = 0;
      }

      // Crouching height adjustment
      if (entry.state.isCrouching) {
        entry.modelRef.group.scale.set(1, 0.65, 1);
      } else {
        entry.modelRef.group.scale.set(1, 1, 1);
      }
    });
  }

  public getRaycastTargets(friendlyFire: boolean, myTeam: Team): THREE.Object3D[] {
    const targets: THREE.Object3D[] = [];
    this.remotePlayers.forEach((entry) => {
      if (entry.state.isDead) return;
      if (entry.state.team === myTeam && !friendlyFire) return;

      entry.modelRef.group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          targets.push(child);
        }
      });
    });
    return targets;
  }

  private createNametagSprite(name: string, team: Team): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = team === 'T' ? 'rgba(220, 38, 38, 0.85)' : 'rgba(37, 99, 235, 0.85)';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(8, 8, 240, 48, 12) : ctx.rect(8, 8, 240, 48);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, 128, 32);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.8, 0.45, 1);
    sprite.position.set(0, 3.4, 0);
    return sprite;
  }

  private createRemoteTracer(from: THREE.Vector3, to: THREE.Vector3) {
    const geom = new THREE.BufferGeometry().setFromPoints([from, to]);
    const mat = new THREE.LineBasicMaterial({ color: 0xffe680, transparent: true, opacity: 0.8 });
    const line = new THREE.Line(geom, mat);
    this.scene.add(line);

    setTimeout(() => {
      this.scene.remove(line);
      geom.dispose();
      mat.dispose();
    }, 60);
  }
}
