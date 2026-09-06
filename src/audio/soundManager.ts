import { WeaponId } from '../types';

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8;
  private tinnitusOsc: OscillatorNode | null = null;
  private tinnitusGain: GainNode | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public playWeaponShot(weaponId: WeaponId, isSilenced: boolean = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const mainGain = this.ctx.createGain();
    mainGain.connect(this.ctx.destination);
    mainGain.gain.setValueAtTime(this.volume, now);

    switch (weaponId) {
      case 'famas': {
        // FAMAS F1: High-pitched crisp military rifle crack with metallic snap
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

        oscGain.gain.setValueAtTime(0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(oscGain);
        oscGain.connect(mainGain);
        osc.start(now);
        osc.stop(now + 0.12);

        // Noise snap
        this.playNoiseBurst(now, 0.08, 0.4, 1800, mainGain);
        break;
      }

      case 'ak47': {
        // AK-47: Deep 7.62mm booming crack with gritty punch
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.22);

        oscGain.gain.setValueAtTime(0.65, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        osc.connect(oscGain);
        oscGain.connect(mainGain);
        osc.start(now);
        osc.stop(now + 0.22);

        this.playNoiseBurst(now, 0.14, 0.6, 900, mainGain);
        break;
      }

      case 'm4a1': {
        // M4A1-S: Silenced smooth phut
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(isSilenced ? 220 : 350, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + (isSilenced ? 0.09 : 0.14));

        oscGain.gain.setValueAtTime(isSilenced ? 0.35 : 0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + (isSilenced ? 0.09 : 0.14));

        osc.connect(oscGain);
        oscGain.connect(mainGain);
        osc.start(now);
        osc.stop(now + (isSilenced ? 0.09 : 0.14));

        this.playNoiseBurst(now, isSilenced ? 0.06 : 0.1, isSilenced ? 0.25 : 0.45, isSilenced ? 2500 : 1400, mainGain);
        break;
      }

      case 'awp': {
        // AWP: Huge thunderous gunshot with deep sub-bass and long echo
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.55);

        oscGain.gain.setValueAtTime(0.9, now);
        oscGain.gain.exponentialRampToValueAtTime(0.005, now + 0.55);

        osc.connect(oscGain);
        oscGain.connect(mainGain);
        osc.start(now);
        osc.stop(now + 0.55);

        // Heavy sub kick
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(80, now);
        sub.frequency.exponentialRampToValueAtTime(15, now + 0.4);
        subGain.gain.setValueAtTime(0.8, now);
        subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        sub.connect(subGain);
        subGain.connect(mainGain);
        sub.start(now);
        sub.stop(now + 0.4);

        this.playNoiseBurst(now, 0.35, 0.7, 700, mainGain);
        break;
      }

      case 'scout': {
        // SSG 08: Sharp sniper crack without the heavy bass of AWP
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

        oscGain.gain.setValueAtTime(0.6, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(oscGain);
        oscGain.connect(mainGain);
        osc.start(now);
        osc.stop(now + 0.2);

        this.playNoiseBurst(now, 0.16, 0.5, 1600, mainGain);
        break;
      }

      case 'negev': {
        // Negev: Heavy rhythmic chattering machine gun with metallic percussion
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.1);

        oscGain.gain.setValueAtTime(0.55, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(oscGain);
        oscGain.connect(mainGain);
        osc.start(now);
        osc.stop(now + 0.1);

        // Sub bass thump
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(110, now);
        sub.frequency.exponentialRampToValueAtTime(25, now + 0.09);
        subGain.gain.setValueAtTime(0.45, now);
        subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        sub.connect(subGain);
        subGain.connect(mainGain);
        sub.start(now);
        sub.stop(now + 0.09);

        this.playNoiseBurst(now, 0.09, 0.5, 1100, mainGain);
        break;
      }

      case 'm249': {
        // M249: Thundering squad automatic weapon
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

        oscGain.gain.setValueAtTime(0.65, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(oscGain);
        oscGain.connect(mainGain);
        osc.start(now);
        osc.stop(now + 0.12);

        this.playNoiseBurst(now, 0.11, 0.6, 950, mainGain);
        break;
      }

      case 'xm1014': {
        // XM1014 Shotgun: Heavy dual blast with bass kick
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.18);

        oscGain.gain.setValueAtTime(0.8, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        osc.connect(oscGain);
        oscGain.connect(mainGain);
        osc.start(now);
        osc.stop(now + 0.18);

        this.playNoiseBurst(now, 0.16, 0.85, 800, mainGain);
        break;
      }

      case 'bizon':
      case 'p90':
      case 'mp5sd': {
        // High cadence SMG
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

        oscGain.gain.setValueAtTime(0.38, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(oscGain);
        oscGain.connect(mainGain);
        osc.start(now);
        osc.stop(now + 0.08);

        this.playNoiseBurst(now, 0.06, 0.3, 2000, mainGain);
        break;
      }

      case 'deagle': {
        // Desert Eagle .50: Heavy pistol cannon
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.25);

        oscGain.gain.setValueAtTime(0.7, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(oscGain);
        oscGain.connect(mainGain);
        osc.start(now);
        osc.stop(now + 0.25);

        this.playNoiseBurst(now, 0.18, 0.55, 1100, mainGain);
        break;
      }

      case 'glock':
      case 'usps': {
        // Standard pistols
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);

        oscGain.gain.setValueAtTime(0.45, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(oscGain);
        oscGain.connect(mainGain);
        osc.start(now);
        osc.stop(now + 0.12);

        this.playNoiseBurst(now, 0.08, 0.35, 1800, mainGain);
        break;
      }

      default:
        break;
    }
  }

  private playNoiseBurst(startTime: number, duration: number, volume: number, filterFreq: number, dest: AudioNode) {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.005, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(startTime);
    noise.stop(startTime + duration);
  }

  public playKnifeSlash() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.12);

    gain.gain.setValueAtTime(0.35 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playKnifeHit(isHeadOrBack: boolean) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(isHeadOrBack ? 350 : 200, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    gain.gain.setValueAtTime(0.5 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playReload() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Mag out click
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(500, now);
    osc1.frequency.linearRampToValueAtTime(250, now + 0.08);
    gain1.gain.setValueAtTime(0.25 * this.volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Mag in click (0.4s later)
    setTimeout(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(300, t);
      osc2.frequency.exponentialRampToValueAtTime(700, t + 0.09);
      gain2.gain.setValueAtTime(0.2 * this.volume, t);
      gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t);
      osc2.stop(t + 0.09);
    }, 400);

    // Bolt rack (0.9s later)
    setTimeout(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = 'sawtooth';
      osc3.frequency.setValueAtTime(800, t);
      osc3.frequency.linearRampToValueAtTime(400, t + 0.12);
      gain3.gain.setValueAtTime(0.3 * this.volume, t);
      gain3.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      osc3.connect(gain3);
      gain3.connect(this.ctx.destination);
      osc3.start(t);
      osc3.stop(t + 0.12);
    }, 900);
  }

  public playModeSwitch() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.setValueAtTime(900, now + 0.03);
    gain.gain.setValueAtTime(0.18 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playDryFire() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, now);
    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playHeadshotDink() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Iconic metallic CS helmet ping
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.25);

    gain.gain.setValueAtTime(0.45 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playHitMarker() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playGrenadePin() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.linearRampToValueAtTime(2200, now + 0.1);
    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playGrenadeBounce() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);
    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playExplosion() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Initial supersonic detonator crack
    const crackOsc = this.ctx.createOscillator();
    const crackGain = this.ctx.createGain();
    crackOsc.type = 'sawtooth';
    crackOsc.frequency.setValueAtTime(380, now);
    crackOsc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
    crackGain.gain.setValueAtTime(1.0 * this.volume, now);
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    crackOsc.connect(crackGain);
    crackGain.connect(this.ctx.destination);
    crackOsc.start(now);
    crackOsc.stop(now + 0.12);

    // 2. Heavy Sub-bass Concussion shockwave
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(130, now);
    subOsc.frequency.exponentialRampToValueAtTime(12, now + 1.2);
    subGain.gain.setValueAtTime(1.2 * this.volume, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 1.2);

    // 3. Extended fire & debris explosion roar
    this.playNoiseBurst(now, 1.1, 0.95 * this.volume, 450, this.ctx.destination);
    // Secondary crackle
    setTimeout(() => {
      if (!this.ctx) return;
      this.playNoiseBurst(this.ctx.currentTime, 0.4, 0.4 * this.volume, 1200, this.ctx.destination);
    }, 140);
  }

  public playFlashbangDetonate() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sharp flash pop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    gain.gain.setValueAtTime(0.7 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    // Start Tinnitus high pitch ringing
    this.startTinnitus(3.5);
  }

  public startTinnitus(durationSeconds: number = 3.5) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    if (this.tinnitusOsc) {
      try {
        this.tinnitusOsc.stop();
        this.tinnitusOsc.disconnect();
      } catch { }
    }

    const now = this.ctx.currentTime;
    this.tinnitusOsc = this.ctx.createOscillator();
    this.tinnitusGain = this.ctx.createGain();

    this.tinnitusOsc.type = 'sine';
    this.tinnitusOsc.frequency.setValueAtTime(3800, now);

    this.tinnitusGain.gain.setValueAtTime(0.4 * this.volume, now);
    this.tinnitusGain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);

    this.tinnitusOsc.connect(this.tinnitusGain);
    this.tinnitusGain.connect(this.ctx.destination);

    this.tinnitusOsc.start(now);
    this.tinnitusOsc.stop(now + durationSeconds);
  }

  public playSmokeHiss() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playNoiseBurst(now, 1.2, 0.45 * this.volume, 2400, this.ctx.destination);
  }

  public playBuySound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.08); // A5
    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playC4Beep(timerRemaining: number) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Frequency gets slightly sharper as danger escalates
    const freq = timerRemaining < 10 ? 2200 : timerRemaining < 20 ? 1850 : 1500;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.35 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playC4PlantSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.setValueAtTime(1400, now + 0.04);
    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playC4DefuseTick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playC4DefusedSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.24); // G5
    gain.gain.setValueAtTime(0.4 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
    this.playRadio('The bomb has been defused!');
  }

  public playC4NuclearExplosion() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Deep sub-bass earthquake rumble
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(60, now);
    sub.frequency.exponentialRampToValueAtTime(10, now + 2.5);
    subGain.gain.setValueAtTime(0.9 * this.volume, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 2.5);

    // Massive noise blast
    this.playNoiseBurst(now, 2.0, 0.85 * this.volume, 400, this.ctx.destination);
    this.startTinnitus(3.0);
  }

  public playRadio(text: string) {
    // Speech synthesis radio commands
    if (this.isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = this.volume * 0.9;
      utterance.rate = 1.15;
      utterance.pitch = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch { }
  }
}

export const soundManager = new SoundManager();
