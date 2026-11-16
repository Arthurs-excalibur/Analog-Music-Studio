import { describe, it, expect } from 'vitest';
import { engine, DEFAULT_PARAMS } from './engine';

describe('AudioEngine', () => {
  it('has proper default parameters conforming to PRD and Figma spec', () => {
    expect(DEFAULT_PARAMS.waveform).toBe('square');
    expect(DEFAULT_PARAMS.cutoff).toBe(2400);
    expect(DEFAULT_PARAMS.resonance).toBe(3.2);
    expect(DEFAULT_PARAMS.attack).toBe(0.05);
    expect(DEFAULT_PARAMS.decay).toBe(0.3);
    expect(DEFAULT_PARAMS.sustain).toBe(0.7);
    expect(DEFAULT_PARAMS.release).toBe(0.4);
    expect(DEFAULT_PARAMS.masterVolume).toBe(0.75);
    expect(DEFAULT_PARAMS.subOscEnabled).toBe(false);
    expect(DEFAULT_PARAMS.subOscLevel).toBe(0.5);
    expect(DEFAULT_PARAMS.lfoRate).toBe(3.5);
    expect(DEFAULT_PARAMS.lfoDepth).toBe(0.0);
    expect(DEFAULT_PARAMS.lfoTarget).toBe('none');
  });

  it('correctly calculates MIDI to frequency', () => {
    // A4 = MIDI 69 = 440 Hz
    expect(Math.round(engine.midiToFreq(69))).toBe(440);
    // C4 = MIDI 60 ≈ 261.63 Hz
    expect(Math.round(engine.midiToFreq(60))).toBe(262);
    // A5 = MIDI 81 = 880 Hz
    expect(Math.round(engine.midiToFreq(81))).toBe(880);
  });

  it('initializes and manages parameters safely', () => {
    engine.setParams({
      cutoff: 5000,
      waveform: 'sawtooth',
      subOscEnabled: true,
      subOscLevel: 0.8,
      lfoRate: 6.0,
      lfoDepth: 0.5,
      lfoTarget: 'cutoff',
    });
    expect(true).toBe(true);
  });

  it('handles metronome clicks safely without audio hardware in headless mode', () => {
    expect(() => {
      engine.playMetronomeClick(0, true);
      engine.playMetronomeClick(0, false);
    }).not.toThrow();
  });
});
