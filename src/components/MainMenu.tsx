import React from 'react';
import {
  Play,
  Users,
  Shield,
  Bomb,
  Crosshair,
  Sparkles,
  Info,
  Globe,
  Monitor,
  Smartphone,
  Wifi,
  Bot
} from 'lucide-react';
import { Team, MatchSettings, BotDifficulty, DeviceMode } from '../types';

interface MainMenuProps {
  isOpen: boolean;
  playerName: string;
  selectedTeam: Team;
  settings: MatchSettings;
  deviceMode: DeviceMode;
  onPlayerNameChange: (name: string) => void;
  onSelectTeam: (team: Team) => void;
  onSettingsChange: (settings: MatchSettings) => void;
  onStartOfflineGame: () => void;
  onOpenMultiplayer: () => void;
  onToggleDeviceMode: () => void;
  onOpenControls: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  isOpen,
  playerName,
  selectedTeam,
  settings,
  deviceMode,
  onPlayerNameChange,
  onSelectTeam,
  onSettingsChange,
  onStartOfflineGame,
  onOpenMultiplayer,
  onToggleDeviceMode,
  onOpenControls
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-neutral-900 to-stone-950 z-50 flex items-center justify-center p-4 select-none overflow-y-auto">
      <div className="bg-black/85 border border-amber-600/50 rounded-3xl p-6 md:p-8 max-w-2xl w-full backdrop-blur-2xl shadow-[0_0_60px_rgba(217,119,6,0.2)] text-center relative my-auto">
        
        {/* Device Mode Switch Pill Header */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={onToggleDeviceMode}
            className="inline-flex items-center gap-2 bg-zinc-900/90 border border-zinc-700 hover:border-amber-500/80 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all text-zinc-300 hover:text-white"
          >
            {deviceMode === 'mobile' ? (
              <>
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>حالت کنترل: <strong>موبایل لمسی</strong></span>
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4 text-amber-400" />
                <span>حالت کنترل: <strong>دسکتاپ (موس و کیبورد)</strong></span>
              </>
            )}
            <span className="text-[10px] text-amber-400 underline mr-1">تغییر</span>
          </button>

          <div className="inline-flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1 rounded-full text-emerald-400 text-xs font-black">
            <Wifi className="w-3.5 h-3.5" />
            <span>سرور چندنفره آماده</span>
          </div>
        </div>

        {/* Banner Title */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>نسخه آنلاین و آفلاین همزمان با شات‌گان‌های جدید</span>
          </div>
          <h1 className="font-['Teko',sans-serif] text-6xl md:text-7xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 leading-none">
            COUNTER-STRIKE 3D
          </h1>
          <p className="text-amber-500 font-['Rajdhani',sans-serif] font-bold text-sm tracking-[0.25em] -mt-1">
            DUST II ONLINE & OFFLINE EDITION
          </p>
        </div>

        {/* Feature Highlights Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 text-[11px] text-zinc-300">
          <div className="bg-zinc-900/90 border border-zinc-800 p-2 rounded-xl flex items-center gap-1.5 justify-center">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>آنلاین چندنفره (اتاق‌ها)</span>
          </div>
          <div className="bg-zinc-900/90 border border-zinc-800 p-2 rounded-xl flex items-center gap-1.5 justify-center">
            <Crosshair className="w-3.5 h-3.5 text-red-400" />
            <span>شات‌گان‌های ساچمه‌ای</span>
          </div>
          <div className="bg-zinc-900/90 border border-zinc-800 p-2 rounded-xl flex items-center gap-1.5 justify-center">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>تیربار ۵۰۰۰$ و ۱۷۰۰$</span>
          </div>
          <div className="bg-zinc-900/90 border border-zinc-800 p-2 rounded-xl flex items-center gap-1.5 justify-center">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>کنترل لمسی بهینه‌شده</span>
          </div>
        </div>

        {/* Player Name Input */}
        <div className="mb-5 text-right">
          <label className="block text-xs font-bold text-zinc-400 mb-1.5">نام شما در بازی:</label>
          <input
            type="text"
            value={playerName}
            onChange={e => onPlayerNameChange(e.target.value)}
            placeholder="Player1"
            maxLength={16}
            className="w-full bg-zinc-900 border-2 border-zinc-800 focus:border-amber-500 text-white font-bold py-2.5 px-4 rounded-xl outline-none text-left font-mono text-sm transition-all"
          />
        </div>

        {/* Team Selection Cards */}
        <div className="text-right mb-5">
          <label className="block text-xs font-bold text-zinc-400 mb-2">انتخاب تیم مورد علاقه:</label>
          <div className="grid grid-cols-2 gap-3">
            
            {/* Terrorists Team Card */}
            <button
              type="button"
              onClick={() => onSelectTeam('T')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${
                selectedTeam === 'T'
                  ? 'bg-gradient-to-b from-red-950/60 to-red-900/20 border-red-500 ring-2 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                  : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center text-red-400 mb-2">
                <Bomb className="w-6 h-6" />
              </div>
              <span className="font-['Teko',sans-serif] text-2xl font-black text-red-400 block leading-none">
                TERRORISTS
              </span>
              <span className="text-[10px] text-zinc-400 mt-1">سلاح کلاشینکف AK-47 & گلاک ۱۸</span>
            </button>

            {/* Counter-Terrorists Team Card */}
            <button
              type="button"
              onClick={() => onSelectTeam('CT')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${
                selectedTeam === 'CT'
                  ? 'bg-gradient-to-b from-blue-950/60 to-blue-900/20 border-blue-500 ring-2 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                  : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 mb-2">
                <Shield className="w-6 h-6" />
              </div>
              <span className="font-['Teko',sans-serif] text-2xl font-black text-blue-400 block leading-none">
                COUNTER-TERRORISTS
              </span>
              <span className="text-[10px] text-zinc-400 mt-1">سلاح فاماس FAMAS & ام۴ M4A1</span>
            </button>
          </div>
        </div>

        {/* Offline Settings (Bot Counts & Difficulty) */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl mb-6 text-right space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-['Teko',sans-serif] text-2xl font-black text-red-400">
              {settings.terroristCount} نفر
            </span>
            <label className="text-xs font-bold text-zinc-300">
              تعداد بات‌های تروریست (T) در بازی آفلاین:
            </label>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={settings.terroristCount}
            onChange={e => onSettingsChange({ ...settings, terroristCount: parseInt(e.target.value) })}
            className="w-full accent-red-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
            <span className="font-['Teko',sans-serif] text-2xl font-black text-blue-400">
              {settings.counterTerroristCount} نفر
            </span>
            <label className="text-xs font-bold text-zinc-300">
              تعداد بات‌های ضد تروریست (CT) در بازی آفلاین:
            </label>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={settings.counterTerroristCount}
            onChange={e => onSettingsChange({ ...settings, counterTerroristCount: parseInt(e.target.value) })}
            className="w-full accent-blue-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
          />

          {/* Difficulty Preset Buttons */}
          <div className="pt-2 border-t border-zinc-800">
            <label className="block text-[11px] font-bold text-zinc-400 mb-1.5">درجه هوش مصنوعی بات‌ها:</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['easy', 'medium', 'hard', 'expert'] as BotDifficulty[]).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onSettingsChange({ ...settings, difficulty: d })}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    settings.difficulty === d
                      ? 'bg-amber-600 text-black font-black shadow'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {d === 'easy' ? 'آسان' : d === 'medium' ? 'متوسط' : d === 'hard' ? 'سخت' : 'حرفه‌ای'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TWO PRIMARY GAME MODES: ONLINE vs OFFLINE */}
        <div className="space-y-3 mb-3">
          
          {/* Online Multiplayer Button */}
          <button
            type="button"
            onClick={onOpenMultiplayer}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 hover:from-blue-500 hover:to-indigo-400 text-white font-black text-xl py-4 rounded-2xl shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 border border-blue-400/40"
          >
            <Globe className="w-6 h-6 animate-pulse" />
            <div className="text-right">
              <div className="leading-none">بازی آنلاین چندنفره (اتاق‌ها و هاست)</div>
              <div className="text-xs font-normal text-blue-200 mt-0.5">ورود به لابی، بازی هم‌زمان با دوستان و سایر بازیکنان در سرور</div>
            </div>
          </button>

          {/* Offline Singleplayer with Bots Button */}
          <button
            type="button"
            onClick={onStartOfflineGame}
            className="w-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-black font-black text-xl py-3.5 rounded-2xl shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <Bot className="w-6 h-6 fill-black" />
            <div className="text-right">
              <div className="leading-none">بازی آفلاین (تک‌نفره با بات‌های هوشمند)</div>
              <div className="text-xs font-normal text-black/80 mt-0.5">تمرین سریع، تنظیم تعداد بات‌ها و کاشت/خنثی‌سازی بمب</div>
            </div>
          </button>

        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenControls}
            className="text-xs text-zinc-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1"
          >
            <Info className="w-3.5 h-3.5" />
            <span>مشاهده راهنمای کامل کلیدهای بازی و کنترل موبایل</span>
          </button>
        </div>

      </div>
    </div>
  );
};
