import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Without this, Vite's default chunking scatters shared library
        // code (React, React Router, Framer Motion, Recharts) across many
        // small per-route chunks somewhat arbitrarily — which is how a
        // component as small as BrandMark.jsx (just an SVG) ended up
        // inside a 258KB chunk: it wasn't BrandMark that was heavy, it was
        // sharing a chunk with misc library code that had nowhere better
        // to go. Splitting these into their own named vendor chunks means:
        // (1) that shared code is fetched once and cached by the browser
        // across every page instead of being duplicated into multiple
        // route chunks, and (2) vendor code (which rarely changes) stays
        // cached across deploys even when only app code changes.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (id.includes('react-router') || id.includes('/react/') || id.includes('/react-dom/')) return 'vendor-react';
        },
      },
    },
  },
})
