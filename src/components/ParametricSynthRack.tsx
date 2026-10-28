import React, { useMemo } from "react";
import { SynthParams, PresetInfo } from "../services/audioService";
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
  presets?: PresetInfo[];
  selectedPresetId?: string;
  onSelectPreset?: (presetId: string) => void;
  theme?: "dark" | "light";
}

export const ParametricSynthRack: React.FC<ParametricSynthRackProps> = ({
  params,
  onChange,
  onMutate,
  onRandomize,
  presets,
  selectedPresetId,
  onSelectPreset,
  theme,
}) => {
  const updateField = <K extends keyof SynthParams>(key: K, val: SynthParams[K]) => {
    onChange({ ...params, [key]: val });
  };

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

  // Active engine matching
  const currentEngine = useMemo(() => {
    return (
      categories.find(
        (c) => c.id === params.category || c.shortId === params.category
      ) || categories[0]
    );
  }, [categories, params.category]);

  // Presets in current engine
  const currentEnginePresets = useMemo(() => {
    if (!presets) return [];
    return presets.filter(
      (p) =>
        p.category === currentEngine.id || p.category === currentEngine.shortId
    );
  }, [presets, currentEngine]);

  // Active preset
  const activePreset = useMemo(() => {
    return presets?.find((p) => p.id === selectedPresetId);
  }, [presets, selectedPresetId]);

  // Subcategories in current engine
  const currentEngineSubcategories = useMemo(() => {
    const subs = new Set<string>();
    currentEnginePresets.forEach((p) => {
      if (p.subcategory) subs.add(p.subcategory);
    });
    return Array.from(subs);
  }, [currentEnginePresets]);

  const activeSubcategory = activePreset?.subcategory || currentEngineSubcategories[0] || "";

  // Presets within active subcategory
  const presetsInActiveSubcategory = useMemo(() => {
    if (!activeSubcategory) return currentEnginePresets;
    return currentEnginePresets.filter((p) => p.subcategory === activeSubcategory);
  }, [currentEnginePresets, activeSubcategory]);

    const materials = [
    { id: "metal", name: "Metal Resonance" },
    { id: "wood", name: "Wood Acoustic" },
    { id: "glass", name: "Glass Crystal" },
    { id: "stone", name: "Stone & Mineral" },
    { id: "flesh", name: "Organic & Flesh" },
  ];

  // Comprehensive Footstep Taxonomy Matrix (Combinatorial Sound Designer)
  const surfaceGroups = [
    {
      group: "Hard Surfaces",
      icon: "🪨",
      surfaces: [
        { id: "concrete", name: "Concrete / Cement" },
        { id: "marble", name: "Polished Marble / Granite" },
        { id: "tile", name: "Ceramic Tiles" },
        { id: "wood", name: "Wooden Floor / Parquet" },
        { id: "creakywood", name: "Creaky Old Floorboard" },
        { id: "metal", name: "Steel Plate / Catwalk" },
        { id: "metalgrate", name: "Industrial Grated Metal" },
        { id: "glass", name: "Glass Floor" },
        { id: "brick", name: "Bricks / Cobblestone" },
      ],
    },
    {
      group: "Natural Ground",
      icon: "🌿",
      surfaces: [
        { id: "grass", name: "Grass & Lawn" },
        { id: "wetgrass", name: "Wet Grass & Dew" },
        { id: "mud", name: "Wet Mud & Squelch" },
        { id: "dirt", name: "Dry Dirt & Loose Soil" },
        { id: "sand", name: "Dry Sand & Dunes" },
        { id: "wetsand", name: "Wet Beach Sand" },
        { id: "gravel", name: "Gravel & Pebbles" },
        { id: "leaves", name: "Fallen Leaves" },
        { id: "twigs", name: "Twigs & Branches" },
        { id: "snow", name: "Crunchy Snow Crust" },
        { id: "powdersnow", name: "Deep Powder Snow" },
        { id: "ice", name: "Frozen Slippery Ice" },
        { id: "shallowwater", name: "Puddles & Shallow Water" },
        { id: "deepwater", name: "Deep Water Plunge" },
      ],
    },
    {
      group: "Indoor Surfaces",
      icon: "🏢",
      surfaces: [
        { id: "carpet", name: "Plush Carpet & Rugs" },
        { id: "linoleum", name: "Linoleum & Vinyl" },
        { id: "rubber", name: "Rubber Flooring / Mats" },
      ],
    },
    {
      group: "Special & Sci-Fi",
      icon: "🔮",
      surfaces: [
        { id: "crushedglass", name: "Crushed Glass Shards" },
        { id: "alienorganic", name: "Alien Slime Membrane" },
        { id: "scififloor", name: "Sci-Fi Magnetic Deck" },
      ],
    },
  ];

  const footwearOptions = [
    { id: "boots", name: "🥾 Combat Boots", desc: "Rigid heavy lugged sole" },
    { id: "sneakers", name: "👟 Running Sneakers", desc: "Cushioned rubber grip" },
    { id: "highheels", name: "👠 High Heels", desc: "Sharp stiletto click-clack" },
    { id: "dress", name: "👞 Dress Shoes", desc: "Polished hard leather sole" },
    { id: "barefoot", name: "🦶 Bare Feet", desc: "Fleshy skin slap" },
    { id: "clogs", name: "🪵 Wooden Clogs", desc: "Hollow wood knock" },
    { id: "mech", name: "🤖 Armored Mech", desc: "Hydraulic servo & magnetic lock" },
  ];

  const movementOptions = [
    { id: "walk", name: "🚶 Normal Walk" },
    { id: "slow", name: "🐢 Slow Walk" },
    { id: "sneak", name: "🥷 Sneak / Tiptoe" },
    { id: "run", name: "🏃 Run / Sprint" },
    { id: "stomp", name: "💥 Heavy Stomp" },
    { id: "scuff", name: "👣 Scuff / Drag" },
    { id: "land", name: "🦘 Jump Landing" },
    { id: "stairs", name: "🪜 Stairs Step" },
  ];

  const characterOptions = [
    { id: "standard", name: "Standard (75kg)" },
    { id: "heavy", name: "Heavy / Giant (200kg+)" },
    { id: "light", name: "Agile / Ninja (45kg)" },
    { id: "armored", name: "Armored Soldier / Knight" },
    { id: "robot", name: "Robotic Android / Mech" },
  ];

  const environmentOptions = [
    { id: "dry", name: "Dry Studio" },
    { id: "hallway", name: "Hallway Echo" },
    { id: "stairwell", name: "Stairwell Slap" },
    { id: "warehouse", name: "Warehouse Hall" },
    { id: "cave", name: "Cavern Echo" },
    { id: "outdoor", name: "Open Outdoor" },
    { id: "cathedral", name: "Cathedral Vault" },
  ];

  const retroWaveforms = [
    { id: "wood", name: "12.5% NES Pulse" },
    { id: "glass", name: "25% NES Square" },
    { id: "metal", name: "50% Classic Square" },
  ];

  return (
    <div
      className={`flex flex-col rounded-2xl border p-3.5 sm:p-5 shadow-xl backdrop-blur-md space-y-4 min-w-0 w-full ${
        theme === "light"
          ? "bg-slate-50/95 border-slate-200 text-slate-900"
          : "bg-neutral-900/90 border-neutral-800 text-neutral-200"
      }`}
    >
      {/* Category Navigation & Select Header */}
      <div className="min-w-0 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
          <div
            className={`flex items-center space-x-2 text-xs font-semibold shrink-0 ${
              theme === "light" ? "text-slate-800" : "text-neutral-300"
            }`}
          >
            <IconSliders
              size={18}
              className={theme === "light" ? "text-sky-600" : "text-blue-400"}
            />
            <span>Procedural Sound Generator (13 Engines)</span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Category Select */}
            <div className="w-36 sm:w-44">
              <Select
                value={params.category}
                onValueChange={(val) => updateField("category", val)}
              >
                <SelectTrigger
                  className={`h-7 text-xs ${
                    theme === "light"
                      ? "bg-white border-slate-300 text-slate-900 shadow-xs"
                      : "bg-neutral-950 border-neutral-800"
                  }`}
                >
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
              className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer shrink-0 ${
                theme === "light"
                  ? "bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300"
                  : "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30"
              }`}
            >
              <IconSparkles size={13} />
              <span>Mutate</span>
            </button>
            <button
              onClick={onRandomize}
              title="Completely randomize parameters for instant inspiration"
              className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer shrink-0 ${
                theme === "light"
                  ? "bg-purple-100 text-purple-900 hover:bg-purple-200 border border-purple-300"
                  : "bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/30"
              }`}
            >
              <span>Random</span>
            </button>
          </div>
        </div>

        {/* Category Selector Tabs */}
        <div
          className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-13 gap-1.5 p-1 rounded-xl border min-w-0 ${
            theme === "light"
              ? "bg-slate-200/60 border-slate-300/80"
              : "bg-neutral-950/80 border-neutral-800/80"
          }`}
        >
          {categories.map((c) => {
            const Icon = c.icon;
            const active =
              params.category === c.id || params.category === c.shortId;
            return (
              <button
                key={c.id}
                onClick={() => updateField("category", c.id)}
                className={`flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 rounded-lg transition-all cursor-pointer min-w-0 ${
                  active
                    ? theme === "light"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-300 font-semibold"
                      : "bg-neutral-800 text-white shadow-md border border-neutral-700"
                    : theme === "light"
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-300/70"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60"
                }`}
              >
                <Icon
                  size={16}
                  className={
                    active
                      ? c.color
                      : theme === "light"
                      ? "text-slate-500"
                      : "text-neutral-500"
                  }
                />
                <span className="text-[10px] font-medium mt-1 truncate max-w-full">
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Level 1 -> Level 2 -> Level 3 Breadcrumb Header */}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 p-2 sm:p-2.5 rounded-xl border text-xs ${
            theme === "light"
              ? "bg-white border-slate-200 shadow-xs"
              : "bg-neutral-950/70 border-neutral-800"
          }`}
        >
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span
              className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded font-semibold border ${
                theme === "light"
                  ? "bg-blue-100 text-blue-900 border-blue-300"
                  : "bg-blue-500/15 text-blue-300 border-blue-500/30"
              }`}
            >
              L1: {currentEngine.name}
            </span>
            <span className="text-neutral-500 text-[10px]">›</span>
            <span
              className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded font-semibold border ${
                theme === "light"
                  ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                  : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
              }`}
            >
              L2: {activeSubcategory || "General"}
            </span>
            <span className="text-neutral-500 text-[10px]">›</span>
            <span
              className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-semibold border ${
                theme === "light"
                  ? "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300"
                  : "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30"
              }`}
            >
              L3: {activePreset?.name || "Active Sound"}
            </span>
            {activePreset?.is_loop !== undefined && (
              <span
                className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${
                  theme === "light"
                    ? "bg-amber-100 text-amber-900 border-amber-300 font-medium"
                    : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                }`}
              >
                {activePreset.is_loop ? "🔁 Seamless Loop" : "⚡ One-Shot Event"}
              </span>
            )}
          </div>

          {/* Quick Preset Selector for Active Subcategory */}
          {presetsInActiveSubcategory.length > 0 && onSelectPreset && (
            <div className="flex items-center space-x-1.5">
              <span
                className={`text-[10px] font-mono ${
                  theme === "light" ? "text-slate-600" : "text-neutral-400"
                }`}
              >
                Select Preset:
              </span>
              <select
                value={selectedPresetId}
                onChange={(e) => onSelectPreset(e.target.value)}
                className={`text-[11px] rounded px-2 py-0.5 focus:outline-none cursor-pointer border ${
                  theme === "light"
                    ? "bg-white border-slate-300 text-slate-900 font-medium focus:border-sky-500 shadow-xs"
                    : "bg-neutral-900 border-neutral-700 text-neutral-200 focus:border-cyan-500"
                }`}
              >
                {presetsInActiveSubcategory.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.is_loop ? "(Loop)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Subcategory Navigation Pills */}
        {currentEngineSubcategories.length > 0 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            <span
              className={`text-[10px] font-mono uppercase shrink-0 ${
                theme === "light" ? "text-slate-600 font-semibold" : "text-neutral-500"
              }`}
            >
              Subcategories:
            </span>
            {currentEngineSubcategories.map((sub) => {
              const isSelected = activeSubcategory === sub;
              return (
                <button
                  key={sub}
                  onClick={() => {
                    const firstPreset = currentEnginePresets.find(
                      (p) => p.subcategory === sub
                    );
                    if (firstPreset && onSelectPreset) {
                      onSelectPreset(firstPreset.id);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? theme === "light"
                        ? "bg-sky-600 text-white font-bold shadow-xs"
                        : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-semibold shadow-xs"
                      : theme === "light"
                      ? "bg-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-slate-300"
                      : "bg-neutral-950/60 text-neutral-400 hover:text-neutral-200 border border-neutral-800/80 hover:bg-neutral-800"
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 text-xs min-w-0">
        {/* Left Column: Physical & Frequency Engine */}
        <div className="space-y-3 p-3 sm:p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800/70 min-w-0">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Acoustics & Envelope
          </h4>

          {/* Base Frequency */}
          <div className="space-y-1">
            <div className="flex justify-between text-neutral-300">
              <span className="truncate">Base Frequency</span>
              <span className="font-mono text-cyan-300 shrink-0">{params.base_freq.toFixed(0)} Hz</span>
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
              <span className="truncate">Decay Time</span>
              <span className="font-mono text-cyan-300 shrink-0">{params.decay_ms.toFixed(0)} ms</span>
            </div>
            <input
              type="range"
              min="10"
              max="6000"
              step="10"
              value={params.decay_ms}
              onChange={(e) => updateField("decay_ms", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Pitch Decay / Sweep */}
          <div className="space-y-1">
            <div className="flex justify-between text-neutral-300">
              <span className="truncate">Pitch Envelope Bend / Sweep</span>
              <span className="font-mono text-cyan-300 shrink-0">{(params.pitch_decay * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.02"
              value={params.pitch_decay}
              onChange={(e) => updateField("pitch_decay", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Impact Material Presets */}
          {params.category === "impact" && (
            <div className="space-y-1 pt-1 min-w-0">
              <span className="text-neutral-400 text-[11px]">Material Density & Texture</span>
              <Select
                value={params.material_preset}
                onValueChange={(val) => updateField("material_preset", val)}
              >
                <SelectTrigger className="h-8 text-xs bg-neutral-950 border-neutral-800 text-rose-300 w-full">
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

          {/* Footstep Foley Combinatorial Sound Designer Matrix */}
          {(params.category === "footstep" || params.category === "foley_steps") && (
            <div className="space-y-4 pt-1 min-w-0">
              {/* Dynamic Sound Recipe & Stride Bar */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/70 via-neutral-900 to-teal-950/70 border border-emerald-800/60 shadow-md space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-emerald-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active Foley Recipe</span>
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => updateField("foot_side", "left")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        params.foot_side === "left"
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      Left Foot
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("foot_side", "right")}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        params.foot_side === "right"
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      Right Foot
                    </button>
                  </div>
                </div>

                <div className="text-xs font-mono text-neutral-200 bg-neutral-950/80 p-2 rounded-lg border border-neutral-800/90 leading-relaxed select-text">
                  <span className="text-emerald-400 font-bold capitalize">
                    {movementOptions.find((m) => m.id === (params.movement || "walk"))?.name.replace(/^[^s]+s+/, "") || "Walk"}
                  </span>
                  {" with "}
                  <span className="text-cyan-300 font-bold">
                    {footwearOptions.find((f) => f.id === (params.footwear || "boots"))?.name.replace(/^[^s]+s+/, "") || "Combat Boots"}
                  </span>
                  {" on "}
                  <span className="text-amber-300 font-bold">
                    {surfaceGroups.flatMap((g) => g.surfaces).find((s) => s.id === params.material_preset)?.name || params.material_preset || "Concrete"}
                  </span>
                  {" ("}
                  <span className="text-purple-300">
                    {characterOptions.find((c) => c.id === (params.character_type || "standard"))?.name || "Standard Human"}
                  </span>
                  {", "}
                  <span className="text-rose-300 font-semibold uppercase">
                    {(params.foot_side || "left") === "left" ? "Left Foot" : "Right Foot"}
                  </span>
                  {", "}
                  <span className="text-teal-300">
                    {environmentOptions.find((e) => e.id === (params.environment || "dry"))?.name || "Dry Studio"}
                  </span>
                  {params.echo ? ", Echo ON" : ""}
                  {")"}
                </div>

                {/* Stride Sequencer Button: Alternates L/R with natural variation */}
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const nextSide = (params.foot_side || "left") === "left" ? "right" : "left";
                      const nextSeed = (params.seed + 1) % 100000;
                      onChange({
                        ...params,
                        foot_side: nextSide,
                        seed: nextSeed,
                      });
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <span>🦶 Next Stride Step (Auto-Alternate L/R)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("echo", !params.echo)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center space-x-1.5 shrink-0 ${
                      params.echo
                        ? "bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-xs"
                        : "bg-neutral-900 text-neutral-400 hover:text-neutral-200 border-neutral-800"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${params.echo ? "bg-teal-400 animate-pulse" : "bg-neutral-500"}`} />
                    <span>{params.echo ? "Echo ON" : "Echo OFF"}</span>
                  </button>
                </div>
              </div>

              {/* 1. Surface Material Groups */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    1. Ground Surface Material
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {surfaceGroups.flatMap((g) => g.surfaces).find((s) => s.id === params.material_preset)?.name || "Select Surface"}
                  </span>
                </div>

                <div className="space-y-2">
                  {surfaceGroups.map((g) => (
                    <div key={g.group} className="space-y-1">
                      <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center space-x-1">
                        <span>{g.icon}</span>
                        <span>{g.group}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                        {g.surfaces.map((s) => {
                          const active = params.material_preset === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => updateField("material_preset", s.id)}
                              className={`px-2 py-1 text-[10px] rounded-lg truncate transition-all cursor-pointer text-left ${
                                active
                                  ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/60 shadow-xs font-semibold"
                                  : "bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 border border-neutral-800/60"
                              }`}
                              title={s.name}
                            >
                              {s.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Footwear & Sole Type */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    2. Footwear & Sole
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300">
                    {footwearOptions.find((f) => f.id === (params.footwear || "boots"))?.name}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {footwearOptions.map((f) => {
                    const active = (params.footwear || "boots") === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => updateField("footwear", f.id)}
                        className={`px-2 py-1 text-[10px] rounded-lg truncate transition-all cursor-pointer text-left ${
                          active
                            ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/60 shadow-xs font-semibold"
                            : "bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 border border-neutral-800/60"
                        }`}
                        title={f.desc}
                      >
                        {f.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Movement Style */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    3. Movement Style
                  </span>
                  <span className="text-[10px] font-mono text-amber-300">
                    {movementOptions.find((m) => m.id === (params.movement || "walk"))?.name}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                  {movementOptions.map((m) => {
                    const active = (params.movement || "walk") === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => updateField("movement", m.id)}
                        className={`px-2 py-1 text-[10px] rounded-lg truncate transition-all cursor-pointer text-left ${
                          active
                            ? "bg-amber-500/25 text-amber-300 border border-amber-500/60 shadow-xs font-semibold"
                            : "bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 border border-neutral-800/60"
                        }`}
                      >
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Character Weight & Environment Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Character */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    4. Character Weight
                  </span>
                  <Select
                    value={params.character_type || "standard"}
                    onValueChange={(val) => updateField("character_type", val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-neutral-950 border-neutral-800 text-purple-300 w-full">
                      <SelectValue placeholder="Character Body" />
                    </SelectTrigger>
                    <SelectContent>
                      {characterOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Environment Space */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    5. Acoustic Space
                  </span>
                  <Select
                    value={params.environment || "dry"}
                    onValueChange={(val) => updateField("environment", val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-neutral-950 border-neutral-800 text-teal-300 w-full">
                      <SelectValue placeholder="Environment Space" />
                    </SelectTrigger>
                    <SelectContent>
                      {environmentOptions.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Retro Waveform Select */}
          {params.category === "retro" && (
            <div className="space-y-1 pt-1 min-w-0">
              <span className="text-neutral-400 text-[11px]">NES Duty Cycle Pulse Width</span>
              <Select
                value={params.material_preset}
                onValueChange={(val) => updateField("material_preset", val)}
              >
                <SelectTrigger className="h-8 text-xs bg-neutral-950 border-neutral-800 text-lime-300 w-full">
                  <SelectValue placeholder="Select Duty Cycle" />
                </SelectTrigger>
                <SelectContent>
                  {retroWaveforms.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
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
                  <span className="truncate">Harmonic Count</span>
                  <span className="font-mono text-amber-300 shrink-0">{params.harmonic_count}</span>
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
                  <span className="truncate">RPM Jitter / Flutter</span>
                  <span className="font-mono text-amber-300 shrink-0">{(params.jitter_amount * 100).toFixed(0)}%</span>
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
                  <span className="truncate">FM Modulation Depth</span>
                  <span className="font-mono text-fuchsia-300 shrink-0">{(params.fm_depth * 100).toFixed(0)}%</span>
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
                  <span className="truncate">FM Ratio</span>
                  <span className="font-mono text-fuchsia-300 shrink-0">{params.fm_ratio.toFixed(1)}x</span>
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

          {params.category === "creature" && (
            <div className="space-y-1">
              <div className="flex justify-between text-neutral-300">
                <span className="truncate">Vocal Tremor Flutter</span>
                <span className="font-mono text-emerald-300 shrink-0">{(params.jitter_amount * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={params.jitter_amount}
                onChange={(e) => updateField("jitter_amount", parseFloat(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
          )}

          {/* Damping */}
          <div className="space-y-1">
            <div className="flex justify-between text-neutral-300">
              <span className="truncate">Damping Decay</span>
              <span className="font-mono text-cyan-300 shrink-0">{params.damping.toFixed(2)}</span>
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
        <div className="space-y-3 p-3 sm:p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800/70 min-w-0">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Tone Shaping & Effects
          </h4>

          {/* Filter Cutoff */}
          <div className="space-y-1">
            <div className="flex justify-between text-neutral-300">
              <span className="truncate">Low-Pass Filter</span>
              <span className="font-mono text-indigo-300 shrink-0">{params.filter_cutoff.toFixed(0)} Hz</span>
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
              <span className="truncate">Filter Resonance (Q)</span>
              <span className="font-mono text-indigo-300 shrink-0">{params.filter_resonance.toFixed(1)}</span>
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
              <span className="truncate">Noise & Attack Strike</span>
              <span className="font-mono text-indigo-300 shrink-0">{(params.noise_mix * 100).toFixed(0)}%</span>
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
              <span className="truncate">Overdrive / Saturation</span>
              <span className="font-mono text-indigo-300 shrink-0">{(params.drive * 100).toFixed(0)}%</span>
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

          {/* Bitcrush */}
          <div className="space-y-1">
            <div className="flex justify-between text-neutral-300">
              <span className="truncate">Bitcrush / Lo-Fi Quantization</span>
              <span className="font-mono text-indigo-300 shrink-0">{(params.bitcrush * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={params.bitcrush}
              onChange={(e) => updateField("bitcrush", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>

          {/* Algorithmic Reverb Wet */}
          <div className="space-y-1">
            <div className="flex justify-between text-neutral-300">
              <span className="truncate">Reverb Room Wet</span>
              <span className="font-mono text-indigo-300 shrink-0">{(params.reverb_wet * 100).toFixed(0)}%</span>
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
              <span className="truncate">Stereo Width</span>
              <span className="font-mono text-indigo-300 shrink-0">{(params.stereo_spread * 100).toFixed(0)}%</span>
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

          {/* Acoustic Echo Toggle */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/80 pt-2">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-neutral-300">Acoustic Echo Slapback</span>
              <span className="text-[10px] text-neutral-500">Room & corridor reflection</span>
            </div>
            <button
              type="button"
              onClick={() => updateField("echo", !params.echo)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                params.echo
                  ? "bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-700/80"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${params.echo ? "bg-white animate-pulse" : "bg-neutral-500"}`} />
              <span>{params.echo ? "ON" : "OFF"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
