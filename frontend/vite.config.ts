import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

const isElectronBuild = !!process.env.ELECTRON_BUILD

export default defineConfig({
  base: isElectronBuild ? './' : '/',
  plugins: [
    TanStackRouterVite({ routesDirectory: './src/routes', generatedRouteTree: './src/routeTree.gen.ts' }),
    react(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:34115', changeOrigin: true },
    },
  },
})
