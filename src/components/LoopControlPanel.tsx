import React from "react";
import { LoopSettings } from "../services/audioService";
import { IconLoop, IconCheck, IconSeamAudition } from "./icons/DuotoneIcons";

interface LoopControlPanelProps {
  loopSettings: LoopSettings;
  durationMs: number;
  sampleRate: number;
  isSeamPlaying: boolean;
  onUpdate: (newSettings: LoopSettings) => void;
  onAuditionSeam: () => void;
}

export const LoopControlPanel: React.FC<LoopControlPanelProps> = ({
  loopSettings,
  durationMs,
  sampleRate,
  isSeamPlaying,
  onUpdate,
  onAuditionSeam,
}) => {
  const updateField = <K extends keyof LoopSettings>(key: K, val: LoopSettings[K]) => {
    onUpdate({ ...loopSettings, [key]: val });
  };

  const startSample = Math.round(loopSettings.loop_start_ratio * (durationMs / 1000) * sampleRate);
  const endSample = Math.round(loopSettings.loop_end_ratio * (durationMs / 1000) * sampleRate);

  return (
    <div className="flex flex-col bg-neutral-900/90 rounded-2xl border border-neutral-800 p-5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <IconLoop size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-100 tracking-wide">Seamless Loop Studio</h3>
            <p className="text-[11px] text-neutral-400">Zero-crossing snapping & reverb tail folding</p>
          </div>
        </div>

        {/* Master Loop Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={loopSettings.enabled}
            onChange={(e) => updateField("enabled", e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
        </label>
      </div>

      {loopSettings.enabled ? (
        <div className="space-y-4 pt-4 text-xs">
          {/* Feature 1: Reverb Tail Wrap-Around (Fold Tail into Beginning) */}
          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-neutral-200">Reverb Tail Wrap-Around</span>
                <p className="text-[10px] text-neutral-400">
                  Folds natural room decay/echo back over the start to eradicate silence or cutoffs.
                </p>
              </div>
              <input
                type="checkbox"
                checked={loopSettings.reverb_tail_wrap}
                onChange={(e) => updateField("reverb_tail_wrap", e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 bg-neutral-800 border-neutral-700 cursor-pointer"
              />
            </div>

            {loopSettings.reverb_tail_wrap && (
              <div className="pt-2 border-t border-neutral-800/60 space-y-1">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Tail Duration</span>
                  <span className="font-mono text-cyan-300">{loopSettings.tail_duration_ms.toFixed(0)} ms</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="25"
                  value={loopSettings.tail_duration_ms}
                  onChange={(e) => updateField("tail_duration_ms", parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            )}
          </div>

          {/* Feature 2: Zero-Crossing Snapping */}
          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between">
            <div>
              <span className="font-medium text-neutral-200">Zero-Crossing Snapping</span>
              <p className="text-[10px] text-neutral-400">
                Snaps boundaries to nearest 0-amplitude points to prevent pops and clicks.
              </p>
            </div>
            <input
              type="checkbox"
              checked={loopSettings.zero_crossing_snap}
              onChange={(e) => updateField("zero_crossing_snap", e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 bg-neutral-800 border-neutral-700 cursor-pointer"
            />
          </div>

          {/* Feature 3: Seam Crossfade */}
          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium text-neutral-200">Seam Crossfade</span>
                <p className="text-[10px] text-neutral-400">Blends the end into the start smoothly</p>
              </div>
              <span className="font-mono text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/50">
                {loopSettings.crossfade_ms.toFixed(0)} ms
              </span>
            </div>

            <input
              type="range"
              min="2"
              max="600"
              step="5"
              value={loopSettings.crossfade_ms}
              onChange={(e) => updateField("crossfade_ms", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />

            {/* Crossfade Curve Selector */}
            <div className="flex space-x-1 pt-1">
              {[
                { id: "equal_power", label: "Equal Power (Cosine)" },
                { id: "linear", label: "Linear" },
                { id: "s_curve", label: "S-Curve (Sigmoid)" },
              ].map((curve) => (
                <button
                  key={curve.id}
                  onClick={() => updateField("crossfade_curve", curve.id)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    loopSettings.crossfade_curve === curve.id
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800"
                  }`}
                >
                  {curve.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feature 4: Audition Seam Quick Test */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onAuditionSeam}
              className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                isSeamPlaying
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30 animate-pulse"
                  : "bg-gradient-to-r from-violet-600/30 to-indigo-600/30 hover:from-violet-600/40 hover:to-indigo-600/40 text-violet-200 border border-violet-500/30"
              }`}
            >
              <IconSeamAudition size={16} />
              <span>{isSeamPlaying ? "Testing Seam Loop..." : "Audition Loop Seam Only"}</span>
            </button>
          </div>

          {/* Metadata Chunk Status */}
          <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/60 font-mono text-[10px] text-neutral-400 space-y-1">
            <div className="flex justify-between">
              <span>RIFF smpl start frame:</span>
              <span className="text-neutral-200">{startSample}</span>
            </div>
            <div className="flex justify-between">
              <span>RIFF smpl end frame:</span>
              <span className="text-neutral-200">{endSample}</span>
            </div>
            <div className="flex items-center space-x-1.5 pt-1 text-emerald-400">
              <IconCheck size={12} />
              <span>Native Godot 4 & Unity PCM Auto-Loop Ready</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-neutral-500">
          Seamless looping is disabled. The audio will play as a one-shot SFX.
        </div>
      )}
    </div>
  );
};
