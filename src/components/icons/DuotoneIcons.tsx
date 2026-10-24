import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

// Solar & Iconsax style Duotone SVG Icons (Primary stroke/fill + 0.35 opacity secondary accent layer)

export const IconLogo: React.FC<IconProps> = ({ className = "text-cyan-400", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" className="fill-current opacity-20" />
    <path d="M12 3V21M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    <path d="M7 16L12 7L17 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="7" r="2.5" className="fill-current" />
    <circle cx="7" cy="16" r="2" className="fill-current" />
    <circle cx="17" cy="16" r="2" className="fill-current" />
  </svg>
);

export const IconPlay: React.FC<IconProps> = ({ className = "text-emerald-400", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="10" className="fill-current opacity-25" />
    <path d="M9.5 8.5L16.5 12L9.5 15.5V8.5Z" className="fill-current" />
  </svg>
);

export const IconPause: React.FC<IconProps> = ({ className = "text-amber-400", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="10" className="fill-current opacity-25" />
    <rect x="8.5" y="7.5" width="2.5" height="9" rx="1" className="fill-current" />
    <rect x="13" y="7.5" width="2.5" height="9" rx="1" className="fill-current" />
  </svg>
);

export const IconStop: React.FC<IconProps> = ({ className = "text-red-400", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="10" className="fill-current opacity-25" />
    <rect x="8" y="8" width="8" height="8" rx="1.5" className="fill-current" />
  </svg>
);

export const IconLoop: React.FC<IconProps> = ({ className = "text-cyan-400", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <ellipse cx="12" cy="12" rx="9" ry="6" className="fill-current opacity-20" />
    <path d="M17 17H7C4.79086 17 3 15.2091 3 13C3 10.7909 4.79086 9 7 9H20M20 9L17 6M20 9L17 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 7H17C19.2091 7 21 8.79086 21 11C21 13.2091 19.2091 15 17 15H4M4 15L7 18M4 15L7 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
  </svg>
);

export const IconSeamAudition: React.FC<IconProps> = ({ className = "text-violet-400", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="5" width="18" height="14" rx="4" className="fill-current opacity-20" />
    <path d="M12 3V21" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" className="text-violet-300" />
    <path d="M8 12L5 9M8 12L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 12L19 9M16 12L19 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconDice: React.FC<IconProps> = ({ className = "text-purple-400", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="4" className="fill-current opacity-25" />
    <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="8" cy="8" r="1.5" className="fill-current" />
    <circle cx="16" cy="8" r="1.5" className="fill-current" />
    <circle cx="12" cy="12" r="1.5" className="fill-current" />
    <circle cx="8" cy="16" r="1.5" className="fill-current" />
    <circle cx="16" cy="16" r="1.5" className="fill-current" />
  </svg>
);

export const IconSparkles: React.FC<IconProps> = ({ className = "text-amber-400", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2L14.2 8.8L21 11L14.2 13.2L12 20L9.8 13.2L3 11L9.8 8.8L12 2Z" className="fill-current opacity-30" />
    <path d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="19" cy="4" r="1.5" className="fill-current" />
    <circle cx="4" cy="19" r="1.5" className="fill-current" />
  </svg>
);

export const IconWaveform: React.FC<IconProps> = ({ className = "text-sky-400", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="4" className="fill-current opacity-15" />
    <path d="M4 12H6M6 12L8 5L10 19L12 9L14 15L16 7L18 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconSliders: React.FC<IconProps> = ({ className = "text-blue-400", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 8H10M14 8H20M4 16H8M12 16H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
    <circle cx="12" cy="8" r="2.5" className="fill-current" />
    <circle cx="10" cy="16" r="2.5" className="fill-current" />
  </svg>
);

export const IconLayers: React.FC<IconProps> = ({ className = "text-indigo-400", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 3L21 8L12 13L3 8L12 3Z" className="fill-current opacity-30" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 12L12 17L21 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M3 16L12 21L21 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.4" />
  </svg>
);

export const IconDownload: React.FC<IconProps> = ({ className = "text-teal-400", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="4" y="17" width="16" height="4" rx="2" className="fill-current opacity-30" />
    <path d="M12 3V14M12 14L8 10M12 14L16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconImpact: React.FC<IconProps> = ({ className = "text-rose-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="7" className="fill-current opacity-30" />
    <path d="M12 2V6M12 18V22M2 12H6M18 12H22M5 5L8 8M16 16L19 19M19 5L16 8M8 16L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="3" className="fill-current" />
  </svg>
);

export const IconMotor: React.FC<IconProps> = ({ className = "text-amber-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" className="fill-current opacity-25" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M12 3V7M12 17V21M3 12H7M17 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconUI: React.FC<IconProps> = ({ className = "text-sky-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="8" className="fill-current opacity-25" />
    <path d="M12 7L13.5 10.5L17 12L13.5 13.5L12 17L10.5 13.5L7 12L10.5 10.5L12 7Z" className="fill-current" />
  </svg>
);

export const IconSciFi: React.FC<IconProps> = ({ className = "text-fuchsia-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" className="fill-current opacity-30" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

export const IconFootstep: React.FC<IconProps> = ({ className = "text-emerald-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <ellipse cx="14" cy="9" rx="4" ry="6" className="fill-current opacity-30" />
    <ellipse cx="10" cy="16" rx="3.5" ry="4.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const IconWhoosh: React.FC<IconProps> = ({ className = "text-cyan-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3 8C8 8 10 5 15 5C18 5 21 7 21 10C21 12 19 14 17 14H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M2 17C7 17 9 19 13 19C15 19 18 18 18 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
  </svg>
);

export const IconAmbient: React.FC<IconProps> = ({ className = "text-violet-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" className="fill-current opacity-20" />
    <path d="M7 14C8 10 10 10 12 14C14 18 16 18 17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconCheck: React.FC<IconProps> = ({ className = "text-emerald-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" className="fill-current opacity-25" />
    <path d="M8 12.5L10.5 15L16 9.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconFolder: React.FC<IconProps> = ({ className = "text-slate-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3 6C3 4.89543 3.89543 4 5 4H9.58579C10.1162 4 10.6249 4.21071 11 4.58579L12.4142 6H19C20.1046 6 21 6.89543 21 8V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6Z" className="fill-current opacity-25" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const IconSettings: React.FC<IconProps> = ({ className = "text-slate-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="3" className="fill-current" />
    <path d="M19.4 15A1.65 1.65 0 0 0 19.73 16.82L20.08 17.17A2 2 0 1 1 17.25 20L16.9 19.65A1.65 1.65 0 0 0 15.08 19.32A1.65 1.65 0 0 0 14 20.88V21.5A2 2 0 1 1 10 21.5V20.88A1.65 1.65 0 0 0 8.92 19.32A1.65 1.65 0 0 0 7.1 19.65L6.75 20A2 2 0 1 1 3.92 17.17L4.27 16.82A1.65 1.65 0 0 0 4.6 15A1.65 1.65 0 0 0 3.04 13.92H2.5A2 2 0 1 1 2.5 9.92H3.04A1.65 1.65 0 0 0 4.6 8.84A1.65 1.65 0 0 0 4.27 7.02L3.92 6.67A2 2 0 1 1 6.75 3.84L7.1 4.19A1.65 1.65 0 0 0 8.92 4.52A1.65 1.65 0 0 0 10 2.96V2.5A2 2 0 1 1 14 2.5V2.96A1.65 1.65 0 0 0 15.08 4.52A1.65 1.65 0 0 0 16.9 4.19L17.25 3.84A2 2 0 1 1 20.08 6.67L19.73 7.02A1.65 1.65 0 0 0 19.4 8.84A1.65 1.65 0 0 0 20.96 9.92H21.5A2 2 0 1 1 21.5 13.92H20.96A1.65 1.65 0 0 0 19.4 15Z" stroke="currentColor" strokeWidth="1.8" opacity="0.4" />
  </svg>
);

export const IconExplosion: React.FC<IconProps> = ({ className = "text-orange-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="8" className="fill-current opacity-25" />
    <path d="M12 2L14 8L20 6L16 11L22 14L16 16L19 22L13 18L10 22L9 16L3 18L6 13L2 10L8 9L6 3L12 7V2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="2.5" className="fill-current" />
  </svg>
);

export const IconWeather: React.FC<IconProps> = ({ className = "text-sky-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M17.5 17C19.9853 17 22 14.9853 22 12.5C22 10.158 20.2079 8.2346 17.9157 8.024C17.3789 5.1748 14.8872 3 11.875 3C8.42322 3 5.625 5.79822 5.625 9.25C5.625 9.774 5.69 10.2827 5.8115 10.7675C3.6304 11.238 2 13.176 2 15.5C2 18.2614 4.23858 20.5 7 20.5H17" className="fill-current opacity-20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 15L6 19M12 15L10 19M16 15L14 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconRetro: React.FC<IconProps> = ({ className = "text-lime-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="6" width="20" height="12" rx="4" className="fill-current opacity-20" stroke="currentColor" strokeWidth="1.8" />
    <path d="M6 12H10M8 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="15.5" cy="13" r="1.5" className="fill-current" />
    <circle cx="18" cy="10.5" r="1.5" className="fill-current" />
  </svg>
);

export const IconMagic: React.FC<IconProps> = ({ className = "text-fuchsia-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M14.5 4L20 9.5L6.5 23L1 17.5L14.5 4Z" className="fill-current opacity-20" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M11.5 7L17 12.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 3L9 1L10 3L12 4L10 5L9 7L8 5L6 4L8 3Z" className="fill-current" />
    <path d="M19 15L19.7 13.5L21.2 13L19.7 12.5L19 11L18.3 12.5L16.8 13L18.3 13.5L19 15Z" className="fill-current" />
  </svg>
);

export const IconWeapon: React.FC<IconProps> = ({ className = "text-red-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="8" className="fill-current opacity-20" />
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconCreature: React.FC<IconProps> = ({ className = "text-emerald-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 3C7 3 3 7 3 12C3 15.5 5 18 8 20L9 17L12 18L15 17L16 20C19 18 21 15.5 21 12C21 7 17 3 12 3Z" className="fill-current opacity-20" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="8.5" cy="11.5" r="1.5" className="fill-current" />
    <circle cx="15.5" cy="11.5" r="1.5" className="fill-current" />
    <path d="M8 15L10 14L12 15L14 14L16 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconCode: React.FC<IconProps> = ({ className = "text-cyan-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="4" className="fill-current opacity-20" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 9L5 12L8 15M16 9L19 12L16 15M13 8L11 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconFileAudio: React.FC<IconProps> = ({ className = "text-teal-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 4C4 2.89543 4.89543 2 6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" className="fill-current opacity-20" stroke="currentColor" strokeWidth="1.8" />
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 15V13M12 17V11M16 15V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconVolume: React.FC<IconProps> = ({ className = "text-cyan-400", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M11 5L6 9H2V15H6L11 19V5Z" className="fill-current opacity-25" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M15.54 8.46C16.48 9.4 17 10.68 17 12C17 13.32 16.48 14.6 15.54 15.54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M19.07 4.93C20.95 6.81 22 9.35 22 12C22 14.65 20.95 17.19 19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
  </svg>
);
