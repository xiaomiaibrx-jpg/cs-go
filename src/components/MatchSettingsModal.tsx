import React, { useState } from 'react';
import { Sliders, Users, ShieldAlert, Zap, Clock, DollarSign, Flame, Check, X, RotateCw } from 'lucide-react';
import { MatchSettings, BotDifficulty } from '../types';

interface MatchSettingsModalProps {
  isOpen: boolean;
  currentSettings: MatchSettings;
  onClose: () => void;
  onApply: (newSettings: MatchSettings) => void;
}

export const MatchSettingsModal: React.FC<MatchSettingsModalProps> = ({
  isOpen,
  currentSettings,
  onClose,
  onApply
}) => {
  const [settings, setSettings] = useState<MatchSettings>({ ...currentSettings });

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-amber-600/50 rounded-3xl max-w-xl w-full p-6 text-right shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-600/20 text-amber-500 border border-amber-500/40">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-['Teko',sans-serif] text-3xl font-black text-amber-400 tracking-wider">
                تنظیمات مسابقه و تعداد بات‌ها
              </h2>
              <p className="text-xs text-zinc-400">تعداد تروریست‌ها، درجه سختی و قوانین مسابقه را تعیین کنید</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Configuration Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5">
          
          {/* 1. Terrorist Count Slider (User Request Direct Focus) */}
          <div className="bg-zinc-900/90 border border-red-900/40 p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-zinc-400 font-bold">حداکثر ۲۰ تروریست</span>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-red-500" />
                <label className="text-sm font-black text-red-400">تعداد تروریست‌ها (Terrorists):</label>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-['Teko',sans-serif] text-3xl font-black text-red-400 w-12 text-center bg-black/60 py-1 rounded-xl border border-red-900/60">
                {settings.terroristCount}
              </span>
              <input
                type="range"
                min="1"
                max="20"
                value={settings.terroristCount}
                onChange={e => setSettings({ ...settings, terroristCount: parseInt(e.target.value) })}
                className="flex-1 accent-red-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              می‌توانید برای نبردهای پرهیجان و موجی، تعداد دشمنان تروریست را تا ۲۰ نفر افزایش دهید!
            </p>
          </div>

          {/* 2. Counter-Terrorist Count Slider */}
          <div className="bg-zinc-900/90 border border-blue-900/40 p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-zinc-400 font-bold">حداکثر ۲۰ ضد تروریست</span>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <label className="text-sm font-black text-blue-400">تعداد ضد تروریست‌ها (Counter-Terrorists):</label>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-['Teko',sans-serif] text-3xl font-black text-blue-400 w-12 text-center bg-black/60 py-1 rounded-xl border border-blue-900/60">
                {settings.counterTerroristCount}
              </span>
              <input
                type="range"
                min="1"
                max="20"
                value={settings.counterTerroristCount}
                onChange={e => setSettings({ ...settings, counterTerroristCount: parseInt(e.target.value) })}
                className="flex-1 accent-blue-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* 3. Bot AI Difficulty */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
            <label className="text-sm font-black text-zinc-300 mb-3 block">
              درجه سختی هوش مصنوعی بات‌ها:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['easy', 'medium', 'hard', 'expert'] as BotDifficulty[]).map(diff => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSettings({ ...settings, difficulty: diff })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    settings.difficulty === diff
                      ? 'bg-amber-600 text-black shadow-lg font-black scale-105'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {diff === 'easy'
                    ? 'آسان (Easy)'
                    : diff === 'medium'
                    ? 'متوسط (Casual)'
                    : diff === 'hard'
                    ? 'سخت (Hard)'
                    : 'حرفه‌ای (Expert)'}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Round Duration & Starting Cash */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl">
              <label className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-1.5 justify-end">
                <span>زمان هر راند</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </label>
              <select
                value={settings.roundTimeSeconds}
                onChange={e => setSettings({ ...settings, roundTimeSeconds: parseInt(e.target.value) })}
                className="w-full bg-black/60 border border-zinc-700 text-white rounded-xl p-2.5 text-xs font-bold outline-none"
              >
                <option value={60}>۱ دقیقه (سریع)</option>
                <option value={115}>۱:۵۵ دقیقه (کلاسیک رقابتی)</option>
                <option value={180}>۳ دقیقه (طولانی)</option>
                <option value={300}>۵ دقیقه (تمرینی)</option>
              </select>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl">
              <label className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-1.5 justify-end">
                <span>پول اولیه</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </label>
              <select
                value={settings.startingMoney}
                onChange={e => setSettings({ ...settings, startingMoney: parseInt(e.target.value) })}
                className="w-full bg-black/60 border border-zinc-700 text-white rounded-xl p-2.5 text-xs font-bold outline-none"
              >
                <option value={800}>$800 (راند کلت استاندارد)</option>
                <option value={3500}>$3,500 (خرید متوسط)</option>
                <option value={10000}>$10,000 (خرید سنگین)</option>
                <option value={16000}>$16,000 (فول بای کامل)</option>
              </select>
            </div>
          </div>

          {/* 5. Safe Room & Bomb Planting Options */}
          <div className="bg-zinc-900/90 border border-amber-900/50 p-4 rounded-2xl space-y-3">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
              تنظیمات کاشت سیف و طبقه دوم:
            </span>

            <label className="flex items-center justify-between cursor-pointer">
              <input
                type="checkbox"
                checked={settings.upperFloorSafeOnly ?? true}
                onChange={e => setSettings({ ...settings, upperFloorSafeOnly: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <div className="text-right">
                <span className="text-xs text-amber-300 font-bold block">
                  کاشت سیف فقط در طبقه دوم با پله (Upper Floor Safe Only)
                </span>
                <span className="text-[11px] text-zinc-400 block mt-0.5">
                  کاشت بمب منحصراً در اتاق گاوصندوق طبقه بالا انجام می‌شود و تروریست‌ها باید از پله‌ها بالا بروند
                </span>
              </div>
            </label>
          </div>

          {/* 6. Fun Modifiers & Cheats */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl space-y-3">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
              حالت‌های سرگرم‌کننده و ویژه:
            </span>

            <label className="flex items-center justify-between cursor-pointer">
              <input
                type="checkbox"
                checked={settings.lowGravity}
                onChange={e => setSettings({ ...settings, lowGravity: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span className="text-xs text-zinc-300 font-bold">گرانش ماه (Low Gravity - پرش‌های بلند هوایی)</span>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <input
                type="checkbox"
                checked={settings.infiniteAmmo}
                onChange={e => setSettings({ ...settings, infiniteAmmo: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span className="text-xs text-zinc-300 font-bold">تیر بی‌نهایت (بدون اتمام خشاب)</span>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <input
                type="checkbox"
                checked={settings.friendlyFire}
                onChange={e => setSettings({ ...settings, friendlyFire: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span className="text-xs text-zinc-300 font-bold">شلیک به خودی (Friendly Fire)</span>
            </label>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="mt-5 pt-4 border-t border-zinc-800 flex justify-between items-center">
          <button
            onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-5 py-2.5 rounded-xl text-xs transition-all"
          >
            انصراف
          </button>

          <button
            onClick={handleApply}
            className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black px-6 py-2.5 rounded-xl text-sm shadow-xl flex items-center gap-2 transition-all transform active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>اعمال و شروع راند جدید</span>
          </button>
        </div>

      </div>
    </div>
  );
};
