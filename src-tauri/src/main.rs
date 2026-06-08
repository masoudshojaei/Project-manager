#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::sync::Mutex;
use tauri::State;

struct AppState {
    file_path: Mutex<Option<String>>,
}

/// Load the currently tracked file (used on app start)
#[tauri::command]
fn load_status_file(state: State<AppState>) -> Result<String, String> {
    let path = state
        .file_path
        .lock()
        .unwrap()
        .clone()
        .ok_or("No file path set")?;
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// Read a file at a specific path and track it as the current file
#[tauri::command]
fn read_file(path: String, state: State<AppState>) -> Result<String, String> {
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    *state.file_path.lock().unwrap() = Some(path);
    Ok(content)
}

/// Save markdown content. If `path` is provided, use it; otherwise use the tracked path.
/// Returns the path that was written to.
#[tauri::command]
fn save_status_file(
    content: String,
    path: Option<String>,
    state: State<AppState>,
) -> Result<String, String> {
    let file_path = match path {
        Some(p) => p,
        None => state
            .file_path
            .lock()
            .unwrap()
            .clone()
            .ok_or("No file path provided or set")?,
    };

    fs::write(&file_path, content).map_err(|e| e.to_string())?;
    *state.file_path.lock().unwrap() = Some(file_path.clone());
    Ok(file_path)
}

/// Get the currently tracked file path
#[tauri::command]
fn get_file_path(state: State<AppState>) -> Option<String> {
    state.file_path.lock().unwrap().clone()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            file_path: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            load_status_file,
            read_file,
            save_status_file,
            get_file_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
