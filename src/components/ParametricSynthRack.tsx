import React from "react";
import { SynthParams } from "../services/audioService";
import {
  IconImpact,
  IconMotor,
  IconUI,
  IconSciFi,
  IconFootstep,
  IconWhoosh,
  IconAmbient,
  IconSliders,
  IconSparkles,
} from "./icons/DuotoneIcons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface ParametricSynthRackProps {
  params: SynthParams;
  onChange: (newParams: SynthParams) => void;
  onMutate: () => void;
  onRandomize: () => void;
}

export const ParametricSynthRack: React.FC<ParametricSynthRackProps> = ({
  params,
  onChange,
  onMutate,
  onRandomize,
}) => {
  const updateField = <K extends keyof SynthParams>(key: K, val: SynthParams[K]) => {
    onChange({ ...params, [key]: val });
  };

  const categories = [
    { id: "impact", name: "Impacts", icon: IconImpact, color: "text-rose-400" },
    { id: "motor", name: "Motors", icon: IconMotor, color: "text-amber-400" },
    { id: "ui", name: "UI & Clicks", icon: IconUI, color: "text-sky-400" },
    { id: "scifi", name: "Sci-Fi Energy", icon: IconSciFi, color: "text-fuchsia-400" },
    { id: "footstep", name: "Foley Steps", icon: IconFootstep, color: "text-emerald-400" },
    { id: "whoosh", name: "Whooshes", icon: IconWhoosh, color: "text-cyan-400" },
    { id: "ambient", name: "Ambient Drone", icon: IconAmbient, color: "text-violet-400" },
  ];

  const materials = [
    { id: "metal", name: "Metal Resonance" },
    { id: "wood", name: "Wood Acoustic" },
    { id: "glass", name: "Glass Crystal" },
    { id: "stone", name: "Stone & Mineral" },
    { id: "flesh", name: "Organic & Flesh" },
  ];

  return (
    <div className="flex flex-col bg-neutral-900/90 rounded-2xl border border-neutral-800 p-5 shadow-xl backdrop-blur-md space-y-5">
      {/* Category Navigation & Select Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-300">
            <IconSliders size={18} className="text-blue-400" />
            <span>Procedural Sound Generator</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* shadcn/ui Select for Category */}
            <div className="w-36">
              <Select
                value={params.category}
                onValueChange={(val) => updateField("category", val)}
              >
                <SelectTrigger className="h-7 text-xs bg-neutral-950 border-neutral-800">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              onClick={onMutate}
              title="Slightly mutate current sound (5% seed drift)"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer"
            >
              <IconSparkles size={13} />
              <span>Mutate</span>
            </button>
            <button
              onClick={onRandomize}
              title="Completely randomize parameters for instant inspiration"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/30 transition-all cursor-pointer"
            >
              <span>Randomize</span>
            </button>
          </div>
        </div>

        {/* Category Selector Tabs */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 p-1 rounded-xl bg-neutral-950/80 border border-neutral-800/80">
          {categories.map((c) => {
            const Icon = c.icon;
            const active = params.category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => updateField("category", c.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
                  active
                    ? "bg-neutral-800 text-white shadow-md border border-neutral-700"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60"
                }`}
              >
                <Icon size={16} className={active ? c.color : "text-neutral-500"} />
                <span className="text-[10px] font-medium mt-1 truncate max-w-full">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Left Column: Physical & Frequency Engine */}
        <div className="space-y-3.5 p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800/70">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Acoustics & Envelope
          </h4>

          {/* Base Frequency */}
          <div className="space-y-1">
            <div className="flex justify-between text-neutral-300">
              <span>Base Frequency</span>
              <span className="font-mono text-cyan-300">{params.base_freq.toFixed(0)} Hz</span>
            </div>
            <input
              type="range"
              min="20"
              max="4000"
              step="5"
              value={params.base_freq}
              onChange={(e) => updateField("base_freq", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Envelope Decay */}
          <div className="space-y-1">
            <div className="flex justify-between text-neutral-300">
              <span>Decay Time</span>
              <span className="font-mono text-cyan-300">{params.decay_ms.toFixed(0)} ms</span>
            </div>
            <input
              type="range"
              min="10"
              max="3000"
              step="10"
              value={params.decay_ms}
              onChange={(e) => updateField("decay_ms", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Pitch Decay / Sweep */}
          <div className="space-y-1">
            <div className="flex justify-between text-neutral-300">
              <span>Pitch Envelope Bend</span>
              <span className="font-mono text-cyan-300">{(params.pitch_decay * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={params.pitch_decay}
              onChange={(e) => updateField("pitch_decay", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Material Presets (with shadcn/ui Select) */}
          {(params.category === "impact" || params.category === "footstep") && (
            <div className="space-y-1.5 pt-1">
              <span className="text-neutral-400 text-[11px]">Material Density & Texture</span>
              <Select
                value={params.material_preset}
                onValueChange={(val) => updateField("material_preset", val)}
              >
                <SelectTrigger className="h-8 text-xs bg-neutral-950 border-neutral-800 text-rose-300">
                  <SelectValue placeholder="Select Material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category-Specific Controls */}
          {params.category === "motor" && (
            <>
              <div className="space-y-1">
                <div className="flex justify-between text-neutral-300">
                  <span>Harmonic Count</span>
                  <span className="font-mono text-amber-300">{params.harmonic_count}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={params.harmonic_count}
                  onChange={(e) => updateField("harmonic_count", parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-neutral-300">
                  <span>RPM Jitter / Flutter</span>
                  <span className="font-mono text-amber-300">{(params.jitter_amount * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={params.jitter_amount}
                  onChange={(e) => updateField("jitter_amount", parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            </>
          )}

          {params.category === "scifi" && (
            <>
              <div className="space-y-1">
                <div className="flex justify-between text-neutral-300">
                  <span>FM Modulation Depth</span>
                  <span className="font-mono text-fuchsia-300">{(params.fm_depth * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={params.fm_depth}
                  onChange={(e) => updateField("fm_depth", parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-400"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-neutral-300">
                  <span>FM Ratio</span>
                  <span className="font-mono text-fuchsia-300">{params.fm_ratio.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6"
                  step="0.1"
                  value={params.fm_ratio}
                  onChange={(e) => updateField("fm_ratio", parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-400"
                />
              </div>
            </>
          )}

          {/* Damping & Brightness */}
          <div className="space-y-1">
            <div className="flex justify-between text-neutral-300">
              <span>Damping Decay</span>
              <span className="font-mono text-cyan-300">{params.damping.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.05"
              value={params.damping}
              onChange={(e) => updateField("damping", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Right Column: Texture & DSP Effects */}
        <div className="space-y-3.5 p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800/70">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Tone Shaping & Effects
          </h4>

          {/* Filter Cutoff */}
          <div className="space-y-1">
            <div className="flex justify-between text-neutral-300">
              <span>Low-Pass Filter Cutoff</span>
              <span className="font-mono text-indigo-300">{params.filter_cutoff.toFixed(0)} Hz</span>
            </div>
            <input
              type="range"
              min="200"
              max="16000"
              step="100"
              value={params.filter_cutoff}
              onChange={(e) => updateField("filter_cutoff", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>

          {/* Filter Resonance */}
          <div className="space-y-1">
            <div className="flex justify-between text-neutral-300">
              <span>Filter Resonance (Q)</span>
              <span className="font-mono text-indigo-300">{params.filter_resonance.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={params.filter_resonance}
              onChange={(e) => updateField("filter_resonance", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>

          {/* Noise Mix */}
          <div className="space-y-1">
            <div className="flex justify-between text-neutral-300">
              <span>Noise & Attack Strike</span>
              <span className="font-mono text-indigo-300">{(params.noise_mix * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={params.noise_mix}
              onChange={(e) => updateField("noise_mix", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>

          {/* Drive / Saturation */}
          <div className="space-y-1">
            <div className="flex justify-between text-neutral-300">
              <span>Overdrive / Saturation</span>
              <span className="font-mono text-indigo-300">{(params.drive * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={params.drive}
              onChange={(e) => updateField("drive", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>

          {/* Algorithmic Reverb Wet */}
          <div className="space-y-1">
            <div className="flex justify-between text-neutral-300">
              <span>Reverb Room Wet</span>
              <span className="font-mono text-indigo-300">{(params.reverb_wet * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.02"
              value={params.reverb_wet}
              onChange={(e) => updateField("reverb_wet", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>

          {/* Stereo Spread */}
          <div className="space-y-1">
            <div className="flex justify-between text-neutral-300">
              <span>Stereo Width</span>
              <span className="font-mono text-indigo-300">{(params.stereo_spread * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={params.stereo_spread}
              onChange={(e) => updateField("stereo_spread", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
