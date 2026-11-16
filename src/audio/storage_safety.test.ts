import { describe, it, expect, beforeEach } from 'vitest';
import {
  FACTORY_PRESETS,
  loadAllPresets,
  saveUserPreset,
  restoreFactoryPresets,
  getStorageStats,
  clearAnalogStudioStorage,
  DEFAULT_PATTERN,
  savePattern,
} from './presets';
import { validatePreset, validatePattern } from './io';
import { DEFAULT_PARAMS } from './engine';

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

describe('Storage Safety & Data Isolation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('computes accurate storage statistics', () => {
    saveUserPreset({
      name: 'SOLO LEAD',
      category: 'Lead',
      params: { ...DEFAULT_PARAMS },
    });
    savePattern(DEFAULT_PATTERN);

    const stats = getStorageStats();
    expect(stats.factoryPresetsCount).toBe(FACTORY_PRESETS.length);
    expect(stats.userPresetsCount).toBe(1);
    expect(stats.totalPresetsCount).toBe(FACTORY_PRESETS.length + 1);
    expect(stats.savedPatternsCount).toBe(1);
    expect(stats.approxBytesUsed).toBeGreaterThan(0);
  });

  it('restores factory presets without deleting system settings or other keys', () => {
    saveUserPreset({
      name: 'CUSTOM 1',
      category: 'Bass',
      params: { ...DEFAULT_PARAMS },
    });
    localStorage.setItem('analog_studio_settings_v1', JSON.stringify({ finish: 'silver' }));

    const restored = restoreFactoryPresets();
    expect(restored.length).toBe(FACTORY_PRESETS.length);
    expect(restored.every((p) => p.isFactory)).toBe(true);

    // Settings must remain intact
    expect(localStorage.getItem('analog_studio_settings_v1')).toContain('silver');
  });

  it('safely clears ONLY application keys during storage purge', () => {
    // Populate application keys
    saveUserPreset({ name: 'USER BASS', category: 'Bass', params: { ...DEFAULT_PARAMS } });
    savePattern(DEFAULT_PATTERN);
    localStorage.setItem('analog_studio_settings_v1', JSON.stringify({ finish: 'black-ash' }));

    // Populate unrelated third-party keys that must NOT be touched
    localStorage.setItem('other_app_user_token', 'secure-token-12345');
    localStorage.setItem('analytics_session_id', 'sess-999');

    // Execute purge
    clearAnalogStudioStorage();

    // Application keys must be removed
    expect(localStorage.getItem('analog_studio_presets_v1')).toBeNull();
    expect(localStorage.getItem('analog_studio_pattern_v1')).toBeNull();
    expect(localStorage.getItem('analog_studio_settings_v1')).toBeNull();

    // Other keys MUST remain preserved
    expect(localStorage.getItem('other_app_user_token')).toBe('secure-token-12345');
    expect(localStorage.getItem('analytics_session_id')).toBe('sess-999');
  });

  it('validates preset schemas strictly before modifying state', () => {
    const validPreset = {
      name: 'RETRO LEAD',
      category: 'Lead',
      params: { ...DEFAULT_PARAMS },
    };
    expect(validatePreset(validPreset)).toBe(true);

    // Missing name
    expect(validatePreset({ params: { ...DEFAULT_PARAMS } })).toBe(false);
    // Missing cutoff
    expect(validatePreset({ name: 'TEST', params: { resonance: 2 } })).toBe(false);
    // Invalid waveform
    expect(validatePreset({ name: 'TEST', params: { ...DEFAULT_PARAMS, waveform: 'hypersaw' } })).toBe(false);
    // Null/undefined/primitive
    expect(validatePreset(null)).toBe(false);
    expect(validatePreset('string')).toBe(false);
  });

  it('validates pattern schemas strictly before modifying state', () => {
    expect(validatePattern(DEFAULT_PATTERN)).toBe(true);

    // Invalid length
    expect(validatePattern({ steps: [true, false], notes: [60], bpm: 120 })).toBe(false);
    // Invalid bpm
    expect(validatePattern({ steps: new Array(16).fill(false), notes: new Array(16).fill(60), bpm: 9999 })).toBe(false);
    // Null
    expect(validatePattern(null)).toBe(false);
  });
});
