const rollup = require('rollup')
const scss = require('rollup-plugin-scss')
const svelte = require('rollup-plugin-svelte')
const preprocess = require('svelte-preprocess')
const commonjs = require('@rollup/plugin-commonjs')
const {nodeResolve:resolve} = require('@rollup/plugin-node-resolve')

export default {
  input: 'ws-client/_src/ws-client.js',
  plugins: [
		svelte({
			compilerOptions: {dev: true},
      preprocess:  preprocess()
    }),
    scss({ output: 'ws-client/ws-client.css' }),   
		resolve({
			browser: true,
			dedupe: ['svelte'],
      preferBuiltins: false
		}),
    commonjs(),
  ],
  output: {
    file: 'ws-client/ws-client.js',
    sourcemap: 'inline',
    format: 'iife',
    name: 'app'
  },
  watch: {
    chokidar: {
      usePolling: true
    }
  }
}
