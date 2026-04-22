const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_HOST = process.env.HOST || '127.0.0.1';
const DEFAULT_PORT = Number(process.env.PORT) || 8080;
const MAX_PORT = DEFAULT_PORT + 20;

const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.normalize(path.join(__dirname, decodeURIComponent(filePath)));

    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 - Forbidden');
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.mp3': 'audio/mpeg',
        '.lrc': 'text/plain; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg'
    };

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>404 - File Not Found</h1>');
            return;
        }

        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain; charset=utf-8' });
        res.end(content);
    });
});

function getAccessibleUrls(port, host) {
    if (host !== '0.0.0.0' && host !== '::') {
        return [`http://${host}:${port}`];
    }

    const urls = new Set([`http://127.0.0.1:${port}`]);
    const interfaces = os.networkInterfaces();

    Object.values(interfaces).forEach((entries) => {
        (entries || []).forEach((entry) => {
            if (entry.family === 'IPv4' && !entry.internal) {
                urls.add(`http://${entry.address}:${port}`);
            }
        });
    });

    return Array.from(urls);
}

function listenOnPort(port, host = DEFAULT_HOST) {
    const handleError = (error) => {
        server.removeListener('listening', handleListening);

        if (error.code === 'EADDRINUSE' && port < MAX_PORT) {
            console.log(`Port ${port} is busy. Trying ${port + 1}...`);
            listenOnPort(port + 1, host);
            return;
        }

        console.error('Could not start local server.');
        console.error(error);
        process.exit(1);
    };

    const handleListening = () => {
        server.removeListener('error', handleError);
        const urls = getAccessibleUrls(port, host);
        console.log('Profile page is running at:');
        urls.forEach((url) => {
            console.log(`- ${url}`);
        });

        if (host === '0.0.0.0' || host === '::') {
            console.log('LAN sharing is enabled. Devices on the same network can use one of the IPv4 URLs above.');
        }

        console.log('Press Ctrl+C to stop the server.');
    };

    server.once('error', handleError);
    server.once('listening', handleListening);
    server.listen(port, host);
}

listenOnPort(DEFAULT_PORT, DEFAULT_HOST);
