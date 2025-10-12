const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

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
            // Crear endpoint GET para cada archivo
            const filePath = basePath + '/' + item;
            app.get(filePath, (req, res) => {
                console.log(`Serving endpoint: ${filePath}`);
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
    console.log('All files in directory are now accessible as endpoints:');
    console.log(`- /index.html`);
    console.log(`- /style.css`);
    console.log(`- /script.js`);
    console.log(`- /404.html`);
    console.log(`- And all other files in directories...`);
});
