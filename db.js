const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'blog.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function getAllPosts() {
  return getDb().prepare('SELECT id, title, author, created_at, updated_at FROM posts ORDER BY created_at DESC').all();
}

function getPost(id) {
  return getDb().prepare('SELECT * FROM posts WHERE id = ?').get(id);
}

function createPost(title, content, author) {
  const stmt = getDb().prepare('INSERT INTO posts (title, content, author) VALUES (?, ?, ?)');
  const result = stmt.run(title, content, author);
  return getPost(result.lastInsertRowid);
}

function updatePost(id, title, content) {
  getDb().prepare('UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(title, content, id);
  return getPost(id);
}

function deletePost(id) {
  getDb().prepare('DELETE FROM posts WHERE id = ?').run(id);
}

module.exports = { getAllPosts, getPost, createPost, updatePost, deletePost };