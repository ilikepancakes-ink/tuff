const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();
const db = require('./db');

const app = express();
app.set('trust proxy', true);
app.use(express.json());

const PORT = process.env.PORT || 6741;

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer config - 5GB limit
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024 // 5GB
  }
});

// Load blocked IPs
let blockedIPs = new Set();

function loadBlockedIPs() {
  try {
    if (fs.existsSync('blocklist.txt')) {
      const content = fs.readFileSync('blocklist.txt', 'utf8');
      blockedIPs = new Set(content.split('\n').map(ip => ip.trim()).filter(ip => ip));
    }
  } catch (err) {
    console.error('Error loading blocklist:', err);
  }
}

loadBlockedIPs();

// IP blocking middleware
app.use((req, res, next) => {
  const ip = req.ip;
  if (blockedIPs.has(ip)) {
    return res.redirect('/block');
  }
  next();
});

// Auth helpers
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

function generateToken() {
  return jwt.sign(
    { role: 'admin', timestamp: Date.now() },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Block page
app.get('/block', (req, res) => {
  const ip = req.ip;
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blocked - ilikepancakes.ink</title>
    <meta name="description" content="Access has been blocked">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16">
    <meta name="theme-color" content="#1a1a1a">
    <link rel="stylesheet" href="style">
</head>
<body>
    <h1>Blocked</h1>
    <p>Your IP: <strong>${ip}</strong></p>
    <p>get blocked loser haha</p>
    <a href="mailto:webmaster@ilikepancakes.ink" class="button">contact webmaster</a>
    <hr>
    <p>suck my HRTitties</p>
</body>
</html>`);
});

// --- Blog Public Routes ---

// Public: get all posts (includes slug)
app.get('/api/posts', (req, res) => {
  const posts = db.getAllPostsWithAttachments();
  res.json(posts);
});

// Public: get single post by slug
app.get('/api/posts/slug/:slug', (req, res) => {
  const post = db.getPostBySlugWithAttachments(req.params.slug);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// Public: get single post by id (for backward compat / admin)
app.get('/api/posts/:id', (req, res) => {
  const post = db.getPostWithAttachments(parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// --- Blog Admin Routes ---

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = generateToken();
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Admin: create post
app.post('/api/admin/posts', requireAuth, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  const post = db.createPost(title, content, ADMIN_USERNAME);
  res.status(201).json(post);
});

// Admin: update post
app.put('/api/admin/posts/:id', requireAuth, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  const post = db.updatePost(parseInt(req.params.id), title, content);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// Admin: delete post
app.delete('/api/admin/posts/:id', requireAuth, (req, res) => {
  // Delete associated attachment files
  const attachments = db.getAttachmentsForPost(parseInt(req.params.id));
  for (const att of attachments) {
    const filePath = path.join(UPLOADS_DIR, att.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  db.deletePost(parseInt(req.params.id));
  res.json({ success: true });
});

// Admin: upload attachment
app.post('/api/admin/posts/:id/attachments', requireAuth, (req, res) => {
  const postId = parseInt(req.params.id);
  const post = db.getPost(postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'File too large. Maximum size is 5GB.' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ error: 'Too many files. Maximum is 10 attachments per post.' });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Upload failed' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Check total attachment limit
    const currentCount = db.getAttachmentCount(postId);
    const totalAfter = currentCount + req.files.length;
    if (totalAfter > 10) {
      // Remove uploaded files
      for (const file of req.files) {
        fs.unlinkSync(path.join(UPLOADS_DIR, file.filename));
      }
      return res.status(400).json({ error: `Cannot upload ${req.files.length} file(s). Post already has ${currentCount} attachment(s). Maximum is 10 total.` });
    }

    const attachments = [];
    for (const file of req.files) {
      const att = db.createAttachment(
        postId,
        file.filename,
        file.originalname,
        file.size,
        file.mimetype
      );
      attachments.push(att);
    }

    res.status(201).json({ attachments });
  });
});

// Admin: delete attachment
app.delete('/api/admin/posts/:postId/attachments/:attachmentId', requireAuth, (req, res) => {
  const attachmentId = parseInt(req.params.attachmentId);
  const attachment = db.deleteAttachment(attachmentId);
  if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

  // Delete the file
  const filePath = path.join(UPLOADS_DIR, attachment.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  res.json({ success: true });
});

// Serve uploaded files
app.use('/uploads', express.static(UPLOADS_DIR));

// --- Blog Post Page ---
// Serve individual blog post pages at /blogs/post/:slug
app.get('/blogs/post/:slug', (req, res) => {
  const slug = req.params.slug;
  const post = db.getPostBySlugWithAttachments(slug);
  if (!post) {
    return res.status(404).sendFile(path.join(__dirname, '404.html'));
  }

  let attachmentsHtml = '';
  if (post.attachments && post.attachments.length > 0) {
    attachmentsHtml = '<hr style="border-color: #333;"><h3>Attachments</h3><ul style="list-style: none; padding: 0;">';
    post.attachments.forEach(att => {
      const sizeStr = formatFileSize(att.file_size);
      attachmentsHtml += `
        <li style="margin-bottom: 8px; padding: 8px 12px; background: #2a2a2a; border-radius: 4px; border: 1px solid #444;">
          <a href="/uploads/${att.filename}" target="_blank" style="color: #61afef; text-decoration: none;">${escapeHtml(att.original_name)}</a>
          <span style="color: #888; font-size: 0.8em; margin-left: 8px;">(${sizeStr})</span>
        </li>
      `;
    });
    attachmentsHtml += '</ul>';
  }

  const contentHtml = escapeHtml(post.content).replace(/\n/g, '<br>');

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(post.title)} - ilikepancakes.ink</title>
    <meta name="description" content="${escapeHtml(post.title)}">
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/imgs/favicon-32x32">
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/imgs/favicon-16x16">
    <meta name="theme-color" content="#1a1a1a">
    <link rel="stylesheet" href="/assets/css/style">
</head>
<body>
    <h1><a href="/blog" style="color: #ffffff; text-decoration: none;">ilikepancakes.ink</a> / <a href="/blog" style="color: #61afef; text-decoration: none;">blog</a> / <span style="color: #888;">post</span></h1>

    <section>
        <p><a href="/blog" style="color: #61afef; text-decoration: none;">&larr; Back to all posts</a></p>
        <h2>${escapeHtml(post.title)}</h2>
        <p style="color: #888; font-size: 0.85em;">${new Date(post.created_at).toLocaleDateString()} by ${escapeHtml(post.author)}${post.updated_at !== post.created_at ? ' (updated)' : ''}</p>
        <hr style="border-color: #333;">
        <div style="line-height: 1.8;">${contentHtml}</div>
        ${attachmentsHtml}
    </section>
</body>
</html>`);
});

// --- Static file serving with extensionless URL support ---
app.use(express.static(__dirname, {
    extensions: ['html', 'htm'],
    index: 'index.html',
    setHeaders: (res, filePath) => {
        // Prevent serving sensitive files
        if (filePath.endsWith('.env') || filePath.endsWith('.db') || filePath.endsWith('.txt') || filePath.endsWith('.json')) {
            res.status(403).end();
        }
    }
}));

// Assets directory with extensionless URL support
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
    extensions: ['html', 'htm', 'css', 'js'],
    index: 'index.html'
}));

// 404
app.use((req, res) => {
    console.log(`404 - File not found: ${req.url}`);
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0);
  return size + ' ' + units[i];
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/gu, '&' + 'amp;')
    .replace(/</gu, '&' + 'lt;')
    .replace(/>/gu, '&' + 'gt;')
    .replace(/"/gu, '&' + 'quot;')
    .replace(/'/gu, '&#0' + '39;');
}

app.listen(PORT, () => {
    console.log(`Welcome to ilikepancakes.ink running on port ${PORT}! >_<`);
    console.log('Blog API ready at /api/posts');
    console.log('Blog admin at /blog_admin');
});