import React, { useState } from "react";
import { triggerBrowserDownload } from "../services/audioService";
import { IconDownload, IconFolder } from "./icons/DuotoneIcons";
import { toast } from "./ui/use-toast";

interface GameEngineExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  wavBase64: string;
  defaultName: string;
  isLoopEnabled: boolean;
}

export const GameEngineExportModal: React.FC<GameEngineExportModalProps> = ({
  isOpen,
  onClose,
  wavBase64,
  defaultName,
  isLoopEnabled,
}) => {
  const [fileName, setFileName] = useState<string>(defaultName);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [selectedEngine, setSelectedEngine] = useState<"godot" | "unity" | "unreal" | "web">("godot");

  if (!isOpen) return null;

  const handleDownload = () => {
    const finalName = fileName.endsWith(".wav") ? fileName : `${fileName}.wav`;
    triggerBrowserDownload(wavBase64, finalName);
    toast({
      title: "Audio Exported Successfully",
      description: `Saved ${finalName} with embedded RIFF smpl chunk for ${selectedEngine}.`,
      variant: "success",
    });
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

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast({
      title: "Code Copied to Clipboard",
      description: `Copied ${selectedEngine} integration blueprint snippet.`,
      variant: "default",
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <IconDownload size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">Export for Game Engines</h3>
              <p className="text-xs text-neutral-400">
                WAV with embedded RIFF smpl chunks & seamless loop tags
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

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* File Name Input */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium">Target Filename (.wav):</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 font-mono text-xs focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl font-medium text-xs bg-teal-600 hover:bg-teal-500 text-white cursor-pointer shadow-lg shadow-teal-600/20 transition-all"
              >
                <IconDownload size={15} />
                <span>Download WAV</span>
              </button>
            </div>
          </div>

          {/* Engine Tabs */}
          <div className="space-y-2 pt-2">
            <label className="text-neutral-400 font-medium">Integration Blueprint:</label>
            <div className="flex space-x-2">
              {[
                { id: "godot", label: "Godot 4" },
                { id: "unity", label: "Unity" },
                { id: "unreal", label: "Unreal Engine 5" },
                { id: "web", label: "Web Audio" },
              ].map((engine) => (
                <button
                  key={engine.id}
                  onClick={() => setSelectedEngine(engine.id as "godot" | "unity" | "unreal" | "web")}
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
                      onClick={() => copyCode(godotSnippet)}
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
                      onClick={() => copyCode(unitySnippet)}
                      className="text-[10px] text-neutral-400 hover:text-teal-300 cursor-pointer"
                    >
                      {copiedCode ? "Copied!" : "Copy C# Script"}
                    </button>
                  </div>
                  <pre className="text-neutral-400 overflow-x-auto max-h-44 whitespace-pre-wrap">
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
        <div className="p-3.5 bg-neutral-950/80 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 px-5">
          <div className="flex items-center space-x-1.5 text-neutral-400">
            <IconFolder size={15} />
            <span>{isLoopEnabled ? "Standard 16-bit PCM • RIFF smpl Chunk Embedded" : "Standard 16-bit PCM • One-Shot SFX"}</span>
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
