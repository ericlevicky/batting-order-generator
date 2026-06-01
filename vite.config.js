import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { createHash } from 'crypto'

// Plugin to inject a build version into sw.js so the browser detects changes
function swVersionPlugin() {
  return {
    name: 'sw-version',
    writeBundle(options) {
      const outDir = options.dir || 'dist'
      const swPath = resolve(outDir, 'sw.js')
      try {
        let swContent = readFileSync(swPath, 'utf-8')
        // Generate a unique version based on build timestamp + content hash of output
        const version = createHash('md5')
          .update(Date.now().toString())
          .digest('hex')
          .slice(0, 10)
        swContent = swContent.replace('__BUILD_VERSION__', version)
        writeFileSync(swPath, swContent)
      } catch (e) {
        console.warn('Could not inject SW version:', e.message)
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), swVersionPlugin()],
  base: './',
})
