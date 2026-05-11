import { mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const distDir = 'dist'
const indexPath = join(distDir, 'index.html')

// GitHub Pages returns HTTP 404 for browser-history routes unless a real file
// exists at that path. Keep public/SEO landing routes directly fetchable so
// they can be shared in public posts, crawled, and checked by link preview bots.
const publicRoutes = [
  'ai-os-setup',
  'services',
  'services/ai-os-setup',
  'ai-os-human-flourishing',
  'path-feed-momentum',
  'path-feed-examples',
  'path-feed-return-loop',
  'connectome-builders',
]

if (!existsSync(indexPath)) {
  throw new Error(`Missing ${indexPath}; run this script after vite build`)
}

for (const route of publicRoutes) {
  const routeDir = join(distDir, route)
  mkdirSync(routeDir, { recursive: true })
  copyFileSync(indexPath, join(routeDir, 'index.html'))
}

console.log(`Created GitHub Pages route fallbacks for ${publicRoutes.length} public routes.`)
