BEGIN;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    master_hash TEXT NOT NULL,
    auth_salt TEXT NOT NULL,
    encryption_salt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS credentials (
    user_id INTEGER NOT NULL, 
    id INTEGER PRIMARY KEY,
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