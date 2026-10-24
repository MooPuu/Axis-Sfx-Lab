import { useEffect, useState, useRef, useCallback } from "react";
import {
  SynthParams,
  LoopSettings,
  ProcessedAudioPayload,
  PresetInfo,
  audioPlayer,
  apiGenerateSfx,
  apiBatchVariations,
  apiGetFactoryPresets,
} from "./services/audioService";
import { WaveformViewer } from "./components/WaveformViewer";
import { LoopControlPanel } from "./components/LoopControlPanel";
import { ParametricSynthRack } from "./components/ParametricSynthRack";
import { BatchVariationModal } from "./components/BatchVariationModal";
import { GameEngineExportModal } from "./components/GameEngineExportModal";
import {
  IconLogo,
  IconSparkles,
  IconDice,
  IconLayers,
  IconDownload,
} from "./components/icons/DuotoneIcons";

const DEFAULT_PARAMS: SynthParams = {
  category: "impact",
  seed: 42,
  duration_ms: 1200.0,
  sample_rate: 44100,
  base_freq: 380.0,
  pitch_decay: 0.2,
  decay_ms: 800.0,
  material_preset: "metal",
  damping: 0.35,
  brightness: 0.85,
  resonance: 4.5,
  noise_mix: 0.45,
  harmonic_count: 6,
  jitter_amount: 0.0,
  fm_depth: 0.0,
  fm_ratio: 1.0,
  filter_cutoff: 8000.0,
  filter_resonance: 1.2,
  drive: 0.15,
  bitcrush: 0.0,
  reverb_wet: 0.3,
  reverb_decay: 0.6,
  stereo_spread: 0.5,
};

const DEFAULT_LOOP: LoopSettings = {
  enabled: true,
  crossfade_ms: 30.0,
  crossfade_curve: "equal_power",
  reverb_tail_wrap: true,
  tail_duration_ms: 350.0,
  zero_crossing_snap: true,
  loop_start_ratio: 0.05,
  loop_end_ratio: 0.95,
};

export default function App() {
  const [params, setParams] = useState<SynthParams>(DEFAULT_PARAMS);
  const [loopSettings, setLoopSettings] = useState<LoopSettings>(DEFAULT_LOOP);
  const [audioPayload, setAudioPayload] = useState<ProcessedAudioPayload | null>(null);
  const [presets, setPresets] = useState<PresetInfo[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("impact_metal_pipe");

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSeamPlaying, setIsSeamPlaying] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Modals
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [variations, setVariations] = useState<[string, ProcessedAudioPayload][]>([]);
  const [isBatchGenerating, setIsBatchGenerating] = useState<boolean>(false);

  // Fetch factory presets on mount
  useEffect(() => {
    apiGetFactoryPresets().then((res) => {
      if (res && res.length > 0) {
        setPresets(res);
      }
    });
  }, []);

  // Synthesize audio whenever params or loop settings change
  const triggerSynthesis = useCallback(async (currentParams: SynthParams, currentLoop: LoopSettings) => {
    try {
      const payload = await apiGenerateSfx(currentParams, currentLoop);
      setAudioPayload(payload);
      await audioPlayer.loadWavBase64(payload.wav_base64, false);
      if (payload.seam_preview_base64) {
        await audioPlayer.loadWavBase64(payload.seam_preview_base64, true);
      }
    } catch (err) {
      console.error("Synthesis error:", err);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      triggerSynthesis(params, loopSettings);
    }, 40); // slight debounce for smooth slider drag
    return () => clearTimeout(timer);
  }, [params, loopSettings, triggerSynthesis]);

  // Smooth playhead animation loop
  useEffect(() => {
    const updateProgress = () => {
      if (audioPlayer.getIsPlaying()) {
        setPlaybackProgress(audioPlayer.getPlaybackProgress());
        animFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        setIsPlaying(false);
        setIsSeamPlaying(false);
      }
    };

    if (isPlaying || isSeamPlaying) {
      animFrameRef.current = requestAnimationFrame(updateProgress);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, isSeamPlaying]);

  // Play / Pause Toggle
  const handleTogglePlay = () => {
    if (isPlaying && !isSeamPlaying) {
      audioPlayer.stop();
      setIsPlaying(false);
    } else {
      audioPlayer.stop();
      setIsSeamPlaying(false);
      audioPlayer.play(loopSettings.enabled, () => {
        setIsPlaying(false);
        setPlaybackProgress(0);
      });
      setIsPlaying(true);
    }
  };

  // Audition Seam
  const handleAuditionSeam = () => {
    if (isSeamPlaying) {
      audioPlayer.stop();
      setIsSeamPlaying(false);
    } else {
      audioPlayer.stop();
      setIsPlaying(false);
      audioPlayer.playSeam(() => {
        setIsSeamPlaying(false);
      });
      setIsSeamPlaying(true);
    }
  };

  // Toggle Loop
  const handleToggleLoop = () => {
    const updated = !loopSettings.enabled;
    setLoopSettings((prev) => ({ ...prev, enabled: updated }));
    if (isPlaying) {
      audioPlayer.stop();
      audioPlayer.play(updated, () => setIsPlaying(false));
    }
  };

  // Mutate (5% seed & subtle jitter)
  const handleMutate = () => {
    setParams((prev) => {
      const newSeed = Math.floor(Math.random() * 1000000);
      const jitter = (Math.random() * 2 - 1) * 0.06;
      return {
        ...prev,
        seed: newSeed,
        base_freq: Math.max(30, prev.base_freq * (1 + jitter)),
        decay_ms: Math.max(20, prev.decay_ms * (1 + jitter * 0.5)),
      };
    });
  };

  // Complete Randomize
  const handleRandomize = () => {
    const categories = ["impact", "motor", "ui", "scifi", "footstep", "whoosh", "ambient"];
    const materials = ["metal", "wood", "glass", "stone", "flesh"];
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    const randomMat = materials[Math.floor(Math.random() * materials.length)];

    setParams({
      category: randomCat,
      seed: Math.floor(Math.random() * 1000000),
      duration_ms: Math.floor(Math.random() * 2000) + 300,
      sample_rate: 44100,
      base_freq: Math.floor(Math.random() * 2500) + 80,
      pitch_decay: Math.random() * 0.8,
      decay_ms: Math.floor(Math.random() * 1200) + 100,
      material_preset: randomMat,
      damping: Math.random() * 1.5 + 0.2,
      brightness: Math.random() * 0.8 + 0.1,
      resonance: Math.random() * 4.0 + 0.5,
      noise_mix: Math.random() * 0.6,
      harmonic_count: Math.floor(Math.random() * 8) + 1,
      jitter_amount: Math.random() * 0.2,
      fm_depth: Math.random() * 0.8,
      fm_ratio: Math.random() * 3.0 + 0.5,
      filter_cutoff: Math.floor(Math.random() * 8000) + 1000,
      filter_resonance: Math.random() * 2.5 + 0.8,
      drive: Math.random() * 0.35,
      bitcrush: Math.random() > 0.7 ? Math.random() * 0.2 : 0,
      reverb_wet: Math.random() * 0.4 + 0.05,
      reverb_decay: Math.random() * 0.6 + 0.2,
      stereo_spread: Math.random() * 0.8 + 0.2,
    });
  };

  // Load Preset
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = presets.find((p) => p.id === presetId);
    if (found) {
      setParams(found.params);
    }
  };

  // Batch Variations
  const handleGenerateVariations = async (count: number, jitter: number) => {
    setIsBatchGenerating(true);
    try {
      const res = await apiBatchVariations(params, loopSettings, count, jitter);
      setVariations(res);
    } catch (e) {
      console.error("Batch error:", e);
    } finally {
      setIsBatchGenerating(false);
    }
  };

  // Keyboard Shortcuts (Space, L, J, R, M, E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === "l" || e.key === "L") {
        handleToggleLoop();
      } else if (e.key === "j" || e.key === "J") {
        handleAuditionSeam();
      } else if (e.key === "m" || e.key === "M") {
        handleMutate();
      } else if (e.key === "r" || e.key === "R") {
        handleRandomize();
      } else if (e.key === "e" || e.key === "E") {
        setIsExportModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans select-none">
      {/* Top Navigation Bar */}
      <header className="h-16 px-6 bg-neutral-900/80 border-b border-neutral-800/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
        {/* App Title & Branding */}
        <div className="flex items-center space-x-3.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <IconLogo size={24} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold tracking-tight text-neutral-100">Axis SFX Lab</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
                v1.0.0
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-medium">Made By Mahdi Kareem © 2026</p>
          </div>
        </div>

        {/* Center: Factory Presets */}
        <div className="hidden md:flex items-center space-x-2">
          <span className="text-xs text-neutral-400 font-medium">Preset:</span>
          <select
            value={selectedPresetId}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="bg-neutral-950 text-neutral-200 border border-neutral-800 px-3 py-1.5 rounded-xl text-xs font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {presets.length > 0 ? (
              presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))
            ) : (
              <option value="impact_metal_pipe">Industrial Metal Impact</option>
            )}
          </select>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMutate}
            title="Mutate current sound slightly [M]"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer"
          >
            <IconSparkles size={15} />
            <span className="hidden sm:inline">Mutate</span>
          </button>

          <button
            onClick={handleRandomize}
            title="Completely randomize parameters [R]"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-purple-300 border border-neutral-800 hover:border-purple-500/40 transition-all cursor-pointer"
          >
            <IconDice size={15} />
            <span className="hidden sm:inline">Random</span>
          </button>

          <button
            onClick={() => setIsBatchModalOpen(true)}
            title="Generate batch variation bank"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-800/60 transition-all cursor-pointer"
          >
            <IconLayers size={15} />
            <span className="hidden sm:inline">Batch Bank</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            title="Export for Godot, Unity, Unreal [E]"
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/20 transition-all cursor-pointer"
          >
            <IconDownload size={15} />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="flex-1 p-5 md:p-6 max-w-7xl w-full mx-auto space-y-5">
        {/* Top Section: Interactive Waveform & Seam Display */}
        <WaveformViewer
          peaks={audioPayload?.waveform_peaks || []}
          durationMs={audioPayload?.duration_ms || params.duration_ms}
          sampleRate={audioPayload?.sample_rate || params.sample_rate}
          isPlaying={isPlaying}
          isSeamPlaying={isSeamPlaying}
          loopSettings={loopSettings}
          playbackProgress={playbackProgress}
          onTogglePlay={handleTogglePlay}
          onToggleLoop={handleToggleLoop}
          onAuditionSeam={handleAuditionSeam}
          onChangeLoopRange={(startRatio, endRatio) => {
            setLoopSettings((prev) => ({
              ...prev,
              loop_start_ratio: startRatio,
              loop_end_ratio: endRatio,
            }));
          }}
        />

        {/* Lower Workstation Grid: Parametric Synthesizer & Loop Control Studio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Parametric Synthesizer Rack (7 cols) */}
          <div className="lg:col-span-7">
            <ParametricSynthRack
              params={params}
              onChange={setParams}
              onMutate={handleMutate}
              onRandomize={handleRandomize}
            />
          </div>

          {/* Right Column: Seamless Loop Studio & Audio Pipeline (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <LoopControlPanel
              loopSettings={loopSettings}
              durationMs={audioPayload?.duration_ms || params.duration_ms}
              sampleRate={audioPayload?.sample_rate || params.sample_rate}
              isSeamPlaying={isSeamPlaying}
              onUpdate={setLoopSettings}
              onAuditionSeam={handleAuditionSeam}
            />

            {/* Quick Export / Drag Pill */}
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs space-y-2.5">
              <div className="flex items-center justify-between text-neutral-300 font-medium">
                <span>Direct Audio Asset</span>
                <span className="text-[10px] text-teal-400 font-mono">16-bit PCM • RIFF smpl</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Click Export or use the button below to download the game-ready audio file with loop markers.
              </p>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-medium transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <IconDownload size={15} className="text-teal-400" />
                <span>Prepare Game Engine Package</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 px-6 bg-neutral-950 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
        <div>Axis SFX Lab • Made By Mahdi Kareem © 2026</div>
        <div className="flex items-center space-x-4">
          <span>Shortcuts: [Space] Play • [L] Loop • [J] Seam • [M] Mutate • [R] Random • [E] Export</span>
        </div>
      </footer>

      {/* Batch Variation Modal */}
      <BatchVariationModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        variations={variations}
        isGenerating={isBatchGenerating}
        onGenerate={handleGenerateVariations}
      />

      {/* Game Engine Export Modal */}
      <GameEngineExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        wavBase64={audioPayload?.wav_base64 || ""}
        defaultName={`${params.category}_${params.seed}`}
        isLoopEnabled={loopSettings.enabled}
      />
    </div>
  );
}
