// Web Audio API engine for Analog Studio / Vintage Synth 2.0

export type WaveformType = 'sine' | 'triangle' | 'sawtooth' | 'square';
export type LFOTarget = 'none' | 'cutoff' | 'pitch';

export interface SynthParams {
  waveform: WaveformType;
  tune: number; // cents (-1200 to +1200)
  oscMix: number; // 0 to 1
  cutoff: number; // Hz (20 to 20000)
  resonance: number; // Q factor (0.1 to 20)
  attack: number; // seconds (0.005 to 4)
  decay: number; // seconds (0.01 to 4)
  sustain: number; // ratio (0 to 1)
  release: number; // seconds (0.01 to 5)
  reverbEnabled: boolean;
  reverbWet: number; // 0 to 1
  delayEnabled: boolean;
  delayTime: number; // seconds (0.05 to 1.0)
  delayFeedback: number; // ratio (0 to 0.85)
  masterVolume: number; // 0 to 1
  // Post-MVP: Sub-Oscillator Layer
  subOscEnabled: boolean;
  subOscLevel: number; // 0 to 1
  subOscOctave: -1 | -2;
  // Post-MVP: LFO Modulation Matrix
  lfoRate: number; // Hz (0.1 to 20)
  lfoDepth: number; // 0 to 1
  lfoTarget: LFOTarget;
}

export const DEFAULT_PARAMS: SynthParams = {
  waveform: 'square',
  tune: 0,
  oscMix: 0.5,
  cutoff: 2400,
  resonance: 3.2,
  attack: 0.05,
  decay: 0.3,
  sustain: 0.7,
  release: 0.4,
  reverbEnabled: false,
  reverbWet: 0.3,
  delayEnabled: false,
  delayTime: 0.35,
  delayFeedback: 0.4,
  masterVolume: 0.75,
  subOscEnabled: false,
  subOscLevel: 0.5,
  subOscOctave: -1,
  lfoRate: 3.5,
  lfoDepth: 0.0,
  lfoTarget: 'none',
};

export interface AudioStatusInfo {
  state: AudioContextState | 'uninitialized' | 'unsupported';
  sampleRate: number | null;
  baseLatency: number | null;
  outputLatency: number | null;
  activeVoicesCount: number;
}

interface ActiveVoice {
  osc: OscillatorNode;
  gain: GainNode;
  filter: BiquadFilterNode;
  note: number; // MIDI number
  startTime: number;
  subOsc?: OscillatorNode;
  subGain?: GainNode;
  lfoGain?: GainNode;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private isUnlocked = false;
  private activeVoices = new Map<number, ActiveVoice>();

  // Master bus
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Effects bus
  private dryGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delayGain: GainNode | null = null;

  // LFO Modulation bus
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;

  private params: SynthParams = { ...DEFAULT_PARAMS };

  public init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.isUnlocked = true;
      return;
    }

    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();

    // Master chain
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.params.masterVolume, this.ctx.currentTime);

    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 1.0;

    // Delay FX chain
    this.delayNode = this.ctx.createDelay(2.0);
    this.delayNode.delayTime.value = this.params.delayTime;
    this.delayFeedbackGain = this.ctx.createGain();
    this.delayFeedbackGain.gain.value = this.params.delayFeedback;
    this.delayGain = this.ctx.createGain();
    this.delayGain.gain.value = this.params.delayEnabled ? 0.4 : 0;

    this.delayNode.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);
    this.delayNode.connect(this.delayGain);

    // Reverb FX chain
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.createImpulseResponse(2.2, 2.0);
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = this.params.reverbEnabled ? this.params.reverbWet : 0;
    this.reverbNode.connect(this.reverbGain);

    // Summing into master
    this.dryGain.connect(this.masterGain);
    this.delayGain.connect(this.masterGain);
    this.reverbGain.connect(this.masterGain);

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Global LFO Engine
    try {
      this.lfoOsc = this.ctx.createOscillator();
      this.lfoOsc.type = 'sine';
      this.lfoOsc.frequency.setValueAtTime(this.params.lfoRate, this.ctx.currentTime);
      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.setValueAtTime(this.params.lfoDepth, this.ctx.currentTime);
      this.lfoOsc.connect(this.lfoGain);
      this.lfoOsc.start();
    } catch {
      // ignore in tests
    }

    this.isUnlocked = true;
  }

  private createImpulseResponse(duration: number, decay: number): AudioBuffer {
    if (!this.ctx) throw new Error('No context');
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const dec = Math.pow(1 - n, decay);
      left[i] = (Math.random() * 2 - 1) * dec;
      right[i] = (Math.random() * 2 - 1) * dec;
    }
    return impulse;
  }

  public setParams(newParams: Partial<SynthParams>) {
    this.params = { ...this.params, ...newParams };
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    if (newParams.masterVolume !== undefined && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(newParams.masterVolume, t, 0.05);
    }

    if (this.delayGain && this.delayNode && this.delayFeedbackGain) {
      if (newParams.delayEnabled !== undefined || newParams.delayTime !== undefined) {
        this.delayGain.gain.setTargetAtTime(this.params.delayEnabled ? 0.4 : 0, t, 0.05);
      }
      if (newParams.delayTime !== undefined) {
        this.delayNode.delayTime.setTargetAtTime(newParams.delayTime, t, 0.05);
      }
      if (newParams.delayFeedback !== undefined) {
        this.delayFeedbackGain.gain.setTargetAtTime(Math.min(0.85, newParams.delayFeedback), t, 0.05);
      }
    }

    if (this.reverbGain && (newParams.reverbEnabled !== undefined || newParams.reverbWet !== undefined)) {
      this.reverbGain.gain.setTargetAtTime(this.params.reverbEnabled ? this.params.reverbWet : 0, t, 0.05);
    }

    if (this.lfoOsc && newParams.lfoRate !== undefined) {
      this.lfoOsc.frequency.setTargetAtTime(newParams.lfoRate, t, 0.05);
    }
    if (this.lfoGain && newParams.lfoDepth !== undefined) {
      this.lfoGain.gain.setTargetAtTime(newParams.lfoDepth, t, 0.05);
    }

    // Apply live updates to current playing voices
    for (const voice of this.activeVoices.values()) {
      if (newParams.cutoff !== undefined) {
        voice.filter.frequency.setTargetAtTime(newParams.cutoff, t, 0.05);
      }
      if (newParams.resonance !== undefined) {
        voice.filter.Q.setTargetAtTime(newParams.resonance, t, 0.05);
      }
      if (newParams.waveform !== undefined) {
        voice.osc.type = newParams.waveform;
      }
      if (newParams.tune !== undefined) {
        voice.osc.detune.setTargetAtTime(newParams.tune, t, 0.05);
      }
    }
  }

  public getParams(): SynthParams {
    return { ...this.params };
  }

  public midiToFreq(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  public getCurrentTime(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  // Precise Web Audio clock scheduling for Sequencer
  public scheduleStepNote(note: number, startTime: number, duration: number, velocity: number = 100) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = this.params.waveform;
    osc.frequency.setValueAtTime(this.midiToFreq(note), startTime);
    osc.detune.setValueAtTime(this.params.tune, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(this.params.cutoff, startTime);
    filter.Q.setValueAtTime(this.params.resonance, startTime);

    const normVelocity = Math.max(0.05, Math.min(1.0, velocity / 127));
    const attack = Math.max(0.005, Math.min(this.params.attack, duration * 0.4));
    const decay = Math.max(0.01, Math.min(this.params.decay, duration * 0.4));
    const sustainLevel = Math.max(0.001, this.params.sustain) * normVelocity;
    const release = Math.max(0.01, Math.min(this.params.release, 0.3));

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(normVelocity, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(sustainLevel, startTime + attack + decay);

    const stopTime = startTime + duration;
    gain.gain.setValueAtTime(sustainLevel, stopTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime + release);

    osc.connect(filter);
    filter.connect(gain);

    if (this.dryGain) gain.connect(this.dryGain);
    if (this.delayNode) gain.connect(this.delayNode);
    if (this.reverbNode) gain.connect(this.reverbNode);

    osc.start(startTime);
    osc.stop(stopTime + release + 0.05);

    setTimeout(() => {
      try {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {
        // cleanup
      }
    }, (stopTime + release - this.ctx.currentTime) * 1000 + 100);
  }

  public noteOn(note: number, velocity: number = 100) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // Stop existing voice on same key to prevent stuck notes
    if (this.activeVoices.has(note)) {
      this.noteOff(note);
    }

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = this.params.waveform;
    osc.frequency.setValueAtTime(this.midiToFreq(note), t);
    osc.detune.setValueAtTime(this.params.tune, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(this.params.cutoff, t);
    filter.Q.setValueAtTime(this.params.resonance, t);

    // ADSR Attack -> Decay -> Sustain scaled by velocity
    const normVelocity = Math.max(0.05, Math.min(1.0, velocity / 127));
    const attack = Math.max(0.005, this.params.attack);
    const decay = Math.max(0.01, this.params.decay);
    const sustainLevel = Math.max(0.001, this.params.sustain) * normVelocity;

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(normVelocity, t + attack);
    gain.gain.exponentialRampToValueAtTime(sustainLevel, t + attack + decay);

    // Sub-Oscillator Layer
    let subOsc: OscillatorNode | undefined;
    let subGain: GainNode | undefined;
    if (this.params.subOscEnabled) {
      subOsc = this.ctx.createOscillator();
      subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      const subNote = note + (this.params.subOscOctave || -1) * 12;
      subOsc.frequency.setValueAtTime(this.midiToFreq(subNote), t);
      const subVol = (this.params.subOscLevel || 0.5) * normVelocity;
      subGain.gain.setValueAtTime(0.0001, t);
      subGain.gain.exponentialRampToValueAtTime(subVol, t + attack);
      subGain.gain.exponentialRampToValueAtTime(subVol * (this.params.sustain || 0.7), t + attack + decay);
      subOsc.connect(subGain);
      subGain.connect(filter);
      subOsc.start(t);
    }

    // LFO Modulation Routing
    let voiceLfoGain: GainNode | undefined;
    if (this.lfoGain && this.params.lfoTarget !== 'none' && this.params.lfoDepth > 0) {
      voiceLfoGain = this.ctx.createGain();
      if (this.params.lfoTarget === 'cutoff') {
        voiceLfoGain.gain.setValueAtTime(this.params.lfoDepth * 2400, t);
        this.lfoGain.connect(voiceLfoGain);
        voiceLfoGain.connect(filter.frequency);
      } else if (this.params.lfoTarget === 'pitch') {
        voiceLfoGain.gain.setValueAtTime(this.params.lfoDepth * 150, t);
        this.lfoGain.connect(voiceLfoGain);
        voiceLfoGain.connect(osc.detune);
      }
    }

    // Audio routing: Osc -> Filter -> Gain -> (Dry + FX sends)
    osc.connect(filter);
    filter.connect(gain);

    if (this.dryGain) gain.connect(this.dryGain);
    if (this.delayNode) gain.connect(this.delayNode);
    if (this.reverbNode) gain.connect(this.reverbNode);

    osc.start(t);

    this.activeVoices.set(note, { osc, gain, filter, note, startTime: t, subOsc, subGain, lfoGain: voiceLfoGain });
  }

  public noteOff(note: number) {
    if (!this.ctx || !this.activeVoices.has(note)) return;

    const voice = this.activeVoices.get(note)!;
    this.activeVoices.delete(note);

    const t = this.ctx.currentTime;
    const release = Math.max(0.01, this.params.release);

    voice.gain.gain.cancelScheduledValues(t);
    voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value), t);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, t + release);

    if (voice.subGain) {
      voice.subGain.gain.cancelScheduledValues(t);
      voice.subGain.gain.setValueAtTime(Math.max(0.0001, voice.subGain.gain.value), t);
      voice.subGain.gain.exponentialRampToValueAtTime(0.0001, t + release);
    }

    setTimeout(() => {
      try {
        voice.osc.stop();
        voice.osc.disconnect();
        voice.filter.disconnect();
        voice.gain.disconnect();
        if (voice.subOsc) {
          voice.subOsc.stop();
          voice.subOsc.disconnect();
        }
        if (voice.subGain) {
          voice.subGain.disconnect();
        }
        if (voice.lfoGain) {
          voice.lfoGain.disconnect();
        }
      } catch {
        // Voice already stopped
      }
    }, release * 1000 + 50);
  }

  public allNotesOff() {
    const notes = Array.from(this.activeVoices.keys());
    for (const note of notes) {
      this.noteOff(note);
    }
  }

  public getAnalyserData(dataArray: Uint8Array) {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(dataArray as any);
    }
  }

  public getVULevel(): { left: number; right: number } {
    if (!this.analyser || this.activeVoices.size === 0) {
      return { left: 0, right: 0 };
    }
    const buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(buffer as any);

    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      const v = (buffer[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / buffer.length);
    const normalized = Math.min(1.0, rms * 2.5);
    return {
      left: normalized,
      right: Math.min(1.0, normalized * (0.9 + Math.random() * 0.2)),
    };
  }

  public playMetronomeClick(time: number, isDownbeat: boolean) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isDownbeat ? 1200 : 800, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(0.25, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.035);

    setTimeout(() => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        // cleanup
      }
    }, (time - this.ctx.currentTime) * 1000 + 80);
  }

  public getAudioStatus(): AudioStatusInfo {
    if (typeof window === 'undefined' || (!window.AudioContext && !(window as any).webkitAudioContext)) {
      return {
        state: 'unsupported',
        sampleRate: null,
        baseLatency: null,
        outputLatency: null,
        activeVoicesCount: 0,
      };
    }
    if (!this.ctx) {
      return {
        state: 'uninitialized',
        sampleRate: null,
        baseLatency: null,
        outputLatency: null,
        activeVoicesCount: 0,
      };
    }
    return {
      state: this.ctx.state,
      sampleRate: this.ctx.sampleRate,
      baseLatency: this.ctx.baseLatency ?? null,
      outputLatency: (this.ctx as any).outputLatency ?? null,
      activeVoicesCount: this.activeVoices.size,
    };
  }

  public async resume(): Promise<boolean> {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
        this.isUnlocked = true;
        return true;
      } catch (err) {
        console.error('AudioContext resume failed:', err);
        return false;
      }
    }
    return this.ctx?.state === 'running';
  }

  public resetAudioChain(): void {
    // Clear any active voices
    this.activeVoices.forEach((voice) => {
      try {
        voice.osc.stop();
        voice.osc.disconnect();
        voice.gain.disconnect();
        voice.filter.disconnect();
      } catch {
        // ignore
      }
    });
    this.activeVoices.clear();

    if (this.ctx && this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.params.masterVolume, this.ctx.currentTime);
    }
  }

  public isAudioUnlocked(): boolean {
    return this.isUnlocked && this.ctx !== null && this.ctx.state === 'running';
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public getMasterGain(): GainNode | null {
    return this.masterGain;
  }
}

export const engine = new AudioEngine();
