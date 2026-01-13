/*
Call "send_message" from frontend.

import { invoke } from "@tauri-apps/api/core";

const result: string = await invoke("send_message", {
    message: this.hookObject.elementInputMessage.value
});

this.hookObject.elementResultMessage.innerText = result;
*/

/*
Declare "send_message" in rust.

#[tauri::command]
fn send_message(message: &str) -> String {
    format!("Your message is: {}", message)
}
*/

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        //.invoke_handler(tauri::generate_handler![send_message])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
