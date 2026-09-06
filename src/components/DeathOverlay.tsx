import React from 'react';
import { Eye, RotateCw, Skull } from 'lucide-react';

interface DeathOverlayProps {
  isOpen: boolean;
  spectateTargetName?: string;
  onSpectateNext: () => void;
  onRestartRound: () => void;
}

export const DeathOverlay: React.FC<DeathOverlayProps> = ({
  isOpen,
  spectateTargetName,
  onSpectateNext,
  onRestartRound
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-30 flex flex-col justify-between p-6 pointer-events-auto select-none">
      
      {/* Top Death Notification */}
      <div className="text-center pt-8">
        <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/40 text-red-400 px-4 py-1 rounded-full text-xs font-bold mb-2">
          <Skull className="w-4 h-4" />
          <span>کشته شدید</span>
        </div>
        <h2 className="font-['Teko',sans-serif] text-6xl font-black text-red-500 drop-shadow-[0_4px_12px_rgba(239,68,68,0.5)] animate-pulse">
          شما در این راند کشته شدید!
        </h2>
        {spectateTargetName && (
          <p className="text-amber-400 font-bold text-base mt-2 bg-black/60 inline-block px-4 py-1 rounded-xl border border-zinc-800">
            در حال تماشای: <span className="text-white">{spectateTargetName}</span>
          </p>
        )}
      </div>

      {/* Spectator Actions */}
      <div className="flex justify-center gap-3 mb-8">
        <button
          onClick={onSpectateNext}
          className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-2xl shadow-xl transition-all flex items-center gap-2 text-sm"
        >
          <Eye className="w-4 h-4" />
          <span>تماشای بازیکن بعدی (Spectate Next)</span>
        </button>

        <button
          onClick={onRestartRound}
          className="bg-amber-500 hover:bg-amber-400 text-black font-black px-6 py-3 rounded-2xl shadow-xl transition-all flex items-center gap-2 text-sm"
        >
          <RotateCw className="w-4 h-4" />
          <span>شروع مجدد راند (Restart)</span>
        </button>
      </div>

    </div>
  );
};
