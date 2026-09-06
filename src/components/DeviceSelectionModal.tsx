import React from 'react';
import { Smartphone, Monitor, CheckCircle, Gamepad2, ArrowRight } from 'lucide-react';
import { DeviceMode } from '../types';

interface DeviceSelectionModalProps {
  isOpen: boolean;
  onSelectMode: (mode: DeviceMode) => void;
}

export const DeviceSelectionModal: React.FC<DeviceSelectionModalProps> = ({
  isOpen,
  onSelectMode
}) => {
  if (!isOpen) return null;

  // Auto-detect mobile / touch
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-zinc-900 to-black border-2 border-amber-500/80 rounded-3xl max-w-xl w-full p-6 md:p-8 text-center text-white shadow-[0_0_50px_rgba(245,158,11,0.3)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-amber-500/20 blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-1 rounded-full text-amber-400 text-xs font-black tracking-widest uppercase mb-4">
          <Gamepad2 className="w-4 h-4" />
          انتخاب روش کنترل و پلتفرم
        </div>

        <h2 className="font-['Teko',sans-serif] text-4xl md:text-5xl font-black text-amber-400 tracking-wider mb-2">
          دستگاه خود را انتخاب کنید
        </h2>
        <p className="text-zinc-400 text-sm md:text-base mb-6 leading-relaxed max-w-md mx-auto">
          برای تجربه بهترین کنترل بازی، لطفاً مشخص کنید که هم‌اکنون با کامپیوتر (دسکتاپ) وارد شده‌اید یا گوشی موبایل / تبلت:
        </p>

        {/* Choice Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          
          {/* Desktop Option */}
          <button
            onClick={() => onSelectMode('desktop')}
            className={`group p-6 rounded-2xl border-2 transition-all text-right flex flex-col justify-between relative overflow-hidden ${
              !isTouchDevice
                ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                : 'bg-zinc-900/80 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/60'
            }`}
          >
            {!isTouchDevice && (
              <span className="absolute top-3 left-3 bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> پیشنهاد سیستم
              </span>
            )}
            <div className="mb-4">
              <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl w-fit mb-3 group-hover:scale-110 transition-transform">
                <Monitor className="w-8 h-8" />
              </div>
              <h3 className="font-['Teko',sans-serif] text-2xl font-black text-white group-hover:text-amber-400 transition-colors">
                کامپیوتر / لپ‌تاپ (دسکتاپ)
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                کنترل کامل با موس و کیبورد (WASD، کلیک برای شلیک، Space برای پرش، اسکوپ موس).
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-[-4px] transition-transform">
              <span>ورود با دسکتاپ</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </div>
          </button>

          {/* Mobile Option */}
          <button
            onClick={() => onSelectMode('mobile')}
            className={`group p-6 rounded-2xl border-2 transition-all text-right flex flex-col justify-between relative overflow-hidden ${
              isTouchDevice
                ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                : 'bg-zinc-900/80 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/60'
            }`}
          >
            {isTouchDevice && (
              <span className="absolute top-3 left-3 bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> پیشنهاد سیستم
              </span>
            )}
            <div className="mb-4">
              <div className="p-3 bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded-2xl w-fit mb-3 group-hover:scale-110 transition-transform">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="font-['Teko',sans-serif] text-2xl font-black text-white group-hover:text-blue-400 transition-colors">
                گوشی موبایل / تبلت
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                جوی‌استیک شناور لمسی، تاچ-لوک هدف‌گیری، دکمه‌های لمسی شلیک، زوم اسنایپر و پرش.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-blue-400 group-hover:translate-x-[-4px] transition-transform">
              <span>ورود با نسخه موبایل</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </div>
          </button>

        </div>

        <div className="text-[11px] text-zinc-500">
          💡 نکته: در هر لحظه از بازی نیز می‌توانید از منوی بالای صفحه یا کلید تنظیمات، نوع کنترل را تغییر دهید.
        </div>

      </div>
    </div>
  );
};
