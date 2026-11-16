import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Volume2,
  Sliders,
  Sparkles,
  Music2,
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  Radio,
  Check,
} from 'lucide-react';
import {
  HardwareFinish,
  AccentLighting,
  PanelContrast,
  KnobSensitivity,
  DragMode,
  ShowNumericValues,
  FaderSensitivity,
  VelocityMode,
  KeyLabelsMode,
  PatternLength,
  SystemSettings,
  DEFAULT_SETTINGS,
} from '../types/settings';
import { engine, AudioStatusInfo } from '../audio/engine';
import {
  getStorageStats,
  StorageStats,
  restoreFactoryPresets,
  clearAnalogStudioStorage,
  loadSavedPattern,
  loadAllPresets,
} from '../audio/presets';
import {
  exportAllPresetsToFile,
  exportPatternToFile,
  importPresetsFromFile,
  importPatternFromFile,
} from '../audio/io';
import { Knob } from './Knob';
import { Fader } from './Fader';

// Re-export for compatibility
export type {
  HardwareFinish,
  AccentLighting,
  PanelContrast,
  KnobSensitivity,
  DragMode,
  ShowNumericValues,
  FaderSensitivity,
  VelocityMode,
  KeyLabelsMode,
  PatternLength,
  SystemSettings,
};
export { DEFAULT_SETTINGS };

interface SettingsScreenProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => void;
  onBackToEngine: () => void;
  onStorageCleared?: () => void;
  onPresetsChanged?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onBackToEngine,
  onStorageCleared,
  onPresetsChanged,
}) => {
  const [activeNav, setActiveNav] = useState<number>(1);
  const [proxyKnobVal, setProxyKnobVal] = useState<number>(50);
  const [testFaderVal, setTestFaderVal] = useState<number>(0.75);

  // Audio status state
  const [audioStatus, setAudioStatus] = useState<AudioStatusInfo>(() => engine.getAudioStatus());
  const [midiDevicesList, setMidiDevicesList] = useState<string[]>([]);
  const [isAudioRefreshing, setIsAudioRefreshing] = useState<boolean>(false);

  // Storage state
  const [storageStats, setStorageStats] = useState<StorageStats>(() => getStorageStats());
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<string>('');

  const presetFileInputRef = useRef<HTMLInputElement>(null);
  const patternFileInputRef = useRef<HTMLInputElement>(null);

  // Poll audio status and MIDI devices
  useEffect(() => {
    const updateAudioTelemetry = () => {
      setAudioStatus(engine.getAudioStatus());
    };
    updateAudioTelemetry();
    const interval = setInterval(updateAudioTelemetry, 1000);

    // Query real MIDI devices safely
    if (typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator) {
      navigator.requestMIDIAccess?.()
        .then((access) => {
          const names: string[] = [];
          access.inputs.forEach((input) => {
            if (input.name) names.push(input.name);
          });
          setMidiDevicesList(names);
        })
        .catch(() => {
          setMidiDevicesList([]);
        });
    }

    return () => clearInterval(interval);
  }, []);

  const refreshStorageStats = () => {
    setStorageStats(getStorageStats());
  };

  const handleResumeAudio = async () => {
    setIsAudioRefreshing(true);
    await engine.resume();
    setAudioStatus(engine.getAudioStatus());
    setIsAudioRefreshing(false);
    setStatusFeedback('AUDIO CONTEXT RESUMED');
  };

  const handleResetAudioChain = () => {
    engine.resetAudioChain();
    setAudioStatus(engine.getAudioStatus());
    setStatusFeedback('AUDIO CHAIN RESET & CLEARED');
  };

  const handleExportAllPresets = () => {
    exportAllPresetsToFile(loadAllPresets());
    setStatusFeedback('PRESETS BACKUP DOWNLOADED');
  };

  const handleExportPattern = () => {
    exportPatternToFile(loadSavedPattern());
    setStatusFeedback('SEQUENCER PATTERN DOWNLOADED');
  };

  const handlePresetImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importPresetsFromFile(file);
      refreshStorageStats();
      if (onPresetsChanged) onPresetsChanged();
      setStatusFeedback(`IMPORTED ${imported.length} PRESET(S)`);
    } catch (err) {
      setStatusFeedback('ERROR: INVALID PRESET JSON SCHEMA');
    }
    e.target.value = '';
  };

  const handlePatternImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importPatternFromFile(file);
      refreshStorageStats();
      setStatusFeedback('SEQUENCER PATTERN RESTORED');
    } catch {
      setStatusFeedback('ERROR: INVALID PATTERN JSON SCHEMA');
    }
    e.target.value = '';
  };

  const handleRestoreFactories = () => {
    restoreFactoryPresets();
    refreshStorageStats();
    if (onPresetsChanged) onPresetsChanged();
    setStatusFeedback('FACTORY PRESETS RESTORED');
  };

  const handleConfirmClearStorage = () => {
    clearAnalogStudioStorage();
    onUpdateSettings(DEFAULT_SETTINGS);
    refreshStorageStats();
    setIsClearModalOpen(false);
    if (onStorageCleared) onStorageCleared();
    setStatusFeedback('APPLICATION STORAGE SAFELY PURGED');
  };

  const navItems = [
    { id: 1, num: '01', title: 'Instrument', desc: 'Appearance & Skin', icon: Sparkles },
    { id: 2, num: '02', title: 'Controls', desc: 'Knob & Touch Logic', icon: Sliders },
    { id: 3, num: '03', title: 'Audio', desc: 'Sample Rates & Engine', icon: Volume2 },
    { id: 4, num: '04', title: 'Performance', desc: 'Mapping & Velocity', icon: Music2 },
    { id: 5, num: '05', title: 'Storage', desc: 'Presets & Library', icon: HardDrive },
  ];

  const getAccentColorCode = () => {
    if (settings.accentLighting === 'lime') return '#b6d63c';
    if (settings.accentLighting === 'warm-white') return '#f5ede0';
    return '#e6a34a';
  };

  const getAccentLed = () => {
    if (settings.accentLighting === 'lime') return 'bg-[#b6d63c] led-lime-glow';
    if (settings.accentLighting === 'warm-white') return 'bg-[#f5ede0] shadow-[0_0_8px_rgba(245,237,224,0.7)]';
    return 'bg-[#e6a34a] lcd-amber-glow';
  };

    const pageBgClass =
      settings.finish === 'black-ash'
        ? 'bg-[#151413]'
        : settings.finish === 'silver'
        ? 'bg-[#6b6967]'
        : 'walnut-grain';

  return (
    <div className={`flex justify-center items-center p-3 md:p-6 min-h-screen ${pageBgClass} select-none relative`}>
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={presetFileInputRef}
        onChange={handlePresetImportFile}
        accept=".json"
        className="hidden"
      />
      <input
        type="file"
        ref={patternFileInputRef}
        onChange={handlePatternImportFile}
        accept=".json"
        className="hidden"
      />

      {/* Confirmation Modal for Clearing Storage */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded border-2 border-[#d94b35] bg-[#1c1a19] p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center gap-3 text-[#d94b35]">
              <AlertTriangle size={24} />
              <h3 className="text-base font-black tracking-widest uppercase">
                PURGE APPLICATION STORAGE
              </h3>
            </div>

            <p className="text-xs text-[#c8b9a5]/80 leading-relaxed">
              This action will permanently delete all custom user presets, custom sequencer patterns,
              and reset your hardware preferences to default.
            </p>
            <p className="text-[11px] font-mono text-[#e6a34a] p-2.5 rounded bg-black/50 border border-white/10">
              SAFETY GUARANTEE: Only keys prefixed with <span className="text-white font-bold">analog_studio_*</span> are cleared. Other applications and domain storage remain completely untouched.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 rounded border border-[#52525b] bg-[#27272a] text-xs font-bold uppercase text-[#c8b9a5] hover:bg-[#323236] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearStorage}
                className="px-4 py-2 rounded border border-[#d94b35] bg-[#d94b35] text-xs font-bold uppercase text-white hover:bg-[#c23e2a] cursor-pointer shadow-lg"
              >
                Confirm Storage Purge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outer Chassis */}
      <div
        className={`relative w-full max-w-[1440px] rounded-lg border-b-8 shadow-2xl overflow-hidden p-2 md:p-4 transition-all duration-300 ${
          settings.finish === 'black-ash'
            ? 'bg-[#151413] border-[#100f0e]'
            : settings.finish === 'silver'
            ? 'bg-[#6b6967] border-[#403e3c]'
            : 'walnut-grain border-[#2b1a13]'
        }`}
      >
        {/* Side Cheeks */}
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
          className={`relative mx-4 md:mx-6 my-2 rounded border-4 brushed-faceplate chassis-bevel p-4 md:p-8 flex flex-col gap-6 transition-colors duration-200 ${
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
          <header className="flex flex-wrap items-center justify-between pb-6 border-b border-[#c8b9a5]/10 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-[-1.5px] uppercase text-[#c8b9a5] engraved-text leading-tight">
                VINTAGE SYNTH 2.0
              </h1>
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[10px] font-bold tracking-[2px] uppercase text-[#c8b9a5]/40 engraved-text">
                  SETTINGS PANEL
                </span>
                <span className={`w-2 h-2 rounded-full ${getAccentLed()} animate-pulse`} />
                {statusFeedback && (
                  <span className="text-[10px] font-mono text-[#b6d63c] animate-fade-in uppercase">
                    [{statusFeedback}]
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Config Mode LCD Display */}
              <div
                className="w-48 h-12 rounded-[2px] border border-[#333] bg-[#111] p-2 flex flex-col justify-between shadow-inner transition-opacity"
                style={{ opacity: Math.max(0.4, settings.luminosity / 100) }}
              >
                <div
                  className="flex items-baseline justify-between"
                  style={{ color: getAccentColorCode() }}
                >
                  <span className="font-mono text-xs font-bold tracking-widest uppercase">
                    CONFIG MODE
                  </span>
                  <span className="font-mono text-[10px] opacity-70">S-00{activeNav}</span>
                </div>
                <div
                  className="font-mono text-[8px] uppercase tracking-tight opacity-75 truncate"
                  style={{ color: getAccentColorCode() }}
                >
                  {navItems.find((n) => n.id === activeNav)?.desc}
                </div>
              </div>

              {/* Machined Circular "BACK TO ENGINE" Button */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={onBackToEngine}
                  className="w-14 h-14 rounded-full border border-[#3f3f46] bg-[#211f1d] flex items-center justify-center cursor-pointer shadow-[0_1px_0_rgba(255,255,255,0.05)] hover:scale-105 active:scale-95 transition-transform"
                >
                  <div className="w-11 h-11 rounded-full border border-[#71717a] machined-knob flex items-center justify-center shadow-[0_4px_4px_rgba(0,0,0,0.6)]">
                    <ArrowLeft size={16} className="text-[#eee]" />
                  </div>
                </button>
                <span className="mt-1.5 text-[9px] font-bold tracking-[0.9px] uppercase text-[#c8b9a5] engraved-text">
                  BACK TO ENGINE
                </span>
              </div>
            </div>
          </header>

          {/* Body Section: Left Navigation + Main Content Area */}
          <div className="flex flex-row gap-8 min-h-[500px]">
            {/* Left Navigation Sidebar */}
            <aside className="w-64 flex flex-col justify-between shrink-0">
              <div className="flex flex-col gap-1.5">
                <div className="px-2 pb-3 text-[11px] font-bold tracking-[1.1px] uppercase text-[#c8b9a5]/50 engraved-text">
                  Navigation System
                </div>

                {navItems.map((item) => {
                  const isActive = activeNav === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveNav(item.id)}
                      className={`h-16 px-4 flex items-center justify-between text-left transition-all border-l-4 cursor-pointer ${
                        isActive
                          ? 'border-[#b6d63c] bg-[#211f1d] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]'
                          : 'border-transparent bg-black/40 hover:bg-black/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={16} className={isActive ? 'text-[#b6d63c]' : 'text-[#c8b9a5]/50'} />
                        <div className="flex flex-col">
                          <span
                            className={`text-xs font-bold tracking-wider uppercase ${
                              isActive ? 'text-[#b6d63c]' : 'text-[#c8b9a5]'
                            }`}
                          >
                            {item.num}. {item.title}
                          </span>
                          <span className="text-[9px] font-bold tracking-wider uppercase text-[#c8b9a5]/40 truncate max-w-[130px]">
                            {item.desc}
                          </span>
                        </div>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-[#b6d63c] led-lime-glow shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Hardware Revision & ID */}
              <div className="pt-6 border-t border-[#c8b9a5]/10 px-2 flex flex-col gap-1 text-[11px] font-bold font-mono tracking-wider text-[#c8b9a5]/50">
                <span>FIRMWARE V2.0.4</span>
                <span>ID: VAC-ALPHA-X7</span>
                <span className="text-[9px] text-[#b6d63c]/70">ALL SYSTEMS ONLINE</span>
              </div>
            </aside>

            {/* Right Main Settings Panel (Tabs 1 through 5) */}
            <main className="flex-1 rounded border border-white/5 bg-[#211f1d] p-6 shadow-inner flex flex-col justify-between gap-6 overflow-hidden">
              {/* TAB 1: INSTRUMENT (APPEARANCE & FINISH) */}
              {activeNav === 1 && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-4 border-b border-[#e6a34a]/20 pb-3">
                    <h2 className="text-lg font-bold tracking-widest uppercase text-[#e6a34a] lcd-amber-glow">
                      01. INSTRUMENT FINISH & LIGHTING
                    </h2>
                    <div className="flex-1 h-px bg-[#e6a34a]/20" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Finishes & Sliders */}
                    <div className="flex flex-col gap-6">
                      {/* Hardware Finish Selector */}
                      <div className="flex flex-col gap-3">
                        <span className="text-[11px] font-bold tracking-wider uppercase text-[#c8b9a5]/60 engraved-text">
                          HARDWARE FINISH
                        </span>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => onUpdateSettings({ finish: 'walnut' })}
                            className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${
                              settings.finish === 'walnut' ? 'scale-105' : 'opacity-60 hover:opacity-90'
                            }`}
                          >
                            <div
                              className={`w-20 h-24 rounded border-2 walnut-grain relative transition-all ${
                                settings.finish === 'walnut'
                                  ? 'border-[#b6d63c] shadow-[0_0_8px_rgba(182,214,60,0.5)]'
                                  : 'border-[#333]'
                              }`}
                            />
                            <span
                              className={`text-[10px] font-bold tracking-wider uppercase ${
                                settings.finish === 'walnut' ? 'text-[#b6d63c]' : 'text-[#c8b9a5]'
                              }`}
                            >
                              WALNUT
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onUpdateSettings({ finish: 'black-ash' })}
                            className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${
                              settings.finish === 'black-ash' ? 'scale-105' : 'opacity-60 hover:opacity-90'
                            }`}
                          >
                            <div
                              className={`w-20 h-24 rounded border bg-[#151413] relative transition-all ${
                                settings.finish === 'black-ash'
                                  ? 'border-[#b6d63c] shadow-[0_0_8px_rgba(182,214,60,0.5)]'
                                  : 'border-[#333]'
                              }`}
                            />
                            <span
                              className={`text-[10px] font-bold tracking-wider uppercase ${
                                settings.finish === 'black-ash' ? 'text-[#b6d63c]' : 'text-[#c8b9a5]'
                              }`}
                            >
                              BLACK ASH
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onUpdateSettings({ finish: 'silver' })}
                            className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${
                              settings.finish === 'silver' ? 'scale-105' : 'opacity-60 hover:opacity-90'
                            }`}
                          >
                            <div
                              className={`w-20 h-24 rounded border bg-[#6a6866] relative transition-all ${
                                settings.finish === 'silver'
                                  ? 'border-[#b6d63c] shadow-[0_0_8px_rgba(182,214,60,0.5)]'
                                  : 'border-[#333]'
                              }`}
                            />
                            <span
                              className={`text-[10px] font-bold tracking-wider uppercase ${
                                settings.finish === 'silver' ? 'text-[#b6d63c]' : 'text-[#c8b9a5]'
                              }`}
                            >
                              SILVER
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Accent Lighting Palette */}
                      <div className="flex flex-col gap-3">
                        <span className="text-[11px] font-bold tracking-wider uppercase text-[#c8b9a5]/60 engraved-text">
                          ACCENT LIGHTING
                        </span>
                        <div className="flex items-center gap-3">
                          {(['amber', 'lime', 'warm-white'] as AccentLighting[]).map((acc) => {
                            const isSelected = settings.accentLighting === acc;
                            const label = acc === 'warm-white' ? 'WARM WHITE' : acc.toUpperCase();
                            return (
                              <button
                                key={acc}
                                type="button"
                                onClick={() => onUpdateSettings({ accentLighting: acc })}
                                className={`px-4 py-2 rounded border text-[10px] font-bold tracking-wider uppercase cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-[#e6a34a]/20 border-[#e6a34a] text-[#e6a34a] lcd-amber-glow'
                                    : 'bg-[#111] border-[#3f3f46] text-[#c8b9a5] opacity-50 hover:opacity-80'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Display Luminosity Slider */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 flex flex-col gap-2">
                          <span className="text-[10px] font-bold tracking-wider uppercase text-[#c8b9a5]/60 engraved-text">
                            Display Luminosity
                          </span>
                          <input
                            type="range"
                            min={20}
                            max={100}
                            value={settings.luminosity}
                            onChange={(e) => onUpdateSettings({ luminosity: Number(e.target.value) })}
                            className="w-full accent-[#e6a34a] cursor-pointer"
                          />
                        </div>
                        <div className="w-20 h-10 rounded border border-[#333] bg-[#111] flex items-center justify-center font-mono text-lg text-[#e6a34a] lcd-amber-glow">
                          {settings.luminosity}%
                        </div>
                      </div>

                      {/* Panel Contrast Selector */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 flex flex-col gap-2">
                          <span className="text-[10px] font-bold tracking-wider uppercase text-[#c8b9a5]/60 engraved-text">
                            Panel Contrast
                          </span>
                          <div className="flex items-center gap-1">
                            {(['low', 'mid', 'high'] as PanelContrast[]).map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => onUpdateSettings({ contrast: c })}
                                className={`flex-1 h-8 rounded border text-[9px] font-bold tracking-wider uppercase cursor-pointer transition-all ${
                                  settings.contrast === c
                                    ? 'bg-[#333] border-[#e6a34a] text-[#e6a34a]'
                                    : 'bg-[#111] border-[#333] text-[#c8b9a5] opacity-50'
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="w-20 h-10 rounded border border-[#333] bg-[#111] flex items-center justify-center font-mono text-base text-[#e6a34a] lcd-amber-glow">
                          {settings.contrast === 'low' ? 'O-01' : settings.contrast === 'mid' ? 'O-02' : 'O-03'}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Control Lighting & Live Proxy */}
                    <div className="flex flex-col gap-6">
                      {/* Control Lighting Toggle */}
                      <div className="p-4 rounded border border-white/5 bg-black/30 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold tracking-wider uppercase text-[#c8b9a5] engraved-text">
                            CONTROL ILLUMINATION
                          </span>
                          <span className="text-[9px] font-bold tracking-wider uppercase text-[#c8b9a5]/40">
                            SUBTLE BACKLIGHT HALO FOR ROTARY & FADERS
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onUpdateSettings({ controlLighting: !settings.controlLighting })}
                          className="flex flex-col items-center gap-1 cursor-pointer"
                        >
                          <div className="w-8 h-12 rounded bg-black p-1 flex flex-col justify-between">
                            <div
                              className={`w-full h-5 rounded transition-all ${
                                settings.controlLighting
                                  ? 'bg-[#b6d63c] led-lime-glow translate-y-0'
                                  : 'bg-[#27272a] translate-y-5'
                              }`}
                            />
                          </div>
                          <span className="text-[8px] font-bold tracking-wider text-[#b6d63c] uppercase">
                            {settings.controlLighting ? 'ENABLED' : 'OFF'}
                          </span>
                        </button>
                      </div>

                      {/* Live Interface Proxy Card */}
                      <div className="rounded border border-black bg-[#34312f] p-6 shadow-2xl relative flex flex-col items-center gap-6">
                        <span className="absolute top-2 right-2 text-[8px] font-bold italic tracking-wider text-[#c8b9a5]/30 uppercase">
                          Live Interface Proxy
                        </span>

                        <div className="flex items-center gap-8 pt-4">
                          <div className="flex flex-col items-center gap-2">
                            <div
                              className="w-16 h-16 rounded-full border-2 border-[#a1a1aa] machined-knob relative shadow-lg cursor-pointer"
                              style={{
                                boxShadow: settings.controlLighting
                                  ? `0 0 12px ${getAccentColorCode()}60`
                                  : 'none',
                              }}
                            >
                              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-5 bg-[#eee] rounded-full" />
                            </div>
                            <span className="text-[9px] font-bold tracking-wider text-[#c8b9a5]/70 uppercase">
                              SAMPLE CTRL
                            </span>
                          </div>

                          <div
                            className="w-28 h-24 rounded border border-[#333] bg-[#111] p-3 flex flex-col justify-between"
                            style={{ opacity: Math.max(0.3, settings.luminosity / 100) }}
                          >
                            <div className="w-full h-1 bg-[#e6a34a] opacity-30 rounded" />
                            <div className="w-16 h-1 bg-[#e6a34a] opacity-40 rounded" />
                            <div className="w-full h-1 bg-[#e6a34a] opacity-60 rounded" />
                            <div className="flex items-center justify-between pt-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getAccentColorCode() }}
                              />
                              <div className="w-2 h-2 rounded-full bg-[#b6d63c] led-lime-glow" />
                            </div>
                          </div>
                        </div>

                        {/* Response Preview Slider */}
                        <div className="w-full px-6 flex flex-col items-center gap-1.5">
                          <div className="w-full h-2 rounded-full bg-[#111] relative">
                            <div
                              className="absolute -top-1 w-6 h-4 rounded bg-gradient-to-r from-[#444] via-[#666] to-[#444] border border-[#222]"
                              style={{ left: `${proxyKnobVal}%` }}
                            />
                          </div>
                          <span className="text-[8px] font-bold tracking-wider text-[#c8b9a5]/40 uppercase">
                            RESPONSE PREVIEW
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTROLS (KNOB & TOUCH LOGIC) */}
              {activeNav === 2 && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-4 border-b border-[#e6a34a]/20 pb-3">
                    <h2 className="text-lg font-bold tracking-widest uppercase text-[#e6a34a] lcd-amber-glow">
                      02. CONTROLS — ROTARY & FADER LOGIC
                    </h2>
                    <div className="flex-1 h-px bg-[#e6a34a]/20" />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    {/* Preferences Form */}
                    <div className="flex flex-col gap-5">
                      {/* Knob Sensitivity */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold tracking-wider uppercase text-[#c8b9a5]/60 engraved-text">
                          Knob Rotary Sensitivity
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {(['coarse', 'normal', 'fine'] as KnobSensitivity[]).map((sens) => (
                            <button
                              key={sens}
                              type="button"
                              onClick={() => onUpdateSettings({ knobSensitivity: sens })}
                              className={`py-2 px-3 rounded border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                settings.knobSensitivity === sens
                                  ? 'bg-[#333] border-[#e6a34a] text-[#e6a34a] lcd-amber-glow'
                                  : 'bg-[#111] border-[#333] text-[#c8b9a5]/60 hover:text-[#c8b9a5]'
                              }`}
                            >
                              {sens} {sens === 'coarse' ? '(75px)' : sens === 'fine' ? '(300px)' : '(150px)'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Drag Mode */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold tracking-wider uppercase text-[#c8b9a5]/60 engraved-text">
                          Rotary Drag Mode
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => onUpdateSettings({ dragMode: 'vertical' })}
                            className={`py-2 px-3 rounded border text-[10px] font-bold uppercase cursor-pointer transition-all ${
                              settings.dragMode === 'vertical'
                                ? 'bg-[#333] border-[#e6a34a] text-[#e6a34a] lcd-amber-glow'
                                : 'bg-[#111] border-[#333] text-[#c8b9a5]/60 hover:text-[#c8b9a5]'
                            }`}
                          >
                            VERTICAL DRAG (Linear)
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateSettings({ dragMode: 'circular' })}
                            className={`py-2 px-3 rounded border text-[10px] font-bold uppercase cursor-pointer transition-all ${
                              settings.dragMode === 'circular'
                                ? 'bg-[#333] border-[#e6a34a] text-[#e6a34a] lcd-amber-glow'
                                : 'bg-[#111] border-[#333] text-[#c8b9a5]/60 hover:text-[#c8b9a5]'
                            }`}
                          >
                            CIRCULAR DRAG (Rotary)
                          </button>
                        </div>
                      </div>

                      {/* Double-Click Reset & Tooltips */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3 rounded border border-white/5 bg-black/30 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase text-[#c8b9a5]">
                              Double-Click Reset
                            </span>
                            <span className="text-[8px] text-[#c8b9a5]/40 uppercase">
                              Reset knobs to init
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onUpdateSettings({ doubleClickReset: !settings.doubleClickReset })}
                            className={`px-3 py-1 rounded text-[9px] font-bold uppercase border cursor-pointer ${
                              settings.doubleClickReset
                                ? 'bg-[#b6d63c] text-black border-[#b6d63c]'
                                : 'bg-[#27272a] text-[#c8b9a5] border-[#3f3f46]'
                            }`}
                          >
                            {settings.doubleClickReset ? 'ON' : 'OFF'}
                          </button>
                        </div>

                        <div className="p-3 rounded border border-white/5 bg-black/30 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase text-[#c8b9a5]">
                              Parameter Tooltips
                            </span>
                            <span className="text-[8px] text-[#c8b9a5]/40 uppercase">
                              Show hover titles
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onUpdateSettings({ tooltips: !settings.tooltips })}
                            className={`px-3 py-1 rounded text-[9px] font-bold uppercase border cursor-pointer ${
                              settings.tooltips
                                ? 'bg-[#b6d63c] text-black border-[#b6d63c]'
                                : 'bg-[#27272a] text-[#c8b9a5] border-[#3f3f46]'
                            }`}
                          >
                            {settings.tooltips ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      </div>

                      {/* Numeric Values Display */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold tracking-wider uppercase text-[#c8b9a5]/60 engraved-text">
                          Numeric Value Readout Display
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => onUpdateSettings({ showNumericValues: 'always' })}
                            className={`py-2 px-3 rounded border text-[10px] font-bold uppercase cursor-pointer transition-all ${
                              settings.showNumericValues === 'always'
                                ? 'bg-[#333] border-[#e6a34a] text-[#e6a34a] lcd-amber-glow'
                                : 'bg-[#111] border-[#333] text-[#c8b9a5]/60 hover:text-[#c8b9a5]'
                            }`}
                          >
                            ALWAYS VISIBLE
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateSettings({ showNumericValues: 'hover' })}
                            className={`py-2 px-3 rounded border text-[10px] font-bold uppercase cursor-pointer transition-all ${
                              settings.showNumericValues === 'hover'
                                ? 'bg-[#333] border-[#e6a34a] text-[#e6a34a] lcd-amber-glow'
                                : 'bg-[#111] border-[#333] text-[#c8b9a5]/60 hover:text-[#c8b9a5]'
                            }`}
                          >
                            HOVER / FOCUS ONLY
                          </button>
                        </div>
                      </div>

                      {/* Fader Sensitivity */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold tracking-wider uppercase text-[#c8b9a5]/60 engraved-text">
                          Fader Slide Sensitivity
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {(['coarse', 'normal', 'fine'] as FaderSensitivity[]).map((sens) => (
                            <button
                              key={sens}
                              type="button"
                              onClick={() => onUpdateSettings({ faderSensitivity: sens })}
                              className={`py-2 px-3 rounded border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                settings.faderSensitivity === sens
                                  ? 'bg-[#333] border-[#e6a34a] text-[#e6a34a] lcd-amber-glow'
                                  : 'bg-[#111] border-[#333] text-[#c8b9a5]/60 hover:text-[#c8b9a5]'
                              }`}
                            >
                              {sens}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Live Interactive Test Bench */}
                    <div className="rounded border border-black bg-[#282624] p-6 shadow-2xl flex flex-col justify-between gap-6">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-[10px] font-mono tracking-widest text-[#e6a34a] uppercase">
                          LIVE TEST BENCH
                        </span>
                        <span className="text-[9px] font-mono text-[#c8b9a5]/40">
                          DRAG OR DOUBLE-CLICK TO TEST PREFERENCES
                        </span>
                      </div>

                      <div className="flex items-center justify-around py-6">
                        {/* Test Knob */}
                        <div className="flex flex-col items-center gap-2">
                          <Knob
                            label="TEST ROTARY"
                            value={proxyKnobVal}
                            min={0}
                            max={100}
                            defaultValue={50}
                            size={64}
                            unit="%"
                            sensitivity={settings.knobSensitivity}
                            dragMode={settings.dragMode}
                            doubleClickReset={settings.doubleClickReset}
                            showNumericValues={settings.showNumericValues}
                            tooltips={settings.tooltips}
                            controlLighting={settings.controlLighting}
                            accentLighting={settings.accentLighting}
                            onChange={(val) => setProxyKnobVal(val)}
                          />
                        </div>

                        {/* Test Fader */}
                        <div className="h-44 flex flex-col items-center">
                          <Fader
                            label="TEST FADER"
                            value={testFaderVal}
                            min={0}
                            max={1}
                            unit=""
                            sensitivity={settings.faderSensitivity}
                            showNumericValues={settings.showNumericValues}
                            tooltips={settings.tooltips}
                            controlLighting={settings.controlLighting}
                            accentLighting={settings.accentLighting}
                            onChange={(val) => setTestFaderVal(val)}
                          />
                        </div>
                      </div>

                      <div className="p-3 rounded bg-black/40 border border-white/5 text-[9px] font-mono text-[#c8b9a5]/70 flex flex-col gap-1">
                        <span>• CURRENT KNOB MODE: {settings.dragMode.toUpperCase()} ({settings.knobSensitivity.toUpperCase()})</span>
                        <span>• RESET ON DOUBLE CLICK: {settings.doubleClickReset ? 'ENABLED (50% DEF)' : 'DISABLED'}</span>
                        <span>• READOUT VISIBILITY: {settings.showNumericValues.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: AUDIO (ENGINE & SAMPLE RATES) */}
              {activeNav === 3 && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-4 border-b border-[#e6a34a]/20 pb-3">
                    <h2 className="text-lg font-bold tracking-widest uppercase text-[#e6a34a] lcd-amber-glow">
                      03. AUDIO CONFIGURATION & LIVE TELEMETRY
                    </h2>
                    <div className="flex-1 h-px bg-[#e6a34a]/20" />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    {/* Audio Controls */}
                    <div className="flex flex-col gap-6">
                      {/* Master Volume Preference */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 flex flex-col gap-2">
                          <span className="text-[10px] font-bold tracking-wider uppercase text-[#c8b9a5]/60 engraved-text">
                            Master Gain Preference
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={settings.masterVolumePreference}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              onUpdateSettings({ masterVolumePreference: val });
                              engine.setParams({ masterVolume: val });
                            }}
                            className="w-full accent-[#e6a34a] cursor-pointer"
                          />
                        </div>
                        <div className="w-20 h-10 rounded border border-[#333] bg-[#111] flex items-center justify-center font-mono text-base text-[#e6a34a] lcd-amber-glow">
                          {Math.round(settings.masterVolumePreference * 100)}%
                        </div>
                      </div>

                      {/* Velocity Mode */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold tracking-wider uppercase text-[#c8b9a5]/60 engraved-text">
                          Keyboard Velocity Response
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => onUpdateSettings({ velocityMode: 'dynamic' })}
                            className={`py-2 px-3 rounded border text-[10px] font-bold uppercase cursor-pointer transition-all ${
                              settings.velocityMode === 'dynamic'
                                ? 'bg-[#333] border-[#e6a34a] text-[#e6a34a] lcd-amber-glow'
                                : 'bg-[#111] border-[#333] text-[#c8b9a5]/60 hover:text-[#c8b9a5]'
                            }`}
                          >
                            DYNAMIC (Touch Position / MIDI)
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateSettings({ velocityMode: 'fixed' })}
                            className={`py-2 px-3 rounded border text-[10px] font-bold uppercase cursor-pointer transition-all ${
                              settings.velocityMode === 'fixed'
                                ? 'bg-[#333] border-[#e6a34a] text-[#e6a34a] lcd-amber-glow'
                                : 'bg-[#111] border-[#333] text-[#c8b9a5]/60 hover:text-[#c8b9a5]'
                            }`}
                          >
                            FIXED VELOCITY
                          </button>
                        </div>
                      </div>

                      {/* Fixed Velocity Value Slider (if fixed) */}
                      {settings.velocityMode === 'fixed' && (
                        <div className="flex items-center gap-4 p-3 rounded bg-black/30 border border-white/5">
                          <div className="flex-1 flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase text-[#c8b9a5]/70">
                              Fixed Velocity Value (1–127)
                            </span>
                            <input
                              type="range"
                              min={1}
                              max={127}
                              value={settings.fixedVelocityValue}
                              onChange={(e) => onUpdateSettings({ fixedVelocityValue: Number(e.target.value) })}
                              className="w-full accent-[#b6d63c] cursor-pointer"
                            />
                          </div>
                          <div className="w-16 h-8 rounded border border-[#333] bg-[#111] flex items-center justify-center font-mono text-sm text-[#b6d63c]">
                            {settings.fixedVelocityValue}
                          </div>
                        </div>
                      )}

                      {/* Engine Recovery Action Buttons */}
                      <div className="flex flex-col gap-3 pt-2">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-[#c8b9a5]/60 engraved-text">
                          Audio Recovery & Diagnostics
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleResumeAudio}
                            disabled={isAudioRefreshing}
                            className="flex-1 py-2.5 px-4 rounded border border-[#52525b] bg-[#27272a] text-xs font-bold uppercase text-[#c8b9a5] hover:bg-[#343438] cursor-pointer flex items-center justify-center gap-2 transition-colors"
                          >
                            <RefreshCw size={14} className={isAudioRefreshing ? 'animate-spin' : ''} />
                            Resume / Unlock Context
                          </button>

                          <button
                            type="button"
                            onClick={handleResetAudioChain}
                            className="flex-1 py-2.5 px-4 rounded border border-[#71717a] bg-[#211f1d] text-xs font-bold uppercase text-[#c8b9a5] hover:bg-[#2d2a28] cursor-pointer flex items-center justify-center gap-2 transition-colors"
                          >
                            <RotateCcw size={14} />
                            Reset Audio Chain
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Real Audio Status Telemetry */}
                    <div className="rounded border border-black bg-[#161514] p-5 shadow-2xl flex flex-col justify-between gap-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-[11px] font-mono tracking-widest text-[#e6a34a] uppercase">
                          ACCURATE HARDWARE READOUT
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              audioStatus.state === 'running'
                                ? 'bg-[#b6d63c] led-lime-glow animate-pulse'
                                : 'bg-[#e6a34a]'
                            }`}
                          />
                          <span className="text-[10px] font-mono font-bold uppercase text-[#c8b9a5]">
                            {audioStatus.state}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                        <div className="p-2.5 rounded bg-black/60 border border-white/5 flex flex-col justify-between">
                          <span className="text-[9px] text-[#c8b9a5]/50 uppercase">SAMPLE RATE</span>
                          <span className="text-[#e6a34a] font-bold text-sm">
                            {audioStatus.sampleRate ? `${audioStatus.sampleRate} HZ` : 'UNINITIALIZED'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded bg-black/60 border border-white/5 flex flex-col justify-between">
                          <span className="text-[9px] text-[#c8b9a5]/50 uppercase">ACTIVE VOICES</span>
                          <span className="text-[#b6d63c] font-bold text-sm">
                            {audioStatus.activeVoicesCount} VOICES
                          </span>
                        </div>

                        <div className="p-2.5 rounded bg-black/60 border border-white/5 flex flex-col justify-between">
                          <span className="text-[9px] text-[#c8b9a5]/50 uppercase">BASE LATENCY</span>
                          <span className="text-[#c8b9a5] font-bold text-sm">
                            {audioStatus.baseLatency !== null
                              ? `${Math.round(audioStatus.baseLatency * 1000 * 10) / 10} MS`
                              : 'EST. ~5 MS'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded bg-black/60 border border-white/5 flex flex-col justify-between">
                          <span className="text-[9px] text-[#c8b9a5]/50 uppercase">OUTPUT LATENCY</span>
                          <span className="text-[#c8b9a5] font-bold text-sm">
                            {audioStatus.outputLatency !== null
                              ? `${Math.round(audioStatus.outputLatency * 1000 * 10) / 10} MS`
                              : 'DEFAULT'}
                          </span>
                        </div>
                      </div>

                      {/* Real MIDI Devices */}
                      <div className="p-3 rounded bg-black/60 border border-white/5 flex flex-col gap-1.5">
                        <span className="text-[9px] font-mono text-[#c8b9a5]/50 uppercase">
                          CONNECTED MIDI HARDWARE
                        </span>
                        {midiDevicesList.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {midiDevicesList.map((dev, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-[10px] font-mono text-[#b6d63c]">
                                <Radio size={12} />
                                <span>{dev.toUpperCase()}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-[#c8b9a5]/40 italic">
                            No physical MIDI devices currently attached
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PERFORMANCE (KEYBOARD & SEQUENCER) */}
              {activeNav === 4 && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-4 border-b border-[#e6a34a]/20 pb-3">
                    <h2 className="text-lg font-bold tracking-widest uppercase text-[#e6a34a] lcd-amber-glow">
                      04. PERFORMANCE — KEYBOARD & SEQUENCER MAPPING
                    </h2>
                    <div className="flex-1 h-px bg-[#e6a34a]/20" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Keyboard Preferences */}
                    <div className="flex flex-col gap-5">
                      <span className="text-[11px] font-bold tracking-wider uppercase text-[#c8b9a5]/60 engraved-text border-b border-white/5 pb-1">
                        PIANO KEYBED SETTINGS
                      </span>

                      {/* Computer Keyboard Toggle */}
                      <div className="p-3 rounded border border-white/5 bg-black/30 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase text-[#c8b9a5]">
                            Computer Keyboard Trigger (QWERTY)
                          </span>
                          <span className="text-[8px] text-[#c8b9a5]/40 uppercase">
                            Keys A, W, S, E, D, F, G, H, J, K...
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onUpdateSettings({ computerKeyboardEnabled: !settings.computerKeyboardEnabled })}
                          className={`px-3 py-1 rounded text-[9px] font-bold uppercase border cursor-pointer ${
                            settings.computerKeyboardEnabled
                              ? 'bg-[#b6d63c] text-black border-[#b6d63c]'
                              : 'bg-[#27272a] text-[#c8b9a5] border-[#3f3f46]'
                          }`}
                        >
                          {settings.computerKeyboardEnabled ? 'ENABLED' : 'OFF'}
                        </button>
                      </div>

                      {/* Base Octave */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase text-[#c8b9a5]/70">
                          Base Starting Octave
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                          {[2, 3, 4, 5].map((oct) => (
                            <button
                              key={oct}
                              type="button"
                              onClick={() => onUpdateSettings({ baseOctave: oct })}
                              className={`py-2 rounded border text-[10px] font-bold uppercase cursor-pointer transition-all ${
                                settings.baseOctave === oct
                                  ? 'bg-[#333] border-[#e6a34a] text-[#e6a34a] lcd-amber-glow'
                                  : 'bg-[#111] border-[#333] text-[#c8b9a5]/60 hover:text-[#c8b9a5]'
                              }`}
                            >
                              C{oct}–C{oct + 2}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Key Labels Mode */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase text-[#c8b9a5]/70">
                          Piano Key Note Name Labels
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {(['always', 'hover', 'none'] as KeyLabelsMode[]).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => onUpdateSettings({ keyLabels: mode })}
                              className={`py-2 rounded border text-[9px] font-bold uppercase cursor-pointer transition-all ${
                                settings.keyLabels === mode
                                  ? 'bg-[#333] border-[#e6a34a] text-[#e6a34a] lcd-amber-glow'
                                  : 'bg-[#111] border-[#333] text-[#c8b9a5]/60 hover:text-[#c8b9a5]'
                              }`}
                            >
                              {mode === 'none' ? 'NO LABELS' : mode.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Octave Markers */}
                      <div className="p-3 rounded border border-white/5 bg-black/30 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase text-[#c8b9a5]">
                            Engraved Badges on C Keys
                          </span>
                          <span className="text-[8px] text-[#c8b9a5]/40 uppercase">
                            Displays C2, C3, C4 marker on keytop
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onUpdateSettings({ octaveMarkers: !settings.octaveMarkers })}
                          className={`px-3 py-1 rounded text-[9px] font-bold uppercase border cursor-pointer ${
                            settings.octaveMarkers
                              ? 'bg-[#b6d63c] text-black border-[#b6d63c]'
                              : 'bg-[#27272a] text-[#c8b9a5] border-[#3f3f46]'
                          }`}
                        >
                          {settings.octaveMarkers ? 'ENABLED' : 'OFF'}
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Sequencer Preferences */}
                    <div className="flex flex-col gap-5">
                      <span className="text-[11px] font-bold tracking-wider uppercase text-[#c8b9a5]/60 engraved-text border-b border-white/5 pb-1">
                        STEP SEQUENCER SETTINGS
                      </span>

                      {/* Default Sequencer Tempo */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 flex flex-col gap-2">
                          <span className="text-[10px] font-bold uppercase text-[#c8b9a5]/70">
                            Default Clock Tempo (BPM)
                          </span>
                          <input
                            type="range"
                            min={40}
                            max={240}
                            value={settings.defaultSequencerTempo}
                            onChange={(e) => onUpdateSettings({ defaultSequencerTempo: Number(e.target.value) })}
                            className="w-full accent-[#e6a34a] cursor-pointer"
                          />
                        </div>
                        <div className="w-20 h-10 rounded border border-[#333] bg-[#111] flex items-center justify-center font-mono text-base text-[#e6a34a] lcd-amber-glow">
                          {settings.defaultSequencerTempo}
                        </div>
                      </div>

                      {/* Sequencer Pattern Length */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase text-[#c8b9a5]/70">
                          Active Pattern Step Length
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => onUpdateSettings({ patternLength: 8 })}
                            className={`py-2 rounded border text-[10px] font-bold uppercase cursor-pointer transition-all ${
                              settings.patternLength === 8
                                ? 'bg-[#333] border-[#e6a34a] text-[#e6a34a] lcd-amber-glow'
                                : 'bg-[#111] border-[#333] text-[#c8b9a5]/60 hover:text-[#c8b9a5]'
                            }`}
                          >
                            8 STEPS (Compact Loop)
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateSettings({ patternLength: 16 })}
                            className={`py-2 rounded border text-[10px] font-bold uppercase cursor-pointer transition-all ${
                              settings.patternLength === 16
                                ? 'bg-[#333] border-[#e6a34a] text-[#e6a34a] lcd-amber-glow'
                                : 'bg-[#111] border-[#333] text-[#c8b9a5]/60 hover:text-[#c8b9a5]'
                            }`}
                          >
                            16 STEPS (Full Bar)
                          </button>
                        </div>
                      </div>

                      {/* Playback Step Cursor Visibility */}
                      <div className="p-3 rounded border border-white/5 bg-black/30 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase text-[#c8b9a5]">
                            Running Step LED Indicator
                          </span>
                          <span className="text-[8px] text-[#c8b9a5]/40 uppercase">
                            Highlights the active 16th note step
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onUpdateSettings({ showPlaybackStep: !settings.showPlaybackStep })}
                          className={`px-3 py-1 rounded text-[9px] font-bold uppercase border cursor-pointer ${
                            settings.showPlaybackStep
                              ? 'bg-[#b6d63c] text-black border-[#b6d63c]'
                              : 'bg-[#27272a] text-[#c8b9a5] border-[#3f3f46]'
                          }`}
                        >
                          {settings.showPlaybackStep ? 'ENABLED' : 'OFF'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: STORAGE (PRESETS & LIBRARY) */}
              {activeNav === 5 && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-4 border-b border-[#e6a34a]/20 pb-3">
                    <h2 className="text-lg font-bold tracking-widest uppercase text-[#e6a34a] lcd-amber-glow">
                      05. STORAGE & PRESET ARCHIVE
                    </h2>
                    <div className="flex-1 h-px bg-[#e6a34a]/20" />
                  </div>

                  {/* 4 Telemetry Statistics Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded border border-[#333] bg-[#111] flex flex-col justify-between shadow-inner">
                      <span className="text-[9px] font-mono uppercase text-[#c8b9a5]/50">FACTORY PATCHES</span>
                      <span className="text-xl font-mono font-bold text-[#e6a34a] lcd-amber-glow">
                        {storageStats.factoryPresetsCount}
                      </span>
                    </div>

                    <div className="p-3 rounded border border-[#333] bg-[#111] flex flex-col justify-between shadow-inner">
                      <span className="text-[9px] font-mono uppercase text-[#c8b9a5]/50">CUSTOM PATCHES</span>
                      <span className="text-xl font-mono font-bold text-[#b6d63c] led-lime-glow">
                        {storageStats.userPresetsCount}
                      </span>
                    </div>

                    <div className="p-3 rounded border border-[#333] bg-[#111] flex flex-col justify-between shadow-inner">
                      <span className="text-[9px] font-mono uppercase text-[#c8b9a5]/50">SAVED PATTERNS</span>
                      <span className="text-xl font-mono font-bold text-[#e6a34a] lcd-amber-glow">
                        {storageStats.savedPatternsCount}
                      </span>
                    </div>

                    <div className="p-3 rounded border border-[#333] bg-[#111] flex flex-col justify-between shadow-inner">
                      <span className="text-[9px] font-mono uppercase text-[#c8b9a5]/50">STORAGE USAGE</span>
                      <span className="text-xl font-mono font-bold text-[#c8b9a5]">
                        {Math.round((storageStats.approxBytesUsed / 1024) * 10) / 10} KB
                      </span>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Backup & Import */}
                    <div className="flex flex-col gap-3 p-4 rounded bg-black/30 border border-white/5">
                      <span className="text-[10px] font-bold uppercase text-[#c8b9a5] engraved-text">
                        Preset & Pattern Archive
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleExportAllPresets}
                          className="py-2.5 px-3 rounded border border-[#52525b] bg-[#27272a] text-[10px] font-bold uppercase text-[#c8b9a5] hover:bg-[#343438] cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Download size={13} />
                          Export Presets
                        </button>
                        <button
                          type="button"
                          onClick={() => presetFileInputRef.current?.click()}
                          className="py-2.5 px-3 rounded border border-[#52525b] bg-[#27272a] text-[10px] font-bold uppercase text-[#c8b9a5] hover:bg-[#343438] cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Upload size={13} />
                          Import Presets
                        </button>
                        <button
                          type="button"
                          onClick={handleExportPattern}
                          className="py-2.5 px-3 rounded border border-[#52525b] bg-[#27272a] text-[10px] font-bold uppercase text-[#c8b9a5] hover:bg-[#343438] cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Download size={13} />
                          Export Pattern
                        </button>
                        <button
                          type="button"
                          onClick={() => patternFileInputRef.current?.click()}
                          className="py-2.5 px-3 rounded border border-[#52525b] bg-[#27272a] text-[10px] font-bold uppercase text-[#c8b9a5] hover:bg-[#343438] cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Upload size={13} />
                          Import Pattern
                        </button>
                      </div>
                    </div>

                    {/* Reset & Dangerous Zone */}
                    <div className="flex flex-col gap-3 p-4 rounded bg-black/30 border border-white/5">
                      <span className="text-[10px] font-bold uppercase text-[#c8b9a5] engraved-text">
                        System Maintenance
                      </span>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={handleRestoreFactories}
                          className="py-2 px-3 rounded border border-[#71717a] bg-[#211f1d] text-[10px] font-bold uppercase text-[#c8b9a5] hover:bg-[#2c2927] cursor-pointer flex items-center justify-center gap-2"
                        >
                          <RotateCcw size={13} />
                          Restore Factory Presets
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsClearModalOpen(true)}
                          className="py-2 px-3 rounded border border-[#d94b35]/60 bg-[#d94b35]/10 text-[10px] font-bold uppercase text-[#d94b35] hover:bg-[#d94b35]/20 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <AlertTriangle size={13} />
                          Clear Application Storage
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Nav indicators */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveNav(item.id)}
                    className={`flex-1 flex flex-col gap-1 text-left cursor-pointer transition-opacity ${
                      activeNav === item.id ? 'opacity-100' : 'opacity-30 hover:opacity-60'
                    }`}
                  >
                    <span className="text-[9px] font-black tracking-wider text-[#9c8f7e] uppercase truncate">
                      {item.num}. {item.title}
                    </span>
                    <div
                      className={`h-0.5 w-full ${
                        activeNav === item.id ? 'bg-[#b6d63c]' : 'bg-[#c8b9a5]/20'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </main>
          </div>

          {/* Bottom Engraved Chassis Metadata */}
          <footer className="pt-4 border-t border-[#c8b9a5]/10 flex flex-wrap items-center justify-between text-[11px] font-mono tracking-[4px] uppercase text-[#c8b9a5]/50 gap-2">
            <span>MNFCTRD BY VINTAGE AUDIO CO.</span>
            <span>SYSTEM REVISION 2.0.4</span>
            <span>SERIAL: VAC-2024-001X</span>
          </footer>
        </div>
      </div>
    </div>
  );
};
