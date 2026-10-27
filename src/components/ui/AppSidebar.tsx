import React, { useState, useMemo } from "react";
import { PresetInfo } from "../../services/audioService";
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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  theme: "dark" | "light";
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentCategory,
  onSelectCategory,
  presets,
  selectedPresetId,
  onSelectPreset,
  onOpenBatch,
  onOpenExport,
  isCollapsed,
  onToggleCollapse,
  theme,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("All");
  const [filterType, setFilterType] = useState<"all" | "oneshot" | "loop">("all");

  const categories = useMemo(() => [
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
  ], []);

  // Find active category definition
  const activeCategory = useMemo(() => {
    return categories.find(
      (c) => c.id === currentCategory || c.shortId === currentCategory
    ) || categories[0];
  }, [categories, currentCategory]);

  // Compute available subcategories for current engine
  const availableSubcategories = useMemo(() => {
    const subs = new Set<string>();
    presets.forEach((p) => {
      const match = p.category === activeCategory.id || p.category === activeCategory.shortId;
      if (match && p.subcategory) {
        subs.add(p.subcategory);
      }
    });
    return ["All", ...Array.from(subs)];
  }, [presets, activeCategory]);

  // Filtered presets
  const filteredPresets = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return presets.filter((p) => {
      // Category match
      const categoryMatch =
        p.category === activeCategory.id || p.category === activeCategory.shortId;

      if (!categoryMatch && !term) return false;

      // Subcategory filter
      if (selectedSubcategory !== "All" && p.subcategory !== selectedSubcategory) {
        return false;
      }

      // Loop type filter
      if (filterType === "oneshot" && p.is_loop) return false;
      if (filterType === "loop" && !p.is_loop) return false;

      // Search term
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
                  ? "bg-neutral-800 text-neutral-400 border-neutral-700"
                  : "bg-slate-200 text-slate-700 border-slate-300"
              }`}
            >
              13 Engines
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
        {/* Categories Section */}
        <div>
          {!isCollapsed && (
            <div
              className={`px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider ${
                theme === "dark" ? "text-neutral-400" : "text-slate-500"
              }`}
            >
              <span>Level 1 · Synthesizer Engines</span>
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
                      ? theme === "dark"
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
                          ? c.color
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
                          ? theme === "dark"
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
                    theme === "dark" ? "text-neutral-300" : "text-slate-700"
                  }`}
                >
                  Preset Vault · {activeCategory.name}
                </span>
                <span className="text-[9px] text-neutral-500 block">
                  Level 2 & 3 Preset Taxonomy
                </span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  theme === "dark"
                    ? "text-cyan-400 bg-cyan-950/40 border-cyan-800/40 font-bold"
                    : "text-sky-700 bg-sky-100 border-sky-300 font-bold"
                }`}
              >
                {filteredPresets.length}
              </span>
            </div>

            {/* Quick Search across Name, Subcategory, Category, Tags */}
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
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectPreset(p.id)}
                      className={`w-full text-left p-2 rounded-xl text-xs transition-all cursor-pointer flex flex-col space-y-1 ${
                        isSelected
                          ? theme === "dark"
                            ? "bg-cyan-500/15 border border-cyan-500/50 text-cyan-200 shadow-xs"
                            : "bg-sky-100 border border-sky-400 text-sky-900 font-semibold shadow-xs"
                          : theme === "dark"
                          ? "bg-neutral-950/40 border border-neutral-800/60 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50"
                          : "bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold truncate">{p.name}</span>
                        <span className="text-[10px] shrink-0 opacity-80 ml-1">
                          {p.is_loop ? "🔁 Loop" : "⚡ Shot"}
                        </span>
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
                DSP Engine Active
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
