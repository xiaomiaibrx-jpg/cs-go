import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/gameEngine';
import { PlayerState, KillFeedItem, MatchSettings, Team, WeaponId, DeviceMode, MultiplayerRoomInfo } from './types';
import { HUD } from './components/HUD';
import { BuyMenu } from './components/BuyMenu';
import { MatchSettingsModal } from './components/MatchSettingsModal';
import { ControlsGuideModal } from './components/ControlsGuideModal';
import { PauseMenu } from './components/PauseMenu';
import { MainMenu } from './components/MainMenu';
import { DeathOverlay } from './components/DeathOverlay';
import { MobileControls } from './components/MobileControls';
import { DeviceSelectionModal } from './components/DeviceSelectionModal';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { mpClient } from './network/multiplayerClient';

const DEFAULT_MATCH_SETTINGS: MatchSettings = {
  terroristCount: 6,
  counterTerroristCount: 6,
  difficulty: 'medium',
  roundTimeSeconds: 115,
  startingMoney: 800,
  maxMoney: 16000,
  friendlyFire: false,
  lowGravity: false,
  infiniteAmmo: false,
  headshotsOnly: false,
  autoRespawn: false,
  upperFloorSafeOnly: true
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Device & Platform Selection State
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(() => {
    const saved = localStorage.getItem('cs3d_device_mode');
    return (saved === 'mobile' || saved === 'desktop') ? (saved as DeviceMode) : 'desktop';
  });
  const [isDeviceSelectionOpen, setIsDeviceSelectionOpen] = useState<boolean>(() => {
    return !localStorage.getItem('cs3d_device_mode');
  });

  // Multiplayer & Game Mode State
  const [isMultiplayerLobbyOpen, setIsMultiplayerLobbyOpen] = useState<boolean>(false);
  const [isMultiplayerGame, setIsMultiplayerGame] = useState<boolean>(false);

  // Match State
  const [matchSettings, setMatchSettings] = useState<MatchSettings>(DEFAULT_MATCH_SETTINGS);
  const [playerName, setPlayerName] = useState<string>('Player1');
  const [selectedTeam, setSelectedTeam] = useState<Team>('T');

  // Modals & Overlays
  const [isMainMenuOpen, setIsMainMenuOpen] = useState<boolean>(true);
  const [isBuyMenuOpen, setIsBuyMenuOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isControlsGuideOpen, setIsControlsGuideOpen] = useState<boolean>(false);
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState<boolean>(false);

  // In-Game UI states
  const [scoreT, setScoreT] = useState<number>(0);
  const [scoreCT, setScoreCT] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(115);
  const [killFeed, setKillFeed] = useState<KillFeedItem[]>([]);
  const [centerMessage, setCenterMessage] = useState<{ title: string; subtitle?: string; visible: boolean }>({
    title: '',
    visible: false
  });
  const [hitMarkerActive, setHitMarkerActive] = useState<boolean>(false);

  // Player state
  const [player, setPlayer] = useState<PlayerState>({
    name: 'Player1',
    team: 'T',
    health: 100,
    maxHealth: 100,
    armor: 100,
    hasHelmet: true,
    money: 800,
    kills: 0,
    deaths: 0,
    score: 0,
    activeSlot: 2,
    slots: {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null
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
  });

  const messageTimeoutRef = useRef<number | null>(null);
  const hitMarkerTimeoutRef = useRef<number | null>(null);

  const showCenterMessage = (title: string, subtitle?: string) => {
    setCenterMessage({ title, subtitle, visible: true });
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    messageTimeoutRef.current = window.setTimeout(() => {
      setCenterMessage(prev => ({ ...prev, visible: false }));
    }, 2500);
  };

  const triggerHitMarker = () => {
    setHitMarkerActive(true);
    if (hitMarkerTimeoutRef.current) clearTimeout(hitMarkerTimeoutRef.current);
    hitMarkerTimeoutRef.current = window.setTimeout(() => {
      setHitMarkerActive(false);
    }, 120);
  };

  // Initialize Game Engine on Canvas mount
  useEffect(() => {
    if (!canvasRef.current || engineRef.current) return;

    const engine = new GameEngine(canvasRef.current, matchSettings, {
      onPlayerUpdate: (updatedPlayer) => {
        setPlayer({ ...updatedPlayer });
      },
      onKillFeed: (item) => {
        setKillFeed(prev => [...prev.slice(-10), item]);
      },
      onRoundEnd: (winningTeam, reason) => {
        showCenterMessage(
          winningTeam === 'T' ? 'پیروزی تروریست‌ها (Terrorists Win)' : 'پیروزی ضد تروریست‌ها (CT Win)',
          reason
        );
      },
      onHitMarker: () => {
        triggerHitMarker();
      },
      onScreenMessage: (title, subtitle) => {
        showCenterMessage(title, subtitle);
      },
      onMatchStatsUpdate: (tScore, ctScore, time) => {
        setScoreT(tScore);
        setScoreCT(ctScore);
        setTimeRemaining(time);
      },
      onOpenSettingsModal: () => {
        setIsSettingsModalOpen(true);
      }
    });

    engineRef.current = engine;
    engine.startLoop();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMainMenuOpen) return;

      // Buy menu with 'B'
      if (e.code === 'KeyB' && !isPauseMenuOpen && !isSettingsModalOpen && !isControlsGuideOpen) {
        if (!isBuyMenuOpen) {
          if (document.pointerLockElement) document.exitPointerLock();
          setIsBuyMenuOpen(true);
        } else {
          setIsBuyMenuOpen(false);
        }
      }

      // Settings modal with 'O'
      if (e.code === 'KeyO' && !isBuyMenuOpen && !isPauseMenuOpen) {
        if (!isSettingsModalOpen) {
          if (document.pointerLockElement) document.exitPointerLock();
          setIsSettingsModalOpen(true);
        } else {
          setIsSettingsModalOpen(false);
        }
      }

      // Controls guide with 'H'
      if (e.code === 'KeyH') {
        if (!isControlsGuideOpen) {
          if (document.pointerLockElement) document.exitPointerLock();
          setIsControlsGuideOpen(true);
        } else {
          setIsControlsGuideOpen(false);
        }
      }

      // ESC: Close open modals or toggle pause menu
      if (e.code === 'Escape') {
        if (isBuyMenuOpen) {
          setIsBuyMenuOpen(false);
        } else if (isSettingsModalOpen) {
          setIsSettingsModalOpen(false);
        } else if (isControlsGuideOpen) {
          setIsControlsGuideOpen(false);
        } else if (!isPauseMenuOpen) {
          if (document.pointerLockElement) document.exitPointerLock();
          setIsPauseMenuOpen(true);
          if (engineRef.current) engineRef.current.isPaused = true;
        } else {
          setIsPauseMenuOpen(false);
          if (engineRef.current) engineRef.current.isPaused = false;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMainMenuOpen, isBuyMenuOpen, isSettingsModalOpen, isControlsGuideOpen, isPauseMenuOpen]);

  // Pointer lock change detection
  useEffect(() => {
    const handlePointerLockChange = () => {
      if (!document.pointerLockElement) {
        if (engineRef.current) {
          engineRef.current.isMouseDown = false;
          engineRef.current.isRightMouseDown = false;
        }
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => document.removeEventListener('pointerlockchange', handlePointerLockChange);
  }, []);

  const handleSelectDeviceMode = (mode: DeviceMode) => {
    setDeviceMode(mode);
    localStorage.setItem('cs3d_device_mode', mode);
    setIsDeviceSelectionOpen(false);
    showCenterMessage(
      mode === 'mobile' ? 'حالت موبایل فعال شد' : 'حالت دسکتاپ فعال شد',
      mode === 'mobile' ? 'کنترل‌های لمسی و ژیروسکوپ مجازی فعال شدند' : 'کنترل با ماوس و کیبورد فعال است'
    );
  };

  const handleToggleDeviceMode = () => {
    const newMode: DeviceMode = deviceMode === 'mobile' ? 'desktop' : 'mobile';
    setDeviceMode(newMode);
    localStorage.setItem('cs3d_device_mode', newMode);
    showCenterMessage(
      newMode === 'mobile' ? 'تغییر به حالت موبایل' : 'تغییر به حالت دسکتاپ'
    );
  };

  const handleStartOfflineGame = () => {
    if (!engineRef.current) return;
    setIsMultiplayerGame(false);
    engineRef.current.isMultiplayer = false;
    engineRef.current.player.name = playerName || 'Player1';
    engineRef.current.setPlayerTeam(selectedTeam);
    engineRef.current.updateMatchSettings(matchSettings);
    setIsMainMenuOpen(false);
    setIsPauseMenuOpen(false);
    showCenterMessage('بازی آفلاین آغاز شد!', 'برای خرید سلاح کلید B را بزنید');

    if (deviceMode === 'desktop' && canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  const handleOpenMultiplayer = () => {
    setIsMultiplayerLobbyOpen(true);
  };

  const handleJoinMultiplayerSuccess = (roomId: string, roomInfo: MultiplayerRoomInfo, playerId: string) => {
    setIsMultiplayerLobbyOpen(false);
    setIsMainMenuOpen(false);
    setIsMultiplayerGame(true);
    if (engineRef.current) {
      engineRef.current.isMultiplayer = true;
      engineRef.current.player.name = playerName || 'Player1';
      engineRef.current.setPlayerTeam(selectedTeam);
      engineRef.current.updateMatchSettings({
        ...matchSettings,
        terroristCount: 0,
        counterTerroristCount: 0
      });
    }
    showCenterMessage(
      'وارد اتاق آنلاین شدید!',
      `اتاق: ${roomInfo.name} | تیم شما: ${selectedTeam === 'T' ? 'تروریست' : 'ضدتروریست'}`
    );

    if (deviceMode === 'desktop' && canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  const handleResume = () => {
    setIsPauseMenuOpen(false);
    if (engineRef.current) {
      engineRef.current.isPaused = false;
    }
    if (deviceMode === 'desktop' && canvasRef.current && player.health > 0) {
      canvasRef.current.requestPointerLock();
    }
  };

  const handleRestartRound = () => {
    setIsPauseMenuOpen(false);
    if (engineRef.current) {
      engineRef.current.isPaused = false;
      engineRef.current.startNewRound(false);
    }
    if (deviceMode === 'desktop' && canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  const handleApplySettings = (newSettings: MatchSettings) => {
    setMatchSettings(newSettings);
    if (engineRef.current) {
      engineRef.current.updateMatchSettings(newSettings);
    }
    showCenterMessage('تنظیمات جدید اعمال شد', `تعداد تروریست‌ها: ${newSettings.terroristCount}`);
  };

  const handleSwitchTeam = (team: Team) => {
    setSelectedTeam(team);
    if (engineRef.current) {
      engineRef.current.setPlayerTeam(team);
    }
    handleRestartRound();
  };

  const handleBuyWeapon = (weaponId: WeaponId) => {
    if (engineRef.current) {
      engineRef.current.buyWeapon(weaponId);
    }
  };

  const handleBuyEquipment = (equipId: 'kevlar' | 'kevlar_helmet' | 'defuse_kit') => {
    if (engineRef.current) {
      engineRef.current.buyEquipment(equipId);
    }
  };

  const isDead = player.health <= 0 && !isMainMenuOpen && !isDeviceSelectionOpen && !isMultiplayerLobbyOpen;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* Initial Platform / Device Selection Prompt Modal */}
      <DeviceSelectionModal
        isOpen={isDeviceSelectionOpen}
        onSelectMode={handleSelectDeviceMode}
      />

      {/* Online Multiplayer Lobby Modal */}
      <MultiplayerLobby
        isOpen={isMultiplayerLobbyOpen}
        playerName={playerName}
        playerTeam={selectedTeam}
        onClose={() => setIsMultiplayerLobbyOpen(false)}
        onJoinSuccess={handleJoinMultiplayerSuccess}
        onUpdatePlayerProfile={(name, team) => {
          setPlayerName(name);
          setSelectedTeam(team);
        }}
      />

      {/* Primary In-Game Tactical HUD (Desktop Only) */}
      {!isMainMenuOpen && !isDeviceSelectionOpen && !isMultiplayerLobbyOpen && deviceMode === 'desktop' && (
        <HUD
          player={player}
          scoreT={scoreT}
          scoreCT={scoreCT}
          timeRemaining={timeRemaining}
          killFeed={killFeed}
          centerMessage={centerMessage}
          hitMarkerActive={hitMarkerActive}
          gameEngine={engineRef.current}
          onOpenBuyMenu={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsBuyMenuOpen(true);
          }}
          onOpenSettings={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsSettingsModalOpen(true);
          }}
          onOpenControls={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsControlsGuideOpen(true);
          }}
        />
      )}

      {/* Main Menu Modal */}
      <MainMenu
        isOpen={isMainMenuOpen && !isDeviceSelectionOpen && !isMultiplayerLobbyOpen}
        playerName={playerName}
        selectedTeam={selectedTeam}
        settings={matchSettings}
        deviceMode={deviceMode}
        onPlayerNameChange={setPlayerName}
        onSelectTeam={setSelectedTeam}
        onSettingsChange={setMatchSettings}
        onStartOfflineGame={handleStartOfflineGame}
        onOpenMultiplayer={handleOpenMultiplayer}
        onToggleDeviceMode={handleToggleDeviceMode}
        onOpenControls={() => setIsControlsGuideOpen(true)}
      />

      {/* Buy Menu Modal */}
      <BuyMenu
        isOpen={isBuyMenuOpen}
        playerMoney={player.money}
        hasTriplePerk={player.hasTripleWeaponPerk}
        onClose={() => {
          setIsBuyMenuOpen(false);
          if (deviceMode === 'desktop' && canvasRef.current && player.health > 0) {
            canvasRef.current.requestPointerLock();
          }
        }}
        onBuyWeapon={handleBuyWeapon}
        onBuyEquipment={handleBuyEquipment}
      />

      {/* Mobile Virtual Touch Controls (Rendered when deviceMode is mobile) */}
      {deviceMode === 'mobile' && !isMainMenuOpen && !isDeviceSelectionOpen && !isMultiplayerLobbyOpen && !isBuyMenuOpen && !isSettingsModalOpen && !isPauseMenuOpen && (
        <MobileControls
          engine={engineRef.current}
          player={player}
          scoreT={scoreT}
          scoreCT={scoreCT}
          timeRemaining={timeRemaining}
          killFeed={killFeed}
          centerMessage={centerMessage}
          hitMarkerActive={hitMarkerActive}
          onOpenBuyMenu={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsBuyMenuOpen(true);
          }}
          onOpenSettings={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsSettingsModalOpen(true);
          }}
          onTogglePause={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            setIsPauseMenuOpen(true);
            if (engineRef.current) engineRef.current.isPaused = true;
          }}
          isNearbyWeapon={!!engineRef.current?.getNearbyDroppedWeapon?.()}
          isNearbyBombsite={!!engineRef.current?.getNearbyBombsite?.()}
          isNearbyPlantedBomb={!!engineRef.current?.getNearbyPlantedC4?.()}
        />
      )}

      {/* Match & Terrorist Settings Modal */}
      <MatchSettingsModal
        isOpen={isSettingsModalOpen}
        currentSettings={matchSettings}
        onClose={() => {
          setIsSettingsModalOpen(false);
          if (deviceMode === 'desktop' && canvasRef.current && player.health > 0) {
            canvasRef.current.requestPointerLock();
          }
        }}
        onApply={handleApplySettings}
      />

      {/* Controls Guide Modal */}
      <ControlsGuideModal
        isOpen={isControlsGuideOpen}
        onClose={() => {
          setIsControlsGuideOpen(false);
          if (deviceMode === 'desktop' && canvasRef.current && player.health > 0 && !isMainMenuOpen) {
            canvasRef.current.requestPointerLock();
          }
        }}
      />

      {/* In-Game Pause Menu */}
      <PauseMenu
        isOpen={isPauseMenuOpen}
        playerTeam={player.team}
        onResume={handleResume}
        onRestartRound={handleRestartRound}
        onOpenSettings={() => {
          setIsPauseMenuOpen(false);
          setIsSettingsModalOpen(true);
        }}
        onSwitchTeam={handleSwitchTeam}
        onMainMenu={() => {
          setIsPauseMenuOpen(false);
          setIsMainMenuOpen(true);
          if (engineRef.current) engineRef.current.isRoundActive = false;
        }}
      />

      {/* Death Screen & Spectator Overlay */}
      <DeathOverlay
        isOpen={isDead && !isPauseMenuOpen && !isSettingsModalOpen}
        spectateTargetName={
          engineRef.current?.bots.filter(b => !b.isDead)[0]?.name || 'در حال جستجو...'
        }
        onSpectateNext={() => {
          if (engineRef.current) engineRef.current.spectateNext();
        }}
        onRestartRound={handleRestartRound}
      />

    </div>
  );
}
