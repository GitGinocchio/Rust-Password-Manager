// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use rusqlite::params;
use tauri::{Emitter, Manager};

mod state;
use state::AppState;

mod utils;
use utils::empty_to_null;

mod db;
use db::init_db;

mod crypto;
use crypto::{decrypt, derive_key, derive_key_with_salt, create_cipher, encrypt, hash_master_password, verify_master_password};

#[tauri::command]
fn is_registered(_app_handle: tauri::AppHandle, state: tauri::State<'_, AppState>) -> i32 {
    let conn = state.get_conn();

    let count: i32 = match conn.query_row("SELECT COUNT(*) FROM users", [], |row| { row.get(0) }) {
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
    let conn = state.get_conn();

    let count: i32 = match conn.query_row("SELECT COUNT(*) FROM users", [], |row| { row.get(0) }) {
        Ok(count) => count,
        Err(e) => {
            println!("Errore nella query del conteggio degli utenti: {}", e);
            0
        },
    };

    if count > 0 { return Ok("already-registered"); };

    let master_hash = hash_master_password(&password).map_err(|e| format!("Errore nella creazione dell'hash della password: {}", e))?;
    
    let key = derive_key(&password).map_err(|e| format!("Errore nella derivazione della chiave di crittografia: {}", e))?;
    state.set_cipher(create_cipher(key));

    conn.execute("INSERT INTO users (master_hash) VALUES (?1)", [master_hash])
        .map_err(|e| format!("Errore nell'inserimento utente: {}", e))?;


    Ok("successfully-registered")
}

#[tauri::command]
fn login(_app_handle: tauri::AppHandle, state: tauri::State<'_, AppState>, password: String) -> Result<bool, String> {
    let conn = state.get_conn();

    let mut stmt = conn.prepare("SELECT master_hash FROM users LIMIT 1")
                       .map_err(|e| format!("Errore nella preparazione della query: {}", e))?;

    let mut rows = stmt.query([]).map_err(|e| format!("Errore durante l'esecuzione della query: {}", e))?;

    let row = match rows.next() {
        Ok(Some(row)) => row,
        Ok(None) => return Err("Nessun utente trovato.".into()),
        Err(e) => return Err(format!("Errore nel recupero della riga: {}", e)),
    };

    let master_hash_bytes: String = row.get(0)
        .map_err(|e| format!("Errore durante il recupero dell'hash: {}", e))?;

    let verified = verify_master_password(&password, &master_hash_bytes);
    if verified.is_err() { return verified; }

    let key = derive_key_with_salt(&password, &master_hash_bytes)
             .map_err(|e| format!("Errore nella derivazione della chiave di crittografia: {}", e))?;

    println!("Encryption key: {key:?}");

    state.set_cipher(create_cipher(key));

    verified
}

#[tauri::command]
fn new(
    app_handle: tauri::AppHandle, 
    state: tauri::State<'_, AppState>,
    title: String,
    username: String, 
    email: String,
    password: String,
    url: String,
    category: String,
    notes: String,
    favorite: bool,
) -> Result<bool, String> {
    println!("{title}, {username}, {password}, {url}, {category}, {notes}, {favorite}");

    let conn = state.get_conn();

    let cipher = state.get_cipher();
    if cipher.is_none() { return Err("La chiave di crittografia non e' salvata nello stato del programma.".to_string()); }

    let encrypted = encrypt(&password, &cipher.unwrap())
                   .map_err(|e| format!("An error occurred while encrypting your password: {e}"));

    println!("Encrypted password: {encrypted:?}");

    let mut stmt = conn.prepare("INSERT INTO credentials (title, username, email, password, url, category, notes, favorites) 
                                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)")
                       .map_err(|e| format!("Errore nella preparazione della query: {}", e))?;

    stmt.execute(params![
        empty_to_null(&title), 
        empty_to_null(&username), 
        empty_to_null(&email), 
        encrypted.unwrap(),
        empty_to_null(&url), 
        empty_to_null(&category), 
        empty_to_null(&notes), 
        favorite
    ]).map_err(|e| format!("Errore durante l'esecuzione della query: {}", e))?;

    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let conn = init_db(app.handle()).map_err(|e| format!("Errore DB: {}", e))?;

            app.manage(AppState::new(conn));
            println!("Database inizializzato con successo!");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![register, is_registered, login, new])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
