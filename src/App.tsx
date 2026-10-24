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
import { AppSidebar } from "./components/ui/AppSidebar";
import { ThemeSwitch } from "./components/ui/ThemeSwitch";
import { MuteCheckbox } from "./components/ui/MuteCheckbox";
import { Progress } from "./components/ui/progress";
import { Toaster } from "./components/ui/toaster";
import { toast } from "./components/ui/use-toast";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "./components/ui/menubar";
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

  // UI Theme state ("dark" | "light")
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("axis_sfx_theme") as "dark" | "light") || "dark";
  });

  // Audio mute state
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Task progress state
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [taskProgress, setTaskProgress] = useState<number>(0);

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

  // Sync theme with HTML class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
    localStorage.setItem("axis_sfx_theme", theme);
  }, [theme]);

  // Toggle theme
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Toggle mute
  const handleToggleMute = (muted: boolean) => {
    setIsMuted(muted);
    audioPlayer.setMuted(muted);
    toast({
      title: muted ? "Audio Muted" : "Audio Unmuted",
      description: muted ? "All sound output silenced." : "Sound output restored.",
      variant: "default",
    });
  };

  // Fetch factory presets on mount
  useEffect(() => {
    apiGetFactoryPresets().then((res) => {
      if (res && res.length > 0) {
        setPresets(res);
      }
    });
  }, []);

  // Synthesize audio with progress indicator
  const triggerSynthesis = useCallback(async (currentParams: SynthParams, currentLoop: LoopSettings) => {
    setIsSynthesizing(true);
    setTaskProgress(25);

    try {
      setTaskProgress(60);
      const payload = await apiGenerateSfx(currentParams, currentLoop);
      setAudioPayload(payload);
      await audioPlayer.loadWavBase64(payload.wav_base64, false);
      if (payload.seam_preview_base64) {
        await audioPlayer.loadWavBase64(payload.seam_preview_base64, true);
      }
      setTaskProgress(100);
    } catch (err) {
      console.error("Synthesis error:", err);
      toast({
        title: "Synthesis Error",
        description: "Failed to render procedural sound buffer.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsSynthesizing(false);
        setTaskProgress(0);
      }, 350);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      triggerSynthesis(params, loopSettings);
    }, 45);
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
      toast({
        title: "Auditioning Loop Seam",
        description: "Playing tightly coupled transition (last 1s into first 1s).",
        variant: "default",
      });
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
    toast({
      title: updated ? "Seamless Loop Enabled" : "One-Shot Mode Active",
      description: updated ? "Tail fold & zero-crossing snapping engaged." : "Sound will play once without looping.",
      variant: "default",
    });
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
    toast({
      title: "Mutated Parameters",
      description: "Applied 5% organic seed drift to acoustics & envelope.",
      variant: "default",
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
    toast({
      title: "Randomized All Parameters",
      description: `Generated randomized recipe for ${randomCat.toUpperCase()}.`,
      variant: "default",
    });
  };

  // Load Preset
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = presets.find((p) => p.id === presetId);
    if (found) {
      setParams(found.params);
      toast({
        title: "Preset Loaded",
        description: `Loaded "${found.name}" patch.`,
        variant: "default",
      });
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
      throw e;
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
    <div className="min-h-screen flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Application Header with shadcn Menubar & Top-Right Uiverse Theme Switch */}
      <header className="h-14 px-4 bg-neutral-900/90 border-b border-neutral-800/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
        {/* Left: Branding & shadcn Menubar */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <IconLogo size={18} />
            </div>
            <span className="text-sm font-bold tracking-tight">Axis SFX Lab</span>
          </div>

          {/* shadcn/ui Menubar */}
          <Menubar className="hidden lg:flex">
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={handleRandomize}>
                  New Random Sound <MenubarShortcut>R</MenubarShortcut>
                </MenubarItem>
                <MenubarItem onClick={() => setIsExportModalOpen(true)}>
                  Export Audio for Engine <MenubarShortcut>E</MenubarShortcut>
                </MenubarItem>
                <MenubarItem onClick={() => setIsBatchModalOpen(true)}>
                  Generate Batch Bank... <MenubarShortcut>B</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={() => window.close()}>Exit</MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            <MenubarMenu>
              <MenubarTrigger>Edit</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={handleMutate}>
                  Mutate Recipe (5%) <MenubarShortcut>M</MenubarShortcut>
                </MenubarItem>
                <MenubarItem onClick={handleRandomize}>
                  Randomize All Parameters <MenubarShortcut>R</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={() => setParams(DEFAULT_PARAMS)}>
                  Reset to Laboratory Defaults
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            <MenubarMenu>
              <MenubarTrigger>Playback</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={handleTogglePlay}>
                  {isPlaying ? "Pause Audio" : "Play Sound"} <MenubarShortcut>Space</MenubarShortcut>
                </MenubarItem>
                <MenubarItem onClick={handleToggleLoop}>
                  Toggle Seamless Loop <MenubarShortcut>L</MenubarShortcut>
                </MenubarItem>
                <MenubarItem onClick={handleAuditionSeam}>
                  Audition Seam Junction <MenubarShortcut>J</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={() => handleToggleMute(!isMuted)}>
                  {isMuted ? "Unmute Sound" : "Mute Sound"}
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            <MenubarMenu>
              <MenubarTrigger>Engine</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => setIsExportModalOpen(true)}>
                  Godot 4 (RIFF smpl) Blueprint
                </MenubarItem>
                <MenubarItem onClick={() => setIsExportModalOpen(true)}>
                  Unity (AudioSettings.dspTime) Blueprint
                </MenubarItem>
                <MenubarItem onClick={() => setIsExportModalOpen(true)}>
                  Unreal 5 MetaSounds Template
                </MenubarItem>
                <MenubarItem onClick={() => setIsExportModalOpen(true)}>
                  HTML5 WebAudio Gapless Code
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            <MenubarMenu>
              <MenubarTrigger>View</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                  Toggle Preset Sidebar
                </MenubarItem>
                <MenubarItem onClick={handleToggleTheme}>
                  Switch Theme ({theme === "dark" ? "Light" : "Dark"})
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>

        {/* Right: Actions, Uiverse Catraco Mute Checkbox, and Uiverse Metanef Theme Switch in Top-Right Corner */}
        <div className="flex items-center space-x-3">
          {/* Quick Action Buttons */}
          <div className="hidden sm:flex items-center space-x-1.5">
            <button
              onClick={handleMutate}
              title="Mutate current sound [M]"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-neutral-950/60 hover:bg-neutral-800 text-amber-300 border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer"
            >
              <IconSparkles size={14} />
              <span>Mutate</span>
            </button>

            <button
              onClick={handleRandomize}
              title="Randomize parameters [R]"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-neutral-950/60 hover:bg-neutral-800 text-purple-300 border border-neutral-800 hover:border-purple-500/40 transition-all cursor-pointer"
            >
              <IconDice size={14} />
              <span>Random</span>
            </button>

            <button
              onClick={() => setIsBatchModalOpen(true)}
              title="Generate batch variation bank"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-800/60 transition-all cursor-pointer"
            >
              <IconLayers size={14} />
              <span>Batch</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              title="Export for Godot, Unity, Unreal [E]"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              <IconDownload size={14} />
              <span>Export</span>
            </button>
          </div>

          {/* Uiverse.io Checkbox by catraco (dry-robin-61) for Mute/Unmute */}
          <div className="flex items-center pl-1 border-l border-neutral-800">
            <MuteCheckbox isMuted={isMuted} onToggle={handleToggleMute} />
          </div>

          {/* Uiverse.io Button by metanef (stupid-horse-86) placed in top right corner */}
          <div className="pl-1 border-l border-neutral-800">
            <ThemeSwitch theme={theme} onToggle={handleToggleTheme} />
          </div>
        </div>
      </header>

      {/* Main Workspace with shadcn/ui Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* shadcn/ui Sidebar */}
        <AppSidebar
          currentCategory={params.category}
          onSelectCategory={(cat) => setParams((p) => ({ ...p, category: cat }))}
          presets={presets}
          selectedPresetId={selectedPresetId}
          onSelectPreset={handleSelectPreset}
          onOpenBatch={() => setIsBatchModalOpen(true)}
          onOpenExport={() => setIsExportModalOpen(true)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          theme={theme}
        />

        {/* Studio Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* shadcn/ui Task Progress Bar (active when synthesizing / rendering) */}
          {isSynthesizing && (
            <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-1.5 animate-in fade-in">
              <div className="flex justify-between text-xs font-mono text-cyan-400">
                <span>Task in progress: Re-synthesizing DSP audio buffer...</span>
                <span>{taskProgress}%</span>
              </div>
              <Progress value={taskProgress} className="h-1.5" />
            </div>
          )}

          {/* Waveform Viewer with shadcn/ui Slider Playback Scrubber */}
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
            onSeek={(ratio) => {
              audioPlayer.seek(ratio);
              setPlaybackProgress(ratio);
            }}
            onChangeLoopRange={(startRatio, endRatio) => {
              setLoopSettings((prev) => ({
                ...prev,
                loop_start_ratio: startRatio,
                loop_end_ratio: endRatio,
              }));
            }}
          />

          {/* Lower Grid: Parametric Synthesizer & Seamless Loop Studio */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Parametric Synthesizer Rack with shadcn/ui Select (7 cols) */}
            <div className="lg:col-span-7">
              <ParametricSynthRack
                params={params}
                onChange={setParams}
                onMutate={handleMutate}
                onRandomize={handleRandomize}
              />
            </div>

            {/* Right: Seamless Loop Studio with shadcn/ui Select (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <LoopControlPanel
                loopSettings={loopSettings}
                durationMs={audioPayload?.duration_ms || params.duration_ms}
                sampleRate={audioPayload?.sample_rate || params.sample_rate}
                isSeamPlaying={isSeamPlaying}
                onUpdate={setLoopSettings}
                onAuditionSeam={handleAuditionSeam}
              />

              {/* Engine Asset Pill */}
              <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs space-y-2.5">
                <div className="flex items-center justify-between text-neutral-300 font-medium">
                  <span>Engine Asset Pipeline</span>
                  <span className="text-[10px] text-teal-400 font-mono">RIFF smpl Auto-Loop</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Export ready-to-use audio assets directly into Godot, Unity, or Unreal Engine with seamless loop metadata.
                </p>
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-medium transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <IconDownload size={15} className="text-teal-400" />
                  <span>Configure Game Engine Export</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer Status Bar */}
      <footer className="h-8 px-4 bg-neutral-950 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-400 font-mono z-20">
        <div>Axis SFX Lab • Made By Mahdi Kareem © 2026</div>
        <div className="flex items-center space-x-4">
          <span>Shortcuts: [Space] Play • [L] Loop • [J] Seam • [M] Mutate • [R] Random • [E] Export</span>
        </div>
      </footer>

      {/* Modals */}
      <BatchVariationModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        variations={variations}
        isGenerating={isBatchGenerating}
        onGenerate={handleGenerateVariations}
      />

      <GameEngineExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        wavBase64={audioPayload?.wav_base64 || ""}
        defaultName={`${params.category}_${params.seed}`}
        isLoopEnabled={loopSettings.enabled}
      />

      {/* shadcn/ui Toaster component */}
      <Toaster />
    </div>
  );
}
