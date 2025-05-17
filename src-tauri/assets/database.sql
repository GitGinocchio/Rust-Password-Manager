BEGIN;

CREATE TABLE IF NOT EXISTS users (
    master_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    name TEXT NOT NULL PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    username TEXT NULL,
    email TEXT NULL,
    url TEXT NULL,
    notes TEXT NULL,
    category TEXT NULL,
    favorites BOOLEAN,

    -- encryption
    password TEXT NOT NULL,

    FOREIGN KEY (category) REFERENCES categories(name)
);

CREATE TRIGGER IF NOT EXISTS cleanup_unused_categories
AFTER DELETE ON credentials
BEGIN
    DELETE FROM categories
    WHERE name NOT IN (
        SELECT DISTINCT category FROM credentials WHERE category IS NOT NULL
    );
END;

CREATE TRIGGER IF NOT EXISTS cleanup_unused_categories_after_update
AFTER UPDATE OF category ON credentials
BEGIN
    DELETE FROM categories
    WHERE name NOT IN (
        SELECT DISTINCT category FROM credentials WHERE category IS NOT NULL
    );
END;

CREATE TRIGGER IF NOT EXISTS cleanup_unused_categories_after_insert
AFTER INSERT ON credentials
BEGIN
    DELETE FROM categories
    WHERE name NOT IN (
        SELECT DISTINCT category FROM credentials WHERE category IS NOT NULL
    );
END;

COMMIT;