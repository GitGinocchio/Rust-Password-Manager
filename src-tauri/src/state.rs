use std::sync::{Arc, Mutex, MutexGuard};
use rusqlite::Connection;

pub struct AppState {
    conn: Arc<Mutex<Option<Connection>>>,
    key: Arc<Mutex<Option<Vec<u8>>>>,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            key: Arc::new(Mutex::new(None)),
            conn: Arc::new(Mutex::new(None)),
        }
    }

    pub fn set_conn(&self, conn: Connection) {
        let mut guard = self.conn.lock().unwrap();
        *guard = Some(conn);
    }

    pub fn get_conn(&self) -> MutexGuard<'_, Option<Connection>> {
        let guard = self.conn.lock().unwrap();
        return guard;
    }

    pub fn set_key(&self, key: Vec<u8>) {
        let mut guard = self.key.lock().unwrap();
        *guard = Some(key);
    }

    pub fn get_key(&self) -> Option<Vec<u8>> {
        let guard = self.key.lock().unwrap();
        guard.clone()
    }

    pub fn clear_key(&self) {
        let mut guard = self.key.lock().unwrap();
        *guard = None;
    }

    pub fn is_authenticated(&self) -> bool {
        self.key.lock().unwrap().is_some()
    }
}
