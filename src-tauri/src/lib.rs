// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use std::sync::{Arc, Mutex};
use tauri::{Emitter, Manager};

mod state;
use state::State;

mod db;
use db::init_db;

mod crypto;
use crypto::{decrypt, derive, encrypt};

#[tauri::command]
fn register(app_handle: tauri::AppHandle, state: tauri::State<'_, Mutex<State>>, password: String) -> Result<(), String> {
    let (master_hash, master_salt) = derive(&password).map_err(|e| format!("Errore nella derivazione della chiave della master password: {}", e))?;
    let (encryption_key, encryption_salt) = derive(&password).map_err(|e| format!("Errore nella derivazione della chiave di crittografia: {}", e))?;

    let mut state = state.lock().map_err(|e| format!("Errore nel lock dello stato: {}", e))?;
    state.key = Arc::new(Mutex::new(Some(encryption_key.clone())));
    
    let conn = state.conn.lock().map_err(|e| format!("Errore nel lock della connessione: {}", e))?;

    conn.execute(
        "INSERT INTO users (master_hash, master_salt, encryption_salt) VALUES (?1, ?2, ?3)",
        (master_hash, master_salt.as_str(), encryption_salt.as_str()),
    ).map_err(|e| format!("Errore nell'inserimento utente: {}", e))?;

    let result = app_handle.emit("registered-successfully", ());
    if result.is_err() {
        return Err(format!("Errore nell'emissione dell'evento: {:?}", result));
    }
    else {
        println!("Registration event sent!");
    }

    Ok(())
}

#[tauri::command]
fn login(app_handle: tauri::AppHandle, state: tauri::State<'_, Mutex<State>>, password: String) -> Result<(), String> {
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let conn = init_db(app.handle()).map_err(|e| format!("Errore nell'inizializzazione del database: {:?}", e))?;
            app.manage(State::new(conn));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![register, login])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
