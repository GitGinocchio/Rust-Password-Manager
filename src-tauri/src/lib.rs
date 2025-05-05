// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use std::sync::{Arc, Mutex};
use tauri::Emitter;

mod state;
use state::State;

mod db;
use db::init_db;

mod crypto;
use crypto::{decrypt, derive, encrypt};

#[tauri::command]
fn register(app_handle: tauri::AppHandle, state: tauri::State<'_, Mutex<State>>, password: String) -> Result<(), String> {
    let key = derive(password.as_str());

    match key {
        Ok(key) => {
            let mut state = state.lock().map_err(|e| format!("Errore nel lock dello stato: {}", e))?;
            state.key = Arc::new(Mutex::new(Some(key.clone())));

            let result = app_handle.emit("registered-successfully", ());

            if result.is_err() {
                return Err(format!("Errore nell'emissione dell'evento: {:?}", result));
            }

            println!("Registration event sent!");
        }
        Err(e) => {
            return Err(format!("Errore nella derivazione della chiave: {}", e));
        }
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let _conn = init_db(app.handle())
                .map_err(|e| format!("Errore nell'inizializzazione del database: {:?}", e));
            Ok(())
        })
        .manage(std::sync::Mutex::new(State {
            key: std::sync::Arc::new(std::sync::Mutex::new(None)),
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![register])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
