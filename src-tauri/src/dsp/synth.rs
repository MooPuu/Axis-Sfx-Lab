use std::f32::consts::PI;
use crate::dsp::effects::{apply_drive_and_bitcrush, DelayEffect, Freeverb, SvfFilter};

/// High-performance deterministic PRNG with Pink & Brown noise spectral shaping
pub struct FastRng {
    state: u64,
    b0: f32,
    b1: f32,
    b2: f32,
    brown: f32,
}

impl FastRng {
    pub fn new(seed: u64) -> Self {
        Self {
            state: if seed == 0 { 0x853c49e6748fea9b } else { seed },
            b0: 0.0,
            b1: 0.0,
            b2: 0.0,
            brown: 0.0,
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

    #[inline]
    pub fn next_pink(&mut self) -> f32 {
        let white = self.next_bipolar();
        self.b0 = 0.99886 * self.b0 + white * 0.0555179;
        self.b1 = 0.99332 * self.b1 + white * 0.0750759;
        self.b2 = 0.96900 * self.b2 + white * 0.1538520;
        (self.b0 + self.b1 + self.b2 + white * 0.5362) * 0.18
    }

    #[inline]
    pub fn next_brown(&mut self) -> f32 {
        let white = self.next_bipolar();
        self.brown = (self.brown + 0.02 * white) / 1.02;
        self.brown * 3.5
    }
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct SynthParams {
    pub category: String, // "impact" | "motor" | "ui" | "scifi" | "footstep" | "whoosh" | "ambient" | "explosion" | "weather" | "retro" | "magic" | "weapon" | "creature"
    pub seed: u64,
    pub duration_ms: f32,
    pub sample_rate: u32,
    
    // Core parameters
    pub base_freq: f32,
    pub pitch_decay: f32,
    pub decay_ms: f32,
    pub material_preset: String,
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
    #[serde(default)]
    pub echo: bool,
}

/// Generates raw stereo audio buffers based on the procedural recipe
pub fn generate_sound(params: &SynthParams) -> (Vec<f32>, Vec<f32>) {
    let sr = params.sample_rate as f32;
    let duration_ms = if params.echo && params.duration_ms < 850.0 {
        params.duration_ms.max(850.0)
    } else {
        params.duration_ms
    };
    let total_samples = ((duration_ms / 1000.0) * sr).round() as usize;
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
        "explosion" => generate_explosion(&mut left, &mut right, params, &mut rng, sr),
        "weather" => generate_weather(&mut left, &mut right, params, &mut rng, sr),
        "retro" => generate_retro(&mut left, &mut right, params, &mut rng, sr),
        "magic" => generate_magic(&mut left, &mut right, params, &mut rng, sr),
        "weapon" => generate_weapon(&mut left, &mut right, params, &mut rng, sr),
        "creature" => generate_creature(&mut left, &mut right, params, &mut rng, sr),
        _ => generate_impact(&mut left, &mut right, params, &mut rng, sr),
    }

    // Apply Echo slapback effect (hallway / corridor / cavern / canyon acoustic reflection)
    if params.echo {
        let mut echo_delay = DelayEffect::new(params.sample_rate, 160.0, 0.42, 0.52);
        let mut echo_filter_l = SvfFilter::new(3400.0, 1.0);
        let mut echo_filter_r = SvfFilter::new(3400.0, 1.0);
        for i in 0..total_samples {
            let (dl, dr) = echo_delay.process(left[i], right[i]);
            let fl = echo_filter_l.process_lp(dl, sr);
            let fr = echo_filter_r.process_lp(dr, sr);
            left[i] = left[i] * 0.72 + fl * 0.48;
            right[i] = right[i] * 0.72 + fr * 0.48;
        }
    }

    // Apply Post-FX: Filter, Saturation, Bitcrush, Stereo Delay, Reverb
    let mut filter_l = SvfFilter::new(params.filter_cutoff, params.filter_resonance);
    let mut filter_r = SvfFilter::new(params.filter_cutoff, params.filter_resonance);
    let mut delay = DelayEffect::new(params.sample_rate, 80.0, 0.25, params.stereo_spread * 0.3);
    let mut reverb = Freeverb::new(params.sample_rate, params.reverb_decay, 0.4);

    let mut peak = 0.001f32;

    for i in 0..total_samples {
        // Filter only if cutoff is under 15000 Hz to retain high-end sparkle
        let (fl, fr) = if params.filter_cutoff < 15000.0 {
            (filter_l.process_lp(left[i], sr), filter_r.process_lp(right[i], sr))
        } else {
            (left[i], right[i])
        };

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
// 1. IMPACT & COLLISION (Multi-Layer Physical Modal Synthesis)
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

    // Layer 1: Sub-bass weight body (gives chest punch to heavy impacts)
    let sub_len = ((sr * 0.15).round() as usize).min(total);
    for i in 0..sub_len {
        let t = i as f32 / sr;
        let sub_pitch = (base_f.min(100.0) * (-t * 30.0).exp() + 35.0) * (2.0 * PI / sr);
        let sub_env = (-t * 22.0).exp();
        let sub_val = (i as f32 * sub_pitch).sin() * sub_env * 1.2;
        left[i] += sub_val;
        right[i] += sub_val;
    }

    // Layer 2: Modal Material Resonance
    for (m_idx, &ratio) in mode_ratios.iter().enumerate() {
        let f = (base_f * ratio).min(sr * 0.48);
        let mode_damp = damp_factor * (1.0 + (m_idx as f32) * 0.5 * (1.0 - params.brightness));
        let amp = 1.0 / ((m_idx as f32) * 0.8 + 1.0);
        let phase = rng.next_f32() * 2.0 * PI;

        for i in 0..total {
            let t = i as f32 / sr;
            let env = (-t * mode_damp).exp();
            let sig = (2.0 * PI * f * t + phase).sin() * env * amp;

            let pan = ((m_idx as f32 / mode_ratios.len() as f32) * 2.0 - 1.0) * params.stereo_spread;
            left[i] += sig * (1.0 - pan * 0.5);
            right[i] += sig * (1.0 + pan * 0.5);
        }
    }

    // Layer 3: Initial Strike Transient & Crack
    let crack_len = ((sr * 0.025).round() as usize).min(total);
    for i in 0..crack_len {
        let env = (1.0 - i as f32 / crack_len as f32).powi(3);
        let crack = rng.next_bipolar() * env * params.noise_mix * 1.8;
        left[i] += crack;
        right[i] += crack;
    }
}

// -------------------------------------------------------------
// 2. MOTOR & ENGINES (Harmonic Combustion & Turbines)
// -------------------------------------------------------------
fn generate_motor(
    left: &mut [f32],
    right: &mut [f32],
    params: &SynthParams,
    rng: &mut FastRng,
    sr: f32,
) {
    let total = left.len();
    let rpm_base = params.base_freq.clamp(20.0, 1000.0);
    let num_harmonics = params.harmonic_count.clamp(1, 12);
    let mut phase = 0.0f32;

    for i in 0..total {
        let t = i as f32 / sr;
        // RPM flutter & engine jitter
        let flutter = (2.0 * PI * 4.5 * t).sin() * params.jitter_amount * 0.08;
        let cur_f = rpm_base * (1.0 + flutter);

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

        let sub = (phase * 0.5).sin() * 0.4;
        let brush = rng.next_pink() * (phase.sin().abs().powi(4)) * params.noise_mix * 0.7;
        let combined = (sample + sub + brush) * 0.5;
        let pan = (2.0 * PI * 1.5 * t).sin() * params.stereo_spread * 0.2;

        left[i] = combined * (1.0 - pan);
        right[i] = combined * (1.0 + pan);
    }
}

// -------------------------------------------------------------
// 3. UI, NOTIFICATIONS, CLICKS & TYPING (Pixabay Authentic)
// -------------------------------------------------------------
fn generate_ui(
    left: &mut [f32],
    right: &mut [f32],
    params: &SynthParams,
    rng: &mut FastRng,
    sr: f32,
) {
    let total = left.len();
    let base_f = params.base_freq.clamp(80.0, 4200.0);
    let decay_sec = (params.decay_ms / 1000.0).max(0.008);

    match params.material_preset.as_str() {
        "glass" => {
            // Modern Dual-Tone Musical Notification Chime (Pixabay Notification)
            let note2_start = ((sr * 0.055).round() as usize).min(total / 2); // 55ms offset chime
            let f1 = base_f;
            let f2 = base_f * if params.pitch_decay > 0.0 { 1.5 } else { 1.2599 }; // Perfect 5th or Major 3rd
            let mut phase1 = 0.0f32;
            let mut phase2 = 0.0f32;

            for i in 0..total {
                let t = i as f32 / sr;
                let env1 = (-t / (decay_sec * 0.7) * 4.5).exp();
                phase1 += (2.0 * PI * f1) / sr;
                let sig1 = (phase1.sin() + (phase1 * 2.0).sin() * 0.25 * params.brightness) * env1;

                let sig2 = if i >= note2_start {
                    let t2 = (i - note2_start) as f32 / sr;
                    let env2 = (-t2 / decay_sec * 4.0).exp();
                    phase2 += (2.0 * PI * f2) / sr;
                    (phase2.sin() + (phase2 * 2.0).sin() * 0.3 * params.brightness) * env2
                } else {
                    0.0
                };

                let click = if i < 35 { rng.next_bipolar() * (1.0 - i as f32 / 35.0) * 0.1 } else { 0.0 };
                let combined = sig1 * 0.65 + sig2 * 0.85 + click;
                left[i] = combined * 0.95;
                right[i] = combined * 1.05;
            }
        }
        "wood" => {
            // Mechanical Keyboard Keystroke (Pixabay Typing)
            // 1. High plastic switch click (<2ms)
            // 2. Hollow keycap cavity thump (280-360 Hz)
            let mut cavity_filter = SvfFilter::new(320.0, 2.8);
            let mut click_filter = SvfFilter::new(4800.0, 1.8);

            for i in 0..total {
                let t = i as f32 / sr;
                let click_env = if i < 120 { (-t * 1200.0).exp() } else { 0.0 };
                let raw_click = rng.next_bipolar() * click_env;
                let click = click_filter.process_hp(raw_click, sr);

                let cavity_env = (-t * 55.0).exp();
                let cavity_osc = (2.0 * PI * (base_f * 0.4) * t).sin() * cavity_env;
                let cavity = cavity_filter.process_lp(cavity_osc, sr);

                let combined = click * 1.8 * params.noise_mix + cavity * 1.2;
                left[i] = combined;
                right[i] = combined;
            }
        }
        "flesh" => {
            // Tactile Bubble / Water Drop Pop (Pixabay UI Notification)
            // Fast upward or downward pitch chirp with zero harshness
            let mut phase = 0.0f32;
            for i in 0..total {
                let t = i as f32 / sr;
                let t_norm = (t / decay_sec).clamp(0.0, 1.0);
                let env = (-t_norm * 5.0).exp();
                let cur_f = base_f * (0.6 + (-t * 80.0).exp() * 1.4);
                phase += (2.0 * PI * cur_f) / sr;
                let sig = phase.sin() * env;
                left[i] = sig;
                right[i] = sig;
            }
        }
        _ => {
            // Crisp Tactile Micro-Click (Mouse switch / button press)
            let mut filter = SvfFilter::new(base_f * 1.5, 2.0);
            let mut phase = 0.0f32;
            for i in 0..total {
                let t = i as f32 / sr;
                let env = (-t * 180.0).exp();
                let click = if i < 80 { rng.next_bipolar() * (-t * 800.0).exp() * params.noise_mix } else { 0.0 };
                phase += (2.0 * PI * base_f) / sr;
                let body = phase.sin() * env;
                let filtered = filter.process_bp(click * 1.5 + body, sr);
                left[i] = filtered;
                right[i] = filtered;
            }
        }
    }
}

// -------------------------------------------------------------
// 4. SCI-FI & GLITCH (FM Modulation & Granular Stutter)
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

    let is_glitch = params.material_preset == "metal" || params.bitcrush > 0.04;
    let grain_size = ((sr * 0.028) as usize).max(64); // 28ms glitch grain

    for i in 0..total {
        let t = i as f32 / sr;
        let t_norm = (t / decay_sec).clamp(0.0, 1.0);

        let sweep = (-t_norm * params.pitch_decay * 8.0).exp();
        let f_carrier = (start_f * sweep).max(20.0);
        let f_mod = f_carrier * params.fm_ratio.clamp(0.2, 10.0);

        let fm_env = (-t_norm * 4.0).exp() * params.fm_depth * 18.0;

        mod_phase += (2.0 * PI * f_mod) / sr;
        let modulator = (mod_phase).sin() * fm_env;

        carrier_phase += (2.0 * PI * (f_carrier + modulator * f_carrier)) / sr;
        let carrier = (carrier_phase).sin();

        let amp_env = (-t_norm * 3.5).exp();
        let mut sig = carrier * amp_env;

        // Glitch stutter: repeat grains
        if is_glitch && i > grain_size * 2 && (i / grain_size) % 3 == 0 {
            let grain_offset = i % grain_size;
            let glitch_pulse = (grain_offset as f32 / grain_size as f32 * 2.0 * PI).sin();
            sig = sig * 0.4 + glitch_pulse * 0.6;
        }

        let pan = (t_norm * 2.0 - 1.0) * params.stereo_spread;
        left[i] = sig * (1.0 - pan * 0.5);
        right[i] = sig * (1.0 + pan * 0.5);
    }
}

// -------------------------------------------------------------
// 5. FOOTSTEP & FOLEY (Multi-Surface Physical Contact Model)
// -------------------------------------------------------------
fn generate_footstep(
    left: &mut [f32],
    right: &mut [f32],
    params: &SynthParams,
    rng: &mut FastRng,
    sr: f32,
) {
    let total = left.len();
    let base_f = params.base_freq.clamp(35.0, 300.0);
    let toe_start = ((sr * 0.048) as usize).min(total / 2);
    let mat = params.material_preset.to_lowercase();

    match mat.as_str() {
        "grass" => {
            // 1. Grass & Lawn:
            // Soft damp heel ground absorption + crinkling grass blades crushing & fibrous snap
            let mut grass_bp = SvfFilter::new(3600.0, 1.8);
            let mut grass_hp = SvfFilter::new(4800.0, 1.2);
            let mut ground_lp = SvfFilter::new(120.0, 1.5);

            for i in 0..total {
                let t = i as f32 / sr;

                // Soft ground compaction thump
                let heel_env = (-t * 48.0).exp();
                let ground_thump = ground_lp.process_lp(
                    (2.0 * PI * 85.0 * t).sin() * heel_env * 1.1 + rng.next_brown() * heel_env * 0.9,
                    sr,
                );

                // Crinkling blades of grass bending underfoot
                let blade_env = if i > 100 && i < ((sr * 0.16) as usize).min(total) {
                    let bt = (i - 100) as f32 / sr;
                    (-bt * 28.0).exp() * (1.0 + if rng.next_f32() > 0.82 { 1.8 } else { 0.0 })
                } else {
                    0.0
                };
                let blade_crush = grass_bp.process_bp(rng.next_pink() * blade_env * 2.2, sr)
                    + grass_hp.process_hp(rng.next_bipolar() * blade_env * 1.1, sr);

                // Toe-off turf brush
                let toe_swish = if i >= toe_start {
                    let tt = (i - toe_start) as f32 / sr;
                    let tenv = (-tt * 38.0).exp();
                    grass_bp.process_bp(rng.next_pink() * tenv * 1.2 * params.noise_mix, sr)
                } else {
                    0.0
                };

                let combined = ground_thump * 1.2 + blade_crush * 1.6 * params.noise_mix + toe_swish * 1.1;
                let pan = params.stereo_spread * 0.15;
                left[i] = combined * (1.0 - pan);
                right[i] = combined * (1.0 + pan);
            }
        }
        "sand" => {
            // 2. Sand & Dune:
            // Granular sink thump + sweeping frictional grain slip (2400Hz -> 850Hz)
            let mut sand_filter = SvfFilter::new(1800.0, 2.2);
            let mut bed_filter = SvfFilter::new(140.0, 1.8);

            for i in 0..total {
                let t = i as f32 / sr;

                let heel_env = (-t * 36.0).exp();
                let sink_thump = bed_filter.process_lp(
                    (2.0 * PI * 95.0 * t).sin() * heel_env + rng.next_brown() * heel_env * 1.2,
                    sr,
                );

                let friction_f = 2400.0 * (-t * 20.0).exp() + 850.0;
                sand_filter.cutoff = friction_f;

                let friction_env = (-t * 22.0).exp();
                let grit = (rng.next_pink() + rng.next_bipolar() * 0.35) * friction_env * 1.8 * params.noise_mix;
                let sand_grain = sand_filter.process_bp(grit, sr);

                let toe_sand = if i >= toe_start {
                    let tt = (i - toe_start) as f32 / sr;
                    let tenv = (-tt * 24.0).exp();
                    sand_filter.process_bp(rng.next_pink() * tenv * 1.3, sr)
                } else {
                    0.0
                };

                let combined = sink_thump * 1.3 + sand_grain * 1.7 + toe_sand * 1.2;
                left[i] = combined;
                right[i] = combined;
            }
        }
        "floor" => {
            // 3. Interior Tile / Hardwood Floor:
            // Crisp, instantaneous shoe sole tap transient + tight room cavity bounce (480Hz)
            let mut tap_filter = SvfFilter::new(3400.0, 1.8);
            let mut cavity_filter = SvfFilter::new(480.0, 2.5);

            for i in 0..total {
                let t = i as f32 / sr;

                // Sole tap click (<3ms)
                let click_env = if i < 140 { (-t * 1200.0).exp() } else { 0.0 };
                let click = tap_filter.process_hp(rng.next_bipolar() * click_env * 2.2, sr);

                // Flat floor bounce
                let body_env = (-t * 52.0).exp();
                let body_osc = (2.0 * PI * 220.0 * t).sin() * body_env;
                let body = cavity_filter.process_bp(body_osc + rng.next_brown() * body_env * 0.8, sr);

                // Clean toe tap
                let toe = if i >= toe_start && i < toe_start + 180 {
                    let tt = (i - toe_start) as f32 / sr;
                    let tenv = (-tt * 800.0).exp();
                    tap_filter.process_hp(rng.next_bipolar() * tenv * 1.4, sr)
                } else {
                    0.0
                };

                let combined = click * 1.8 + body * 1.6 + toe * 1.2;
                left[i] = combined;
                right[i] = combined;
            }
        }
        "iron" | "iron floor" | "metal" => {
            // 4. Iron Floor & Metal Grate / Industrial Catwalk:
            // Sharp steel strike clink + multi-modal plate resonance (380Hz, 820Hz, 1480Hz, 2350Hz)
            let mut clink_filter = SvfFilter::new(4800.0, 2.0);
            let mut plate_filter = SvfFilter::new(820.0, 4.0);

            for i in 0..total {
                let t = i as f32 / sr;

                let clink_env = if i < 180 { (-t * 900.0).exp() } else { 0.0 };
                let clink = clink_filter.process_hp(rng.next_bipolar() * clink_env * 2.5, sr);

                let mode_env = (-t * 22.0).exp() * (1.0 - params.damping * 0.3).max(0.1);
                let mode1 = (2.0 * PI * 380.0 * t).sin() * 0.5;
                let mode2 = (2.0 * PI * 820.0 * t).sin() * 0.4;
                let mode3 = (2.0 * PI * 1480.0 * t).sin() * 0.25;
                let mode4 = (2.0 * PI * 2350.0 * t).sin() * 0.15;
                let modal_sum = (mode1 + mode2 + mode3 + mode4) * mode_env;
                let plate = plate_filter.process_bp(modal_sum, sr);

                let toe_clank = if i >= toe_start {
                    let tt = (i - toe_start) as f32 / sr;
                    let tenv = (-tt * 38.0).exp();
                    (2.0 * PI * 1150.0 * tt).sin() * tenv * 0.5 + rng.next_bipolar() * tenv * 0.3
                } else {
                    0.0
                };

                let combined = clink * 1.6 + plate * 1.8 + toe_clank * 1.1;
                let pan = params.stereo_spread * 0.25;
                left[i] = combined * (1.0 - pan);
                right[i] = combined * (1.0 + pan);
            }
        }
        "wood" | "wooden floor" => {
            // 5. Wooden Floor & Hollow Planks:
            // Leather sole slap + warm hollow floorboard acoustic box (195Hz & 340Hz)
            let mut sole_filter = SvfFilter::new(1800.0, 1.5);
            let mut box_filter1 = SvfFilter::new(195.0, 3.2);
            let mut box_filter2 = SvfFilter::new(340.0, 2.5);

            for i in 0..total {
                let t = i as f32 / sr;

                let tap_env = if i < 150 { (-t * 1100.0).exp() } else { 0.0 };
                let tap = sole_filter.process_bp(rng.next_bipolar() * tap_env * 2.0, sr);

                let body_env = (-t * 40.0).exp();
                let b1 = box_filter1.process_bp((2.0 * PI * 195.0 * t).sin() * body_env * 1.8, sr);
                let b2 = box_filter2.process_bp((2.0 * PI * 340.0 * t).sin() * body_env * 1.2, sr);
                let wood_body = (b1 + b2) * 1.4 + rng.next_brown() * body_env * 0.8;

                let toe_knock = if i >= toe_start {
                    let tt = (i - toe_start) as f32 / sr;
                    let tenv = (-tt * 45.0).exp();
                    box_filter1.process_bp((2.0 * PI * 220.0 * tt).sin() * tenv * 1.1, sr)
                } else {
                    0.0
                };

                let combined = tap * 1.5 + wood_body * 1.5 + toe_knock * 1.0;
                left[i] = combined;
                right[i] = combined;
            }
        }
        "mud" => {
            // 6. Wet Mud & Suction Squelch:
            // Viscous fluid plop + resonant bubbling + suction vacuum release "shluck"
            let mut squelch_filter = SvfFilter::new(1250.0, 3.0);
            let release_start = toe_start + ((sr * 0.035) as usize);

            for i in 0..total {
                let t = i as f32 / sr;

                let heel_env = (-t * 32.0).exp();
                let sludge_osc = (2.0 * PI * 70.0 * (1.0 + (-t * 50.0).exp()) * t).sin();
                let sludge = sludge_osc * heel_env * 1.6 + rng.next_brown() * heel_env * 1.4;

                let bubble_f = 500.0 + (2.0 * PI * 18.0 * t).sin().abs() * 800.0;
                squelch_filter.cutoff = bubble_f;
                let squelch_env = (-t * 26.0).exp();
                let squelch_noise = rng.next_pink() * squelch_env * 1.8 * params.noise_mix;
                let squelch = squelch_filter.process_bp(squelch_noise, sr);

                let suction = if i >= release_start && i < release_start + ((sr * 0.08) as usize).min(total) {
                    let st = (i - release_start) as f32 / sr;
                    let senv = (-st * 45.0).exp();
                    let pop_f = 320.0 + st * 4500.0;
                    (2.0 * PI * pop_f * st).sin() * senv * 1.6 + rng.next_pink() * senv * 1.2
                } else {
                    0.0
                };

                let combined = sludge * 1.1 + squelch * 1.6 + suction * 1.5;
                left[i] = combined;
                right[i] = combined;
            }
        }
        "snow" => {
            // 7. Crunchy Snow & Ice Crust:
            // Micro-fracture ice snaps (2.5-6.5kHz) + compacting crust body + squeaking ice grains
            let mut snap_filter = SvfFilter::new(4200.0, 2.5);
            let mut crust_filter = SvfFilter::new(1350.0, 2.0);

            for i in 0..total {
                let t = i as f32 / sr;

                let body_env = (-t * 30.0).exp();
                let body_thud = (2.0 * PI * 135.0 * t).sin() * body_env * 1.1 + rng.next_brown() * body_env * 0.9;

                let snap_active = i < ((sr * 0.09) as usize).min(total);
                let snap_impulse = if snap_active && rng.next_f32() > 0.88 {
                    rng.next_bipolar() * 2.5
                } else {
                    0.0
                };
                let snaps = snap_filter.process_hp(snap_impulse, sr);

                let creak_env = (-t * 24.0).exp();
                let creak = crust_filter.process_bp(rng.next_pink() * creak_env * 2.0 * params.noise_mix, sr);

                let toe_crunch = if i >= toe_start {
                    let tt = (i - toe_start) as f32 / sr;
                    let tenv = (-tt * 32.0).exp();
                    let toe_snap = if rng.next_f32() > 0.86 { rng.next_bipolar() * 2.0 } else { 0.0 };
                    snap_filter.process_bp(toe_snap + rng.next_pink() * tenv * 1.5, sr)
                } else {
                    0.0
                };

                let combined = body_thud * 1.0 + snaps * 2.0 + creak * 1.5 + toe_crunch * 1.3;
                left[i] = combined;
                right[i] = combined;
            }
        }
        "carpet" => {
            // 8. Plush Carpet & Rug:
            // Heavily absorbed low frequency displacement (75-110Hz), muted high end
            let mut carpet_filter = SvfFilter::new(380.0, 1.2);

            for i in 0..total {
                let t = i as f32 / sr;

                let heel_env = (-t * 40.0).exp();
                let soft_thump = (2.0 * PI * 85.0 * t).sin() * heel_env * 1.4 + rng.next_brown() * heel_env * 1.1;
                let filtered = carpet_filter.process_lp(soft_thump, sr);

                let toe = if i >= toe_start {
                    let tt = (i - toe_start) as f32 / sr;
                    let tenv = (-tt * 35.0).exp();
                    carpet_filter.process_lp((2.0 * PI * 95.0 * tt).sin() * tenv * 0.8, sr)
                } else {
                    0.0
                };

                let combined = filtered * 1.6 + toe * 1.0;
                left[i] = combined;
                right[i] = combined;
            }
        }
        "soft" | "soft surfaces" | "flesh" => {
            // 9. Soft Surface / Forest Soil / Dirt:
            // Organic low-frequency thud with natural soil displacement
            let mut soil_filter = SvfFilter::new(750.0, 1.4);

            for i in 0..total {
                let t = i as f32 / sr;

                let heel_env = (-t * 42.0).exp();
                let earth_thump = (2.0 * PI * 105.0 * t).sin() * heel_env * 1.3 + rng.next_brown() * heel_env * 1.2;
                let filtered_earth = soil_filter.process_lp(earth_thump, sr);

                let toe_soil = if i >= toe_start {
                    let tt = (i - toe_start) as f32 / sr;
                    let tenv = (-tt * 30.0).exp();
                    soil_filter.process_bp(rng.next_pink() * tenv * 1.2 * params.noise_mix, sr)
                } else {
                    0.0
                };

                let combined = filtered_earth * 1.5 + toe_soil * 1.2;
                left[i] = combined;
                right[i] = combined;
            }
        }
        "wet" | "wet surfaces" => {
            // 10. Wet Surface & Shallow Puddle:
            // Ground contact + shallow water slap & water droplet spray sizzle
            let mut splash_filter = SvfFilter::new(4500.0, 1.6);
            let mut ground_filter = SvfFilter::new(260.0, 1.8);

            for i in 0..total {
                let t = i as f32 / sr;

                let heel_env = (-t * 45.0).exp();
                let ground = ground_filter.process_lp(
                    (2.0 * PI * 140.0 * t).sin() * heel_env * 1.3 + rng.next_brown() * heel_env * 0.9,
                    sr,
                );

                let splash_env = if i < 180 { (-t * 600.0).exp() } else { 0.0 };
                let water_slap = splash_filter.process_hp(rng.next_bipolar() * splash_env * 2.6, sr);

                let spray_env = (-t * 32.0).exp();
                let droplet_spray = splash_filter.process_bp(rng.next_pink() * spray_env * 2.2 * params.noise_mix, sr);

                let toe_splash = if i >= toe_start {
                    let tt = (i - toe_start) as f32 / sr;
                    let tenv = (-tt * 35.0).exp();
                    splash_filter.process_bp(rng.next_pink() * tenv * 1.5, sr)
                } else {
                    0.0
                };

                let combined = ground * 1.2 + water_slap * 1.7 + droplet_spray * 1.4 + toe_splash * 1.2;
                left[i] = combined;
                right[i] = combined;
            }
        }
        _ => {
            // 11. "hard" | "hard surfaces" | "stone" (Hard Stone, Marble, Concrete):
            // Solid mineral strike with sharp high transient and dry grit scuff
            let mut strike_filter = SvfFilter::new(3200.0, 1.8);
            let mut stone_filter = SvfFilter::new(190.0, 2.0);

            for i in 0..total {
                let t = i as f32 / sr;

                let strike_env = if i < 120 { (-t * 1400.0).exp() } else { 0.0 };
                let strike = strike_filter.process_hp(rng.next_bipolar() * strike_env * 2.2, sr);

                let body_env = (-t * 48.0).exp();
                let stone_thud = stone_filter.process_lp(
                    (2.0 * PI * base_f * t).sin() * body_env * 1.5 + rng.next_brown() * body_env * 1.0,
                    sr,
                );

                let toe_scuff = if i >= toe_start {
                    let tt = (i - toe_start) as f32 / sr;
                    let tenv = (-tt * 36.0).exp();
                    strike_filter.process_bp(rng.next_pink() * tenv * 1.4 * params.noise_mix, sr)
                } else {
                    0.0
                };

                let combined = strike * 1.6 + stone_thud * 1.4 + toe_scuff * 1.2;
                left[i] = combined;
                right[i] = combined;
            }
        }
    }
}

// -------------------------------------------------------------
// 6. WHOOSH & AIR SWIPES (Cinematic Doppler Air Slicing)
// -------------------------------------------------------------
fn generate_whoosh(
    left: &mut [f32],
    right: &mut [f32],
    params: &SynthParams,
    rng: &mut FastRng,
    sr: f32,
) {
    let total = left.len();
    let base_f = params.base_freq.clamp(80.0, 1800.0);
    let peak_t = 0.45f32;
    let transition_width = 0.25f32;

    let mut bp_filter_l = SvfFilter::new(base_f, params.resonance.clamp(1.5, 6.0));
    let mut bp_filter_r = SvfFilter::new(base_f, params.resonance.clamp(1.5, 6.0));
    let mut sub_filter_l = SvfFilter::new(120.0, 1.2);
    let mut sub_filter_r = SvfFilter::new(120.0, 1.2);

    for i in 0..total {
        let t_norm = i as f32 / total as f32; // 0.0 -> 1.0

        // Asymmetric power envelope: builds up swiftly, peaks, dissipates with smooth air trail
        let dist = (t_norm - peak_t) / transition_width;
        let env = (-dist * dist * 3.0).exp();

        // Sub air displacement boom (pitched whoomph 60Hz -> 140Hz -> 45Hz)
        let sub_pitch = (60.0 + env * 120.0) * (2.0 * PI / sr);
        let sub_osc = (i as f32 * sub_pitch).sin() * env.powf(1.8) * 0.6;
        let sub_noise = rng.next_brown() * env.powf(2.0) * 0.4;
        let sub_sig_l = sub_filter_l.process_lp(sub_osc + sub_noise, sr);
        let sub_sig_r = sub_filter_r.process_lp(sub_osc + sub_noise, sr);

        // Doppler frequency sweep for whistling vortex air shear
        let sweep_factor = 1.0 + (1.0 - (t_norm - peak_t).abs().min(1.0)).powf(2.5) * 3.5;
        let cur_bp_f = (base_f * sweep_factor).clamp(80.0, sr * 0.45);
        bp_filter_l.cutoff = cur_bp_f;
        bp_filter_r.cutoff = cur_bp_f;

        let pink = rng.next_pink();
        let air_vortex_l = bp_filter_l.process_bp(pink, sr);
        let air_vortex_r = bp_filter_r.process_bp(pink, sr);

        let high_air = rng.next_bipolar() * env.powf(1.5) * 0.15 * params.brightness;

        // Dynamic stereo Doppler sweep across stereo field (left to right)
        let pan = (t_norm * 2.0 - 1.0).clamp(-1.0, 1.0) * params.stereo_spread;
        let gain_l = (1.0 - pan).max(0.0).sqrt();
        let gain_r = (1.0 + pan).max(0.0).sqrt();

        let sig_l = (sub_sig_l * 0.7 + air_vortex_l * 1.4 + high_air) * env * gain_l;
        let sig_r = (sub_sig_r * 0.7 + air_vortex_r * 1.4 + high_air) * env * gain_r;

        left[i] = sig_l;
        right[i] = sig_r;
    }
}

// -------------------------------------------------------------
// 7. AMBIENT & SCIFI DRONES (Multi-Oscillator Organic Beating)
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
    let mut osc1_phase = 0.0f32;
    let mut osc2_phase = 0.0f32;
    let mut osc3_phase = 0.0f32;

    for i in 0..total {
        let t = i as f32 / sr;
        // Breathing LFO for slow harmonic movement
        let lfo1 = (2.0 * PI * 0.12 * t).sin() * 0.008;
        let lfo2 = (2.0 * PI * 0.18 * t).cos() * 0.006;

        let f1 = base_f * (1.0 + lfo1);
        let f2 = base_f * 1.5 * (1.0 + lfo2); // Perfect 5th
        let f3 = base_f * 2.002;              // Detuned Octave

        osc1_phase += (2.0 * PI * f1) / sr;
        osc2_phase += (2.0 * PI * f2) / sr;
        osc3_phase += (2.0 * PI * f3) / sr;

        let tone1 = osc1_phase.sin();
        let tone2 = osc2_phase.sin() * 0.6;
        let tone3 = osc3_phase.sin() * 0.4;

        let pink = rng.next_pink() * params.noise_mix * 0.35;
        let combined = tone1 + tone2 + tone3 + pink;

        let pan_l = 1.0 - (2.0 * PI * 0.15 * t).sin() * params.stereo_spread * 0.4;
        let pan_r = 1.0 + (2.0 * PI * 0.15 * t).sin() * params.stereo_spread * 0.4;

        left[i] = combined * pan_l * 0.7;
        right[i] = combined * pan_r * 0.7;
    }
}

// -------------------------------------------------------------
// 8. EXPLOSIONS & BLASTS (Cinematic 4-Layer Detonation)
// -------------------------------------------------------------
fn generate_explosion(
    left: &mut [f32],
    right: &mut [f32],
    params: &SynthParams,
    rng: &mut FastRng,
    sr: f32,
) {
    let total = left.len();
    let decay_sec = (params.decay_ms / 1000.0).max(0.2);

    let mut blast_filter = SvfFilter::new(8000.0, 1.8);
    let mut sub_filter = SvfFilter::new(55.0, 2.5);

    for i in 0..total {
        let t = i as f32 / sr;
        let t_norm = (t / decay_sec).clamp(0.0, 1.0);

        // Layer 1: Instant Shockwave Sub-Punch (45Hz -> 25Hz)
        let sub_env = (-t * 12.0).exp();
        let sub_f = 45.0 * (-t * 8.0).exp() + 25.0;
        let sub_osc = (2.0 * PI * sub_f * t).sin() * sub_env * 1.8;
        let sub_punch = sub_filter.process_lp(sub_osc, sr);

        // Layer 2: Expanding Fireball with dynamic low-pass sweep down (8kHz -> 120Hz)
        let blast_env = (-t_norm * 2.8).exp();
        let sweep_cutoff = (8000.0 * (-t_norm * 4.5).exp() + 120.0).min(sr * 0.45);
        blast_filter.cutoff = sweep_cutoff;
        let brown_blast = rng.next_brown() * blast_env * 1.6;
        let pink_blast = rng.next_pink() * blast_env * 0.8;
        let blast = blast_filter.process_lp(brown_blast + pink_blast, sr);

        // Layer 3: Stochastic flying shrapnel & crackle pops
        let crackle = if t > 0.04 && t < decay_sec * 0.7 {
            if rng.next_f32() < 0.04 * params.noise_mix {
                rng.next_bipolar() * (-t * 3.0).exp() * 0.8
            } else {
                0.0
            }
        } else {
            0.0
        };

        let combined = sub_punch + blast + crackle;
        let pan = rng.next_bipolar() * params.stereo_spread * 0.15;

        left[i] = combined * (1.0 - pan);
        right[i] = combined * (1.0 + pan);
    }
}

// -------------------------------------------------------------
// 9. WEATHER & NATURE (Stochastic Raindrop Cloud & Wind)
// -------------------------------------------------------------
fn generate_weather(
    left: &mut [f32],
    right: &mut [f32],
    params: &SynthParams,
    rng: &mut FastRng,
    sr: f32,
) {
    let total = left.len();
    let mut wind_filter = SvfFilter::new(350.0, 1.4);

    // Continuous rolling wind bed with pink/brown noise
    for i in 0..total {
        let t = i as f32 / sr;
        let wind_lfo = (2.0 * PI * 0.25 * t).sin() * 0.4 + 0.6;
        let wind_cutoff = (200.0 + wind_lfo * 500.0 * params.brightness).min(sr * 0.4);
        wind_filter.cutoff = wind_cutoff;

        let wind_sample = wind_filter.process_lp(rng.next_brown() * 0.6 + rng.next_pink() * 0.4, sr);
        let pan = (2.0 * PI * 0.15 * t).sin() * params.stereo_spread * 0.3;

        left[i] = wind_sample * (1.0 - pan) * 0.4;
        right[i] = wind_sample * (1.0 + pan) * 0.4;
    }

    // Discrete raindrops generation (stochastic Poisson process)
    let drop_rate = (params.noise_mix * 350.0).max(40.0);
    let prob_per_sample = drop_rate / sr;

    for i in 0..total {
        if rng.next_f32() < prob_per_sample {
            let drop_freq = 1500.0 + rng.next_f32() * 2800.0;
            let drop_len = ((sr * (0.003 + rng.next_f32() * 0.008)) as usize).min(total - i);
            let drop_amp = (0.2 + rng.next_f32() * 0.8) * params.brightness;
            let drop_pan = rng.next_bipolar() * params.stereo_spread;

            for d in 0..drop_len {
                let dt = d as f32 / sr;
                let drop_env = (-dt * 450.0).exp();
                let chirp_f = drop_freq * (1.0 + (-dt * 300.0).exp() * 0.3);
                let drop_sig = (2.0 * PI * chirp_f * dt).sin() * drop_env * drop_amp;

                left[i + d] += drop_sig * (1.0 - drop_pan * 0.7);
                right[i + d] += drop_sig * (1.0 + drop_pan * 0.7);
            }
        }
    }

    // Optional rolling thunder shockwave if base_freq is low and damping is high
    if params.base_freq < 120.0 {
        let thunder_start = (sr * 0.3) as usize;
        let mut thunder_filter = SvfFilter::new(65.0, 2.5);
        for i in thunder_start..total {
            let t = (i - thunder_start) as f32 / sr;
            let thunder_env = (-t * 0.8).exp() * (1.0 - (-t * 6.0).exp());
            let raw_thunder = rng.next_brown() * thunder_env * 1.5;
            let th = thunder_filter.process_lp(raw_thunder, sr);
            left[i] += th;
            right[i] += th;
        }
    }
}

// -------------------------------------------------------------
// 10. RETRO & CHIPTUNE (NES / GameBoy 8-Bit Emulation)
// -------------------------------------------------------------
fn generate_retro(
    left: &mut [f32],
    right: &mut [f32],
    params: &SynthParams,
    rng: &mut FastRng,
    sr: f32,
) {
    let total = left.len();
    let base_f = params.base_freq.clamp(60.0, 3000.0);
    let decay_sec = (params.decay_ms / 1000.0).max(0.05);
    let duty_cycle = match params.material_preset.as_str() {
        "wood" => 0.125, // 12.5% NES thin pulse
        "glass" => 0.25, // 25% NES square
        _ => 0.5,        // 50% Classic pure square
    };

    let mut phase = 0.0f32;
    let arpeggio_steps = [1.0, 1.2599, 1.4983, 2.0]; // Major triad + Octave

    for i in 0..total {
        let t = i as f32 / sr;
        let t_norm = (t / decay_sec).clamp(0.0, 1.0);

        let arp_idx = ((t * 24.0) as usize) % arpeggio_steps.len();
        let arp_mult = if params.pitch_decay > 0.3 {
            arpeggio_steps[arp_idx]
        } else {
            1.0
        };

        let pitch_slide = (-t_norm * params.pitch_decay * 6.0).exp();
        let cur_f = (base_f * arp_mult * pitch_slide).clamp(30.0, 8000.0);

        phase += (2.0 * PI * cur_f) / sr;
        if phase > 2.0 * PI {
            phase -= 2.0 * PI;
        }

        let pulse: f32 = if (phase / (2.0 * PI)) < duty_cycle { 0.7 } else { -0.7 };
        let levels: f32 = 8.0;
        let lo_fi_pulse = (pulse * levels).round() / levels;

        let retro_noise = if i < 300 {
            let n = if rng.next_f32() > 0.5 { 0.5 } else { -0.5 };
            n * params.noise_mix
        } else {
            0.0
        };

        let env = (-t_norm * 3.0).exp();
        let sig = (lo_fi_pulse + retro_noise) * env;

        left[i] = sig;
        right[i] = sig;
    }
}

// -------------------------------------------------------------
// 11. MAGIC & FANTASY (Crystalline Shimmer & Bells)
// -------------------------------------------------------------
fn generate_magic(
    left: &mut [f32],
    right: &mut [f32],
    params: &SynthParams,
    _rng: &mut FastRng,
    sr: f32,
) {
    let total = left.len();
    let base_f = params.base_freq.clamp(200.0, 3500.0);
    let bell_ratios = [1.0, 1.5, 2.0, 2.667, 3.2, 4.0];

    for (idx, &ratio) in bell_ratios.iter().enumerate() {
        let f = (base_f * ratio).min(sr * 0.45);
        let damp = (params.damping * 8.0) * (1.0 + (idx as f32) * 0.3);
        let pan = ((idx as f32 / bell_ratios.len() as f32) * 2.0 - 1.0) * params.stereo_spread;

        for i in 0..total {
            let t = i as f32 / sr;
            let shimmer = (2.0 * PI * 6.5 * t).sin() * 0.015 * params.brightness;
            let phase = 2.0 * PI * f * (1.0 + shimmer) * t;
            let env = (-t * damp).exp();
            let sig = phase.sin() * env * (1.0 / (idx as f32 + 1.0));

            left[i] += sig * (1.0 - pan * 0.6);
            right[i] += sig * (1.0 + pan * 0.6);
        }
    }
}

// -------------------------------------------------------------
// 12. WEAPONS & BLASTERS (Supersonic Crack & Combustion)
// -------------------------------------------------------------
fn generate_weapon(
    left: &mut [f32],
    right: &mut [f32],
    params: &SynthParams,
    rng: &mut FastRng,
    sr: f32,
) {
    let total = left.len();
    let decay_sec = (params.decay_ms / 1000.0).max(0.1);

    let mut muzzle_filter = SvfFilter::new(3500.0, 1.8);
    let mut crack_filter = SvfFilter::new(6500.0, 2.0);
    let bolt_time = (sr * 0.038) as usize;

    for i in 0..total {
        let t = i as f32 / sr;
        let t_norm = (t / decay_sec).clamp(0.0, 1.0);

        // 1. Supersonic crack transient
        let crack_env = if i < 110 { (-t * 1500.0).exp() } else { 0.0 };
        let crack = crack_filter.process_hp(rng.next_bipolar() * crack_env * 2.2, sr);

        // 2. Muzzle punch & combustion
        let muzzle_env = (-t * 28.0).exp();
        let muzzle_f = params.base_freq * (-t * 40.0).exp() + 45.0;
        let muzzle_osc = (2.0 * PI * muzzle_f * t).sin() * muzzle_env * 1.5;
        let muzzle_noise = rng.next_brown() * muzzle_env * 1.8;
        let muzzle = muzzle_filter.process_lp(muzzle_osc + muzzle_noise, sr);

        // 3. Mechanical bolt cycle transient
        let bolt = if i >= bolt_time && i < bolt_time + 150 {
            let bt = (i - bolt_time) as f32 / sr;
            rng.next_bipolar() * (-bt * 800.0).exp() * 0.6 * params.damping
        } else {
            0.0
        };

        let tail = rng.next_pink() * (-t_norm * 4.0).exp() * 0.35;
        let combined = crack * 1.6 + muzzle * 1.4 + bolt + tail;

        left[i] = combined;
        right[i] = combined;
    }
}

// -------------------------------------------------------------
// 13. CREATURES & MONSTERS (Formant Vocal Tract Throat)
// -------------------------------------------------------------
fn generate_creature(
    left: &mut [f32],
    right: &mut [f32],
    params: &SynthParams,
    rng: &mut FastRng,
    sr: f32,
) {
    let total = left.len();
    let base_f = params.base_freq.clamp(35.0, 450.0);

    let mut f1 = SvfFilter::new(450.0, 4.5);
    let mut f2 = SvfFilter::new(1250.0, 3.5);
    let mut f3 = SvfFilter::new(2600.0, 2.5);

    let mut phase = 0.0f32;

    for i in 0..total {
        let t = i as f32 / sr;
        let roar_growl = (2.0 * PI * 35.0 * t).sin() * 0.25 * params.jitter_amount;
        let cur_f = (base_f * (1.0 + roar_growl)).clamp(20.0, 800.0);

        phase += (2.0 * PI * cur_f) / sr;
        if phase > 2.0 * PI {
            phase -= 2.0 * PI;
        }

        // Sawtooth glottal pulse
        let glottal = (phase / PI - 1.0) * 0.7;
        let noise_breath = rng.next_pink() * params.noise_mix * 0.4;
        let raw_vocal = glottal + noise_breath;

        let v1 = f1.process_bp(raw_vocal, sr);
        let v2 = f2.process_bp(raw_vocal, sr);
        let v3 = f3.process_bp(raw_vocal, sr);

        let combined = v1 * 1.2 + v2 * 0.8 + v3 * 0.4;
        let env = (-t * (params.damping * 2.0 + 0.5)).exp();

        left[i] = combined * env;
        right[i] = combined * env;
    }
}
