import { escapeSvelte, mdsvex } from 'mdsvex';
import { join } from 'path';
import { codeToHtml } from 'shiki';

/** @type {import('shiki').BundledLanguage[]} */
const langs = ['bash', 'json'];

/** @type {typeof import('mdsvex').code_highlighter} */
const highlighter = async (code, lang) => {
  // @ts-expect-error - lang is string but shiki expects BundledLanguage
  if (!lang || !langs.includes(lang)) {
    lang = 'text';
  }

  const html = await codeToHtml(code, {
    lang: lang,
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
  });
  return `{@html \`${escapeSvelte(html)}\` }`;
};

const mdsvexPreprocessor = mdsvex({
  extensions: ['.md'],
  // IDK if this is the best way to import this, but it works in dev 😅
  layout: join(import.meta.dirname, './layouts/DefaultLayout.svelte'),
  highlight: { highlighter }
});

/** @type {import('svelte/compiler').PreprocessorGroup} */
const mdPreprocessorGroup = {
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
