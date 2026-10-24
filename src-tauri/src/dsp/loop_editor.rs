use std::f32::consts::PI;

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct LoopSettings {
    pub enabled: bool,
    pub crossfade_ms: f32,
    pub crossfade_curve: String, // "equal_power" | "linear" | "s_curve"
    pub reverb_tail_wrap: bool,
    pub tail_duration_ms: f32,
    pub zero_crossing_snap: bool,
    pub loop_start_ratio: f32, // 0.0 to 1.0
    pub loop_end_ratio: f32,   // 0.0 to 1.0
}

/// Find nearest zero crossing with positive slope within search window
pub fn find_zero_crossing_pos_slope(samples: &[f32], target_idx: usize, search_radius: usize) -> usize {
    if samples.is_empty() {
        return 0;
    }
    let len = samples.len();
    let min_idx = target_idx.saturating_sub(search_radius);
    let max_idx = (target_idx + search_radius).min(len.saturating_sub(2));

    if min_idx >= max_idx {
        return target_idx.min(len - 1);
    }

    let mut best_idx = target_idx;
    let mut min_dist = usize::MAX;

    for i in min_idx..max_idx {
        // Zero crossing with positive slope
        if samples[i] <= 0.0 && samples[i + 1] > 0.0 {
            let dist = (i as isize - target_idx as isize).unsigned_abs();
            if dist < min_dist {
                min_dist = dist;
                best_idx = i;
            }
        }
    }

    best_idx
}

/// Process looping: Apply tail-folding and/or seam crossfading
pub fn process_seamless_loop(
    raw_left: &[f32],
    raw_right: &[f32],
    sample_rate: u32,
    settings: &LoopSettings,
) -> (Vec<f32>, Vec<f32>, u32, u32) {
    if !settings.enabled || raw_left.is_empty() {
        let len = raw_left.len() as u32;
        return (raw_left.to_vec(), raw_right.to_vec(), 0, len);
    }

    let total_samples = raw_left.len();
    let sr = sample_rate as f32;

    // 1. Determine user loop region
    let mut start_idx = ((total_samples as f32) * settings.loop_start_ratio.clamp(0.0, 0.95)) as usize;
    let mut end_idx = ((total_samples as f32) * settings.loop_end_ratio.clamp(0.05, 1.0)) as usize;

    if end_idx <= start_idx + 100 {
        end_idx = total_samples;
        start_idx = 0;
    }

    // 2. Snap to zero-crossings if requested
    if settings.zero_crossing_snap {
        let search_radius = ((sr * 0.02).round() as usize).max(10); // 20ms search window
        start_idx = find_zero_crossing_pos_slope(raw_left, start_idx, search_radius);
        end_idx = find_zero_crossing_pos_slope(raw_left, end_idx, search_radius);
        if end_idx <= start_idx {
            end_idx = total_samples.saturating_sub(1);
        }
    }

    let mut loop_body_l = raw_left[start_idx..end_idx].to_vec();
    let mut loop_body_r = raw_right[start_idx..end_idx].to_vec();
    let body_len = loop_body_l.len();

    // 3. Reverb Tail Wrap-Around (Fold tail into the beginning)
    if settings.reverb_tail_wrap && end_idx < total_samples {
        let tail_samples_target = ((settings.tail_duration_ms / 1000.0) * sr) as usize;
        let available_tail = total_samples - end_idx;
        let tail_len = tail_samples_target.min(available_tail).min(body_len);

        for i in 0..tail_len {
            // Fold tail over the start with a smooth decay
            let fade = 1.0 - (i as f32 / tail_len as f32);
            loop_body_l[i] += raw_left[end_idx + i] * fade;
            loop_body_r[i] += raw_right[end_idx + i] * fade;
        }
    }

    // 4. Seam Crossfade (Crossfade end back into beginning)
    let crossfade_samples = ((settings.crossfade_ms / 1000.0) * sr).round() as usize;
    let xfade_len = crossfade_samples.min(body_len / 3);

    if xfade_len > 4 {
        // Take the end segment and blend it into the start
        let end_offset = body_len - xfade_len;
        for i in 0..xfade_len {
            let t = i as f32 / xfade_len as f32; // 0.0 -> 1.0

            let (fade_in, fade_out) = match settings.crossfade_curve.as_str() {
                "linear" => (t, 1.0 - t),
                "s_curve" => {
                    let s = t * t * (3.0 - 2.0 * t);
                    (s, 1.0 - s)
                }
                _ => {
                    // Equal Power (Sine / Cosine)
                    let angle = t * (PI * 0.5);
                    (angle.sin(), angle.cos())
                }
            };

            // Start blend
            let orig_start_l = loop_body_l[i];
            let orig_start_r = loop_body_r[i];
            let ending_l = loop_body_l[end_offset + i];
            let ending_r = loop_body_r[end_offset + i];

            loop_body_l[i] = orig_start_l * fade_in + ending_l * fade_out;
            loop_body_r[i] = orig_start_r * fade_in + ending_r * fade_out;
        }

        // Truncate the crossfaded tail so the end aligns perfectly with the blended start
        loop_body_l.truncate(end_offset);
        loop_body_r.truncate(end_offset);
    }

    let final_len = loop_body_l.len() as u32;
    (loop_body_l, loop_body_r, 0, final_len)
}

/// Creates a short preview buffer highlighting the seam junction (e.g. 1 sec before + 1 sec after)
pub fn generate_seam_audition_buffer(
    samples_l: &[f32],
    samples_r: &[f32],
    sample_rate: u32,
    preview_window_sec: f32,
) -> (Vec<f32>, Vec<f32>) {
    let window_samples = ((sample_rate as f32 * preview_window_sec).round() as usize).max(100);
    let len = samples_l.len();

    if len <= window_samples * 2 {
        return (samples_l.to_vec(), samples_r.to_vec());
    }

    let pre_seam_start = len - window_samples;
    let mut seam_l = Vec::with_capacity(window_samples * 2);
    let mut seam_r = Vec::with_capacity(window_samples * 2);

    // End part
    seam_l.extend_from_slice(&samples_l[pre_seam_start..]);
    seam_r.extend_from_slice(&samples_r[pre_seam_start..]);

    // Start part
    seam_l.extend_from_slice(&samples_l[..window_samples]);
    seam_r.extend_from_slice(&samples_r[..window_samples]);

    (seam_l, seam_r)
}
