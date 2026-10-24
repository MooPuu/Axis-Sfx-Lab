import React, { useEffect, useRef, useState } from "react";
import { LoopSettings } from "../services/audioService";
import { IconLoop, IconPlay, IconPause, IconSeamAudition } from "./icons/DuotoneIcons";
import { Slider } from "./ui/slider";

interface WaveformViewerProps {
  peaks: number[];
  durationMs: number;
  sampleRate: number;
  isPlaying: boolean;
  isSeamPlaying: boolean;
  loopSettings: LoopSettings;
  playbackProgress: number;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onAuditionSeam: () => void;
  onChangeLoopRange: (startRatio: number, endRatio: number) => void;
  onSeek: (ratio: number) => void;
}

export const WaveformViewer: React.FC<WaveformViewerProps> = ({
  peaks,
  durationMs,
  sampleRate,
  isPlaying,
  isSeamPlaying,
  loopSettings,
  playbackProgress,
  onTogglePlay,
  onToggleLoop,
  onAuditionSeam,
  onChangeLoopRange,
  onSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState<"start" | "end" | null>(null);

  // Render canvas waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Background grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Time division vertical lines
    const divisions = 6;
    for (let d = 1; d < divisions; d++) {
      const x = (width / divisions) * d;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Active Loop Region Shading
    if (loopSettings.enabled) {
      const startX = loopSettings.loop_start_ratio * width;
      const endX = loopSettings.loop_end_ratio * width;

      const loopGrad = ctx.createLinearGradient(startX, 0, endX, 0);
      loopGrad.addColorStop(0, "rgba(56, 189, 248, 0.08)");
      loopGrad.addColorStop(1, "rgba(168, 85, 247, 0.08)");
      ctx.fillStyle = loopGrad;
      ctx.fillRect(startX, 0, endX - startX, height);

      // Loop boundary markers
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
      ctx.stroke();

      ctx.strokeStyle = "#a855f7";
      ctx.beginPath();
      ctx.moveTo(endX, 0);
      ctx.lineTo(endX, height);
      ctx.stroke();

      // Handles
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(startX, 12, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#a855f7";
      ctx.beginPath();
      ctx.arc(endX, height - 12, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Waveform Bars
    const numPeaks = peaks.length;
    if (numPeaks > 0) {
      const barWidth = width / numPeaks;

      for (let i = 0; i < numPeaks; i++) {
        const peakVal = peaks[i];
        const barHeight = Math.max(peakVal * (height * 0.85), 2);
        const x = i * barWidth;
        const y = centerY - barHeight / 2;

        const normX = i / numPeaks;
        const inLoop =
          loopSettings.enabled &&
          normX >= loopSettings.loop_start_ratio &&
          normX <= loopSettings.loop_end_ratio;

        if (inLoop) {
          ctx.fillStyle = "#38bdf8";
        } else {
          ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
        }

        ctx.fillRect(x, y, Math.max(barWidth - 0.5, 1), barHeight);
      }
    }

    // Draw Playhead
    if (isPlaying) {
      const playheadX = playbackProgress * width;
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#4ade80";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }
  }, [peaks, loopSettings, playbackProgress, isPlaying]);

  // Handle Dragging Loop Boundaries
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!loopSettings.enabled || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));

    const distToStart = Math.abs(ratio - loopSettings.loop_start_ratio);
    const distToEnd = Math.abs(ratio - loopSettings.loop_end_ratio);

    if (distToStart < 0.05) {
      setIsDragging("start");
    } else if (distToEnd < 0.05) {
      setIsDragging("end");
    } else {
      if (distToStart < distToEnd) {
        setIsDragging("start");
        onChangeLoopRange(ratio, loopSettings.loop_end_ratio);
      } else {
        setIsDragging("end");
        onChangeLoopRange(loopSettings.loop_start_ratio, ratio);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));

    if (isDragging === "start") {
      const newStart = Math.min(ratio, loopSettings.loop_end_ratio - 0.02);
      onChangeLoopRange(newStart, loopSettings.loop_end_ratio);
    } else if (isDragging === "end") {
      const newEnd = Math.max(ratio, loopSettings.loop_start_ratio + 0.02);
      onChangeLoopRange(loopSettings.loop_start_ratio, newEnd);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  const formatTime = (ms: number) => {
    const s = ms / 1000;
    return `${s.toFixed(2)}s`;
  };

  const currentSeconds = (playbackProgress * (durationMs / 1000)).toFixed(2);
  const totalSeconds = (durationMs / 1000).toFixed(2);

  return (
    <div className="flex flex-col rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 shadow-xl backdrop-blur-md">
      {/* Top Status & Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80 mb-3">
        <div className="flex items-center space-x-3">
          {/* Play/Pause Button */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-xs transition-all duration-200 cursor-pointer ${
              isPlaying && !isSeamPlaying
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                : "bg-neutral-800 hover:bg-neutral-700/80 text-neutral-200 border border-neutral-700"
            }`}
          >
            {isPlaying && !isSeamPlaying ? <IconPause size={16} /> : <IconPlay size={16} />}
            <span>{isPlaying && !isSeamPlaying ? "Pause" : "Play Sound"}</span>
          </button>

          {/* Loop Play Toggle */}
          <button
            onClick={onToggleLoop}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
              loopSettings.enabled
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-neutral-800/60 text-neutral-400 hover:text-neutral-200 border border-neutral-800"
            }`}
          >
            <IconLoop size={16} className={loopSettings.enabled ? "text-cyan-400" : "text-neutral-500"} />
            <span>Seamless Loop {loopSettings.enabled ? "ON" : "OFF"}</span>
          </button>

          {/* Audition Seam Button */}
          {loopSettings.enabled && (
            <button
              onClick={onAuditionSeam}
              title="Repeats only the transition junction (last 1s into first 1s) to instantly verify click-free seam"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                isSeamPlaying
                  ? "bg-violet-500/30 text-violet-200 border border-violet-400/50 animate-pulse shadow-md shadow-violet-500/20"
                  : "bg-violet-950/40 text-violet-300 hover:bg-violet-900/50 border border-violet-800/60"
              }`}
            >
              <IconSeamAudition size={16} />
              <span>Audition Seam</span>
            </button>
          )}
        </div>

        {/* Duration & Metadata Badges */}
        <div className="flex items-center space-x-3 text-xs text-neutral-400 font-mono">
          <span className="px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-300">
            {formatTime(durationMs)}
          </span>
          <span className="px-2 py-1 rounded-md bg-neutral-950/70 border border-neutral-800/60 text-neutral-400">
            {sampleRate} Hz
          </span>
          {loopSettings.enabled && (
            <span className="px-2 py-1 rounded-md bg-cyan-950/40 border border-cyan-800/40 text-cyan-400">
              RIFF smpl injected
            </span>
          )}
        </div>
      </div>

      {/* Canvas Waveform View */}
      <div
        ref={containerRef}
        className="relative w-full h-36 bg-neutral-950/80 rounded-xl border border-neutral-800/90 overflow-hidden select-none cursor-crosshair group"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full block"
        />

        {/* Helper Hint Overlay */}
        {loopSettings.enabled && (
          <div className="absolute top-2 left-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-neutral-400 bg-neutral-900/90 px-2 py-0.5 rounded border border-neutral-800">
            Drag blue/purple handles to refine loop window
          </div>
        )}
      </div>

      {/* shadcn/ui Playback Scrubbing Slider */}
      <div className="pt-3 pb-1 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
          <span className="text-cyan-400">{currentSeconds}s</span>
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Playback Position</span>
          <span className="text-neutral-300">{totalSeconds}s</span>
        </div>
        <Slider
          value={[playbackProgress * 100]}
          min={0}
          max={100}
          step={0.1}
          onValueChange={(val) => {
            const ratio = val[0] / 100;
            onSeek(ratio);
          }}
          className="w-full cursor-pointer"
        />
      </div>

      {/* Waveform Footer with Loop Indicators */}
      {loopSettings.enabled && (
        <div className="flex items-center justify-between pt-2 px-1 text-[11px] font-mono text-neutral-500">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            <span>Loop Start: {(loopSettings.loop_start_ratio * durationMs).toFixed(0)}ms</span>
          </div>
          <div className="flex items-center space-x-2 text-neutral-400">
            <span>Window: {((loopSettings.loop_end_ratio - loopSettings.loop_start_ratio) * durationMs).toFixed(0)}ms</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
            <span>Loop End: {(loopSettings.loop_end_ratio * durationMs).toFixed(0)}ms</span>
          </div>
        </div>
      )}
    </div>
  );
};
