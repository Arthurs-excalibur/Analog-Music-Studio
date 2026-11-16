import React from 'react';

interface VUMeterProps {
  leftLevel: number; // 0 to 1
  rightLevel: number; // 0 to 1
}

export const VUMeter: React.FC<VUMeterProps> = ({ leftLevel, rightLevel }) => {
  const segments = 8;

  const renderChannel = (label: string, level: number) => {
    const activeCount = Math.round(level * segments);

    return (
      <div className="flex items-center gap-1.5">
        <span className="w-3 text-[8px] font-bold text-[#c8b9a5] engraved-text">{label}</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: segments }).map((_, i) => {
            const isActive = i < activeCount;
            // First 5 green, next 2 amber, last 1 red
            const isRed = i >= 7;
            const isAmber = i >= 5 && i < 7;

            let colorClass = 'bg-[#b6d63c]';
            let glowClass = 'led-lime-glow';

            if (isRed) {
              colorClass = 'bg-[#d94b35]';
              glowClass = 'led-red-glow';
            } else if (isAmber) {
              colorClass = 'bg-[#e6a34a]';
              glowClass = 'lcd-amber-glow';
            }

            return (
              <div
                key={i}
                className={`w-1 h-3 rounded-[1px] transition-all duration-75 ${
                  isActive ? `${colorClass} ${glowClass}` : `${colorClass} opacity-20`
                }`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1 select-none">
      {renderChannel('L', leftLevel)}
      {renderChannel('R', rightLevel)}
    </div>
  );
};
