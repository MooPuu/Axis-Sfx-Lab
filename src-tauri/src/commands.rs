use crate::dsp::loop_editor::LoopSettings;
use crate::dsp::presets::get_factory_presets;
use crate::dsp::synth::SynthParams;
use crate::dsp::{
    generate_variations, render_custom_export, render_sfx_and_loop, CustomExportConfig,
    CustomExportResult, ProcessedAudioPayload,
};
use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use std::fs;

#[derive(serde::Serialize)]
pub struct PresetInfo {
    pub id: String,
    pub name: String,
    pub category: String,
    pub subcategory: String,
    pub tags: Vec<String>,
    pub is_loop: bool,
    pub params: SynthParams,
}

#[tauri::command]
pub fn cmd_generate_sfx(
    params: SynthParams,
    loop_settings: LoopSettings,
) -> Result<ProcessedAudioPayload, String> {
    render_sfx_and_loop(&params, &loop_settings)
}

#[tauri::command]
pub fn cmd_batch_variations(
    params: SynthParams,
    loop_settings: LoopSettings,
    count: usize,
    jitter_pct: f32,
) -> Result<Vec<(String, ProcessedAudioPayload)>, String> {
    generate_variations(&params, &loop_settings, count, jitter_pct)
}

#[tauri::command]
pub fn cmd_export_custom(
    params: SynthParams,
    loop_settings: LoopSettings,
    config: CustomExportConfig,
) -> Result<CustomExportResult, String> {
    render_custom_export(&params, &loop_settings, &config)
}

#[tauri::command]
pub fn cmd_export_wav_to_file(file_path: String, wav_base64: String) -> Result<String, String> {
    let bytes = BASE64.decode(&wav_base64).map_err(|e| e.to_string())?;
    fs::write(&file_path, bytes).map_err(|e| format!("Failed to write file to {}: {}", file_path, e))?;
    Ok(file_path)
}

#[tauri::command]
pub fn cmd_get_factory_presets() -> Vec<PresetInfo> {
    get_factory_presets()
        .into_iter()
        .map(|p| PresetInfo {
            id: p.id.to_string(),
            name: p.name.to_string(),
            category: p.category.to_string(),
            subcategory: p.subcategory.to_string(),
            tags: p.tags.iter().map(|s| s.to_string()).collect(),
            is_loop: p.is_loop,
            params: p.params,
        })
        .collect()
}

#[tauri::command]
pub fn cmd_search_cloud_sounds(query: String, limit: usize) -> Result<String, String> {
    let clean_query = query.trim().replace(' ', "+");
    let url = format!(
        "https://api.lotsofsounds.com/api/v1/sounds/sample?q={}&limit={}",
        clean_query, limit
    );
    let mut resp = ureq::get(&url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .call()
        .map_err(|e| format!("HTTP request failed: {}", e))?;
    let body = resp
        .body_mut()
        .read_to_string()
        .map_err(|e| format!("Failed to read response: {}", e))?;
    Ok(body)
}

#[tauri::command]
pub fn cmd_fetch_audio_base64(url: String) -> Result<String, String> {
    let mut resp = ureq::get(&url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .call()
        .map_err(|e| format!("Audio fetch failed: {}", e))?;
    let mut bytes = Vec::new();
    use std::io::Read;
    resp.body_mut()
        .as_reader()
        .read_to_end(&mut bytes)
        .map_err(|e| format!("Failed to read audio bytes: {}", e))?;
    Ok(BASE64.encode(&bytes))
}

#[tauri::command]
pub fn cmd_download_cloud_sound(sound_id: String) -> Result<String, String> {
    let stream_api = format!(
        "https://api.lotsofsounds.com/api/v1/sounds/sample/{}/stream",
        sound_id.trim()
    );
    let mut resp = ureq::get(&stream_api)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .call()
        .map_err(|e| format!("Stream API request failed: {}", e))?;
    let body_str = resp
        .body_mut()
        .read_to_string()
        .map_err(|e| format!("Failed to read stream JSON: {}", e))?;

    let json_val: serde_json::Value = serde_json::from_str(&body_str)
        .map_err(|e| format!("Invalid stream JSON: {}", e))?;
    let direct_url = json_val
        .get("data")
        .and_then(|d| d.get("stream_url"))
        .and_then(|u| u.as_str())
        .ok_or_else(|| "Missing stream_url in response".to_string())?;

    let mut audio_resp = ureq::get(direct_url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .call()
        .map_err(|e| format!("Audio download failed: {}", e))?;
    let mut audio_bytes = Vec::new();
    use std::io::Read;
    audio_resp
        .body_mut()
        .as_reader()
        .read_to_end(&mut audio_bytes)
        .map_err(|e| format!("Failed to read audio bytes: {}", e))?;

    Ok(BASE64.encode(&audio_bytes))
}
