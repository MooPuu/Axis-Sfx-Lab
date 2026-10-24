import React, { useState } from "react";
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

  const categories = [
    { id: "impact", name: "Impacts & Hits", icon: IconImpact, color: "text-rose-400" },
    { id: "motor", name: "Motors & Servos", icon: IconMotor, color: "text-amber-400" },
    { id: "ui", name: "UI & Clicks", icon: IconUI, color: "text-sky-400" },
    { id: "scifi", name: "Sci-Fi Energy", icon: IconSciFi, color: "text-fuchsia-400" },
    { id: "footstep", name: "Foley Steps", icon: IconFootstep, color: "text-emerald-400" },
    { id: "whoosh", name: "Whooshes & Swipes", icon: IconWhoosh, color: "text-cyan-400" },
    { id: "ambient", name: "Ambient Drones", icon: IconAmbient, color: "text-violet-400" },
    { id: "explosion", name: "Explosions & Blasts", icon: IconExplosion, color: "text-orange-400" },
    { id: "weather", name: "Weather & Nature", icon: IconWeather, color: "text-sky-400" },
    { id: "retro", name: "Retro 8-Bit NES", icon: IconRetro, color: "text-lime-400" },
    { id: "magic", name: "Magic & Fantasy", icon: IconMagic, color: "text-fuchsia-400" },
    { id: "weapon", name: "Weapons & Guns", icon: IconWeapon, color: "text-red-400" },
    { id: "creature", name: "Creatures & Roars", icon: IconCreature, color: "text-emerald-400" },
  ];

  const filteredPresets = presets.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside
      className={`relative flex flex-col border-r transition-all duration-300 z-30 select-none shrink-0 ${
        theme === "dark"
          ? "bg-neutral-900/90 border-neutral-800 text-neutral-200"
          : "bg-slate-50/95 border-slate-200 text-slate-900"
      } ${isCollapsed ? "w-16" : "w-64"}`}
    >
      {/* Sidebar Header */}
      <div className={`h-14 px-4 flex items-center justify-between border-b ${
        theme === "dark" ? "border-neutral-800" : "border-slate-200"
      }`}>
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <span className={`text-[11px] font-bold tracking-wider uppercase ${
              theme === "dark" ? "text-neutral-300" : "text-slate-700"
            }`}>
              Sound Library
            </span>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isCollapsed ? "mx-auto" : ""} ${
            theme === "dark"
              ? "hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              : "hover:bg-slate-200 text-slate-600 hover:text-slate-900"
          }`}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`}
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-5">
        {/* Categories Section */}
        <div>
          {!isCollapsed && (
            <div className={`px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider ${
              theme === "dark" ? "text-neutral-400" : "text-slate-500"
            }`}>
              Synthesizer Engines
            </div>
          )}
          <nav className="space-y-1">
            {categories.map((c) => {
              const Icon = c.icon;
              const active = currentCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectCategory(c.id)}
                  title={c.name}
                  className={`w-full flex items-center space-x-3 px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? theme === "dark"
                        ? "bg-neutral-800/90 text-white shadow-sm border border-neutral-700/60"
                        : "bg-white text-slate-900 shadow-sm border border-slate-300 font-semibold"
                      : theme === "dark"
                        ? "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                  } ${isCollapsed ? "justify-center px-0" : ""}`}
                >
                  <Icon size={16} className={active ? c.color : theme === "dark" ? "text-neutral-400" : "text-slate-500"} />
                  {!isCollapsed && <span className="truncate">{c.name}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Presets Library Section */}
        {!isCollapsed && (
          <div className="space-y-2 pt-2 border-t border-inherit">
            <div className="flex items-center justify-between px-2">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                theme === "dark" ? "text-neutral-400" : "text-slate-500"
              }`}>
                Preset Vault
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                theme === "dark"
                  ? "text-cyan-400 bg-cyan-950/40 border-cyan-800/40"
                  : "text-sky-700 bg-sky-100 border-sky-300 font-semibold"
              }`}>
                {filteredPresets.length}
              </span>
            </div>

            {/* Quick Search */}
            <div className="px-1">
              <input
                type="text"
                placeholder="Search presets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors focus:outline-none ${
                  theme === "dark"
                    ? "bg-neutral-950/60 border border-neutral-800/80 text-neutral-200 placeholder:text-neutral-500 focus:border-cyan-500/60"
                    : "bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 shadow-xs"
                }`}
              />
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              {filteredPresets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectPreset(p.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate transition-all cursor-pointer flex items-center justify-between ${
                    selectedPresetId === p.id
                      ? theme === "dark"
                        ? "bg-cyan-500/20 text-cyan-300 font-medium border border-cyan-500/40"
                        : "bg-sky-100 text-sky-800 font-semibold border border-sky-400 shadow-xs"
                      : theme === "dark"
                        ? "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  <span className="text-[9px] font-mono opacity-60 uppercase shrink-0 ml-1">
                    {p.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Tools */}
        <div className="pt-2 border-t border-inherit space-y-1">
          {!isCollapsed && (
            <div className={`px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider ${
              theme === "dark" ? "text-neutral-400" : "text-slate-500"
            }`}>
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
            <IconLayers size={16} className={theme === "dark" ? "text-indigo-400" : "text-indigo-600"} />
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
            <IconDownload size={16} className={theme === "dark" ? "text-teal-400" : "text-teal-600"} />
            {!isCollapsed && <span>Game Export Hub</span>}
          </button>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-inherit">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} text-xs ${
          theme === "dark" ? "text-neutral-400" : "text-slate-600"
        }`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono font-medium">DSP Engine Active</span>
            </div>
          )}
          <IconSettings size={16} className={theme === "dark" ? "text-neutral-500" : "text-slate-500"} />
        </div>
      </div>
    </aside>
  );
};
