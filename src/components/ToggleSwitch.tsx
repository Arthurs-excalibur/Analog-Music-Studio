import React from 'react';

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  ledColor?: 'red' | 'lime' | 'amber';
  onChange: (checked: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  checked,
  ledColor = 'red',
  onChange,
}) => {
  const ledGlowClass =
    ledColor === 'lime'
      ? checked
        ? 'bg-[#b6d63c] led-lime-glow'
        : 'bg-[#2b3512] opacity-40'
      : ledColor === 'amber'
      ? checked
        ? 'bg-[#e6a34a] lcd-amber-glow'
        : 'bg-[#3d2c14] opacity-40'
      : checked
      ? 'bg-[#d94b35] led-red-glow'
      : 'bg-[#3b1511] opacity-40';

  return (
    <div className="flex flex-col items-center select-none">
      {/* Status LED */}
      <div className={`w-2 h-2 rounded-full transition-all duration-150 mb-1.5 ${ledGlowClass}`} />

      {/* Rocker/Switch Well */}
      <button
        type="button"
        aria-label={label}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="w-8 h-12 bg-black rounded p-1 flex flex-col justify-between items-center cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_2px_4px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-1 focus:ring-[#b6d63c]"
      >
        <div
          className={`w-full h-5 rounded-[2px] border border-black transition-all duration-150 shadow ${
            checked
              ? 'bg-[#3f3f46] translate-y-0 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]'
              : 'bg-[#18181b] translate-y-5 opacity-80'
          }`}
        />
      </button>

      {/* Label */}
      <span className="mt-1.5 text-[9px] font-bold tracking-[0.45px] uppercase text-[#c8b9a5] engraved-text">
        {label}
      </span>
    </div>
  );
};
