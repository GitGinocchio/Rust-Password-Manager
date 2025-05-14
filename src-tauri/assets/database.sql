BEGIN;

CREATE TABLE IF NOT EXISTS users (
    master_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    username TEXT,
    email TEXT,
    url TEXT,
    notes TEXT,
    category TEXT,
    favorites BOOLEAN,

    -- encryption
    password TEXT NOT NULL
);

COMMIT;