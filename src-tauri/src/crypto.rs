use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, PasswordVerifier, PasswordHash, SaltString},
    Argon2,
};
use base64::{engine::general_purpose, Engine as _};
use rand::Rng;

const NONCE_LEN: usize = 12;

pub fn derive(password: &String) -> Result<(Vec<u8>, SaltString), String> {
    let salt = SaltString::generate(&mut OsRng);

    let argon2 = Argon2::default();

    match argon2.hash_password(password.as_bytes(), &salt) {
        Ok(hash) => {
            let hash_bytes = hash.to_string().into_bytes();
            Ok((hash_bytes, salt))
        },
        Err(e) => Err(format!("Errore nella derivazione della chiave: {}", e)),
    }
}

pub fn verify(password: &String, hash_bytes: &Vec<u8>) -> Result<bool, String> {
    let hash_str = String::from_utf8(hash_bytes.clone()).map_err(|e| format!("Hash non UTF-8 valido: {}", e))?;

    let parsed_hash = PasswordHash::new(&hash_str).map_err(|e| format!("Hash Argon2 non valido: {}", e))?;

    let argon2 = Argon2::default();

    match argon2.verify_password(password.as_bytes(), &parsed_hash) {
        Ok(_) => Ok(true),
        Err(argon2::password_hash::Error::Password) => Ok(false), // password sbagliata
        Err(e) => Err(format!("Errore durante la verifica della password: {}", e)),
    }
}

pub fn encrypt(data: &[u8], key: &[u8]) -> Result<String, String> {
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| format!("Errore nella creazione del cifrante: {:?}", e))?;

    let nonce_bytes = rand::rng().random::<[u8; NONCE_LEN]>();
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, data)
        .map_err(|e| format!("Errore cifratura: {:?}", e))?;

    // Concatena nonce + ciphertext
    let mut output = nonce_bytes.to_vec();
    output.extend(ciphertext);

    Ok(general_purpose::STANDARD.encode(output)) // restituisce base64
}

pub fn decrypt(encoded_data: &str, key: &[u8]) -> Result<Vec<u8>, String> {
    let raw = general_purpose::STANDARD
        .decode(encoded_data)
        .map_err(|e| format!("Base64 errato: {}", e))?;

    if raw.len() < NONCE_LEN {
        return Err("Dati cifrati troppo corti".into());
    }

    let (nonce_bytes, ciphertext) = raw.split_at(NONCE_LEN);
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| format!("Errore nella creazione del cifrante: {:?}", e))?;
    let nonce = Nonce::from_slice(nonce_bytes);

    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("Errore decifratura: {:?}", e))
}
