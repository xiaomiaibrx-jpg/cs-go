import React, { useEffect, useRef, useState } from 'react';
import {
  Shield,
  ShieldAlert,
  Heart,
  Crosshair,
  Zap,
  Award,
  Target,
  Flame,
  Bomb,
  Sun,
  Cloud,
  Eye,
  RotateCw,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  AlertTriangle
} from 'lucide-react';
import { PlayerState, KillFeedItem, Team } from '../types';
import { GameEngine } from '../game/gameEngine';

interface HUDProps {
  player: PlayerState;
  scoreT: number;
  scoreCT: number;
  timeRemaining: number;
  killFeed: KillFeedItem[];
  centerMessage: { title: string; subtitle?: string; visible: boolean };
  hitMarkerActive: boolean;
  gameEngine: GameEngine | null;
  onOpenBuyMenu: () => void;
  onOpenSettings: () => void;
  onOpenControls: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  scoreT,
  scoreCT,
  timeRemaining,
  killFeed,
  centerMessage,
  hitMarkerActive,
  gameEngine,
  onOpenBuyMenu,
  onOpenSettings,
  onOpenControls
}) => {
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Radar modes: 'full_map' (shows entire Dust II) or 'rotating' (CS2 player-centric)
  const [radarMode, setRadarMode] = useState<'full_map' | 'rotating'>('full_map');
  const [radarZoom, setRadarZoom] = useState<number>(1.0);
  const [isMapEnlarged, setIsMapEnlarged] = useState<boolean>(false);
  const [aliveStats, setAliveStats] = useState({ aliveT: 0, aliveCT: 0 });

  // Active weapon slot data
  const currentSlotData = gameEngine?.getCurrentActiveSlotData();
  const activeWeapon = currentSlotData?.weapon;
  const clip = currentSlotData?.clip ?? 0;
  const reserveAmmo = currentSlotData?.reserveAmmo ?? 0;
  const fireMode = currentSlotData?.currentFireMode ?? 'auto';

  // Format Round Time
  const mins = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
  const secs = (timeRemaining % 60).toString().padStart(2, '0');

  // Key 'M' to toggle radar mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') {
        setRadarMode(prev => (prev === 'full_map' ? 'rotating' : 'full_map'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real-time 60FPS Radar Canvas Renderer
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas || !gameEngine) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let sweepAngle = 0;
    let frameCount = 0;

    const renderRadar = () => {
      frameCount++;
      sweepAngle = (sweepAngle + 0.035) % (Math.PI * 2);

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Update alive counts periodically
      if (frameCount % 20 === 0 && gameEngine) {
        const tCount =
          gameEngine.bots.filter(b => b.team === 'T' && !b.isDead).length +
          (player.team === 'T' && player.health > 0 ? 1 : 0);
        const ctCount =
          gameEngine.bots.filter(b => b.team === 'CT' && !b.isDead).length +
          (player.team === 'CT' && player.health > 0 ? 1 : 0);
        setAliveStats({ aliveT: tCount, aliveCT: ctCount });
      }

      // Live player state directly from engine
      const px = gameEngine.camera ? gameEngine.camera.position.x : 0;
      const pz = gameEngine.camera ? gameEngine.camera.position.z : 0;
      const pyaw = gameEngine.player ? gameEngine.player.yaw : 0;

      // 1. Clear background
      ctx.fillStyle = '#0a0e14';
      ctx.fillRect(0, 0, w, h);

      // Coordinate transformation function
      const worldToScreen = (wx: number, wz: number): { x: number; y: number } => {
        if (radarMode === 'full_map') {
          // Dust II bounds: [-130, 130] in X and Z (span 260)
          const scale = ((Math.min(w, h) * 0.84) / 260) * radarZoom;
          return {
            x: cx + wx * scale,
            y: cy + wz * scale
          };
        } else {
          // Centered rotating radar
          const scale = 1.85 * radarZoom;
          const dx = wx - px;
          const dz = wz - pz;
          // Local transform: X is Right, Y is Forward (Up)
          const rightComp = dx * Math.cos(pyaw) - dz * Math.sin(pyaw);
          const fwdComp = -dx * Math.sin(pyaw) - dz * Math.cos(pyaw);
          return {
            x: cx + rightComp * scale,
            y: cy - fwdComp * scale
          };
        }
      };

      // Radar radius
      const radarRadius = Math.min(w, h) * 0.48;

      ctx.save();
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.2)';
      ctx.lineWidth = 1;

      // Concentric circles
      [0.25, 0.5, 0.75, 1.0].forEach(rRatio => {
        ctx.beginPath();
        ctx.arc(cx, cy, radarRadius * rRatio, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - radarRadius, cy);
      ctx.lineTo(cx + radarRadius, cy);
      ctx.moveTo(cx, cy - radarRadius);
      ctx.lineTo(cx, cy + radarRadius);
      ctx.stroke();

      // Rotating military sweep effect
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radarRadius, sweepAngle - 0.4, sweepAngle);
      ctx.closePath();
      const sweepGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, radarRadius);
      sweepGrad.addColorStop(0, 'rgba(16, 185, 129, 0.04)');
      sweepGrad.addColorStop(1, 'rgba(16, 185, 129, 0.16)');
      ctx.fillStyle = sweepGrad;
      ctx.fill();

      // 2. Draw Dust II Key Walkable Grounds / Corridors
      const walkableZones = [
        // T Spawn Courtyard
        { x: -50, z: 80, w: 100, h: 45, color: 'rgba(30, 41, 59, 0.65)' },
        // CT Spawn Area
        { x: -50, z: -125, w: 100, h: 40, color: 'rgba(30, 41, 59, 0.65)' },
        // Mid Corridor
        { x: -26, z: -55, w: 52, h: 140, color: 'rgba(30, 41, 59, 0.75)' },
        // Long A Street
        { x: 70, z: -75, w: 55, h: 160, color: 'rgba(30, 41, 59, 0.75)' },
        // Catwalk / Short A
        { x: 0, z: -70, w: 65, h: 25, color: 'rgba(30, 41, 59, 0.75)' },
        // Bombsite A Platform
        { x: 42, z: -88, w: 46, h: 46, color: 'rgba(239, 68, 68, 0.2)' },
        // Bombsite B Courtyard
        { x: -90, z: -90, w: 48, h: 48, color: 'rgba(239, 68, 68, 0.2)' },
        // Upper B Tunnels
        { x: -78, z: 0, w: 24, h: 80, color: 'rgba(15, 23, 42, 0.9)' }
      ];

      walkableZones.forEach(zone => {
        const p1 = worldToScreen(zone.x, zone.z);
        const p2 = worldToScreen(zone.x + zone.w, zone.z);
        const p3 = worldToScreen(zone.x + zone.w, zone.z + zone.h);
        const p4 = worldToScreen(zone.x, zone.z + zone.h);

        ctx.fillStyle = zone.color;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fill();
      });

      // 3. Draw Actual 3D Map Colliders / Walls
      if (gameEngine.mapData && gameEngine.mapData.colliders) {
        ctx.fillStyle = 'rgba(71, 85, 105, 0.9)';
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 1;

        for (const box of gameEngine.mapData.colliders) {
          const p1 = worldToScreen(box.min.x, box.min.z);
          const p2 = worldToScreen(box.max.x, box.min.z);
          const p3 = worldToScreen(box.max.x, box.max.z);
          const p4 = worldToScreen(box.min.x, box.max.z);

          const minSx = Math.min(p1.x, p2.x, p3.x, p4.x);
          const maxSx = Math.max(p1.x, p2.x, p3.x, p4.x);
          const minSy = Math.min(p1.y, p2.y, p3.y, p4.y);
          const maxSy = Math.max(p1.y, p2.y, p3.y, p4.y);

          if (maxSx < -10 || minSx > w + 10 || maxSy < -10 || minSy > h + 10) continue;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }

      // 4. Draw Smoke Clouds
      if (gameEngine.smokeClouds) {
        gameEngine.smokeClouds.forEach(smoke => {
          const sp = worldToScreen(smoke.position.x, smoke.position.z);
          const smokeRadius = 14 * (radarMode === 'full_map' ? ((Math.min(w, h) * 0.84) / 260) * radarZoom : 1.85 * radarZoom);
          ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
          ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, Math.max(8, smokeRadius), 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }

      // 5. Draw Dropped Weapons
      if (gameEngine.droppedWeapons) {
        gameEngine.droppedWeapons.forEach(item => {
          const wp = worldToScreen(item.position.x, item.position.z);
          if (wp.x >= 0 && wp.x <= w && wp.y >= 0 && wp.y <= h) {
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(wp.x, wp.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // 6. Draw Bombsites A & B Badges
      const drawSiteBadge = (wx: number, wz: number, letter: string) => {
        const sp = worldToScreen(wx, wz);
        if (sp.x < -20 || sp.x > w + 20 || sp.y < -20 || sp.y > h + 20) return;

        const pulse = 10 + Math.sin(sweepAngle * 3) * 2;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, pulse + 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, sp.x, sp.y);
      };

      drawSiteBadge(65, -65, 'A');
      drawSiteBadge(-65, -65, 'B');

      // Spawn Labels
      const ctSpawnPos = worldToScreen(0, -98);
      if (ctSpawnPos.x > 10 && ctSpawnPos.x < w - 10 && ctSpawnPos.y > 10 && ctSpawnPos.y < h - 10) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CT SPAWN', ctSpawnPos.x, ctSpawnPos.y);
      }

      const tSpawnPos = worldToScreen(0, 98);
      if (tSpawnPos.x > 10 && tSpawnPos.x < w - 10 && tSpawnPos.y > 10 && tSpawnPos.y < h - 10) {
        ctx.fillStyle = 'rgba(249, 115, 22, 0.75)';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('T SPAWN', tSpawnPos.x, tSpawnPos.y);
      }

      // 7. Draw Bots (Allies and Enemies)
      if (gameEngine.bots) {
        gameEngine.bots.forEach(bot => {
          const bp = worldToScreen(bot.position.x, bot.position.z);
          if (bp.x < -10 || bp.x > w + 10 || bp.y < -10 || bp.y > h + 10) return;

          if (bot.isDead) {
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(bp.x - 3, bp.y - 3);
            ctx.lineTo(bp.x + 3, bp.y + 3);
            ctx.moveTo(bp.x + 3, bp.y - 3);
            ctx.lineTo(bp.x - 3, bp.y + 3);
            ctx.stroke();
            return;
          }

          const isTeammate = bot.team === player.team;

          if (isTeammate) {
            const teamCol = bot.team === 'CT' ? '#38bdf8' : '#f97316';
            ctx.fillStyle = teamCol;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.2;

            ctx.beginPath();
            ctx.arc(bp.x, bp.y, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(bp.x, bp.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            const pulse = 6 + Math.sin(sweepAngle * 4 + bp.x * 0.1) * 2;
            ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
            ctx.beginPath();
            ctx.arc(bp.x, bp.y, pulse + 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ef4444';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(bp.x, bp.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fee2e2';
            ctx.beginPath();
            ctx.arc(bp.x, bp.y, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // 7.5. Draw Planted C4 on Radar
      if (gameEngine.plantedC4 && !gameEngine.plantedC4.isDefused && !gameEngine.plantedC4.isExploded) {
        const c4p = worldToScreen(gameEngine.plantedC4.position.x, gameEngine.plantedC4.position.z);
        if (c4p.x >= -10 && c4p.x <= w + 10 && c4p.y >= -10 && c4p.y <= h + 10) {
          const c4Pulse = 8 + Math.sin(sweepAngle * 8) * 4;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.beginPath();
          ctx.arc(c4p.x, c4p.y, c4Pulse + 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ef4444';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(c4p.x, c4p.y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('C4', c4p.x, c4p.y);
        }
      }

      // 8. Draw Player Marker & Vision Cone (FOV)
      const playerPos = radarMode === 'rotating' ? { x: cx, y: cy } : worldToScreen(px, pz);

      let playerScreenAngle: number;
      if (radarMode === 'rotating') {
        playerScreenAngle = -Math.PI / 2;
      } else {
        playerScreenAngle = Math.atan2(-Math.cos(pyaw), -Math.sin(pyaw));
      }

      const coneLength = 36 * (radarMode === 'full_map' ? 1.0 : 1.3);
      const halfFov = (75 * Math.PI) / 360;

      const visionGrad = ctx.createRadialGradient(
        playerPos.x,
        playerPos.y,
        3,
        playerPos.x,
        playerPos.y,
        coneLength
      );
      visionGrad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
      visionGrad.addColorStop(0.8, 'rgba(16, 185, 129, 0.15)');
      visionGrad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

      ctx.fillStyle = visionGrad;
      ctx.beginPath();
      ctx.moveTo(playerPos.x, playerPos.y);
      ctx.arc(
        playerPos.x,
        playerPos.y,
        coneLength,
        playerScreenAngle - halfFov,
        playerScreenAngle + halfFov
      );
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(playerPos.x, playerPos.y);
      ctx.lineTo(
        playerPos.x + Math.cos(playerScreenAngle - halfFov) * coneLength,
        playerPos.y + Math.sin(playerScreenAngle - halfFov) * coneLength
      );
      ctx.moveTo(playerPos.x, playerPos.y);
      ctx.lineTo(
        playerPos.x + Math.cos(playerScreenAngle + halfFov) * coneLength,
        playerPos.y + Math.sin(playerScreenAngle + halfFov) * coneLength
      );
      ctx.stroke();

      // Player Beacon Body
      ctx.fillStyle = '#10b981';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(playerPos.x, playerPos.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sharp directional arrow pointing forward
      const tipX = playerPos.x + Math.cos(playerScreenAngle) * 11;
      const tipY = playerPos.y + Math.sin(playerScreenAngle) * 11;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(playerPos.x, playerPos.y);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      // "شما" (YOU) Tag
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('شما', playerPos.x, playerPos.y + 16);

      // 9. Compass Indicator
      if (radarMode === 'full_map') {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('N', cx, 14);
        ctx.fillText('S', cx, h - 6);
        ctx.fillText('W', 12, cy + 4);
        ctx.fillText('E', w - 12, cy + 4);
      } else {
        const northDir = worldToScreen(px, pz - 80);
        const ndx = northDir.x - cx;
        const ndy = northDir.y - cy;
        const dist = Math.hypot(ndx, ndy);
        if (dist > 0) {
          const nx = cx + (ndx / dist) * (radarRadius - 12);
          const ny = cy + (ndy / dist) * (radarRadius - 12);
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('N', nx, ny);
        }
      }

      ctx.restore();

      animId = requestAnimationFrame(renderRadar);
    };

    animId = requestAnimationFrame(renderRadar);
    return () => cancelAnimationFrame(animId);
  }, [gameEngine, radarMode, radarZoom, player.team, player.health]);

  return (
    <div id="hud-root" className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 select-none">
      
      {/* Flashbang Screen Blind Effect */}
      {player.flashBlindLevel > 0 && (
        <div
          id="flash-overlay"
          className="fixed inset-0 bg-white pointer-events-none z-50 transition-opacity duration-75"
          style={{ opacity: player.flashBlindLevel }}
        />
      )}

      {/* Sniper Scope Overlay for AWP / Scout */}
      {player.isScoped && (
        <div id="scope-overlay" className="fixed inset-0 pointer-events-none z-30 flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_28%,rgba(0,0,0,0.96)_62%)]" />
          <div className="absolute w-full h-[1.5px] bg-black/90 shadow-[0_0_2px_black]" />
          <div className="absolute h-full w-[1.5px] bg-black/90 shadow-[0_0_2px_black]" />
          <div className="absolute top-10 px-5 py-1.5 rounded-full bg-black/80 border border-amber-500/60 text-amber-400 font-mono text-xl tracking-widest backdrop-blur-md">
            ZOOM {player.scopeLevel === 1 ? '4X' : '8X'}
          </div>
        </div>
      )}

      {/* Dynamic Reticle Crosshair (Hidden when scoped) */}
      {!player.isScoped && (
        <div id="crosshair" className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className="absolute w-4 h-0.5 bg-[#00ff77] shadow-[0_0_2px_rgba(0,0,0,0.9)]" />
            <div className="absolute h-4 w-0.5 bg-[#00ff77] shadow-[0_0_2px_rgba(0,0,0,0.9)]" />
            <div className="w-1 h-1 rounded-full bg-[#00ff77]/80" />
          </div>
        </div>
      )}

      {/* Hit Marker Feedback */}
      {hitMarkerActive && (
        <div id="hitmarker" className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none z-30">
          <div className="absolute w-full h-0.5 bg-red-500 top-1/2 rotate-45 shadow-[0_0_4px_red]" />
          <div className="absolute w-full h-0.5 bg-red-500 top-1/2 -rotate-45 shadow-[0_0_4px_red]" />
        </div>
      )}

      {/* TOP BAR: Scores, Round Timer, Radar, Killfeed */}
      <div className="flex justify-between items-start w-full">
        
        {/* Left: Tactical Radar Minimap + Controls buttons */}
        <div className="flex flex-col gap-2">
          {/* Radar Container with Mode & Zoom Controls */}
          <div
            className={`relative rounded-2xl border-2 border-amber-600/60 overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.85)] backdrop-blur-md bg-zinc-950/90 transition-all duration-200 ${
              isMapEnlarged
                ? 'w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 ring-4 ring-amber-500/40'
                : 'w-48 h-48 sm:w-56 sm:h-56 md:w-60 md:h-60'
            }`}
          >
            {/* Top Tactical Status Bar inside Radar */}
            <div className="absolute top-1.5 inset-x-2 z-10 flex items-center justify-between pointer-events-auto bg-black/75 px-2 py-0.5 rounded-lg border border-zinc-800 text-[11px] font-mono font-bold">
              <div className="flex items-center gap-2">
                <span className="text-red-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  T: {aliveStats.aliveT}
                </span>
                <span className="text-zinc-600">|</span>
                <span className="text-blue-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  CT: {aliveStats.aliveCT}
                </span>
              </div>

              {/* Mode Toggle Button */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRadarMode(m => (m === 'full_map' ? 'rotating' : 'full_map'))}
                  title="تغییر حالت رادار (کلید M)"
                  className="px-1.5 py-0.5 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-[10px] flex items-center gap-1 transition-colors"
                >
                  {radarMode === 'full_map' ? (
                    <>
                      <MapIcon className="w-3 h-3" />
                      <span>کامل [M]</span>
                    </>
                  ) : (
                    <>
                      <RotateCw className="w-3 h-3" />
                      <span>چرخشی [M]</span>
                    </>
                  )}
                </button>

                {/* Enlarge map button */}
                <button
                  onClick={() => setIsMapEnlarged(e => !e)}
                  title="تغییر اندازه نقشه"
                  className="p-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  {isMapEnlarged ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Radar Canvas (Retina 400x400 resolution) */}
            <canvas ref={radarCanvasRef} width={400} height={400} className="w-full h-full object-cover" />

            {/* Bottom Bar: Map Name & Zoom Toggle */}
            <div className="absolute bottom-1 inset-x-2 z-10 flex items-center justify-between pointer-events-auto">
              <span className="text-[10px] font-mono text-amber-500 font-black uppercase tracking-wider bg-black/70 px-1.5 py-0.5 rounded">
                DE_DUST2
              </span>

              {/* Zoom Buttons */}
              <div className="flex items-center gap-1 bg-black/75 px-1 py-0.5 rounded border border-zinc-800">
                <button
                  onClick={() => setRadarZoom(z => Math.max(0.7, Number((z - 0.2).toFixed(1))))}
                  title="کوچک‌نمایی"
                  className="px-1 hover:text-amber-400 text-zinc-400 text-[10px] font-bold"
                >
                  -
                </button>
                <span className="text-[9px] font-mono text-zinc-300 px-0.5">{radarZoom.toFixed(1)}x</span>
                <button
                  onClick={() => setRadarZoom(z => Math.min(2.4, Number((z + 0.2).toFixed(1))))}
                  title="بزرگ‌نمایی"
                  className="px-1 hover:text-amber-400 text-zinc-400 text-[10px] font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pointer-events-auto">
            <button
              onClick={onOpenBuyMenu}
              className="bg-amber-600 hover:bg-amber-500 text-black px-3 py-1 rounded-lg text-xs font-black shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>فروشگاه [B]</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-600/30 px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg transition-transform active:scale-95"
            >
              تنظیمات تروریست‌ها
            </button>
            <button
              onClick={onOpenControls}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 px-2.5 py-1 rounded-lg text-xs font-bold transition-transform active:scale-95"
            >
              راهنما [H]
            </button>
          </div>
        </div>

        {/* Center: Team Scores & Round Timer */}
        <div className="flex items-center gap-3 bg-black/80 px-6 py-2 rounded-2xl border border-amber-600/40 backdrop-blur-md shadow-2xl">
          <div className="text-center px-2">
            <span className="text-[11px] font-black text-blue-400 block tracking-wider">CT</span>
            <span className="font-['Teko',sans-serif] text-4xl font-extrabold text-blue-500 leading-none">{scoreCT}</span>
          </div>
          <div className="text-center border-x border-zinc-700 px-4">
            <span className="text-[10px] text-zinc-400 block uppercase font-bold">زمان راند</span>
            <span className="font-['Teko',sans-serif] text-4xl text-amber-400 font-black leading-none">{mins}:{secs}</span>
          </div>
          <div className="text-center px-2">
            <span className="text-[11px] font-black text-red-400 block tracking-wider">T</span>
            <span className="font-['Teko',sans-serif] text-4xl font-extrabold text-red-500 leading-none">{scoreT}</span>
          </div>
        </div>

        {/* Right: Dynamic Kill Feed */}
        <div className="flex flex-col gap-1.5 items-end max-w-sm w-full">
          {killFeed.slice(-5).map(item => (
            <div
              key={item.id}
              className="flex items-center gap-2 bg-black/80 text-white px-3 py-1.5 rounded-xl border border-zinc-800 text-xs shadow-lg backdrop-blur-sm animate-fade-in"
            >
              <span className={`font-bold ${item.killerTeam === 'T' ? 'text-red-400' : 'text-blue-400'}`}>
                {item.killerName}
              </span>
              <span className="text-amber-400 font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700">
                {item.weaponName}
              </span>
              <span className={`font-bold ${item.victimTeam === 'T' ? 'text-red-400' : 'text-blue-400'}`}>
                {item.victimName}
              </span>
              {item.isHeadshot && (
                <span className="text-red-500 font-black text-xs">🎯 [HS]</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CENTER NOTIFICATIONS & POPUPS */}
      {centerMessage.visible && (
        <div className="self-center text-center transition-all duration-200 transform scale-105">
          <h2 className="font-['Teko',sans-serif] text-6xl font-black text-amber-400 tracking-wider drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
            {centerMessage.title}
          </h2>
          {centerMessage.subtitle && (
            <p className="text-xl text-zinc-200 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              {centerMessage.subtitle}
            </p>
          )}
        </div>
      )}

      {/* TOP C4 COUNTDOWN BANNER (When C4 is Planted) */}
      {gameEngine?.plantedC4 && !gameEngine.plantedC4.isDefused && !gameEngine.plantedC4.isExploded && (
        <div className="self-center bg-red-950/90 border-2 border-red-500/90 text-white px-8 py-2.5 rounded-2xl backdrop-blur-md shadow-[0_0_35px_rgba(239,68,68,0.7)] flex items-center gap-4 animate-pulse">
          <Bomb className="w-7 h-7 text-red-400 animate-bounce" />
          <div className="text-center">
            <span className="text-xs text-red-300 font-bold block uppercase tracking-widest">
              بمب C4 در سایت {gameEngine.plantedC4.site} کاشته شده!
            </span>
            <span className="font-mono text-3xl font-black text-amber-300">
              {Math.max(0, gameEngine.plantedC4.timerRemaining).toFixed(1)} ثانیه تا انفجار
            </span>
          </div>
          <AlertTriangle className="w-7 h-7 text-amber-400" />
        </div>
      )}

      {/* C4 PLANTING PROGRESS BAR */}
      {player.isPlantingBomb && (
        <div className="self-center bg-black/90 border-2 border-amber-500 px-8 py-4 rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.5)] text-center min-w-[320px]">
          <span className="text-amber-400 font-black text-lg block mb-2 animate-pulse">
            در حال کاشت بمب C4...
          </span>
          <div className="w-full bg-zinc-800 h-4 rounded-full overflow-hidden border border-zinc-700">
            <div
              className="bg-gradient-to-r from-amber-500 to-red-500 h-full transition-all duration-75"
              style={{ width: `${Math.min(100, Math.round((player.plantProgress || 0) * 100))}%` }}
            />
          </div>
          <span className="text-xs font-mono text-zinc-400 mt-1 block">
            {Math.min(100, Math.round((player.plantProgress || 0) * 100))}%
          </span>
        </div>
      )}

      {/* C4 DEFUSING PROGRESS BAR */}
      {player.isDefusingBomb && (
        <div className="self-center bg-black/90 border-2 border-blue-500 px-8 py-4 rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(59,130,246,0.5)] text-center min-w-[320px]">
          <span className="text-blue-400 font-black text-lg block mb-2 animate-pulse">
            در حال خنثی‌سازی بمب C4... {player.hasDefuseKit ? '(کیت سریع)' : ''}
          </span>
          <div className="w-full bg-zinc-800 h-4 rounded-full overflow-hidden border border-zinc-700">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-75"
              style={{ width: `${Math.min(100, Math.round((player.defuseProgress || 0) * 100))}%` }}
            />
          </div>
          <span className="text-xs font-mono text-zinc-400 mt-1 block">
            {Math.min(100, Math.round((player.defuseProgress || 0) * 100))}%
          </span>
        </div>
      )}

      {/* Bombsite / Defuse Context Prompts */}
      {!player.isPlantingBomb && !player.isDefusingBomb && !centerMessage.visible && (
        <>
          {player.team === 'T' && player.slots[5] && gameEngine?.getNearbyBombsite && gameEngine.getNearbyBombsite() && (
            <div className="self-center text-center bg-black/90 border-2 border-red-500/80 px-6 py-2 rounded-2xl backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center gap-3">
              <Bomb className="w-5 h-5 text-red-400 animate-bounce" />
              <span className="text-white font-bold">
                شما در منطقه بمب‌گذاری سایت <span className="text-red-400 font-black">{gameEngine.getNearbyBombsite()}</span> هستید
              </span>
              <span className="font-mono bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                کلید [5] سپس نگه داشتن کلیک یا [E]
              </span>
            </div>
          )}

          {player.team === 'CT' && gameEngine?.getNearbyPlantedC4 && gameEngine.getNearbyPlantedC4() && (
            <div className="self-center text-center bg-black/90 border-2 border-blue-500/80 px-6 py-2 rounded-2xl backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-400 animate-bounce" />
              <span className="text-white font-bold">
                بمب C4 اینجاست!
              </span>
              <span className="font-mono bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                کلید [E] را نگه دارید برای خنثی‌سازی
              </span>
            </div>
          )}
        </>
      )}

      {/* Dynamic Weapon Pickup Prompt [E] */}
      {gameEngine?.getNearbyDroppedWeapon && gameEngine.getNearbyDroppedWeapon() && !centerMessage.visible && (
        <div className="self-center text-center transition-all duration-150 bg-black/90 border-2 border-amber-500/80 px-6 py-2.5 rounded-2xl backdrop-blur-md shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center gap-3">
          <span className="font-mono bg-amber-500 text-black text-sm font-black px-2.5 py-0.5 rounded-lg shadow">
            کلید [E]
          </span>
          <span className="text-white font-black text-lg">
            برداشتن {gameEngine.getNearbyDroppedWeapon()?.weapon.persianName || gameEngine.getNearbyDroppedWeapon()?.weapon.name}
          </span>
          <span className="text-amber-400 font-mono text-sm font-bold">
            ({gameEngine.getNearbyDroppedWeapon()?.clip} / {gameEngine.getNearbyDroppedWeapon()?.reserveAmmo})
          </span>
        </div>
      )}

      {/* BOTTOM BAR: Health, Armor, Weapon Slots & Ammo */}
      <div className="flex justify-between items-end w-full">
        
        {/* Health & Kevlar Armor */}
        <div className="flex items-center gap-4 bg-black/80 px-6 py-3 rounded-2xl border border-zinc-800 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-2.5">
            <Heart className="w-6 h-6 text-red-500 fill-red-500/30 animate-pulse" />
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-bold block leading-tight">سلامتی</span>
              <span className="font-['Teko',sans-serif] text-4xl font-black text-white leading-none">
                {Math.max(0, player.health)}
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-700" />

          <div className="flex items-center gap-2.5">
            {player.hasHelmet ? (
              <ShieldAlert className="w-6 h-6 text-amber-400 fill-amber-400/20" />
            ) : (
              <Shield className="w-6 h-6 text-blue-400 fill-blue-400/20" />
            )}
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-bold block leading-tight">
                {player.hasHelmet ? 'جلیقه + کلاه' : 'جلیقه ضدگلوله'}
              </span>
              <span className="font-['Teko',sans-serif] text-4xl font-black text-white leading-none">
                {player.armor}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Multi-Weapon Inventory Slots Bar */}
        <div className="flex items-center gap-2 bg-black/75 p-2 rounded-2xl border border-zinc-800 backdrop-blur-md shadow-2xl">
          {/* Slot 1: Primary */}
          <div
            className={`px-3 py-2 rounded-xl text-center border transition-all ${
              player.activeSlot === 1
                ? 'bg-amber-600/30 border-amber-500 text-amber-300 ring-2 ring-amber-500/50'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
            }`}
          >
            <span className="text-[10px] font-mono block text-zinc-500">[1] اصلی</span>
            <span className="text-xs font-bold truncate max-w-[90px] block">
              {player.slots[1]?.weapon.name || 'خالی'}
            </span>
          </div>

          {/* Slot 2: Secondary */}
          <div
            className={`px-3 py-2 rounded-xl text-center border transition-all ${
              player.activeSlot === 2
                ? 'bg-amber-600/30 border-amber-500 text-amber-300 ring-2 ring-amber-500/50'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
            }`}
          >
            <span className="text-[10px] font-mono block text-zinc-500">[2] کلت</span>
            <span className="text-xs font-bold truncate max-w-[90px] block">
              {player.slots[2]?.weapon.name || 'خالی'}
            </span>
          </div>

          {/* Slot 3: Knife */}
          <div
            className={`px-3 py-2 rounded-xl text-center border transition-all ${
              player.activeSlot === 3
                ? 'bg-amber-600/30 border-amber-500 text-amber-300 ring-2 ring-amber-500/50'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
            }`}
          >
            <span className="text-[10px] font-mono block text-zinc-500">[3] چاقو</span>
            <span className="text-xs font-bold block">رزمی (+15%)</span>
          </div>

          {/* Slot 4: Grenades */}
          <div
            className={`px-3 py-2 rounded-xl text-center border transition-all ${
              player.activeSlot === 4
                ? 'bg-amber-600/30 border-amber-500 text-amber-300 ring-2 ring-amber-500/50'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
            }`}
          >
            <span className="text-[10px] font-mono block text-zinc-500">[4] نارنجک</span>
            <span className="text-xs font-bold block">
              {player.slots[4]?.length ? `${player.slots[4].length} عدد` : 'ندارید'}
            </span>
          </div>

          {/* Slot 5: C4 Bomb */}
          {player.slots[5] && (
            <div
              className={`px-3 py-2 rounded-xl text-center border transition-all ${
                player.activeSlot === 5
                  ? 'bg-red-600/40 border-red-500 text-red-300 ring-2 ring-red-500/50 animate-pulse'
                  : 'bg-red-950/40 border-red-900 text-red-400'
              }`}
            >
              <span className="text-[10px] font-mono block text-red-400">[5] بمب C4</span>
              <span className="text-xs font-bold block text-red-200">آماده کاشت</span>
            </div>
          )}

          {/* Slot 6: 3rd Weapon Perk */}
          {player.hasTripleWeaponPerk && (
            <div
              className={`px-3 py-2 rounded-xl text-center border transition-all ${
                player.activeSlot === 6
                  ? 'bg-amber-600/30 border-amber-500 text-amber-300 ring-2 ring-amber-500/50'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
              }`}
            >
              <span className="text-[10px] font-mono block text-amber-400">[6] سلاح سوم</span>
              <span className="text-xs font-bold truncate max-w-[90px] block">
                {player.slots[6]?.weapon.name || 'خالی'}
              </span>
            </div>
          )}

          <div className="border-r border-zinc-700 h-8 mx-1" />

          {/* Money Badge */}
          <div className="px-3 py-1 text-center">
            <span className="text-[9px] text-zinc-400 uppercase font-bold block">موجودی</span>
            <span className="font-['Teko',sans-serif] text-3xl font-black text-emerald-400 leading-none">
              ${player.money}
            </span>
          </div>
        </div>

        {/* Active Weapon Ammo & Fire Mode Details */}
        <div className="flex items-center gap-4 bg-black/80 px-6 py-3 rounded-2xl border border-zinc-800 backdrop-blur-md shadow-2xl">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              {/* Burst / Auto Mode Indicator */}
              {activeWeapon?.availableFireModes.includes('burst') && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/50 font-mono font-bold">
                  حالت: {fireMode === 'burst' ? 'رگباری ۳ تیر [F]' : 'اتوماتیک [F]'}
                </span>
              )}
              <span className="text-sm font-black text-amber-400 tracking-wider block">
                {activeWeapon?.name || 'بدون سلاح'}
              </span>
            </div>

            {activeWeapon?.slot !== 3 && activeWeapon?.slot !== 4 && (
              <div className="flex items-baseline gap-1.5 justify-end">
                <span className="font-['Teko',sans-serif] text-4xl font-extrabold text-white leading-none">
                  {clip}
                </span>
                <span className="text-zinc-500 text-2xl font-bold">/</span>
                <span className="font-['Teko',sans-serif] text-2xl font-bold text-zinc-400 leading-none">
                  {reserveAmmo}
                </span>
              </div>
            )}
            {activeWeapon?.slot === 3 && (
              <span className="text-xs text-zinc-400 block mt-1">ضربه سریع / استپ سنگین</span>
            )}
            {activeWeapon?.slot === 4 && (
              <span className="text-xs text-amber-400 block mt-1">پرتاب کلیک چپ / پرتاب کوتاه راست</span>
            )}
          </div>

          <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-amber-500">
            {activeWeapon?.category === 'sniper' ? (
              <Target className="w-6 h-6" />
            ) : activeWeapon?.id === 'he_grenade' ? (
              <Bomb className="w-6 h-6" />
            ) : activeWeapon?.id === 'flashbang' ? (
              <Sun className="w-6 h-6" />
            ) : activeWeapon?.id === 'smoke' ? (
              <Cloud className="w-6 h-6" />
            ) : (
              <Crosshair className="w-6 h-6" />
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
