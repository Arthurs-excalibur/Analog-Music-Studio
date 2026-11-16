import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_SETTINGS,
  loadSavedSettings,
  saveSettings,
  SETTINGS_STORAGE_KEY,
  SystemSettings,
} from './settings';

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

describe('Settings Management & Schema Validation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides complete defaults conforming to PRD and Figma specifications', () => {
    expect(DEFAULT_SETTINGS.finish).toBe('walnut');
    expect(DEFAULT_SETTINGS.accentLighting).toBe('amber');
    expect(DEFAULT_SETTINGS.luminosity).toBe(75);
    expect(DEFAULT_SETTINGS.contrast).toBe('mid');
    expect(DEFAULT_SETTINGS.controlLighting).toBe(true);

    expect(DEFAULT_SETTINGS.knobSensitivity).toBe('normal');
    expect(DEFAULT_SETTINGS.dragMode).toBe('vertical');
    expect(DEFAULT_SETTINGS.doubleClickReset).toBe(true);
    expect(DEFAULT_SETTINGS.showNumericValues).toBe('always');
    expect(DEFAULT_SETTINGS.tooltips).toBe(true);
    expect(DEFAULT_SETTINGS.faderSensitivity).toBe('normal');

    expect(DEFAULT_SETTINGS.masterVolumePreference).toBe(0.75);
    expect(DEFAULT_SETTINGS.velocityMode).toBe('dynamic');
    expect(DEFAULT_SETTINGS.fixedVelocityValue).toBe(100);

    expect(DEFAULT_SETTINGS.computerKeyboardEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.baseOctave).toBe(3);
    expect(DEFAULT_SETTINGS.keyLabels).toBe('always');
    expect(DEFAULT_SETTINGS.octaveMarkers).toBe(true);
    expect(DEFAULT_SETTINGS.defaultSequencerTempo).toBe(120);
    expect(DEFAULT_SETTINGS.patternLength).toBe(16);
    expect(DEFAULT_SETTINGS.showPlaybackStep).toBe(true);
  });

  it('loads default settings when storage is empty', () => {
    const loaded = loadSavedSettings();
    expect(loaded).toEqual(DEFAULT_SETTINGS);
  });

  it('saves and restores modified settings', () => {
    const customized: SystemSettings = {
      ...DEFAULT_SETTINGS,
      finish: 'silver',
      accentLighting: 'lime',
      luminosity: 95,
      contrast: 'high',
      knobSensitivity: 'fine',
      dragMode: 'circular',
      baseOctave: 4,
      patternLength: 8,
    };

    saveSettings(customized);
    const loaded = loadSavedSettings();
    expect(loaded.finish).toBe('silver');
    expect(loaded.accentLighting).toBe('lime');
    expect(loaded.luminosity).toBe(95);
    expect(loaded.contrast).toBe('high');
    expect(loaded.knobSensitivity).toBe('fine');
    expect(loaded.dragMode).toBe('circular');
    expect(loaded.baseOctave).toBe(4);
    expect(loaded.patternLength).toBe(8);
  });

  it('gracefully handles and clamps out-of-bounds persisted values', () => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        luminosity: 9999, // exceeds 100
        masterVolumePreference: -5, // below 0
        fixedVelocityValue: 250, // exceeds 127
        baseOctave: 10, // exceeds 5
        defaultSequencerTempo: 10, // below 40
        patternLength: 32, // invalid length
      })
    );

    const loaded = loadSavedSettings();
    expect(loaded.luminosity).toBe(100);
    expect(loaded.masterVolumePreference).toBe(0);
    expect(loaded.fixedVelocityValue).toBe(127);
    expect(loaded.baseOctave).toBe(5);
    expect(loaded.defaultSequencerTempo).toBe(40);
    expect(loaded.patternLength).toBe(16);
  });

  it('recovers gracefully from malformed JSON in localStorage', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, '{corrupted-json:');
    const loaded = loadSavedSettings();
    expect(loaded).toEqual(DEFAULT_SETTINGS);
  });
});
