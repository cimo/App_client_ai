use std::io::Cursor;
use xcap::Monitor;
use xcap::image::ImageFormat;
use base64::{engine::general_purpose, Engine as _};

pub fn take_image() -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let monitor = monitors
        .into_iter()
        .next()
        .ok_or("No monitor found")?;

    let img = monitor.capture_image().map_err(|e| e.to_string())?;

    let mut buf = Vec::new();
    img.write_to(&mut Cursor::new(&mut buf), ImageFormat::Png)
        .map_err(|e| format!("Failed to write PNG: {}", e))?;

    Ok(general_purpose::STANDARD.encode(buf))
}
