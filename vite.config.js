import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { routeMiddleware } from './src/preprocessors/middleware/index.ts';

export default defineConfig({
  plugins: [tailwindcss(), routeMiddleware(), sveltekit()]
});
