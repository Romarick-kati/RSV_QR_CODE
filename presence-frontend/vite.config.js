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
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/') || id.includes('react-router')) return 'vendor-react';
          if (id.includes('framer-motion')) return 'vendor-motion';
          // recharts is deliberately NOT forced into a manual chunk here.
          // recharts v3's own dependency tree (react-redux, @reduxjs/toolkit,
          // immer, victory-vendor's d3) is massive (~400KB) and is only ever
          // imported by the two admin analytics pages, both already behind
          // lazyWithRetry(() => import(...)). Giving recharts its own named
          // vendor chunk previously forced the bundler to eagerly
          // modulepreload all ~400KB of it on every single page load,
          // including the public landing page — exactly backwards from the
          // intent. Leaving it unassigned lets the bundler fold it into the
          // two lazy page chunks that actually need it, so it is only ever
          // fetched by someone who opens an admin analytics page.
        },
      },
    },
  },
})
