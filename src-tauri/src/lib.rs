mod screen_capture;
use screen_capture::take_image;

#[tauri::command]
fn screen_capture_take_image() -> Result<String, String> {
    take_image()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![screen_capture_take_image])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
