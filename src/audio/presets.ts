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
  // --- CORE FACTORY PATCHES ---
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

  // --- LEADS SOUND BANK ---
  {
    id: 'factory-blade-runner',
    name: 'BLADE RUNNER CS-80',
    category: 'Lead',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'sawtooth',
      tune: 4,
      oscMix: 0.65,
      cutoff: 2800,
      resonance: 2.8,
      attack: 0.22,
      decay: 0.8,
      sustain: 0.85,
      release: 1.2,
      reverbEnabled: true,
      reverbWet: 0.55,
      delayEnabled: true,
      delayTime: 0.42,
      delayFeedback: 0.45,
      masterVolume: 0.8,
      subOscEnabled: false,
      lfoRate: 4.8,
      lfoDepth: 0.05,
      lfoTarget: 'pitch',
    },
  },
  {
    id: 'factory-synthwave-hook',
    name: '80S SYNTHWAVE HOOK',
    category: 'Lead',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'sawtooth',
      tune: 7,
      oscMix: 0.75,
      cutoff: 5400,
      resonance: 3.5,
      attack: 0.01,
      decay: 0.35,
      sustain: 0.55,
      release: 0.3,
      reverbEnabled: true,
      reverbWet: 0.35,
      delayEnabled: true,
      delayTime: 0.375,
      delayFeedback: 0.4,
      masterVolume: 0.75,
      subOscEnabled: false,
    },
  },
  {
    id: 'factory-prog-solo',
    name: '70S PROG ROCK LEAD',
    category: 'Lead',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'square',
      tune: 12,
      oscMix: 0.6,
      cutoff: 4200,
      resonance: 4.5,
      attack: 0.02,
      decay: 0.5,
      sustain: 0.75,
      release: 0.35,
      reverbEnabled: true,
      reverbWet: 0.3,
      delayEnabled: true,
      delayTime: 0.32,
      delayFeedback: 0.42,
      masterVolume: 0.75,
      subOscEnabled: false,
      lfoRate: 5.5,
      lfoDepth: 0.04,
      lfoTarget: 'pitch',
    },
  },
  {
    id: 'factory-arcade-chip',
    name: '8-BIT ARCADE CHIP',
    category: 'Lead',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'square',
      tune: 0,
      oscMix: 0.9,
      cutoff: 12000,
      resonance: 0.8,
      attack: 0.005,
      decay: 0.1,
      sustain: 0.9,
      release: 0.08,
      reverbEnabled: false,
      delayEnabled: false,
      masterVolume: 0.7,
      subOscEnabled: false,
    },
  },

  // --- BASSES ---
  {
    id: 'factory-sub-punch',
    name: 'SUB DRIVE 808',
    category: 'Bass',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'sine',
      tune: 0,
      oscMix: 0.95,
      cutoff: 320,
      resonance: 2.0,
      attack: 0.005,
      decay: 0.5,
      sustain: 0.15,
      release: 0.35,
      reverbEnabled: false,
      delayEnabled: false,
      masterVolume: 0.85,
      subOscEnabled: true,
      subOscLevel: 0.8,
      subOscOctave: -2,
    },
  },
  {
    id: 'factory-acid-bassline',
    name: '303 ACID BASSLINE',
    category: 'Bass',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'sawtooth',
      tune: -12,
      oscMix: 0.85,
      cutoff: 1400,
      resonance: 14.5,
      attack: 0.008,
      decay: 0.22,
      sustain: 0.18,
      release: 0.12,
      reverbEnabled: false,
      delayEnabled: true,
      delayTime: 0.25,
      delayFeedback: 0.45,
      masterVolume: 0.75,
      subOscEnabled: false,
    },
  },
  {
    id: 'factory-funk-slap',
    name: 'FUNK SLAP SYNTH',
    category: 'Bass',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'square',
      tune: -5,
      oscMix: 0.7,
      cutoff: 980,
      resonance: 7.2,
      attack: 0.005,
      decay: 0.32,
      sustain: 0.15,
      release: 0.12,
      reverbEnabled: false,
      delayEnabled: false,
      masterVolume: 0.8,
      subOscEnabled: true,
      subOscLevel: 0.6,
      subOscOctave: -1,
    },
  },
  {
    id: 'factory-cyber-reese',
    name: 'CYBER REESE BASS',
    category: 'Bass',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'sawtooth',
      tune: -15,
      oscMix: 0.8,
      cutoff: 820,
      resonance: 4.8,
      attack: 0.08,
      decay: 0.4,
      sustain: 0.8,
      release: 0.45,
      reverbEnabled: true,
      reverbWet: 0.2,
      delayEnabled: false,
      masterVolume: 0.8,
      subOscEnabled: true,
      subOscLevel: 0.7,
      subOscOctave: -1,
      lfoRate: 1.8,
      lfoDepth: 0.18,
      lfoTarget: 'cutoff',
    },
  },

  // --- PADS ---
  {
    id: 'factory-celestial-air',
    name: 'CELESTIAL AMBIENT PAD',
    category: 'Pad',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'triangle',
      tune: 3,
      oscMix: 0.5,
      cutoff: 2200,
      resonance: 2.2,
      attack: 1.2,
      decay: 1.8,
      sustain: 0.9,
      release: 2.6,
      reverbEnabled: true,
      reverbWet: 0.65,
      delayEnabled: true,
      delayTime: 0.5,
      delayFeedback: 0.55,
      masterVolume: 0.75,
      subOscEnabled: false,
      lfoRate: 0.6,
      lfoDepth: 0.15,
      lfoTarget: 'cutoff',
    },
  },
  {
    id: 'factory-1981-strings',
    name: '1981 JUNO STRINGS',
    category: 'Pad',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'sawtooth',
      tune: 5,
      oscMix: 0.65,
      cutoff: 3400,
      resonance: 2.0,
      attack: 0.4,
      decay: 1.0,
      sustain: 0.8,
      release: 1.6,
      reverbEnabled: true,
      reverbWet: 0.4,
      delayEnabled: true,
      delayTime: 0.35,
      delayFeedback: 0.3,
      masterVolume: 0.75,
      subOscEnabled: false,
    },
  },
  {
    id: 'factory-dark-drone',
    name: 'DARK CINEMATIC DRONE',
    category: 'Pad',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'sawtooth',
      tune: -7,
      oscMix: 0.7,
      cutoff: 620,
      resonance: 6.0,
      attack: 0.8,
      decay: 1.5,
      sustain: 0.9,
      release: 2.2,
      reverbEnabled: true,
      reverbWet: 0.5,
      delayEnabled: true,
      delayTime: 0.65,
      delayFeedback: 0.6,
      masterVolume: 0.8,
      subOscEnabled: true,
      subOscLevel: 0.75,
      subOscOctave: -2,
      lfoRate: 0.3,
      lfoDepth: 0.32,
      lfoTarget: 'cutoff',
    },
  },

  // --- PLUCK & KEYS ---
  {
    id: 'factory-electric-keys',
    name: 'VINTAGE ELECTRIC KEYS',
    category: 'Pluck',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'triangle',
      tune: 0,
      oscMix: 0.55,
      cutoff: 2600,
      resonance: 1.8,
      attack: 0.015,
      decay: 1.1,
      sustain: 0.25,
      release: 0.5,
      reverbEnabled: true,
      reverbWet: 0.35,
      delayEnabled: true,
      delayTime: 0.28,
      delayFeedback: 0.25,
      masterVolume: 0.8,
      subOscEnabled: false,
    },
  },
  {
    id: 'factory-wooden-kalimba',
    name: 'WOODEN KALIMBA',
    category: 'Pluck',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'sine',
      tune: 12,
      oscMix: 0.4,
      cutoff: 3600,
      resonance: 8.5,
      attack: 0.005,
      decay: 0.38,
      sustain: 0.0,
      release: 0.28,
      reverbEnabled: true,
      reverbWet: 0.45,
      delayEnabled: true,
      delayTime: 0.22,
      delayFeedback: 0.35,
      masterVolume: 0.8,
      subOscEnabled: true,
      subOscLevel: 0.35,
      subOscOctave: -1,
    },
  },
  {
    id: 'factory-neo-soul',
    name: 'NEO-SOUL GLOW KEYS',
    category: 'Pluck',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'triangle',
      tune: 2,
      oscMix: 0.6,
      cutoff: 1900,
      resonance: 2.2,
      attack: 0.03,
      decay: 0.9,
      sustain: 0.4,
      release: 0.6,
      reverbEnabled: true,
      reverbWet: 0.4,
      delayEnabled: true,
      delayTime: 0.35,
      delayFeedback: 0.3,
      masterVolume: 0.8,
      subOscEnabled: false,
    },
  },

  // --- FX & SOUND DESIGN ---
  {
    id: 'factory-sci-fi-laser',
    name: 'SCI-FI LASER ZAP',
    category: 'FX',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'sawtooth',
      tune: 0,
      oscMix: 0.85,
      cutoff: 11000,
      resonance: 15.0,
      attack: 0.005,
      decay: 0.28,
      sustain: 0.02,
      release: 0.2,
      reverbEnabled: true,
      reverbWet: 0.35,
      delayEnabled: true,
      delayTime: 0.18,
      delayFeedback: 0.55,
      masterVolume: 0.7,
      subOscEnabled: false,
      lfoRate: 18.0,
      lfoDepth: 0.75,
      lfoTarget: 'pitch',
    },
  },
  {
    id: 'factory-ufo-sweep',
    name: 'UFO COSMIC SWEEP',
    category: 'FX',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'sine',
      tune: 0,
      oscMix: 0.8,
      cutoff: 2400,
      resonance: 16.5,
      attack: 0.4,
      decay: 1.2,
      sustain: 0.8,
      release: 1.8,
      reverbEnabled: true,
      reverbWet: 0.6,
      delayEnabled: true,
      delayTime: 0.45,
      delayFeedback: 0.65,
      masterVolume: 0.75,
      subOscEnabled: false,
      lfoRate: 1.4,
      lfoDepth: 0.85,
      lfoTarget: 'cutoff',
    },
  },
  {
    id: 'factory-sonar-ping',
    name: 'SUBSEA RADAR PING',
    category: 'FX',
    isFactory: true,
    params: {
      ...DEFAULT_PARAMS,
      waveform: 'sine',
      tune: 1200,
      oscMix: 0.5,
      cutoff: 8000,
      resonance: 12.0,
      attack: 0.005,
      decay: 0.85,
      sustain: 0.01,
      release: 1.4,
      reverbEnabled: true,
      reverbWet: 0.8,
      delayEnabled: true,
      delayTime: 0.6,
      delayFeedback: 0.6,
      masterVolume: 0.75,
      subOscEnabled: false,
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

