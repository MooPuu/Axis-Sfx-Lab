import React from "react";
import "./MuteCheckbox.css";

interface MuteCheckboxProps {
  isMuted: boolean;
  onToggle: (muted: boolean) => void;
  className?: string;
}

/**
 * Uiverse.io Checkbox by catraco (dry-robin-61)
 * Animated interactive volume/mute toggle switch
 */
export const MuteCheckbox: React.FC<MuteCheckboxProps> = ({ isMuted, onToggle, className = "" }) => {
  return (
    <div className={`mute-checkbox-wrapper ${className}`}>
      <label className="mute-checkbox-label" title={isMuted ? "Unmute Audio" : "Mute Audio"}>
        <input
          type="checkbox"
          checked={isMuted}
          onChange={(e) => onToggle(e.target.checked)}
          className="mute-checkbox-input"
        />
        <div className="mute-checkbox-container">
          {/* Animated Speaker & Soundwaves */}
          <svg
            className="speaker-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Speaker Body */}
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fillOpacity="0.2" />

            {/* Soundwaves (Wave 1 & Wave 2) */}
            <path className="soundwave wave-1" d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path className="soundwave wave-2" d="M19.07 4.93a10 10 0 0 1 0 14.14" />

            {/* Mute Slash Line */}
            <line className="mute-slash" x1="23" y1="1" x2="1" y2="23" />
          </svg>
        </div>
      </label>
    </div>
  );
};
