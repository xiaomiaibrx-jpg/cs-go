import * as THREE from 'three';
import {
  Team,
  WeaponId,
  WeaponSlotType,
  PlayerState,
  BotEntity,
  DroppedWeaponItem,
  ActiveGrenadeEntity,
  SmokeCloudEntity,
  MatchSettings,
  KillFeedItem,
  PlantedC4Entity
} from '../types';
import { WEAPON_REGISTRY, EQUIPMENT_REGISTRY } from '../constants/weapons';
import { soundManager } from '../audio/soundManager';
import { createWeaponViewModel, createPlantedC4Mesh } from './viewmodels';
import { createCharacterModel } from './characterModels';
import { buildDust2Map, MapData } from './mapBuilder';
import { MultiplayerManager } from './multiplayerManager';
import { mpClient } from '../network/multiplayerClient';

const BOT_NAMES_T = [
  'Terrorist Leader', 'Phoenix', 'Kip', 'Tariq', 'Militia',
  'Anis', 'Viper', 'Sly', 'Rebel', 'Ghost', 'Spike', 'Shadow',
  'Venom', 'Hassan', 'Boris', 'Cobra', 'Apex', 'Falcon', 'Wolf', 'Rogue'
];

const BOT_NAMES_CT = [
  'Captain Price', 'Ghost', 'Soap', 'Roach', 'Gaz',
  'Alex', 'Dave', 'Seal Six', 'Hawk', 'Alpha', 'Bravo', 'Echo',
  'Vanguard', 'Specter', 'Hammer', 'Titan', 'Odin', 'Ranger', 'Striker', 'Delta'
];

export interface GameEngineCallbacks {
  onPlayerUpdate: (player: PlayerState) => void;
  onKillFeed: (item: KillFeedItem) => void;
  onRoundEnd: (winningTeam: Team, reason: string) => void;
  onHitMarker: () => void;
  onScreenMessage: (title: string, subtitle?: string) => void;
  onMatchStatsUpdate: (scoreT: number, scoreCT: number, timeRemaining: number) => void;
  onOpenSettingsModal?: () => void;
}

interface ExplosionVFX {
  group: THREE.Group;
  light: THREE.PointLight;
  coreMesh: THREE.Mesh;
  shockwaveMesh: THREE.Mesh;
  particles: { mesh: THREE.Mesh; velocity: THREE.Vector3 }[];
  smokePuffs: { mesh: THREE.Mesh; velocity: THREE.Vector3 }[];
  age: number;
  maxAge: number;
}

export class GameEngine {
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  public renderer!: THREE.WebGLRenderer;
  private canvas!: HTMLCanvasElement;

  public mapData!: MapData;
  public player!: PlayerState;
  public bots: BotEntity[] = [];
  public droppedWeapons: DroppedWeaponItem[] = [];
  public activeGrenades: ActiveGrenadeEntity[] = [];
  public smokeClouds: SmokeCloudEntity[] = [];
  public activeExplosions: ExplosionVFX[] = [];
  public matchSettings: MatchSettings;
  public mpManager!: MultiplayerManager;
  public isMultiplayer: boolean = false;

  // C4 Bomb Mechanics
  public plantedC4: PlantedC4Entity | null = null;
  public isTouchPlanting: boolean = false;
  public isTouchDefusing: boolean = false;
  private c4PlantSoundTimer: number = 0;
  private c4DefuseSoundTimer: number = 0;

  // Mobile virtual joystick & touch
  public virtualMoveVector: { x: number; y: number } = { x: 0, y: 0 };

  // Viewmodel & Rendering
  private viewmodelContainer: THREE.Group = new THREE.Group();
  private muzzleFlashLight!: THREE.PointLight;
  private viewmodelRecoilZ: number = 0;
  private viewmodelRecoilRotX: number = 0;
  private gunBobTimer: number = 0;
  private continuousShotsCount: number = 0;

  // Camera recoil & physics
  private screenShakeIntensity: number = 0;
  private playerVelocityY: number = 0;

  // Round State
  public scoreT: number = 0;
  public scoreCT: number = 0;
  public roundTimeRemaining: number = 115;
  public isRoundActive: boolean = false;
  public isPaused: boolean = false;
  private roundTimerInterval: number | null = null;

  // Spectator State
  public isSpectating: boolean = false;
  private spectateIndex: number = 0;

  // Inputs & Controls
  public keys: Record<string, boolean> = {};
  public isMouseDown: boolean = false;
  public isRightMouseDown: boolean = false;
  private mouseSensitivity: number = 0.0022;
  private previousSlot: WeaponSlotType = 2;

  // Callbacks
  private callbacks: GameEngineCallbacks;
  private animationFrameId: number | null = null;
  private lastTime: number = performance.now();

  constructor(canvas: HTMLCanvasElement, settings: MatchSettings, callbacks: GameEngineCallbacks) {
    this.canvas = canvas;
    this.matchSettings = settings;
    this.callbacks = callbacks;

    this.initPlayer();
    this.initThreeJS();
    this.setupEventListeners();
  }

  private initPlayer() {
    this.player = {
      name: 'Player1',
      team: 'T',
      health: 100,
      maxHealth: 100,
      armor: 100,
      hasHelmet: true,
      money: this.matchSettings.startingMoney,
      kills: 0,
      deaths: 0,
      score: 0,
      activeSlot: 2,
      hasTripleWeaponPerk: false,
      hasDefuseKit: false,
      isPlantingBomb: false,
      plantProgress: 0,
      isDefusingBomb: false,
      defuseProgress: 0,
      slots: {
        1: null, // Primary
        2: {
          weapon: WEAPON_REGISTRY.glock,
          clip: WEAPON_REGISTRY.glock.clipSize,
          reserveAmmo: WEAPON_REGISTRY.glock.maxReserveAmmo,
          currentFireMode: 'semi'
        },
        3: {
          weapon: WEAPON_REGISTRY.knife,
          clip: 1,
          reserveAmmo: 1,
          currentFireMode: 'semi'
        },
        4: [
          {
            weapon: WEAPON_REGISTRY.he_grenade,
            clip: 1,
            reserveAmmo: 1,
            currentFireMode: 'semi'
          },
          {
            weapon: WEAPON_REGISTRY.flashbang,
            clip: 1,
            reserveAmmo: 1,
            currentFireMode: 'semi'
          },
          {
            weapon: WEAPON_REGISTRY.smoke,
            clip: 1,
            reserveAmmo: 1,
            currentFireMode: 'semi'
          }
        ],
        5: {
          weapon: WEAPON_REGISTRY.c4,
          clip: 1,
          reserveAmmo: 0,
          currentFireMode: 'semi'
        },
        6: null
      },
      activeGrenadeIndex: 0,
      isReloading: false,
      isScoped: false,
      scopeLevel: 0,
      lastShotTime: 0,
      isFiringBurst: false,
      burstShotsRemaining: 0,
      yaw: Math.PI,
      pitch: 0,
      isGrounded: true,
      isCrouching: false,
      isWalking: false,
      flashBlindLevel: 0,
      flashDurationRemaining: 0,
      knifeStabCooldown: 0
    };
  }

  private initThreeJS() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xd6b78d); // Dust II warm desert sky
    this.scene.fog = new THREE.FogExp2(0xd6b78d, 0.007);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 1000);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);

    // Muzzle flash point light
    this.muzzleFlashLight = new THREE.PointLight(0xffa834, 0, 30);
    this.muzzleFlashLight.position.set(0.35, -0.2, -1.1);
    this.camera.add(this.muzzleFlashLight);

    // Viewmodel container
    this.camera.add(this.viewmodelContainer);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Environmental Lights
    const ambientLight = new THREE.AmbientLight(0xfffaec, 0.7);
    this.scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xfff8e7, 1.25);
    sun.position.set(80, 120, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 300;
    const d = 110;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    this.scene.add(sun);

    // Build Map
    this.mapData = buildDust2Map(this.scene);
    this.updateViewmodel();

    // Multiplayer 3D synchronizer
    this.mpManager = new MultiplayerManager(this.scene, this.camera, {
      onKillFeed: this.callbacks.onKillFeed,
      onScreenMessage: this.callbacks.onScreenMessage,
      onHitMarker: this.callbacks.onHitMarker
    });
    this.mpManager.initListeners();
  }

  public updateMatchSettings(newSettings: MatchSettings) {
    this.matchSettings = newSettings;
    this.startNewRound(true);
  }

  public setPlayerTeam(team: Team) {
    this.player.team = team;
    if (team === 'CT') {
      this.player.slots[2] = {
        weapon: WEAPON_REGISTRY.usps,
        clip: WEAPON_REGISTRY.usps.clipSize,
        reserveAmmo: WEAPON_REGISTRY.usps.maxReserveAmmo,
        currentFireMode: 'semi'
      };
    } else {
      this.player.slots[2] = {
        weapon: WEAPON_REGISTRY.glock,
        clip: WEAPON_REGISTRY.glock.clipSize,
        reserveAmmo: WEAPON_REGISTRY.glock.maxReserveAmmo,
        currentFireMode: 'semi'
      };
    }
    this.startNewRound(true);
  }

  public startNewRound(fullReset: boolean = false) {
    this.isRoundActive = true;
    this.isSpectating = false;
    this.roundTimeRemaining = this.matchSettings.roundTimeSeconds;

    if (fullReset) {
      this.scoreT = 0;
      this.scoreCT = 0;
      this.player.kills = 0;
      this.player.deaths = 0;
      this.player.score = 0;
      this.player.money = this.matchSettings.startingMoney;
    }

    // Reset player health, armor and C4 states
    this.player.health = 100;
    this.player.armor = 100;
    this.player.isReloading = false;
    this.player.isScoped = false;
    this.player.scopeLevel = 0;
    this.player.flashBlindLevel = 0;
    this.player.isPlantingBomb = false;
    this.player.plantProgress = 0;
    this.player.isDefusingBomb = false;
    this.player.defuseProgress = 0;
    this.camera.fov = 75;
    this.camera.updateProjectionMatrix();

    // Refill ammo in all slots (1, 2, 3, 6)
    ([1, 2, 3, 6] as WeaponSlotType[]).forEach(slotNum => {
      const slot = this.player.slots[slotNum];
      if (slot && 'clip' in slot) {
        slot.clip = slot.weapon.clipSize;
        slot.reserveAmmo = slot.weapon.maxReserveAmmo;
      }
    });

    // Provide C4 bomb to Terrorist team in slot 5
    if (this.player.team === 'T') {
      this.player.slots[5] = {
        weapon: WEAPON_REGISTRY.c4,
        clip: 1,
        reserveAmmo: 0,
        currentFireMode: 'semi'
      };
    } else {
      this.player.slots[5] = null;
    }

    // Spawn player in their base
    if (this.player.team === 'T') {
      this.camera.position.set(0, 2.5, 95);
      this.player.yaw = Math.PI;
    } else {
      this.camera.position.set(0, 2.5, -95);
      this.player.yaw = 0;
    }
    this.player.pitch = 0;
    this.camera.rotation.set(0, this.player.yaw, 0, 'YXZ');

    // Clean up dropped weapons & active grenades & smoke
    this.cleanupCombatEntities();

    // Spawn bots based on configurable count!
    this.spawnConfiguredBots();

    this.updateViewmodel();
    this.callbacks.onPlayerUpdate(this.player);
    this.callbacks.onMatchStatsUpdate(this.scoreT, this.scoreCT, this.roundTimeRemaining);

    if (this.roundTimerInterval) clearInterval(this.roundTimerInterval);
    this.roundTimerInterval = window.setInterval(() => {
      if (!this.isRoundActive || this.isPaused) return;
      this.roundTimeRemaining--;
      this.callbacks.onMatchStatsUpdate(this.scoreT, this.scoreCT, this.roundTimeRemaining);

      if (this.roundTimeRemaining <= 0) {
        this.endRound('CT', 'پایان وقت راند! ضد تروریست‌ها پیروز شدند');
      }
    }, 1000);

    soundManager.playRadio(this.player.team === 'T' ? 'Terrorists, Go Go Go!' : 'Counter-Terrorists, Move out!');
  }

  private cleanupCombatEntities() {
    if (this.plantedC4) {
      this.scene.remove(this.plantedC4.mesh);
      this.plantedC4 = null;
    }

    this.droppedWeapons.forEach(d => this.scene.remove(d.mesh));
    this.droppedWeapons = [];

    this.activeGrenades.forEach(g => this.scene.remove(g.mesh));
    this.activeGrenades = [];

    this.smokeClouds.forEach(s => this.scene.remove(s.mesh));
    this.smokeClouds = [];

    this.bots.forEach(b => this.scene.remove(b.mesh));
    this.bots = [];
  }

  private spawnConfiguredBots() {
    const tTarget = this.player.team === 'T'
      ? Math.max(0, this.matchSettings.terroristCount - 1)
      : this.matchSettings.terroristCount;

    const ctTarget = this.player.team === 'CT'
      ? Math.max(0, this.matchSettings.counterTerroristCount - 1)
      : this.matchSettings.counterTerroristCount;

    // Available weapon loadouts for bots
    const tGuns: WeaponId[] = ['ak47', 'ak47', 'famas', 'p90', 'awp', 'deagle', 'glock'];
    const ctGuns: WeaponId[] = ['m4a1', 'famas', 'famas', 'mp5sd', 'awp', 'scout', 'usps'];

    // Spawn T Bots
    for (let i = 0; i < tTarget; i++) {
      const name = BOT_NAMES_T[i % BOT_NAMES_T.length];
      const weaponId = tGuns[i % tGuns.length];
      const bot = this.createBotEntity(name, 'T', weaponId);
      const spawnPt = this.mapData.spawnPointsT[i % this.mapData.spawnPointsT.length];
      bot.position.set(spawnPt.x + (Math.random() - 0.5) * 6, 0, spawnPt.z + (Math.random() - 0.5) * 6);
      bot.mesh.position.copy(bot.position);
      this.bots.push(bot);
    }

    // Spawn CT Bots
    for (let i = 0; i < ctTarget; i++) {
      const name = BOT_NAMES_CT[i % BOT_NAMES_CT.length];
      const weaponId = ctGuns[i % ctGuns.length];
      const bot = this.createBotEntity(name, 'CT', weaponId);
      const spawnPt = this.mapData.spawnPointsCT[i % this.mapData.spawnPointsCT.length];
      bot.position.set(spawnPt.x + (Math.random() - 0.5) * 6, 0, spawnPt.z + (Math.random() - 0.5) * 6);
      bot.mesh.position.copy(bot.position);
      this.bots.push(bot);
    }
  }

  private createBotEntity(name: string, team: Team, weaponId: WeaponId): BotEntity {
    const weapon = WEAPON_REGISTRY[weaponId];
    const model = createCharacterModel(team, weaponId, true);
    this.scene.add(model.group);

    const diff = this.matchSettings.difficulty;
    let aimAccuracy = 0.35;
    let reactMin = 0.8;
    let reactMax = 1.4;

    if (diff === 'easy') {
      aimAccuracy = 0.2;
      reactMin = 1.2;
      reactMax = 2.0;
    } else if (diff === 'hard') {
      aimAccuracy = 0.6;
      reactMin = 0.4;
      reactMax = 0.8;
    } else if (diff === 'expert') {
      aimAccuracy = 0.82;
      reactMin = 0.2;
      reactMax = 0.45;
    }

    return {
      id: Math.random().toString(36).substring(2, 9),
      name,
      team,
      health: 100,
      armor: 100,
      hasHelmet: true,
      isDead: false,
      weapon,
      position: new THREE.Vector3(),
      mesh: model.group,
      patrolTarget: null,
      targetEnemy: null,
      reactionTimer: Math.random() * reactMin,
      shootCooldown: 0.5,
      walkCycle: Math.random() * 10,
      state: 'patrol',
      aimAccuracy,
      reactionTimeMin: reactMin,
      reactionTimeMax: reactMax,
      blindTimer: 0
    };
  }

  public getCurrentActiveSlotData(): { weapon: import('../types').WeaponDef; clip: number; reserveAmmo: number; currentFireMode: import('../types').FireMode } | null {
    if (this.player.activeSlot === 4) {
      const grenades = this.player.slots[4];
      if (grenades && grenades.length > 0) {
        return grenades[this.player.activeGrenadeIndex] || null;
      }
      return null;
    }
    const slot = this.player.slots[this.player.activeSlot];
    if (slot && 'weapon' in slot) {
      return slot;
    }
    return null;
  }

  public switchSlot(slot: WeaponSlotType) {
    if (slot === this.player.activeSlot && slot !== 4) return;

    if (slot === 1 && !this.player.slots[1]) {
      this.callbacks.onScreenMessage('اسلحه اصلی ندارید!', 'با زدن کلید B سلاح بخرید یا از زمین بردارید');
      return;
    }

    if (slot === 2 && !this.player.slots[2]) {
      this.callbacks.onScreenMessage('کلت کمری ندارید!', '');
      return;
    }

    if (slot === 5 && !this.player.slots[5]) {
      this.callbacks.onScreenMessage('بمب C4 ندارید!', 'فقط تیم تروریست در راند بمب‌گذاری C4 دارد');
      return;
    }

    if (slot === 6) {
      if (!this.player.hasTripleWeaponPerk) {
        this.callbacks.onScreenMessage('قابلیت ۳ اسلحه قفل است!', 'این قابلیت را با ۱۰۰۰ دلار از منوی خرید (B) فعال کنید');
        return;
      }
      if (!this.player.slots[6]) {
        this.callbacks.onScreenMessage('اسلات سوم خالی است!', 'یک اسلحه دیگر از زمین بردارید');
        return;
      }
    }

    // Toggle next grenade if already on grenade slot
    if (slot === 4) {
      const grenades = this.player.slots[4];
      if (!grenades || grenades.length === 0) {
        this.callbacks.onScreenMessage('نارنجک ندارید!', 'از منوی خرید (B) نارنجک بخرید');
        return;
      }
      if (this.player.activeSlot === 4) {
        this.player.activeGrenadeIndex = (this.player.activeGrenadeIndex + 1) % grenades.length;
      }
    }

    this.previousSlot = this.player.activeSlot;
    this.player.activeSlot = slot;

    // Reset scope if zooming
    if (this.player.isScoped) {
      this.player.isScoped = false;
      this.player.scopeLevel = 0;
      this.camera.fov = 75;
      this.camera.updateProjectionMatrix();
    }

    this.player.isReloading = false;
    this.updateViewmodel();
    this.callbacks.onPlayerUpdate(this.player);
  }

  public quickSwitch() {
    this.switchSlot(this.previousSlot);
  }

  public toggleFireMode() {
    const slotData = this.getCurrentActiveSlotData();
    if (!slotData) return;

    const modes = slotData.weapon.availableFireModes;
    if (modes.length <= 1) return;

    const nextIndex = (modes.indexOf(slotData.currentFireMode) + 1) % modes.length;
    slotData.currentFireMode = modes[nextIndex];
    soundManager.playModeSwitch();

    const modeText = slotData.currentFireMode === 'burst'
      ? 'حالت رگباری ۳ تیره (Burst-Fire)'
      : slotData.currentFireMode === 'auto'
      ? 'حالت تمام اتوماتیک (Full-Auto)'
      : 'حالت تک‌تیر (Semi-Auto)';

    this.callbacks.onScreenMessage(slotData.weapon.name, modeText);
    this.callbacks.onPlayerUpdate(this.player);
  }

  public buyWeapon(weaponId: WeaponId) {
    const weapon = WEAPON_REGISTRY[weaponId];
    if (this.player.money < weapon.price) {
      this.callbacks.onScreenMessage('بودجه کافی نیست!', `$${weapon.price} مورد نیاز است`);
      return false;
    }

    this.player.money -= weapon.price;
    soundManager.playBuySound();

    if (weapon.slot === 4) {
      // Grenades slot: append or update
      if (!this.player.slots[4]) {
        this.player.slots[4] = [];
      }
      this.player.slots[4].push({
        weapon,
        clip: 1,
        reserveAmmo: 1,
        currentFireMode: 'semi'
      });
      this.switchSlot(4);
    } else {
      // Primary, Secondary or 3rd Perk Slot
      let targetSlot: WeaponSlotType = weapon.slot;
      if (this.player.slots[weapon.slot] && this.player.hasTripleWeaponPerk && !this.player.slots[6]) {
        targetSlot = 6;
      }
      this.player.slots[targetSlot] = {
        weapon,
        clip: weapon.clipSize,
        reserveAmmo: weapon.maxReserveAmmo,
        currentFireMode: weapon.defaultFireMode
      };
      this.switchSlot(targetSlot);
    }

    this.callbacks.onScreenMessage('خرید انجام شد', weapon.name);
    this.callbacks.onPlayerUpdate(this.player);
    return true;
  }

  public buyEquipment(equipId: 'kevlar' | 'kevlar_helmet' | 'defuse_kit' | 'triple_weapon_perk') {
    const item = EQUIPMENT_REGISTRY[equipId];
    if (this.player.money < item.price) {
      this.callbacks.onScreenMessage('بودجه کافی نیست!', `$${item.price} مورد نیاز است`);
      return false;
    }

    this.player.money -= item.price;
    soundManager.playBuySound();

    if (equipId === 'kevlar') {
      this.player.armor = 100;
    } else if (equipId === 'kevlar_helmet') {
      this.player.armor = 100;
      this.player.hasHelmet = true;
    } else if (equipId === 'defuse_kit') {
      this.player.hasDefuseKit = true;
    } else if (equipId === 'triple_weapon_perk') {
      this.player.hasTripleWeaponPerk = true;
      this.callbacks.onScreenMessage('قابلیت ۳ اسلحه فعال شد!', 'اکنون می‌توانید ۳ اسلحه همزمان حمل کنید (کلید ۶)');
    }

    this.callbacks.onScreenMessage('تجهیزات دریافت شد', item.name);
    this.callbacks.onPlayerUpdate(this.player);
    return true;
  }

  public dropCurrentWeapon() {
    if (this.player.activeSlot !== 1 && this.player.activeSlot !== 2 && this.player.activeSlot !== 6) return;

    const currentSlot = this.player.slots[this.player.activeSlot];
    if (!currentSlot || !('weapon' in currentSlot)) return;

    // Create 3D dropped item on ground in front of player
    const dropModel = createWeaponViewModel(currentSlot.weapon.id);
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, this.player.yaw, 0, 'YXZ'));
    const dropPos = this.camera.position.clone().add(forward.multiplyScalar(1.5));
    dropPos.y = 0.3;
    dropModel.position.copy(dropPos);
    dropModel.rotation.set(Math.PI / 2, 0, this.player.yaw);
    this.scene.add(dropModel);

    this.droppedWeapons.push({
      id: Math.random().toString(36).substring(2, 9),
      weapon: currentSlot.weapon,
      clip: currentSlot.clip,
      reserveAmmo: currentSlot.reserveAmmo,
      position: dropPos,
      mesh: dropModel,
      velocity: new THREE.Vector3(forward.x * 4, 1.5, forward.z * 4),
      grounded: false
    });

    this.player.slots[this.player.activeSlot] = null;
    this.switchSlot(this.player.slots[1] ? 1 : this.player.slots[2] ? 2 : this.player.slots[6] ? 6 : 3);
    this.callbacks.onScreenMessage('اسلحه انداخته شد', currentSlot.weapon.persianName || currentSlot.weapon.name);
  }

  public getNearbyDroppedWeapon(): DroppedWeaponItem | null {
    if (!this.camera || this.droppedWeapons.length === 0) return null;
    let closest: DroppedWeaponItem | null = null;
    let minDistance = 3.6; // 3.6 meters interaction radius
    const camPos = this.camera.position;
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);

    for (const drop of this.droppedWeapons) {
      const dist = camPos.distanceTo(drop.position);
      if (dist < minDistance) {
        const toDrop = new THREE.Vector3().subVectors(drop.position, camPos).normalize();
        const dot = camDir.dot(toDrop);
        if (dot > 0.25 || dist < 2.0) {
          minDistance = dist;
          closest = drop;
        }
      }
    }
    return closest;
  }

  public pickupWeapon(drop: DroppedWeaponItem) {
    const slotType = drop.weapon.slot;
    if (slotType !== 1 && slotType !== 2) return;

    let targetSlot: WeaponSlotType = slotType;

    // Check if slot 1 or 2 is full and player has Triple Weapon Perk
    if (this.player.slots[1] && this.player.slots[2] && this.player.hasTripleWeaponPerk) {
      if (!this.player.slots[6]) {
        targetSlot = 6;
      } else if (this.player.activeSlot === 6) {
        targetSlot = 6;
      } else if (this.player.activeSlot === 1 || this.player.activeSlot === 2) {
        targetSlot = this.player.activeSlot;
      } else {
        targetSlot = 6;
      }
    } else if (this.player.activeSlot === 6 && this.player.hasTripleWeaponPerk) {
      targetSlot = 6;
    }

    const currentSlot = this.player.slots[targetSlot];

    // If player already holds a weapon in this target slot, drop the current one cleanly!
    if (currentSlot && 'weapon' in currentSlot) {
      const dropModel = createWeaponViewModel(currentSlot.weapon.id);
      const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, this.player.yaw, 0, 'YXZ'));
      const dropPos = this.camera.position.clone().add(forward.clone().multiplyScalar(1.2));
      dropPos.y = 0.3;
      dropModel.position.copy(dropPos);
      dropModel.rotation.set(Math.PI / 2, 0, this.player.yaw);
      this.scene.add(dropModel);

      this.droppedWeapons.push({
        id: Math.random().toString(36).substring(2, 9),
        weapon: currentSlot.weapon,
        clip: currentSlot.clip,
        reserveAmmo: currentSlot.reserveAmmo,
        position: dropPos,
        mesh: dropModel,
        velocity: new THREE.Vector3(forward.x * 2.5, 1.2, forward.z * 2.5),
        grounded: false
      });
    }

    // Equip the picked weapon
    this.player.slots[targetSlot] = {
      weapon: drop.weapon,
      clip: drop.clip,
      reserveAmmo: drop.reserveAmmo,
      currentFireMode: drop.weapon.defaultFireMode
    };

    // Remove the item from the map
    const idx = this.droppedWeapons.indexOf(drop);
    if (idx !== -1) {
      this.scene.remove(drop.mesh);
      this.droppedWeapons.splice(idx, 1);
    }

    soundManager.playBuySound();
    this.callbacks.onScreenMessage('اسلحه برداشته شد', drop.weapon.persianName);
    this.switchSlot(targetSlot);
    this.callbacks.onPlayerUpdate(this.player);
  }

  public reload() {
    const slotData = this.getCurrentActiveSlotData();
    if (!slotData || this.player.isReloading) return;
    if (slotData.clip >= slotData.weapon.clipSize || slotData.reserveAmmo <= 0) return;

    this.player.isReloading = true;
    soundManager.playReload();
    this.callbacks.onScreenMessage('در حال خشاب‌گذاری...', '');

    setTimeout(() => {
      if (!this.player.isReloading) return;
      const needed = slotData.weapon.clipSize - slotData.clip;
      const canTake = this.matchSettings.infiniteAmmo ? needed : Math.min(needed, slotData.reserveAmmo);
      slotData.clip += canTake;
      if (!this.matchSettings.infiniteAmmo) {
        slotData.reserveAmmo -= canTake;
      }
      this.player.isReloading = false;
      this.callbacks.onPlayerUpdate(this.player);
    }, slotData.weapon.reloadTimeMs);
  }

  public shoot() {
    if (this.player.health <= 0 || !this.isRoundActive || this.isPaused) return;

    const slotData = this.getCurrentActiveSlotData();
    if (!slotData) return;

    const now = performance.now();

    // Knife attack
    if (slotData.weapon.id === 'knife') {
      if (now - this.player.lastShotTime < slotData.weapon.fireRateMs) return;
      this.player.lastShotTime = now;
      this.executeKnifeAttack(false);
      return;
    }

    // Grenade throw
    if (slotData.weapon.slot === 4) {
      if (now - this.player.lastShotTime < 1000) return;
      this.player.lastShotTime = now;
      this.throwGrenade(slotData.weapon.id as 'he_grenade' | 'flashbang' | 'smoke', 22);
      return;
    }

    // Guns firing check
    if (this.player.isReloading) return;

    if (slotData.clip <= 0) {
      soundManager.playDryFire();
      this.reload();
      return;
    }

    if (now - this.player.lastShotTime < slotData.weapon.fireRateMs) return;

    // Burst Fire handling (FAMAS / Glock)
    if (slotData.currentFireMode === 'burst') {
      this.fireBurstSequence(slotData);
      return;
    }

    // Single / Auto shot
    this.player.lastShotTime = now;
    if (!this.matchSettings.infiniteAmmo) {
      slotData.clip--;
    }

    this.executeSingleShot(slotData.weapon);
    this.callbacks.onPlayerUpdate(this.player);
  }

  public secondaryAction() {
    const slotData = this.getCurrentActiveSlotData();
    if (!slotData) return;

    // Knife heavy backstab
    if (slotData.weapon.id === 'knife') {
      const now = performance.now();
      if (now - this.player.lastShotTime < 700) return;
      this.player.lastShotTime = now;
      this.executeKnifeAttack(true);
      return;
    }

    // AWP / Scout Sniper Scope
    if (slotData.weapon.hasScope) {
      const levels = slotData.weapon.scopeLevels || [25, 10];
      this.player.scopeLevel = (this.player.scopeLevel + 1) % (levels.length + 1);

      if (this.player.scopeLevel === 0) {
        this.player.isScoped = false;
        this.camera.fov = 75;
      } else {
        this.player.isScoped = true;
        this.camera.fov = levels[this.player.scopeLevel - 1];
      }
      this.camera.updateProjectionMatrix();
      this.callbacks.onPlayerUpdate(this.player);
      return;
    }

    // FAMAS / Glock Burst Mode toggle via Right Click!
    if (slotData.weapon.availableFireModes.includes('burst')) {
      this.toggleFireMode();
      return;
    }

    // Underhand short grenade toss
    if (slotData.weapon.slot === 4) {
      const now = performance.now();
      if (now - this.player.lastShotTime < 1000) return;
      this.player.lastShotTime = now;
      this.throwGrenade(slotData.weapon.id as 'he_grenade' | 'flashbang' | 'smoke', 11);
    }
  }

  private fireBurstSequence(slotData: { weapon: import('../types').WeaponDef; clip: number; reserveAmmo: number }) {
    if (this.player.isFiringBurst) return;
    this.player.isFiringBurst = true;
    this.player.lastShotTime = performance.now() + 320; // reset delay after burst

    let shots = 0;
    const burstCount = slotData.weapon.burstCount || 3;
    const interval = slotData.weapon.burstDelayMs || 65;

    const timer = setInterval(() => {
      if (slotData.clip > 0 && shots < burstCount) {
        if (!this.matchSettings.infiniteAmmo) {
          slotData.clip--;
        }
        this.executeSingleShot(slotData.weapon);
        shots++;
        this.callbacks.onPlayerUpdate(this.player);
      } else {
        clearInterval(timer);
        this.player.isFiringBurst = false;
      }
    }, interval);
  }

  private executeSingleShot(weapon: import('../types').WeaponDef) {
    soundManager.playWeaponShot(weapon.id);
    this.continuousShotsCount++;

    // Viewmodel Recoil & Muzzle flash
    this.viewmodelRecoilZ = weapon.category === 'heavy' ? 0.22 : 0.14;
    this.viewmodelRecoilRotX = weapon.category === 'heavy' ? 0.22 : 0.16;
    if (this.muzzleFlashLight) {
      this.muzzleFlashLight.intensity = weapon.category === 'heavy' ? 9.0 : 6.0;
    }

    // Camera recoil kick & Negev recoil stabilization
    let kick = weapon.recoilKickback;
    let spread = weapon.recoilSpread;

    if (weapon.id === 'negev') {
      if (this.continuousShotsCount > 10) {
        // Negev laser mode after initial warmup
        spread = 0.003;
        kick = 0.005;
      }
    }

    this.player.pitch += kick * (0.8 + Math.random() * 0.4);
    this.player.yaw += (Math.random() - 0.5) * spread * 0.8;
    this.player.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.player.pitch));

    // Send shot event over multiplayer network
    if (mpClient.isConnected && mpClient.currentRoomId) {
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      mpClient.sendShoot(
        weapon.id,
        { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z },
        { x: dir.x, y: dir.y, z: dir.z }
      );
    }

    // Enemy target meshes (Bots + Remote Players)
    const enemyBots = this.bots.filter(b => !b.isDead && (b.team !== this.player.team || this.matchSettings.friendlyFire));
    const targetMeshes: THREE.Object3D[] = [];

    enemyBots.forEach(bot => {
      bot.mesh.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          child.userData.botRef = bot;
          targetMeshes.push(child);
        }
      });
    });

    const remotePlayerTargets = this.mpManager ? this.mpManager.getRaycastTargets(this.matchSettings.friendlyFire, this.player.team) : [];

    const pellets = weapon.pelletsCount || 1;

    for (let p = 0; p < pellets; p++) {
      const raycaster = new THREE.Raycaster();
      const screenX = pellets > 1 ? (Math.random() - 0.5) * 0.09 : 0;
      const screenY = pellets > 1 ? (Math.random() - 0.5) * 0.09 : 0;
      raycaster.setFromCamera(new THREE.Vector2(screenX, screenY), this.camera);

      const intersects = raycaster.intersectObjects([...targetMeshes, ...remotePlayerTargets, ...this.mapData.objects]);

      if (intersects.length > 0) {
        const hit = intersects[0];
        this.createTracer(this.camera.position, hit.point);

        // 1. Bot Hit
        if (hit.object.userData && hit.object.userData.botRef) {
          const bot = hit.object.userData.botRef as BotEntity;
          const isHead = hit.object.userData.isHead || (hit.distance < 2.5 && hit.point.y > 2.3);

          let damage = isHead ? weapon.damageHead : weapon.damageBody;

          // Apply Armor absorption
          if (bot.armor > 0) {
            if (isHead) {
              if (bot.hasHelmet) {
                soundManager.playHeadshotDink();
                damage = Math.round(damage * 0.75);
              }
            } else {
              damage = Math.round(damage * 0.55);
              bot.armor = Math.max(0, bot.armor - 20);
            }
          }

          this.callbacks.onHitMarker();
          soundManager.playHitMarker();
          this.damageBot(bot, damage, isHead, this.player.name, weapon.name, weapon.id);
        }
        // 2. Remote Multiplayer Human Player Hit
        else if (hit.object.userData && hit.object.userData.remotePlayerId) {
          const victimId = hit.object.userData.remotePlayerId;
          const isHead = !!hit.object.userData.isHead;
          const damage = isHead ? weapon.damageHead : weapon.damageBody;

          this.callbacks.onHitMarker();
          if (isHead) soundManager.playHeadshotDink();
          else soundManager.playHitMarker();

          if (mpClient.isConnected && mpClient.currentRoomId) {
            mpClient.sendDamage(
              victimId,
              damage,
              isHead,
              mpClient.myPlayerId || this.player.name,
              this.player.name,
              this.player.team,
              weapon.id,
              weapon.persianName || weapon.name
            );
          }
        }
      }
    }
  }

  private executeKnifeAttack(isHeavy: boolean) {
    soundManager.playKnifeSlash();
    this.viewmodelRecoilZ = 0.25;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    raycaster.far = 3.2;

    const enemyBots = this.bots.filter(b => !b.isDead && (b.team !== this.player.team || this.matchSettings.friendlyFire));
    const targetMeshes: THREE.Object3D[] = [];
    enemyBots.forEach(bot => {
      bot.mesh.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          child.userData.botRef = bot;
          targetMeshes.push(child);
        }
      });
    });

    const intersects = raycaster.intersectObjects(targetMeshes);
    if (intersects.length > 0) {
      const hit = intersects[0];
      const bot = hit.object.userData.botRef as BotEntity;

      // Check if attack is from behind (Backstab)
      const botForward = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(0, bot.mesh.rotation.y, 0));
      const playerDir = new THREE.Vector3().subVectors(this.camera.position, bot.position).normalize();
      const dot = botForward.dot(playerDir);
      const isBackstab = dot < -0.4;

      const damage = isBackstab ? 100 : isHeavy ? 65 : 35;
      soundManager.playKnifeHit(isBackstab);
      this.callbacks.onHitMarker();
      this.damageBot(bot, damage, isBackstab, this.player.name, 'چاقوی رزمی', 'knife');
    }
  }

  private throwGrenade(type: 'he_grenade' | 'flashbang' | 'smoke', speed: number) {
    soundManager.playGrenadePin();

    const grenadeMesh = createWeaponViewModel(type);
    grenadeMesh.position.copy(this.camera.position);
    this.scene.add(grenadeMesh);

    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);

    const grenade: ActiveGrenadeEntity = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      position: this.camera.position.clone().add(dir.clone().multiplyScalar(0.6)),
      velocity: dir.clone().multiplyScalar(speed).add(new THREE.Vector3(0, 3, 0)),
      mesh: grenadeMesh,
      fuseTimer: 2.2,
      exploded: false,
      throwerName: this.player.name,
      throwerTeam: this.player.team
    };

    this.activeGrenades.push(grenade);

    // Remove thrown grenade from inventory
    const grenades = this.player.slots[4];
    if (grenades) {
      grenades.splice(this.player.activeGrenadeIndex, 1);
      if (grenades.length > 0) {
        this.player.activeGrenadeIndex = Math.min(this.player.activeGrenadeIndex, grenades.length - 1);
      } else {
        this.switchSlot(this.player.slots[1] ? 1 : 2);
      }
    }
    this.callbacks.onPlayerUpdate(this.player);
  }

  private createTracer(from: THREE.Vector3, to: THREE.Vector3) {
    const points = [from.clone().add(new THREE.Vector3(0, -0.2, 0)), to];
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0xffdf78, transparent: true, opacity: 0.85 });
    const line = new THREE.Line(geom, mat);
    this.scene.add(line);

    setTimeout(() => {
      this.scene.remove(line);
      geom.dispose();
      mat.dispose();
    }, 60);
  }

  private damageBot(bot: BotEntity, damage: number, isHeadshot: boolean, attackerName: string, weaponName: string, weaponId: WeaponId) {
    if (bot.isDead) return;

    bot.health -= damage;

    if (bot.health <= 0) {
      bot.isDead = true;
      this.scene.remove(bot.mesh);

      // Reward player if they got the kill
      if (attackerName === this.player.name) {
        this.player.kills++;
        this.player.score += isHeadshot ? 3 : 2;
        const reward = WEAPON_REGISTRY[weaponId]?.killReward || 300;
        this.player.money += reward;
        this.callbacks.onScreenMessage(
          isHeadshot ? 'هدشات!' : 'دشمن از پای درآمد',
          `+ $${reward}`
        );
      }

      // Bot drops their weapon onto the ground!
      const dropModel = createWeaponViewModel(bot.weapon.id);
      dropModel.position.copy(bot.position);
      dropModel.position.y = 0.25;
      dropModel.rotation.set(Math.PI / 2, 0, Math.random() * Math.PI * 2);
      this.scene.add(dropModel);

      this.droppedWeapons.push({
        id: Math.random().toString(36).substring(2, 9),
        weapon: bot.weapon,
        clip: bot.weapon.clipSize,
        reserveAmmo: bot.weapon.maxReserveAmmo,
        position: dropModel.position.clone(),
        mesh: dropModel,
        velocity: new THREE.Vector3(0, 0, 0),
        grounded: true
      });

      this.callbacks.onKillFeed({
        id: Math.random().toString(36).substring(2, 9),
        killerName: attackerName,
        killerTeam: attackerName === this.player.name ? this.player.team : (bot.team === 'T' ? 'CT' : 'T'),
        victimName: bot.name,
        victimTeam: bot.team,
        weaponName,
        weaponId,
        isHeadshot
      });

      this.checkRoundStatus();
    }
  }

  private checkRoundStatus() {
    const aliveT = this.bots.filter(b => !b.isDead && b.team === 'T').length + (this.player.team === 'T' && this.player.health > 0 ? 1 : 0);
    const aliveCT = this.bots.filter(b => !b.isDead && b.team === 'CT').length + (this.player.team === 'CT' && this.player.health > 0 ? 1 : 0);

    if (aliveT === 0) {
      this.endRound('CT', 'تمام تروریست‌ها نابود شدند!');
    } else if (aliveCT === 0) {
      this.endRound('T', 'تمام ضد تروریست‌ها نابود شدند!');
    }
  }

  private endRound(winningTeam: Team, reason: string) {
    if (!this.isRoundActive) return;
    this.isRoundActive = false;

    if (winningTeam === 'T') {
      this.scoreT++;
      soundManager.playRadio('Terrorists Win!');
    } else {
      this.scoreCT++;
      soundManager.playRadio('Counter-Terrorists Win!');
    }

    const isWinner = this.player.team === winningTeam;
    this.player.money += isWinner ? 3250 : 1400;

    this.callbacks.onRoundEnd(winningTeam, reason);
    this.callbacks.onMatchStatsUpdate(this.scoreT, this.scoreCT, this.roundTimeRemaining);

    setTimeout(() => {
      this.startNewRound(false);
    }, 4500);
  }

  private onPlayerDeath(killerName: string, weaponName: string) {
    this.player.deaths++;
    this.player.health = 0;
    this.callbacks.onScreenMessage('شما کشته شدید!', `توسط: ${killerName} (${weaponName})`);
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    this.isSpectating = true;
    this.callbacks.onPlayerUpdate(this.player);
    this.checkRoundStatus();
  }

  public spectateNext() {
    const aliveBots = this.bots.filter(b => !b.isDead);
    if (aliveBots.length === 0) return;
    this.spectateIndex = (this.spectateIndex + 1) % aliveBots.length;
  }

  // Update Bot Behaviors & AI
  private updateBots(delta: number) {
    const diff = this.matchSettings.difficulty;
    const diffMulti = diff === 'easy' ? 0.4 : diff === 'medium' ? 0.75 : diff === 'hard' ? 1.0 : 1.35;

    this.bots.forEach(bot => {
      if (bot.isDead) return;

      // Check if bot is blinded
      if (bot.blindTimer > 0) {
        bot.blindTimer -= delta;
        return;
      }

      // Target selection: Player or enemy bots
      let targetPos: THREE.Vector3 | null = null;
      let targetObj: { isPlayer: boolean; botRef?: BotEntity } | null = null;

      if (bot.team !== this.player.team && this.player.health > 0) {
        const botHead = bot.position.clone().add(new THREE.Vector3(0, 2.5, 0));
        const playerHead = this.camera.position.clone();
        if (this.hasLineOfSight(botHead, playerHead)) {
          targetPos = playerHead;
          targetObj = { isPlayer: true };
        }
      }

      if (!targetPos) {
        const enemies = this.bots.filter(e => !e.isDead && e.team !== bot.team);
        for (let enemy of enemies) {
          const botHead = bot.position.clone().add(new THREE.Vector3(0, 2.5, 0));
          const enemyHead = enemy.position.clone().add(new THREE.Vector3(0, 2.5, 0));
          if (this.hasLineOfSight(botHead, enemyHead)) {
            targetPos = enemyHead;
            targetObj = { isPlayer: false, botRef: enemy };
            break;
          }
        }
      }

      // Bot Movement & Engagement
      const moveDir = new THREE.Vector3();
      const botSpeed = 4.5 * diffMulti;

      if (targetPos) {
        // Face enemy
        bot.mesh.lookAt(targetPos.x, bot.position.y, targetPos.z);

        const dist = bot.position.distanceTo(targetPos);
        if (dist > 16) {
          // Approach
          moveDir.subVectors(targetPos, bot.position).setY(0).normalize();
        } else {
          // Strafe left/right
          const forward = new THREE.Vector3().subVectors(targetPos, bot.position).setY(0).normalize();
          const side = new THREE.Vector3(-forward.z, 0, forward.x);
          moveDir.copy(side).multiplyScalar(Math.sin(performance.now() * 0.003 + bot.walkCycle) > 0 ? 1 : -1);
        }

        // Shoot at target
        bot.shootCooldown -= delta;
        if (bot.shootCooldown <= 0) {
          bot.shootCooldown = Math.max(0.2, (bot.reactionTimeMin + Math.random() * (bot.reactionTimeMax - bot.reactionTimeMin)));

          const hitChance = bot.aimAccuracy;
          const isHit = Math.random() < hitChance;

          if (isHit) {
            soundManager.playWeaponShot(bot.weapon.id);
            const isHead = Math.random() < 0.25;
            let rawDmg = (isHead ? bot.weapon.damageHead : bot.weapon.damageBody) * (0.65 * diffMulti);

            if (targetObj?.isPlayer) {
              if (this.player.armor > 0) {
                if (isHead && this.player.hasHelmet) {
                  soundManager.playHeadshotDink();
                  rawDmg *= 0.55;
                } else {
                  rawDmg *= 0.5;
                  this.player.armor = Math.max(0, this.player.armor - 15);
                }
              }

              this.player.health = Math.max(0, this.player.health - Math.round(rawDmg));
              this.screenShakeIntensity = 0.15;
              this.callbacks.onPlayerUpdate(this.player);

              if (this.player.health <= 0) {
                this.onPlayerDeath(bot.name, bot.weapon.name);
                this.callbacks.onKillFeed({
                  id: Math.random().toString(36).substring(2, 9),
                  killerName: bot.name,
                  killerTeam: bot.team,
                  victimName: this.player.name,
                  victimTeam: this.player.team,
                  weaponName: bot.weapon.name,
                  weaponId: bot.weapon.id,
                  isHeadshot: isHead
                });
              }
            } else if (targetObj?.botRef && !targetObj.botRef.isDead) {
              this.damageBot(targetObj.botRef, Math.round(rawDmg), isHead, bot.name, bot.weapon.name, bot.weapon.id);
            }
          }
        }
      } else {
        // Patrol towards waypoints
        if (!bot.patrolTarget || bot.position.distanceTo(bot.patrolTarget) < 4) {
          const randWp = this.mapData.patrolWaypoints[Math.floor(Math.random() * this.mapData.patrolWaypoints.length)];
          bot.patrolTarget = randWp.clone();
        }
        moveDir.subVectors(bot.patrolTarget, bot.position).setY(0).normalize();
        bot.mesh.lookAt(bot.position.x + moveDir.x, bot.position.y, bot.position.z + moveDir.z);
      }

      // Move bot with collision
      if (moveDir.lengthSq() > 0.01) {
        const nextPos = bot.position.clone().addScaledVector(moveDir, botSpeed * delta);
        const botBox = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(nextPos.x, 1.5, nextPos.z),
          new THREE.Vector3(1.1, 3.0, 1.1)
        );

        let blocked = false;
        for (let col of this.mapData.colliders) {
          if (col.intersectsBox(botBox)) {
            blocked = true;
            break;
          }
        }

        if (!blocked) {
          bot.position.copy(nextPos);
          bot.mesh.position.copy(bot.position);
        } else {
          bot.patrolTarget = null;
        }

        // Animate walking legs
        bot.walkCycle += delta * botSpeed * 3;
      }
    });
  }

  private hasLineOfSight(from: THREE.Vector3, to: THREE.Vector3): boolean {
    // Check if smoke cloud blocks LOS
    for (let smoke of this.smokeClouds) {
      if (smoke.position.distanceTo(from) < smoke.radius || smoke.position.distanceTo(to) < smoke.radius) {
        return false;
      }
      // Check segment intersection with smoke sphere
      const dir = new THREE.Vector3().subVectors(to, from);
      const toSmoke = new THREE.Vector3().subVectors(smoke.position, from);
      const proj = toSmoke.dot(dir.clone().normalize());
      if (proj > 0 && proj < dir.length()) {
        const closest = from.clone().add(dir.clone().normalize().multiplyScalar(proj));
        if (closest.distanceTo(smoke.position) < smoke.radius) {
          return false;
        }
      }
    }

    const dir = new THREE.Vector3().subVectors(to, from);
    const dist = dir.length();
    dir.normalize();

    const ray = new THREE.Raycaster(from, dir, 0.1, dist);
    const hits = ray.intersectObjects(this.mapData.objects);
    return hits.length === 0;
  }

  // Update Grenade Physics & Explosions
  private updateGrenades(delta: number) {
    for (let i = this.activeGrenades.length - 1; i >= 0; i--) {
      const g = this.activeGrenades[i];
      g.fuseTimer -= delta;

      // Physics integration
      g.velocity.y -= 25 * delta; // Gravity
      const nextPos = g.position.clone().addScaledVector(g.velocity, delta);

      // Collision with floor and walls
      if (nextPos.y <= 0.15) {
        nextPos.y = 0.15;
        g.velocity.y *= -0.45;
        g.velocity.x *= 0.65;
        g.velocity.z *= 0.65;
        if (Math.abs(g.velocity.y) > 1.5) {
          soundManager.playGrenadeBounce();
        }
      }

      g.position.copy(nextPos);
      g.mesh.position.copy(g.position);
      g.mesh.rotation.x += g.velocity.z * delta * 2;
      g.mesh.rotation.z += g.velocity.x * delta * 2;

      // Detonation
      if (g.fuseTimer <= 0 && !g.exploded) {
        g.exploded = true;
        this.detonateGrenade(g);
        this.scene.remove(g.mesh);
        this.activeGrenades.splice(i, 1);
      }
    }

    // Update Smoke Clouds
    for (let i = this.smokeClouds.length - 1; i >= 0; i--) {
      const s = this.smokeClouds[i];
      s.lifetimeRemaining -= delta;
      if (s.lifetimeRemaining <= 0) {
        this.scene.remove(s.mesh);
        this.smokeClouds.splice(i, 1);
      }
    }
  }

  private createExplosionVFX(pos: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Dynamic bright orange light flash
    const light = new THREE.PointLight(0xff7700, 35, 25);
    light.position.set(0, 1, 0);
    group.add(light);

    // Fireball core mesh
    const coreGeo = new THREE.SphereGeometry(2.4, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffaa22,
      transparent: true,
      opacity: 0.95
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // Shockwave ring
    const shockGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.85
    });
    const shockwaveMesh = new THREE.Mesh(shockGeo, shockMat);
    group.add(shockwaveMesh);

    // Flying sparks / embers
    const particles: { mesh: THREE.Mesh; velocity: THREE.Vector3 }[] = [];
    const sparkGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

    for (let p = 0; p < 28; p++) {
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.position.set((Math.random() - 0.5) * 0.5, 0.5, (Math.random() - 0.5) * 0.5);
      group.add(spark);

      const angle = Math.random() * Math.PI * 2;
      const elev = (Math.random() * 0.8 + 0.2) * Math.PI * 0.5;
      const speed = 12 + Math.random() * 18;
      particles.push({
        mesh: spark,
        velocity: new THREE.Vector3(
          Math.cos(angle) * Math.cos(elev) * speed,
          Math.sin(elev) * speed,
          Math.sin(angle) * Math.cos(elev) * speed
        )
      });
    }

    // Expanding dark smoke puffs
    const smokePuffs: { mesh: THREE.Mesh; velocity: THREE.Vector3 }[] = [];
    const smokeGeo = new THREE.SphereGeometry(1.3, 8, 8);
    const smokeMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      transparent: true,
      opacity: 0.75,
      roughness: 0.9
    });

    for (let s = 0; s < 10; s++) {
      const puff = new THREE.Mesh(smokeGeo, smokeMat.clone());
      puff.position.set((Math.random() - 0.5) * 1.0, 0.8, (Math.random() - 0.5) * 1.0);
      group.add(puff);
      smokePuffs.push({
        mesh: puff,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          2.5 + Math.random() * 3,
          (Math.random() - 0.5) * 3
        )
      });
    }

    this.scene.add(group);
    this.activeExplosions.push({
      group,
      light,
      coreMesh,
      shockwaveMesh,
      particles,
      smokePuffs,
      age: 0,
      maxAge: 1.5
    });
  }

  private updateExplosions(delta: number) {
    for (let i = this.activeExplosions.length - 1; i >= 0; i--) {
      const ex = this.activeExplosions[i];
      ex.age += delta;
      const progress = ex.age / ex.maxAge;

      if (progress >= 1.0) {
        this.scene.remove(ex.group);
        this.activeExplosions.splice(i, 1);
        continue;
      }

      // Fireball expands and fades
      const coreScale = 1.0 + progress * 3.2;
      ex.coreMesh.scale.set(coreScale, coreScale, coreScale);
      (ex.coreMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.95 * (1 - progress * 1.3));

      // Shockwave expands fast
      const shockScale = 1.0 + progress * 6.5;
      ex.shockwaveMesh.scale.set(shockScale, shockScale, shockScale);
      (ex.shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 * (1 - progress));

      // Light flash decays
      ex.light.intensity = 35 * (1 - progress);

      // Embers fly outward and drop
      ex.particles.forEach(p => {
        p.velocity.y -= 22 * delta; // gravity
        p.mesh.position.addScaledVector(p.velocity, delta);
        if (p.mesh.position.y < 0.1) {
          p.mesh.position.y = 0.1;
          p.velocity.set(0, 0, 0);
        }
      });

      // Smoke puffs rise & expand
      ex.smokePuffs.forEach(s => {
        s.mesh.position.addScaledVector(s.velocity, delta);
        const sScale = 1.0 + progress * 2.5;
        s.mesh.scale.set(sScale, sScale, sScale);
        (s.mesh.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 0.75 * (1 - progress));
      });
    }
  }

  private detonateGrenade(g: ActiveGrenadeEntity) {
    if (g.type === 'he_grenade') {
      soundManager.playExplosion();
      this.createExplosionVFX(g.position);
      this.screenShakeIntensity = 0.6;

      const blastRadius = 14; // Increased lethal blast radius
      const maxDamage = 135;

      // Damage bots in blast radius
      this.bots.forEach(bot => {
        if (bot.isDead) return;
        const dist = bot.position.distanceTo(g.position);
        if (dist <= blastRadius) {
          const dmg = Math.round((1 - dist / blastRadius) * maxDamage);
          this.damageBot(bot, dmg, false, g.throwerName, 'نارنجک دستی انفجاری HE', 'he_grenade');
        }
      });

      // Damage player if in radius
      const pDist = this.camera.position.distanceTo(g.position);
      if (pDist <= blastRadius) {
        const pDmg = Math.round((1 - pDist / blastRadius) * (maxDamage - 15));
        this.player.health = Math.max(0, this.player.health - pDmg);
        this.callbacks.onPlayerUpdate(this.player);
        if (this.player.health <= 0) {
          this.onPlayerDeath(g.throwerName, 'نارنجک دستی HE');
        }
      }
    } else if (g.type === 'flashbang') {
      soundManager.playFlashbangDetonate();

      // Check if player is facing the flash
      const pPos = this.camera.position.clone();
      const dist = pPos.distanceTo(g.position);

      if (dist < 35 && this.hasLineOfSight(pPos, g.position)) {
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);
        const flashDir = new THREE.Vector3().subVectors(g.position, pPos).normalize();
        const dot = camDir.dot(flashDir);

        if (dot > -0.2) {
          // Full blind
          this.player.flashBlindLevel = 1.0;
          this.player.flashDurationRemaining = 4.0;
          this.callbacks.onPlayerUpdate(this.player);
        }
      }

      // Blind bots in view
      this.bots.forEach(bot => {
        if (bot.isDead) return;
        if (bot.position.distanceTo(g.position) < 30) {
          bot.blindTimer = 4.5;
        }
      });
    } else if (g.type === 'smoke') {
      soundManager.playSmokeHiss();

      // Create 3D smoke cloud volume
      const smokeGroup = new THREE.Group();
      const smokeMat = new THREE.MeshStandardMaterial({
        color: 0x9fa8a3,
        transparent: true,
        opacity: 0.82,
        roughness: 0.95
      });

      for (let j = 0; j < 14; j++) {
        const r = 2.5 + Math.random() * 1.5;
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), smokeMat);
        sphere.position.set(
          (Math.random() - 0.5) * 5,
          1.5 + Math.random() * 2.5,
          (Math.random() - 0.5) * 5
        );
        smokeGroup.add(sphere);
      }

      smokeGroup.position.copy(g.position);
      smokeGroup.position.y = 0;
      this.scene.add(smokeGroup);

      this.smokeClouds.push({
        id: Math.random().toString(36).substring(2, 9),
        position: g.position.clone(),
        mesh: smokeGroup,
        lifetimeRemaining: 18,
        radius: 6
      });
    }
  }

  // Update Dropped Weapons on ground
  private updateDroppedWeapons(delta: number) {
    for (let i = this.droppedWeapons.length - 1; i >= 0; i--) {
      const drop = this.droppedWeapons[i];

      // Proximity auto-pickup by player if slot is empty
      const dist = this.camera.position.distanceTo(drop.position);
      if (dist < 2.5) {
        const slotType = drop.weapon.slot;
        if (slotType === 1 || slotType === 2) {
          if (!this.player.slots[slotType]) {
            this.pickupWeapon(drop);
            continue;
          }
        }
      }

      // Gentle floating spin
      drop.mesh.rotation.y += delta * 1.2;
    }
  }

  private updatePlayerPhysics(delta: number) {
    if (this.player.health <= 0 || !this.isRoundActive || this.isPaused) return;

    // Speeds: Knife is 15% faster, Crouching is slow
    const isHoldingKnife = this.player.activeSlot === 3;
    const baseSpeed = isHoldingKnife ? 16 : 14;
    const isCrouch = !!this.keys['ControlLeft'] || !!this.player.isCrouching;
    const isWalk = !!this.keys['ShiftLeft'] || !!this.player.isWalking;
    const speed = isWalk ? 6 : isCrouch ? 5 : baseSpeed;

    const moveVector = new THREE.Vector3();
    if (this.keys['KeyW']) moveVector.z -= 1;
    if (this.keys['KeyS']) moveVector.z += 1;
    if (this.keys['KeyA']) moveVector.x -= 1;
    if (this.keys['KeyD']) moveVector.x += 1;

    // Merge Virtual Joystick Move Vector from Mobile
    if (this.virtualMoveVector.x !== 0 || this.virtualMoveVector.y !== 0) {
      moveVector.x += this.virtualMoveVector.x;
      moveVector.z += this.virtualMoveVector.y;
    }

    if (moveVector.lengthSq() > 0.001) {
      moveVector.normalize();
      moveVector.applyEuler(new THREE.Euler(0, this.player.yaw, 0, 'YXZ'));
    }

    const eyeHeight = isCrouch ? 1.5 : 2.4;
    const curX = this.camera.position.x;
    const curZ = this.camera.position.z;
    const curY = this.camera.position.y;
    const curFeetY = curY - eyeHeight;
    const playerRadius = 0.52;

    // 1. Calculate ground height directly beneath the player footprint
    let groundY = 0.0; // Base ground level
    for (const box of this.mapData.colliders) {
      // Check if box overlaps horizontally with player footprint
      if (
        curX + playerRadius > box.min.x &&
        curX - playerRadius < box.max.x &&
        curZ + playerRadius > box.min.z &&
        curZ - playerRadius < box.max.z
      ) {
        // Can step up onto stairs or platforms if top is <= feetY + 0.65m
        if (box.max.y <= curFeetY + 0.65) {
          if (box.max.y > groundY) {
            groundY = box.max.y;
          }
        }
      }
    }

    const targetCameraY = groundY + eyeHeight;

    // Continuous jump check if Space is held while grounded
    if (this.keys['Space'] && this.player.isGrounded) {
      const jumpImpulse = this.matchSettings.lowGravity ? 12.0 : 8.8;
      this.playerVelocityY = jumpImpulse;
      this.player.isGrounded = false;
      this.camera.position.y += 0.08;
    }

    // Kinematic vertical physics & gravity integration
    const grav = this.matchSettings.lowGravity ? 16 : 28;
    if (!this.player.isGrounded) {
      this.playerVelocityY -= grav * delta;
      this.camera.position.y += this.playerVelocityY * delta;

      if (this.camera.position.y <= targetCameraY) {
        this.camera.position.y = targetCameraY;
        this.playerVelocityY = 0;
        this.player.isGrounded = true;
      }
    } else {
      // Smoothly step up/down stairs and platforms
      if (Math.abs(this.camera.position.y - targetCameraY) < 0.6) {
        this.camera.position.y = targetCameraY;
      } else if (this.camera.position.y > targetCameraY + 0.1) {
        // Walking off a ledge / platform
        this.player.isGrounded = false;
        this.playerVelocityY = 0;
      } else {
        this.camera.position.y = targetCameraY;
      }
    }

    // 2. Solid Collision Checking against all doors, walls, crates, railings, and obstacles
    const dx = moveVector.x * speed * delta;
    const dz = moveVector.z * speed * delta;

    const isBoxBlocked = (testX: number, testY: number, testZ: number): boolean => {
      const feet = testY - eyeHeight;
      // Box extends from feet + 0.48 (allows stepping up onto stairs <= 0.45m) to head testY + 0.2
      const testBox = new THREE.Box3(
        new THREE.Vector3(testX - playerRadius, feet + 0.48, testZ - playerRadius),
        new THREE.Vector3(testX + playerRadius, testY + 0.2, testZ + playerRadius)
      );
      for (const box of this.mapData.colliders) {
        if (box.intersectsBox(testBox)) {
          return true;
        }
      }
      return false;
    };

    if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
      // Try full move
      if (!isBoxBlocked(curX + dx, this.camera.position.y, curZ + dz)) {
        this.camera.position.x = curX + dx;
        this.camera.position.z = curZ + dz;
      } else {
        // Sliding along walls & doors: Try X-only
        if (!isBoxBlocked(curX + dx, this.camera.position.y, curZ)) {
          this.camera.position.x = curX + dx;
        }
        // Sliding along walls & doors: Try Z-only
        if (!isBoxBlocked(this.camera.position.x, this.camera.position.y, curZ + dz)) {
          this.camera.position.z = curZ + dz;
        }
      }
    }

    // Gun bobbing
    if (moveVector.lengthSq() > 0.01 && this.player.isGrounded) {
      this.gunBobTimer += delta * 12;
      this.viewmodelContainer.position.y = Math.sin(this.gunBobTimer) * 0.015;
      this.viewmodelContainer.position.x = Math.cos(this.gunBobTimer * 0.5) * 0.015;
    } else {
      this.viewmodelContainer.position.set(0, 0, 0);
    }

    // Camera rotation
    this.camera.rotation.set(this.player.pitch, this.player.yaw, 0, 'YXZ');

    // Flashbang fade
    if (this.player.flashBlindLevel > 0) {
      this.player.flashBlindLevel = Math.max(0, this.player.flashBlindLevel - delta * 0.25);
      this.callbacks.onPlayerUpdate(this.player);
    }

    // Recoil recovery
    this.viewmodelRecoilZ *= 0.84;
    this.viewmodelRecoilRotX *= 0.84;
    this.viewmodelContainer.position.z = -this.viewmodelRecoilZ;
    this.viewmodelContainer.rotation.x = this.viewmodelRecoilRotX;

    if (this.muzzleFlashLight) {
      this.muzzleFlashLight.intensity *= 0.55;
    }
  }

  private updateSpectatorCamera() {
    if (!this.isSpectating || this.player.health > 0) return;
    const aliveBots = this.bots.filter(b => !b.isDead);
    if (aliveBots.length === 0) return;

    const target = aliveBots[this.spectateIndex % aliveBots.length];
    if (target) {
      const pos = target.position.clone();
      this.camera.position.set(pos.x, pos.y + 3.8, pos.z + 5.5);
      this.camera.lookAt(pos.x, pos.y + 1.8, pos.z);
    }
  }

  public updateViewmodel() {
    while (this.viewmodelContainer.children.length > 0) {
      this.viewmodelContainer.remove(this.viewmodelContainer.children[0]);
    }

    const slotData = this.getCurrentActiveSlotData();
    if (!slotData) return;

    const vm = createWeaponViewModel(slotData.weapon.id);
    this.viewmodelContainer.add(vm);
    this.viewmodelContainer.visible = !this.player.isScoped && this.player.health > 0;
  }

  // C4 Gameplay Mechanics
  public getNearbyBombsite(): 'A' | 'B' | null {
    if (!this.camera || !this.mapData || !this.mapData.bombSites) return null;
    const pos = this.camera.position;

    // Site A: Open Platform (at x: 65, z: -65, floor y >= 1.0)
    const distHorizA = Math.hypot(pos.x - this.mapData.bombSites.siteA.x, pos.z - this.mapData.bombSites.siteA.z);
    const isOnUpperFloor = pos.y >= 1.0;

    if (distHorizA < 22 && isOnUpperFloor) {
      return 'A';
    }

    // If upperFloorSafeOnly setting is enabled (default), ONLY Site A is active for planting!
    if (this.matchSettings.upperFloorSafeOnly) {
      return null;
    }

    // Otherwise, Site B is also available on ground level
    const distB = pos.distanceTo(this.mapData.bombSites.siteB);
    if (distB < 22) return 'B';
    return null;
  }

  public getNearbyPlantedC4(): PlantedC4Entity | null {
    if (!this.plantedC4 || this.plantedC4.isDefused || this.plantedC4.isExploded || !this.camera) return null;
    if (this.camera.position.distanceTo(this.plantedC4.position) < 5.0) {
      return this.plantedC4;
    }
    return null;
  }

  public plantBombAtCurrentPosition(site: 'A' | 'B') {
    if (this.plantedC4 || !this.isRoundActive) return;

    // Create 3D planted bomb on floor
    const { group, light } = createPlantedC4Mesh();
    const bombPos = this.camera.position.clone();
    // Position on current floor surface directly under player
    const eyeHeight = this.player.isCrouching ? 1.5 : 2.4;
    bombPos.y = Math.max(0.05, this.camera.position.y - eyeHeight + 0.05);
    group.position.copy(bombPos);
    this.scene.add(group);

    this.plantedC4 = {
      id: Math.random().toString(36).substring(2, 9),
      position: bombPos,
      site,
      planterName: this.player.name,
      timerRemaining: 45,
      mesh: group,
      light,
      isDefused: false,
      isExploded: false,
      lastBeepTime: performance.now()
    };

    // Remove C4 from player inventory
    this.player.slots[5] = null;
    this.player.isPlantingBomb = false;
    this.player.plantProgress = 0;
    this.switchSlot(this.player.slots[1] ? 1 : 2);

    this.roundTimeRemaining = 45;
    soundManager.playRadio('The bomb has been planted!');
    const siteTitle = site === 'A' ? 'سایت A (فضای باز)' : 'سایت B';
    this.callbacks.onScreenMessage(`بمب در ${siteTitle} کاشته شد!`, '۴۵ ثانیه تا انفجار کامل');
    this.callbacks.onPlayerUpdate(this.player);
  }

  public defusePlantedBomb() {
    if (!this.plantedC4 || this.plantedC4.isDefused || !this.isRoundActive) return;
    this.plantedC4.isDefused = true;
    this.player.isDefusingBomb = false;
    this.player.defuseProgress = 0;
    soundManager.playC4DefusedSound();
    this.endRound('CT', 'بمب خنثی شد - پیروزی ضدتروریست‌ها!');
  }

  public detonatePlantedC4() {
    if (!this.plantedC4 || this.plantedC4.isExploded || !this.isRoundActive) return;
    this.plantedC4.isExploded = true;
    const bombPos = this.plantedC4.position.clone();

    // Remove mesh and spawn massive explosion
    this.scene.remove(this.plantedC4.mesh);
    this.createExplosionVFX(bombPos);
    soundManager.playC4NuclearExplosion();
    this.screenShakeIntensity = 1.8;

    // Kill all bots within 55m radius
    this.bots.forEach(bot => {
      if (!bot.isDead) {
        const dist = bot.position.distanceTo(bombPos);
        if (dist < 55) {
          this.damageBot(bot, 999, false, 'C4 Explosive', 'انفجار بمب C4', 'c4');
        }
      }
    });

    // Kill player if in radius
    const pDist = this.camera.position.distanceTo(bombPos);
    if (pDist < 55 && this.player.health > 0) {
      this.player.health = 0;
      this.onPlayerDeath('C4 Explosive', 'انفجار اتمی بمب C4');
    }

    const siteTitle = this.plantedC4.site === 'A' ? 'سایت A (فضای باز)' : 'سایت B';
    this.endRound('T', `انفجار موفق C4 در ${siteTitle} - پیروزی تروریست‌ها!`);
  }

  private updateC4(delta: number) {
    const now = performance.now();

    // 1. Player Planting Check (T team holding C4 in Bombsite)
    const bombsite = this.getNearbyBombsite();
    const isHoldingC4 = this.player.activeSlot === 5 && !!this.player.slots[5];
    const isHoldingPlantKey = this.isMouseDown || this.keys['KeyE'] || this.isTouchPlanting;

    // Helpful guide if player tries to plant on ground level while upper floor safe mode is active
    if (this.player.team === 'T' && isHoldingC4 && isHoldingPlantKey && !bombsite && this.matchSettings.upperFloorSafeOnly) {
      const distHorizA = Math.hypot(this.camera.position.x - 65, this.camera.position.z - (-65));
      if (distHorizA < 30 && this.camera.position.y < 1.0) {
        this.callbacks.onScreenMessage('کاشت در فضای باز!', 'کمی از پله‌ها بالا بروید و بمب را در فضای باز سایت A بکارید');
      }
    }

    if (this.player.team === 'T' && isHoldingC4 && bombsite && isHoldingPlantKey && this.isRoundActive && !this.isPaused) {
      this.player.isPlantingBomb = true;
      this.player.plantProgress = Math.min(1.0, (this.player.plantProgress || 0) + delta / 3.2);

      this.c4PlantSoundTimer += delta;
      if (this.c4PlantSoundTimer >= 0.28) {
        this.c4PlantSoundTimer = 0;
        soundManager.playC4PlantSound();
      }

      if (this.player.plantProgress >= 1.0) {
        this.plantBombAtCurrentPosition(bombsite);
      }
      this.callbacks.onPlayerUpdate(this.player);
    } else if (this.player.isPlantingBomb) {
      this.player.isPlantingBomb = false;
      this.player.plantProgress = 0;
      this.callbacks.onPlayerUpdate(this.player);
    }

    // 2. Player Defusing Check (CT team near planted C4 holding E)
    const nearbyPlanted = this.getNearbyPlantedC4();
    const isHoldingDefuseKey = this.keys['KeyE'] || this.isTouchDefusing;

    if (this.player.team === 'CT' && nearbyPlanted && isHoldingDefuseKey && this.isRoundActive && !this.isPaused) {
      this.player.isDefusingBomb = true;
      const defuseTime = this.player.hasDefuseKit ? 5.0 : 10.0;
      this.player.defuseProgress = Math.min(1.0, (this.player.defuseProgress || 0) + delta / defuseTime);

      this.c4DefuseSoundTimer += delta;
      if (this.c4DefuseSoundTimer >= 0.25) {
        this.c4DefuseSoundTimer = 0;
        soundManager.playC4DefuseTick();
      }

      if (this.player.defuseProgress >= 1.0) {
        this.defusePlantedBomb();
      }
      this.callbacks.onPlayerUpdate(this.player);
    } else if (this.player.isDefusingBomb) {
      this.player.isDefusingBomb = false;
      this.player.defuseProgress = 0;
      this.callbacks.onPlayerUpdate(this.player);
    }

    // 3. Planted C4 Timer countdown and accelerated beeping
    if (this.plantedC4 && !this.plantedC4.isDefused && !this.plantedC4.isExploded && this.isRoundActive && !this.isPaused) {
      this.plantedC4.timerRemaining -= delta;
      this.roundTimeRemaining = Math.max(0, Math.ceil(this.plantedC4.timerRemaining));

      // Accelerating beep interval
      const beepIntervalMs = Math.max(90, (this.plantedC4.timerRemaining / 45.0) * 1000);
      if (now - this.plantedC4.lastBeepTime >= beepIntervalMs) {
        this.plantedC4.lastBeepTime = now;
        soundManager.playC4Beep(this.plantedC4.timerRemaining);
        if (this.plantedC4.light) {
          this.plantedC4.light.intensity = 12;
          setTimeout(() => {
            if (this.plantedC4 && this.plantedC4.light) {
              this.plantedC4.light.intensity = 0.5;
            }
          }, 60);
        }
      }

      if (this.plantedC4.timerRemaining <= 0) {
        this.detonatePlantedC4();
      }
    }
  }

  // Mobile Virtual Touch Controller API
  public setVirtualMoveVector(x: number, y: number) {
    this.virtualMoveVector.x = x;
    this.virtualMoveVector.y = y;
  }

  public addTouchLook(dx: number, dy: number) {
    const zoomScale = this.camera ? this.camera.fov / 75.0 : 1.0;
    this.player.yaw -= dx * this.mouseSensitivity * 1.5 * zoomScale;
    this.player.pitch -= dy * this.mouseSensitivity * 1.5 * zoomScale;

    const maxPitch = Math.PI / 2 - 0.05;
    this.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.player.pitch));
  }

  public touchAction(action: string, isDown: boolean = true) {
    if (action === 'shoot') {
      this.isMouseDown = isDown;
      if (isDown) this.shoot();
      else this.continuousShotsCount = 0;
    } else if (action === 'secondary') {
      if (isDown) this.secondaryAction();
    } else if (action === 'jump') {
      if (isDown && this.player.isGrounded) {
        const jumpImpulse = this.matchSettings.lowGravity ? 12.0 : 8.8;
        this.playerVelocityY = jumpImpulse;
        this.player.isGrounded = false;
        this.camera.position.y += 0.05;
      }
    } else if (action === 'reload') {
      if (isDown) this.reload();
    } else if (action === 'drop') {
      if (isDown) this.dropCurrentWeapon();
    } else if (action === 'interact') {
      if (isDown) {
        const drop = this.getNearbyDroppedWeapon();
        if (drop) this.pickupWeapon(drop);
      }
    } else if (action === 'plant') {
      this.isTouchPlanting = isDown;
    } else if (action === 'defuse') {
      this.isTouchDefusing = isDown;
    }
  }

  private setupEventListeners() {
    window.addEventListener('resize', () => {
      if (this.camera && this.renderer) {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }
    });

    this.canvas.addEventListener('click', () => {
      if (this.isRoundActive && !this.isPaused && !document.pointerLockElement) {
        this.canvas.requestPointerLock();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === this.canvas && !this.isPaused) {
        const mx = Math.max(-80, Math.min(80, e.movementX || 0));
        const my = Math.max(-80, Math.min(80, e.movementY || 0));

        const zoomScale = this.camera.fov / 75.0;
        this.player.yaw -= mx * this.mouseSensitivity * zoomScale;
        this.player.pitch -= my * this.mouseSensitivity * zoomScale;

        const maxPitch = Math.PI / 2 - 0.05;
        this.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.player.pitch));
      }
    });

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Key 'O' release pointer lock and show mouse cursor / open settings
      if (e.code === 'KeyO') {
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
        if (this.callbacks.onOpenSettingsModal) {
          this.callbacks.onOpenSettingsModal();
        }
      }

      // Instant velocity Jump
      if (e.code === 'Space' && this.isRoundActive && !this.isPaused) {
        if (this.player.isGrounded) {
          const jumpImpulse = this.matchSettings.lowGravity ? 12.0 : 8.8;
          this.playerVelocityY = jumpImpulse;
          this.player.isGrounded = false;
          this.camera.position.y += 0.05;
        }
      }

      // Pickup weapon with [E]
      if (e.code === 'KeyE' && this.isRoundActive && !this.isPaused) {
        const nearbyDrop = this.getNearbyDroppedWeapon();
        if (nearbyDrop) {
          this.pickupWeapon(nearbyDrop);
        }
      }

      // Slot Switching
      if (e.code === 'Digit1') this.switchSlot(1);
      if (e.code === 'Digit2') this.switchSlot(2);
      if (e.code === 'Digit3') this.switchSlot(3);
      if (e.code === 'Digit4') this.switchSlot(4);
      if (e.code === 'Digit5') this.switchSlot(5);
      if (e.code === 'Digit6') this.switchSlot(6);
      if (e.code === 'KeyQ') this.quickSwitch();

      // Drop Weapon
      if (e.code === 'KeyG') this.dropCurrentWeapon();

      // Reload
      if (e.code === 'KeyR') this.reload();

      // Toggle Fire Mode (FAMAS / Glock)
      if (e.code === 'KeyF') this.toggleFireMode();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousedown', (e) => {
      if (document.pointerLockElement === this.canvas && this.isRoundActive && !this.isPaused) {
        if (e.button === 0) {
          this.isMouseDown = true;
          this.shoot();
        } else if (e.button === 2) {
          this.isRightMouseDown = true;
          this.secondaryAction();
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isMouseDown = false;
        this.continuousShotsCount = 0;
      }
      if (e.button === 2) this.isRightMouseDown = false;
    });

    window.addEventListener('contextmenu', e => e.preventDefault());

    // Mouse Wheel Slot cycling
    window.addEventListener('wheel', (e) => {
      if (document.pointerLockElement === this.canvas && this.isRoundActive) {
        const slots: WeaponSlotType[] = [1, 2, 3, 4, 5, 6];
        const validSlots = slots.filter(s => {
          if (s === 1) return !!this.player.slots[1];
          if (s === 2) return !!this.player.slots[2];
          if (s === 3) return !!this.player.slots[3];
          if (s === 4) return !!this.player.slots[4] && this.player.slots[4].length > 0;
          if (s === 5) return !!this.player.slots[5];
          if (s === 6) return !!this.player.slots[6];
          return false;
        });

        if (validSlots.length > 0) {
          const currentIndex = validSlots.indexOf(this.player.activeSlot);
          if (e.deltaY > 0) {
            const nextSlot = validSlots[(currentIndex + 1) % validSlots.length];
            this.switchSlot(nextSlot);
          } else {
            const prevSlot = validSlots[(currentIndex - 1 + validSlots.length) % validSlots.length];
            this.switchSlot(prevSlot);
          }
        }
      }
    });
  }

  public startLoop() {
    const loop = () => {
      this.animationFrameId = requestAnimationFrame(loop);

      const now = performance.now();
      const delta = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      if (this.isRoundActive && !this.isPaused) {
        // Continuous auto-firing
        if (this.isMouseDown) {
          const slot = this.getCurrentActiveSlotData();
          if (slot && (slot.currentFireMode === 'auto' || slot.weapon.id === 'knife')) {
            this.shoot();
          }
        }

        this.updatePlayerPhysics(delta);
        this.updateBots(delta);
        this.updateGrenades(delta);
        this.updateExplosions(delta);
        this.updateC4(delta);
        this.updateDroppedWeapons(delta);
        this.updateSpectatorCamera();

        // Update 3D Multiplayer remote players & send local transform
        if (this.mpManager) {
          const activeSlotData = this.getCurrentActiveSlotData();
          this.mpManager.update(
            delta,
            this.camera.position,
            this.player.yaw,
            this.player.pitch,
            {
              activeWeaponId: activeSlotData?.weapon.id || 'knife',
              isFiring: this.isMouseDown,
              isCrouching: this.player.isCrouching,
              isJumping: !this.player.isGrounded,
              health: this.player.health
            }
          );
        }
      }

      this.renderer.render(this.scene, this.camera);
    };

    loop();
  }

  public destroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.roundTimerInterval) clearInterval(this.roundTimerInterval);
  }
}
