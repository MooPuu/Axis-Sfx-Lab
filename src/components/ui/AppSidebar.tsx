import React, { useState, useMemo } from "react";
import { PresetInfo, RealSoundItem } from "../../services/audioService";
import {
  IconImpact,
  IconMotor,
  IconUI,
  IconSciFi,
  IconFootstep,
  IconWhoosh,
  IconAmbient,
  IconExplosion,
  IconWeather,
  IconRetro,
  IconMagic,
  IconWeapon,
  IconCreature,
  IconLayers,
  IconDownload,
  IconSettings,
} from "../icons/DuotoneIcons";

interface AppSidebarProps {
  currentCategory: string;
  onSelectCategory: (cat: string) => void;
  presets: PresetInfo[];
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onOpenBatch: () => void;
  onOpenExport: () => void;
  onOpenPixabayHub: () => void;
  realSounds?: RealSoundItem[];
  selectedRealSoundId?: string;
  onSelectRealSound?: (item: RealSoundItem) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  theme: "dark" | "light";
  libraryMode?: "dsp" | "real";
  onSelectLibraryMode?: (mode: "dsp" | "real") => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentCategory,
  onSelectCategory,
  presets,
  selectedPresetId,
  onSelectPreset,
  onOpenBatch,
  onOpenExport,
  onOpenPixabayHub,
  realSounds = [],
  selectedRealSoundId,
  onSelectRealSound,
  isCollapsed,
  onToggleCollapse,
  theme,
  libraryMode,
  onSelectLibraryMode,
}) => {
  const [internalMode, setInternalMode] = useState<"dsp" | "real">("dsp");
  const activeMode = libraryMode !== undefined ? libraryMode : internalMode;
  const [realSubTab, setRealSubTab] = useState<"all" | "studio">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("All");
  const [filterType, setFilterType] = useState<"all" | "oneshot" | "loop">("all");

  const handleSetMode = (mode: "dsp" | "real") => {
    setInternalMode(mode);
    onSelectLibraryMode?.(mode);
  };

  const categories = useMemo(
    () => [
      { id: "impacts_hits", shortId: "impact", name: "Impacts & Hits", icon: IconImpact, color: "text-rose-400" },
      { id: "motors_servos", shortId: "motor", name: "Motors & Servos", icon: IconMotor, color: "text-amber-400" },
      { id: "ui_clicks", shortId: "ui", name: "UI & Clicks", icon: IconUI, color: "text-sky-400" },
      { id: "scifi_energy", shortId: "scifi", name: "Sci-Fi Energy", icon: IconSciFi, color: "text-fuchsia-400" },
      { id: "foley_steps", shortId: "footstep", name: "Foley Steps", icon: IconFootstep, color: "text-emerald-400" },
      { id: "whooshes_swipes", shortId: "whoosh", name: "Whooshes & Swipes", icon: IconWhoosh, color: "text-cyan-400" },
      { id: "ambient_drones", shortId: "ambient", name: "Ambient Drones", icon: IconAmbient, color: "text-violet-400" },
      { id: "explosions_blasts", shortId: "explosion", name: "Explosions & Blasts", icon: IconExplosion, color: "text-orange-400" },
      { id: "weather_nature", shortId: "weather", name: "Weather & Nature", icon: IconWeather, color: "text-sky-400" },
      { id: "retro_8bit_nes", shortId: "retro", name: "Retro 8-Bit NES", icon: IconRetro, color: "text-lime-400" },
      { id: "magic_fantasy", shortId: "magic", name: "Magic & Fantasy", icon: IconMagic, color: "text-fuchsia-400" },
      { id: "weapons_guns", shortId: "weapon", name: "Weapons & Guns", icon: IconWeapon, color: "text-red-400" },
      { id: "creatures_roars", shortId: "creature", name: "Creatures & Roars", icon: IconCreature, color: "text-emerald-400" },
    ],
    []
  );

  const activeCategory = useMemo(() => {
    return (
      categories.find(
        (c) => c.id === currentCategory || c.shortId === currentCategory
      ) || categories[0]
    );
  }, [categories, currentCategory]);

  const availableSubcategories = useMemo(() => {
    const subs = new Set<string>();
    presets.forEach((p) => {
      const match =
        p.category === activeCategory.id || p.category === activeCategory.shortId;
      if (match && p.subcategory) {
        subs.add(p.subcategory);
      }
    });
    return ["All", ...Array.from(subs)];
  }, [presets, activeCategory]);

  const filteredPresets = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return presets.filter((p) => {
      const categoryMatch =
        p.category === activeCategory.id || p.category === activeCategory.shortId;

      if (!categoryMatch && !term) return false;

      if (selectedSubcategory !== "All" && p.subcategory !== selectedSubcategory) {
        return false;
      }

      if (filterType === "oneshot" && p.is_loop) return false;
      if (filterType === "loop" && !p.is_loop) return false;

      if (term) {
        const matchesName = p.name.toLowerCase().includes(term);
        const matchesSub = (p.subcategory || "").toLowerCase().includes(term);
        const matchesCat = p.category.toLowerCase().includes(term);
        const matchesTags = p.tags?.some((t) => t.toLowerCase().includes(term));
        return matchesName || matchesSub || matchesCat || matchesTags;
      }

      return true;
    });
  }, [presets, activeCategory, selectedSubcategory, filterType, searchTerm]);

  const filteredRealSounds = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return realSounds;
    return realSounds.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.category.toLowerCase().includes(term)
    );
  }, [realSounds, searchTerm]);

  return (
    <aside
      className={`relative flex flex-col border-r transition-all duration-300 z-30 select-none shrink-0 ${
        theme === "dark"
          ? "bg-neutral-900/90 border-neutral-800 text-neutral-200"
          : "bg-slate-50/95 border-slate-200 text-slate-900"
      } ${isCollapsed ? "w-16" : "w-72"}`}
    >
      {/* Sidebar Header */}
      <div
        className={`h-14 px-4 flex items-center justify-between border-b ${
          theme === "dark" ? "border-neutral-800" : "border-slate-200"
        }`}
      >
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <span
              className={`text-[11px] font-bold tracking-wider uppercase ${
                theme === "dark" ? "text-neutral-300" : "text-slate-700"
              }`}
            >
              Sound Library
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${
                theme === "dark"
                  ? activeMode === "real"
                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/50"
                    : "bg-neutral-800 text-neutral-400 border-neutral-700"
                  : activeMode === "real"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                  : "bg-slate-200 text-slate-700 border-slate-300 font-bold"
              }`}
            >
              {activeMode === "real"
                ? `${presets.length} Real SFX`
                : `${presets.length} Synth SFX`}
            </span>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isCollapsed ? "mx-auto" : ""
          } ${
            theme === "dark"
              ? "hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              : "hover:bg-slate-200 text-slate-600 hover:text-slate-900"
          }`}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              isCollapsed ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4">
        {/* Mode Selector: Procedural DSP vs Real Studio Audio */}
        {!isCollapsed && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-[11px] font-semibold">
              <button
                onClick={() => handleSetMode("dsp")}
                className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  activeMode === "dsp"
                    ? theme === "dark"
                      ? "bg-neutral-800 text-white font-bold shadow-xs border border-neutral-700"
                      : "bg-white text-slate-900 font-bold shadow-xs border border-slate-300"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <span>🎛️</span>
                <span>DSP Synth ({presets.length})</span>
              </button>
              <button
                onClick={() => handleSetMode("real")}
                className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  activeMode === "real"
                    ? "bg-emerald-500 text-neutral-950 font-bold shadow-xs"
                    : "text-emerald-400 hover:text-emerald-300"
                }`}
              >
                <span>🎙️</span>
                <span>Real SFX ({presets.length})</span>
              </button>
            </div>

            {/* In Real SFX mode: Sub-Navigation between 838 Presets vs Studio Audio */}
            {activeMode === "real" && (
              <div className="flex items-center justify-between p-1 bg-emerald-950/25 border border-emerald-500/30 rounded-lg text-[10px]">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setRealSubTab("all")}
                    className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                      realSubTab === "all"
                        ? "bg-emerald-500 text-neutral-950 font-bold"
                        : "text-emerald-400 hover:text-emerald-200"
                    }`}
                  >
                    All {presets.length} Presets
                  </button>
                  <button
                    onClick={() => setRealSubTab("studio")}
                    className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                      realSubTab === "studio"
                        ? "bg-emerald-500 text-neutral-950 font-bold"
                        : "text-emerald-400 hover:text-emerald-200"
                    }`}
                  >
                    ⭐ Studio ({realSounds.length})
                  </button>
                </div>
                <button
                  onClick={onOpenPixabayHub}
                  title="Search and import cloud sounds from Pixabay"
                  className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-500/25 text-emerald-300 hover:bg-emerald-500 hover:text-neutral-950 transition-all cursor-pointer"
                >
                  🌐 Cloud SFX
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE A (SUB-TAB): REAL STUDIO RECORDED AUDIO */}
        {activeMode === "real" && realSubTab === "studio" && !isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Studio Sound Vault
                </span>
                <span className="text-[9px] text-neutral-500 block">
                  Authentic Studio Recordings ({filteredRealSounds.length})
                </span>
              </div>
              <button
                onClick={onOpenPixabayHub}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500 hover:text-neutral-950 transition-all cursor-pointer"
              >
                + Cloud SFX
              </button>
            </div>

            {/* Quick Search */}
            <div className="px-1">
              <input
                type="text"
                placeholder="Search real sound effects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors focus:outline-none ${
                  theme === "dark"
                    ? "bg-neutral-950/70 border border-neutral-800 text-neutral-200 placeholder:text-neutral-500 focus:border-emerald-500"
                    : "bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 shadow-xs"
                }`}
              />
            </div>

            {/* Real Sounds List */}
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {filteredRealSounds.map((item) => {
                const isSelected = selectedRealSoundId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectRealSound && onSelectRealSound(item)}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-all cursor-pointer flex flex-col space-y-1 ${
                      isSelected
                        ? "bg-emerald-500/20 border border-emerald-500 text-emerald-200 font-semibold shadow-xs"
                        : theme === "dark"
                        ? "bg-neutral-950/50 border border-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-800/60"
                        : "bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold truncate">{item.name}</span>
                      <span className="text-[10px] text-emerald-400 font-mono ml-1">
                        ● Studio WAV
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] opacity-70">
                      <span className="uppercase tracking-wider">{item.category}</span>
                      <span className="font-mono">{item.duration ? `${item.duration.toFixed(1)}s` : "Studio WAV"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* MODE B: 13 ENGINES & ALL 838 PRESETS (SUPPORTED IN BOTH DSP AND REAL SFX MODES) */
          <>
            {/* Categories Section */}
            <div>
              {!isCollapsed && (
                <div
                  className={`px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider ${
                    theme === "dark" ? "text-neutral-400" : "text-slate-500"
                  }`}
                >
                  <span>
                    Level 1 · {activeMode === "real" ? "Real SFX Engines" : "Synthesizer Engines"}
                  </span>
                  <span className="font-mono">{presets.length} Presets</span>
                </div>
              )}
              <nav className="space-y-1">
                {categories.map((c) => {
                  const Icon = c.icon;
                  const active =
                    currentCategory === c.id || currentCategory === c.shortId;
                  const count = presets.filter(
                    (p) => p.category === c.id || p.category === c.shortId
                  ).length;

                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        onSelectCategory(c.id);
                        setSelectedSubcategory("All");
                      }}
                      title={`${c.name} (${count} presets)`}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? activeMode === "real"
                            ? theme === "dark"
                              ? "bg-emerald-950/50 text-emerald-200 shadow-sm border border-emerald-500/50 font-bold"
                              : "bg-emerald-50 text-emerald-950 shadow-sm border border-emerald-400 font-bold"
                            : theme === "dark"
                            ? "bg-neutral-800/95 text-white shadow-sm border border-neutral-700/60"
                            : "bg-white text-slate-900 shadow-sm border border-slate-300 font-semibold"
                          : theme === "dark"
                          ? "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                      } ${isCollapsed ? "justify-center px-0" : ""}`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon
                          size={16}
                          className={
                            active
                              ? activeMode === "real"
                                ? "text-emerald-400"
                                : c.color
                              : theme === "dark"
                              ? "text-neutral-400"
                              : "text-slate-500"
                          }
                        />
                        {!isCollapsed && <span className="truncate">{c.name}</span>}
                      </div>
                      {!isCollapsed && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md ${
                            active
                              ? activeMode === "real"
                                ? theme === "dark"
                                  ? "bg-emerald-500/20 text-emerald-300 font-bold"
                                  : "bg-emerald-100 text-emerald-800 font-bold"
                                : theme === "dark"
                                ? "bg-cyan-500/20 text-cyan-300 font-bold"
                                : "bg-sky-100 text-sky-800 font-bold"
                              : theme === "dark"
                              ? "text-neutral-500 bg-neutral-950/40"
                              : "text-slate-500 bg-slate-200/60"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Preset Vault Section */}
            {!isCollapsed && (
              <div className="space-y-2.5 pt-3 border-t border-inherit">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider block ${
                        activeMode === "real"
                          ? "text-emerald-400"
                          : theme === "dark"
                          ? "text-neutral-300"
                          : "text-slate-700"
                      }`}
                    >
                      {activeMode === "real" ? "Real SFX Vault" : "Preset Vault"} · {activeCategory.name}
                    </span>
                    <span className="text-[9px] text-neutral-500 block">
                      {activeMode === "real"
                        ? "Physical Acoustic & Studio Modeling"
                        : "Level 2 & 3 Preset Taxonomy"}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      activeMode === "real"
                        ? theme === "dark"
                          ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/40 font-bold"
                          : "text-emerald-800 bg-emerald-100 border-emerald-300 font-bold"
                        : theme === "dark"
                        ? "text-cyan-400 bg-cyan-950/40 border-cyan-800/40 font-bold"
                        : "text-sky-700 bg-sky-100 border-sky-300 font-bold"
                    }`}
                  >
                    {filteredPresets.length}
                  </span>
                </div>

                {/* Quick Search */}
                <div className="px-1">
                  <input
                    type="text"
                    placeholder="Search presets, tags, subcategories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors focus:outline-none ${
                      theme === "dark"
                        ? "bg-neutral-950/70 border border-neutral-800 text-neutral-200 placeholder:text-neutral-500 focus:border-cyan-500"
                        : "bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 shadow-xs"
                    }`}
                  />
                </div>

                {/* Subcategory Filter Chips / Pills */}
                {availableSubcategories.length > 2 && (
                  <div className="px-1 space-y-1">
                    <div className="text-[9px] uppercase tracking-wider font-semibold opacity-70">
                      Subcategories
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                      {availableSubcategories.map((sub) => {
                        const isSelected = selectedSubcategory === sub;
                        return (
                          <button
                            key={sub}
                            onClick={() => setSelectedSubcategory(sub)}
                            className={`text-[10px] px-2 py-0.5 rounded-full transition-all cursor-pointer font-medium ${
                              isSelected
                                ? theme === "dark"
                                  ? "bg-cyan-500 text-neutral-950 font-bold"
                                  : "bg-sky-600 text-white font-bold"
                                : theme === "dark"
                                ? "bg-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700"
                                : "bg-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-300"
                            }`}
                          >
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Loop / One-Shot Filter Chips */}
                <div className="flex items-center space-x-1 px-1">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`flex-1 py-1 text-[10px] rounded-md transition-all font-medium cursor-pointer ${
                      filterType === "all"
                        ? theme === "dark"
                          ? "bg-neutral-800 text-neutral-100 font-bold border border-neutral-700"
                          : "bg-white text-slate-900 font-bold border border-slate-300 shadow-xs"
                        : theme === "dark"
                        ? "text-neutral-400 hover:text-neutral-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType("oneshot")}
                    className={`flex-1 py-1 text-[10px] rounded-md transition-all font-medium cursor-pointer flex items-center justify-center space-x-1 ${
                      filterType === "oneshot"
                        ? theme === "dark"
                          ? "bg-neutral-800 text-neutral-100 font-bold border border-neutral-700"
                          : "bg-white text-slate-900 font-bold border border-slate-300 shadow-xs"
                        : theme === "dark"
                        ? "text-neutral-400 hover:text-neutral-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>⚡</span>
                    <span>One-Shot</span>
                  </button>
                  <button
                    onClick={() => setFilterType("loop")}
                    className={`flex-1 py-1 text-[10px] rounded-md transition-all font-medium cursor-pointer flex items-center justify-center space-x-1 ${
                      filterType === "loop"
                        ? theme === "dark"
                          ? "bg-neutral-800 text-neutral-100 font-bold border border-neutral-700"
                          : "bg-white text-slate-900 font-bold border border-slate-300 shadow-xs"
                        : theme === "dark"
                        ? "text-neutral-400 hover:text-neutral-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>🔁</span>
                    <span>Loop</span>
                  </button>
                </div>

                {/* Presets List */}
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {filteredPresets.length === 0 ? (
                    <div className="text-center py-6 text-xs text-neutral-500">
                      No matching presets found
                    </div>
                  ) : (
                    filteredPresets.map((p) => {
                      const isSelected = selectedPresetId === p.id;
                      const hasStudioMatch = realSounds.some(
                        (s) =>
                          s.id === p.id ||
                          s.name.toLowerCase() === p.name.toLowerCase() ||
                          s.name.toLowerCase().includes(p.name.toLowerCase()) ||
                          p.name.toLowerCase().includes(s.name.toLowerCase())
                      );
                      return (
                        <button
                          key={p.id}
                          onClick={() => onSelectPreset(p.id)}
                          className={`w-full text-left p-2 rounded-xl text-xs transition-all cursor-pointer flex flex-col space-y-1 ${
                            isSelected
                              ? activeMode === "real"
                                ? theme === "dark"
                                  ? "bg-emerald-500/20 border border-emerald-500 text-emerald-200 shadow-xs"
                                  : "bg-emerald-100 border border-emerald-500 text-emerald-950 font-bold shadow-xs"
                                : theme === "dark"
                                ? "bg-cyan-500/15 border border-cyan-500/50 text-cyan-200 shadow-xs"
                                : "bg-sky-100 border border-sky-400 text-sky-900 font-semibold shadow-xs"
                              : theme === "dark"
                              ? "bg-neutral-950/40 border border-neutral-800/60 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50"
                              : "bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-semibold truncate">{p.name}</span>
                            <div className="flex items-center space-x-1 shrink-0 ml-1">
                              {activeMode === "real" && (
                                <span
                                  className={`text-[9px] font-mono px-1 py-0.5 rounded border ${
                                    hasStudioMatch
                                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  }`}
                                >
                                  {hasStudioMatch ? "⭐ Studio" : "🎙️ Real"}
                                </span>
                              )}
                              <span className="text-[10px] opacity-80">
                                {p.is_loop ? "🔁 Loop" : "⚡ Shot"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[9px] opacity-70">
                            <span className="truncate">{p.subcategory || p.category}</span>
                            {p.tags && p.tags.length > 0 && (
                              <span className="font-mono truncate ml-1 text-[8.5px]">
                                #{p.tags[0]}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Quick Tools */}
        <div className="pt-2 border-t border-inherit space-y-1">
          {!isCollapsed && (
            <div
              className={`px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                theme === "dark" ? "text-neutral-400" : "text-slate-500"
              }`}
            >
              Workstation Tools
            </div>
          )}

          {/* Pixabay Sound Effects Hub Button */}
          <button
            onClick={onOpenPixabayHub}
            title="Pixabay & Real Sound Effects Hub"
            className={`w-full flex items-center space-x-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              theme === "dark"
                ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/40 shadow-xs"
                : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300 shadow-xs"
            } ${isCollapsed ? "justify-center px-0" : ""}`}
          >
            <span className="text-base">🌐</span>
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span>Pixabay SFX Hub</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500 text-neutral-950 font-bold">
                  REAL SFX
                </span>
              </div>
            )}
          </button>

          <button
            onClick={onOpenBatch}
            title="Batch Variation Bank"
            className={`w-full flex items-center space-x-3 px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              theme === "dark"
                ? "text-neutral-300 hover:bg-indigo-950/40 hover:text-indigo-200"
                : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 border border-slate-200/80"
            } ${isCollapsed ? "justify-center px-0" : ""}`}
          >
            <IconLayers
              size={16}
              className={theme === "dark" ? "text-indigo-400" : "text-indigo-600"}
            />
            {!isCollapsed && <span>Batch Variations</span>}
          </button>

          <button
            onClick={onOpenExport}
            title="Game Engine Export"
            className={`w-full flex items-center space-x-3 px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              theme === "dark"
                ? "text-neutral-300 hover:bg-teal-950/40 hover:text-teal-200"
                : "text-slate-700 hover:bg-teal-50 hover:text-teal-900 border border-slate-200/80"
            } ${isCollapsed ? "justify-center px-0" : ""}`}
          >
            <IconDownload
              size={16}
              className={theme === "dark" ? "text-teal-400" : "text-teal-600"}
            />
            {!isCollapsed && <span>Game Export Hub</span>}
          </button>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-inherit">
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          } text-xs ${theme === "dark" ? "text-neutral-400" : "text-slate-600"}`}
        >
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono font-medium">
                {activeMode === "real" ? "Real SFX Active" : "DSP Engine Active"}
              </span>
            </div>
          )}
          <IconSettings
            size={16}
            className={theme === "dark" ? "text-neutral-500" : "text-slate-500"}
          />
        </div>
      </div>
    </aside>
  );
};
