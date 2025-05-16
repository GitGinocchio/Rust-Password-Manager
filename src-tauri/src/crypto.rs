use aes_gcm::{
    aead::{rand_core::RngCore, Aead, KeyInit, OsRng}, Aes256Gcm, Key, Nonce // Or `Aes128Gcm`
};
use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use base64::{engine::general_purpose, Engine as _};

const NONCE_LEN: usize = 12;

pub fn verify_master_password(master_password: &String, master_hash: &String) -> Result<bool, String> {
    let parsed_hash = PasswordHash::new(&master_hash)
        .map_err(|e| format!("Impossibile fare il parse del master hash '{}': {}", master_hash, e))?;
    let argon2 = Argon2::default();

    match argon2.verify_password(master_password.as_bytes(), &parsed_hash) {
        Ok(_) => Ok(true),
        Err(argon2::password_hash::Error::Password) => Ok(false), // password sbagliata
        Err(e) => Err(format!("Errore durante la verifica della password: {}", e)),
    }
}

pub fn derive_key_and_hash_master_password(master_password: &String) -> Result<(Key<Aes256Gcm>, String), String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    let mut key_bytes = [0u8; 32];
    argon2.hash_password_into(master_password.as_bytes(), salt.as_str().as_bytes(), &mut key_bytes)
          .map_err(|e| format!("Impossibile generare la chiave derivata dalla master password: {}", e))?;

    match argon2.hash_password(master_password.as_bytes(), &salt) {
        Ok(hash) => Ok((Key::<Aes256Gcm>::from_slice(&key_bytes).clone(), hash.to_string())),
        Err(e) => Err(format!("Impossibile generare l'hash della password '{}': {}", master_password, e))
    }
}

pub fn derive_key_with_salt(master_password: &String, master_hash: &String) -> Result<Key<Aes256Gcm>, String> {
    let parsed_hash = PasswordHash::new(&master_hash)
        .map_err(|e| format!("Impossibile fare il parse del master hash: {}", e))?;
    
    let salt = parsed_hash
        .salt
        .ok_or("Hash della master password non contiene il salt!")?;

    let argon2 = Argon2::default();

    let mut key_bytes = [0u8; 32];
    argon2.hash_password_into(master_password.as_bytes(), salt.as_str().as_bytes(), &mut key_bytes)
          .map_err(|e| format!("Impossibile generare la chiave derivata: {}", e))?;

    Ok(Key::<Aes256Gcm>::from_slice(&key_bytes).clone())
}

pub fn create_cipher(key : Key<Aes256Gcm>) -> Aes256Gcm {
    Aes256Gcm::new(&key)
}

pub fn encrypt(plaintext: &String, cipher: &Aes256Gcm) -> Result<String, String> {
    // Genera un nonce casuale
    let mut nonce_bytes = [0u8; NONCE_LEN];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Cifra il messaggio
    let ciphertext = cipher.encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| format!("Errore di cifratura: {}", e))?;

    // Concateno nonce + ciphertext
    let mut combined = Vec::new();
    combined.extend_from_slice(&nonce_bytes);
    combined.extend_from_slice(&ciphertext);

    // Codifico in base64 per salvarlo o trasmetterlo
    Ok(general_purpose::STANDARD.encode(&combined))
}

pub fn decrypt(encoded: &String, cipher: &Aes256Gcm) -> Result<String, String> {
    let combined = general_purpose::STANDARD.decode(encoded).map_err(|e| format!("Base64 decoding error: {}", e))?;

    if combined.len() < NONCE_LEN {
        return Err("Dati troppo brevi per contenere un nonce valido.".to_string());
    }

    let (nonce_bytes, ciphertext) = combined.split_at(NONCE_LEN);
    let nonce = Nonce::from_slice(nonce_bytes);

    let decrypted_bytes = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("Errore di decifratura: {}", e.to_string()))?;

    // Converti da Vec<u8> a String
    String::from_utf8(decrypted_bytes).map_err(|e| format!("Errore UTF-8: {}", e))
}