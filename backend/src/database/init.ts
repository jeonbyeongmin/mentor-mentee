import sqlite3 from "sqlite3";
import { promisify } from "util";
import path from "path";

const dbPath = path.join(__dirname, "../database.sqlite");
const db = new sqlite3.Database(dbPath);

const run = promisify(db.run.bind(db)) as (
  sql: string,
  params?: any[]
) => Promise<any>;
const get = promisify(db.get.bind(db)) as (
  sql: string,
  params?: any[]
) => Promise<any>;
const all = promisify(db.all.bind(db)) as (
  sql: string,
  params?: any[]
) => Promise<any[]>;

export { db, run, get, all };

export async function initializeDatabase() {
  try {
    // Users table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        role TEXT NOT NULL CHECK (role IN ('mentor', 'mentee')),
        bio TEXT,
        profile_image TEXT,
        tech_stacks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Match requests table
    await run(`
      CREATE TABLE IF NOT EXISTS match_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mentor_id INTEGER NOT NULL,
        mentee_id INTEGER NOT NULL,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mentor_id) REFERENCES users (id),
        FOREIGN KEY (mentee_id) REFERENCES users (id),
        UNIQUE(mentor_id, mentee_id)
      )
    `);

    // Profile images table
    await run(`
      CREATE TABLE IF NOT EXISTS profile_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        data BLOB NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}
