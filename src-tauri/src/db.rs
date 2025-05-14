use std::fs;
use tauri::Manager;
use rusqlite::Connection;

pub fn init_db(app_handle: &tauri::AppHandle) -> Result<Connection, String> {
    let data_dir = app_handle.path().app_data_dir();
    match data_dir {
        Ok(path) => {
            fs::create_dir_all(&path).map_err(|e| format!("Errore nella creazione della directory di dati: {}", e))?;

            let db_path = path.join("data.db");

            println!("Database path: {:?}", db_path);

            let conn = Connection::open(db_path).map_err(|e| format!("Impossibile aprire il database: {}", e))?;

            let schema = include_str!("../assets/database.sql");
            conn.execute_batch(schema).map_err(|e| format!("Impossibile eseguire lo schema del database: {}", e))?;

            Ok(conn)
        }
        Err(e) => {
            return Err(format!("Errore durante la ricerca della directory di dati dell'applicazione: {}", e));
        }
    }
}
