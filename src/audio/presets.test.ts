import { describe, it, expect, beforeEach } from 'vitest';
import {
  FACTORY_PRESETS,
  loadAllPresets,
  saveUserPreset,
  deleteUserPreset,
  loadSavedPattern,
  savePattern,
  DEFAULT_PATTERN,
} from './presets';
import { DEFAULT_PARAMS } from './engine';

// Mock localStorage for Node test runner
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Preset & Pattern Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads all factory presets by default', () => {
    const presets = loadAllPresets();
    expect(presets.length).toBeGreaterThanOrEqual(FACTORY_PRESETS.length);
    expect(presets.some((p) => p.name === 'INIT PATCH')).toBe(true);
    expect(presets.some((p) => p.name === 'DEEP MOOG BASS')).toBe(true);
  });

  it('saves and restores user presets', () => {
    const custom = saveUserPreset({
      name: 'CUSTOM SYNTH',
      category: 'Lead',
      params: { ...DEFAULT_PARAMS, cutoff: 1200 },
    });

    expect(custom.id).toContain('user-');
    expect(custom.name).toBe('CUSTOM SYNTH');

    const all = loadAllPresets();
    expect(all.some((p) => p.id === custom.id)).toBe(true);

    // Deletes user preset cleanly
    const afterDelete = deleteUserPreset(custom.id);
    expect(afterDelete.some((p) => p.id === custom.id)).toBe(false);
  });

  it('protects factory presets from deletion', () => {
    const afterDelete = deleteUserPreset('factory-init');
    expect(afterDelete.some((p) => p.id === 'factory-init')).toBe(true);
  });

  it('saves and loads sequencer patterns', () => {
    const customPattern = {
      steps: [true, true, false, false, ...new Array(12).fill(false)],
      notes: [60, 62, 64, 65, ...new Array(12).fill(48)],
      bpm: 135,
    };

    savePattern(customPattern);
    const restored = loadSavedPattern();

    expect(restored.bpm).toBe(135);
    expect(restored.steps[0]).toBe(true);
    expect(restored.steps[1]).toBe(true);
    expect(restored.notes[1]).toBe(62);
  });

  it('recovers gracefully from corrupted pattern data', () => {
    localStorage.setItem('analog_studio_pattern_v1', 'corrupted{invalid json');
    const restored = loadSavedPattern();
    expect(restored.bpm).toBe(DEFAULT_PATTERN.bpm);
    expect(restored.steps.length).toBe(16);
  });
});
