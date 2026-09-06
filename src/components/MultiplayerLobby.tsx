import React, { useState, useEffect } from 'react';
import {
  Globe,
  Users,
  Plus,
  ArrowRight,
  Shield,
  Bomb,
  Lock,
  RefreshCw,
  Wifi,
  Sparkles,
  Zap,
  Play,
  X
} from 'lucide-react';
import { mpClient } from '../network/multiplayerClient';
import { MultiplayerRoomInfo, Team, WeaponId } from '../types';

interface MultiplayerLobbyProps {
  isOpen: boolean;
  playerName: string;
  playerTeam: Team;
  onClose: () => void;
  onJoinSuccess: (roomId: string, roomInfo: MultiplayerRoomInfo, playerId: string) => void;
  onUpdatePlayerProfile: (name: string, team: Team) => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  isOpen,
  playerName,
  playerTeam,
  onClose,
  onJoinSuccess,
  onUpdatePlayerProfile
}) => {
  const [rooms, setRooms] = useState<MultiplayerRoomInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState(`اتاق ${playerName}`);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [maxPlayersInput, setMaxPlayersInput] = useState(10);
  const [passwordInput, setPasswordInput] = useState('');
  const [joinPasswordInput, setJoinPasswordInput] = useState('');
  const [selectedRoomForPassword, setSelectedRoomForPassword] = useState<MultiplayerRoomInfo | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    mpClient.connect().then(() => {
      mpClient.fetchRooms();
    });

    const unsubscribe = mpClient.subscribe((event) => {
      if (event.type === 'room_list') {
        setRooms(event.rooms || []);
        setIsLoading(false);
      } else if (event.type === 'room_joined') {
        setStatusMessage('با موفقیت وارد اتاق شدید!');
        onJoinSuccess(event.roomId, event.roomInfo, event.playerId);
      } else if (event.type === 'error') {
        setStatusMessage(event.message || 'خطا در برقراری ارتباط');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, onJoinSuccess]);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setIsLoading(true);
    mpClient.fetchRooms();
    setTimeout(() => setIsLoading(false), 800);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNameInput.trim()) return;

    setStatusMessage('در حال ایجاد اتاق...');
    mpClient.createRoom(
      roomNameInput.trim(),
      {
        name: playerName,
        team: playerTeam,
        activeWeaponId: playerTeam === 'T' ? 'ak47' : 'm4a1'
      },
      maxPlayersInput,
      passwordInput.trim() || undefined
    );
  };

  const handleJoinRoom = (room: MultiplayerRoomInfo) => {
    if (room.hasPassword) {
      setSelectedRoomForPassword(room);
      return;
    }

    setStatusMessage(`در حال اتصال به اتاق ${room.name}...`);
    mpClient.joinRoom(room.id, {
      name: playerName,
      team: playerTeam,
      activeWeaponId: playerTeam === 'T' ? 'ak47' : 'm4a1'
    });
  };

  const handleJoinWithPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomForPassword) return;

    setStatusMessage(`در حال اتصال با رمز...`);
    mpClient.joinRoom(
      selectedRoomForPassword.id,
      {
        name: playerName,
        team: playerTeam,
        activeWeaponId: playerTeam === 'T' ? 'ak47' : 'm4a1'
      },
      joinPasswordInput
    );
    setSelectedRoomForPassword(null);
    setJoinPasswordInput('');
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;

    setStatusMessage(`در حال جستجوی کد ${roomCodeInput.toUpperCase()}...`);
    mpClient.joinRoom(roomCodeInput.trim().toUpperCase(), {
      name: playerName,
      team: playerTeam,
      activeWeaponId: playerTeam === 'T' ? 'ak47' : 'm4a1'
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border-2 border-amber-500/70 rounded-3xl max-w-4xl w-full p-6 text-white shadow-[0_0_50px_rgba(245,158,11,0.3)] relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Globe className="w-7 h-7 animate-spin [animation-duration:12s]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Teko',sans-serif] text-3xl md:text-4xl font-black text-amber-400 tracking-wider">
                  لابی چندنفره آنلاین (MULTIPLAYER SERVER)
                </h2>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/50 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> آنلاین (پینگ: {mpClient.ping}ms)
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                به اتاق‌های بازیکنان دیگر بپیوندید یا اتاق جدید بسازید و دوستانتان را دعوت کنید
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Player Profile & Team Bar */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-400">نام شما:</span>
            <input
              type="text"
              value={playerName}
              maxLength={16}
              onChange={(e) => onUpdatePlayerProfile(e.target.value, playerTeam)}
              className="bg-black/60 border border-zinc-700 rounded-xl px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-amber-500 max-w-[150px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400">تیم شما:</span>
            <button
              onClick={() => onUpdatePlayerProfile(playerName, 'T')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                playerTeam === 'T'
                  ? 'bg-red-600 text-white shadow-md ring-2 ring-red-500/60'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <Bomb className="w-3.5 h-3.5" />
              تروریست (T)
            </button>
            <button
              onClick={() => onUpdatePlayerProfile(playerName, 'CT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                playerTeam === 'CT'
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-500/60'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              ضدتروریست (CT)
            </button>
          </div>
        </div>

        {/* Status Message Notification */}
        {statusMessage && (
          <div className="mb-3 bg-amber-950/60 border border-amber-500/60 text-amber-200 text-xs px-4 py-2 rounded-xl flex items-center justify-between animate-in fade-in">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-amber-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Content Tabs / Create Form */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
          
          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreating(false)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                  !isCreating
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Users className="w-4 h-4" />
                لیست اتاق‌های آنلاین ({rooms.length})
              </button>

              <button
                onClick={() => setIsCreating(true)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                  isCreating
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Plus className="w-4 h-4" />
                ایجاد اتاق جدید
              </button>
            </div>

            {/* Direct Join by Code */}
            <form onSubmit={handleJoinByCode} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="کد ۶ رقمی اتاق..."
                value={roomCodeInput}
                maxLength={6}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                className="bg-black/80 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-mono text-center uppercase tracking-widest text-amber-300 focus:outline-none focus:border-amber-500 w-36"
              />
              <button
                type="submit"
                className="bg-zinc-800 hover:bg-amber-600 hover:text-black text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                <span>ورود با کد</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </form>
          </div>

          {/* CREATE ROOM FORM */}
          {isCreating ? (
            <form onSubmit={handleCreateRoom} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                مشخصات اتاق جدید
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">نام اتاق:</label>
                  <input
                    type="text"
                    required
                    value={roomNameInput}
                    onChange={(e) => setRoomNameInput(e.target.value)}
                    placeholder="مثلاً: نبرد تیراندازان ایرانی"
                    className="w-full bg-black/80 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">حداکثر بازیکنان:</label>
                  <select
                    value={maxPlayersInput}
                    onChange={(e) => setMaxPlayersInput(Number(e.target.value))}
                    className="w-full bg-black/80 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value={2}>۲ نفر (دوئل ۱ به ۱)</option>
                    <option value={4}>۴ نفر (۲ به ۲)</option>
                    <option value={6}>۶ نفر (۳ به ۳)</option>
                    <option value={10}>۱۰ نفر (۵ به ۵ کلاسیک)</option>
                    <option value={16}>۱۶ نفر (۸ به ۸ شلوغ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">نقشه مسابقه:</label>
                  <div className="bg-black/60 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-amber-300 font-bold">
                    🏜️ de_dust2 Remastered (سایت A و B بمب‌گذاری)
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">رمز عبور (اختیاری برای بازی خصوصی):</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="در صورت خالی بودن، اتاق عمومی خواهد بود"
                    className="w-full bg-black/80 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2 rounded-xl font-['Teko',sans-serif] text-2xl font-black transition-all shadow-lg flex items-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" />
                  ساخت و شروع مسابقه
                </button>
              </div>
            </form>
          ) : (
            /* ROOM LIST */
            <div className="space-y-2.5">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-zinc-400">
                  اتاق‌های فعال بر روی سرور:
                </span>
                <button
                  onClick={handleRefresh}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  به‌روزرسانی لیست
                </button>
              </div>

              {rooms.length === 0 ? (
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-8 text-center">
                  <Globe className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <h4 className="text-white font-bold text-sm mb-1">هنوز اتاقی ساخته نشده است</h4>
                  <p className="text-xs text-zinc-400 mb-4 max-w-sm mx-auto">
                    شما اولین نفری باشید که اتاق می‌سازید و دوستانتان می‌توانند به آن متصل شوند.
                  </p>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-black px-5 py-2 rounded-xl text-xs font-black transition-all inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    ایجاد اولین اتاق مسابقه
                  </button>
                </div>
              ) : (
                rooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/60 rounded-2xl p-3.5 flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-black/60 rounded-xl border border-zinc-800 text-amber-400 group-hover:scale-105 transition-transform">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                            {room.name}
                          </h4>
                          {room.hasPassword && (
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span className="font-mono text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                            کد: {room.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                          <span>میزبان: <strong className="text-zinc-200">{room.hostName}</strong></span>
                          <span>امتیاز T: <strong className="text-red-400">{room.scoreT}</strong> - CT: <strong className="text-blue-400">{room.scoreCT}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <span className="text-xs font-mono font-black text-amber-300 block">
                          {room.playerCount} / {room.maxPlayers}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">بازیکنان</span>
                      </div>

                      <button
                        onClick={() => handleJoinRoom(room)}
                        disabled={room.playerCount >= room.maxPlayers}
                        className={`px-5 py-2 rounded-xl font-['Teko',sans-serif] text-xl font-black transition-all flex items-center gap-1.5 ${
                          room.playerCount < room.maxPlayers
                            ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        <span>ورود</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* Password Prompt Modal */}
        {selectedRoomForPassword && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={handleJoinWithPassword} className="bg-zinc-950 border border-amber-500 p-6 rounded-2xl max-w-sm w-full text-right shadow-2xl">
              <h3 className="font-bold text-white text-base mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                این اتاق دارای رمز عبور است
              </h3>
              <p className="text-xs text-zinc-400 mb-4">
                لطفاً رمز عبور اتاق «{selectedRoomForPassword.name}» را وارد کنید:
              </p>
              <input
                type="password"
                required
                autoFocus
                value={joinPasswordInput}
                onChange={(e) => setJoinPasswordInput(e.target.value)}
                placeholder="رمز عبور..."
                className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRoomForPassword(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-400"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 text-black hover:bg-amber-400"
                >
                  تأیید و ورود
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
