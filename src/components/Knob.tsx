import React, { useRef, useState } from 'react';
import {
  KnobSensitivity,
  DragMode,
  ShowNumericValues,
  AccentLighting,
} from '../types/settings';

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  size?: number; // 48, 56, 64, 144
  displayValue?: string;
  onChange: (value: number) => void;
  // Control Preferences
  sensitivity?: KnobSensitivity;
  dragMode?: DragMode;
  doubleClickReset?: boolean;
  showNumericValues?: ShowNumericValues;
  tooltips?: boolean;
  controlLighting?: boolean;
  accentLighting?: AccentLighting;
}

export const Knob: React.FC<KnobProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  defaultValue,
  unit = '',
  size = 48,
  displayValue,
  onChange,
  sensitivity = 'normal',
  dragMode = 'vertical',
  doubleClickReset = true,
  showNumericValues = 'always',
  tooltips = true,
  controlLighting = true,
  accentLighting = 'amber',
}) => {
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startVal = useRef(0);
  const knobCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastAngle = useRef(0);
  const [isFocused, setIsFocused] = useState(false);

  // Map value to rotation (-135deg to +135deg = 270deg total travel)
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const rotation = -135 + normalized * 270;

  const sensitivityPx = sensitivity === 'fine' ? 300 : sensitivity === 'coarse' ? 75 : 150;

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startVal.current = value;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    knobCenter.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    lastAngle.current = Math.atan2(e.clientY - knobCenter.current.y, e.clientX - knobCenter.current.x) * (180 / Math.PI);

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const range = max - min;

    if (dragMode === 'circular') {
      const currentAngle = Math.atan2(e.clientY - knobCenter.current.y, e.clientX - knobCenter.current.x) * (180 / Math.PI);
      let deltaAngle = currentAngle - lastAngle.current;
      // Handle 180/-180 wrap
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;
      lastAngle.current = currentAngle;

      const angleSensitivity = sensitivity === 'fine' ? 0.5 : sensitivity === 'coarse' ? 1.5 : 1.0;
      let nextVal = value + (deltaAngle / 270) * range * angleSensitivity;
      if (step) {
        nextVal = Math.round(nextVal / step) * step;
      }
      onChange(Math.max(min, Math.min(max, nextVal)));
    } else {
      // Linear vertical drag mode
      const dy = startY.current - e.clientY; // drag up increases
      let nextVal = startVal.current + (dy / sensitivityPx) * range;
      if (step) {
        nextVal = Math.round(nextVal / step) * step;
      }
      onChange(Math.max(min, Math.min(max, nextVal)));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleDoubleClick = () => {
    if (doubleClickReset && defaultValue !== undefined) {
      onChange(defaultValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const delta = step || (max - min) / 100;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      onChange(Math.min(max, value + delta));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      onChange(Math.max(min, value - delta));
    }
  };

  const formattedDisplay = displayValue !== undefined ? displayValue : `${Math.round(value * 10) / 10}${unit}`;

  const haloGlow = controlLighting
    ? accentLighting === 'lime'
      ? '0 0 10px rgba(182,214,60,0.35)'
      : accentLighting === 'warm-white'
      ? '0 0 10px rgba(245,237,224,0.35)'
      : '0 0 10px rgba(230,163,74,0.35)'
    : 'none';

  return (
    <div
      className="group flex flex-col items-center select-none relative"
      style={{ width: Math.max(size, 64) }}
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
      role="slider"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      title={tooltips ? `${label}: ${formattedDisplay}` : undefined}
    >
      {/* Knob Body with Machined Metal Cap */}
      <div
        className={`relative rounded-full cursor-pointer transition-shadow ${
          isFocused ? 'ring-2 ring-[#b6d63c]' : ''
        }`}
        style={{
          width: size,
          height: size,
          border: '2px solid #71717a',
          boxShadow: `0 4px 6px -1px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.2), ${haloGlow}`,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* Machined Conic Texture */}
        <div
          className="absolute inset-0 rounded-full machined-knob pointer-events-none"
          style={{
            transform: `rotate(${rotation}deg)`,
          }}
        >
          {/* Top indicator notch */}
          <div
            className="absolute top-1 left-1/2 -translate-x-1/2 rounded-full bg-[#f4f4f5] shadow-sm"
            style={{
              width: Math.max(2, Math.floor(size / 24)),
              height: Math.max(6, Math.floor(size / 4)),
            }}
          />
        </div>
      </div>

      {/* Label */}
      <span className="mt-2 text-[10px] font-bold tracking-[0.5px] uppercase text-[#c8b9a5] engraved-text text-center truncate max-w-full">
        {label}
      </span>

      {/* Numeric Readout with Hover Visibility Support */}
      <span
        className={`text-[9px] font-mono leading-tight mt-0.5 transition-opacity duration-150 ${
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
