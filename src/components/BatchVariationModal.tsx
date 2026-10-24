import React, { useState } from "react";
import {
  ProcessedAudioPayload,
  triggerBrowserDownload,
  audioPlayer,
} from "../services/audioService";
import { IconLayers, IconPlay, IconStop, IconDownload, IconCheck } from "./icons/DuotoneIcons";
import { Progress } from "./ui/progress";
import { toast } from "./ui/use-toast";

interface BatchVariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  variations: [string, ProcessedAudioPayload][];
  isGenerating: boolean;
  onGenerate: (count: number, jitter: number) => Promise<void>;
}

export const BatchVariationModal: React.FC<BatchVariationModalProps> = ({
  isOpen,
  onClose,
  variations,
  isGenerating,
  onGenerate,
}) => {
  const [selectedCount, setSelectedCount] = useState<number>(8);
  const [jitter, setJitter] = useState<number>(0.08); // 8% jitter
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [progressValue, setProgressValue] = useState<number>(0);

  if (!isOpen) return null;

  const handlePlayVariation = async (idx: number, b64: string) => {
    if (playingIdx === idx) {
      audioPlayer.stop();
      setPlayingIdx(null);
      return;
    }

    setPlayingIdx(idx);
    await audioPlayer.loadWavBase64(b64);
    audioPlayer.play(false, () => setPlayingIdx(null));
  };

  const handleDownloadSingle = (name: string, b64: string) => {
    triggerBrowserDownload(b64, `${name}.wav`);
    toast({
      title: "Audio Exported",
      description: `Downloaded ${name}.wav`,
      variant: "default",
    });
  };

  const handleDownloadAll = () => {
    variations.forEach(([name, payload], i) => {
      setTimeout(() => {
        triggerBrowserDownload(payload.wav_base64, `${name}.wav`);
      }, i * 150);
    });

    toast({
      title: "Batch Export Complete",
      description: `Downloaded ${variations.length} variations with smpl loop markers`,
      variant: "success",
    });
  };

  const handleTriggerGenerate = async () => {
    setProgressValue(20);
    const interval = setInterval(() => {
      setProgressValue((prev) => (prev < 90 ? prev + 15 : prev));
    }, 120);

    try {
      await onGenerate(selectedCount, jitter);
      setProgressValue(100);
      toast({
        title: "Task Completed",
        description: `Generated ${selectedCount} unique organic variations.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Generation Failed",
        description: "An error occurred while compiling variations.",
        variant: "destructive",
      });
    } finally {
      clearInterval(interval);
      setTimeout(() => setProgressValue(0), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <IconLayers size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">Batch Variation Vault</h3>
              <p className="text-xs text-neutral-400">
                Generate multiple organic iterations to eradicate player audio fatigue
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

        {/* Generator Controls */}
        <div className="p-4 bg-neutral-950/60 border-b border-neutral-800/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-neutral-300 font-medium">Quantity:</span>
                <div className="flex rounded-lg bg-neutral-900 p-0.5 border border-neutral-800">
                  {[4, 8, 16].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => setSelectedCount(cnt)}
                      className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-all ${
                        selectedCount === cnt
                          ? "bg-indigo-600 text-white"
                          : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-neutral-300 font-medium">Variation Spread:</span>
                <span className="text-xs font-mono text-indigo-300">{(jitter * 100).toFixed(0)}%</span>
                <input
                  type="range"
                  min="0.02"
                  max="0.25"
                  step="0.01"
                  value={jitter}
                  onChange={(e) => setJitter(parseFloat(e.target.value))}
                  className="w-24 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={isGenerating}
                onClick={handleTriggerGenerate}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? "Synthesizing..." : "Generate Variations"}
              </button>

              {variations.length > 0 && (
                <button
                  onClick={handleDownloadAll}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 cursor-pointer transition-all"
                >
                  <IconDownload size={14} />
                  <span>Export All ({variations.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Task Progress Bar (shadcn/ui Progress) */}
          {isGenerating && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                <span>Task in progress: Synthesizing DSP variations...</span>
                <span>{progressValue}%</span>
              </div>
              <Progress value={progressValue} className="h-1.5 bg-neutral-900" />
            </div>
          )}
        </div>

        {/* Variations List */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
          {variations.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              No variations generated yet. Click "Generate Variations" above to produce a bank.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {variations.map(([name, payload], idx) => {
                const isThisPlaying = playingIdx === idx;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isThisPlaying
                        ? "bg-indigo-950/40 border-indigo-500/50"
                        : "bg-neutral-950/80 border-neutral-800/80 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handlePlayVariation(idx, payload.wav_base64)}
                        className={`p-2 rounded-lg cursor-pointer transition-all ${
                          isThisPlaying
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                        }`}
                      >
                        {isThisPlaying ? <IconStop size={14} /> : <IconPlay size={14} />}
                      </button>
                      <div>
                        <div className="text-xs font-mono font-medium text-neutral-200">{name}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {payload.duration_ms.toFixed(0)}ms • {payload.sample_rate}Hz
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadSingle(name, payload.wav_base64)}
                      title="Download this variation"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-teal-300 hover:bg-neutral-800 cursor-pointer transition-all"
                    >
                      <IconDownload size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-950/80 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 px-5">
          <div className="flex items-center space-x-1 text-emerald-400">
            <IconCheck size={14} />
            <span>Ready for engine sound containers & randomizers</span>
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
