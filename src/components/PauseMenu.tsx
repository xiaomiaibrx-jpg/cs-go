import React from 'react';
import { Play, RotateCw, Sliders, Home, Shield, Users } from 'lucide-react';
import { Team } from '../types';

interface PauseMenuProps {
  isOpen: boolean;
  playerTeam: Team;
  onResume: () => void;
  onRestartRound: () => void;
  onOpenSettings: () => void;
  onSwitchTeam: (team: Team) => void;
  onMainMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  isOpen,
  playerTeam,
  onResume,
  onRestartRound,
  onOpenSettings,
  onSwitchTeam,
  onMainMenu
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-amber-600/50 rounded-3xl p-6 max-w-md w-full text-center shadow-2xl relative">
        <h2 className="font-['Teko',sans-serif] text-5xl font-black text-amber-400 mb-1">
          بازی متوقف شد
        </h2>
        <p className="text-xs text-zinc-400 mb-6">منوی توقف موقت (PAUSE MENU)</p>

        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>ادامه بازی (Resume)</span>
          </button>

          <button
            onClick={onRestartRound}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
          >
            <RotateCw className="w-4 h-4" />
            <span>شروع مجدد راند</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
          >
            <Sliders className="w-4 h-4 text-amber-500" />
            <span>تنظیم تعداد تروریست‌ها و بات‌ها</span>
          </button>

          {/* Switch Team Buttons */}
          <div className="pt-2 border-t border-zinc-800 flex gap-2">
            <button
              onClick={() => onSwitchTeam('T')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                playerTeam === 'T'
                  ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-400'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              تیم تروریست (T)
            </button>
            <button
              onClick={() => onSwitchTeam('CT')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                playerTeam === 'CT'
                  ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              تیم ضدتروریست (CT)
            </button>
          </div>

          <button
            onClick={onMainMenu}
            className="w-full mt-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
          >
            <Home className="w-4 h-4" />
            <span>خروج به صفحه اصلی</span>
          </button>
        </div>
      </div>
    </div>
  );
};
