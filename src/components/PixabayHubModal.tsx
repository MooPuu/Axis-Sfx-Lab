import React, { useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  processRealAudioArrayBuffer,
  ProcessedAudioPayload,
  RealSoundItem,
  apiSearchCloudSounds,
  apiDownloadCloudSound,
  base64ToArrayBuffer,
} from "../services/audioService";
import { toast } from "./ui/use-toast";

interface PixabayHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadRealAudio: (payload: ProcessedAudioPayload, soundName: string) => void;
  bundledRealSounds: RealSoundItem[];
  theme: "dark" | "light";
}

interface CloudSearchResult {
  id: string;
  name: string;
  description: string;
  tags: string[];
  duration: number;
  stream_url: string;
}

export const PixabayHubModal: React.FC<PixabayHubModalProps> = ({
  isOpen,
  onClose,
  onLoadRealAudio,
  bundledRealSounds,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<"bundled" | "search" | "import">(
    "bundled"
  );
  const [pixabayQuery, setPixabayQuery] = useState("");
  const [cloudQuery, setCloudQuery] = useState("");
  const [cloudResults, setCloudResults] = useState<CloudSearchResult[]>([]);
  const [isSearchingCloud, setIsSearchingCloud] = useState(false);
  const [loadingSoundId, setLoadingSoundId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleOpenPixabay = async (categoryOrSearch?: string) => {
    let url = "https://pixabay.com/sound-effects/";
    if (categoryOrSearch) {
      url = `https://pixabay.com/sound-effects/search/${encodeURIComponent(
        categoryOrSearch
      )}/`;
    }
    try {
      await openUrl(url);
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleSearchCloud = async (q: string) => {
    if (!q.trim()) return;
    setIsSearchingCloud(true);
    try {
      const resp = await apiSearchCloudSounds(q, 16);
      if (resp && resp.data) {
        setCloudResults(resp.data);
      } else {
        setCloudResults([]);
      }
    } catch (e) {
      console.error("Cloud search error:", e);
      toast({
        title: "Search Error",
        description: "Could not fetch cloud sounds. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearchingCloud(false);
    }
  };

  const handleLoadCloudSound = async (item: CloudSearchResult) => {
    setLoadingSoundId(item.id);
    try {
      const base64 = await apiDownloadCloudSound(item.id);
      const arrayBuffer = base64ToArrayBuffer(base64);
      const payload = await processRealAudioArrayBuffer(arrayBuffer);

      onLoadRealAudio(payload, item.name);
      toast({
        title: "Real Sound Loaded",
        description: `Loaded authentic studio sound "${item.name}" into Workstation.`,
        variant: "default",
      });
      onClose();
    } catch (err) {
      console.error("Failed to load cloud sound:", err);
      toast({
        title: "Failed to Load Sound",
        description: "Could not download and process this audio track.",
        variant: "destructive",
      });
    } finally {
      setLoadingSoundId(null);
    }
  };

  const handleLoadBundledSound = async (item: RealSoundItem) => {
    setLoadingSoundId(item.id);
    try {
      const resp = await fetch(item.file);
      const arrayBuffer = await resp.arrayBuffer();
      const payload = await processRealAudioArrayBuffer(arrayBuffer);

      onLoadRealAudio(payload, item.name);
      toast({
        title: "Studio Sound Loaded",
        description: `Loaded authentic recording "${item.name}" into Workstation.`,
        variant: "default",
      });
      onClose();
    } catch (err) {
      console.error("Failed to load bundled sound:", err);
      toast({
        title: "Failed to Load Sound",
        description: "Could not load audio file from disk.",
        variant: "destructive",
      });
    } finally {
      setLoadingSoundId(null);
    }
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await handleProcessFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await handleProcessFile(file);
    }
  };

  const handleProcessFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const payload = await processRealAudioArrayBuffer(arrayBuffer);
      const cleanName = file.name.replace(/\.[^/.]+$/, "");

      onLoadRealAudio(payload, cleanName);
      toast({
        title: "Real SFX Imported",
        description: `Successfully decoded "${file.name}" into Workstation.`,
        variant: "default",
      });
      onClose();
    } catch (err) {
      console.error("Error decoding dropped file:", err);
      toast({
        title: "Audio Decode Error",
        description: "Could not decode file as valid MP3, WAV, or OGG audio.",
        variant: "destructive",
      });
    }
  };

  const pixabayQuickCategories = [
    { name: "Footsteps & Steps", query: "footsteps", icon: "🦶" },
    { name: "Whooshes & Swipes", query: "whoosh", icon: "💨" },
    { name: "UI Notifications", query: "ui notification", icon: "🔔" },
    { name: "Clicks & Switches", query: "click", icon: "🖱️" },
    { name: "Keyboard Typing", query: "typing", icon: "⌨️" },
    { name: "Rain & Thunder", query: "rain", icon: "🌧️" },
    { name: "Impacts & Hits", query: "impact", icon: "💥" },
    { name: "Explosions & Blasts", query: "explosion", icon: "💣" },
    { name: "Weapons & Guns", query: "weapon", icon: "🔫" },
    { name: "Glitch & Sci-Fi", query: "glitch", icon: "👾" },
    { name: "Ambient Drones", query: "ambient", icon: "🌌" },
    { name: "Retro 8-Bit", query: "retro", icon: "🕹️" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
          theme === "light"
            ? "bg-white border-slate-300 text-slate-900"
            : "bg-neutral-900 border-neutral-800 text-neutral-100"
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between ${
            theme === "light"
              ? "bg-slate-50 border-slate-200"
              : "bg-neutral-950/70 border-neutral-800"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-md">
              🌐
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center space-x-2">
                <span>Pixabay Sound Effects & Real Audio Hub</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Real SFX
                </span>
              </h2>
              <p
                className={`text-xs ${
                  theme === "light" ? "text-slate-500" : "text-neutral-400"
                }`}
              >
                Access real studio-recorded sound effects directly from Pixabay
                and the CC0 Sound Library.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              theme === "light"
                ? "hover:bg-slate-200 text-slate-500 hover:text-slate-800"
                : "hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          className={`flex border-b px-4 sm:px-5 space-x-2 text-xs font-semibold ${
            theme === "light"
              ? "bg-slate-100/60 border-slate-200"
              : "bg-neutral-950/40 border-neutral-800"
          }`}
        >
          <button
            onClick={() => setActiveTab("bundled")}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "bundled"
                ? theme === "light"
                  ? "border-emerald-600 text-emerald-700 font-bold"
                  : "border-emerald-500 text-emerald-400 font-bold"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            <span>🎙️</span>
            <span>Bundled Studio Real Sounds ({bundledRealSounds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("search")}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "search"
                ? theme === "light"
                  ? "border-emerald-600 text-emerald-700 font-bold"
                  : "border-emerald-500 text-emerald-400 font-bold"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            <span>🔍</span>
            <span>Live Cloud Sound Search</span>
          </button>

          <button
            onClick={() => setActiveTab("import")}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "import"
                ? theme === "light"
                  ? "border-emerald-600 text-emerald-700 font-bold"
                  : "border-emerald-500 text-emerald-400 font-bold"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            <span>📥</span>
            <span>Import Pixabay Audio</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* TAB 1: BUNDLED REAL SOUNDS */}
          {activeTab === "bundled" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">
                    Curated Studio Audio Library
                  </h3>
                  <p
                    className={`text-xs ${
                      theme === "light" ? "text-slate-500" : "text-neutral-400"
                    }`}
                  >
                    High-definition real acoustic sound effects ready to audition,
                    tune, and loop seamlessly.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenPixabay()}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <span>🌐</span>
                  <span>Open Pixabay.com</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {bundledRealSounds.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
                      theme === "light"
                        ? "bg-slate-50 border-slate-200 hover:border-emerald-500 shadow-xs"
                        : "bg-neutral-950/60 border-neutral-800 hover:border-emerald-500/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs truncate">
                          {item.name}
                        </span>
                        <span className="text-[9px] font-mono uppercase opacity-60">
                          {item.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-500 font-mono">
                        Real Studio Recording
                      </span>
                    </div>

                    <button
                      onClick={() => handleLoadBundledSound(item)}
                      disabled={loadingSoundId === item.id}
                      className="w-full py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-neutral-950 border border-emerald-500/40 transition-all cursor-pointer flex items-center justify-center space-x-1"
                    >
                      {loadingSoundId === item.id ? (
                        <span>Loading...</span>
                      ) : (
                        <>
                          <span>⚡</span>
                          <span>Load into Workstation</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE CLOUD SOUND SEARCH */}
          {activeTab === "search" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold">
                  Search 12,000+ Real Sound Effects
                </h3>
                <p
                  className={`text-xs ${
                    theme === "light" ? "text-slate-500" : "text-neutral-400"
                  }`}
                >
                  Query royalty-free CC0 real acoustic sound effects online and load
                  them straight into your workstation.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. footsteps, whoosh, notification, rain, sword..."
                  value={cloudQuery}
                  onChange={(e) => setCloudQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchCloud(cloudQuery)}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                    theme === "light"
                      ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500"
                      : "bg-neutral-950 border-neutral-800 text-neutral-100 focus:border-emerald-500"
                  }`}
                />
                <button
                  onClick={() => handleSearchCloud(cloudQuery)}
                  disabled={isSearchingCloud}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
                >
                  {isSearchingCloud ? "Searching..." : "Search"}
                </button>
              </div>

              {/* Quick Suggestion Chips */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-mono opacity-70">Popular:</span>
                {["footsteps", "whoosh", "ui click", "rain", "punch", "sword", "laser", "bell"].map(
                  (q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setCloudQuery(q);
                        handleSearchCloud(q);
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        theme === "light"
                          ? "bg-slate-100 border-slate-300 hover:bg-slate-200"
                          : "bg-neutral-800/60 border-neutral-700 hover:bg-neutral-700"
                      }`}
                    >
                      {q}
                    </button>
                  )
                )}
              </div>

              {/* Results List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {cloudResults.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
                      theme === "light"
                        ? "bg-slate-50 border-slate-200 hover:border-emerald-500 shadow-xs"
                        : "bg-neutral-950/60 border-neutral-800 hover:border-emerald-500/60"
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-xs block truncate">
                        {item.name}
                      </span>
                      <p className="text-[10px] opacity-70 line-clamp-2 mt-0.5">
                        {item.description || "Royalty-free studio sound effect."}
                      </p>
                      <span className="text-[9px] font-mono text-emerald-500 mt-1 block">
                        Duration: {item.duration?.toFixed(1)}s
                      </span>
                    </div>

                    <button
                      onClick={() => handleLoadCloudSound(item)}
                      disabled={loadingSoundId === item.id}
                      className="w-full py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-neutral-950 border border-emerald-500/40 transition-all cursor-pointer flex items-center justify-center space-x-1"
                    >
                      {loadingSoundId === item.id ? (
                        <span>Downloading & Decoding...</span>
                      ) : (
                        <>
                          <span>⚡</span>
                          <span>Load into Workstation</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: IMPORT & PIXABAY CATEGORIES */}
          {activeTab === "import" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold">
                  Import Pixabay Audio & Quick Categories
                </h3>
                <p
                  className={`text-xs ${
                    theme === "light" ? "text-slate-500" : "text-neutral-400"
                  }`}
                >
                  Download any sound effect from Pixabay and drop it directly into
                  Axis SFX Lab to analyze, loop, and export.
                </p>
              </div>

              {/* Direct Drag & Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center space-y-3 transition-all cursor-pointer ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
                    : theme === "light"
                    ? "border-slate-300 bg-slate-50 hover:bg-slate-100/80"
                    : "border-neutral-700 bg-neutral-950/40 hover:bg-neutral-800/40"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl">
                  📁
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm">
                    Drag and drop your Pixabay MP3 / WAV here
                  </div>
                  <div
                    className={`text-[11px] ${
                      theme === "light" ? "text-slate-500" : "text-neutral-400"
                    }`}
                  >
                    Supports .mp3, .wav, .ogg, .flac audio files
                  </div>
                </div>

                <label className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold cursor-pointer border border-neutral-700">
                  <span>Browse Local Audio File</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Pixabay Direct Category Launchers */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Browse Pixabay Sound Effects by Category
                  </span>
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      placeholder="Search Pixabay..."
                      value={pixabayQuery}
                      onChange={(e) => setPixabayQuery(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleOpenPixabay(pixabayQuery)
                      }
                      className={`px-2.5 py-1 text-[11px] rounded-lg border focus:outline-none ${
                        theme === "light"
                          ? "bg-slate-50 border-slate-300 text-slate-900"
                          : "bg-neutral-950 border-neutral-800 text-neutral-100"
                      }`}
                    />
                    <button
                      onClick={() => handleOpenPixabay(pixabayQuery)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 text-neutral-950 text-[11px] font-bold"
                    >
                      Go
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {pixabayQuickCategories.map((cat) => (
                    <button
                      key={cat.query}
                      onClick={() => handleOpenPixabay(cat.query)}
                      className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                        theme === "light"
                          ? "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-emerald-500"
                          : "bg-neutral-950/50 border-neutral-800 hover:bg-neutral-800 hover:border-emerald-500/50"
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <div className="truncate">
                        <span className="text-xs font-semibold block truncate">
                          {cat.name}
                        </span>
                        <span className="text-[9px] text-emerald-500 font-mono">
                          Pixabay ↗
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`p-3 sm:p-4 border-t flex items-center justify-between text-xs ${
            theme === "light"
              ? "bg-slate-50 border-slate-200 text-slate-600"
              : "bg-neutral-950/80 border-neutral-800 text-neutral-400"
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-[11px]">
              Axis SFX Lab · Pixabay Royalty-Free Audio Bridge
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
