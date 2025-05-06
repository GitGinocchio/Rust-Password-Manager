BEGIN;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    master_hash BLOB NOT NULL,
    master_salt TEXT NOT NULL,
    encryption_salt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL, 
    title TEXT NOT NULL,
    username TEXT,
    email TEXT,
    password TEXT NOT NULL,
    url TEXT NOT NULL,
    notes TEXT,
    category TEXT NOT NULL,
    favorites BOOLEAN,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

COMMIT;