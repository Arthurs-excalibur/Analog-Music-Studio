import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Trash2, Save, Bell } from 'lucide-react';
import { engine } from '../audio/engine';
import { loadSavedPattern, savePattern } from '../audio/presets';
import { PatternLength, AccentLighting } from '../types/settings';

interface StepSequencerProps {
  onStatusChange?: (msg: string) => void;
  defaultBpm?: number;
  patternLength?: PatternLength; // 8 | 16
  showPlaybackStep?: boolean;
  accentLighting?: AccentLighting;
}

const SCALE_NOTES = [
  { name: 'C3', midi: 48 },
  { name: 'D3', midi: 50 },
  { name: 'Eb3', midi: 51 },
  { name: 'F3', midi: 53 },
  { name: 'G3', midi: 55 },
  { name: 'Ab3', midi: 56 },
  { name: 'Bb3', midi: 58 },
  { name: 'C4', midi: 60 },
  { name: 'Eb4', midi: 63 },
  { name: 'F4', midi: 65 },
  { name: 'G4', midi: 67 },
  { name: 'C5', midi: 72 },
];

export const StepSequencer: React.FC<StepSequencerProps> = ({
  onStatusChange,
  defaultBpm = 120,
  patternLength = 16,
  showPlaybackStep = true,
  accentLighting = 'amber',
}) => {
  const initial = loadSavedPattern();
  const [steps, setSteps] = useState<boolean[]>(initial.steps);
  const [notes, setNotes] = useState<number[]>(initial.notes);
  const [bpm, setBpm] = useState<number>(initial.bpm || defaultBpm);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [swing, setSwing] = useState<number>(0);
  const [metronome, setMetronome] = useState<boolean>(false);

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const patternLengthRef = useRef(patternLength);
  patternLengthRef.current = patternLength;
  const swingRef = useRef(swing);
  swingRef.current = swing;
  const metronomeRef = useRef(metronome);
  metronomeRef.current = metronome;

  // Web Audio lookahead scheduling variables
  const nextNoteTimeRef = useRef<number>(0);
  const current16thNoteRef = useRef<number>(0);
  const scheduleTimerRef = useRef<number | null>(null);

  const toggleStep = (index: number) => {
    // If step is out of current pattern length, don't toggle or allow
    if (index >= patternLength) return;
    setSteps((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      savePattern({ steps: next, notes: notesRef.current, bpm: bpmRef.current });
      return next;
    });
    if (onStatusChange) {
      onStatusChange(`STEP ${index + 1}: ${!steps[index] ? 'ON' : 'OFF'}`);
    }
  };

  const handleNoteChange = (stepIdx: number, newMidi: number) => {
    setNotes((prev) => {
      const next = [...prev];
      next[stepIdx] = newMidi;
      savePattern({ steps: stepsRef.current, notes: next, bpm: bpmRef.current });
      return next;
    });
    setEditingStepIndex(null);
    if (onStatusChange) {
      const noteName = SCALE_NOTES.find((n) => n.midi === newMidi)?.name || `MIDI ${newMidi}`;
      onStatusChange(`STEP ${stepIdx + 1} PITCH: ${noteName}`);
    }
  };

  const clearPattern = () => {
    const empty = new Array(16).fill(false);
    setSteps(empty);
    savePattern({ steps: empty, notes, bpm });
    if (onStatusChange) onStatusChange('SEQUENCER PATTERN CLEARED');
  };

  const handleSavePattern = () => {
    savePattern({ steps, notes, bpm });
    if (onStatusChange) onStatusChange('PATTERN SAVED TO LOCAL STORAGE');
  };

  // Web Audio Lookahead Engine
  useEffect(() => {
    if (!isPlaying) {
      if (scheduleTimerRef.current) clearInterval(scheduleTimerRef.current);
      setCurrentStep(-1);
      return;
    }

    const lookahead = 25.0; // milliseconds
    const scheduleAheadTime = 0.1; // seconds

    const nextStepTime = () => {
      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += 0.25 * secondsPerBeat; // 16th note
      const activeLen = patternLengthRef.current || 16;
      current16thNoteRef.current = (current16thNoteRef.current + 1) % activeLen;
    };

    const scheduleNote = (stepNumber: number, time: number) => {
      let actualTime = time;
      const secondsPerBeat = 60.0 / bpmRef.current;

      // Apply swing to off-beat 16th notes
      if (stepNumber % 2 === 1 && swingRef.current > 0) {
        const swingOffset = (secondsPerBeat * 0.25) * (swingRef.current / 100) * 0.5;
        actualTime += swingOffset;
      }

      // Audio trigger
      if (stepsRef.current[stepNumber]) {
        const midi = notesRef.current[stepNumber] || 60;
        const noteDuration = (secondsPerBeat / 4) * 0.8;
        engine.scheduleStepNote(midi, actualTime, noteDuration);
      }

      // Metronome click on beat starts
      if (metronomeRef.current && stepNumber % 4 === 0) {
        engine.playMetronomeClick(actualTime, stepNumber === 0);
      }

      // Visual trigger sync
      const delayMs = Math.max(0, (actualTime - engine.getCurrentTime()) * 1000);
      setTimeout(() => {
        if (isPlayingRef.current) {
          setCurrentStep(stepNumber);
        }
      }, delayMs);
    };

    const scheduler = () => {
      const currentTime = engine.getCurrentTime();
      while (nextNoteTimeRef.current < currentTime + scheduleAheadTime) {
        scheduleNote(current16thNoteRef.current, nextNoteTimeRef.current);
        nextStepTime();
      }
    };

    // Start playback clock
    current16thNoteRef.current = 0;
    nextNoteTimeRef.current = engine.getCurrentTime() + 0.05;
    scheduleTimerRef.current = window.setInterval(scheduler, lookahead);

    return () => {
      if (scheduleTimerRef.current) clearInterval(scheduleTimerRef.current);
    };
  }, [isPlaying]);

  const getAccentBorder = () => {
    if (accentLighting === 'lime') return 'border-[#b6d63c]';
    if (accentLighting === 'warm-white') return 'border-[#f5ede0]';
    return 'border-[#e6a34a]';
  };

  const getActiveLedStyle = (active: boolean) => {
    if (!active) return 'bg-[#181f08] opacity-25';
    if (accentLighting === 'lime') return 'bg-[#b6d63c] led-lime-glow';
    if (accentLighting === 'warm-white') return 'bg-[#f5ede0] shadow-[0_0_6px_rgba(245,237,224,0.7)]';
    return 'bg-[#e6a34a] lcd-amber-glow';
  };

  return (
    <div className="flex flex-col gap-2 p-2.5 rounded bg-[#211f1d] border border-white/5 shadow-inner select-none relative">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.55px] uppercase text-[#c8b9a5] engraved-text">
            {patternLength === 8 ? '8-STEP SEQUENCER' : '16-STEP SEQUENCER'}
          </span>

          {/* Transport buttons */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1 rounded-[3px] border flex items-center gap-1.5 cursor-pointer text-[10px] font-bold transition-all ${
              isPlaying
                ? accentLighting === 'lime'
                  ? 'bg-[#b6d63c] text-black border-[#b6d63c] led-lime-glow'
                  : accentLighting === 'warm-white'
                  ? 'bg-[#f5ede0] text-black border-[#f5ede0]'
                  : 'bg-[#e6a34a] text-black border-[#e6a34a] lcd-amber-glow'
                : 'bg-[#27272a] text-[#c8b9a5] border-[#3f3f46] hover:bg-[#323236]'
            }`}
          >
            {isPlaying ? <Square size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
            {isPlaying ? 'STOP' : 'PLAY'}
          </button>

          <button
            type="button"
            onClick={clearPattern}
            className="p-1.5 rounded-[3px] border border-[#3f3f46] bg-[#27272a] text-[#c8b9a5] hover:bg-[#323236] cursor-pointer"
            title="Clear Pattern"
          >
            <Trash2 size={12} />
          </button>

          <button
            type="button"
            onClick={handleSavePattern}
            className="p-1.5 rounded-[3px] border border-[#3f3f46] bg-[#27272a] text-[#c8b9a5] hover:bg-[#323236] cursor-pointer"
            title="Save Pattern"
          >
            <Save size={12} />
          </button>

          {/* Metronome Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setMetronome(!metronome);
              if (onStatusChange) onStatusChange(`METRONOME: ${!metronome ? 'ENABLED' : 'DISABLED'}`);
            }}
            className={`px-2 py-1 rounded-[3px] border flex items-center gap-1 cursor-pointer text-[9px] font-bold transition-all ${
              metronome
                ? 'bg-[#e6a34a] text-black border-[#e6a34a] lcd-amber-glow'
                : 'bg-[#27272a] text-[#c8b9a5] border-[#3f3f46] hover:bg-[#323236]'
            }`}
            title="Toggle Metronome Audio Click"
          >
            <Bell size={10} />
            <span>METRO</span>
          </button>
        </div>

        {/* Right Controls: Swing & BPM */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Swing Slider */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-[#c8b9a5] engraved-text">SWING</span>
            <input
              type="range"
              min={0}
              max={60}
              step={5}
              value={swing}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSwing(val);
                if (onStatusChange) onStatusChange(`SWING: ${val}%`);
              }}
              className="w-16 accent-[#e6a34a] cursor-pointer"
            />
            <span className="font-mono text-[10px] text-[#e6a34a] lcd-amber-glow w-8 text-right">
              {swing}%
            </span>
          </div>

          {/* BPM Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-[#c8b9a5] engraved-text">TEMPO</span>
          <input
            type="range"
            min={40}
            max={240}
            value={bpm}
            onChange={(e) => {
              const val = Number(e.target.value);
              setBpm(val);
              savePattern({ steps, notes, bpm: val });
              if (onStatusChange) onStatusChange(`TEMPO: ${val} BPM`);
            }}
            className="w-24 accent-[#e6a34a] cursor-pointer"
          />
          <span className="font-mono text-[11px] text-[#e6a34a] lcd-amber-glow w-16 text-right">
            {bpm} BPM
          </span>
        </div>
      </div>
    </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-16 gap-1.5">
        {steps.map((isActive, idx) => {
          const isPlayhead = showPlaybackStep && currentStep === idx;
          const isBeatStart = idx % 4 === 0;
          const isOutOfBounds = idx >= patternLength;
          const midi = notes[idx] || 48;
          const noteObj = SCALE_NOTES.find((n) => n.midi === midi);
          const noteName = noteObj ? noteObj.name : `M${midi}`;

          return (
            <div
              key={idx}
              className={`flex flex-col gap-1 transition-opacity ${
                isOutOfBounds ? 'opacity-25 pointer-events-none' : 'opacity-100'
              }`}
            >
              {/* Step Button */}
              <button
                type="button"
                disabled={isOutOfBounds}
                onClick={() => toggleStep(idx)}
                className={`h-11 rounded-[2px] border flex flex-col items-center justify-between p-1 transition-all cursor-pointer ${
                  isPlayhead
                    ? `bg-[#4a443f] ${getAccentBorder()}`
                    : isBeatStart
                    ? 'bg-[#2a2725] border-[#3f3f46]'
                    : 'bg-[#1e1c1b] border-white/5'
                }`}
              >
                {/* LED Indicator */}
                <div
                  className={`w-2 h-2 rounded-full transition-all ${getActiveLedStyle(isActive)}`}
                />

                {/* Step number */}
                <span className="text-[7px] font-mono text-[#c8b9a5]/40 leading-none">
                  {idx + 1}
                </span>
              </button>

              {/* Pitch Selector Pill */}
              <button
                type="button"
                disabled={isOutOfBounds}
                onClick={() => setEditingStepIndex(editingStepIndex === idx ? null : idx)}
                className={`text-[8px] font-mono py-0.5 rounded border transition-colors truncate ${
                  editingStepIndex === idx
                    ? 'bg-[#e6a34a] text-black border-[#e6a34a]'
                    : 'bg-[#18181a] text-[#e6a34a] border-[#333] hover:border-[#e6a34a]/50'
                }`}
                title="Change pitch"
              >
                {noteName}
              </button>
            </div>
          );
        })}
      </div>

      {/* Pitch Selector Dropdown Popup */}
      {editingStepIndex !== null && (
        <div className="absolute bottom-16 left-4 z-30 p-2.5 rounded bg-[#18181b] border border-[#e6a34a] shadow-2xl flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 text-[10px] font-bold text-[#c8b9a5]">
            <span>SELECT PITCH FOR STEP {editingStepIndex + 1}:</span>
            <button
              type="button"
              onClick={() => setEditingStepIndex(null)}
              className="text-[#d94b35] hover:underline"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {SCALE_NOTES.map((n) => (
              <button
                key={n.midi}
                type="button"
                onClick={() => handleNoteChange(editingStepIndex, n.midi)}
                className={`px-2 py-1 rounded text-[9px] font-mono font-bold border cursor-pointer ${
                  notes[editingStepIndex] === n.midi
                    ? 'bg-[#e6a34a] text-black border-[#e6a34a]'
                    : 'bg-[#27272a] text-[#e6a34a] border-[#3f3f46] hover:bg-[#343438]'
                }`}
              >
                {n.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
