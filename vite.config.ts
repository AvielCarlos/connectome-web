import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/connectome-web/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor bundle
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Page-level chunks (lazy-loaded via React.lazy)
          'page-feed': ['./src/pages/FeedPage'],
          'page-goals': ['./src/pages/GoalsPage'],
          'page-journal': ['./src/pages/JournalPage'],
          'page-aura': ['./src/pages/AuraPage'],
          'page-dao': ['./src/pages/DAOPage'],
          'page-services': ['./src/pages/ServicesPage'],
          'page-profile': ['./src/pages/ProfilePage'],
          'page-ioo': ['./src/pages/IOOPage'],
          'page-home': ['./src/pages/HomePage'],
          'page-surface': ['./src/pages/SurfacePage'],
          'page-auth': ['./src/pages/AuthPage', './src/pages/AuthCallbackPage'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
