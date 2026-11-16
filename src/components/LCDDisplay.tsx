import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LCDDisplayProps {
  patchName: string;
  patchNumber: string;
  message?: string;
  subValue?: string;
  onPrevPreset?: () => void;
  onNextPreset?: () => void;
  onOpenPresetList?: () => void;
}

export const LCDDisplay: React.FC<LCDDisplayProps> = ({
  patchName,
  patchNumber,
  message = 'Press a key or turn a knob to begin.',
  subValue,
  onPrevPreset,
  onNextPreset,
  onOpenPresetList,
}) => {
  return (
    <div className="w-56 h-14 rounded-[2px] border border-[#333] bg-[#111] p-2 flex flex-col justify-between shadow-[inset_0_2px_10px_rgba(0,0,0,0.9),0_1px_2px_rgba(255,255,255,0.05)] select-none">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenPresetList}
          className="font-mono text-[13px] font-bold tracking-[1.5px] uppercase text-[#e6a34a] lcd-amber-glow leading-tight truncate text-left hover:underline cursor-pointer max-w-[130px]"
          title="Click to browse presets"
        >
          {patchName}
        </button>

        <div className="flex items-center gap-1">
          {onPrevPreset && (
            <button
              type="button"
              onClick={onPrevPreset}
              className="text-[#e6a34a] hover:text-white cursor-pointer opacity-70 hover:opacity-100 p-0.5"
              title="Previous preset"
            >
              <ChevronLeft size={12} />
            </button>
          )}

          <span className="font-mono text-[10px] text-[#e6a34a] opacity-80 lcd-amber-glow">
            {subValue || patchNumber}
          </span>

          {onNextPreset && (
            <button
              type="button"
              onClick={onNextPreset}
              className="text-[#e6a34a] hover:text-white cursor-pointer opacity-70 hover:opacity-100 p-0.5"
              title="Next preset"
            >
              <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="font-mono text-[8px] uppercase text-[#e6a34a] opacity-60 lcd-amber-glow leading-tight truncate">
        {message}
      </div>
    </div>
  );
};
