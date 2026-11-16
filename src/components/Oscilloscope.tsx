import React, { useRef, useEffect } from 'react';
import { engine } from '../audio/engine';

interface OscilloscopeProps {
  waveform: string;
  width?: number;
  height?: number;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  waveform,
  width = 96,
  height = 64,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(256);

    const render = () => {
      animId = requestAnimationFrame(render);
      engine.getAnalyserData(dataArray);

      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(0, 0, width, height);

      // Grid reticle lines
      ctx.strokeStyle = 'rgba(230, 163, 74, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();

      // Audio waveform trace
      ctx.strokeStyle = '#b6d63c';
      ctx.shadowColor = '#b6d63c';
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1.8;
      ctx.beginPath();

      const sliceWidth = width / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [width, height, waveform]);

  return (
    <div
      className="relative rounded-[4px] border border-[#333] overflow-hidden bg-[#111] shadow-[inset_0_2px_10px_rgba(0,0,0,0.9)]"
      style={{ width, height }}
    >
      <canvas ref={canvasRef} width={width} height={height} className="block w-full h-full" />
    </div>
  );
};
