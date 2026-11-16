import React, { useState, useEffect } from 'react';
import {
  KeyLabelsMode,
  VelocityMode,
  AccentLighting,
} from '../types/settings';

interface PianoKeyboardProps {
  onNoteOn: (note: number, velocity?: number) => void;
  onNoteOff: (note: number) => void;
  activeNotes: Set<number>;
  baseOctave?: number; // 2, 3, 4, 5
  computerKeyboardEnabled?: boolean;
  keyLabels?: KeyLabelsMode;
  octaveMarkers?: boolean;
  velocityMode?: VelocityMode;
  fixedVelocityValue?: number;
  accentLighting?: AccentLighting;
}

interface KeyConfig {
  note: number;
  isBlack: boolean;
  name: string;
  octave: number;
  charKey?: string;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  onNoteOn,
  onNoteOff,
  activeNotes,
  baseOctave = 3,
  computerKeyboardEnabled = true,
  keyLabels = 'always',
  octaveMarkers = true,
  velocityMode = 'dynamic',
  fixedVelocityValue = 100,
  accentLighting = 'amber',
}) => {
  const [pressedPointers, setPressedPointers] = useState<Map<number, number>>(new Map());

  // Two octaves + top C (25 notes total)
  // C(baseOctave): MIDI number = (baseOctave + 1) * 12
  const startNote = (baseOctave + 1) * 12; // baseOctave=3 => 48 (C3)
  const numNotes = 25;

  const keyConfigs: KeyConfig[] = [];
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  for (let i = 0; i < numNotes; i++) {
    const note = startNote + i;
    const noteInOct = note % 12;
    const isBlack = [1, 3, 6, 8, 10].includes(noteInOct);
    const name = noteNames[noteInOct];
    const octave = Math.floor(note / 12) - 1;
    keyConfigs.push({ note, isBlack, name, octave });
  }

  const computerKeyMap: Record<string, number> = {
    a: startNote + 0, // C
    w: startNote + 1, // C#
    s: startNote + 2, // D
    e: startNote + 3, // D#
    d: startNote + 4, // E
    f: startNote + 5, // F
    t: startNote + 6, // F#
    g: startNote + 7, // G
    y: startNote + 8, // G#
    h: startNote + 9, // A
    u: startNote + 10, // A#
    j: startNote + 11, // B
    k: startNote + 12, // C
    o: startNote + 13, // C#
    l: startNote + 14, // D
    p: startNote + 15, // D#
    ';': startNote + 16, // E
  };

  // Keyboard listeners
  useEffect(() => {
    if (!computerKeyboardEnabled) return;

    const activeKeyCodes = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (computerKeyMap[key] !== undefined && !activeKeyCodes.has(key)) {
        activeKeyCodes.add(key);
        const vel = velocityMode === 'fixed' ? fixedVelocityValue : 100;
        onNoteOn(computerKeyMap[key], vel);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (activeKeyCodes.has(key)) {
        activeKeyCodes.delete(key);
        onNoteOff(computerKeyMap[key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startNote, computerKeyboardEnabled, velocityMode, fixedVelocityValue, onNoteOn, onNoteOff]);

  const handlePointerDown = (note: number, e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setPressedPointers((prev) => new Map(prev).set(e.pointerId, note));

    let vel = fixedVelocityValue;
    if (velocityMode === 'dynamic') {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      // Top of key = 40 (softer), Bottom of key = 127 (harder)
      vel = Math.round(40 + relY * 87);
    }
    onNoteOn(note, vel);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const note = pressedPointers.get(e.pointerId);
    if (note !== undefined) {
      onNoteOff(note);
      setPressedPointers((prev) => {
        const next = new Map(prev);
        next.delete(e.pointerId);
        return next;
      });
    }
  };

  const whiteKeys = keyConfigs.filter((k) => !k.isBlack);

  const getAccentShadow = (active: boolean) => {
    if (!active) return '';
    if (accentLighting === 'lime') return 'active shadow-[inset_0_0_12px_#b6d63c]';
    if (accentLighting === 'warm-white') return 'active shadow-[inset_0_0_12px_#f5ede0]';
    return 'active shadow-[inset_0_0_12px_#e6a34a]';
  };

  const getAccentLed = () => {
    if (accentLighting === 'lime') return 'bg-[#b6d63c] led-lime-glow';
    if (accentLighting === 'warm-white') return 'bg-[#f5ede0] shadow-[0_0_6px_rgba(245,237,224,0.7)]';
    return 'bg-[#e6a34a] lcd-amber-glow';
  };

  return (
    <div className="relative w-full h-28 bg-[#181615] p-2 rounded border-t-4 border-[#211f1d] shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] select-none touch-none">
      {/* White Keys Row */}
      <div className="flex w-full h-full gap-0.5 touch-none">
        {whiteKeys.map((k) => {
          const isActive = activeNotes.has(k.note);
          const isCKey = k.name === 'C';
          return (
            <button
              key={k.note}
              type="button"
              className={`ivory-key group flex-1 h-full rounded-b-[3px] flex flex-col justify-between items-center py-1.5 transition-all relative ${
                getAccentShadow(isActive)
              }`}
              onPointerDown={(e) => handlePointerDown(k.note, e)}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              aria-label={`${k.name}${k.octave} key`}
            >
              {/* Top Octave Marker Badge */}
              <div className="h-3 flex items-center justify-center">
                {octaveMarkers && isCKey && (
                  <span className="text-[7.5px] font-mono font-black text-black/40 border border-black/20 rounded px-1 py-0.2 bg-black/5 shadow-inner">
                    C{k.octave}
                  </span>
                )}
              </div>

              {/* Bottom Note Name & LED Indicator */}
              <div className="flex flex-col items-center">
                {isActive && (
                  <div className={`w-2 h-2 rounded-full mb-0.5 animate-pulse ${getAccentLed()}`} />
                )}
                {keyLabels !== 'none' && (
                  <span
                    className={`text-[8.5px] font-mono font-semibold text-black/60 select-none transition-opacity ${
                      keyLabels === 'hover'
                        ? 'opacity-0 group-hover:opacity-100'
                        : 'opacity-100'
                    }`}
                  >
                    {k.name}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Black Keys Layer overlay */}
      <div className="absolute top-2 left-2 right-2 h-[62%] flex pointer-events-none">
        {whiteKeys.map((wk) => {
          const nextBlack = keyConfigs.find((k) => k.isBlack && k.note === wk.note + 1);

          return (
            <div key={wk.note} className="flex-1 relative h-full">
              {nextBlack && (
                <button
                  type="button"
                  className={`black-key group absolute right-[-28%] w-[56%] h-full z-10 rounded-b-[2px] pointer-events-auto flex flex-col justify-end items-center pb-1.5 transition-all ${
                    getAccentShadow(activeNotes.has(nextBlack.note))
                  }`}
                  onPointerDown={(e) => handlePointerDown(nextBlack.note, e)}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  aria-label={`${nextBlack.name}${nextBlack.octave} key`}
                >
                  {activeNotes.has(nextBlack.note) && (
                    <div className={`w-1.5 h-1.5 rounded-full mb-1 ${getAccentLed()}`} />
                  )}
                  {keyLabels !== 'none' && (
                    <span
                      className={`text-[7px] font-mono text-white/50 select-none transition-opacity ${
                        keyLabels === 'hover'
                          ? 'opacity-0 group-hover:opacity-100'
                          : 'opacity-100'
                      }`}
                    >
                      {nextBlack.name}
                    </span>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
