// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use std::sync::{Arc, Mutex};
use tauri::{Emitter, Manager};

mod state;
use state::AppState;

mod db;
use db::init_db;

mod crypto;
use crypto::{decrypt, derive, encrypt, verify};

#[tauri::command]
fn is_registered(_app_handle: tauri::AppHandle, state: tauri::State<'_, AppState>) -> i32 {
    let conn = state.get_conn();

    if conn.is_none() { panic!("Connessione non inizializzata!"); }

    let count: i32 = match conn.as_ref().unwrap().query_row("SELECT COUNT(*) FROM users", [], |row| { row.get(0) }) {
        Ok(count) => count,
        Err(e) => {
            println!("Errore nella query del conteggio degli utenti: {}", e);
            0
        },
    };

    return count;
}

#[tauri::command]
fn register(_app_handle: tauri::AppHandle, state: tauri::State<'_, AppState>, password: String) -> Result<&str, String> {
    let (master_hash, master_salt) = derive(&password).map_err(|e| format!("Errore nella derivazione della chiave della master password: {}", e))?;
    let (encryption_key, encryption_salt) = derive(&password).map_err(|e| format!("Errore nella derivazione della chiave di crittografia: {}", e))?;

    let conn = state.get_conn();
    if conn.is_none() { panic!("Connessione non inizializzata!"); }

    let count: i32 = match conn.as_ref().unwrap().query_row("SELECT COUNT(*) FROM users", [], |row| { row.get(0) }) {
        Ok(count) => count,
        Err(e) => {
            println!("Errore nella query del conteggio degli utenti: {}", e);
            0
        },
    };

    if count > 0 { return Ok("already-registered"); };

    state.set_key(encryption_key);

    conn.as_ref().unwrap().execute(
        "INSERT INTO users (master_hash, master_salt, encryption_salt) VALUES (?1, ?2, ?3)",
        (master_hash, master_salt.as_str(), encryption_salt.as_str()),
    ).map_err(|e| format!("Errore nell'inserimento utente: {}", e))?;

    Ok("successfully-registered")
}

#[tauri::command]
fn login(app_handle: tauri::AppHandle, state: tauri::State<'_, AppState>, password: String) -> Result<bool, String> {
    let conn = state.get_conn();
    if conn.is_none() {
        return Err("Connessione non inizializzata!".into());
    }

    let conn = conn.as_ref().unwrap();
    let mut stmt = conn.prepare("SELECT master_hash FROM users LIMIT 1").map_err(|e| format!("Errore nella preparazione della query: {}", e))?;

    let mut rows = stmt.query([]).map_err(|e| format!("Errore durante l'esecuzione della query: {}", e))?;

    let row = match rows.next() {
        Ok(Some(row)) => row,
        Ok(None) => return Err("Nessun utente trovato.".into()),
        Err(e) => return Err(format!("Errore nel recupero della riga: {}", e)),
    };

    let master_hash_bytes: Vec<u8> = row.get(0).map_err(|e| format!("Errore durante il recupero dell'hash: {}", e))?;

    verify(&password, &master_hash_bytes)
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        // note: forse potrei togliere setup e includerlo nel manage di modo che
        //       posso fin da subito creare la connessione e istanziare lo stato
        .manage(AppState::new())
        .setup(|app| {
            match init_db(app.handle()) {
                Ok(_) => {
                    println!("Database inizializzato con successo!");
                },
                Err(e) => {
                    panic!("Errore nell'inizializzazione del database: {e}");
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![register, is_registered, login])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
