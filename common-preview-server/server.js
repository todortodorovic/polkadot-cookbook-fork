#!/usr/bin/env node

import express from 'express';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import open from 'open';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure marked with syntax highlighting
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);

// Enable GitHub-flavored markdown features
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false
});

const app = express();
const PORT = process.env.PORT || 3000;

// Get tutorial directory from command line or current directory
const tutorialDir = process.argv[2] || process.cwd();
const tutorialName = path.basename(tutorialDir);

// Serve static assets
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(
  '/highlight',
  express.static(path.join(__dirname, 'node_modules/highlight.js/styles'))
);

// WebSocket-like server-sent events for live reload
const clients = new Set();

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  clients.add(res);

  req.on('close', () => {
    clients.delete(res);
  });
});

function notifyClients() {
  clients.forEach(client => {
    client.write('data: reload\n\n');
  });
}

// Watch for file changes
const readmePath = path.join(tutorialDir, 'README.md');
const watcher = chokidar.watch(readmePath, {
  ignoreInitial: true
});

watcher.on('change', () => {
  console.log('📝 README.md changed, reloading...');
  notifyClients();
});

// Main preview route
app.get('/', (req, res) => {
  try {
    // Read README.md
    if (!fs.existsSync(readmePath)) {
      return res.status(404).send(`
        <html>
          <head><title>Preview - ${tutorialName}</title></head>
          <body style="font-family: system-ui; padding: 2rem; max-width: 800px; margin: 0 auto;">
            <h1>❌ README.md not found</h1>
            <p>Expected file: <code>${readmePath}</code></p>
            <p>Make sure you're running this command from a tutorial directory.</p>
          </body>
        </html>
      `);
    }

    const markdown = fs.readFileSync(readmePath, 'utf8');
    const html = marked.parse(markdown);

    // Read tutorial.yml metadata if exists
    let metadata = {};
    const tutorialYmlPath = path.join(tutorialDir, 'tutorial.yml');
    if (fs.existsSync(tutorialYmlPath)) {
      const yamlContent = fs.readFileSync(tutorialYmlPath, 'utf8');
      // Simple YAML parsing for basic fields (avoid adding yaml dependency)
      metadata.name = yamlContent.match(/name:\s*(.+)/)?.[1] || tutorialName;
      metadata.category = yamlContent.match(/category:\s*(.+)/)?.[1] || 'Unknown';
      metadata.description = yamlContent.match(/description:\s*(.+)/)?.[1] || '';
    }

    // Send HTML response
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview: ${metadata.name || tutorialName}</title>
  <link rel="stylesheet" href="/highlight/github.css">
  <link rel="stylesheet" href="/public/styles.css">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #24292e;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
    }
    .header .meta {
      opacity: 0.9;
      font-size: 0.9rem;
    }
    .live-indicator {
      position: fixed;
      top: 1rem;
      right: 1rem;
      background: #28a745;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
    }
    .live-indicator::before {
      content: "●";
      margin-right: 0.5rem;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .container {
      max-width: 980px;
      margin: 0 auto;
      padding: 2rem;
    }
    .markdown-body {
      box-sizing: border-box;
      min-width: 200px;
    }
  </style>
</head>
<body>
  <div class="live-indicator">Live Preview</div>

  <div class="header">
    <h1>${metadata.name || tutorialName}</h1>
    <div class="meta">
      ${metadata.category ? `📁 ${metadata.category}` : ''}
      ${metadata.description ? `• ${metadata.description}` : ''}
    </div>
  </div>

  <div class="container">
    <article class="markdown-body">
      ${html}
    </article>
  </div>

  <script>
    // Live reload via Server-Sent Events
    const evtSource = new EventSource('/events');
    evtSource.onmessage = (event) => {
      if (event.data === 'reload') {
        console.log('🔄 Reloading...');
        location.reload();
      }
    };

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  </script>
</body>
</html>
    `);
  } catch (error) {
    res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body style="font-family: system-ui; padding: 2rem;">
          <h1>❌ Error rendering preview</h1>
          <pre style="background: #f6f8fa; padding: 1rem; border-radius: 6px;">${error.stack}</pre>
        </body>
      </html>
    `);
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`\n🚀 Tutorial Preview Server`);
  console.log(`📂 Tutorial: ${tutorialName}`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`👀 Watching: ${readmePath}`);
  console.log(`\n✨ Browser will open automatically...\n`);

  // Auto-open browser
  try {
    await open(`http://localhost:${PORT}`);
  } catch (err) {
    console.log(`⚠️  Could not open browser automatically. Please visit http://localhost:${PORT}`);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down preview server...');
  watcher.close();
  process.exit(0);
});
