use std::sync::{Arc, Mutex};

pub struct State {
    pub key: Arc<Mutex<Option<Vec<u8>>>>,
}

impl State {
    pub fn new() -> Self {
        Self {
            key: Arc::new(Mutex::new(None)),
        }
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
