#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use project_manager::{parse_status_md, serialize_status_md, ProjectData};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{Manager, State};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_fs::FsExt;

struct AppState {
    project_data: Mutex<ProjectData>,
    file_path: Mutex<Option<PathBuf>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct SavePayload {
    data: ProjectData,
    path: Option<String>,
}

#[tauri::command]
fn load_status_file(state: State<AppState>, app_handle: tauri::AppHandle, path: Option<String>) -> Result<ProjectData, String> {
    let path = if let Some(p) = path {
        PathBuf::from(p)
    } else {
        // Try to auto-detect STATUS.md
        let script_dir = std::env::current_dir().map_err(|e| e.to_string())?;
        let candidates = vec![
            script_dir.join("STATUS.md"),
            script_dir.join("status.md"),
        ];

        let mut found_path: Option<PathBuf> = None;
        for cand in &candidates {
            if cand.exists() {
                found_path = Some(cand.clone());
                break;
            }
        }

        if let Some(p) = found_path {
            p
        } else {
            // Prompt user to select file
            let file_path = app_handle.dialog()
                .file()
                .add_filter("Markdown", &["md"])
                .blocking_pick_file()
                .ok_or("No file selected")?;
            PathBuf::from(file_path.to_string())
        }
    };

    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))?;
    let data = parse_status_md(&content);

    *state.file_path.lock().unwrap() = Some(path);
    *state.project_data.lock().unwrap() = data.clone();

    Ok(data)
}

#[tauri::command]
fn save_status_file(state: State<AppState>, payload: SavePayload) -> Result<String, String> {
    let data = payload.data;
    let md_content = serialize_status_md(&data);

    let path = if let Some(p) = payload.path {
        PathBuf::from(p)
    } else {
        state.file_path.lock().unwrap().clone().ok_or("No file path set")?
    };

    fs::write(&path, md_content).map_err(|e| format!("Failed to write file: {}", e))?;

    *state.project_data.lock().unwrap() = data;
    *state.file_path.lock().unwrap() = Some(path.clone());

    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn get_file_path(state: State<AppState>) -> Option<String> {
    state.file_path.lock().unwrap().as_ref().map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
fn browse_for_file(app_handle: tauri::AppHandle) -> Result<String, String> {
    let file_path = app_handle.dialog()
        .file()
        .add_filter("Markdown", &["md"])
        .blocking_pick_file()
        .ok_or("No file selected")?;
    Ok(file_path.to_string())
}

#[tauri::command]
fn load_file_at_path(state: State<AppState>, path: String) -> Result<ProjectData, String> {
    let path_buf = PathBuf::from(&path);
    let content = fs::read_to_string(&path_buf).map_err(|e| format!("Failed to read file: {}", e))?;
    let data = parse_status_md(&content);

    *state.file_path.lock().unwrap() = Some(path_buf);
    *state.project_data.lock().unwrap() = data.clone();

    Ok(data)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState {
            project_data: Mutex::new(ProjectData {
                sections: vec![],
                milestones: vec![],
                blockers: vec![],
                last_updated: chrono::Utc::now().format("%Y-%m-%d").to_string(),
                meta: project_manager::ProjectMeta::default(),
            }),
            file_path: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            load_status_file,
            save_status_file,
            get_file_path,
            browse_for_file,
            load_file_at_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
