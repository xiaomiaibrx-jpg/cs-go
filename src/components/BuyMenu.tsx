import React, { useState } from 'react';
import { ShoppingCart, X, Shield, Bomb, Crosshair, Zap, Target, Sun, Cloud, Check } from 'lucide-react';
import { WEAPON_REGISTRY, EQUIPMENT_REGISTRY } from '../constants/weapons';
import { WeaponId, WeaponDef } from '../types';

interface BuyMenuProps {
  isOpen: boolean;
  playerMoney: number;
  hasTriplePerk?: boolean;
  playerTeam?: 'T' | 'CT';
  hasC4?: boolean;
  onClose: () => void;
  onBuyWeapon: (weaponId: WeaponId) => void;
  onBuyEquipment: (equipId: 'kevlar' | 'kevlar_helmet' | 'defuse_kit' | 'triple_weapon_perk') => void;
  onToggleC4?: () => void;
}

type TabType = 'rifles' | 'shotguns' | 'heavy' | 'smgs' | 'pistols' | 'grenades' | 'equipment';

export const BuyMenu: React.FC<BuyMenuProps> = ({
  isOpen,
  playerMoney,
  hasTriplePerk,
  playerTeam = 'T',
  hasC4 = false,
  onClose,
  onBuyWeapon,
  onBuyEquipment,
  onToggleC4
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('rifles');

  if (!isOpen) return null;

  const rifles: WeaponDef[] = [
    WEAPON_REGISTRY.ak47,
    WEAPON_REGISTRY.m4a1,
    WEAPON_REGISTRY.awp,
    WEAPON_REGISTRY.scout,
    WEAPON_REGISTRY.famas
  ];

  const shotguns: WeaponDef[] = [
    WEAPON_REGISTRY.xm1014,
    WEAPON_REGISTRY.nova,
    WEAPON_REGISTRY.mag7,
    WEAPON_REGISTRY.sawedoff,
    WEAPON_REGISTRY.spas12
  ];

  const heavyWeapons: WeaponDef[] = [
    WEAPON_REGISTRY.negev,
    WEAPON_REGISTRY.m249
  ];

  const smgs: WeaponDef[] = [
    WEAPON_REGISTRY.bizon,
    WEAPON_REGISTRY.p90,
    WEAPON_REGISTRY.mp5sd
  ];

  const pistols: WeaponDef[] = [
    WEAPON_REGISTRY.deagle,
    WEAPON_REGISTRY.glock,
    WEAPON_REGISTRY.usps
  ];

  const grenades: WeaponDef[] = [
    WEAPON_REGISTRY.he_grenade,
    WEAPON_REGISTRY.flashbang,
    WEAPON_REGISTRY.smoke
  ];

  const equipmentList = [
    EQUIPMENT_REGISTRY.kevlar,
    EQUIPMENT_REGISTRY.kevlar_helmet,
    EQUIPMENT_REGISTRY.defuse_kit,
    EQUIPMENT_REGISTRY.triple_weapon_perk
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-zinc-950 border border-amber-600/50 rounded-3xl max-w-4xl w-full p-4 sm:p-6 text-right shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-600/20 text-amber-500 border border-amber-500/40 shrink-0">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="font-['Teko',sans-serif] text-2xl sm:text-3xl font-black text-amber-400 tracking-wider">
                فروشگاه تسلیحات (BUY MENU)
              </h2>
              <p className="text-[10px] sm:text-xs text-zinc-400">سلاح، تیربار، شات‌گان، جلیقه و تجهیزات مورد نظر را انتخاب کنید</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-zinc-900 px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl border border-zinc-700 text-center">
              <span className="text-[9px] sm:text-[10px] text-zinc-400 block font-bold">بودجه:</span>
              <span className="font-['Teko',sans-serif] text-xl sm:text-2xl font-black text-emerald-400 leading-none">
                ${playerMoney}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Special Offer Banner */}
        <div className="bg-gradient-to-r from-amber-950/70 via-zinc-900 to-amber-950/70 border border-amber-500/50 rounded-2xl p-2.5 sm:p-3 mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="bg-amber-500 text-black text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg shrink-0">آفر ویژه $5000</span>
            <div>
              <h4 className="text-white text-xs sm:text-sm font-black">بند تاکتیکال ۳ سلاح (Tactical 3-Weapon Sling)</h4>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">با پرداخت ۵۰۰۰ دلار، قابلیت حمل ۳ تفنگ همزمان (مثلاً AWP + کلاش + شات‌گان یا دسرتیگل) را فعال کنید!</p>
            </div>
          </div>
          {hasTriplePerk ? (
            <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 self-end sm:self-auto shrink-0">
              <Check className="w-4 h-4" /> فعال شد
            </span>
          ) : (
            <button
              disabled={playerMoney < 5000}
              onClick={() => onBuyEquipment('triple_weapon_perk')}
              className={`px-4 py-1.5 sm:py-2 rounded-xl font-['Teko',sans-serif] text-lg sm:text-xl font-black transition-all shrink-0 self-end sm:self-auto ${
                playerMoney >= 5000
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md active:scale-95'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              خرید $5000
            </button>
          )}
        </div>

        {/* C4 Terrorist Selection / Management Banner */}
        {playerTeam === 'T' && (
          <div className="bg-gradient-to-r from-red-950/60 via-zinc-900 to-red-950/60 border border-red-500/40 rounded-2xl p-2.5 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-red-900/40 rounded-xl text-red-400 border border-red-500/30">
                <Bomb className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white text-xs sm:text-sm font-black flex items-center gap-2">
                  بمب انفجاری C4 (C4 Explosive)
                  {hasC4 && (
                    <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/50 px-2 py-0.5 rounded-full font-bold">
                      در کوله‌پشتی شما موجود است
                    </span>
                  )}
                </h4>
                <p className="text-[10px] sm:text-[11px] text-zinc-400">
                  {hasC4
                    ? 'شما حامل بمب C4 هستید. می‌توانید بمب را در محوطه سایت بکارید یا با کلید G بیاندازید.'
                    : 'شما در حال حاضر بمب C4 ندارید (به یکی از یاران داده شده). می‌توانید C4 را به سبد خرید اضافه کنید.'}
                </p>
              </div>
            </div>
            {onToggleC4 && (
              <button
                onClick={onToggleC4}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
                  hasC4
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-lg active:scale-95'
                }`}
              >
                {hasC4 ? 'حذف / انداختن C4' : 'دریافت بمب C4 (رایگان)'}
              </button>
            )}
          </div>
        )}

        {/* Categories Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-4">
          <button
            onClick={() => setActiveTab('rifles')}
            className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'rifles'
                ? 'bg-amber-600 text-black shadow-lg'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Crosshair className="w-4 h-4 shrink-0" />
            <span>تفنگ و اسنایپر</span>
          </button>

          <button
            onClick={() => setActiveTab('shotguns')}
            className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'shotguns'
                ? 'bg-amber-600 text-black shadow-lg'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Target className="w-4 h-4 shrink-0 text-red-400" />
            <span>شات‌گان‌ها (Shotgun)</span>
          </button>

          <button
            onClick={() => setActiveTab('heavy')}
            className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'heavy'
                ? 'bg-amber-600 text-black shadow-lg'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0 text-orange-400" />
            <span>تیربار سنگین (LMG)</span>
          </button>

          <button
            onClick={() => setActiveTab('smgs')}
            className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'smgs'
                ? 'bg-amber-600 text-black shadow-lg'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span>مسلسل (SMG)</span>
          </button>

          <button
            onClick={() => setActiveTab('pistols')}
            className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'pistols'
                ? 'bg-amber-600 text-black shadow-lg'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Crosshair className="w-4 h-4 shrink-0" />
            <span>کلت‌ها (Pistol)</span>
          </button>

          <button
            onClick={() => setActiveTab('grenades')}
            className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'grenades'
                ? 'bg-amber-600 text-black shadow-lg'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Bomb className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>نارنجک‌ها</span>
          </button>

          <button
            onClick={() => setActiveTab('equipment')}
            className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'equipment'
                ? 'bg-amber-600 text-black shadow-lg'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0 text-blue-400" />
            <span>تجهیزات دفاعی</span>
          </button>
        </div>

        {/* Weapons Grid */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {activeTab === 'rifles' &&
            rifles.map(w => (
              <div
                key={w.id}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/60 rounded-2xl p-4 flex justify-between items-center transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 text-amber-500">
                    {w.id === 'famas' ? (
                      <span className="font-mono font-black text-xs px-1 text-amber-400">BURST</span>
                    ) : (
                      <Crosshair className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-white text-lg group-hover:text-amber-400 transition-colors">
                        {w.persianName}
                      </h3>
                      {w.id === 'famas' && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                          ۳-تیر رگباری / اتوماتیک
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 max-w-md mt-1">{w.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-400">
                      <span>دمیج بدنه: <strong className="text-white">{w.damageBody}</strong></span>
                      <span>هدشات: <strong className="text-amber-400">{w.damageHead}</strong></span>
                      <span>خشاب: <strong className="text-white">{w.clipSize}/{w.maxReserveAmmo}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={playerMoney < w.price}
                  onClick={() => onBuyWeapon(w.id)}
                  className={`px-6 py-3 rounded-xl font-['Teko',sans-serif] text-2xl font-black transition-all ${
                    playerMoney >= w.price
                      ? 'bg-amber-600 hover:bg-amber-500 text-black shadow-lg active:scale-95'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  ${w.price}
                </button>
              </div>
            ))}

          {activeTab === 'shotguns' &&
            shotguns.map(w => (
              <div
                key={w.id}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-red-500/60 rounded-2xl p-4 flex justify-between items-center transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 text-red-400">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-white text-lg group-hover:text-red-400 transition-colors">
                        {w.persianName}
                      </h3>
                      <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-mono font-black">
                        {w.pelletsCount || 8} ساچمه همزمان (${w.killReward} پاداش)
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 max-w-md mt-1">{w.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-400">
                      <span>دمیج ساچمه‌ای: <strong className="text-white">{w.damageBody} × {w.pelletsCount || 8} = {(w.damageBody * (w.pelletsCount || 8))}</strong></span>
                      <span>هدشات هر ساچمه: <strong className="text-amber-400">{w.damageHead}</strong></span>
                      <span>ظرفیت لوله: <strong className="text-red-300 font-bold">{w.clipSize}</strong> / {w.maxReserveAmmo}</span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={playerMoney < w.price}
                  onClick={() => onBuyWeapon(w.id)}
                  className={`px-6 py-3 rounded-xl font-['Teko',sans-serif] text-2xl font-black transition-all ${
                    playerMoney >= w.price
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg active:scale-95'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  ${w.price}
                </button>
              </div>
            ))}

          {activeTab === 'heavy' &&
            heavyWeapons.map(w => (
              <div
                key={w.id}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/60 rounded-2xl p-4 flex justify-between items-center transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 text-orange-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-white text-lg group-hover:text-amber-400 transition-colors">
                        {w.persianName}
                      </h3>
                      {w.clipSize >= 100 && (
                        <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-mono font-black animate-pulse">
                          خشاب سنگین {w.clipSize} تیری
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 max-w-md mt-1">{w.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-400">
                      <span>دمیج: <strong className="text-white">{w.damageBody}</strong></span>
                      <span>هدشات: <strong className="text-amber-400">{w.damageHead}</strong></span>
                      <span>ظرفیت خشاب: <strong className="text-amber-300 font-bold">{w.clipSize}</strong> / {w.maxReserveAmmo}</span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={playerMoney < w.price}
                  onClick={() => onBuyWeapon(w.id)}
                  className={`px-6 py-3 rounded-xl font-['Teko',sans-serif] text-2xl font-black transition-all ${
                    playerMoney >= w.price
                      ? 'bg-amber-600 hover:bg-amber-500 text-black shadow-lg active:scale-95'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  ${w.price}
                </button>
              </div>
            ))}

          {activeTab === 'smgs' &&
            smgs.map(w => (
              <div
                key={w.id}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/60 rounded-2xl p-4 flex justify-between items-center transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 text-amber-500">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg group-hover:text-amber-400 transition-colors">
                      {w.persianName}
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mt-1">{w.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-400">
                      <span>دمیج: <strong className="text-white">{w.damageBody}</strong></span>
                      <span>خشاب: <strong className="text-white">{w.clipSize}/{w.maxReserveAmmo}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={playerMoney < w.price}
                  onClick={() => onBuyWeapon(w.id)}
                  className={`px-6 py-3 rounded-xl font-['Teko',sans-serif] text-2xl font-black transition-all ${
                    playerMoney >= w.price
                      ? 'bg-amber-600 hover:bg-amber-500 text-black shadow-lg active:scale-95'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  ${w.price}
                </button>
              </div>
            ))}

          {activeTab === 'pistols' &&
            pistols.map(w => (
              <div
                key={w.id}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/60 rounded-2xl p-4 flex justify-between items-center transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 text-amber-500">
                    <Crosshair className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg group-hover:text-amber-400 transition-colors">
                      {w.persianName}
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mt-1">{w.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-400">
                      <span>دمیج: <strong className="text-white">{w.damageBody}</strong></span>
                      <span>هدشات: <strong className="text-amber-400">{w.damageHead}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  disabled={playerMoney < w.price}
                  onClick={() => onBuyWeapon(w.id)}
                  className={`px-6 py-3 rounded-xl font-['Teko',sans-serif] text-2xl font-black transition-all ${
                    playerMoney >= w.price
                      ? 'bg-amber-600 hover:bg-amber-500 text-black shadow-lg active:scale-95'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  ${w.price}
                </button>
              </div>
            ))}

          {activeTab === 'grenades' &&
            grenades.map(w => (
              <div
                key={w.id}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/60 rounded-2xl p-4 flex justify-between items-center transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 text-amber-500">
                    {w.id === 'he_grenade' ? (
                      <Bomb className="w-6 h-6 text-red-500" />
                    ) : w.id === 'flashbang' ? (
                      <Sun className="w-6 h-6 text-yellow-400" />
                    ) : (
                      <Cloud className="w-6 h-6 text-zinc-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg group-hover:text-amber-400 transition-colors">
                      {w.persianName}
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mt-1">{w.description}</p>
                  </div>
                </div>

                <button
                  disabled={playerMoney < w.price}
                  onClick={() => onBuyWeapon(w.id)}
                  className={`px-6 py-3 rounded-xl font-['Teko',sans-serif] text-2xl font-black transition-all ${
                    playerMoney >= w.price
                      ? 'bg-amber-600 hover:bg-amber-500 text-black shadow-lg active:scale-95'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  ${w.price}
                </button>
              </div>
            ))}

          {activeTab === 'equipment' &&
            equipmentList.map(eq => (
              <div
                key={eq.id}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/60 rounded-2xl p-4 flex justify-between items-center transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 text-blue-400">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg group-hover:text-amber-400 transition-colors">
                      {eq.persianName}
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mt-1">{eq.description}</p>
                  </div>
                </div>

                <button
                  disabled={playerMoney < eq.price}
                  onClick={() => onBuyEquipment(eq.id as 'kevlar' | 'kevlar_helmet' | 'defuse_kit')}
                  className={`px-6 py-3 rounded-xl font-['Teko',sans-serif] text-2xl font-black transition-all ${
                    playerMoney >= eq.price
                      ? 'bg-amber-600 hover:bg-amber-500 text-black shadow-lg active:scale-95'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  ${eq.price}
                </button>
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-400">
          <span>کلید میانبر فروشگاه: <strong className="text-amber-400">B</strong> | بستن: <strong className="text-white">ESC</strong></span>
          <button
            onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-6 py-2 rounded-xl transition-all"
          >
            بستن فروشگاه
          </button>
        </div>

      </div>
    </div>
  );
};
