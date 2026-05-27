import { invoke } from "@tauri-apps/api/core";
import type { ProjectData } from "./types";

export async function loadStatusFile(): Promise<ProjectData> {
  return invoke("load_status_file");
}

export async function saveStatusFile(data: ProjectData, path?: string): Promise<string> {
  return invoke("save_status_file", { payload: { data, path } });
}

export async function getFilePath(): Promise<string | null> {
  return invoke("get_file_path");
}

export async function browseForFile(): Promise<string> {
  return invoke("browse_for_file");
}

export async function loadFileAtPath(path: string): Promise<ProjectData> {
  return invoke("load_file_at_path", { path });
}
