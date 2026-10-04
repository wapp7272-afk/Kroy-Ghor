// Soft Audio Notification Synthesizer using Web Audio API
// Runs cleanly in all modern browsers without requiring external audio asset files or CORS.

class OrderSoundNotifier {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('kroyghor_admin_sound_muted', muted ? 'true' : 'false');
    } catch {}
  }

  public getMuted(): boolean {
    try {
      return localStorage.getItem('kroyghor_admin_sound_muted') === 'true';
    } catch {
      return this.isMuted;
    }
  }

  /**
   * Plays a pleasant, soft two-tone chime (587.33Hz D5 -> 880Hz A5) for instant new order notification
   */
  public playNewOrderChime() {
    if (this.getMuted()) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Master gain node for gentle volume
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.18, now);
      masterGain.connect(ctx.destination);

      // Note 1: High crisp bell (D5: 587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.8, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Note 2: Harmonious resonance (A5: 880 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.9, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.9);

      // Warm background sub-tone (F#5: 739.99 Hz)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(739.99, now + 0.18);
      gain3.gain.setValueAtTime(0, now + 0.18);
      gain3.gain.linearRampToValueAtTime(0.3, now + 0.22);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc3.connect(gain3);
      gain3.connect(masterGain);
      osc3.start(now + 0.18);
      osc3.stop(now + 0.75);
    } catch (e) {
      console.warn('[AudioNotification] Audio playback was prevented or not supported:', e);
    }
  }
}

export const soundNotifier = new OrderSoundNotifier();
