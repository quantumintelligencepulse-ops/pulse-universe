import { useRef } from "react";
import { Pause, Play } from "lucide-react";

interface Props {
  speed: number;
  onSpeedChange: (v: number) => void;
}

export default function SpeedControl({ speed, onSpeedChange }: Props) {
  const prevSpeed = useRef(1);

  const togglePause = () => {
    if (speed === 0) {
      onSpeedChange(prevSpeed.current || 1);
    } else {
      prevSpeed.current = speed;
      onSpeedChange(0);
    }
  };

  return (
    <div
      data-testid="speed-control"
      className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-black/60 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full"
    >
      <button
        data-testid="pause-play-btn"
        onClick={togglePause}
        className="text-white/70 hover:text-white transition-colors"
      >
        {speed === 0 ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
      </button>
      <input
        data-testid="speed-slider"
        type="range"
        min="0"
        max="20"
        step="0.1"
        value={speed}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (v > 0) prevSpeed.current = v;
          onSpeedChange(v);
        }}
        className="w-32 accent-blue-400 cursor-pointer"
      />
      <span className="text-white/60 font-mono text-xs w-10 text-right">
        {speed === 0 ? "⏸" : `${speed.toFixed(1)}×`}
      </span>
    </div>
  );
}
