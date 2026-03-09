/**
 * Serves the Mix Bitch build and proxies /api/ollama to localhost Ollama.
 * Run after `npm run build`. Ollama can run with the desktop app (localhost only).
 */
const path = require('path')
const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')

const PORT = Number(process.env.PORT) || 1233
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const distDir = path.join(__dirname, 'dist')

const app = express()

// Proxy Ollama: /api/ollama/* -> http://localhost:11434/*
// Strip Origin/Referer so Ollama doesn't 403 (desktop app can stay on default origins)
app.use(
  '/api/ollama',
  createProxyMiddleware({
    target: OLLAMA_URL,
    pathRewrite: { '^/api/ollama': '' },
    changeOrigin: true,
    ws: false,
    onProxyReq: (proxyReq) => {
      proxyReq.removeHeader('origin')
      proxyReq.removeHeader('referer')
    },
  })
)

// Static build
app.use(express.static(distDir))

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mix Bitch server on http://0.0.0.0:${PORT} (Ollama proxy at /api/ollama)`)
})
