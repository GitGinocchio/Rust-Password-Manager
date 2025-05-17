use std::sync::{Arc, Mutex, MutexGuard};
use aes_gcm::{Aes256Gcm};
use rusqlite::Connection;

pub struct AppState {
    conn: Arc<Mutex<Connection>>,
    cipher: Arc<Mutex<Option<Aes256Gcm>>>
}

impl AppState {
    pub fn new(conn : Connection) -> Self {
        AppState {
            cipher: Arc::new(Mutex::new(None)),
            conn: Arc::new(Mutex::new(conn)),
        }
    }

    pub fn get_conn(&self) -> MutexGuard<'_, Connection> {
        let guard = self.conn.lock().unwrap();
        return guard;
    }

    pub fn set_cipher(&self, cipher: Aes256Gcm) {
        let mut guard = self.cipher.lock().unwrap();
        *guard = Some(cipher);
    }

    pub fn get_cipher(&self) -> Option<Aes256Gcm> {
        let guard = self.cipher.lock().unwrap();
        guard.clone()
    }

/*
    pub fn clear_cipher(&self) {
        let mut guard = self.cipher.lock().unwrap();
        *guard = None;
    }

    pub fn is_authenticated(&self) -> bool {
        self.cipher.lock().unwrap().is_some()
    }
*/
}
