use std::io::{Cursor, Write};

/// Writes WAV files with customizable bit depth (16-bit PCM, 24-bit PCM, 32-bit float),
/// Mono/Stereo channels, and standard RIFF `smpl` loop points for game engines.
pub fn write_custom_wav(
    samples_left: &[f32],
    samples_right: Option<&[f32]>,
    sample_rate: u32,
    bit_depth: u16, // 16, 24, or 32 (32 = IEEE float format 3)
    is_mono: bool,
    loop_start_sample: Option<u32>,
    loop_end_sample: Option<u32>,
) -> Result<Vec<u8>, String> {
    let effective_channels = if is_mono || samples_right.is_none() { 1u16 } else { 2u16 };
    let num_samples = samples_left.len();

    let bytes_per_sample = match bit_depth {
        24 => 3u32,
        32 => 4u32,
        _ => 2u32, // 16-bit default
    };

    let audio_format = if bit_depth == 32 { 3u16 } else { 1u16 }; // 1 = PCM, 3 = IEEE Float
    let block_align = effective_channels * (bytes_per_sample as u16);
    let byte_rate = sample_rate * block_align as u32;
    let data_chunk_size = (num_samples as u32) * (block_align as u32);

    let mut cursor = Cursor::new(Vec::with_capacity(data_chunk_size as usize + 512));

    // RIFF Header
    cursor.write_all(b"RIFF").map_err(|e| e.to_string())?;
    let riff_size_pos = cursor.position();
    cursor.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?;
    cursor.write_all(b"WAVE").map_err(|e| e.to_string())?;

    // 'fmt ' Chunk
    cursor.write_all(b"fmt ").map_err(|e| e.to_string())?;
    cursor.write_all(&16u32.to_le_bytes()).map_err(|e| e.to_string())?; // Subchunk size (16)
    cursor.write_all(&audio_format.to_le_bytes()).map_err(|e| e.to_string())?;
    cursor.write_all(&effective_channels.to_le_bytes()).map_err(|e| e.to_string())?;
    cursor.write_all(&sample_rate.to_le_bytes()).map_err(|e| e.to_string())?;
    cursor.write_all(&byte_rate.to_le_bytes()).map_err(|e| e.to_string())?;
    cursor.write_all(&block_align.to_le_bytes()).map_err(|e| e.to_string())?;
    let bits_to_write = if bit_depth == 24 { 24u16 } else if bit_depth == 32 { 32u16 } else { 16u16 };
    cursor.write_all(&bits_to_write.to_le_bytes()).map_err(|e| e.to_string())?;

    // 'data' Chunk
    cursor.write_all(b"data").map_err(|e| e.to_string())?;
    cursor.write_all(&data_chunk_size.to_le_bytes()).map_err(|e| e.to_string())?;

    // Write samples based on bit depth
    for i in 0..num_samples {
        let left_sample = if is_mono && samples_right.is_some() {
            (samples_left[i] + samples_right.unwrap()[i]) * 0.5
        } else {
            samples_left[i]
        };

        write_single_sample(&mut cursor, left_sample, bit_depth)?;

        if effective_channels == 2 && samples_right.is_some() {
            let right_sample = samples_right.unwrap()[i];
            write_single_sample(&mut cursor, right_sample, bit_depth)?;
        }
    }

    // Optional 'smpl' (sample) chunk for game engines (Godot native, Unity PCM, LoopAuditioneer)
    if let (Some(l_start), Some(l_end)) = (loop_start_sample, loop_end_sample) {
        let smpl_size: u32 = 36 + 24; // Header (36) + 1 Loop Entry (24)
        cursor.write_all(b"smpl").map_err(|e| e.to_string())?;
        cursor.write_all(&smpl_size.to_le_bytes()).map_err(|e| e.to_string())?;

        // Manufacturer (0), Product (0)
        cursor.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?;
        cursor.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?;

        // Sample Period in nanoseconds
        let sample_period = (1_000_000_000u64 / sample_rate as u64) as u32;
        cursor.write_all(&sample_period.to_le_bytes()).map_err(|e| e.to_string())?;

        // MIDI Unity Note (60 = Middle C), MIDI Pitch Fraction (0)
        cursor.write_all(&60u32.to_le_bytes()).map_err(|e| e.to_string())?;
        cursor.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?;

        // SMPTE Format (0), SMPTE Offset (0)
        cursor.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?;
        cursor.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?;

        // Num Sample Loops (1)
        cursor.write_all(&1u32.to_le_bytes()).map_err(|e| e.to_string())?;

        // Sampler Data (0)
        cursor.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?;

        // Loop #1:
        cursor.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?; // Cue Point ID
        cursor.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?; // Forward Loop Type
        cursor.write_all(&l_start.to_le_bytes()).map_err(|e| e.to_string())?;
        cursor.write_all(&l_end.to_le_bytes()).map_err(|e| e.to_string())?;
        cursor.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?; // Fraction
        cursor.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?; // Play Count (0 = inf)
    }

    // Patch RIFF size (total bytes - 8)
    let total_len = cursor.position() as u32;
    let riff_size = total_len - 8;
    cursor.set_position(riff_size_pos);
    cursor.write_all(&riff_size.to_le_bytes()).map_err(|e| e.to_string())?;

    Ok(cursor.into_inner())
}

#[inline]
fn write_single_sample(cursor: &mut Cursor<Vec<u8>>, sample: f32, bit_depth: u16) -> Result<(), String> {
    match bit_depth {
        32 => {
            // 32-bit IEEE Float
            cursor.write_all(&sample.to_le_bytes()).map_err(|e| e.to_string())?;
        }
        24 => {
            // 24-bit PCM signed integer (-8388608 to 8388607)
            let clamped = sample.clamp(-1.0, 1.0);
            let val = (clamped * 8388607.0) as i32;
            let b0 = (val & 0xFF) as u8;
            let b1 = ((val >> 8) & 0xFF) as u8;
            let b2 = ((val >> 16) & 0xFF) as u8;
            cursor.write_all(&[b0, b1, b2]).map_err(|e| e.to_string())?;
        }
        _ => {
            // 16-bit PCM signed integer (-32768 to 32767)
            let clamped = sample.clamp(-1.0, 1.0);
            let val = (clamped * 32767.0) as i16;
            cursor.write_all(&val.to_le_bytes()).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

/// Backward compatibility wrapper for standard 16-bit PCM WAV with loops
pub fn write_wav_with_loop(
    samples_left: &[f32],
    samples_right: Option<&[f32]>,
    sample_rate: u32,
    loop_start_sample: Option<u32>,
    loop_end_sample: Option<u32>,
) -> Result<Vec<u8>, String> {
    write_custom_wav(
        samples_left,
        samples_right,
        sample_rate,
        16,
        false,
        loop_start_sample,
        loop_end_sample,
    )
}

/// Generates a C/C++ Header (.h) containing the raw PCM audio samples for Raylib, C++, Bevy, or Pico
pub fn generate_c_header(
    var_name: &str,
    samples: &[f32],
    sample_rate: u32,
    loop_start: Option<u32>,
    loop_end: Option<u32>,
) -> String {
    let safe_name = var_name
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '_' })
        .collect::<String>()
        .to_uppercase();

    let mut out = String::with_capacity(samples.len() * 7 + 512);
    out.push_str("/* Generated by Axis SFX Lab - Made By Mahdi Kareem © 2026 */\n");
    out.push_str(&format!("#ifndef SFX_{}_H\n#define SFX_{}_H\n\n", safe_name, safe_name));
    out.push_str(&format!("#define SFX_{}_SAMPLE_RATE {}\n", safe_name, sample_rate));
    out.push_str(&format!("#define SFX_{}_NUM_SAMPLES {}\n", safe_name, samples.len()));

    if let (Some(s), Some(e)) = (loop_start, loop_end) {
        out.push_str(&format!("#define SFX_{}_LOOP_START {}\n", safe_name, s));
        out.push_str(&format!("#define SFX_{}_LOOP_END {}\n", safe_name, e));
    }

    out.push_str(&format!("\nstatic const short SFX_{}_DATA[] = {{\n    ", safe_name));

    for (i, &sample) in samples.iter().enumerate() {
        let val = (sample.clamp(-1.0, 1.0) * 32767.0) as i16;
        out.push_str(&format!("{}, ", val));
        if (i + 1) % 16 == 0 {
            out.push_str("\n    ");
        }
    }

    out.push_str("\n};\n\n#endif\n");
    out
}

/// Generates a Godot 4 `.import` sidecar file to auto-configure loop mode
pub fn generate_godot_import(sample_rate: u32) -> String {
    format!(
        r#"[remap]
importer="wav"
type="AudioStreamWAV"
uid="uid://axis_sfx_lab_{}"
valid=true

[deps]
source_file="res://"
dest_files=["res://.godot/imported/"]

[params]
force/8_bit=false
force/mono=false
force/max_rate=false
force/max_rate_hz={}
edit/trim=false
edit/normalize=false
edit/loop_mode=2
edit/loop_begin=0
edit/loop_end=-1
compress/mode=0
"#,
        rand::random::<u32>(),
        sample_rate
    )
}
