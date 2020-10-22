import { nodeResolve } from '@rollup/plugin-node-resolve'
import sourcemaps from 'rollup-plugin-sourcemaps'
import cjs from 'rollup-plugin-cjs-es'
const rewrite = require('./rewrite')

export default {
  input: 'ws-client/_src/index.js',
  output: {
    file: 'ws-client/index.js',
    sourcemap: 'inline',
    format: 'cjs'
  },
  plugins: [
    nodeResolve(),
    sourcemaps(),
    cjs({ nested: true }),
    rewrite()
  ]
}
