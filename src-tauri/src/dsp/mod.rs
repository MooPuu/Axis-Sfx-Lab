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
use wav_writer::write_wav_with_loop;

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
