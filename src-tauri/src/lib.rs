pub mod commands;
pub mod dsp;

use commands::{
    cmd_batch_variations, cmd_export_custom, cmd_export_wav_to_file, cmd_generate_sfx,
    cmd_get_factory_presets,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            cmd_generate_sfx,
            cmd_batch_variations,
            cmd_export_custom,
            cmd_export_wav_to_file,
            cmd_get_factory_presets
        ])
        .run(tauri::generate_context!())
        .expect("error while running Axis SFX Lab application");
}
