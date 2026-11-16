import React, { useState, useEffect, useRef } from 'react';
import { engine, DEFAULT_PARAMS, SynthParams, WaveformType } from './audio/engine';
import {
  Preset,
  loadAllPresets,
  saveUserPreset,
  deleteUserPreset,
  getSavedPresetId,
  setSavedPresetId,
} from './audio/presets';
import { recorder } from './audio/recorder';
import { midi } from './audio/midi';
import { exportPresetToFile, importPresetFromFile, encodePresetToHash, decodePresetFromHash } from './audio/io';
import { Knob } from './components/Knob';
import { ToggleSwitch } from './components/ToggleSwitch';
import { Fader } from './components/Fader';
import { LCDDisplay } from './components/LCDDisplay';
import { VUMeter } from './components/VUMeter';
import { Oscilloscope } from './components/Oscilloscope';
import { PianoKeyboard } from './components/PianoKeyboard';
import { StepSequencer } from './components/StepSequencer';
import {
  RotateCcw,
  BookmarkPlus,
  FolderOpen,
  Trash2,
  X,
  Circle,
  Download,
  Upload,
  Radio,
  Settings as SettingsIcon,
  Undo2,
  Redo2,
  Share2,
} from 'lucide-react';
import {
  SettingsScreen,
  SystemSettings,
  DEFAULT_SETTINGS,
} from './components/SettingsScreen';
import { loadSavedSettings, saveSettings } from './types/settings';
import { OrientationGate, useOrientationGate } from './components/OrientationGate';

export default function App() {
  const { isBlocked: isOrientationBlocked, width: viewportWidth, height: viewportHeight } = useOrientationGate();

  // Scale the entire instrument to fit any viewport width proportionally.
  // Renders at DESIGN_WIDTH then CSS zoom shrinks it uniformly — no layout reflowing.
  const DESIGN_WIDTH = 1260;
  const DESIGN_HEIGHT = 630;

  const [instrumentScale, setInstrumentScale] = useState(() => {
    if (typeof window === 'undefined') return 1;
    const availW = window.innerWidth - 16;
    const availH = window.innerHeight - 16;
    const scaleX = availW / DESIGN_WIDTH;
    const scaleY = availH / DESIGN_HEIGHT;
    return Math.max(0.35, Math.min(1, Math.min(scaleX, scaleY)));
  });

  useEffect(() => {
    const updateScale = () => {
      const availW = window.innerWidth - 16;
      const availH = window.innerHeight - 16;
      const scaleX = availW / DESIGN_WIDTH;
      const scaleY = availH / DESIGN_HEIGHT;
      setInstrumentScale(Math.max(0.35, Math.min(1, Math.min(scaleX, scaleY))));
    };
    window.addEventListener('resize', updateScale, { passive: true });
    window.addEventListener('orientationchange', updateScale, { passive: true });
    return () => {
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('orientationchange', updateScale);
    };
  }, []);

  // Use transform: scale() with top-center origin so the board scales
  // downward without clipping the header on small phone viewports.
  const zoomStyle: React.CSSProperties =
    instrumentScale < 1
      ? {
          transform: `scale(${instrumentScale})`,
          transformOrigin: 'top center',
          width: `${DESIGN_WIDTH}px`,
          minWidth: `${DESIGN_WIDTH}px`,
          // Collapse the visual footprint so the outer container doesn't scroll
          marginBottom: `-${Math.round(DESIGN_HEIGHT * (1 - instrumentScale))}px`,
        }
      : {
          width: '100%',
          maxWidth: `${DESIGN_WIDTH}px`,
        };

  const [presets, setPresets] = useState<Preset[]>(loadAllPresets());
  const [currentPresetId, setCurrentPresetId] = useState<string>(getSavedPresetId());
  const [params, setParams] = useState<SynthParams>(() => {
    const all = loadAllPresets();
    const saved = all.find((p) => p.id === getSavedPresetId());
    return saved ? { ...saved.params } : { ...DEFAULT_PARAMS };
  });

  const [activeScreen, setActiveScreen] = useState<'synth' | 'settings'>('synth');
  const [settings, setSettings] = useState<SystemSettings>(() => loadSavedSettings());

  const handleUpdateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      if (newSettings.masterVolumePreference !== undefined) {
        updateParam('masterVolume', newSettings.masterVolumePreference);
      }
      return updated;
    });
    setStatusMessage('SETTINGS UPDATED');
  };

  const [isPowered, setIsPowered] = useState<boolean>(true);
  const [isAudioStarted, setIsAudioStarted] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [midiDevice, setMidiDevice] = useState<string | null>(null);

  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [vuLevels, setVuLevels] = useState<{ left: number; right: number }>({ left: 0, right: 0 });
  const [statusMessage, setStatusMessage] = useState<string>('Press a key or turn a knob to begin.');

  // Dialog states
  const [isPresetBrowserOpen, setIsPresetBrowserOpen] = useState<boolean>(false);
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<'ALL' | 'Lead' | 'Bass' | 'Pad' | 'Pluck' | 'FX'>('ALL');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const presetFileInputRef = useRef<HTMLInputElement>(null);

  // Undo / Redo History Stack
  const historyRef = useRef<SynthParams[]>([params]);
  const historyIndexRef = useRef<number>(0);

  const pushHistory = (newParams: SynthParams) => {
    const curIdx = historyIndexRef.current;
    const branch = historyRef.current.slice(0, curIdx + 1);
    branch.push({ ...newParams });
    if (branch.length > 50) branch.shift();
    historyRef.current = branch;
    historyIndexRef.current = branch.length - 1;
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const targetParams = historyRef.current[historyIndexRef.current];
      setParams({ ...targetParams });
      engine.setParams({ ...targetParams });
      setStatusMessage('UNDO: PARAMETERS REVERTED');
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const targetParams = historyRef.current[historyIndexRef.current];
      setParams({ ...targetParams });
      engine.setParams({ ...targetParams });
      setStatusMessage('REDO: PARAMETERS RESTORED');
    }
  };

  // Keyboard shortcut for Undo (Ctrl+Z) and Redo (Ctrl+Y or Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyNav = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyNav);
    return () => window.removeEventListener('keydown', handleKeyNav);
  }, []);

  // Initial engine sync, URL hash patch loader, and MIDI setup
  useEffect(() => {
    engine.setParams(params);

    // Check if URL has shareable patch hash
    if (typeof window !== 'undefined' && window.location.hash) {
      const shared = decodePresetFromHash(window.location.hash);
      if (shared) {
        handleSelectPreset(shared);
        setStatusMessage(`SHARED PATCH LOADED: ${shared.name}`);
      }
    }

    midi.init(
      (note, vel) => handleNoteOn(note, vel),
      (note) => handleNoteOff(note),
      (deviceName) => {
        setMidiDevice(deviceName);
        if (deviceName) {
          setStatusMessage(`MIDI CONTROLLER DETECTED: ${deviceName.toUpperCase()}`);
        }
      }
    );
  }, []);

  // VU meter polling loop
  useEffect(() => {
    let animId: number;
    const pollVU = () => {
      animId = requestAnimationFrame(pollVU);
      if (isPowered) {
        setVuLevels(engine.getVULevel());
      } else {
        setVuLevels({ left: 0, right: 0 });
      }
    };
    pollVU();
    return () => cancelAnimationFrame(animId);
  }, [isPowered]);

  const currentPreset = presets.find((p) => p.id === currentPresetId) || presets[0];
  const currentPresetIndex = presets.findIndex((p) => p.id === currentPresetId);

  const startAudioEngine = () => {
    engine.init();
    setIsAudioStarted(true);
    setStatusMessage('AUDIO ENGINE INITIALIZED & RUNNING');
  };

  const updateParam = <K extends keyof SynthParams>(key: K, value: SynthParams[K]) => {
    const updated = { [key]: value };
    setParams((prev) => {
      const next = { ...prev, ...updated };
      pushHistory(next);
      return next;
    });
    engine.setParams(updated);
    setStatusMessage(`${String(key).toUpperCase()}: ${value}`);
  };

  const handleShareCurrentPatch = () => {
    const hash = encodePresetToHash({
      id: currentPresetId,
      name: currentPreset.name,
      category: currentPreset.category,
      params: { ...params },
    });
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}${window.location.pathname}#patch=${hash}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          setStatusMessage('SHAREABLE LINK COPIED TO CLIPBOARD');
        }).catch(() => {
          window.location.hash = `patch=${hash}`;
          setStatusMessage('PATCH HASH STORED IN URL');
        });
      } else {
        window.location.hash = `patch=${hash}`;
        setStatusMessage('PATCH HASH STORED IN URL');
      }
    }
  };

  const handleSelectPreset = (p: Preset) => {
    setCurrentPresetId(p.id);
    setSavedPresetId(p.id);
    setParams({ ...p.params });
    engine.setParams({ ...p.params });
    setIsPresetBrowserOpen(false);
    setStatusMessage(`LOADED: ${p.name}`);
  };

  const handleNextPreset = () => {
    const nextIdx = (currentPresetIndex + 1) % presets.length;
    handleSelectPreset(presets[nextIdx]);
  };

  const handlePrevPreset = () => {
    const prevIdx = (currentPresetIndex - 1 + presets.length) % presets.length;
    handleSelectPreset(presets[prevIdx]);
  };

  const handleSaveCurrentPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const saved = saveUserPreset({
      name: newPresetName.trim().toUpperCase(),
      category: 'Lead',
      params: { ...params },
    });

    const refreshed = loadAllPresets();
    setPresets(refreshed);
    setCurrentPresetId(saved.id);
    setSavedPresetId(saved.id);
    setIsSaveModalOpen(false);
    setNewPresetName('');
    setStatusMessage(`PRESET SAVED: ${saved.name}`);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const refreshed = deleteUserPreset(id);
    setPresets(refreshed);
    if (currentPresetId === id) {
      handleSelectPreset(refreshed[0]);
    }
    setStatusMessage('PRESET DELETED');
  };

  const handleExportCurrentPreset = (p: Preset, e: React.MouseEvent) => {
    e.stopPropagation();
    exportPresetToFile(p);
    setStatusMessage(`EXPORTED: ${p.name}.json`);
  };

  const handleImportPresetClick = () => {
    if (presetFileInputRef.current) {
      presetFileInputRef.current.click();
    }
  };

  const handlePresetFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importPresetFromFile(file);
      const refreshed = loadAllPresets();
      setPresets(refreshed);
      handleSelectPreset(imported);
      setStatusMessage(`IMPORTED PRESET: ${imported.name}`);
    } catch {
      setStatusMessage('ERROR: INVALID PRESET JSON FILE');
    }
    e.target.value = '';
  };

  const toggleRecording = () => {
    if (!isAudioStarted) startAudioEngine();
    const ctx = engine.getAudioContext();
    const master = engine.getMasterGain();
    if (!ctx || !master) {
      engine.init();
    }
    const activeCtx = engine.getAudioContext()!;
    const activeMaster = engine.getMasterGain()!;

    if (isRecording) {
      recorder.stopRecording();
      setIsRecording(false);
      setStatusMessage('RECORDING STOPPED — AUDIO FILE DOWNLOADED');
    } else {
      recorder.startRecording(activeCtx, activeMaster);
      setIsRecording(true);
      setStatusMessage('RECORDING LIVE PERFORMANCE (RED LED ON)...');
    }
  };

  const handleNoteOn = (note: number, velocity?: number) => {
    if (!isPowered) return;
    if (!isAudioStarted) setIsAudioStarted(true);
    setActiveNotes((prev) => new Set(prev).add(note));

    let vel = 100;
    if (velocity !== undefined) {
      vel = velocity <= 1 ? Math.round(velocity * 127) : velocity;
    } else if (settings.velocityMode === 'fixed') {
      vel = settings.fixedVelocityValue;
    }

    engine.noteOn(note, vel);
    setStatusMessage(`NOTE ON: MIDI ${note} (${Math.round(engine.midiToFreq(note))} Hz) VEL ${vel}`);
  };

  const handleNoteOff = (note: number) => {
    setActiveNotes((prev) => {
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
    engine.noteOff(note);
  };

  const handleResetInit = () => {
    setParams({ ...DEFAULT_PARAMS });
    engine.setParams({ ...DEFAULT_PARAMS });
    setStatusMessage('PATCH RESET TO INIT DEFAULTS');
  };

  const patchSlotDisplay = `P-${String(Math.max(1, currentPresetIndex + 1)).padStart(3, '0')}`;

  if (isOrientationBlocked) {
    return <OrientationGate width={viewportWidth} height={viewportHeight} />;
  }

  // Page background class matches the hardware finish
  const pageBgClass =
    settings.finish === 'black-ash'
      ? 'bg-[#151413]'
      : settings.finish === 'silver'
      ? 'bg-[#6b6967]'
      : 'walnut-grain';

  if (activeScreen === 'settings') {
    return (
      <div className={`w-full min-h-screen ${pageBgClass} flex items-center justify-center p-2 md:p-6 overflow-x-hidden`}>
        <div style={zoomStyle}>
          <SettingsScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onBackToEngine={() => setActiveScreen('synth')}
            onStorageCleared={() => {
              const refreshed = loadAllPresets();
              setPresets(refreshed);
              setCurrentPresetId('factory-init');
              setSavedPresetId('factory-init');
              setParams({ ...DEFAULT_PARAMS });
              engine.setParams({ ...DEFAULT_PARAMS });
              setSettings(loadSavedSettings());
              setStatusMessage('STORAGE PURGED & PRESETS RESTORED');
            }}
            onPresetsChanged={() => {
              const refreshed = loadAllPresets();
              setPresets(refreshed);
              setStatusMessage('PRESETS REFRESHED');
            }}
          />
        </div>
      </div>
    );
  }

  // Top padding to visually center the scaled board within the viewport
  const scaledH = Math.round(DESIGN_HEIGHT * instrumentScale);
  const topPad = instrumentScale < 1
    ? Math.max(0, Math.floor((window.innerHeight - scaledH) / 2))
    : 4;

  return (
    <div
      className={`w-screen h-screen max-w-screen max-h-screen ${pageBgClass} flex items-start justify-center overflow-hidden`}
      style={{ paddingTop: `${topPad}px` }}
    >
      <div style={zoomStyle}>
        {/* Outer Chassis */}
        <div
          className={`relative w-full max-w-[1280px] rounded-lg border-b-8 shadow-2xl overflow-hidden p-2 md:p-3 transition-all duration-300 ${
            settings.finish === 'black-ash'
              ? 'bg-[#151413] border-[#100f0e]'
              : settings.finish === 'silver'
              ? 'bg-[#6b6967] border-[#403e3c]'
              : 'walnut-grain border-[#2b1a13]'
          }`}
        >
        {/* Left & Right Side Cheek Panels */}
        <div
          className={`absolute top-0 bottom-0 left-0 w-6 md:w-8 transition-colors ${
            settings.finish === 'black-ash'
              ? 'bg-[#181716] shadow-[inset_-2px_0_4px_rgba(0,0,0,0.8)]'
              : settings.finish === 'silver'
              ? 'bg-[#585654] shadow-[inset_-2px_0_4px_rgba(0,0,0,0.4)]'
              : 'bg-[#2b1a13] shadow-[inset_-2px_0_4px_rgba(0,0,0,0.6)]'
          }`}
        />
        <div
          className={`absolute top-0 bottom-0 right-0 w-6 md:w-8 transition-colors ${
            settings.finish === 'black-ash'
              ? 'bg-[#181716] shadow-[inset_2px_0_4px_rgba(0,0,0,0.8)]'
              : settings.finish === 'silver'
              ? 'bg-[#585654] shadow-[inset_2px_0_4px_rgba(0,0,0,0.4)]'
              : 'bg-[#2b1a13] shadow-[inset_2px_0_4px_rgba(0,0,0,0.6)]'
          }`}
        />

        {/* Brushed Metal Main Faceplate */}
        <div
          className={`relative mx-6 md:mx-8 my-1 rounded border-4 brushed-faceplate chassis-bevel p-3.5 md:p-5 flex flex-col gap-2.5 md:gap-3 transition-colors duration-200 ${
            settings.contrast === 'low'
              ? 'bg-[#282624] border-[#383431]'
              : settings.contrast === 'high'
              ? 'bg-[#141312] border-[#0c0b0a]'
              : 'bg-[#211f1d] border-[#211f1d]'
          }`}
        >
          {/* 4 Corner Screws */}
          <div className="absolute top-3 left-3 w-4 h-4 rounded-full bg-[#52525b] shadow-inner flex items-center justify-center">
            <div className="w-2.5 h-0.5 bg-[#27272a]" />
          </div>
          <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#52525b] shadow-inner flex items-center justify-center">
            <div className="w-2.5 h-0.5 bg-[#27272a]" />
          </div>
          <div className="absolute bottom-3 left-3 w-4 h-4 rounded-full bg-[#52525b] shadow-inner flex items-center justify-center">
            <div className="w-2.5 h-0.5 bg-[#27272a]" />
          </div>
          <div className="absolute bottom-3 right-3 w-4 h-4 rounded-full bg-[#52525b] shadow-inner flex items-center justify-center">
            <div className="w-2.5 h-0.5 bg-[#27272a]" />
          </div>

          {/* Header Bar */}
          <header className="flex items-center justify-between pb-3.5 border-b border-[#c8b9a5]/20 gap-4">
            {/* Wordmark & Subtitle */}
            <div className="shrink-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-black tracking-[-1.5px] uppercase text-[#c8b9a5] engraved-text leading-tight">
                  VINTAGE SYNTH 2.0
                </h1>
                {/* Accent Lighting LED */}
                <span
                  className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                    settings.accentLighting === 'lime'
                      ? 'bg-[#b6d63c] led-lime-glow'
                      : settings.accentLighting === 'warm-white'
                      ? 'bg-[#f5ede0] shadow-[0_0_8px_rgba(245,237,224,0.7)]'
                      : 'bg-[#e6a34a] lcd-amber-glow'
                  }`}
                />
                {/* MIDI Controller Status Badge */}
                <div
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-mono tracking-wider border ${
                    midiDevice
                      ? 'bg-[#b6d63c]/15 text-[#b6d63c] border-[#b6d63c]'
                      : 'bg-[#27272a] text-[#c8b9a5]/40 border-[#3f3f46]'
                  }`}
                  title={midiDevice ? `Connected: ${midiDevice}` : 'Web MIDI ready'}
                >
                  <Radio size={9} />
                  <span>{midiDevice ? midiDevice.toUpperCase() : 'MIDI READY'}</span>
                </div>
              </div>
              <p className="text-[10px] font-bold tracking-[0.5px] uppercase text-[#c8b9a5] opacity-50 engraved-text">
                Analog Modeling Engine
              </p>
            </div>

            {/* Right Controls: Rec, LCD, Presets, VU, Volume, Power */}
            <div className="flex items-center gap-3 md:gap-4 shrink-0">
              {/* Record Audio Button */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-[10px] font-bold tracking-wider uppercase cursor-pointer transition-all ${
                  isRecording
                    ? 'bg-[#d94b35] text-white border-[#d94b35] led-red-glow animate-pulse'
                    : 'bg-[#27272a] text-[#c8b9a5] border-[#3f3f46] hover:bg-[#343438]'
                }`}
                title="Record synth audio to file"
              >
                <Circle size={10} fill="currentColor" />
                <span>{isRecording ? 'REC ON' : 'RECORD'}</span>
              </button>

              {/* LCD Display */}
              <div style={{ opacity: Math.max(0.3, settings.luminosity / 100) }}>
                <LCDDisplay
                  patchName={currentPreset.name}
                  patchNumber={patchSlotDisplay}
                  message={statusMessage}
                  onPrevPreset={handlePrevPreset}
                  onNextPreset={handleNextPreset}
                  onOpenPresetList={() => setIsPresetBrowserOpen(true)}
                />
              </div>

              {/* Preset & Settings Action Buttons */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsSaveModalOpen(true)}
                    className="px-2 py-1 rounded bg-[#27272a] hover:bg-[#323236] border border-[#3f3f46] text-[#c8b9a5] text-[9px] font-bold tracking-[0.4px] uppercase flex items-center gap-1 cursor-pointer"
                    title="Save Current Preset"
                  >
                    <BookmarkPlus size={11} />
                    SAVE
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPresetBrowserOpen(true)}
                    className="px-2 py-1 rounded bg-[#27272a] hover:bg-[#323236] border border-[#3f3f46] text-[#c8b9a5] text-[9px] font-bold tracking-[0.4px] uppercase flex items-center gap-1 cursor-pointer"
                    title="Browse Presets"
                  >
                    <FolderOpen size={11} />
                    PRESETS
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="p-1 rounded bg-[#27272a] hover:bg-[#323236] border border-[#3f3f46] text-[#c8b9a5] cursor-pointer"
                    title="Undo parameter edit (Ctrl+Z)"
                  >
                    <Undo2 size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    className="p-1 rounded bg-[#27272a] hover:bg-[#323236] border border-[#3f3f46] text-[#c8b9a5] cursor-pointer"
                    title="Redo parameter edit (Ctrl+Y)"
                  >
                    <Redo2 size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={handleShareCurrentPatch}
                    className="px-1.5 py-1 rounded bg-[#27272a] hover:bg-[#323236] border border-[#3f3f46] text-[#c8b9a5] text-[9px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                    title="Copy Shareable Link"
                  >
                    <Share2 size={10} />
                    SHARE
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveScreen('settings')}
                    className="p-1 rounded bg-[#27272a] hover:bg-[#323236] border border-[#3f3f46] text-[#c8b9a5] cursor-pointer"
                    title="Open Settings Panel"
                  >
                    <SettingsIcon size={11} />
                  </button>
                </div>
              </div>

              {/* Stereo VU Meter */}
              <VUMeter leftLevel={vuLevels.left} rightLevel={vuLevels.right} />

              {/* Master Volume Knob */}
              <Knob
                label="VOLUME"
                value={params.masterVolume}
                min={0}
                max={1}
                step={0.01}
                defaultValue={0.75}
                size={56}
                displayValue={`${Math.round((params.masterVolume - 1) * 60)} DB`}
                sensitivity={settings.knobSensitivity}
                dragMode={settings.dragMode}
                doubleClickReset={settings.doubleClickReset}
                showNumericValues={settings.showNumericValues}
                tooltips={settings.tooltips}
                controlLighting={settings.controlLighting}
                accentLighting={settings.accentLighting}
                onChange={(v) => updateParam('masterVolume', v)}
              />

              {/* Power Toggle Switch */}
              <div className="pl-4 border-l border-[#c8b9a5]/20 flex items-center gap-4">
                <ToggleSwitch
                  label="POWER"
                  checked={isPowered}
                  ledColor="red"
                  onChange={(checked) => {
                    setIsPowered(checked);
                    if (!checked) engine.allNotesOff();
                  }}
                />
              </div>
            </div>
          </header>

          {/* Main Synth Controls Grid (Oscillator, Filter, Envelope/FX) */}
          <div className="grid grid-cols-12 gap-2.5 md:gap-3">
            {/* OSCILLATOR SECTION (5 Cols) */}
            <section className="col-span-5 bg-[#211f1d] rounded p-3 border border-white/5 shadow-inner flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between border-b border-[#c8b9a5]/20 pb-2">
                <h2 className="text-[14px] font-bold tracking-[0.7px] uppercase text-[#c8b9a5] engraved-text">
                  OSCILLATOR
                </h2>
                <button
                  type="button"
                  onClick={handleResetInit}
                  className="px-2.5 py-1 rounded bg-[#27272a] hover:bg-[#343438] border border-[#3f3f46] text-[#c8b9a5] text-[10px] font-bold tracking-[0.5px] uppercase flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <RotateCcw size={11} />
                  RESET / INIT
                </button>
              </div>

              {/* Waveform Selector & Oscilloscope Display */}
              <div className="flex items-center justify-between gap-4">
                {/* 2x2 Waveform Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {(['square', 'sine', 'triangle', 'sawtooth'] as WaveformType[]).map((wf) => {
                    const isSelected = params.waveform === wf;
                    const labels: Record<WaveformType, string> = {
                      square: 'SQR',
                      sine: 'SINE',
                      triangle: 'TRI',
                      sawtooth: 'SAW',
                    };

                    return (
                      <button
                        key={wf}
                        type="button"
                        onClick={() => updateParam('waveform', wf)}
                        className={`flex flex-col items-center justify-center p-2 rounded cursor-pointer transition-all ${
                          isSelected
                            ? settings.accentLighting === 'lime'
                              ? 'bg-[#b6d63c]/20 border border-[#b6d63c] led-lime-glow'
                              : settings.accentLighting === 'warm-white'
                              ? 'bg-[#f5ede0]/20 border border-[#f5ede0]'
                              : 'bg-[#e6a34a]/20 border border-[#e6a34a] lcd-amber-glow'
                            : 'bg-[#27272a] border border-[#3f3f46] opacity-60 hover:opacity-100'
                        }`}
                      >
                        <span className="text-[8px] font-bold tracking-[0.4px] text-[#c8b9a5]">
                          {labels[wf]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* CRT Oscilloscope Screen */}
                <div style={{ opacity: Math.max(0.3, settings.luminosity / 100) }}>
                  <Oscilloscope waveform={params.waveform} width={130} height={70} />
                </div>
              </div>

              {/* Tune, Mix, and Sub-Oscillator Knobs */}
              <div className="flex items-center justify-around pt-2 border-t border-white/5">
                <Knob
                  label="TUNE"
                  value={params.tune}
                  min={-1200}
                  max={1200}
                  step={10}
                  defaultValue={0}
                  displayValue={`${params.tune >= 0 ? '+' : ''}${params.tune} CT`}
                  sensitivity={settings.knobSensitivity}
                  dragMode={settings.dragMode}
                  doubleClickReset={settings.doubleClickReset}
                  showNumericValues={settings.showNumericValues}
                  tooltips={settings.tooltips}
                  controlLighting={settings.controlLighting}
                  accentLighting={settings.accentLighting}
                  onChange={(v) => updateParam('tune', v)}
                />
                <Knob
                  label="MIX"
                  value={params.oscMix}
                  min={0}
                  max={1}
                  step={0.01}
                  defaultValue={0.5}
                  displayValue={`${Math.round(params.oscMix * 100)}%`}
                  sensitivity={settings.knobSensitivity}
                  dragMode={settings.dragMode}
                  doubleClickReset={settings.doubleClickReset}
                  showNumericValues={settings.showNumericValues}
                  tooltips={settings.tooltips}
                  controlLighting={settings.controlLighting}
                  accentLighting={settings.accentLighting}
                  onChange={(v) => updateParam('oscMix', v)}
                />

                {/* Sub-Oscillator Controls */}
                <div className="flex flex-col items-center gap-1.5 p-1.5 rounded bg-black/30 border border-white/5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateParam('subOscEnabled', !params.subOscEnabled)}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all cursor-pointer ${
                        params.subOscEnabled
                          ? 'bg-[#b6d63c] text-black border border-[#b6d63c] led-lime-glow'
                          : 'bg-[#27272a] text-[#c8b9a5]/50 border border-[#3f3f46]'
                      }`}
                    >
                      SUB {params.subOscEnabled ? 'ON' : 'OFF'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateParam('subOscOctave', params.subOscOctave === -1 ? -2 : -1)}
                      className="px-1.5 py-0.5 rounded text-[8px] font-mono text-[#c8b9a5] bg-[#18181a] border border-[#333] hover:border-[#b6d63c]"
                    >
                      {params.subOscOctave === -1 ? '-1 OCT' : '-2 OCT'}
                    </button>
                  </div>
                  <Knob
                    label="SUB MIX"
                    value={params.subOscLevel}
                    min={0}
                    max={1}
                    step={0.01}
                    defaultValue={0.5}
                    size={42}
                    displayValue={`${Math.round(params.subOscLevel * 100)}%`}
                    sensitivity={settings.knobSensitivity}
                    dragMode={settings.dragMode}
                    doubleClickReset={settings.doubleClickReset}
                    showNumericValues={settings.showNumericValues}
                    tooltips={settings.tooltips}
                    controlLighting={settings.controlLighting}
                    accentLighting={settings.accentLighting}
                    onChange={(v) => updateParam('subOscLevel', v)}
                  />
                </div>
              </div>
            </section>

            {/* FILTER & LFO SECTION (3 Cols) */}
            <section className="col-span-3 bg-[#211f1d] rounded p-3 border border-white/5 shadow-inner flex flex-col justify-between gap-2.5">
              <div className="border-b border-[#c8b9a5]/20 pb-2 flex items-center justify-between">
                <h2 className="text-[14px] font-bold tracking-[0.7px] uppercase text-[#c8b9a5] engraved-text">
                  FILTER / LFO
                </h2>
                {/* LFO Destination Toggle */}
                <div className="flex items-center gap-1">
                  <span className="text-[8px] text-[#c8b9a5]/40 font-bold uppercase">DEST</span>
                  {(['none', 'cutoff', 'pitch'] as const).map((dest) => (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => updateParam('lfoTarget', dest)}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase cursor-pointer ${
                        params.lfoTarget === dest
                          ? 'bg-[#e6a34a] text-black border border-[#e6a34a]'
                          : 'bg-[#18181a] text-[#c8b9a5]/40 border border-[#333]'
                      }`}
                    >
                      {dest === 'none' ? 'OFF' : dest.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Cutoff & Resonance */}
              <div className="flex items-center justify-around py-1">
                <Knob
                  label="CUTOFF"
                  value={params.cutoff}
                  min={40}
                  max={16000}
                  step={20}
                  defaultValue={2400}
                  size={56}
                  displayValue={`${(params.cutoff / 1000).toFixed(1)} KHZ`}
                  sensitivity={settings.knobSensitivity}
                  dragMode={settings.dragMode}
                  doubleClickReset={settings.doubleClickReset}
                  showNumericValues={settings.showNumericValues}
                  tooltips={settings.tooltips}
                  controlLighting={settings.controlLighting}
                  accentLighting={settings.accentLighting}
                  onChange={(v) => updateParam('cutoff', v)}
                />
                <Knob
                  label="RESONANCE"
                  value={params.resonance}
                  min={0.1}
                  max={18}
                  step={0.1}
                  defaultValue={3.2}
                  size={56}
                  displayValue={`${params.resonance.toFixed(1)} Q`}
                  sensitivity={settings.knobSensitivity}
                  dragMode={settings.dragMode}
                  doubleClickReset={settings.doubleClickReset}
                  showNumericValues={settings.showNumericValues}
                  tooltips={settings.tooltips}
                  controlLighting={settings.controlLighting}
                  accentLighting={settings.accentLighting}
                  onChange={(v) => updateParam('resonance', v)}
                />
              </div>

              {/* LFO Rate & Depth */}
              <div className="flex items-center justify-around pt-2 border-t border-white/5 bg-black/20 p-2 rounded">
                <Knob
                  label="LFO RATE"
                  value={params.lfoRate}
                  min={0.1}
                  max={20}
                  step={0.1}
                  defaultValue={3.5}
                  size={42}
                  displayValue={`${params.lfoRate.toFixed(1)} HZ`}
                  sensitivity={settings.knobSensitivity}
                  dragMode={settings.dragMode}
                  doubleClickReset={settings.doubleClickReset}
                  showNumericValues={settings.showNumericValues}
                  tooltips={settings.tooltips}
                  controlLighting={settings.controlLighting}
                  accentLighting={settings.accentLighting}
                  onChange={(v) => updateParam('lfoRate', v)}
                />
                <Knob
                  label="LFO DEPTH"
                  value={params.lfoDepth}
                  min={0}
                  max={1}
                  step={0.01}
                  defaultValue={0}
                  size={42}
                  displayValue={`${Math.round(params.lfoDepth * 100)}%`}
                  sensitivity={settings.knobSensitivity}
                  dragMode={settings.dragMode}
                  doubleClickReset={settings.doubleClickReset}
                  showNumericValues={settings.showNumericValues}
                  tooltips={settings.tooltips}
                  controlLighting={settings.controlLighting}
                  accentLighting={settings.accentLighting}
                  onChange={(v) => updateParam('lfoDepth', v)}
                />
              </div>
            </section>

            {/* ENVELOPE (ADSR) & FX SECTION (4 Cols) */}
            <section className="col-span-4 bg-[#211f1d] rounded p-3 border border-white/5 shadow-inner flex flex-col justify-between gap-2.5">
              <div className="border-b border-[#c8b9a5]/20 pb-2 flex items-center justify-between">
                <h2 className="text-[14px] font-bold tracking-[0.7px] uppercase text-[#c8b9a5] engraved-text">
                  ENVELOPE / FX
                </h2>
                <div className="flex items-center gap-3">
                  <ToggleSwitch
                    label="REVERB"
                    checked={params.reverbEnabled}
                    ledColor="lime"
                    onChange={(checked) => updateParam('reverbEnabled', checked)}
                  />
                  <ToggleSwitch
                    label="DELAY"
                    checked={params.delayEnabled}
                    ledColor="amber"
                    onChange={(checked) => updateParam('delayEnabled', checked)}
                  />
                </div>
              </div>

              {/* 4 ADSR Faders */}
              <div className="h-28 flex items-center justify-between px-2">
                <Fader
                  label="A"
                  value={params.attack}
                  min={0.005}
                  max={2.5}
                  step={0.01}
                  sensitivity={settings.faderSensitivity}
                  showNumericValues={settings.showNumericValues}
                  tooltips={settings.tooltips}
                  controlLighting={settings.controlLighting}
                  accentLighting={settings.accentLighting}
                  onChange={(v) => updateParam('attack', v)}
                />
                <Fader
                  label="D"
                  value={params.decay}
                  min={0.01}
                  max={3.0}
                  step={0.01}
                  sensitivity={settings.faderSensitivity}
                  showNumericValues={settings.showNumericValues}
                  tooltips={settings.tooltips}
                  controlLighting={settings.controlLighting}
                  accentLighting={settings.accentLighting}
                  onChange={(v) => updateParam('decay', v)}
                />
                <Fader
                  label="S"
                  value={params.sustain}
                  min={0}
                  max={1}
                  step={0.01}
                  unit="%"
                  displayValue={`${Math.round(params.sustain * 100)}%`}
                  sensitivity={settings.faderSensitivity}
                  showNumericValues={settings.showNumericValues}
                  tooltips={settings.tooltips}
                  controlLighting={settings.controlLighting}
                  accentLighting={settings.accentLighting}
                  onChange={(v) => updateParam('sustain', v)}
                />
                <Fader
                  label="R"
                  value={params.release}
                  min={0.01}
                  max={4.0}
                  step={0.01}
                  sensitivity={settings.faderSensitivity}
                  showNumericValues={settings.showNumericValues}
                  tooltips={settings.tooltips}
                  controlLighting={settings.controlLighting}
                  accentLighting={settings.accentLighting}
                  onChange={(v) => updateParam('release', v)}
                />
              </div>
            </section>
          </div>

          {/* Sequencer Module */}
          <StepSequencer
            onStatusChange={(msg) => setStatusMessage(msg)}
            defaultBpm={settings.defaultSequencerTempo}
            patternLength={settings.patternLength}
            showPlaybackStep={settings.showPlaybackStep}
            accentLighting={settings.accentLighting}
          />

          {/* First-use Activation Banner */}
          {!isAudioStarted && (
            <div
              onClick={startAudioEngine}
              className="w-full py-1.5 px-3 rounded bg-[#e6a34a]/15 border border-[#e6a34a]/40 shadow-lg flex items-center justify-between cursor-pointer hover:bg-[#e6a34a]/25 transition-all text-[#e6a34a]"
            >
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="w-2 h-2 rounded-full bg-[#e6a34a] lcd-amber-glow animate-pulse" />
                <span>CLICK ANYWHERE OR PRESS A KEY TO ACTIVATE AUDIO ENGINE</span>
              </div>
              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#e6a34a]/20 border border-[#e6a34a]/40">
                ACTIVATE NOW
              </span>
            </div>
          )}

          {/* Tactile Piano Keyboard */}
          <PianoKeyboard
            onNoteOn={handleNoteOn}
            onNoteOff={handleNoteOff}
            activeNotes={activeNotes}
            baseOctave={settings.baseOctave}
            computerKeyboardEnabled={settings.computerKeyboardEnabled}
            keyLabels={settings.keyLabels}
            octaveMarkers={settings.octaveMarkers}
            velocityMode={settings.velocityMode}
            fixedVelocityValue={settings.fixedVelocityValue}
            accentLighting={settings.accentLighting}
          />

          {/* Computer Keyboard Hotkeys Guide */}
          <div className="flex items-center justify-center gap-1.5 text-[8.5px] font-mono text-[#c8b9a5]/50 flex-wrap py-0.5">
            <span className="font-bold text-[#c8b9a5]/70">KEYS:</span>
            <span>A=C3</span>
            <span>W=C#3</span>
            <span>S=D3</span>
            <span>E=D#3</span>
            <span>D=E3</span>
            <span>F=F3</span>
            <span>T=F#3</span>
            <span>G=G3</span>
            <span>Y=G#3</span>
            <span>H=A3</span>
            <span>U=A#3</span>
            <span>J=B3</span>
            <span>K=C4</span>
          </div>

          {/* Bottom Engraved Metadata & Serial Bar */}
          <footer className="pt-2 flex items-center justify-between text-[10px] font-mono text-[#c8b9a5]/40 border-t border-[#c8b9a5]/10">
            <span>MNFCTRD BY VINTAGE AUDIO CO.</span>
            <span>SERIAL NO: VAC-2024-001X</span>
          </footer>
        </div>
      </div>

      {/* Preset Browser Modal */}
      {isPresetBrowserOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded bg-[#1f1d1b] border-2 border-[#3f3f46] shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold tracking-wider text-[#c8b9a5] uppercase">
                PRESET SOUND BANKS ({presets.length})
              </h3>
              <button
                type="button"
                onClick={() => setIsPresetBrowserOpen(false)}
                className="text-[#c8b9a5]/60 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
              {(['ALL', 'Lead', 'Bass', 'Pad', 'Pluck', 'FX'] as const).map((cat) => {
                const count = cat === 'ALL' ? presets.length : presets.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPresetCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      presetCategoryFilter === cat
                        ? 'bg-[#e6a34a] text-black border border-[#e6a34a] font-black'
                        : 'bg-[#27272a] text-[#c8b9a5]/70 border border-[#3f3f46] hover:text-white'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="opacity-60 text-[9px]">({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="max-h-72 overflow-y-auto flex flex-col gap-2 pr-1">
              {(presetCategoryFilter === 'ALL'
                ? presets
                : presets.filter((p) => p.category === presetCategoryFilter)
              ).map((p, idx) => {
                const isSelected = p.id === currentPresetId;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPreset(p)}
                    className={`flex items-center justify-between p-2.5 rounded border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#b6d63c]/15 border-[#b6d63c] text-[#b6d63c]'
                        : 'bg-[#27272a] border-[#3f3f46] text-[#c8b9a5] hover:bg-[#323236]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs opacity-50">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="font-bold text-xs">{p.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-[#e6a34a] font-mono">
                        {p.category}
                      </span>
                      {p.isFactory && (
                        <span className="text-[8px] uppercase tracking-wider text-[#b6d63c]/70">
                          Factory
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleExportCurrentPreset(p, e)}
                        className="text-[#c8b9a5]/70 hover:text-white p-1"
                        title="Export Preset to JSON"
                      >
                        <Download size={13} />
                      </button>

                      {!p.isFactory && (
                        <button
                          type="button"
                          onClick={(e) => handleDeletePreset(p.id, e)}
                          className="text-[#d94b35] hover:text-red-400 p-1"
                          title="Delete Preset"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <input
                ref={presetFileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handlePresetFileSelected}
              />
              <button
                type="button"
                onClick={handleImportPresetClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#27272a] border border-[#3f3f46] text-[#c8b9a5] text-xs font-bold uppercase tracking-wider hover:bg-[#343438] cursor-pointer"
              >
                <Upload size={13} />
                <span>IMPORT PRESET</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPresetBrowserOpen(false)}
                className="px-4 py-1.5 rounded bg-[#3f3f46] text-[#c8b9a5] text-xs font-bold uppercase tracking-wider hover:bg-[#4a4a50] cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Preset Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCurrentPreset}
            className="w-full max-w-sm rounded bg-[#1f1d1b] border-2 border-[#3f3f46] shadow-2xl p-5 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold tracking-wider text-[#c8b9a5] uppercase">
                SAVE NEW PRESET
              </h3>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="text-[#c8b9a5]/60 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#c8b9a5] uppercase tracking-wider">
                Preset Name:
              </label>
              <input
                type="text"
                maxLength={24}
                autoFocus
                placeholder="MY CUSTOM LEAD"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="px-3 py-2 rounded bg-[#111] border border-[#3f3f46] text-[#e6a34a] font-mono text-sm focus:outline-none focus:border-[#b6d63c]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-3 py-1.5 rounded bg-[#27272a] text-[#c8b9a5] text-xs font-bold hover:bg-[#323236] cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={!newPresetName.trim()}
                className="px-4 py-1.5 rounded bg-[#b6d63c] text-black text-xs font-bold hover:bg-[#a5c234] disabled:opacity-40 cursor-pointer"
              >
                SAVE
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
    </div>
  );
}
