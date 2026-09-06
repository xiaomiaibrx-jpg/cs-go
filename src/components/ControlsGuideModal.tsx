import React from 'react';
import { Keyboard, Mouse, X, Crosshair, Zap, Bomb } from 'lucide-react';

interface ControlsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlsGuideModal: React.FC<ControlsGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-amber-600/50 rounded-3xl max-w-lg w-full p-6 text-right shadow-2xl relative">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-600/20 text-amber-500 border border-amber-500/40">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-['Teko',sans-serif] text-2xl font-black text-amber-400">راهنمای کلیدها و کنترل بازی</h2>
              <p className="text-[11px] text-zinc-400">تمام کلیدهای میانبر Counter-Strike Remastered</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          
          <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
            <span className="font-bold text-amber-400 block mb-1">حرکت و جهش</span>
            <div className="space-y-1 text-zinc-300">
              <div className="flex justify-between"><span>حرکت</span><kbd className="bg-black px-1.5 py-0.5 rounded border border-zinc-700 text-[10px]">W A S D</kbd></div>
              <div className="flex justify-between"><span>پرش</span><kbd className="bg-black px-1.5 py-0.5 rounded border border-zinc-700 text-[10px]">Space</kbd></div>
              <div className="flex justify-between"><span>نشستن</span><kbd className="bg-black px-1.5 py-0.5 rounded border border-zinc-700 text-[10px]">Ctrl</kbd></div>
              <div className="flex justify-between"><span>حرکت آهسته</span><kbd className="bg-black px-1.5 py-0.5 rounded border border-zinc-700 text-[10px]">Shift</kbd></div>
            </div>
          </div>

          <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
            <span className="font-bold text-amber-400 block mb-1">تیراندازی و هدف‌گیری</span>
            <div className="space-y-1 text-zinc-300">
              <div className="flex justify-between"><span>شلیک / ضربه</span><kbd className="bg-black px-1.5 py-0.5 rounded border border-zinc-700 text-[10px]">کلیک چپ</kbd></div>
              <div className="flex justify-between"><span>زوم / حالت رگبار</span><kbd className="bg-black px-1.5 py-0.5 rounded border border-zinc-700 text-[10px]">کلیک راست</kbd></div>
              <div className="flex justify-between"><span>تغییر حالت فاماس</span><kbd className="bg-black px-1.5 py-0.5 rounded border border-zinc-700 text-[10px]">کلید F</kbd></div>
              <div className="flex justify-between"><span>ریلود خشاب</span><kbd className="bg-black px-1.5 py-0.5 rounded border border-zinc-700 text-[10px]">R</kbd></div>
            </div>
          </div>

          <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
            <span className="font-bold text-amber-400 block mb-1">تعویض و حمل سلاح‌ها</span>
            <div className="space-y-1 text-zinc-300">
              <div className="flex justify-between"><span>سلاح اصلی</span><kbd className="bg-black px-1.5 py-0.5 rounded border border-zinc-700 text-[10px]">1</kbd></div>
              <div className="flex justify-between"><span>کلت کمری</span><kbd className="bg-black px-1.5 py-0.5 rounded border border-zinc-700 text-[10px]">2</kbd></div>
              <div className="flex justify-between"><span>چاقوی رزمی</span><kbd className="bg-black px-1.5 py-0.5 rounded border border-zinc-700 text-[10px]">3</kbd></div>
              <div className="flex justify-between"><span>نارنجک‌ها</span><kbd className="bg-black px-1.5 py-0.5 rounded border border-zinc-700 text-[10px]">4</kbd></div>
              <div className="flex justify-between"><span>سوئیچ سریع</span><kbd className="bg-black px-1.5 py-0.5 rounded border border-zinc-700 text-[10px]">Q</kbd></div>
            </div>
          </div>

          <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
            <span className="font-bold text-amber-400 block mb-1">فروشگاه و امکانات</span>
            <div className="space-y-1 text-zinc-300">
              <div className="flex justify-between"><span>فروشگاه خرید</span><kbd className="bg-black px-1.5 py-0.5 rounded border border-zinc-700 text-[10px]">B</kbd></div>
              <div className="flex justify-between"><span>انداختن اسلحه</span><kbd className="bg-black px-1.5 py-0.5 rounded border border-zinc-700 text-[10px]">G</kbd></div>
              <div className="flex justify-between"><span>برداشتن از زمین</span><kbd className="bg-black px-1.5 py-0.5 rounded border border-zinc-700 text-[10px]">E یا عبور</kbd></div>
              <div className="flex justify-between"><span>تنظیمات بات‌ها</span><kbd className="bg-black px-1.5 py-0.5 rounded border border-zinc-700 text-[10px]">O</kbd></div>
            </div>
          </div>

        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 bg-amber-600 hover:bg-amber-500 text-black font-black py-2.5 rounded-xl text-xs transition-all"
        >
          متوجه شدم (ادامه بازی)
        </button>

      </div>
    </div>
  );
};
