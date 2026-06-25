import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Build flat files (dist/invite.html, dist/404.html …) so Rust's read_public() finds them,
// and keep </head> + <title> literal so Rust's OG string-injection still works.
export default defineConfig({
  build: { format: 'file', inlineStylesheets: 'never' },
  compressHTML: false,
  server: { port: 4321 },
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/api': 'http://localhost:3000',
        '/thiep': 'http://localhost:3000',
        '/quanly': 'http://localhost:3000',
        '/uploads': 'http://localhost:3000',
      },
    },
  },
});
