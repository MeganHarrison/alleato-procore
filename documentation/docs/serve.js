import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8080;
const DOCS_DIR = __dirname; // documentation/docs

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown',
  '.mdx': 'text/markdown'
};

// SSE clients
const clients = [];

// Function to recursively scan a directory for markdown files
function scanDirectoryRecursive(dirPath, categoryPrefix = '') {
  const files = [];

  if (!fs.existsSync(dirPath)) {
    return files;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  entries.forEach(entry => {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(DOCS_DIR, fullPath);

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      const subDirName = entry.name.charAt(0).toUpperCase() + entry.name.slice(1);
      const newCategory = categoryPrefix ? `${categoryPrefix} / ${subDirName}` : subDirName;
      files.push(...scanDirectoryRecursive(fullPath, newCategory));
    } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
      // Add markdown files
      const name = entry.name
        .replace(/\.mdx?$/, '') // Remove .md or .mdx extension
        .replace(/-/g, ' ')     // Replace dashes with spaces
        .replace(/_/g, ' ');    // Replace underscores with spaces
      const category = categoryPrefix || 'General';

      files.push({
        name: name,
        path: `/${relativePath}`,
        category: category
      });
    }
  });

  return files;
}

// Function to get all markdown files from the docs directory
function getMarkdownFiles() {
  console.log(`Scanning documentation directory: ${DOCS_DIR}`);
  const files = scanDirectoryRecursive(DOCS_DIR);
  console.log(`Found ${files.length} markdown files`);
  return files;
}

const server = http.createServer((req, res) => {
  // Handle API endpoints
  if (req.url === '/api/files') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const files = getMarkdownFiles();
    res.end(JSON.stringify(files));
    return;
  }

  // Handle SSE events
  if (req.url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    clients.push(res);

    req.on('close', () => {
      const index = clients.indexOf(res);
      if (index !== -1) {
        clients.splice(index, 1);
      }
    });
    return;
  }

  // Serve static files
  let filePath;

  // Remove query string from URL
  const urlPath = req.url.split('?')[0];

  // Default to serving from DOCS_DIR
  if (urlPath === '/' || urlPath === '/index.html') {
    filePath = path.join(DOCS_DIR, 'viewer.html');
  } else {
    filePath = path.join(DOCS_DIR, urlPath);
  }

  console.log(`[Request] URL: ${req.url} -> FilePath: ${filePath}`);

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.warn(`[404] File not found: ${filePath}`);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        console.error(`[500] Error reading ${filePath}:`, error);
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      console.log(`[200] Served: ${filePath}`);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`┌─────────────────────────────────────────────┐`);
  console.log(`│  Alleato Documentation Server              │`);
  console.log(`├─────────────────────────────────────────────┤`);
  console.log(`│  URL: http://localhost:${PORT}/              │`);
  console.log(`│  Directory: ${DOCS_DIR.substring(DOCS_DIR.length - 25).padEnd(24)} │`);
  console.log(`└─────────────────────────────────────────────┘`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});
