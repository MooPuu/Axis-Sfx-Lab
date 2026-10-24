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
