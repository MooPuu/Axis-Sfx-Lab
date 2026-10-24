use std::f32::consts::PI;

/// A state-variable biquad filter (Chamberlin SVF)
#[derive(Clone, Debug)]
pub struct SvfFilter {
    pub cutoff: f32,
    pub resonance: f32, // 0.1 to 10.0
    s1: f32,
    s2: f32,
}

impl SvfFilter {
    pub fn new(cutoff: f32, resonance: f32) -> Self {
        Self {
            cutoff,
            resonance: resonance.max(0.1),
            s1: 0.0,
            s2: 0.0,
        }
    }

    #[inline]
    pub fn process_lp(&mut self, input: f32, sample_rate: f32) -> f32 {
        let f = (PI * (self.cutoff / sample_rate).clamp(0.001, 0.49)).sin() * 2.0;
        let q = 1.0 / self.resonance.max(0.1);
        
        let hp = input - self.s1 * q - self.s2;
        let bp = self.s1 + hp * f;
        let lp = self.s2 + bp * f;
        
        self.s1 = bp;
        self.s2 = lp;
        lp
    }

    #[inline]
    pub fn process_bp(&mut self, input: f32, sample_rate: f32) -> f32 {
        let f = (PI * (self.cutoff / sample_rate).clamp(0.001, 0.49)).sin() * 2.0;
        let q = 1.0 / self.resonance.max(0.1);
        
        let hp = input - self.s1 * q - self.s2;
        let bp = self.s1 + hp * f;
        let lp = self.s2 + bp * f;
        
        self.s1 = bp;
        self.s2 = lp;
        bp
    }

    #[inline]
    pub fn process_hp(&mut self, input: f32, sample_rate: f32) -> f32 {
        let f = (PI * (self.cutoff / sample_rate).clamp(0.001, 0.49)).sin() * 2.0;
        let q = 1.0 / self.resonance.max(0.1);
        
        let hp = input - self.s1 * q - self.s2;
        let bp = self.s1 + hp * f;
        let lp = self.s2 + bp * f;
        
        self.s1 = bp;
        self.s2 = lp;
        hp
    }
}

/// Applies non-linear saturation, wavefolding, and bitcrushing
pub fn apply_drive_and_bitcrush(input: f32, drive: f32, bitcrush: f32) -> f32 {
    let mut out = input;

    // Saturation / Drive (tanh-style soft clip)
    if drive > 0.01 {
        let gain = 1.0 + drive * 6.0;
        let x = out * gain;
        out = (2.0 / (1.0 + (-2.0 * x).exp()) - 1.0) / (gain.sqrt());
    }

    // Bitcrushing (quantization)
    if bitcrush > 0.01 {
        let levels = (32.0 * (1.0 - bitcrush * 0.95)).max(2.0);
        out = (out * levels).round() / levels;
    }

    out
}

/// Simple delay line for stereo reflections / echo
#[derive(Clone, Debug)]
pub struct DelayEffect {
    buffer_l: Vec<f32>,
    buffer_r: Vec<f32>,
    pos: usize,
    feedback: f32,
    mix: f32,
}

impl DelayEffect {
    pub fn new(sample_rate: u32, delay_ms: f32, feedback: f32, mix: f32) -> Self {
        let len = ((sample_rate as f32 * (delay_ms / 1000.0)).max(1.0)) as usize;
        Self {
            buffer_l: vec![0.0; len],
            buffer_r: vec![0.0; len],
            pos: 0,
            feedback: feedback.clamp(0.0, 0.95),
            mix: mix.clamp(0.0, 1.0),
        }
    }

    pub fn process(&mut self, in_l: f32, in_r: f32) -> (f32, f32) {
        if self.mix < 0.001 || self.buffer_l.is_empty() {
            return (in_l, in_r);
        }

        let delayed_l = self.buffer_l[self.pos];
        let delayed_r = self.buffer_r[self.pos];

        // Ping-pong cross feedback
        self.buffer_l[self.pos] = in_l + delayed_r * self.feedback;
        self.buffer_r[self.pos] = in_r + delayed_l * self.feedback;

        self.pos = (self.pos + 1) % self.buffer_l.len();

        let out_l = in_l * (1.0 - self.mix * 0.5) + delayed_l * self.mix;
        let out_r = in_r * (1.0 - self.mix * 0.5) + delayed_r * self.mix;
        (out_l, out_r)
    }
}

/// Freeverb-style algorithmic reverberator for tails and spatial warmth
#[derive(Clone, Debug)]
pub struct Freeverb {
    comb_buffers_l: Vec<Vec<f32>>,
    comb_buffers_r: Vec<Vec<f32>>,
    comb_indices_l: Vec<usize>,
    comb_indices_r: Vec<usize>,
    allpass_buffers: Vec<Vec<f32>>,
    allpass_indices: Vec<usize>,
    feedback: f32,
    damp: f32,
    damp_states_l: Vec<f32>,
    damp_states_r: Vec<f32>,
}

impl Freeverb {
    pub fn new(sample_rate: u32, room_size: f32, damping: f32) -> Self {
        let scale = sample_rate as f32 / 44100.0;
        let comb_tunings = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
        let allpass_tunings = [556, 441, 341, 225];

        let comb_buffers_l = comb_tunings
            .iter()
            .map(|&t| vec![0.0; ((t as f32 * scale).round() as usize).max(1)])
            .collect();
        let comb_buffers_r = comb_tunings
            .iter()
            .map(|&t| vec![0.0; (((t + 23) as f32 * scale).round() as usize).max(1)])
            .collect();

        let allpass_buffers = allpass_tunings
            .iter()
            .map(|&t| vec![0.0; ((t as f32 * scale).round() as usize).max(1)])
            .collect();

        Self {
            comb_buffers_l,
            comb_buffers_r,
            comb_indices_l: vec![0; 8],
            comb_indices_r: vec![0; 8],
            allpass_buffers,
            allpass_indices: vec![0; 4],
            feedback: (room_size * 0.28 + 0.7).clamp(0.0, 0.98),
            damp: (damping * 0.4).clamp(0.0, 0.9),
            damp_states_l: vec![0.0; 8],
            damp_states_r: vec![0.0; 8],
        }
    }

    pub fn process(&mut self, in_l: f32, in_r: f32, wet: f32, dry: f32) -> (f32, f32) {
        if wet <= 0.001 {
            return (in_l * dry, in_r * dry);
        }

        let input = (in_l + in_r) * 0.015;
        let mut out_l = 0.0;
        let mut out_r = 0.0;

        // Comb filters
        for i in 0..8 {
            // Left
            let buf_l = &mut self.comb_buffers_l[i];
            let idx_l = self.comb_indices_l[i];
            let output_l = buf_l[idx_l];
            self.damp_states_l[i] = output_l * (1.0 - self.damp) + self.damp_states_l[i] * self.damp;
            buf_l[idx_l] = input + self.damp_states_l[i] * self.feedback;
            self.comb_indices_l[i] = (idx_l + 1) % buf_l.len();
            out_l += output_l;

            // Right
            let buf_r = &mut self.comb_buffers_r[i];
            let idx_r = self.comb_indices_r[i];
            let output_r = buf_r[idx_r];
            self.damp_states_r[i] = output_r * (1.0 - self.damp) + self.damp_states_r[i] * self.damp;
            buf_r[idx_r] = input + self.damp_states_r[i] * self.feedback;
            self.comb_indices_r[i] = (idx_r + 1) % buf_r.len();
            out_r += output_r;
        }

        // Allpass filters
        for i in 0..4 {
            let buf = &mut self.allpass_buffers[i];
            let idx = self.allpass_indices[i];
            let buf_out = buf[idx];

            let new_l = -out_l + buf_out;
            buf[idx] = out_l + buf_out * 0.5;
            out_l = new_l;

            self.allpass_indices[i] = (idx + 1) % buf.len();
        }

        (
            in_l * dry + out_l * wet * 2.0,
            in_r * dry + out_r * wet * 2.0,
        )
    }
}
