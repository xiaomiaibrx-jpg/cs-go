import React, { useRef, useState, useEffect } from 'react';
import {
  Crosshair,
  ArrowUp,
  ArrowDown,
  RotateCw,
  Hand,
  Shield,
  Heart,
  Bomb,
  Target,
  ShoppingCart,
  Sliders,
  Sparkles,
  Zap,
  Flame
} from 'lucide-react';
import { GameEngine } from '../game/gameEngine';
import { PlayerState, WeaponSlotType, KillFeedItem, Team } from '../types';

interface MobileControlsProps {
  engine: GameEngine | null;
  player: PlayerState;
  scoreT?: number;
  scoreCT?: number;
  timeRemaining?: number;
  killFeed?: KillFeedItem[];
  centerMessage?: { title: string; subtitle?: string; visible: boolean };
  hitMarkerActive?: boolean;
  onOpenBuyMenu: () => void;
  onOpenSettings: () => void;
  onTogglePause: () => void;
  isNearbyWeapon: boolean;
  isNearbyBombsite: boolean;
  isNearbyPlantedBomb: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  engine,
  player,
  scoreT = 0,
  scoreCT = 0,
  timeRemaining = 0,
  killFeed = [],
  centerMessage = { title: '', visible: false },
  hitMarkerActive = false,
  onOpenBuyMenu,
  onOpenSettings,
  onTogglePause,
  isNearbyWeapon,
  isNearbyBombsite,
  isNearbyPlantedBomb
}) => {
  // Format Round Time
  const mins = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
  const secs = (timeRemaining % 60).toString().padStart(2, '0');

  // Active weapon slot data
  const currentSlotData = engine?.getCurrentActiveSlotData();
  const activeWeapon = currentSlotData?.weapon;
  const clip = currentSlotData?.clip ?? 0;
  const reserveAmmo = currentSlotData?.reserveAmmo ?? 0;
  const fireMode = currentSlotData?.currentFireMode ?? 'auto';
  // Joystick State
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const joystickTouchIdRef = useRef<number | null>(null);
  const joystickCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Touch Look State (Right side swipe)
  const lookAreaRef = useRef<HTMLDivElement | null>(null);
  const lookTouchIdRef = useRef<number | null>(null);
  const lastLookPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle Joystick Touch
  const handleJoystickStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (joystickTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;

    const rect = joystickRef.current?.getBoundingClientRect();
    if (rect) {
      joystickCenterRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
    setJoystickActive(true);
    handleJoystickMove(e);
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (joystickTouchIdRef.current === null || !engine) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        const dx = touch.clientX - joystickCenterRef.current.x;
        const dy = touch.clientY - joystickCenterRef.current.y;
        const maxDist = 45;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        const clampedX = Math.cos(angle) * clampedDist;
        const clampedY = Math.sin(angle) * clampedDist;

        setJoystickPos({ x: clampedX, y: clampedY });

        // Normalize to -1 ... 1 for engine
        const normX = clampedX / maxDist;
        const normY = clampedY / maxDist;
        engine.setVirtualMoveVector(normX, normY);
        break;
      }
    }
  };

  const handleJoystickEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setJoystickActive(false);
        setJoystickPos({ x: 0, y: 0 });
        if (engine) {
          engine.setVirtualMoveVector(0, 0);
        }
        break;
      }
    }
  };

  // Handle Aiming / Camera Look Touch
  const handleLookStart = (e: React.TouchEvent) => {
    if (lookTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    lookTouchIdRef.current = touch.identifier;
    lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookMove = (e: React.TouchEvent) => {
    if (lookTouchIdRef.current === null || !engine) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        const dx = touch.clientX - lastLookPosRef.current.x;
        const dy = touch.clientY - lastLookPosRef.current.y;
        lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };

        engine.addTouchLook(dx, dy);
        break;
      }
    }
  };

  const handleLookEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        break;
      }
    }
  };

  const triggerAction = (action: string, isDown: boolean = true) => {
    if (!engine) return;
    engine.touchAction(action, isDown);
  };

  const isHoldingC4 = player.activeSlot === 5 && !!player.slots[5];

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none overflow-hidden touch-none font-['Teko',sans-serif]">
      
      {/* Damage Overlay */}
      {player.health > 0 && player.health < 30 && (
        <div className="absolute inset-0 border-[4px] sm:border-[8px] border-red-600/60 pointer-events-none animate-pulse opacity-50 z-10" />
      )}

      {/* Hit Marker */}
      {hitMarkerActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="relative w-8 h-8 opacity-80">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[1px] h-3 bg-white -rotate-45 -translate-x-[4px] -translate-y-[4px] shadow-[0_0_2px_rgba(0,0,0,1)]" />
              <div className="w-[1px] h-3 bg-white rotate-45 translate-x-[4px] -translate-y-[4px] shadow-[0_0_2px_rgba(0,0,0,1)]" />
              <div className="w-[1px] h-3 bg-white -rotate-45 translate-x-[4px] translate-y-[4px] shadow-[0_0_2px_rgba(0,0,0,1)]" />
              <div className="w-[1px] h-3 bg-white rotate-45 -translate-x-[4px] translate-y-[4px] shadow-[0_0_2px_rgba(0,0,0,1)]" />
            </div>
          </div>
        </div>
      )}

      {/* Crosshair */}
      {player.health > 0 && !player.isScoped && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="relative w-1.5 h-1.5 flex items-center justify-center">
            <div className="absolute w-[3px] h-[3px] bg-green-400 rounded-sm" />
            <div className="absolute w-1.5 h-[1.5px] bg-green-400 -translate-x-2" />
            <div className="absolute w-1.5 h-[1.5px] bg-green-400 translate-x-2" />
            <div className="absolute w-[1.5px] h-1.5 bg-green-400 -translate-y-2" />
            <div className="absolute w-[1.5px] h-1.5 bg-green-400 translate-y-2" />
          </div>
        </div>
      )}

      {/* Scope Overlay */}
      {player.health > 0 && player.isScoped && (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-[80vh] aspect-square rounded-full border-[100px] border-black/90">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-[1px] bg-red-500/80" />
              <div className="h-full w-[1px] bg-red-500/80 absolute" />
              <div className="w-[10px] h-[10px] bg-red-500 rounded-full shadow-[0_0_10px_red] absolute" />
            </div>
          </div>
        </div>
      )}

      {/* Top Bar HUD (Score, Time, Shortcuts) */}
      <div className="absolute top-2 left-0 right-0 flex justify-center items-start px-2 pointer-events-none z-50">
        
        {/* Left Side: Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto absolute left-2 top-0">
          <button
            onClick={onOpenBuyMenu}
            className="bg-amber-600/90 active:scale-90 active:bg-amber-500 text-black font-black px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 shadow-lg border border-amber-400"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> خرید
          </button>
          <button
            onClick={onOpenSettings}
            className="bg-zinc-900/90 active:scale-90 text-white font-bold px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 border border-zinc-700 shadow"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" /> منو
          </button>
        </div>

        {/* Center: Scoreboard */}
        <div className="flex items-center bg-black/60 backdrop-blur-md rounded-xl border border-white/10 p-1 shadow-2xl">
          <div className="flex flex-col items-center bg-emerald-900/60 px-3 py-0.5 rounded-l-lg border-r border-white/10">
            <Shield className="w-3 h-3 text-emerald-400 mb-0.5" />
            <span className="text-xl font-black text-white leading-none">{scoreCT}</span>
          </div>
          
          <div className="flex flex-col items-center px-4">
            <div className="text-2xl font-black text-amber-400 tracking-wider leading-none">{mins}:{secs}</div>
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Round Time</div>
          </div>
          
          <div className="flex flex-col items-center bg-amber-900/60 px-3 py-0.5 rounded-r-lg border-l border-white/10">
            <Flame className="w-3 h-3 text-amber-400 mb-0.5" />
            <span className="text-xl font-black text-white leading-none">{scoreT}</span>
          </div>
        </div>
      </div>

      {/* Kill Feed */}
      <div className="absolute top-12 right-2 flex flex-col gap-1 items-end pointer-events-none z-50">
        {killFeed.slice(-3).map((kill) => (
          <div key={kill.id} className="bg-black/60 backdrop-blur-md border border-white/5 rounded-md px-2 py-0.5 flex items-center gap-2 animate-in slide-in-from-right fade-in duration-300 shadow-lg text-[10px]">
            <span className={`font-bold ${kill.killerTeam === 'T' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {kill.killer}
            </span>
            {kill.headshot ? (
              <Target className="w-3 h-3 text-red-500" />
            ) : (
              <Crosshair className="w-3 h-3 text-zinc-400" />
            )}
            <span className={`font-bold ${kill.victimTeam === 'T' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {kill.victim}
            </span>
          </div>
        ))}
      </div>

      {/* Center Message */}
      {centerMessage.visible && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50 animate-in fade-in zoom-in duration-300">
          <div className="bg-black/80 backdrop-blur-md border border-amber-500/50 rounded-2xl px-8 py-4 text-center shadow-2xl">
            <h2 className="text-4xl font-black text-white tracking-widest drop-shadow-[0_0_15px_rgba(245,158,11,0.6)] uppercase">
              {centerMessage.title}
            </h2>
            {centerMessage.subtitle && (
              <p className="text-sm text-amber-400 font-bold mt-1 tracking-wider uppercase">
                {centerMessage.subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bottom Health & Ammo Area */}
      <div className="absolute bottom-24 left-2 right-2 flex justify-between items-end pointer-events-none z-40">
        
        {/* Left: Health & Armor */}
        <div className="flex gap-2">
          <div className="bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10 flex items-center gap-2 shadow-xl">
            <Heart className={`w-5 h-5 ${player.health <= 20 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`} />
            <span className={`text-3xl font-black leading-none ${player.health <= 20 ? 'text-red-500' : 'text-white'}`}>
              {Math.max(0, Math.floor(player.health))}
            </span>
          </div>
          <div className="bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10 flex items-center gap-2 shadow-xl">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="text-3xl font-black text-white leading-none">
              {Math.floor(player.armor)}
            </span>
          </div>
        </div>

        {/* Right: Ammo */}
        {activeWeapon && (
          <div className="bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 flex items-center gap-3 shadow-xl">
            <div className="flex flex-col items-end leading-none">
              <span className="text-zinc-400 text-[10px] font-bold uppercase">{activeWeapon.name}</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-black ${clip <= activeWeapon.clipSize * 0.25 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {clip}
                </span>
                <span className="text-xl text-zinc-500 font-bold">/</span>
                <span className="text-xl text-zinc-400 font-bold">{reserveAmmo}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Center-Top Weapon Slots Quick Bar */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-1 pointer-events-auto bg-black/60 backdrop-blur-md p-1 rounded-xl border border-zinc-800 scale-90 sm:scale-100 w-max max-w-[95vw] overflow-x-auto">
        <button
          onClick={() => triggerAction('slot1')}
          disabled={!player.slots[1]}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap max-w-[80px] sm:max-w-none truncate ${
            player.activeSlot === 1
              ? 'bg-amber-500 text-black shadow'
              : player.slots[1]
              ? 'bg-zinc-800/80 text-white'
              : 'bg-zinc-900 text-zinc-600 opacity-40'
          }`}
        >
          {player.slots[1] ? player.slots[1].weapon.name : '1. اصلی'}
        </button>

        <button
          onClick={() => triggerAction('slot2')}
          disabled={!player.slots[2]}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap max-w-[70px] sm:max-w-none truncate ${
            player.activeSlot === 2
              ? 'bg-amber-500 text-black shadow'
              : player.slots[2]
              ? 'bg-zinc-800/80 text-white'
              : 'bg-zinc-900 text-zinc-600 opacity-40'
          }`}
        >
          {player.slots[2] ? player.slots[2].weapon.name : '2. کلت'}
        </button>

        <button
          onClick={() => triggerAction('slot3')}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${
            player.activeSlot === 3 ? 'bg-amber-500 text-black shadow' : 'bg-zinc-800/80 text-white'
          }`}
        >
          {player.slots[3] ? player.slots[3].weapon.name : '3. چاقو'}
        </button>

        <button
          onClick={() => triggerAction('slot4')}
          disabled={!player.slots[4] || player.slots[4].length === 0}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${
            player.activeSlot === 4
              ? 'bg-amber-500 text-black shadow'
              : player.slots[4] && player.slots[4].length > 0
              ? 'bg-zinc-800/80 text-white'
              : 'bg-zinc-900 text-zinc-600 opacity-40'
          }`}
        >
          4. نارنجک
        </button>

        {player.slots[5] && (
          <button
            onClick={() => triggerAction('slot5')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all animate-pulse whitespace-nowrap ${
              player.activeSlot === 5 ? 'bg-red-500 text-white shadow-lg' : 'bg-red-950/80 text-red-300 border border-red-600/50'
            }`}
          >
            5. C4
          </button>
        )}
      </div>

      {/* Left Virtual Thumbstick Area */}
      <div
        className="absolute bottom-8 left-8 w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-black/40 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center pointer-events-auto touch-none shadow-2xl z-40"
        ref={joystickRef}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
      >
        <div
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 border border-white/60 shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-transform duration-75 flex items-center justify-center pointer-events-none"
          style={{
            transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
          }}
        >
          <div className="w-4 h-4 rounded-full bg-black/50" />
        </div>
      </div>

      {/* Right Camera Look Area (Full right half background) */}
      <div
        ref={lookAreaRef}
        className="absolute top-16 right-0 bottom-0 w-[60vw] pointer-events-auto touch-none z-10"
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
      />

      {/* Floating Action Buttons (Right side) */}
      <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 flex flex-col items-end gap-3 sm:gap-4 pointer-events-auto z-40 scale-100 sm:scale-110 origin-bottom-right">

        {/* C4 Plant Button (Context-sensitive) */}
        {(isHoldingC4 || isNearbyBombsite) && player.team === 'T' && (
          <button
            onTouchStart={() => triggerAction('plant_c4', true)}
            onTouchEnd={() => triggerAction('plant_c4', false)}
            className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-sm flex items-center gap-2 shadow-2xl border-2 border-red-400 animate-bounce"
          >
            <Bomb className="w-5 h-5" />
            <span>کاشتن C4</span>
          </button>
        )}

        {/* C4 Defuse Button (Context-sensitive for CT) */}
        {isNearbyPlantedBomb && (
          <button
            onTouchStart={() => triggerAction('defuse_c4', true)}
            onTouchEnd={() => triggerAction('defuse_c4', false)}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-sm flex items-center gap-2 shadow-2xl border-2 border-blue-400 animate-pulse"
          >
            <Shield className="w-5 h-5" />
            <span>خنثی‌سازی بمب</span>
          </button>
        )}

        {/* Weapon Pickup Button (Context-sensitive) */}
        {isNearbyWeapon && (
          <button
            onClick={() => triggerAction('interact')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 active:scale-90 text-white font-black text-sm flex items-center gap-2 shadow-xl border border-emerald-400 animate-pulse"
          >
            <Hand className="w-5 h-5" />
            <span>برداشتن اسلحه</span>
          </button>
        )}

        {/* Action Controls Cluster */}
        <div className="flex items-center gap-3 mb-2">
          {/* Burst / Fire mode */}
          <button
            onClick={() => triggerAction('burst')}
            className="w-12 h-12 rounded-full bg-zinc-900/90 active:scale-90 border border-zinc-700 text-amber-400 flex items-center justify-center shadow-lg"
          >
            <Zap className="w-5 h-5" />
          </button>

          {/* Scope / Aim */}
          <button
            onClick={() => triggerAction('scope')}
            className="w-14 h-14 rounded-full bg-zinc-900/90 active:scale-90 border border-zinc-700 text-amber-400 flex items-center justify-center shadow-lg"
          >
            <Target className="w-6 h-6" />
          </button>

          {/* Reload Button */}
          <button
            onClick={() => triggerAction('reload')}
            className="w-14 h-14 rounded-full bg-zinc-900/90 active:scale-90 border border-zinc-700 text-white flex items-center justify-center shadow-lg"
          >
            <RotateCw className="w-6 h-6 text-amber-400" />
          </button>

          {/* Jump Button */}
          <button
            onClick={() => triggerAction('jump')}
            className="w-16 h-16 rounded-full bg-amber-600/90 active:scale-90 text-black border border-amber-400 flex items-center justify-center shadow-2xl"
          >
            <ArrowUp className="w-8 h-8 stroke-[3]" />
          </button>
        </div>

        {/* Lower Row: Drop + Crouch + Shoot */}
        <div className="flex items-center gap-3">
          {/* Drop Gun Button */}
          <button
            onClick={() => triggerAction('drop')}
            className="w-12 h-12 rounded-full bg-zinc-900/80 active:scale-90 border border-zinc-700 text-zinc-400 flex items-center justify-center shadow text-sm font-bold"
          >
            G
          </button>

          {/* Crouch Button */}
          <button
            onTouchStart={() => triggerAction('crouch', true)}
            onTouchEnd={() => triggerAction('crouch', false)}
            className="w-14 h-14 rounded-full bg-zinc-900/90 active:scale-90 border border-zinc-700 text-white flex items-center justify-center shadow-lg"
          >
            <ArrowDown className="w-6 h-6 text-amber-400" />
          </button>

          {/* Big Fire Button */}
          <button
            onTouchStart={() => triggerAction('shoot', true)}
            onTouchEnd={() => triggerAction('shoot', false)}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 active:scale-95 active:brightness-125 border-[3px] border-white/80 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)] text-white pointer-events-auto"
          >
            <Crosshair className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.5]" />
          </button>
        </div>

      </div>

    </div>
  );
};
