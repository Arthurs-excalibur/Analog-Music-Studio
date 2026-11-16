// System Settings Types & Persistence for Analog Studio / Vintage Synth 2.0

export type HardwareFinish = 'walnut' | 'black-ash' | 'silver';
export type AccentLighting = 'amber' | 'lime' | 'warm-white';
export type PanelContrast = 'low' | 'mid' | 'high';
export type KnobSensitivity = 'fine' | 'normal' | 'coarse';
export type DragMode = 'vertical' | 'circular';
export type ShowNumericValues = 'always' | 'hover';
export type FaderSensitivity = 'fine' | 'normal' | 'coarse';
export type VelocityMode = 'fixed' | 'dynamic';
export type KeyLabelsMode = 'always' | 'hover' | 'none';
export type PatternLength = 8 | 16;

export interface SystemSettings {
  // 01. Appearance
  finish: HardwareFinish;
  accentLighting: AccentLighting;
  luminosity: number; // 20 - 100
  contrast: PanelContrast;
  controlLighting: boolean;

  // 02. Controls
  knobSensitivity: KnobSensitivity;
  dragMode: DragMode;
  doubleClickReset: boolean;
  showNumericValues: ShowNumericValues;
  tooltips: boolean;
  faderSensitivity: FaderSensitivity;

  // 03. Audio
  masterVolumePreference: number; // 0.0 - 1.0
  velocityMode: VelocityMode;
  fixedVelocityValue: number; // 1 - 127

  // 04. Performance
  computerKeyboardEnabled: boolean;
  baseOctave: number; // 2, 3, 4, 5
  keyLabels: KeyLabelsMode;
  octaveMarkers: boolean;
  defaultSequencerTempo: number; // 40 - 240
  patternLength: PatternLength;
  showPlaybackStep: boolean;
}

export const SETTINGS_STORAGE_KEY = 'analog_studio_settings_v1';

export const DEFAULT_SETTINGS: SystemSettings = {
  // 01. Appearance
  finish: 'walnut',
  accentLighting: 'amber',
  luminosity: 75,
  contrast: 'mid',
  controlLighting: true,

  // 02. Controls
  knobSensitivity: 'normal',
  dragMode: 'vertical',
  doubleClickReset: true,
  showNumericValues: 'always',
  tooltips: true,
  faderSensitivity: 'normal',

  // 03. Audio
  masterVolumePreference: 0.75,
  velocityMode: 'dynamic',
  fixedVelocityValue: 100,

  // 04. Performance
  computerKeyboardEnabled: true,
  baseOctave: 3,
  keyLabels: 'always',
  octaveMarkers: true,
  defaultSequencerTempo: 120,
  patternLength: 16,
  showPlaybackStep: true,
};

export function loadSavedSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          // Constrain ranges safely
          luminosity: Math.max(20, Math.min(100, typeof parsed.luminosity === 'number' ? parsed.luminosity : DEFAULT_SETTINGS.luminosity)),
          masterVolumePreference: Math.max(0, Math.min(1, typeof parsed.masterVolumePreference === 'number' ? parsed.masterVolumePreference : DEFAULT_SETTINGS.masterVolumePreference)),
          fixedVelocityValue: Math.max(1, Math.min(127, typeof parsed.fixedVelocityValue === 'number' ? parsed.fixedVelocityValue : DEFAULT_SETTINGS.fixedVelocityValue)),
          baseOctave: Math.max(2, Math.min(5, typeof parsed.baseOctave === 'number' ? parsed.baseOctave : DEFAULT_SETTINGS.baseOctave)),
          defaultSequencerTempo: Math.max(40, Math.min(240, typeof parsed.defaultSequencerTempo === 'number' ? parsed.defaultSequencerTempo : DEFAULT_SETTINGS.defaultSequencerTempo)),
          patternLength: parsed.patternLength === 8 ? 8 : 16,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load settings, using defaults:', err);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: SystemSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}
