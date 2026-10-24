import { invoke } from "@tauri-apps/api/core";

export interface SynthParams {
  category: string;
  seed: number;
  duration_ms: number;
  sample_rate: number;
  base_freq: number;
  pitch_decay: number;
  decay_ms: number;
  material_preset: string;
  damping: number;
  brightness: number;
  resonance: number;
  noise_mix: number;
  harmonic_count: number;
  jitter_amount: number;
  fm_depth: number;
  fm_ratio: number;
  filter_cutoff: number;
  filter_resonance: number;
  drive: number;
  bitcrush: number;
  reverb_wet: number;
  reverb_decay: number;
  stereo_spread: number;
}

export interface LoopSettings {
  enabled: boolean;
  crossfade_ms: number;
  crossfade_curve: string;
  reverb_tail_wrap: boolean;
  tail_duration_ms: number;
  zero_crossing_snap: boolean;
  loop_start_ratio: number;
  loop_end_ratio: number;
}

export interface ProcessedAudioPayload {
  wav_base64: string;
  sample_rate: number;
  duration_ms: number;
  loop_start_sample: number;
  loop_end_sample: number;
  waveform_peaks: number[];
  seam_preview_base64?: string;
}

export interface PresetInfo {
  id: string;
  name: string;
  category: string;
  params: SynthParams;
}

class AudioPlayerEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private seamBuffer: AudioBuffer | null = null;
  private startTime: number = 0;
  private isLooping: boolean = false;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private onEndedCallback: (() => void) | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public async loadWavBase64(base64: string, isSeam: boolean = false): Promise<AudioBuffer> {
    this.initCtx();
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoded = await this.ctx!.decodeAudioData(bytes.buffer);
    if (isSeam) {
      this.seamBuffer = decoded;
    } else {
      this.audioBuffer = decoded;
    }
    return decoded;
  }

  public play(loop: boolean = false, onEnded?: () => void, offsetSeconds: number = 0) {
    if (!this.ctx || !this.audioBuffer || !this.masterGain) return;
    this.stop();

    this.isLooping = loop;
    this.isPlaying = true;
    this.onEndedCallback = onEnded || null;

    const source = this.ctx.createBufferSource();
    source.buffer = this.audioBuffer;
    source.loop = loop;
    source.connect(this.masterGain);

    const safeOffset = Math.max(0, Math.min(offsetSeconds, this.audioBuffer.duration - 0.01));
    this.startTime = this.ctx.currentTime - safeOffset;

    source.onended = () => {
      if (!this.isLooping) {
        this.isPlaying = false;
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      }
    };

    source.start(0, safeOffset);
    this.currentSource = source;
  }

  public seek(progressRatio: number) {
    if (!this.audioBuffer) return;
    const offset = progressRatio * this.audioBuffer.duration;
    if (this.isPlaying) {
      this.play(this.isLooping, this.onEndedCallback || undefined, offset);
    }
  }

  public playSeam(onEnded?: () => void) {
    if (!this.ctx || !this.seamBuffer || !this.masterGain) return;
    this.stop();

    this.isPlaying = true;
    const source = this.ctx.createBufferSource();
    source.buffer = this.seamBuffer;
    source.loop = true; // Loop the seam for auditioning
    source.connect(this.masterGain);

    source.start(0);
    this.currentSource = source;
    if (onEnded) {
      source.onended = onEnded;
    }
  }

  public stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // Source might already have ended
      }
      this.currentSource = null;
    }
    this.isPlaying = false;
  }

  public getPlaybackProgress(): number {
    if (!this.isPlaying || !this.ctx || !this.audioBuffer) return 0;
    const elapsed = this.ctx.currentTime - this.startTime;
    const dur = this.audioBuffer.duration;
    if (dur <= 0) return 0;
    return this.isLooping ? (elapsed % dur) / dur : Math.min(elapsed / dur, 1.0);
  }

  public getCurrentTime(): number {
    if (!this.audioBuffer) return 0;
    return this.getPlaybackProgress() * this.audioBuffer.duration;
  }

  public getDuration(): number {
    return this.audioBuffer ? this.audioBuffer.duration : 0;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioPlayer = new AudioPlayerEngine();

// API Invocation with safe fallback
export async function apiGenerateSfx(params: SynthParams, loopSettings: LoopSettings): Promise<ProcessedAudioPayload> {
  try {
    return await invoke<ProcessedAudioPayload>("cmd_generate_sfx", { params, loopSettings });
  } catch (err) {
    console.warn("Tauri invoke failed (running in pure web preview?), using fallback error:", err);
    throw err;
  }
}

export async function apiBatchVariations(
  params: SynthParams,
  loopSettings: LoopSettings,
  count: number,
  jitterPct: number
): Promise<[string, ProcessedAudioPayload][]> {
  return await invoke<[string, ProcessedAudioPayload][]>("cmd_batch_variations", {
    params,
    loopSettings,
    count,
    jitterPct,
  });
}

export async function apiGetFactoryPresets(): Promise<PresetInfo[]> {
  try {
    return await invoke<PresetInfo[]>("cmd_get_factory_presets");
  } catch (e) {
    console.error("Failed to fetch factory presets:", e);
    return [];
  }
}

export async function apiExportWav(filePath: string, wavBase64: string): Promise<string> {
  return await invoke<string>("cmd_export_wav_to_file", { filePath, wavBase64 });
}

// Download helper for web/tauri
export function triggerBrowserDownload(base64: string, filename: string) {
  const link = document.createElement("a");
  link.href = `data:audio/wav;base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
