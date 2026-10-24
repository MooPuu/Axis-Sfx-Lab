use std::f32::consts::PI;
use crate::dsp::effects::{apply_drive_and_bitcrush, DelayEffect, Freeverb, SvfFilter};

/// Linear congruential / simple deterministic PRNG for audio noise and parameter jitter
pub struct FastRng {
    state: u64,
}

impl FastRng {
    pub fn new(seed: u64) -> Self {
        Self {
            state: if seed == 0 { 0x853c49e6748fea9b } else { seed },
        }
    }

    #[inline]
    pub fn next_u32(&mut self) -> u32 {
        self.state = self.state.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
        (self.state >> 32) as u32
    }

    #[inline]
    pub fn next_f32(&mut self) -> f32 {
        (self.next_u32() as f32) / (u32::MAX as f32)
    }

    #[inline]
    pub fn next_bipolar(&mut self) -> f32 {
        self.next_f32() * 2.0 - 1.0
    }
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct SynthParams {
    pub category: String, // "impact" | "motor" | "ui" | "scifi" | "footstep" | "whoosh" | "ambient"
    pub seed: u64,
    pub duration_ms: f32,
    pub sample_rate: u32,
    
    // Core parameters
    pub base_freq: f32,
    pub pitch_decay: f32,
    pub decay_ms: f32,
    pub material_preset: String, // "metal" | "wood" | "glass" | "stone" | "flesh"
    pub damping: f32,
    pub brightness: f32,
    pub resonance: f32,
    pub noise_mix: f32,
    pub harmonic_count: u32,
    pub jitter_amount: f32,
    pub fm_depth: f32,
    pub fm_ratio: f32,
    pub filter_cutoff: f32,
    pub filter_resonance: f32,
    pub drive: f32,
    pub bitcrush: f32,
    pub reverb_wet: f32,
    pub reverb_decay: f32,
    pub stereo_spread: f32,
}

/// Generates raw stereo audio buffers based on the procedural recipe
pub fn generate_sound(params: &SynthParams) -> (Vec<f32>, Vec<f32>) {
    let sr = params.sample_rate as f32;
    let total_samples = ((params.duration_ms / 1000.0) * sr).round() as usize;
    let mut left = vec![0.0f32; total_samples];
    let mut right = vec![0.0f32; total_samples];

    let mut rng = FastRng::new(params.seed);

    match params.category.as_str() {
        "impact" => generate_impact(&mut left, &mut right, params, &mut rng, sr),
        "motor" => generate_motor(&mut left, &mut right, params, &mut rng, sr),
        "ui" => generate_ui(&mut left, &mut right, params, &mut rng, sr),
        "scifi" => generate_scifi(&mut left, &mut right, params, &mut rng, sr),
        "footstep" => generate_footstep(&mut left, &mut right, params, &mut rng, sr),
        "whoosh" => generate_whoosh(&mut left, &mut right, params, &mut rng, sr),
        "ambient" => generate_ambient(&mut left, &mut right, params, &mut rng, sr),
        _ => generate_impact(&mut left, &mut right, params, &mut rng, sr),
    }

    // Apply Post-FX: Filter, Saturation, Bitcrush, Stereo Delay, Reverb
    let mut filter_l = SvfFilter::new(params.filter_cutoff, params.filter_resonance);
    let mut filter_r = SvfFilter::new(params.filter_cutoff, params.filter_resonance);
    let mut delay = DelayEffect::new(params.sample_rate, 80.0, 0.25, params.stereo_spread * 0.3);
    let mut reverb = Freeverb::new(params.sample_rate, params.reverb_decay, 0.4);

    let mut peak = 0.001f32;

    for i in 0..total_samples {
        // Filter
        let fl = filter_l.process_lp(left[i], sr);
        let fr = filter_r.process_lp(right[i], sr);

        // Saturation & Bitcrush
        let drv_l = apply_drive_and_bitcrush(fl, params.drive, params.bitcrush);
        let drv_r = apply_drive_and_bitcrush(fr, params.drive, params.bitcrush);

        // Delay
        let (d_l, d_r) = delay.process(drv_l, drv_r);

        // Reverb
        let (rv_l, rv_r) = reverb.process(d_l, d_r, params.reverb_wet, 1.0 - params.reverb_wet * 0.4);

        left[i] = rv_l;
        right[i] = rv_r;

        peak = peak.max(rv_l.abs()).max(rv_r.abs());
    }

    // Auto-normalize to 0.95 peak
    if peak > 0.0001 {
        let norm = 0.95 / peak;
        for i in 0..total_samples {
            left[i] *= norm;
            right[i] *= norm;
        }
    }

    (left, right)
}

// -------------------------------------------------------------
// 1. IMPACT & COLLISION (Modal Synthesis)
// -------------------------------------------------------------
fn generate_impact(
    left: &mut [f32],
    right: &mut [f32],
    params: &SynthParams,
    rng: &mut FastRng,
    sr: f32,
) {
    let mode_ratios: &[f32] = match params.material_preset.as_str() {
        "metal" => &[1.0, 2.76, 5.4, 8.93, 13.34, 18.2],
        "wood" => &[1.0, 1.48, 2.8, 3.4],
        "glass" => &[1.0, 2.32, 4.15, 6.7, 9.8],
        "stone" => &[1.0, 1.73, 2.45, 3.8, 5.1],
        "flesh" => &[1.0, 1.25, 1.8],
        _ => &[1.0, 2.5, 4.2, 6.8],
    };

    let total = left.len();
    let base_f = params.base_freq.clamp(20.0, 4000.0);
    let damp_factor = params.damping.clamp(0.05, 5.0) * 15.0;

    for (m_idx, &ratio) in mode_ratios.iter().enumerate() {
        let f = (base_f * ratio).min(sr * 0.48);
        let mode_damp = damp_factor * (1.0 + (m_idx as f32) * 0.5 * (1.0 - params.brightness));
        let amp = 1.0 / ((m_idx as f32) * 0.8 + 1.0);
        let phase = rng.next_f32() * 2.0 * PI;

        for i in 0..total {
            let t = i as f32 / sr;
            let env = (-t * mode_damp).exp();
            let sig = (2.0 * PI * f * t + phase).sin() * env * amp;
            
            // Stereo panning spread for modes
            let pan = (m_idx as f32 / mode_ratios.len() as f32) * params.stereo_spread;
            left[i] += sig * (1.0 - pan * 0.5);
            right[i] += sig * (1.0 + pan * 0.5);
        }
    }

    // Transient attack noise strike (crack/click)
    let attack_len = ((sr * 0.015).round() as usize).min(total);
    for i in 0..attack_len {
        let t = i as f32 / attack_len as f32;
        let env = 1.0 - t;
        let n = rng.next_bipolar() * env * params.noise_mix * 1.5;
        left[i] += n;
        right[i] += n;
    }
}

// -------------------------------------------------------------
// 2. MOTOR & MECHANICAL HUM
// -------------------------------------------------------------
fn generate_motor(
    left: &mut [f32],
    right: &mut [f32],
    params: &SynthParams,
    rng: &mut FastRng,
    sr: f32,
) {
    let total = left.len();
    let num_harmonics = params.harmonic_count.clamp(1, 12) as usize;
    let mut phase = 0.0f32;
    let base_f = params.base_freq.clamp(10.0, 800.0);

    for i in 0..total {
        let t = i as f32 / sr;
        // Jitter / RPM flutter
        let flutter = (2.0 * PI * 4.0 * t).sin() * params.jitter_amount * 0.08
            + rng.next_bipolar() * params.jitter_amount * 0.02;
        let cur_f = (base_f * (1.0 + flutter)).clamp(5.0, sr * 0.45);

        phase += (2.0 * PI * cur_f) / sr;
        if phase > 2.0 * PI {
            phase -= 2.0 * PI;
        }

        let mut sample = 0.0f32;
        for h in 1..=num_harmonics {
            let h_f = phase * (h as f32);
            let h_amp = 1.0 / (h as f32).powf(1.2 - params.brightness * 0.5);
            sample += (h_f).sin() * h_amp;
        }

        // Sub-bass rumble
        let sub = (phase * 0.5).sin() * 0.4;
        
        // Mechanical brush noise
        let brush = rng.next_bipolar() * (phase.sin().abs().powi(4)) * params.noise_mix * 0.5;

        let combined = (sample + sub + brush) * 0.5;
        let pan = (2.0 * PI * 1.5 * t).sin() * params.stereo_spread * 0.2;

        left[i] = combined * (1.0 - pan);
        right[i] = combined * (1.0 + pan);
    }
}

// -------------------------------------------------------------
// 3. UI & MICRO-INTERACTION (Clicks, Pops, Chimes)
// -------------------------------------------------------------
fn generate_ui(
    left: &mut [f32],
    right: &mut [f32],
    params: &SynthParams,
    rng: &mut FastRng,
    sr: f32,
) {
    let total = left.len();
    let base_f = params.base_freq.clamp(100.0, 5000.0);
    let decay_sec = (params.decay_ms / 1000.0).max(0.005);

    let mut phase = 0.0f32;

    for i in 0..total {
        let t = i as f32 / sr;
        let env = (-t / decay_sec * 6.0).exp();

        // Bubble/chirp pitch drop
        let pitch_bend = (-(t * params.pitch_decay * 40.0)).exp();
        let cur_f = base_f * (1.0 + pitch_bend * 2.0);

        phase += (2.0 * PI * cur_f) / sr;
        let tone = (phase).sin() * env;

        // Micro-transient click at onset
        let click = if i < 150 {
            rng.next_bipolar() * (1.0 - i as f32 / 150.0) * params.noise_mix
        } else {
            0.0
        };

        // Chime overtone (fifth or octave)
        let chime = (phase * 1.5).sin() * env * params.brightness * 0.4;

        let combined = tone + click + chime;
        left[i] = combined;
        right[i] = combined;
    }
}

// -------------------------------------------------------------
// 4. SCI-FI & ENERGY (Laser, FM Blast, Plasma)
// -------------------------------------------------------------
fn generate_scifi(
    left: &mut [f32],
    right: &mut [f32],
    params: &SynthParams,
    _rng: &mut FastRng,
    sr: f32,
) {
    let total = left.len();
    let start_f = params.base_freq.clamp(50.0, 6000.0);
    let decay_sec = (params.duration_ms / 1000.0).max(0.05);

    let mut carrier_phase = 0.0f32;
    let mut mod_phase = 0.0f32;

    for i in 0..total {
        let t = i as f32 / sr;
        let t_norm = (t / decay_sec).clamp(0.0, 1.0);

        // Exponential pitch swoop
        let sweep = (-t_norm * params.pitch_decay * 8.0).exp();
        let f_carrier = (start_f * sweep).max(20.0);
        let f_mod = f_carrier * params.fm_ratio.clamp(0.2, 10.0);

        let fm_env = (-t_norm * 4.0).exp() * params.fm_depth * 15.0;

        mod_phase += (2.0 * PI * f_mod) / sr;
        let modulator = (mod_phase).sin() * fm_env;

        carrier_phase += (2.0 * PI * (f_carrier + modulator * f_carrier)) / sr;
        let carrier = (carrier_phase).sin();

        // Amplitude envelope
        let amp_env = (-t_norm * 3.5).exp();
        let sig = carrier * amp_env;

        let pan = (t_norm * 2.0 - 1.0) * params.stereo_spread;
        left[i] = sig * (1.0 - pan * 0.5);
        right[i] = sig * (1.0 + pan * 0.5);
    }
}

// -------------------------------------------------------------
// 5. FOOTSTEP & FOLEY
// -------------------------------------------------------------
fn generate_footstep(
    left: &mut [f32],
    right: &mut [f32],
    params: &SynthParams,
    rng: &mut FastRng,
    sr: f32,
) {
    let total = left.len();
    let base_f = params.base_freq.clamp(40.0, 200.0);

    // Layer 1: Heel impact thud
    let mut thud_filter = SvfFilter::new(base_f * 2.0, 1.5);
    
    // Layer 2: Ground scuff friction
    let scuff_cutoff = match params.material_preset.as_str() {
        "metal" => 3500.0,
        "wood" => 1200.0,
        "glass" => 4800.0,
        "stone" => 2200.0,
        _ => 1500.0,
    };
    let mut scuff_filter = SvfFilter::new(scuff_cutoff, 2.0);

    let impact_len = ((sr * 0.08).round() as usize).min(total);

    for i in 0..total {
        let t = i as f32 / sr;

        // Thud component
        let thud_env = (-t * 35.0).exp();
        let thud_osc = (2.0 * PI * base_f * (1.0 + (-t * 60.0).exp()) * t).sin();
        let raw_thud = thud_osc * thud_env;
        let thud = thud_filter.process_lp(raw_thud, sr);

        // Scuff component
        let scuff_env = if i < impact_len {
            (i as f32 / impact_len as f32) * (-t * 18.0).exp()
        } else {
            (-t * 22.0).exp()
        };
        let raw_scuff = rng.next_bipolar() * scuff_env * params.noise_mix;
        let scuff = scuff_filter.process_bp(raw_scuff, sr);

        let combined = thud * 1.2 + scuff * 1.5;
        left[i] = combined;
        right[i] = combined;
    }
}

// -------------------------------------------------------------
// 6. WHOOSH & SWIPE
// -------------------------------------------------------------
fn generate_whoosh(
    left: &mut [f32],
    right: &mut [f32],
    params: &SynthParams,
    rng: &mut FastRng,
    sr: f32,
) {
    let total = left.len();
    let mut filter_l = SvfFilter::new(300.0, 2.5);
    let mut filter_r = SvfFilter::new(300.0, 2.5);

    for i in 0..total {
        let t_norm = i as f32 / total as f32; // 0.0 -> 1.0

        // Bell curve envelope for whoosh peak
        let bell = (-( (t_norm - 0.5) * 4.0 ).powi(2)).exp();

        // Frequency sweep from low -> high peak -> low
        let sweep_f = 200.0 + bell * (params.base_freq.clamp(600.0, 4500.0) - 200.0);
        filter_l.cutoff = sweep_f;
        filter_r.cutoff = sweep_f * 1.05;

        let noise_in = rng.next_bipolar();
        let bp_l = filter_l.process_bp(noise_in, sr) * bell * 2.0;
        let bp_r = filter_r.process_bp(noise_in, sr) * bell * 2.0;

        // Stereo pan sweep left to right
        let pan = (t_norm * 2.0 - 1.0) * params.stereo_spread;
        left[i] = bp_l * (1.0 - pan * 0.7);
        right[i] = bp_r * (1.0 + pan * 0.7);
    }
}

// -------------------------------------------------------------
// 7. AMBIENT DRONE & TEXTURE
// -------------------------------------------------------------
fn generate_ambient(
    left: &mut [f32],
    right: &mut [f32],
    params: &SynthParams,
    rng: &mut FastRng,
    sr: f32,
) {
    let total = left.len();
    let base_f = params.base_freq.clamp(30.0, 600.0);

    let mut phase1 = 0.0f32;
    let mut phase2 = 0.0f32;
    let mut phase3 = 0.0f32;

    let detune = 1.004;

    for i in 0..total {
        let t = i as f32 / sr;

        phase1 += (2.0 * PI * base_f) / sr;
        phase2 += (2.0 * PI * base_f * detune) / sr;
        phase3 += (2.0 * PI * (base_f * 0.5)) / sr; // Sub octave

        // Gentle triangle/saw hybrid
        let v1 = phase1.sin();
        let v2 = (phase2.sin() + (phase2 * 2.0).sin() * 0.3) * 0.7;
        let v3 = phase3.sin() * 0.4;

        // Warm Brownian noise floor
        let rumble = rng.next_bipolar() * params.noise_mix * 0.15;

        // Slow LFO movement
        let lfo = (2.0 * PI * 0.2 * t).sin() * 0.2;

        let sig = (v1 + v2 + v3 + rumble) * (1.0 + lfo);

        let pan = (2.0 * PI * 0.1 * t).sin() * params.stereo_spread * 0.4;
        left[i] = sig * (1.0 - pan);
        right[i] = sig * (1.0 + pan);
    }
}
