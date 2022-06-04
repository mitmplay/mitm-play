const commonjs = require('@rollup/plugin-commonjs')
const {nodeResolve:resolve} = require('@rollup/plugin-node-resolve')

export default {
  input: 'a11y/_a11y/axe-run.js',
  plugins: [
    resolve({
			browser: true,
			dedupe: [],
      preferBuiltins: false
		}),
    commonjs(),
  ],
  output: {
    file: 'a11y/axe-run.js',
    sourcemap: 'inline',
    format: 'iife',
    name: 'a11y'
  },
  watch: {
    chokidar: {
      usePolling: true
    }
  }
}
