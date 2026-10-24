# Axis SFX Lab
### *Procedural Sound Effect Synthesizer & Seamless Audio Loop Studio*
**Made By Mahdi Kareem © 2026**

---

## ⚡ Overview
**Axis SFX Lab** is a high-performance, lightweight desktop workstation engineered for indie game developers, technical sound designers, and audio programmers. Built with **Tauri v2** and a native **Rust DSP core**, it marries parametric and physical-modeling sound synthesis with a dedicated **Seamless Loop Lab** that solves the notorious "reverb tail loop seam" problem once and for all.

---

## 💎 Core Architecture & Design
- **Desktop Framework:** Tauri v2 (MSVC / Windows Native)
- **Audio DSP Engine (Rust):** Custom state-variable biquad filters (SVF), modal resonators, exponential FM synthesis, Freeverb algorithmic reverb, and RIFF WAV writer with embedded `smpl` metadata chunks.
- **Frontend Workstation:** React 19 + TypeScript + Tailwind CSS v4 + High-DPI HTML5 Canvas.
- **Iconography & Visual Language:** Clean, minimal, modern cyber-laboratory aesthetic utilizing **Solar Duotone & Iconsax Duotone** two-tone SVG iconography (primary glyph with 0.35 opacity secondary depth layer).

---

## 🚀 Key Features

### 1. Procedural SFX Synthesis Engine
Generate game-ready sound effects purely from mathematical and physical models—no sample bloat or licensing restrictions:
* **Impact & Collision Lab:** Modal synthesis of struck physical bodies with material resonance presets: **Metal**, **Wood**, **Glass**, **Stone**, and **Organic/Flesh**.
* **Mechanical & Motors:** Simulation of electric servos, brush motors, turbine whines, rotational RPM jitter, and harmonic overtones.
* **UI & Micro-interactions:** Modern tactile clicks, glass drops, digital confirmation chimes, and haptic feedback taps.
* **Sci-Fi & Energy Generator:** Dual-oscillator FM synthesis, exponential laser frequency swoops, plasma blasts, and forcefield hums.
* **Movement & Foley:** Dual-stage footsteps (heel impact + scuff friction on dirt, gravel, wood, metal) and resonant airflow whooshes with Doppler curves.
* **Ambient Drones & Textures:** Detuned multi-oscillator pads layered with subtle Brownian noise beds for infinite atmospheric looping.

### 2. Seamless Loop Studio & Reverb Tail Utility
* **The "Folded Tail" Reverb Engine:** Solves the classic game audio dilemma where a loop cuts off ringing reverb or delay tails. Folds and sums the natural decay back over the start of the audio file with phase alignment.
* **Zero-Crossing Snapping:** Automatically detects and snaps loop start and end boundaries to positive-slope zero-amplitude crossings to eradicate pops and DC offset clicks.
* **Equal-Power Crossfading:** Smooth boundary blending with variable curves (Equal Power Cosine, Linear, Sigmoid S-Curve) from 2ms micro-smoothing up to 600ms ambient morphing.
* **Instant "Audition Seam" Button:** Loops only the transition junction (last 1s into first 1s) continuously so sound designers can verify seamlessness in 1 second without waiting for the full sound to cycle.

### 3. Game Engine Pipeline & Metadata Injection
* **RIFF WAV `smpl` Chunk Injection:** Injects sample-exact `LoopStart` and `LoopEnd` frame markers into the WAV header.
  - **Godot 4:** Auto-detected out of the box when import mode is set to *Detect From WAV*.
  - **Unity:** Read natively in uncompressed PCM mode, or paired with the included double-buffered C# `PlayScheduled(dspTime)` script snippet.
  - **Unreal Engine 5:** Drag-and-drop into MetaSounds `Wave Player` nodes.
* **Drag & Drop Ready:** Export directly from the app interface to your engine's asset dock or file explorer.

### 4. Batch Variation Vault
* Never settle for repetitive sound effects: generate **4, 8, or 16 organic variations** in 1 click with controlled seed drift (pitch, damping, resonance, and attack jitter) to eliminate player ear fatigue.

---

## ⌨️ Global Keyboard Shortcuts
| Key | Action |
| :--- | :--- |
| `Space` | Play / Pause |
| `L` | Toggle Seamless Loop Mode |
| `J` | Audition Seam Only |
| `M` | Mutate Sound (5% organic drift) |
| `R` | Completely Randomize Parameters |
| `E` | Open Game Engine Export Modal |

---

## 📦 Release Packages & Installers
Pre-compiled release binaries are organized in [`dist-releases/`](file:///c:/Users/pc/Documents/Open%20Code%20Projects/Axis%20SFX%20Lab/dist-releases):
- **NSIS Installer:** `Axis SFX Lab_1.0.0_NSIS_Setup.exe` (1.43 MB)
- **Windows Installer (MSI):** `Axis SFX Lab_1.0.0_Installer.msi` (2.08 MB)
- **Portable Executable:** `Axis SFX Lab_1.0.0_Portable.exe` (4.29 MB — zero install, run directly)

---

## 🛠️ Development & Building

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Rust & Cargo](https://rustup.rs/) (v1.80+)

### Setup
```bash
# Install frontend dependencies
npm install

# Run the desktop app in development mode
npm run tauri dev

# Build production bundle
npm run tauri build
```

---

## 📜 License & Credits
**Axis SFX Lab** is designed and crafted by **Mahdi Kareem © 2026**.
All generated audio files are 100% royalty-free for commercial and indie game development projects.
