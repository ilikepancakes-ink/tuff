const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');

const app = express();
app.set('trust proxy', true);
app.use(express.json());

const PORT = process.env.PORT || 6741;

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
    <p>Access to this resource from your IP address has been blocked. If you believe this is an error, please contact the webmaster.</p>
    <a href="mailto:webmaster@ilikepancakes.ink" class="button">contact webmaster</a>
    <hr>
    <p>Error Status: Cloudflare Access Denied "ERR_CONNECTION_REFUSED"</p>
</body>
</html>`);
});

// --- Blog API Routes ---

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = generateToken();
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Public: get all posts
app.get('/api/posts', (req, res) => {
  const posts = db.getAllPosts();
  res.json(posts);
});

// Public: get single post
app.get('/api/posts/:id', (req, res) => {
  const post = db.getPost(parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// Admin: create post
app.post('/api/admin/posts', requireAuth, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  const post = db.createPost(title, content, 'admin');
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
  db.deletePost(parseInt(req.params.id));
  res.json({ success: true });
});

// --- Static file serving with extension hiding and filtering ---
const SKIP_EXTENSIONS = new Set(['.js', '.json', '.db', '.env', '.txt']);
function createFileEndpoints(directory, basePath = '') {
    const items = fs.readdirSync(directory);

    items.forEach(item => {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            const subBasePath = basePath + '/' + item;
            createFileEndpoints(fullPath, subBasePath);
        } else {
            const extensionIndex = item.lastIndexOf('.');
            const ext = extensionIndex > 0 ? item.slice(extensionIndex) : '';
            if (SKIP_EXTENSIONS.has(ext)) return;

            const nameWithoutExt = extensionIndex > 0 ? item.slice(0, extensionIndex) : item;
            const endpointPath = basePath + '/' + nameWithoutExt;
            app.get(endpointPath, (req, res) => {
                console.log(`Serving endpoint: ${endpointPath} (${item})`);
                res.sendFile(fullPath);
            });
        }
    });
}

createFileEndpoints(__dirname);

// Root
app.get('/', (req, res) => {
    console.log('Serving root endpoint: /');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 404
app.use((req, res) => {
    console.log(`404 - File not found: ${req.url}`);
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, () => {
    console.log(`Welcome to ilikepancakes.ink running on port ${PORT}! >_<`);
    console.log('Blog API ready at /api/posts');
    console.log('Blog admin at /blog_admin');
});