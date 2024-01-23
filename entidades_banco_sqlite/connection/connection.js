import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// you would have to import / invoke this in another file
const db = await open({
    filename: './database.db',
    driver: sqlite3.cached.Database
});

export default db;