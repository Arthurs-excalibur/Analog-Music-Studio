import React, { useState, useEffect } from 'react';

export function isViewportBlocked(width: number, height: number): boolean {
  if (width <= 0 || height <= 0) return false;
  // 1. Portrait orientation
  if (width < height) return true;
  // 2. Insufficient landscape width
  if (width < 680) return true;
  // 3. Insufficient landscape height
  if (height < 400) return true;
  return false;
}

export function useOrientationGate(): { isBlocked: boolean; width: number; height: number } {
  const getDims = () => {
    if (typeof window === 'undefined') {
      return { width: 1280, height: 800, isBlocked: false };
    }
    const w = window.innerWidth || document.documentElement.clientWidth || 0;
    const h = window.innerHeight || document.documentElement.clientHeight || 0;
    return {
      width: w,
      height: h,
      isBlocked: isViewportBlocked(w, h),
    };
  };

  const [state, setState] = useState(getDims);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setState(getDims());
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    // Also listen to matchMedia orientation changes
    let mql: MediaQueryList | null = null;
    try {
      mql = window.matchMedia('(orientation: portrait)');
      mql.addEventListener('change', handleResize);
    } catch {
      // ignore older environments
    }

    // Immediate check
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (mql) {
        mql.removeEventListener('change', handleResize);
      }
    };
  }, []);

  return state;
}

interface OrientationGateProps {
  width?: number;
  height?: number;
}

export const OrientationGate: React.FC<OrientationGateProps> = ({ width, height }) => {
  const isPortrait = width !== undefined && height !== undefined && width < height;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed inset-0 z-[9999] bg-[#141312] flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none"
    >
      {/* Outer Vintage Walnut Frame */}
      <div className="relative w-full max-w-lg rounded-xl border-4 border-[#2b1a13] walnut-grain shadow-2xl p-3 sm:p-4 overflow-hidden">
        {/* Left & Right Side Cheeks */}
        <div className="absolute top-0 bottom-0 left-0 w-4 bg-[#2b1a13] shadow-[inset_-2px_0_4px_rgba(0,0,0,0.6)]" />
        <div className="absolute top-0 bottom-0 right-0 w-4 bg-[#2b1a13] shadow-[inset_2px_0_4px_rgba(0,0,0,0.6)]" />

        {/* Brushed Metal Chassis Body */}
        <div className="relative mx-3 rounded border-2 border-[#211f1d] brushed-faceplate chassis-bevel p-6 sm:p-8 flex flex-col items-center text-center gap-6">
          {/* Corner Hardware Screws */}
          <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 rounded-full bg-[#52525b] shadow-inner flex items-center justify-center">
            <div className="w-2 h-0.5 bg-[#27272a]" />
          </div>
          <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 rounded-full bg-[#52525b] shadow-inner flex items-center justify-center">
            <div className="w-2 h-0.5 bg-[#27272a]" />
          </div>
          <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 rounded-full bg-[#52525b] shadow-inner flex items-center justify-center">
            <div className="w-2 h-0.5 bg-[#27272a]" />
          </div>
          <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 rounded-full bg-[#52525b] shadow-inner flex items-center justify-center">
            <div className="w-2 h-0.5 bg-[#27272a]" />
          </div>

          {/* Studio Brand Header */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#e6a34a] lcd-amber-glow animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-[2px] text-[#e6a34a] uppercase">
                ANALOG MUSIC STUDIO
              </span>
              <span className="w-2 h-2 rounded-full bg-[#e6a34a] lcd-amber-glow animate-pulse" />
            </div>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#c8b9a5]/30 to-transparent my-0.5" />
          </div>

          {/* Animated Device Rotation Graphic */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Outer Circular Target Guide */}
            <div className="absolute inset-0 rounded-full border border-dashed border-[#e6a34a]/30 animate-[spin_12s_linear_infinite]" />
            <div className="absolute inset-3 rounded-full border border-white/5 bg-black/40 shadow-inner" />

            {/* Rotating Device Icon */}
            <div className="relative z-10 animate-device-rotate">
              <svg
                width="72"
                height="72"
                viewBox="0 0 72 72"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_4px_12px_rgba(230,163,74,0.35)]"
              >
                {/* Device Body */}
                <rect
                  x="20"
                  y="10"
                  width="32"
                  height="52"
                  rx="6"
                  className="fill-[#1c1a19] stroke-[#e6a34a]"
                  strokeWidth="2.5"
                />
                {/* Screen Area */}
                <rect
                  x="24"
                  y="16"
                  width="24"
                  height="38"
                  rx="2"
                  className="fill-[#0c0b0a] stroke-[#e6a34a]/40"
                  strokeWidth="1"
                />
                {/* Speaker Notch */}
                <line
                  x1="32"
                  y1="13"
                  x2="40"
                  y2="13"
                  className="stroke-[#c8b9a5]/70"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {/* Home Indicator */}
                <circle cx="36" cy="57.5" r="1.5" className="fill-[#e6a34a]/60" />

                {/* Synth Waveform Glow inside Phone Screen */}
                <path
                  d="M 27 35 Q 30 27 33 35 T 39 35 T 45 35"
                  className="stroke-[#e6a34a]"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>

            {/* Direction Rotation Arrow */}
            <div className="absolute -bottom-1 text-[#e6a34a] text-xs font-mono font-bold tracking-widest flex items-center gap-1 opacity-80">
              <span>↻ 90°</span>
            </div>
          </div>

          {/* Typography */}
          <div className="flex flex-col gap-2 max-w-sm">
            <h1 className="text-2xl sm:text-3xl font-black tracking-[-0.5px] uppercase text-[#c8b9a5] engraved-text leading-tight">
              ROTATE YOUR DEVICE
            </h1>
            <p className="text-xs sm:text-sm text-[#c8b9a5]/80 leading-relaxed font-sans">
              Analog Studio is designed for landscape. Turn your device sideways to enter the studio.
            </p>
          </div>

          {/* Amber LCD Viewport Status */}
          <div className="w-full bg-[#111111] border border-[#e6a34a]/30 rounded p-2.5 shadow-inner flex flex-col gap-1 text-[10px] font-mono">
            <div className="flex items-center justify-between text-[#c8b9a5]/60 border-b border-white/5 pb-1">
              <span>STATUS:</span>
              <span className="text-[#e6a34a] font-bold">
                {isPortrait ? 'PORTRAIT ORIENTATION' : 'VIEWPORT TOO COMPACT'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#c8b9a5]/60 pt-0.5">
              <span>REQUIRED:</span>
              <span className="text-[#c8b9a5]">LANDSCAPE (≥ 680 × 400 PX)</span>
            </div>
            {width !== undefined && height !== undefined && width > 0 && (
              <div className="flex items-center justify-between text-[#c8b9a5]/40 text-[9px] pt-0.5">
                <span>CURRENT USABLE:</span>
                <span>
                  {Math.round(width)} × {Math.round(height)} PX
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
