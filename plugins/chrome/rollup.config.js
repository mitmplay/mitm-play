// https://github.com/sveltejs/template/blob/master/rollup.config.js

import scss from 'rollup-plugin-scss'
import svelte from 'rollup-plugin-svelte'
import preprocess from 'svelte-preprocess'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'

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
			compilerOptions: {dev: true},
      preprocess:  preprocess()
    }),
    scss({ output: 'bundle.css' }),   
		resolve({
			browser: true,
			dedupe: ['svelte'],
      preferBuiltins: false
		}),
    commonjs(),
  ],
  watch: {
    chokidar: {
      usePolling: true
    }
  }
}
