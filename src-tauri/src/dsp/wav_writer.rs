use std::io::{Cursor, Write};

/// Writes a 16-bit PCM WAV with an optional RIFF `smpl` chunk for game engine loop detection (Godot / Unity).
pub fn write_wav_with_loop(
    samples_left: &[f32],
    samples_right: Option<&[f32]>,
    sample_rate: u32,
    loop_start_sample: Option<u32>,
    loop_end_sample: Option<u32>,
) -> Result<Vec<u8>, String> {
    let channels = if samples_right.is_some() { 2u16 } else { 1u16 };
    let num_samples = samples_left.len();
    let bits_per_sample = 16u16;
    let _bytes_per_sample = 2u32;
    let block_align = channels * (bits_per_sample / 8);
    let byte_rate = sample_rate * block_align as u32;
    let data_chunk_size = (num_samples as u32) * (block_align as u32);

    let mut cursor = Cursor::new(Vec::with_capacity(data_chunk_size as usize + 256));

    // RIFF Header
    cursor.write_all(b"RIFF").map_err(|e| e.to_string())?;
    
    // We will patch the overall file size at the end
    let riff_size_pos = cursor.position();
    cursor.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?;
    cursor.write_all(b"WAVE").map_err(|e| e.to_string())?;

    // 'fmt ' Chunk
    cursor.write_all(b"fmt ").map_err(|e| e.to_string())?;
    cursor.write_all(&16u32.to_le_bytes()).map_err(|e| e.to_string())?; // Subchunk1Size (16 for PCM)
    cursor.write_all(&1u16.to_le_bytes()).map_err(|e| e.to_string())?;  // AudioFormat (1 = PCM)
    cursor.write_all(&channels.to_le_bytes()).map_err(|e| e.to_string())?;
    cursor.write_all(&sample_rate.to_le_bytes()).map_err(|e| e.to_string())?;
    cursor.write_all(&byte_rate.to_le_bytes()).map_err(|e| e.to_string())?;
    cursor.write_all(&block_align.to_le_bytes()).map_err(|e| e.to_string())?;
    cursor.write_all(&bits_per_sample.to_le_bytes()).map_err(|e| e.to_string())?;

    // 'data' Chunk
    cursor.write_all(b"data").map_err(|e| e.to_string())?;
    cursor.write_all(&data_chunk_size.to_le_bytes()).map_err(|e| e.to_string())?;

    // Interleave or write samples
    for i in 0..num_samples {
        let left_clamped = samples_left[i].clamp(-1.0, 1.0);
        let left_i16 = (left_clamped * 32767.0) as i16;
        cursor.write_all(&left_i16.to_le_bytes()).map_err(|e| e.to_string())?;

        if let Some(right) = samples_right {
            let right_clamped = right[i].clamp(-1.0, 1.0);
            let right_i16 = (right_clamped * 32767.0) as i16;
            cursor.write_all(&right_i16.to_le_bytes()).map_err(|e| e.to_string())?;
        }
    }

    // Optional 'smpl' (sample) chunk for game engines (Godot native, Unity PCM, LoopAuditioneer)
    if let (Some(l_start), Some(l_end)) = (loop_start_sample, loop_end_sample) {
        // smpl chunk size: 36 bytes header + 24 bytes per loop = 60 bytes
        let smpl_size: u32 = 36 + 24;
        cursor.write_all(b"smpl").map_err(|e| e.to_string())?;
        cursor.write_all(&smpl_size.to_le_bytes()).map_err(|e| e.to_string())?;

        // Manufacturer (0), Product (0)
        cursor.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?;
        cursor.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?;

        // Sample Period in nanoseconds (1_000_000_000 / sample_rate)
        let sample_period = 1_000_000_000u32 / sample_rate;
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
        // Cue Point ID (0)
        cursor.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?;
        // Type: 0 = Forward loop, 1 = Ping-Pong, 2 = Reverse
        cursor.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?;
        // Start sample point
        cursor.write_all(&l_start.to_le_bytes()).map_err(|e| e.to_string())?;
        // End sample point
        cursor.write_all(&l_end.to_le_bytes()).map_err(|e| e.to_string())?;
        // Fraction (0)
        cursor.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?;
        // Play Count: 0 = infinite
        cursor.write_all(&0u32.to_le_bytes()).map_err(|e| e.to_string())?;
    }

    // Patch RIFF size (total bytes - 8)
    let total_len = cursor.position() as u32;
    let riff_size = total_len - 8;
    cursor.set_position(riff_size_pos);
    cursor.write_all(&riff_size.to_le_bytes()).map_err(|e| e.to_string())?;

    Ok(cursor.into_inner())
}
