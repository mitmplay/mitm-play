// https://github.com/sveltejs/template/blob/master/rollup.config.js

import svelte from 'rollup-plugin-svelte'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import preprocess from 'svelte-preprocess'
import css from 'rollup-plugin-css-only'

export default {
  input: 'src/main.js',
  output: {
    file: 'js/bundle.js',
    sourcemap: 'inline',
    format: 'iife',
    name: 'app'
  },
  plugins: [
		svelte({
			compilerOptions: {
        dev: true,
      },
      preprocess:  preprocess()
    }),
    css({ output: 'css/bundle.css' }),   
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
    commonjs(),
  ],
  watch: {
    chokidar: {
      usePolling: true
    }
  }
}
