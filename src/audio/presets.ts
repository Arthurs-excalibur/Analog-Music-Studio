import { SynthParams, DEFAULT_PARAMS } from './engine';

export interface Preset {
  id: string;
  name: string;
  category: 'Lead' | 'Bass' | 'Pad' | 'Pluck' | 'FX';
  params: SynthParams;
  createdAt?: number;
  isFactory?: boolean;
}

export const FACTORY_PRESETS: Preset[] = [
  {
    id: 'factory-init',
    name: 'INIT PATCH',
    category: 'Lead',
    isFactory: true,
    params: { ...DEFAULT_PARAMS },
  },
  {
    id: 'factory-bass',
    name: 'DEEP MOOG BASS',
    category: 'Bass',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'sawtooth',
      tune: -12,
      oscMix: 0.8,
      cutoff: 650,
      resonance: 5.5,
      attack: 0.01,
      decay: 0.25,
      sustain: 0.3,
      release: 0.15,
      reverbEnabled: false,
      delayEnabled: false,
      masterVolume: 0.8,
    },
  },
  {
    id: 'factory-warm-pad',
    name: 'WARM RETRO PAD',
    category: 'Pad',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'sawtooth',
      tune: 8,
      oscMix: 0.6,
      cutoff: 1800,
      resonance: 1.8,
      attack: 0.6,
      decay: 1.2,
      sustain: 0.85,
      release: 1.5,
      reverbEnabled: true,
      reverbWet: 0.45,
      delayEnabled: true,
      delayTime: 0.4,
      delayFeedback: 0.35,
      masterVolume: 0.75,
    },
  },
  {
    id: 'factory-acid',
    name: 'ACID RESO LEAD',
    category: 'Lead',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'square',
      tune: 0,
      oscMix: 0.7,
      cutoff: 3800,
      resonance: 12.0,
      attack: 0.01,
      decay: 0.2,
      sustain: 0.4,
      release: 0.25,
      reverbEnabled: false,
      delayEnabled: true,
      delayTime: 0.25,
      delayFeedback: 0.5,
      masterVolume: 0.7,
    },
  },
  {
    id: 'factory-pluck',
    name: 'ANALOG CHIME PLUCK',
    category: 'Pluck',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'triangle',
      tune: 12,
      oscMix: 0.4,
      cutoff: 4500,
      resonance: 4.0,
      attack: 0.005,
      decay: 0.4,
      sustain: 0.05,
      release: 0.3,
      reverbEnabled: true,
      reverbWet: 0.5,
      delayEnabled: true,
      delayTime: 0.33,
      delayFeedback: 0.4,
      masterVolume: 0.75,
    },
  },
];

const PRESETS_STORAGE_KEY = 'analog_studio_presets_v1';
const CURRENT_PRESET_KEY = 'analog_studio_current_preset_id';
const PATTERN_STORAGE_KEY = 'analog_studio_pattern_v1';

export interface SequencerPattern {
  steps: boolean[];
  notes: number[];
  bpm: number;
}

export const DEFAULT_PATTERN: SequencerPattern = {
  steps: [
    true, false, false, false,
    true, false, false, false,
    true, false, false, false,
    true, false, false, false,
  ],
  notes: [
    48, 48, 48, 48, // C3
    51, 51, 51, 51, // Eb3
    53, 53, 53, 53, // F3
    55, 55, 55, 55, // G3
  ],
  bpm: 120,
};

// Preset Persistence
export function loadAllPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return FACTORY_PRESETS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge factory presets ensuring factories are present
      const userPresets = parsed.filter((p: Preset) => !p.isFactory);
      return [...FACTORY_PRESETS, ...userPresets];
    }
  } catch (err) {
    console.warn('Failed to load presets from localStorage, using factories:', err);
  }
  return FACTORY_PRESETS;
}

export function saveUserPreset(preset: Omit<Preset, 'id' | 'isFactory'>): Preset {
  const newPreset: Preset = {
    ...preset,
    id: `user-${Date.now()}`,
    isFactory: false,
    createdAt: Date.now(),
  };

  const all = loadAllPresets();
  const updated = [...all, newPreset];
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated.filter((p) => !p.isFactory)));
    localStorage.setItem(CURRENT_PRESET_KEY, newPreset.id);
  } catch (err) {
    console.error('Failed to save preset to localStorage:', err);
  }
  return newPreset;
}

export function deleteUserPreset(id: string): Preset[] {
  const all = loadAllPresets();
  const updated = all.filter((p) => p.id !== id || p.isFactory);
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated.filter((p) => !p.isFactory)));
  } catch (err) {
    console.error('Failed to update presets after delete:', err);
  }
  return updated;
}

export function getSavedPresetId(): string {
  try {
    return localStorage.getItem(CURRENT_PRESET_KEY) || 'factory-init';
  } catch {
    return 'factory-init';
  }
}

export function setSavedPresetId(id: string) {
  try {
    localStorage.setItem(CURRENT_PRESET_KEY, id);
  } catch {
    // ignore
  }
}

// Pattern Persistence
export function loadSavedPattern(): SequencerPattern {
  try {
    const raw = localStorage.getItem(PATTERN_STORAGE_KEY);
    if (!raw) return DEFAULT_PATTERN;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.steps) && parsed.steps.length === 16) {
      return {
        steps: parsed.steps,
        notes: Array.isArray(parsed.notes) && parsed.notes.length === 16 ? parsed.notes : DEFAULT_PATTERN.notes,
        bpm: typeof parsed.bpm === 'number' && parsed.bpm >= 40 && parsed.bpm <= 240 ? parsed.bpm : 120,
      };
    }
  } catch (err) {
    console.warn('Failed to load saved pattern, using default:', err);
  }
  return DEFAULT_PATTERN;
}

export function savePattern(pattern: SequencerPattern) {
  try {
    localStorage.setItem(PATTERN_STORAGE_KEY, JSON.stringify(pattern));
  } catch (err) {
    console.error('Failed to save pattern to localStorage:', err);
  }
}

// Storage Management & Safety
export interface StorageStats {
  factoryPresetsCount: number;
  userPresetsCount: number;
  totalPresetsCount: number;
  savedPatternsCount: number;
  approxBytesUsed: number;
}

export function restoreFactoryPresets(): Preset[] {
  try {
    localStorage.removeItem(PRESETS_STORAGE_KEY);
    localStorage.setItem(CURRENT_PRESET_KEY, 'factory-init');
  } catch (err) {
    console.error('Failed to restore factory presets:', err);
  }
  return FACTORY_PRESETS;
}

export function getStorageStats(): StorageStats {
  const allPresets = loadAllPresets();
  const userPresets = allPresets.filter((p) => !p.isFactory);

  let bytes = 0;
  const appKeys = [
    PRESETS_STORAGE_KEY,
    CURRENT_PRESET_KEY,
    PATTERN_STORAGE_KEY,
    'analog_studio_settings_v1',
  ];

  try {
    for (const key of appKeys) {
      const val = localStorage.getItem(key);
      if (val) {
        bytes += (key.length + val.length) * 2; // UTF-16 char approximation
      }
    }
  } catch {
    // ignore
  }

  return {
    factoryPresetsCount: FACTORY_PRESETS.length,
    userPresetsCount: userPresets.length,
    totalPresetsCount: allPresets.length,
    savedPatternsCount: 1,
    approxBytesUsed: bytes,
  };
}

export function clearAnalogStudioStorage(): void {
  const appKeys = [
    PRESETS_STORAGE_KEY,
    CURRENT_PRESET_KEY,
    PATTERN_STORAGE_KEY,
    'analog_studio_settings_v1',
  ];

  try {
    for (const key of appKeys) {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.error('Failed to clear application storage:', err);
  }
}

