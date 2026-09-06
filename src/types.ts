import * as THREE from 'three';

export type Team = 'T' | 'CT';

export type WeaponSlotType = 1 | 2 | 3 | 4 | 5 | 6; // 1: Primary, 2: Secondary, 3: Melee, 4: Grenades, 5: C4 Bomb, 6: Extra 3rd Gun (Perk)

export type FireMode = 'auto' | 'burst' | 'semi' | 'bolt';

export type WeaponId =
  | 'famas'
  | 'ak47'
  | 'm4a1'
  | 'awp'
  | 'scout'
  | 'negev'
  | 'm249'
  | 'xm1014'
  | 'nova'
  | 'mag7'
  | 'sawedoff'
  | 'spas12'
  | 'bizon'
  | 'p90'
  | 'mp5sd'
  | 'deagle'
  | 'glock'
  | 'usps'
  | 'knife'
  | 'he_grenade'
  | 'flashbang'
  | 'smoke'
  | 'c4';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  persianName: string;
  slot: WeaponSlotType;
  category: 'rifle' | 'sniper' | 'heavy' | 'shotgun' | 'smg' | 'pistol' | 'melee' | 'grenade' | 'equipment';
  price: number;
  damageBody: number;
  damageHead: number;
  damageArmLeg: number;
  clipSize: number;
  maxReserveAmmo: number;
  fireRateMs: number;
  reloadTimeMs: number;
  recoilSpread: number;
  recoilKickback: number;
  range: number;
  availableFireModes: FireMode[];
  defaultFireMode: FireMode;
  burstCount?: number;
  burstDelayMs?: number;
  pelletsCount?: number;
  hasScope?: boolean;
  scopeLevels?: number[];
  canHaveSilencer?: boolean;
  description: string;
  iconName: string;
  killReward: number;
  teamAccess: 'all' | 'T' | 'CT';
}

export interface PlayerInventorySlot {
  weapon: WeaponDef;
  clip: number;
  reserveAmmo: number;
  currentFireMode: FireMode;
  isSilenced?: boolean;
}

export interface PlayerState {
  name: string;
  team: Team;
  health: number;
  maxHealth: number;
  armor: number;
  hasHelmet: boolean;
  hasDefuseKit?: boolean;
  hasTripleWeaponPerk?: boolean; // $1000 Perk: Enables holding 3 primary/secondary firearms simultaneously
  money: number;
  kills: number;
  deaths: number;
  score: number;
  activeSlot: WeaponSlotType;
  slots: {
    1: PlayerInventorySlot | null; // Primary
    2: PlayerInventorySlot | null; // Secondary
    3: PlayerInventorySlot | null; // Melee (Knife)
    4: PlayerInventorySlot[] | null; // Grenades array
    5: PlayerInventorySlot | null; // C4 Bomb (T)
    6: PlayerInventorySlot | null; // Extra 3rd firearm (Unlocked with $1000 Perk)
  };
  activeGrenadeIndex: number;
  isReloading: boolean;
  isScoped: boolean;
  scopeLevel: number;
  lastShotTime: number;
  isFiringBurst: boolean;
  burstShotsRemaining: number;
  yaw: number;
  pitch: number;
  isGrounded: boolean;
  isCrouching: boolean;
  isWalking: boolean;
  flashBlindLevel: number; // 0 to 1
  flashDurationRemaining: number;
  knifeStabCooldown: number;
  // C4 Planting / Defusing state
  isPlantingBomb?: boolean;
  plantProgress?: number; // 0 to 1
  isDefusingBomb?: boolean;
  defuseProgress?: number; // 0 to 1
}

export interface PlantedC4Entity {
  id: string;
  position: THREE.Vector3;
  site: 'A' | 'B';
  planterName: string;
  timerRemaining: number; // 45 seconds countdown
  mesh: THREE.Group;
  light: THREE.PointLight;
  isDefused: boolean;
  isExploded: boolean;
  lastBeepTime: number;
}

export interface BotEntity {
  id: string;
  name: string;
  team: Team;
  health: number;
  armor: number;
  hasHelmet: boolean;
  isDead: boolean;
  hasC4?: boolean;
  weapon: WeaponDef;
  position: THREE.Vector3;
  mesh: THREE.Group;
  patrolTarget: THREE.Vector3 | null;
  targetEnemy: { position: THREE.Vector3; isPlayer: boolean; id?: string } | null;
  reactionTimer: number;
  shootCooldown: number;
  walkCycle: number;
  state: 'idle' | 'patrol' | 'engage' | 'flee' | 'alert';
  aimAccuracy: number;
  reactionTimeMin: number;
  reactionTimeMax: number;
  blindTimer: number;
}

export interface DroppedWeaponItem {
  id: string;
  weapon: WeaponDef;
  clip: number;
  reserveAmmo: number;
  position: THREE.Vector3;
  mesh: THREE.Group;
  velocity: THREE.Vector3;
  grounded: boolean;
}

export interface ActiveGrenadeEntity {
  id: string;
  type: 'he_grenade' | 'flashbang' | 'smoke';
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  mesh: THREE.Mesh | THREE.Group;
  fuseTimer: number;
  exploded: boolean;
  throwerName: string;
  throwerTeam: Team;
}

export interface SmokeCloudEntity {
  id: string;
  position: THREE.Vector3;
  mesh: THREE.Group;
  lifetimeRemaining: number;
  radius: number;
}

export interface BulletImpactParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
}

export interface KillFeedItem {
  id: string;
  killerName: string;
  killerTeam: Team;
  victimName: string;
  victimTeam: Team;
  weaponName: string;
  weaponId: WeaponId;
  isHeadshot: boolean;
  isWallbang?: boolean;
  isGrenade?: boolean;
}

export type BotDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type DeviceMode = 'desktop' | 'mobile';

export interface MatchSettings {
  terroristCount: number; // Configurable T count
  counterTerroristCount: number; // Configurable CT count
  difficulty: BotDifficulty;
  roundTimeSeconds: number;
  startingMoney: number;
  maxMoney: number;
  friendlyFire: boolean;
  lowGravity: boolean;
  infiniteAmmo: boolean;
  headshotsOnly: boolean;
  autoRespawn: boolean;
  upperFloorSafeOnly?: boolean; // Only allow planting the Safe (C4) on the 2nd floor with stairs
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderTeam: Team;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface RemotePlayerState {
  id: string;
  name: string;
  team: Team;
  health: number;
  maxHealth: number;
  armor: number;
  hasHelmet: boolean;
  isDead: boolean;
  position: { x: number; y: number; z: number };
  yaw: number;
  pitch: number;
  activeWeaponId: WeaponId;
  isFiring: boolean;
  isReloading: boolean;
  isCrouching: boolean;
  isJumping: boolean;
  isWalking: boolean;
  isPlanting?: boolean;
  isDefusing?: boolean;
  kills: number;
  deaths: number;
  score: number;
  ping: number;
}

export interface RemotePlayerEntity {
  state: RemotePlayerState;
  mesh: THREE.Group;
  weaponMesh?: THREE.Group;
  currentWeaponId?: WeaponId;
  targetPosition: THREE.Vector3;
  targetYaw: number;
  targetPitch: number;
  lastUpdateTime: number;
  walkCycle: number;
  muzzleFlashLight?: THREE.PointLight;
}

export interface MultiplayerRoomInfo {
  id: string;
  name: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  hasPassword?: boolean;
  scoreT: number;
  scoreCT: number;
  state: 'waiting' | 'in_progress';
}

