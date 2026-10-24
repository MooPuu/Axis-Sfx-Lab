pub mod effects;
pub mod loop_editor;
pub mod presets;
pub mod synth;
pub mod wav_writer;

use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use loop_editor::{generate_seam_audition_buffer, process_seamless_loop, LoopSettings};
use serde::{Deserialize, Serialize};
use synth::{generate_sound, FastRng, SynthParams};
use wav_writer::{generate_c_header, generate_godot_import, write_custom_wav, write_wav_with_loop};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ProcessedAudioPayload {
    pub wav_base64: String,
    pub sample_rate: u32,
    pub duration_ms: f32,
    pub loop_start_sample: u32,
    pub loop_end_sample: u32,
    pub waveform_peaks: Vec<f32>,
    pub seam_preview_base64: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CustomExportConfig {
    pub format: String, // "wav16" | "wav24" | "wav32" | "cheader" | "godot_bundle" | "stems"
    pub bit_depth: u16, // 16, 24, 32
    pub is_mono: bool,
    pub target_sample_rate: u32,
    pub normalize_peak: bool,
    pub base_name: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CustomExportResult {
    pub main_filename: String,
    pub main_base64: String,
    pub mime_type: String,
    pub c_header_text: Option<String>,
    pub godot_import_text: Option<String>,
    pub stem_intro_base64: Option<String>,
    pub stem_intro_name: Option<String>,
    pub stem_loop_base64: Option<String>,
    pub stem_loop_name: Option<String>,
    pub stem_tail_base64: Option<String>,
    pub stem_tail_name: Option<String>,
}

/// Compute downsampled waveform peaks for instant canvas visualization
pub fn extract_waveform_peaks(samples_l: &[f32], samples_r: &[f32], num_bins: usize) -> Vec<f32> {
    if samples_l.is_empty() {
        return vec![0.0; num_bins];
    }
    let total = samples_l.len();
    let bin_size = (total as f32 / num_bins as f32).max(1.0);
    let mut peaks = Vec::with_capacity(num_bins);

    for b in 0..num_bins {
        let start = ((b as f32) * bin_size) as usize;
        let end = (((b + 1) as f32) * bin_size).min(total as f32) as usize;

        let mut max_val = 0.0f32;
        for i in start..end {
            let avg = (samples_l[i].abs() + samples_r[i].abs()) * 0.5;
            if avg > max_val {
                max_val = avg;
            }
        }
        peaks.push(max_val.min(1.0));
    }

    peaks
}

/// Main pipeline: Synthesizes procedural sound, applies looping, generates metadata and base64 payloads
pub fn render_sfx_and_loop(
    params: &SynthParams,
    loop_settings: &LoopSettings,
) -> Result<ProcessedAudioPayload, String> {
    // 1. Synthesize procedural sound
    let (raw_l, raw_r) = generate_sound(params);

    // 2. Apply loop processing (zero-crossing, tail fold, seam crossfade)
    let (final_l, final_r, l_start, l_end) =
        process_seamless_loop(&raw_l, &raw_r, params.sample_rate, loop_settings);

    // 3. Write WAV with 'smpl' chunk
    let wav_bytes = write_wav_with_loop(
        &final_l,
        Some(&final_r),
        params.sample_rate,
        if loop_settings.enabled { Some(l_start) } else { None },
        if loop_settings.enabled { Some(l_end) } else { None },
    )?;

    let wav_base64 = BASE64.encode(&wav_bytes);

    // 4. Generate seam preview if looping is enabled
    let seam_preview_base64 = if loop_settings.enabled {
        let (seam_l, seam_r) = generate_seam_audition_buffer(&final_l, &final_r, params.sample_rate, 1.0);
        let seam_wav = write_wav_with_loop(&seam_l, Some(&seam_r), params.sample_rate, None, None)?;
        Some(BASE64.encode(&seam_wav))
    } else {
        None
    };

    // 5. Generate waveform peaks (512 points)
    let waveform_peaks = extract_waveform_peaks(&final_l, &final_r, 512);
    let duration_ms = (final_l.len() as f32 / params.sample_rate as f32) * 1000.0;

    Ok(ProcessedAudioPayload {
        wav_base64,
        sample_rate: params.sample_rate,
        duration_ms,
        loop_start_sample: l_start,
        loop_end_sample: l_end,
        waveform_peaks,
        seam_preview_base64,
    })
}

/// Batch variation generator: produces N varied audio files with controlled parameter jitter
pub fn generate_variations(
    base_params: &SynthParams,
    loop_settings: &LoopSettings,
    count: usize,
    jitter_pct: f32, // 0.05 = 5% jitter
) -> Result<Vec<(String, ProcessedAudioPayload)>, String> {
    let mut results = Vec::with_capacity(count);
    let mut rng = FastRng::new(base_params.seed.wrapping_add(999));

    for i in 0..count {
        let mut p = base_params.clone();
        p.seed = base_params.seed.wrapping_add((i as u64 + 1) * 739391);

        // Apply controlled organic jitter
        let pitch_jitter = 1.0 + rng.next_bipolar() * jitter_pct;
        p.base_freq = (p.base_freq * pitch_jitter).clamp(20.0, 12000.0);

        let decay_jitter = 1.0 + rng.next_bipolar() * jitter_pct * 1.5;
        p.decay_ms = (p.decay_ms * decay_jitter).max(10.0);

        let noise_jitter = 1.0 + rng.next_bipolar() * jitter_pct;
        p.noise_mix = (p.noise_mix * noise_jitter).clamp(0.0, 1.0);

        let damp_jitter = 1.0 + rng.next_bipolar() * jitter_pct;
        p.damping = (p.damping * damp_jitter).clamp(0.05, 5.0);

        let payload = render_sfx_and_loop(&p, loop_settings)?;
        let name = format!("{}_var_{:02}", base_params.category, i + 1);
        results.push((name, payload));
    }

    Ok(results)
}

/// Custom Game Engine & Multiformat Exporter
pub fn render_custom_export(
    params: &SynthParams,
    loop_settings: &LoopSettings,
    config: &CustomExportConfig,
) -> Result<CustomExportResult, String> {
    let mut p = params.clone();
    p.sample_rate = config.target_sample_rate;
    let (raw_l, raw_r) = generate_sound(&p);

    let (final_l, final_r, l_start, l_end) =
        process_seamless_loop(&raw_l, &raw_r, p.sample_rate, loop_settings);

    let mut peak = 0.0001f32;
    for &s in final_l.iter().chain(final_r.iter()) {
        if s.abs() > peak {
            peak = s.abs();
        }
    }

    let norm_factor = if config.normalize_peak && peak > 0.0001 {
        0.98 / peak
    } else {
        1.0
    };

    let norm_l: Vec<f32> = final_l.iter().map(|&x| x * norm_factor).collect();
    let norm_r: Vec<f32> = final_r.iter().map(|&x| x * norm_factor).collect();

    let loop_s = if loop_settings.enabled { Some(l_start) } else { None };
    let loop_e = if loop_settings.enabled { Some(l_end) } else { None };

    match config.format.as_str() {
        "cheader" => {
            let code = generate_c_header(&config.base_name, &norm_l, p.sample_rate, loop_s, loop_e);
            let b64 = BASE64.encode(code.as_bytes());
            Ok(CustomExportResult {
                main_filename: format!("{}.h", config.base_name),
                main_base64: b64,
                mime_type: "text/x-c".into(),
                c_header_text: Some(code),
                godot_import_text: None,
                stem_intro_base64: None,
                stem_intro_name: None,
                stem_loop_base64: None,
                stem_loop_name: None,
                stem_tail_base64: None,
                stem_tail_name: None,
            })
        }
        "godot_bundle" => {
            let depth = if config.bit_depth == 24 || config.bit_depth == 32 { config.bit_depth } else { 16 };
            let wav_bytes = write_custom_wav(
                &norm_l,
                if config.is_mono { None } else { Some(&norm_r) },
                p.sample_rate,
                depth,
                config.is_mono,
                loop_s,
                loop_e,
            )?;
            let import_code = generate_godot_import(p.sample_rate);
            Ok(CustomExportResult {
                main_filename: format!("{}.wav", config.base_name),
                main_base64: BASE64.encode(&wav_bytes),
                mime_type: "audio/wav".into(),
                c_header_text: None,
                godot_import_text: Some(import_code),
                stem_intro_base64: None,
                stem_intro_name: None,
                stem_loop_base64: None,
                stem_loop_name: None,
                stem_tail_base64: None,
                stem_tail_name: None,
            })
        }
        "stems" => {
            let total = norm_l.len();
            let split_pt = (total / 3).max(1);
            let split_pt2 = (2 * total / 3).max(split_pt + 1);

            let (intro_end, loop_end_pt) = if loop_settings.enabled && l_start < l_end && (l_end as usize) <= total {
                (l_start as usize, l_end as usize)
            } else {
                (split_pt, split_pt2)
            };

            let depth = if config.bit_depth == 24 || config.bit_depth == 32 { config.bit_depth } else { 16 };

            // Stem 1: Intro (0..intro_end)
            let intro_l = &norm_l[0..intro_end.max(1).min(total)];
            let intro_r = &norm_r[0..intro_end.max(1).min(total)];
            let intro_wav = write_custom_wav(intro_l, if config.is_mono { None } else { Some(intro_r) }, p.sample_rate, depth, config.is_mono, None, None)?;

            // Stem 2: Loop body
            let loop_slice_l = &norm_l[intro_end.min(total)..loop_end_pt.min(total)];
            let loop_slice_r = &norm_r[intro_end.min(total)..loop_end_pt.min(total)];
            let loop_wav = write_custom_wav(loop_slice_l, if config.is_mono { None } else { Some(loop_slice_r) }, p.sample_rate, depth, config.is_mono, Some(0), Some(loop_slice_l.len() as u32))?;

            // Stem 3: Tail
            let tail_slice_l = &norm_l[loop_end_pt.min(total)..total];
            let tail_slice_r = &norm_r[loop_end_pt.min(total)..total];
            let tail_wav = write_custom_wav(tail_slice_l, if config.is_mono { None } else { Some(tail_slice_r) }, p.sample_rate, depth, config.is_mono, None, None)?;

            let main_wav = write_custom_wav(&norm_l, if config.is_mono { None } else { Some(&norm_r) }, p.sample_rate, depth, config.is_mono, loop_s, loop_e)?;

            Ok(CustomExportResult {
                main_filename: format!("{}_full.wav", config.base_name),
                main_base64: BASE64.encode(&main_wav),
                mime_type: "audio/wav".into(),
                c_header_text: None,
                godot_import_text: None,
                stem_intro_base64: Some(BASE64.encode(&intro_wav)),
                stem_intro_name: Some(format!("{}_intro.wav", config.base_name)),
                stem_loop_base64: Some(BASE64.encode(&loop_wav)),
                stem_loop_name: Some(format!("{}_loop.wav", config.base_name)),
                stem_tail_base64: Some(BASE64.encode(&tail_wav)),
                stem_tail_name: Some(format!("{}_tail.wav", config.base_name)),
            })
        }
        _ => {
            // "wav16", "wav24", "wav32"
            let depth = match config.format.as_str() {
                "wav24" => 24,
                "wav32" => 32,
                _ => 16,
            };
            let wav_bytes = write_custom_wav(
                &norm_l,
                if config.is_mono { None } else { Some(&norm_r) },
                p.sample_rate,
                depth,
                config.is_mono,
                loop_s,
                loop_e,
            )?;
            Ok(CustomExportResult {
                main_filename: format!("{}.wav", config.base_name),
                main_base64: BASE64.encode(&wav_bytes),
                mime_type: "audio/wav".into(),
                c_header_text: None,
                godot_import_text: None,
                stem_intro_base64: None,
                stem_intro_name: None,
                stem_loop_base64: None,
                stem_loop_name: None,
                stem_tail_base64: None,
                stem_tail_name: None,
            })
        }
    }
}
