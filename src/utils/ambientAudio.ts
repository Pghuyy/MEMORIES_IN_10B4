import { ChapterAudioTrack, ChapterId } from '../types/memory';

interface ArrangementStep {
  bass?: number;
  chords?: number[];
  lead?: number;
  leadDuration?: number;
  staccato?: boolean;
}

interface ChapterScore {
  stepMs: number;
  style: 'lofi-piano' | 'playful-pizz' | 'ballad-duet' | 'acoustic-duet' | 'musicbox' | 'finale-duet';
  hasRainTexture: boolean;
  steps: ArrangementStep[];
}

// Expressive Vietnamese Gen Z Ballad & Indie Chill arrangements (Piano + Violin + Lo-fi)
const CHAPTER_SCORES: Record<ChapterId, ChapterScore> = {
  // 01. Đời thường — Lo-fi Piano & Mưa nhẹ (Cmaj7 - G/B - Am7 - Fmaj7, 4/4 chill swing)
  everyday: {
    stepMs: 620,
    style: 'lofi-piano',
    hasRainTexture: true,
    steps: [
      { bass: 130.81, chords: [261.63, 329.63, 392.0, 493.88], lead: 659.25, leadDuration: 1.6 },
      { chords: [329.63, 392.0, 493.88] },
      { lead: 587.33, leadDuration: 1.1 },
      { chords: [392.0, 493.88], lead: 523.25, leadDuration: 1.4 },

      { bass: 123.47, chords: [246.94, 293.66, 392.0], lead: 587.33, leadDuration: 1.6 },
      { chords: [293.66, 392.0] },
      { lead: 493.88, leadDuration: 1.2 },
      { chords: [392.0, 440.0], lead: 440.0, leadDuration: 1.5 },

      { bass: 110.0, chords: [220.0, 261.63, 329.63, 392.0], lead: 523.25, leadDuration: 1.7 },
      { chords: [261.63, 329.63, 392.0] },
      { lead: 587.33, leadDuration: 1.1 },
      { chords: [329.63, 392.0], lead: 659.25, leadDuration: 1.6 },

      { bass: 87.31, chords: [174.61, 220.0, 261.63, 329.63], lead: 523.25, leadDuration: 1.8 },
      { chords: [220.0, 261.63, 329.63] },
      { lead: 440.0, leadDuration: 1.2 },
      { chords: [261.63, 329.63], lead: 392.0, leadDuration: 1.8 },
    ],
  },

  // 02. Chuyện khó đỡ — Pizzicato & Piano nhí nhảnh (G6 - D/F# - Em7 - Cadd9)
  chaos: {
    stepMs: 340,
    style: 'playful-pizz',
    hasRainTexture: false,
    steps: [
      { bass: 196.0, chords: [293.66, 392.0], lead: 783.99, leadDuration: 0.45, staccato: true },
      { lead: 659.25, leadDuration: 0.35, staccato: true },
      { chords: [329.63, 493.88], lead: 587.33, leadDuration: 0.45, staccato: true },
      { lead: 783.99, leadDuration: 0.45, staccato: true },

      { bass: 185.0, chords: [293.66, 369.99], lead: 880.0, leadDuration: 0.45, staccato: true },
      { lead: 783.99, leadDuration: 0.35, staccato: true },
      { chords: [293.66, 440.0], lead: 659.25, leadDuration: 0.45, staccato: true },
      { lead: 587.33, leadDuration: 0.45, staccato: true },

      { bass: 164.81, chords: [246.94, 329.63], lead: 659.25, leadDuration: 0.45, staccato: true },
      { lead: 783.99, leadDuration: 0.35, staccato: true },
      { chords: [293.66, 392.0], lead: 880.0, leadDuration: 0.5, staccato: true },
      { lead: 987.77, leadDuration: 0.55, staccato: true },

      { bass: 130.81, chords: [261.63, 329.63, 392.0], lead: 783.99, leadDuration: 0.5, staccato: true },
      { lead: 659.25, leadDuration: 0.4, staccato: true },
      { chords: [293.66, 392.0], lead: 587.33, leadDuration: 0.55, staccato: true },
      { lead: 659.25, leadDuration: 0.65, staccato: true },
    ],
  },

  // 03. Dấu mốc — Piano & Violin Ballad sâu lắng (Dm9 - Bbmaj7 - Fmaj7 - Csus4)
  milestones: {
    stepMs: 740,
    style: 'ballad-duet',
    hasRainTexture: false,
    steps: [
      { bass: 146.83, chords: [220.0, 261.63, 329.63], lead: 587.33, leadDuration: 2.3 },
      { chords: [261.63, 329.63] },
      { chords: [220.0, 261.63], lead: 659.25, leadDuration: 1.5 },
      { chords: [293.66, 349.23], lead: 698.46, leadDuration: 1.7 },

      { bass: 116.54, chords: [174.61, 220.0, 293.66], lead: 587.33, leadDuration: 2.4 },
      { chords: [220.0, 293.66] },
      { chords: [174.61, 261.63], lead: 523.25, leadDuration: 1.6 },
      { chords: [220.0, 293.66], lead: 440.0, leadDuration: 1.8 },

      { bass: 87.31, chords: [174.61, 220.0, 261.63, 329.63], lead: 523.25, leadDuration: 2.3 },
      { chords: [220.0, 261.63] },
      { chords: [261.63, 329.63], lead: 587.33, leadDuration: 1.5 },
      { chords: [220.0, 329.63], lead: 659.25, leadDuration: 1.8 },

      { bass: 130.81, chords: [196.0, 261.63, 293.66], lead: 587.33, leadDuration: 2.6 },
      { chords: [261.63, 329.63] },
      { chords: [196.0, 246.94], lead: 523.25, leadDuration: 1.7 },
      { chords: [196.0, 246.94], lead: 493.88, leadDuration: 1.9 },
    ],
  },

  // 04. Con người — Song tấu Chiều tan học (Abmaj7 - Fm9 - Dbmaj7 - Eb6)
  people: {
    stepMs: 650,
    style: 'acoustic-duet',
    hasRainTexture: true,
    steps: [
      { bass: 103.83, chords: [207.65, 261.63, 311.13, 392.0], lead: 622.25, leadDuration: 1.8 },
      { chords: [261.63, 311.13] },
      { chords: [311.13, 392.0], lead: 523.25, leadDuration: 1.3 },
      { chords: [261.63, 392.0], lead: 466.16, leadDuration: 1.5 },

      { bass: 87.31, chords: [174.61, 207.65, 261.63, 311.13], lead: 523.25, leadDuration: 1.9 },
      { chords: [207.65, 261.63] },
      { chords: [261.63, 311.13], lead: 466.16, leadDuration: 1.4 },
      { chords: [207.65, 311.13], lead: 415.3, leadDuration: 1.6 },

      { bass: 138.59, chords: [207.65, 261.63, 277.18], lead: 466.16, leadDuration: 1.9 },
      { chords: [207.65, 261.63] },
      { chords: [261.63, 349.23], lead: 523.25, leadDuration: 1.4 },
      { chords: [207.65, 349.23], lead: 622.25, leadDuration: 1.6 },

      { bass: 155.56, chords: [233.08, 261.63, 311.13], lead: 587.33, leadDuration: 2.0 },
      { chords: [261.63, 311.13] },
      { chords: [233.08, 311.13], lead: 466.16, leadDuration: 1.5 },
      { chords: [196.0, 233.08], lead: 392.0, leadDuration: 1.8 },
    ],
  },

  // 05. Điều nhỏ bé — Hộp nhạc & Cát-sét (Ebmaj7 - Cm9 - Abmaj7 - Bb6)
  details: {
    stepMs: 560,
    style: 'musicbox',
    hasRainTexture: true,
    steps: [
      { bass: 155.56, chords: [311.13, 392.0, 466.16], lead: 783.99, leadDuration: 1.4 },
      { chords: [392.0, 587.33], lead: 698.46, leadDuration: 1.2 },
      { chords: [311.13, 466.16], lead: 622.25, leadDuration: 1.4 },
      { chords: [392.0, 587.33] },

      { bass: 130.81, chords: [261.63, 311.13, 392.0], lead: 698.46, leadDuration: 1.4 },
      { chords: [311.13, 466.16], lead: 622.25, leadDuration: 1.2 },
      { chords: [261.63, 392.0], lead: 523.25, leadDuration: 1.4 },
      { chords: [311.13, 392.0] },

      { bass: 103.83, chords: [207.65, 261.63, 311.13], lead: 622.25, leadDuration: 1.5 },
      { chords: [261.63, 392.0], lead: 523.25, leadDuration: 1.3 },
      { chords: [207.65, 311.13], lead: 466.16, leadDuration: 1.5 },
      { chords: [261.63, 392.0] },

      { bass: 116.54, chords: [233.08, 293.66, 392.0], lead: 587.33, leadDuration: 1.6 },
      { chords: [293.66, 392.0], lead: 622.25, leadDuration: 1.4 },
      { chords: [233.08, 349.23], lead: 698.46, leadDuration: 1.7 },
      { chords: [293.66, 349.23] },
    ],
  },

  // 06. Kỷ yếu — Hòa tấu Thanh xuân 10B4 (Fmaj7 - G6 - Em7 - Am9 - Dm7 - G7 - Cmaj9)
  yearbook: {
    stepMs: 700,
    style: 'finale-duet',
    hasRainTexture: false,
    steps: [
      { bass: 87.31, chords: [174.61, 220.0, 261.63, 329.63], lead: 659.25, leadDuration: 2.2 },
      { chords: [220.0, 261.63, 329.63], lead: 587.33, leadDuration: 1.3 },
      { bass: 98.0, chords: [196.0, 246.94, 293.66, 329.63], lead: 587.33, leadDuration: 2.0 },
      { chords: [246.94, 293.66], lead: 659.25, leadDuration: 1.5 },

      { bass: 164.81, chords: [246.94, 293.66, 392.0], lead: 783.99, leadDuration: 2.1 },
      { chords: [293.66, 392.0], lead: 659.25, leadDuration: 1.3 },
      { bass: 110.0, chords: [220.0, 261.63, 329.63, 493.88], lead: 587.33, leadDuration: 2.1 },
      { chords: [261.63, 329.63], lead: 523.25, leadDuration: 1.5 },

      { bass: 146.83, chords: [220.0, 261.63, 349.23], lead: 523.25, leadDuration: 2.1 },
      { chords: [261.63, 349.23], lead: 587.33, leadDuration: 1.4 },
      { bass: 98.0, chords: [196.0, 246.94, 293.66, 349.23], lead: 659.25, leadDuration: 2.0 },
      { chords: [246.94, 293.66], lead: 587.33, leadDuration: 1.5 },

      { bass: 130.81, chords: [196.0, 246.94, 293.66, 329.63], lead: 523.25, leadDuration: 2.6 },
      { chords: [246.94, 329.63] },
      { chords: [261.63, 392.0], lead: 659.25, leadDuration: 1.9 },
      { chords: [246.94, 329.63] },
    ],
  },
};

class VietnameseFilmAudioEngine {
  private ctx: AudioContext | null = null;
  private synthBus: GainNode | null = null;
  private reverbDelay: DelayNode | null = null;
  private rainGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;

  private timerId: number | null = null;
  private isPlaying = false;
  private volume = 0.45;
  private rainEnabled = true;
  private activeChapter: ChapterId = 'everyday';
  private stepIndex = 0;

  // Custom uploaded MP3 tracks per chapter
  private customTracks: Partial<Record<ChapterId, ChapterAudioTrack>> = {};
  private audioEl: HTMLAudioElement | null = null;
  private fadeRafId: number | null = null;

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      const master = this.ctx.createGain();
      master.gain.value = 1;
      master.connect(this.ctx.destination);

      this.synthBus = this.ctx.createGain();
      this.synthBus.gain.value = 0;

      // Subtle warm tape delay / hall reverb
      const dry = this.ctx.createGain();
      dry.gain.value = 0.78;
      const wet = this.ctx.createGain();
      wet.gain.value = 0.28;

      this.reverbDelay = this.ctx.createDelay(1.0);
      this.reverbDelay.delayTime.value = 0.24;
      const feedback = this.ctx.createGain();
      feedback.gain.value = 0.32;
      const damp = this.ctx.createBiquadFilter();
      damp.type = 'lowpass';
      damp.frequency.value = 1650;

      this.synthBus.connect(dry);
      dry.connect(master);

      this.synthBus.connect(this.reverbDelay);
      this.reverbDelay.connect(damp);
      damp.connect(feedback);
      feedback.connect(this.reverbDelay);
      damp.connect(wet);
      wet.connect(master);

      // Gentle Lo-fi rain & cassette hiss loop
      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.value = 0;
      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.value = 1150;
      rainFilter.Q.value = 0.6;

      this.rainGain.connect(rainFilter);
      rainFilter.connect(master);

      this.startRainNoiseLoop();
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  private startRainNoiseLoop() {
    if (!this.ctx || !this.rainGain || this.rainSource) return;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Pink-ish rain noise with occasional gentle cassette crackle
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      let sample = (b0 + b1 + b2 + white * 0.1848) * 0.05;
      if (Math.random() > 0.9994) {
        sample += (Math.random() - 0.5) * 0.08;
      }
      data[i] = sample;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(this.rainGain);
    src.start();
    this.rainSource = src;
  }

  public setCustomTracks(tracks: Partial<Record<ChapterId, ChapterAudioTrack>>) {
    const prevUrl = this.customTracks[this.activeChapter]?.url;
    this.customTracks = tracks;
    const nextUrl = this.customTracks[this.activeChapter]?.url;
    if (this.isPlaying && prevUrl !== nextUrl) {
      this.activateCurrentChapterAudio();
    }
  }

  public start(chapter: ChapterId, volume: number, rainEnabled: boolean) {
    this.activeChapter = chapter;
    this.volume = Math.max(0, Math.min(1, volume));
    this.rainEnabled = rainEnabled;
    this.isPlaying = true;
    this.ensureContext();
    this.activateCurrentChapterAudio();
  }

  public stop() {
    this.isPlaying = false;
    this.stopSynthScheduler();
    this.fadeOutCustomAudio();
    if (this.ctx && this.synthBus && this.rainGain) {
      const now = this.ctx.currentTime;
      this.synthBus.gain.setTargetAtTime(0, now, 0.28);
      this.rainGain.gain.setTargetAtTime(0, now, 0.25);
    }
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (!this.isPlaying) return;

    const custom = this.customTracks[this.activeChapter];
    if (custom && this.audioEl) {
      this.audioEl.volume = Math.min(1, this.volume * 0.85);
    } else if (this.ctx && this.synthBus) {
      this.synthBus.gain.setTargetAtTime(this.volume * 0.46, this.ctx.currentTime, 0.12);
    }
    this.updateRainLevel();
  }

  public setRainEnabled(enabled: boolean) {
    this.rainEnabled = enabled;
    this.updateRainLevel();
  }

  public setChapter(chapter: ChapterId) {
    if (this.activeChapter === chapter) return;
    this.activeChapter = chapter;
    this.stepIndex = 0;
    if (!this.isPlaying) return;
    this.activateCurrentChapterAudio();
  }

  private updateRainLevel() {
    if (!this.ctx || !this.rainGain) return;
    const score = CHAPTER_SCORES[this.activeChapter];
    const shouldPlayRain =
      this.isPlaying &&
      this.rainEnabled &&
      (score.hasRainTexture || Boolean(this.customTracks[this.activeChapter]));
    const target = shouldPlayRain ? this.volume * 0.11 : 0;
    this.rainGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.45);
  }

  private activateCurrentChapterAudio() {
    const custom = this.customTracks[this.activeChapter];
    if (custom?.url) {
      // Stop synth smoothly and fade in custom MP3
      this.stopSynthScheduler();
      if (this.ctx && this.synthBus) {
        this.synthBus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
      }
      this.playCustomUrl(custom.url);
    } else {
      // Fade out MP3 and fade in Vietnamese Piano/Violin synth
      this.fadeOutCustomAudio();
      this.startSynthForChapter();
    }
    this.updateRainLevel();
  }

  private playCustomUrl(url: string) {
    if (this.fadeRafId) cancelAnimationFrame(this.fadeRafId);
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl = null;
    }

    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0;
    this.audioEl = audio;

    void audio.play().then(() => {
      const targetVol = Math.min(1, this.volume * 0.85);
      const startTime = performance.now();
      const duration = 650;
      const step = (now: number) => {
        if (!this.isPlaying || this.audioEl !== audio) return;
        const t = Math.min(1, (now - startTime) / duration);
        audio.volume = targetVol * t;
        if (t < 1) {
          this.fadeRafId = requestAnimationFrame(step);
        }
      };
      this.fadeRafId = requestAnimationFrame(step);
    }).catch(() => {
      // Fallback to built-in synth if browser rejects playback
      this.startSynthForChapter();
    });
  }

  private fadeOutCustomAudio() {
    if (this.fadeRafId) cancelAnimationFrame(this.fadeRafId);
    const el = this.audioEl;
    if (!el) return;
    const startVol = el.volume;
    const startTime = performance.now();
    const duration = 380;
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      el.volume = Math.max(0, startVol * (1 - t));
      if (t < 1) {
        this.fadeRafId = requestAnimationFrame(step);
      } else {
        el.pause();
        if (this.audioEl === el) this.audioEl = null;
      }
    };
    this.fadeRafId = requestAnimationFrame(step);
  }

  private startSynthForChapter() {
    this.ensureContext();
    if (!this.ctx || !this.synthBus) return;
    const now = this.ctx.currentTime;
    this.synthBus.gain.cancelScheduledValues(now);
    this.synthBus.gain.setTargetAtTime(this.volume * 0.46, now, 0.45);

    this.stopSynthScheduler();
    const score = CHAPTER_SCORES[this.activeChapter];
    this.playArrangementStep();
    this.timerId = window.setInterval(() => {
      this.playArrangementStep();
    }, score.stepMs);
  }

  private stopSynthScheduler() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private playArrangementStep() {
    if (!this.isPlaying || !this.ctx || !this.synthBus) return;
    const score = CHAPTER_SCORES[this.activeChapter];
    const step = score.steps[this.stepIndex % score.steps.length];
    this.stepIndex += 1;

    if (step.bass) {
      this.triggerPianoNote(step.bass, 0.34, 2.6, true);
    }

    if (step.chords) {
      step.chords.forEach((freq, idx) => {
        // Gentle strummed timing across piano fingers (humanized 22ms offset)
        const delayMs = idx * (score.style === 'playful-pizz' ? 12 : 24);
        window.setTimeout(() => {
          if (!this.isPlaying) return;
          if (score.style === 'musicbox') {
            this.triggerMusicBoxNote(freq, 0.16, 1.8);
          } else {
            this.triggerPianoNote(freq, step.staccato ? 0.18 : 0.19, step.staccato ? 0.45 : 2.1, false);
          }
        }, delayMs);
      });
    }

    if (step.lead) {
      const dur = step.leadDuration || 1.5;
      if (score.style === 'ballad-duet' || score.style === 'finale-duet' || score.style === 'acoustic-duet') {
        this.triggerViolinNote(step.lead, 0.22, dur);
      } else if (score.style === 'playful-pizz') {
        this.triggerPizzicatoNote(step.lead, 0.22, dur);
      } else if (score.style === 'musicbox') {
        this.triggerMusicBoxNote(step.lead, 0.2, dur);
      } else {
        this.triggerPianoNote(step.lead, 0.24, dur, false);
      }
    }
  }

  /** Realistic Felt-Piano voice: fundamental + soft 2nd harmonic + gentle hammer lowpass */
  private triggerPianoNote(freq: number, gain: number, duration: number, isBass: boolean) {
    if (!this.ctx || !this.synthBus) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const env = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);

    const harmGain = this.ctx.createGain();
    harmGain.gain.value = isBass ? 0.25 : 0.32;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isBass ? 750 : 2100, now);
    filter.frequency.exponentialRampToValueAtTime(isBass ? 280 : 620, now + duration);

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(gain, now + 0.018);
    env.gain.exponentialRampToValueAtTime(gain * 0.35, now + duration * 0.4);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(filter);
    osc2.connect(harmGain);
    harmGain.connect(filter);
    filter.connect(env);
    env.connect(this.synthBus);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  /** Expressive Solo Violin: bowed saw/triangle blend + wooden formant filter + 5.2 Hz vibrato */
  private triggerViolinNote(freq: number, gain: number, duration: number) {
    if (!this.ctx || !this.synthBus) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const bodyFilter = this.ctx.createBiquadFilter();
    const smoothFilter = this.ctx.createBiquadFilter();
    const env = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(freq, now);

    // Gentle human vibrato ramping in after bow settles
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(5.2, now);
    lfoGain.gain.setValueAtTime(0, now);
    lfoGain.gain.linearRampToValueAtTime(freq * 0.007, now + Math.min(0.45, duration * 0.35));
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfoGain.connect(sub.frequency);

    // Wooden violin body resonance & warm bow roll-off
    bodyFilter.type = 'peaking';
    bodyFilter.frequency.setValueAtTime(520, now);
    bodyFilter.Q.value = 1.4;
    bodyFilter.gain.value = 3.5;

    smoothFilter.type = 'lowpass';
    smoothFilter.frequency.setValueAtTime(1650, now);

    const attack = Math.min(0.32, duration * 0.25);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(gain, now + attack);
    env.gain.setValueAtTime(gain * 0.85, now + duration * 0.72);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(bodyFilter);
    sub.connect(bodyFilter);
    bodyFilter.connect(smoothFilter);
    smoothFilter.connect(env);
    env.connect(this.synthBus);

    osc.start(now);
    sub.start(now);
    lfo.start(now);
    osc.stop(now + duration + 0.06);
    sub.stop(now + duration + 0.06);
    lfo.stop(now + duration + 0.06);
  }

  /** Playful Pizzicato Violin pluck for Chuyện khó đỡ */
  private triggerPizzicatoNote(freq: number, gain: number, duration: number) {
    if (!this.ctx || !this.synthBus) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const env = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(480, now + duration);

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(gain, now + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.synthBus);

    osc.start(now);
    osc.stop(now + duration + 0.04);
  }

  /** Delicate Lo-fi Music Box / Celesta bell for Điều nhỏ bé */
  private triggerMusicBoxNote(freq: number, gain: number, duration: number) {
    if (!this.ctx || !this.synthBus) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    const env = this.ctx.createGain();

    osc.type = 'sine';
    // Subtle nostalgic cassette tape flutter
    osc.frequency.setValueAtTime(freq * (1 + (Math.random() - 0.5) * 0.003), now);

    chime.type = 'sine';
    chime.frequency.setValueAtTime(freq * 3, now);
    chimeGain.gain.setValueAtTime(0.14, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(gain, now + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(env);
    chime.connect(chimeGain);
    chimeGain.connect(env);
    env.connect(this.synthBus);

    osc.start(now);
    chime.start(now);
    osc.stop(now + duration + 0.04);
    chime.stop(now + 0.22);
  }
}

export const ambientAudio = new VietnameseFilmAudioEngine();
