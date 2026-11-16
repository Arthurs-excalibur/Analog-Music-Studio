import React, { useRef } from 'react';
import {
  FaderSensitivity,
  ShowNumericValues,
  AccentLighting,
} from '../types/settings';

interface FaderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  displayValue?: string;
  onChange: (value: number) => void;
  // Control Preferences
  sensitivity?: FaderSensitivity;
  showNumericValues?: ShowNumericValues;
  tooltips?: boolean;
  controlLighting?: boolean;
  accentLighting?: AccentLighting;
}

export const Fader: React.FC<FaderProps> = ({
  label,
  value,
  min,
  max,
  step = 0.01,
  unit = 's',
  displayValue,
  onChange,
  sensitivity = 'normal',
  showNumericValues = 'always',
  tooltips = true,
  controlLighting = true,
  accentLighting = 'amber',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startVal = useRef(0);

  // normalized ratio 0 to 1
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startVal.current = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // Initial click jumps or smoothly positions
    if (trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect();
      const height = rect.height;
      const relY = Math.max(0, Math.min(height, e.clientY - rect.top));
      const newRatio = 1 - relY / height;
      let nextVal = min + newRatio * (max - min);
      if (step) {
        nextVal = Math.round(nextVal / step) * step;
      }
      onChange(Math.max(min, Math.min(max, nextVal)));
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const height = rect.height;

    const sensMultiplier = sensitivity === 'fine' ? 0.5 : sensitivity === 'coarse' ? 1.5 : 1.0;
    const dy = (startY.current - e.clientY) * sensMultiplier;
    const range = max - min;
    let nextVal = startVal.current + (dy / height) * range;

    if (step) {
      nextVal = Math.round(nextVal / step) * step;
    }
    onChange(Math.max(min, Math.min(max, nextVal)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const delta = step || (max - min) / 50;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      onChange(Math.min(max, value + delta));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      onChange(Math.max(min, value - delta));
    }
  };

  const formattedDisplay = displayValue !== undefined ? displayValue : `${Math.round(value * 100) / 100}${unit}`;

  const haloGlow = controlLighting
    ? accentLighting === 'lime'
      ? '0 0 8px rgba(182,214,60,0.4)'
      : accentLighting === 'warm-white'
      ? '0 0 8px rgba(245,237,224,0.4)'
      : '0 0 8px rgba(230,163,74,0.4)'
    : 'none';

  return (
    <div
      className="group flex flex-col items-center h-full select-none relative"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="slider"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      title={tooltips ? `${label}: ${formattedDisplay}` : undefined}
    >
      {/* Label */}
      <span className="text-[11px] font-bold tracking-[0.5px] uppercase text-[#c8b9a5] engraved-text opacity-70 mb-2 truncate max-w-full">
        {label}
      </span>

      {/* Track & Thumb */}
      <div
        ref={trackRef}
        className="relative w-2 flex-1 rounded-full bg-[#111] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.9),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Metal Thumb Cap */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-6 h-4 rounded-[2px] bg-gradient-to-r from-[#444] via-[#777] to-[#444] border border-white/20 shadow-[0_3px_5px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.5)] cursor-ns-resize transition-shadow"
          style={{
            bottom: `calc(${ratio * 100}% - 8px)`,
            boxShadow: haloGlow !== 'none' ? `0 3px 5px rgba(0,0,0,0.7), ${haloGlow}` : undefined,
          }}
        >
          {/* Thumb grip center line with optional accent illumination */}
          <div
            className={`absolute top-1/2 left-1 right-1 h-0.5 -translate-y-1/2 rounded-full ${
              controlLighting
                ? accentLighting === 'lime'
                  ? 'bg-[#b6d63c] led-lime-glow'
                  : accentLighting === 'warm-white'
                  ? 'bg-[#f5ede0]'
                  : 'bg-[#e6a34a] lcd-amber-glow'
                : 'bg-black/60 shadow-[0_1px_0_rgba(255,255,255,0.2)]'
            }`}
          />
        </div>
      </div>

      {/* Numeric Readout with Hover Visibility Support */}
      <span
        className={`mt-2 text-[9px] font-mono leading-none transition-opacity duration-150 ${
          accentLighting === 'lime'
            ? 'text-[#b6d63c] led-lime-glow'
            : accentLighting === 'warm-white'
            ? 'text-[#f5ede0]'
            : 'text-[#e6a34a] lcd-amber-glow'
        } ${
          showNumericValues === 'hover'
            ? 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
            : 'opacity-100'
        }`}
      >
        {formattedDisplay}
      </span>
    </div>
  );
};
