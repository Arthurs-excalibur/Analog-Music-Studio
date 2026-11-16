import { describe, it, expect } from 'vitest';
import {
  exportPresetToFile,
  exportPatternToFile,
  encodePresetToHash,
  decodePresetFromHash,
} from './io';
import { FACTORY_PRESETS, DEFAULT_PATTERN } from './presets';

describe('IO - Preset & Pattern Export', () => {
  it('prepares preset export file format without throwing', () => {
    expect(() => {
      exportPresetToFile(FACTORY_PRESETS[0]);
    }).not.toThrow();
  });

  it('prepares pattern export file format without throwing', () => {
    expect(() => {
      exportPatternToFile(DEFAULT_PATTERN);
    }).not.toThrow();
  });

  it('encodes and decodes shareable URL preset hashes accurately', () => {
    const original = FACTORY_PRESETS[1]; // DEEP MOOG BASS
    const hash = encodePresetToHash(original);
    expect(hash.length).toBeGreaterThan(10);

    const decoded = decodePresetFromHash(`#patch=${hash}`);
    expect(decoded).not.toBeNull();
    expect(decoded?.name).toBe('DEEP MOOG BASS');
    expect(decoded?.params.cutoff).toBe(original.params.cutoff);
    expect(decoded?.params.waveform).toBe(original.params.waveform);
  });

  it('rejects corrupted or malformed URL hashes safely', () => {
    expect(decodePresetFromHash('')).toBeNull();
    expect(decodePresetFromHash('#patch=not-valid-base64-&&&')).toBeNull();
    expect(decodePresetFromHash('#patch=eyJpbnZhbGlkIjoidHJ1ZSJ9')).toBeNull();
  });
});
