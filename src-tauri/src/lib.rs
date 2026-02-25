use std::thread;
use std::time::Duration;
use tauri_plugin_log::{Target, TargetKind};
use log::LevelFilter;
use enigo::{Enigo, Mouse, Settings, Coordinate::{Abs, Rel}};

// Source
mod display;
use display::screenshot;

#[tauri::command]
fn test_screenshot() -> Result<String, String> {
    screenshot()
}

#[tauri::command]
fn test_mouse() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    enigo::set_dpi_awareness().unwrap();

    let wait_time = Duration::from_secs(2);
    let mut enigo = Enigo::new(&Settings::default()).unwrap();

    thread::sleep(Duration::from_secs(2));
    
    log::info!("Info: Screen dimensions: {:?}", enigo.main_display().unwrap());

    thread::sleep(wait_time);

    enigo.move_mouse(500, 200, Abs).unwrap();

    thread::sleep(wait_time);

    enigo.move_mouse(100, 100, Rel).unwrap();

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new()
            .level(LevelFilter::Info)
            .targets([
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::Webview)
                ]).build()
            )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![test_screenshot, test_mouse])
        .run(tauri::generate_context!())
        .expect("Error: execution failed!");
}
