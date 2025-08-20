import { escapeSvelte, mdsvex, type code_highlighter } from 'mdsvex';
import { join } from 'path';
import { createHighlighter } from 'shiki';
import type { PreprocessorGroup } from 'svelte/compiler';

const shikiHighlighter = await createHighlighter({
  themes: ['light-plus', 'dark-plus'],
  langs: ['bash', 'json']
});

const highlighter: typeof code_highlighter = async (code, lang) => {
  await shikiHighlighter.loadLanguage('bash', 'json');
  const html = escapeSvelte(
    shikiHighlighter.codeToHtml(code, {
      lang: lang ?? 'text',
      themes: {
        light: 'light-plus',
        dark: 'dark-plus'
      },
      colorReplacements: {
        'light-plus': {
          '#ffffff': 'var(--color-surface-50)'
        },
        'dark-plus': {
          '#1e1e1e': 'var(--color-surface-900)'
        }
      }
    })
  );
  return `{@html \`${html}\` }`;
};

const mdsvexPreprocessor = mdsvex({
  extensions: ['.md'],
  // IDK if this is the best way to import this, but it works in dev 😅
  layout: join(import.meta.dirname, './layouts/DefaultLayout.svelte'),
  highlight: { highlighter }
});

const mdPreprocessorGroup: PreprocessorGroup = {
  name: 'mdsvex',
  markup({ content, filename }) {
    if (!filename) return { code: content };

    if (filename.endsWith('.md')) {
      return mdsvexPreprocessor.markup({ content, filename });
    }

    return { code: content };
  }
};

export default mdPreprocessorGroup;
