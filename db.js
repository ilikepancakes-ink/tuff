const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'blog.db');
let db;

function generateSlug() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 12; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

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
      slug TEXT UNIQUE NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add slug column if it doesn't exist (for existing databases)
  try {
    db.exec("ALTER TABLE posts ADD COLUMN slug TEXT UNIQUE NOT NULL DEFAULT ''");
    // Generate slugs for existing rows
    const rows = db.prepare("SELECT id FROM posts WHERE slug = ''").all();
    for (const row of rows) {
      let slug;
      do {
        slug = generateSlug();
      } while (db.prepare('SELECT id FROM posts WHERE slug = ?').get(slug));
      db.prepare('UPDATE posts SET slug = ? WHERE id = ?').run(slug, row.id);
    }
  } catch (e) {
    // Column already exists
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);
}

function getAllPosts() {
  return getDb().prepare('SELECT id, slug, title, author, created_at, updated_at FROM posts ORDER BY created_at DESC').all();
}

function getPost(id) {
  return getDb().prepare('SELECT * FROM posts WHERE id = ?').get(id);
}

function getPostBySlug(slug) {
  return getDb().prepare('SELECT * FROM posts WHERE slug = ?').get(slug);
}

function createPost(title, content, author) {
  let slug;
  // Generate unique slug
  do {
    slug = generateSlug();
  } while (getDb().prepare('SELECT id FROM posts WHERE slug = ?').get(slug));

  const stmt = getDb().prepare('INSERT INTO posts (slug, title, content, author) VALUES (?, ?, ?, ?)');
  const result = stmt.run(slug, title, content, author);
  return getPost(result.lastInsertRowid);
}

function updatePost(id, title, content) {
  getDb().prepare('UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(title, content, id);
  return getPost(id);
}

function deletePost(id) {
  getDb().prepare('DELETE FROM posts WHERE id = ?').run(id);
}

// Attachment functions
function getAttachmentsForPost(postId) {
  return getDb().prepare('SELECT id, filename, original_name, file_size, mime_type, uploaded_at FROM attachments WHERE post_id = ? ORDER BY uploaded_at ASC').all(postId);
}

function getPostWithAttachments(id) {
  const post = getPost(id);
  if (!post) return null;
  post.attachments = getAttachmentsForPost(id);
  return post;
}

function getPostBySlugWithAttachments(slug) {
  const post = getPostBySlug(slug);
  if (!post) return null;
  post.attachments = getAttachmentsForPost(post.id);
  return post;
}

function getAllPostsWithAttachments() {
  const posts = getAllPosts();
  for (const post of posts) {
    post.attachment_count = getDb().prepare('SELECT COUNT(*) as count FROM attachments WHERE post_id = ?').get(post.id).count;
  }
  return posts;
}

function createAttachment(postId, filename, originalName, fileSize, mimeType) {
  const stmt = getDb().prepare('INSERT INTO attachments (post_id, filename, original_name, file_size, mime_type) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(postId, filename, originalName, fileSize, mimeType);
  return getDb().prepare('SELECT * FROM attachments WHERE id = ?').get(result.lastInsertRowid);
}

function deleteAttachment(id) {
  const attachment = getDb().prepare('SELECT * FROM attachments WHERE id = ?').get(id);
  if (attachment) {
    getDb().prepare('DELETE FROM attachments WHERE id = ?').run(id);
  }
  return attachment;
}

function getAttachmentCount(postId) {
  return getDb().prepare('SELECT COUNT(*) as count FROM attachments WHERE post_id = ?').get(postId).count;
}

module.exports = { getAllPosts, getPost, getPostBySlug, createPost, updatePost, deletePost, getAttachmentsForPost, getPostWithAttachments, getPostBySlugWithAttachments, getAllPostsWithAttachments, createAttachment, deleteAttachment, getAttachmentCount };