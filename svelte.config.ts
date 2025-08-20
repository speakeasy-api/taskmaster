import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import mdPreprocessorGroup from './src/lib/docs/preprocessor.ts';

/** @type {import('@sveltejs/kit').Config} */
const config: import('@sveltejs/kit').Config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors

  extensions: ['.svelte', '.md'],

  preprocess: [vitePreprocess(), mdPreprocessorGroup],

  compilerOptions: {
    experimental: { async: true }
  },

  kit: {
    typescript: {
      config(config) {
        return {
          ...config,
          include: [...config.include, '../*.config.ts']
        };
      }
    },
    csrf: {
      checkOrigin: false
    },
    // adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://svelte.dev/docs/kit/adapters for more information about adapters.
    adapter: adapter(),
    experimental: {
      remoteFunctions: true
    }
  }
};

export default config;
