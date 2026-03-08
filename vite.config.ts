import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: Number(process.env.PORT) || 3010,
      host: '127.0.0.1',
      strictPort: !process.env.PORT,
      open: false,
    },
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@mux/mux-player',
        '@mux/mux-video',
        '@google/generative-ai',
      ],
      force: false,
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          preview: path.resolve(__dirname, 'preview.html'),
          render: path.resolve(__dirname, 'render.html'),
        },
        output: {
          manualChunks(id) {
            // React core — always cached together
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor';
            }
            // Gemini AI — infrequently used, keep separate
            if (id.includes('node_modules/@google/generative-ai')) {
              return 'google-ai';
            }
            // Site generator — large, only needed for Publish modal
            if (id.includes('generator.ts') && !id.includes('.bak')) {
              return 'site-generator';
            }
            // Project data — keep separate from generator code for better cache granularity
            if (id.includes('projectDefaults.json')) {
              return 'project-data';
            }
          },
        },
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3015')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
