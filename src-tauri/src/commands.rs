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
            params: p.params,
        })
        .collect()
}
