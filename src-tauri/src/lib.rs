// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use rusqlite::{params, ToSql};
use tauri::{Manager};

use serde_json;

mod state;
use state::AppState;

mod utils;
use utils::{empty_to_null, Credential, Category};

mod db;
use db::init_db;

mod crypto;
use crypto::{
    decrypt, 
    derive_key_and_hash_master_password, 
    derive_key_with_salt, 
    create_cipher, 
    encrypt, 
    verify_master_password
};

#[tauri::command]
fn is_registered(_app_handle: tauri::AppHandle, state: tauri::State<'_, AppState>) -> u32 {
    let conn = state.get_conn();

    let count: u32 = match conn.query_row("SELECT COUNT(*) FROM users", [], |row| { row.get(0) }) {
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

    let (key, master_hash) = derive_key_and_hash_master_password(&password)
        .map_err(|e| format!("Errore nella creazione dell'hash e della chiave: {}", e))?;

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

    let master_hash: String = row.get(0)
        .map_err(|e| format!("Errore durante il recupero dell'hash: {}", e))?;

    let verified = verify_master_password(&password, &master_hash);
    if verified.is_err() { return verified; }

    let key = derive_key_with_salt(&password, &master_hash)
             .map_err(|e| format!("Errore nella derivazione della chiave di crittografia: {}", e))?;

    state.set_cipher(create_cipher(key));

    verified
}

#[tauri::command]
fn new(
    _app_handle: tauri::AppHandle, 
    state: tauri::State<'_, AppState>,
    id : Option<u32>,
    title: String,
    username: String, 
    email: String,
    password: String,
    url: String,
    category: String,
    notes: String,
    favorite: bool,
) -> Result<bool, String> {
    let conn = state.get_conn();

    let cipher = state.get_cipher();
    if cipher.is_none() { return Err("La chiave di crittografia non e' salvata nello stato del programma.".to_string()); }

    let encrypted = encrypt(&password, &cipher.unwrap())
                   .map_err(|e| format!("An error occurred while encrypting your password: {e}"));

    let query : &str;

    let title_val = empty_to_null(&title);
    let username_val = empty_to_null(&username);
    let email_val = empty_to_null(&email);
    let url_val = empty_to_null(&url);
    let category_val = empty_to_null(&category);
    let notes_val = empty_to_null(&notes);
    let encrypted_val = encrypted.unwrap();

    if let Some(ref category) = category_val {
        conn.execute("INSERT OR IGNORE INTO categories (name) VALUES (?1);", [category],)
            .map_err(|e| format!("Errore durante l'inserimento: {}", e))?;
    }

    let mut params: Vec<&dyn ToSql> = vec![
        &title_val,
        &username_val,
        &email_val,
        &encrypted_val,
        &url_val,
        &category_val,
        &notes_val,
        &favorite,
    ];

    if id.is_some() {
        query = "UPDATE credentials SET title = ?1, username = ?2, email = ?3, password = ?4, url = ?5, category = ?6, notes = ?7, favorites = ?8 WHERE id = ?9";
        params.push(&id);
    }
    else {
        query = "INSERT INTO credentials (title, username, email, password, url, category, notes, favorites) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"; 
    }

    let mut stmt = conn.prepare(query).map_err(|e| format!("Errore nella preparazione della query: {}", e))?;
    stmt.execute(params.as_slice()).map_err(|e| format!("Errore durante l'esecuzione della query: {}", e))?;

    Ok(true)
}

#[tauri::command]
fn get_credentials(_app_handle: tauri::AppHandle, state: tauri::State<'_, AppState>) -> Result<String, String> {
    let conn = state.get_conn();

    let mut stmt = conn.prepare("SELECT * FROM credentials")
        .map_err(|e| format!("Errore durante la preparazione della query: {}", e))?;

    let mut rows = stmt.query([])
        .map_err(|e| format!("Errore durante l'esecuzione della query: {}", e))?;

    let mut credentials: Vec<Credential> = Vec::new();

    while let Some(row) = rows.next().map_err(|e| format!("Errore durante il ciclo while: {}", e))? {
        credentials.push(Credential {
            id: row.get(0).map_err(|e| format!("Errore row.get: {}", e))?,
            title: row.get(1).map_err(|e| format!("Errore row.get: {}", e))?,
            username: row.get(2).map_err(|e| format!("Errore row.get: {}", e))?,
            email: row.get(3).map_err(|e| format!("Errore row.get: {}", e))?,
            url: row.get(4).map_err(|e| format!("Errore row.get: {}", e))?,
            notes: row.get(5).map_err(|e| format!("Errore row.get: {}", e))?,
            category: row.get(6).map_err(|e| format!("Errore row.get: {}", e))?,
            favorites: row.get(7).map_err(|e| format!("Errore row.get: {}", e))?,
            // password: row.get(8).map_err(|e| format!("Errore row.get: {}", e))?
        });
    }

    let json = serde_json::to_string(&credentials).map_err(|e| format!("Errore nella serializzazione: {}", e))?;

    Ok(json)
}

#[tauri::command]
fn get_categories(_app_handle: tauri::AppHandle, state: tauri::State<'_, AppState>) -> Result<String, String> {
    let conn = state.get_conn();

    let mut stmt = conn
        .prepare("SELECT name FROM categories")
        .map_err(|e| format!("Errore nella preparazione della query: {}", e))?;

    let categories_iter = stmt.query_map([], |row| {
        Ok(Category {
            name: row.get(0)?,
        })
    })
    .map_err(|e| format!("Errore durante l'esecuzione della query: {}", e))?;

    let mut categories = Vec::new();
    for category_result in categories_iter {
        let category = category_result.map_err(|e| format!("Errore nel mapping dei risultati: {}", e))?;
        categories.push(category);
    }

    serde_json::to_string(&categories).map_err(|e| format!("Errore nella serializzazione JSON: {}", e))
}

#[tauri::command]
fn get_password(_app_handle: tauri::AppHandle, state: tauri::State<'_, AppState>, id: u32) -> Result<String, String> {
    let conn = state.get_conn();
    let cipher = state.get_cipher();

    if cipher.is_none() { 
        return Err("Cipher is None".into());
    };

    let mut stmt = conn.prepare("SELECT password FROM credentials WHERE id = ?1")
        .map_err(|e| format!("Errore durante la preparazione della query: {}", e))?;
    let password: String = stmt.query_row(params![id], |row| row.get(0))
        .map_err(|e| format!("Errore durante la query al database: {}",e))?;

    match decrypt(&password, &cipher.unwrap()) {
        Ok(decoded) => { Ok(decoded) },
        Err(e) => { Err(format!("Errore durante la decodifica della password: {}", e)) }
    }
}

#[tauri::command]
fn set_favorite(_app_handle: tauri::AppHandle, state: tauri::State<'_, AppState>, id: u32, favorite: bool) -> Result<(), String> {
    let conn = state.get_conn();

    match conn.execute("UPDATE credentials SET favorites = ?1 WHERE id = ?2;", params![if favorite { 0 } else { 1 }, id]) {
        Ok(_) => { Ok(()) }
        Err(e) => { Err(format!("Errore durante l'esecuzione della query: {}", e)) }
    }
}

#[tauri::command]
fn delete_password(_app_handle: tauri::AppHandle, state: tauri::State<'_, AppState>, id: u32) -> Result<bool, String> {
    let conn = state.get_conn();

    match conn.execute("DELETE FROM credentials WHERE id = ?1;", params![id]) {
        Ok(updated) => Ok(updated > 0),
        Err(e) => Err(format!("Errore durante l'esecuzione della query: {}", e)),
    }
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
        .invoke_handler(tauri::generate_handler![
            register, is_registered, login, new, get_credentials, 
            set_favorite, delete_password, get_password, get_categories
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
