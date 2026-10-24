import React, { useState, useEffect } from "react";
import {
  SynthParams,
  LoopSettings,
  CustomExportConfig,
  CustomExportResult,
  apiExportCustom,
  triggerBrowserDownload,
  triggerTextDownload,
} from "../services/audioService";
import {
  IconDownload,
  IconFolder,
  IconCode,
  IconFileAudio,
  IconCheck,
  IconLayers,
} from "./icons/DuotoneIcons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "./ui/use-toast";

interface GameEngineExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  wavBase64: string;
  defaultName: string;
  isLoopEnabled: boolean;
  params: SynthParams;
  loopSettings: LoopSettings;
}

export const GameEngineExportModal: React.FC<GameEngineExportModalProps> = ({
  isOpen,
  onClose,
  wavBase64: _wavBase64,
  defaultName,
  isLoopEnabled,
  params,
  loopSettings,
}) => {
  const [fileName, setFileName] = useState<string>(defaultName);
  const [format, setFormat] = useState<string>("wav16");
  const [sampleRate, setSampleRate] = useState<number>(48000);
  const [isMono, setIsMono] = useState<boolean>(false);
  const [normalizePeak, setNormalizePeak] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportResult, setExportResult] = useState<CustomExportResult | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [selectedEngine, setSelectedEngine] = useState<"godot" | "unity" | "unreal" | "raylib" | "web">("godot");

  // Keep fileName synced when defaultName changes
  useEffect(() => {
    if (defaultName) {
      setFileName(defaultName);
    }
  }, [defaultName]);

  // Execute export calculation via DSP backend
  const executeExport = async (): Promise<CustomExportResult | null> => {
    setIsExporting(true);
    try {
      const bitDepth = format === "wav24" ? 24 : format === "wav32" ? 32 : 16;
      const config: CustomExportConfig = {
        format,
        bit_depth: bitDepth,
        is_mono: isMono,
        target_sample_rate: sampleRate,
        normalize_peak: normalizePeak,
        base_name: fileName.replace(/[^a-zA-Z0-9_-]/g, "_"),
      };

      const result = await apiExportCustom(params, loopSettings, config);
      setExportResult(result);
      return result;
    } catch (err) {
      console.error("Custom export failed:", err);
      toast({
        title: "Export Error",
        description: "Failed to render custom audio format.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  // Re-render export when format or settings change
  useEffect(() => {
    if (isOpen) {
      executeExport();
    }
  }, [isOpen, format, sampleRate, isMono, normalizePeak, fileName]);

  if (!isOpen) return null;

  // Single file download
  const handleDownloadMain = async () => {
    let res = exportResult;
    if (!res) {
      res = await executeExport();
    }
    if (!res) return;

    if (format === "cheader") {
      triggerTextDownload(res.c_header_text || atob(res.main_base64), res.main_filename);
    } else {
      triggerBrowserDownload(res.main_base64, res.main_filename, res.mime_type);
    }

    toast({
      title: "File Exported Successfully",
      description: `Saved ${res.main_filename} (${sampleRate}Hz, ${isMono ? "Mono" : "Stereo"}).`,
      variant: "success",
    });
  };

  // Godot bundle download
  const handleDownloadGodotBundle = async () => {
    let res = exportResult;
    if (!res) res = await executeExport();
    if (!res) return;

    // Download WAV
    triggerBrowserDownload(res.main_base64, res.main_filename, "audio/wav");

    // Download .import sidecar
    if (res.godot_import_text) {
      setTimeout(() => {
        triggerTextDownload(res.godot_import_text!, `${res.main_filename}.import`);
      }, 200);
    }

    toast({
      title: "Godot 4 Asset Bundle Exported",
      description: `Saved ${res.main_filename} and matching ${res.main_filename}.import auto-loop metadata.`,
      variant: "success",
    });
  };

  // Download all stems
  const handleDownloadAllStems = async () => {
    let res = exportResult;
    if (!res) res = await executeExport();
    if (!res) return;

    if (res.stem_intro_base64 && res.stem_intro_name) {
      triggerBrowserDownload(res.stem_intro_base64, res.stem_intro_name, "audio/wav");
    }
    if (res.stem_loop_base64 && res.stem_loop_name) {
      setTimeout(() => {
        triggerBrowserDownload(res.stem_loop_base64!, res.stem_loop_name!, "audio/wav");
      }, 200);
    }
    if (res.stem_tail_base64 && res.stem_tail_name) {
      setTimeout(() => {
        triggerBrowserDownload(res.stem_tail_base64!, res.stem_tail_name!, "audio/wav");
      }, 400);
    }
    if (res.main_base64 && res.main_filename) {
      setTimeout(() => {
        triggerBrowserDownload(res.main_base64, res.main_filename, "audio/wav");
      }, 600);
    }

    toast({
      title: "Multi-Stem Bundle Exported",
      description: "Downloaded _intro, _loop, _tail stems and master mix.",
      variant: "success",
    });
  };

  const copyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast({
      title: "Copied to Clipboard",
      description: `Copied ${label} snippet.`,
      variant: "default",
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const unitySnippet = `// Double-Buffered Seamless Loop Handoff for Unity
using UnityEngine;

public class SeamlessLoopPlayer : MonoBehaviour
{
    public AudioSource[] sources = new AudioSource[2];
    public AudioClip clip;
    private double nextEventTime;
    private int flip = 0;

    void Start()
    {
        double duration = (double)clip.samples / clip.frequency;
        nextEventTime = AudioSettings.dspTime + 0.1;
        
        sources[flip].clip = clip;
        sources[flip].PlayScheduled(nextEventTime);
        nextEventTime += duration;
        flip = 1 - flip;
    }

    void Update()
    {
        if (AudioSettings.dspTime + 0.5 > nextEventTime)
        {
            sources[flip].clip = clip;
            sources[flip].PlayScheduled(nextEventTime);
            double duration = (double)clip.samples / clip.frequency;
            nextEventTime += duration;
            flip = 1 - flip;
        }
    }
}`;

  const godotSnippet = `# Godot 4.x Native smpl Loop Detection
# 1. Place the exported .wav in your Godot project folder.
# 2. Select the file in FileSystem dock -> go to Import tab.
# 3. Ensure 'Loop Mode' is set to 'Detect From WAV'.
# 4. Godot will automatically read the RIFF 'smpl' chunk loop points!
var player = AudioStreamPlayer.new()
player.stream = preload("res://${fileName}.wav")
add_child(player)
player.play()`;

  const raylibSnippet = `// Raylib C/C++ In-Memory Audio Playback
#include "raylib.h"
#include "${fileName}.h"

int main() {
    InitAudioDevice();
    Wave wave = {
        .frameCount = SFX_${fileName.toUpperCase()}_NUM_SAMPLES,
        .sampleRate = SFX_${fileName.toUpperCase()}_SAMPLE_RATE,
        .sampleSize = 16,
        .channels = 1,
        .data = (void*)SFX_${fileName.toUpperCase()}_DATA
    };
    Sound sfx = LoadSoundFromWave(wave);
    PlaySound(sfx);
    // ...
    UnloadSound(sfx);
    CloseAudioDevice();
    return 0;
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <IconDownload size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">Game Engine & Asset Export Hub</h3>
              <p className="text-xs text-neutral-400">
                Multi-Bitdepth WAV, C/C++ Headers, Godot 4 Bundles & Multi-Stem Splits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-100 text-lg px-2 py-1 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Format Selector Grid */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium">Export Format & Architecture:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                {
                  id: "wav16",
                  name: "WAV 16-bit PCM",
                  desc: "Universal standard + smpl loop points",
                  badge: "Unity / Unreal",
                },
                {
                  id: "wav24",
                  name: "WAV 24-bit PCM",
                  desc: "Studio dynamic range for mastering",
                  badge: "High-Res DAW",
                },
                {
                  id: "wav32",
                  name: "WAV 32-bit Float",
                  desc: "Zero-clipping IEEE 754 precision",
                  badge: "Next-Gen Audio",
                },
                {
                  id: "godot_bundle",
                  name: "Godot 4 Asset Bundle",
                  desc: ".wav + auto-configured .import sidecar",
                  badge: "Godot 4.x Native",
                },
                {
                  id: "cheader",
                  name: "C / C++ Header (.h)",
                  desc: "Embeddable static array for Raylib/C++",
                  badge: "Raylib / Pico / Bevy",
                },
                {
                  id: "stems",
                  name: "Multi-Stem Loop Split",
                  desc: "Separate _intro, _loop, and _tail files",
                  badge: "Interactive Foley",
                },
              ].map((f) => {
                const active = format === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      active
                        ? "bg-teal-500/15 border-teal-500/50 text-neutral-100 shadow-sm"
                        : "bg-neutral-950/60 border-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold text-xs ${active ? "text-teal-300" : "text-neutral-200"}`}>
                          {f.name}
                        </span>
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-teal-400">
                          {f.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400 leading-tight">{f.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export Settings Row: Sample Rate, Channels, Normalization */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            {/* Target Sample Rate */}
            <div className="space-y-1">
              <label className="text-neutral-400 text-[11px] font-medium">Sample Rate:</label>
              <Select
                value={sampleRate.toString()}
                onValueChange={(val) => setSampleRate(parseInt(val))}
              >
                <SelectTrigger className="h-8 text-xs bg-neutral-900 border-neutral-800 text-cyan-300">
                  <SelectValue placeholder="Sample Rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="48000">48,000 Hz (Game & Cinema)</SelectItem>
                  <SelectItem value="44100">44,100 Hz (CD & Web)</SelectItem>
                  <SelectItem value="22050">22,050 Hz (Retro & Compact)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Channels: Stereo vs Mono */}
            <div className="space-y-1">
              <label className="text-neutral-400 text-[11px] font-medium">Channels:</label>
              <Select
                value={isMono ? "mono" : "stereo"}
                onValueChange={(val) => setIsMono(val === "mono")}
              >
                <SelectTrigger className="h-8 text-xs bg-neutral-900 border-neutral-800 text-cyan-300">
                  <SelectValue placeholder="Channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stereo">Stereo (2 Channels)</SelectItem>
                  <SelectItem value="mono">Mono (1 Channel, 3D Spatial)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Peak Normalization */}
            <div className="space-y-1">
              <label className="text-neutral-400 text-[11px] font-medium">Headroom Limiter:</label>
              <button
                onClick={() => setNormalizePeak(!normalizePeak)}
                className={`w-full h-8 px-2.5 rounded-md border text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  normalizePeak
                    ? "bg-teal-500/15 border-teal-500/40 text-teal-300"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400"
                }`}
              >
                <span>Normalize -0.2 dBFS</span>
                {normalizePeak ? <IconCheck size={14} /> : <span className="text-[10px]">OFF</span>}
              </button>
            </div>
          </div>

          {/* Target File Name and Primary Action */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium">Target Filename Base:</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 font-mono text-xs focus:outline-none focus:border-teal-500"
                placeholder="sound_effect_name"
              />

              {format === "godot_bundle" && (
                <button
                  onClick={handleDownloadGodotBundle}
                  disabled={isExporting}
                  className="flex items-center justify-center space-x-2 px-5 py-2 rounded-xl font-medium text-xs bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white cursor-pointer shadow-lg shadow-teal-600/20 transition-all shrink-0"
                >
                  <IconDownload size={15} />
                  <span>Download Godot Asset (.wav + .import)</span>
                </button>
              )}

              {format === "stems" && (
                <button
                  onClick={handleDownloadAllStems}
                  disabled={isExporting}
                  className="flex items-center justify-center space-x-2 px-5 py-2 rounded-xl font-medium text-xs bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white cursor-pointer shadow-lg shadow-teal-600/20 transition-all shrink-0"
                >
                  <IconLayers size={15} />
                  <span>Download All Stems (4 Files)</span>
                </button>
              )}

              {format !== "godot_bundle" && format !== "stems" && (
                <button
                  onClick={handleDownloadMain}
                  disabled={isExporting}
                  className="flex items-center justify-center space-x-2 px-5 py-2 rounded-xl font-medium text-xs bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white cursor-pointer shadow-lg shadow-teal-600/20 transition-all shrink-0"
                >
                  <IconDownload size={15} />
                  <span>{format === "cheader" ? "Download Header (.h)" : "Download WAV"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Stem Sub-Files Preview when 'stems' format selected */}
          {format === "stems" && exportResult && (
            <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-2">
              <div className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider">
                Individual Stem Audio Files:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() =>
                    exportResult.stem_intro_base64 &&
                    triggerBrowserDownload(exportResult.stem_intro_base64, exportResult.stem_intro_name || "intro.wav", "audio/wav")
                  }
                  className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-left text-xs text-neutral-300 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-mono truncate">{exportResult.stem_intro_name}</span>
                  <IconDownload size={13} className="text-teal-400 shrink-0 ml-1" />
                </button>
                <button
                  onClick={() =>
                    exportResult.stem_loop_base64 &&
                    triggerBrowserDownload(exportResult.stem_loop_base64, exportResult.stem_loop_name || "loop.wav", "audio/wav")
                  }
                  className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-left text-xs text-neutral-300 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-mono truncate">{exportResult.stem_loop_name}</span>
                  <IconDownload size={13} className="text-teal-400 shrink-0 ml-1" />
                </button>
                <button
                  onClick={() =>
                    exportResult.stem_tail_base64 &&
                    triggerBrowserDownload(exportResult.stem_tail_base64, exportResult.stem_tail_name || "tail.wav", "audio/wav")
                  }
                  className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-left text-xs text-neutral-300 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-mono truncate">{exportResult.stem_tail_name}</span>
                  <IconDownload size={13} className="text-teal-400 shrink-0 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Live Code Box for C Header */}
          {format === "cheader" && exportResult?.c_header_text && (
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 font-mono text-[11px] space-y-2 text-neutral-300">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-teal-400 font-sans text-xs font-medium">
                <span className="flex items-center space-x-1.5">
                  <IconCode size={15} />
                  <span>C / C++ Embeddable Header Preview</span>
                </span>
                <button
                  onClick={() => copyCode(exportResult.c_header_text!, "C/C++ Header")}
                  className="text-[10px] text-neutral-400 hover:text-teal-300 cursor-pointer"
                >
                  {copiedCode ? "Copied!" : "Copy Entire Header"}
                </button>
              </div>
              <pre className="text-neutral-400 overflow-x-auto max-h-40 whitespace-pre font-mono text-[10px]">
                {exportResult.c_header_text.slice(0, 1200)}...
              </pre>
            </div>
          )}

          {/* Live Code Box for Godot .import */}
          {format === "godot_bundle" && exportResult?.godot_import_text && (
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 font-mono text-[11px] space-y-2 text-neutral-300">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-teal-400 font-sans text-xs font-medium">
                <span className="flex items-center space-x-1.5">
                  <IconFileAudio size={15} />
                  <span>Godot 4 Auto-Import Metadata (.wav.import)</span>
                </span>
                <button
                  onClick={() => copyCode(exportResult.godot_import_text!, "Godot .import")}
                  className="text-[10px] text-neutral-400 hover:text-teal-300 cursor-pointer"
                >
                  {copiedCode ? "Copied!" : "Copy .import Code"}
                </button>
              </div>
              <pre className="text-neutral-400 overflow-x-auto whitespace-pre font-mono text-[10px]">
                {exportResult.godot_import_text}
              </pre>
            </div>
          )}

          {/* Engine Integration Blueprints */}
          <div className="space-y-2 pt-1">
            <label className="text-neutral-400 font-medium">Game Engine Integration Blueprints:</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "godot", label: "Godot 4" },
                { id: "unity", label: "Unity" },
                { id: "unreal", label: "Unreal Engine 5" },
                { id: "raylib", label: "Raylib / C++" },
                { id: "web", label: "Web Audio" },
              ].map((engine) => (
                <button
                  key={engine.id}
                  onClick={() => setSelectedEngine(engine.id as "godot" | "unity" | "unreal" | "raylib" | "web")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedEngine === engine.id
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                      : "bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800"
                  }`}
                >
                  {engine.label}
                </button>
              ))}
            </div>

            {/* Integration Details per Engine */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 font-mono text-[11px] space-y-2 text-neutral-300">
              {selectedEngine === "godot" && (
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-teal-400 font-sans text-xs font-medium">
                    <span>Godot 4 Native WAV 'smpl' Loop Integration</span>
                    <button
                      onClick={() => copyCode(godotSnippet, "Godot GDScript")}
                      className="text-[10px] text-neutral-400 hover:text-teal-300 cursor-pointer"
                    >
                      {copiedCode ? "Copied!" : "Copy Code"}
                    </button>
                  </div>
                  <pre className="text-neutral-400 overflow-x-auto whitespace-pre-wrap">{godotSnippet}</pre>
                </div>
              )}

              {selectedEngine === "unity" && (
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-teal-400 font-sans text-xs font-medium">
                    <span>Unity Double-Buffered DSP PlayScheduled Script</span>
                    <button
                      onClick={() => copyCode(unitySnippet, "Unity C#")}
                      className="text-[10px] text-neutral-400 hover:text-teal-300 cursor-pointer"
                    >
                      {copiedCode ? "Copied!" : "Copy C# Script"}
                    </button>
                  </div>
                  <pre className="text-neutral-400 overflow-x-auto max-h-40 whitespace-pre-wrap">
                    {unitySnippet}
                  </pre>
                </div>
              )}

              {selectedEngine === "unreal" && (
                <div className="font-sans text-xs text-neutral-300 space-y-2">
                  <p className="font-semibold text-teal-400">Unreal Engine 5 / MetaSounds:</p>
                  <p className="text-neutral-400">
                    Import this WAV directly into Content Browser. In your MetaSound graph, feed the SoundWave into a
                    <code className="text-teal-300 mx-1">Wave Player</code> node. The folded tail ensures seamless repeating with zero gap or phase cancellation.
                  </p>
                </div>
              )}

              {selectedEngine === "raylib" && (
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-teal-400 font-sans text-xs font-medium">
                    <span>Raylib C/C++ Static Header Playback</span>
                    <button
                      onClick={() => copyCode(raylibSnippet, "Raylib C++")}
                      className="text-[10px] text-neutral-400 hover:text-teal-300 cursor-pointer"
                    >
                      {copiedCode ? "Copied!" : "Copy C++ Code"}
                    </button>
                  </div>
                  <pre className="text-neutral-400 overflow-x-auto whitespace-pre-wrap">{raylibSnippet}</pre>
                </div>
              )}

              {selectedEngine === "web" && (
                <div className="font-sans text-xs text-neutral-300 space-y-2">
                  <p className="font-semibold text-teal-400">HTML5 / WebAudio Gapless Playback:</p>
                  <p className="text-neutral-400">
                    Use <code className="text-teal-300">source.loop = true</code> with AudioBufferSourceNode. The zero-crossing and equal-power crossfade baked into the WAV buffer ensure zero click on boundary repeat.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-neutral-950/80 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 px-5 shrink-0">
          <div className="flex items-center space-x-1.5 text-neutral-400">
            <IconFolder size={15} />
            <span>
              {isLoopEnabled
                ? `${sampleRate}Hz • ${isMono ? "Mono" : "Stereo"} • RIFF smpl Loop Point Embedded`
                : `${sampleRate}Hz • ${isMono ? "Mono" : "Stereo"} • One-Shot SFX`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:bg-neutral-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
