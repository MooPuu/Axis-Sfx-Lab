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
  echo?: boolean;
  footwear?: string;
  movement?: string;
  character_type?: string;
  environment?: string;
  foot_side?: string;
  real_sfx_mode?: boolean;
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
  subcategory?: string;
  tags?: string[];
  is_loop?: boolean;
  params: SynthParams;
}

export interface CustomExportConfig {
  format: string; // "wav16" | "wav24" | "wav32" | "cheader" | "godot_bundle" | "stems"
  bit_depth: number;
  is_mono: boolean;
  target_sample_rate: number;
  normalize_peak: boolean;
  base_name: string;
}

export interface CustomExportResult {
  main_filename: string;
  main_base64: string;
  mime_type: string;
  c_header_text?: string;
  godot_import_text?: string;
  stem_intro_base64?: string;
  stem_intro_name?: string;
  stem_loop_base64?: string;
  stem_loop_name?: string;
  stem_tail_base64?: string;
  stem_tail_name?: string;
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
  private volume: number = 0.85;
  private onEndedCallback: (() => void) | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public async loadWavBase64(base64: string, isSeam: boolean = false): Promise<AudioBuffer> {
    this.initCtx();
    if (!base64) {
      const emptyBuf = this.ctx!.createBuffer(1, 1, 44100);
      if (isSeam) this.seamBuffer = emptyBuf;
      else this.audioBuffer = emptyBuf;
      return emptyBuf;
    }
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const decoded = await this.ctx!.decodeAudioData(bytes.buffer.slice(0));
    if (isSeam) {
      this.seamBuffer = decoded;
    } else {
      this.audioBuffer = decoded;
    }
    return decoded;
  }

  public play(loop: boolean = false, onEnded?: () => void, offsetSeconds: number = 0) {
    if (!this.audioBuffer) return;
    this.initCtx();
    this.stop();

    this.isLooping = loop;
    this.onEndedCallback = onEnded || null;

    const source = this.ctx!.createBufferSource();
    source.buffer = this.audioBuffer;
    source.loop = loop;
    source.connect(this.masterGain!);

    this.currentSource = source;
    this.startTime = this.ctx!.currentTime - offsetSeconds;
    this.isPlaying = true;

    source.onended = () => {
      if (!this.isLooping) {
        this.isPlaying = false;
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      }
    };

    source.start(0, offsetSeconds);
  }

  public seek(ratio: number) {
    if (!this.audioBuffer || !this.ctx) return;
    const dur = this.audioBuffer.duration;
    const offset = Math.max(0, Math.min(dur, ratio * dur));
    if (this.isPlaying) {
      this.play(this.isLooping, this.onEndedCallback || undefined, offset);
    }
  }

  public playSeam(onEnded?: () => void) {
    if (!this.seamBuffer) return;
    this.initCtx();
    this.stop();

    this.isLooping = false;
    this.onEndedCallback = onEnded || null;

    const source = this.ctx!.createBufferSource();
    source.buffer = this.seamBuffer;
    source.loop = false;
    source.connect(this.masterGain!);

    this.currentSource = source;
    this.startTime = this.ctx!.currentTime;
    this.isPlaying = true;

    source.onended = () => {
      this.isPlaying = false;
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    };

    source.start(0);
  }

  public stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // already stopped
      }
      this.currentSource = null;
    }
    this.isPlaying = false;
  }

  public getPlaybackProgress(): number {
    if (!this.isPlaying || !this.audioBuffer || !this.ctx) return 0;
    const elapsed = this.ctx.currentTime - this.startTime;
    const dur = this.audioBuffer.duration;
    if (dur <= 0) return 0;
    if (this.isLooping) {
      return (elapsed % dur) / dur;
    }
    return Math.min(1, elapsed / dur);
  }

  public getDuration(): number {
    return this.audioBuffer ? this.audioBuffer.duration : 0;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioPlayer = new AudioPlayerEngine();

function generateFallbackPeaks(count: number = 220): number[] {
  const peaks: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const attack = Math.min(1, i / (count * 0.035));
    const decay = Math.exp(-t * 3.8);
    const osc = Math.abs(Math.sin(t * 38) * 0.35 + Math.cos(t * 14) * 0.25 + 0.35);
    const val = Math.max(0.015, Math.min(0.96, attack * decay * osc));
    peaks.push(val);
  }
  return peaks;
}

// API Invocation with safe fallback
export async function apiGenerateSfx(params: SynthParams, loopSettings: LoopSettings): Promise<ProcessedAudioPayload> {
  try {
    return await invoke<ProcessedAudioPayload>("cmd_generate_sfx", { params, loopSettings });
  } catch (err) {
    const dur = params.duration_ms || 1200;
    const sr = params.sample_rate || 44100;
    return {
      wav_base64: "",
      sample_rate: sr,
      duration_ms: dur,
      waveform_peaks: generateFallbackPeaks(220),
      loop_start_sample: Math.round((dur * 0.05 * sr) / 1000),
      loop_end_sample: Math.round((dur * 0.95 * sr) / 1000),
      seam_preview_base64: undefined,
    };
  }
}

export async function apiBatchVariations(
  params: SynthParams,
  loopSettings: LoopSettings,
  count: number,
  jitterPct: number
): Promise<[string, ProcessedAudioPayload][]> {
  try {
    return await invoke<[string, ProcessedAudioPayload][]>("cmd_batch_variations", {
      params,
      loopSettings,
      count,
      jitterPct,
    });
  } catch {
    return [];
  }
}

export async function apiExportCustom(
  params: SynthParams,
  loopSettings: LoopSettings,
  config: CustomExportConfig
): Promise<CustomExportResult> {
  return await invoke<CustomExportResult>("cmd_export_custom", {
    params,
    loopSettings,
    config,
  });
}

export async function apiGetFactoryPresets(): Promise<PresetInfo[]> {
  try {
    return await invoke<PresetInfo[]>("cmd_get_factory_presets");
  } catch (e) {
    try {
      const resp = await fetch("/factoryPresets.json");
      if (resp.ok) {
        return await resp.json();
      }
    } catch {
      // ignore
    }
    return [];
  }
}

export async function apiExportWav(filePath: string, wavBase64: string): Promise<string> {
  return await invoke<string>("cmd_export_wav_to_file", { filePath, wavBase64 });
}

export async function apiSearchCloudSounds(
  query: string,
  limit: number = 12
): Promise<{ data: any[] }> {
  try {
    const raw = await invoke<string>("cmd_search_cloud_sounds", {
      query,
      limit,
    });
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Tauri cloud search failed, trying fallback:", err);
    const resp = await fetch(
      `https://api.lotsofsounds.com/api/v1/sounds/sample?q=${encodeURIComponent(
        query
      )}&limit=${limit}`
    );
    return await resp.json();
  }
}

export async function apiFetchAudioBase64(url: string): Promise<string> {
  try {
    return await invoke<string>("cmd_fetch_audio_base64", { url });
  } catch (err) {
    console.warn("Tauri audio fetch failed, trying direct fetch:", err);
    const resp = await fetch(url);
    const arrayBuffer = await resp.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, i + chunkSize))
      );
    }
    return btoa(binary);
  }
}

export async function apiDownloadCloudSound(soundId: string): Promise<string> {
  try {
    return await invoke<string>("cmd_download_cloud_sound", { soundId });
  } catch (err) {
    console.warn("Tauri cmd_download_cloud_sound failed, trying stream API fallback:", err);
    const streamApi = `https://api.lotsofsounds.com/api/v1/sounds/sample/${soundId}/stream`;
    const streamResp = await fetch(streamApi);
    if (!streamResp.ok) throw new Error("Failed to get stream url");
    const streamJson = await streamResp.json();
    const directUrl = streamJson.data.stream_url;
    return await apiFetchAudioBase64(directUrl);
  }
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function audioBufferToWavBase64(audioBuffer: AudioBuffer): string {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const numFrames = audioBuffer.length;
  const dataSize = numFrames * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const channelData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channelData.push(audioBuffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channelData[c][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunkSize))
    );
  }
  return btoa(binary);
}

export function extractWaveformPeaks(
  audioBuffer: AudioBuffer,
  peakCount: number = 100
): number[] {
  const channelData = audioBuffer.getChannelData(0);
  const totalLength = channelData.length;
  const blockSize = Math.floor(totalLength / peakCount) || 1;
  const peaks: number[] = [];

  for (let i = 0; i < peakCount; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, totalLength);
    let max = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > max) max = abs;
    }
    peaks.push(max);
  }
  return peaks;
}

export async function processRealAudioArrayBuffer(
  arrayBuffer: ArrayBuffer
): Promise<ProcessedAudioPayload> {
  const audioCtx = new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext)();
  const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const wavBase64 = audioBufferToWavBase64(decodedBuffer);
  const peaks = extractWaveformPeaks(decodedBuffer, 100);

  return {
    wav_base64: wavBase64,
    sample_rate: decodedBuffer.sampleRate,
    duration_ms: decodedBuffer.duration * 1000,
    loop_start_sample: Math.floor(decodedBuffer.length * 0.05),
    loop_end_sample: Math.floor(decodedBuffer.length * 0.95),
    waveform_peaks: peaks,
  };
}

export interface RealSoundItem {
  id: string;
  category: string;
  name: string;
  file: string;
  duration?: number;
}

export async function loadRealSoundFromFile(
  filePath: string
): Promise<ProcessedAudioPayload> {
  const resp = await fetch(filePath);
  const arrayBuffer = await resp.arrayBuffer();
  return processRealAudioArrayBuffer(arrayBuffer);
}

export async function loadRealSoundManifest(): Promise<RealSoundItem[]> {
  try {
    const resp = await fetch("/sounds/manifest.json");
    if (!resp.ok) return [];
    return await resp.json();
  } catch (err) {
    console.error("Failed to load real sounds manifest:", err);
    return [];
  }
}

export function triggerBrowserDownload(base64: string, filename: string, mimeType: string = "audio/wav") {
  const link = document.createElement("a");
  link.href = `data:${mimeType};base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function triggerTextDownload(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
