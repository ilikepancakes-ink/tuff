const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
app.set('trust proxy', true); // trust proxy for IP forwarding
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

// Specific route for /block to show blocked IP
app.get('/block', (req, res) => {
  const ip = req.ip;
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blocked - ilikepancakes.ink</title>
    <meta name="description" content="Access has been blocked">

    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16">

    <!-- Theme color -->
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

// Función para crear endpoints dinámicos para todos los archivos
function createFileEndpoints(directory, basePath = '') {
    const items = fs.readdirSync(directory);

    items.forEach(item => {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Crear endpoint para directorio (parcial - solo archivos en subdirectorios)
            const subBasePath = basePath + '/' + item;
            createFileEndpoints(fullPath, subBasePath);
        } else {
            // Crear endpoint GET para cada archivo, ocultando la extensión
            const extensionIndex = item.lastIndexOf('.');
            const nameWithoutExt = extensionIndex > 0 ? item.slice(0, extensionIndex) : item;
            const endpointPath = basePath + '/' + nameWithoutExt;
            app.get(endpointPath, (req, res) => {
                console.log(`Serving endpoint: ${endpointPath} (${item})`);
                res.sendFile(fullPath);
            });
        }
    });
}

// Crear endpoints para todos los archivos en el directorio raíz
createFileEndpoints(__dirname);

// Ruta raíz que sirve index.html
app.get('/', (req, res) => {
    console.log('Serving root endpoint: /');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Middleware para manejo de errores 404
app.use((req, res) => {
    console.log(`404 - File not found: ${req.url}`);
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Welcome to ilikepancakes.ink running on port ${PORT}! >_<`);
    console.log('to make my life a little easier i made it so it just auto maps and serves all files in the working directory');
    console.log(`remember A squared + B squared = C squared `);
});
