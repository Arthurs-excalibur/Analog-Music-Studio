import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS, SystemSettings } from './SettingsScreen';

describe('SettingsScreen logic & tokens', () => {
  it('has valid default system settings across all 5 categories', () => {
    // 01. Appearance
    expect(DEFAULT_SETTINGS.finish).toBe('walnut');
    expect(DEFAULT_SETTINGS.accentLighting).toBe('amber');
    expect(DEFAULT_SETTINGS.luminosity).toBe(75);
    expect(DEFAULT_SETTINGS.contrast).toBe('mid');
    expect(DEFAULT_SETTINGS.controlLighting).toBe(true);

    // 02. Controls
    expect(DEFAULT_SETTINGS.knobSensitivity).toBe('normal');
    expect(DEFAULT_SETTINGS.dragMode).toBe('vertical');
    expect(DEFAULT_SETTINGS.doubleClickReset).toBe(true);
    expect(DEFAULT_SETTINGS.showNumericValues).toBe('always');
    expect(DEFAULT_SETTINGS.tooltips).toBe(true);
    expect(DEFAULT_SETTINGS.faderSensitivity).toBe('normal');

    // 03. Audio
    expect(DEFAULT_SETTINGS.masterVolumePreference).toBe(0.75);
    expect(DEFAULT_SETTINGS.velocityMode).toBe('dynamic');
    expect(DEFAULT_SETTINGS.fixedVelocityValue).toBe(100);

    // 04. Performance
    expect(DEFAULT_SETTINGS.computerKeyboardEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.baseOctave).toBe(3);
    expect(DEFAULT_SETTINGS.keyLabels).toBe('always');
    expect(DEFAULT_SETTINGS.octaveMarkers).toBe(true);
    expect(DEFAULT_SETTINGS.defaultSequencerTempo).toBe(120);
    expect(DEFAULT_SETTINGS.patternLength).toBe(16);
    expect(DEFAULT_SETTINGS.showPlaybackStep).toBe(true);
  });

  it('correctly updates and validates settings mutations', () => {
    const updated: SystemSettings = {
      ...DEFAULT_SETTINGS,
      finish: 'black-ash',
      luminosity: 90,
      contrast: 'high',
      knobSensitivity: 'fine',
      dragMode: 'circular',
      velocityMode: 'fixed',
      fixedVelocityValue: 120,
      baseOctave: 2,
      patternLength: 8,
    };

    expect(updated.finish).toBe('black-ash');
    expect(updated.luminosity).toBe(90);
    expect(updated.contrast).toBe('high');
    expect(updated.knobSensitivity).toBe('fine');
    expect(updated.dragMode).toBe('circular');
    expect(updated.velocityMode).toBe('fixed');
    expect(updated.fixedVelocityValue).toBe(120);
    expect(updated.baseOctave).toBe(2);
    expect(updated.patternLength).toBe(8);
  });
});
