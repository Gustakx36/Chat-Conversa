// Import do sqlite module
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Configuração da conexão com banco
const db = await open({
    filename: './database.db',
    driver: sqlite3.cached.Database
});

// Exportando conexão
export default db;