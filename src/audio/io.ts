// File Import & Export for Presets and Patterns
import { Preset, SequencerPattern, saveUserPreset, savePattern, loadAllPresets } from './presets';

export function validatePreset(obj: unknown): obj is Preset {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as Record<string, unknown>;
  if (typeof p.name !== 'string' || !p.name.trim()) return false;
  if (!p.params || typeof p.params !== 'object') return false;

  const params = p.params as Record<string, unknown>;
  const requiredNumKeys = ['cutoff', 'resonance', 'attack', 'decay', 'sustain', 'release', 'masterVolume'];
  for (const k of requiredNumKeys) {
    if (typeof params[k] !== 'number' || !Number.isFinite(params[k])) {
      return false;
    }
  }

  const validWaves = ['sine', 'triangle', 'sawtooth', 'square'];
  if (params.waveform !== undefined && !validWaves.includes(String(params.waveform))) {
    return false;
  }

  return true;
}

export function validatePattern(obj: unknown): obj is SequencerPattern {
  if (!obj || typeof obj !== 'object') return false;
  const pat = obj as Record<string, unknown>;
  if (!Array.isArray(pat.steps) || pat.steps.length !== 16) return false;
  if (!pat.steps.every((s) => typeof s === 'boolean')) return false;

  if (pat.notes !== undefined) {
    if (!Array.isArray(pat.notes) || pat.notes.length !== 16) return false;
    if (!pat.notes.every((n) => typeof n === 'number' && Number.isFinite(n))) return false;
  }

  if (pat.bpm !== undefined) {
    if (typeof pat.bpm !== 'number' || pat.bpm < 30 || pat.bpm > 300) return false;
  }

  return true;
}

export function exportPresetToFile(preset: Preset) {
  if (typeof document === 'undefined') return;
  const data = JSON.stringify(preset, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${preset.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-preset.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

export function exportAllPresetsToFile(presets?: Preset[]) {
  if (typeof document === 'undefined') return;
  const list = presets || loadAllPresets();
  const data = JSON.stringify(list, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analog-studio-presets-backup-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

export function exportPatternToFile(pattern: SequencerPattern) {
  if (typeof document === 'undefined') return;
  const data = JSON.stringify(pattern, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analog-pattern-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

export function importPresetFromFile(file: File): Promise<Preset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!validatePreset(parsed)) {
          throw new Error('Invalid preset file: schema validation failed');
        }
        const saved = saveUserPreset({
          name: parsed.name.trim().toUpperCase(),
          category: parsed.category || 'Lead',
          params: parsed.params,
        });
        resolve(saved);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function importPresetsFromFile(file: File): Promise<Preset[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          const imported: Preset[] = [];
          for (const item of parsed) {
            if (validatePreset(item)) {
              const saved = saveUserPreset({
                name: item.name.trim().toUpperCase(),
                category: item.category || 'Lead',
                params: item.params,
              });
              imported.push(saved);
            }
          }
          if (imported.length === 0) {
            throw new Error('No valid presets found in JSON array');
          }
          resolve(imported);
        } else if (validatePreset(parsed)) {
          const saved = saveUserPreset({
            name: parsed.name.trim().toUpperCase(),
            category: parsed.category || 'Lead',
            params: parsed.params,
          });
          resolve([saved]);
        } else {
          throw new Error('Invalid preset file: schema validation failed');
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function importPatternFromFile(file: File): Promise<SequencerPattern> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!validatePattern(parsed)) {
          throw new Error('Invalid pattern file: schema validation failed');
        }
        savePattern(parsed);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// URL Hash Patch Serialization & Sharing
export function encodePresetToHash(preset: Preset): string {
  try {
    const payload = {
      name: preset.name,
      category: preset.category,
      params: preset.params,
    };
    const jsonStr = JSON.stringify(payload);
    if (typeof btoa !== 'undefined') {
      return encodeURIComponent(btoa(jsonStr));
    }
  } catch (err) {
    console.error('Failed to encode preset to hash:', err);
  }
  return '';
}

export function decodePresetFromHash(hashString: string): Preset | null {
  try {
    const clean = hashString.replace(/^#patch=/, '').replace(/^#/, '');
    if (!clean) return null;
    if (typeof atob === 'undefined') return null;
    const jsonStr = atob(decodeURIComponent(clean));
    const parsed = JSON.parse(jsonStr);
    if (validatePreset(parsed)) {
      return {
        id: `shared-${Date.now()}`,
        name: parsed.name.trim().toUpperCase(),
        category: parsed.category || 'Lead',
        params: parsed.params,
        isFactory: false,
      };
    }
  } catch {
    // Malformed hash or invalid base64
  }
  return null;
}

