import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  input: 'socketclnt/src/index.js',
  output: {
      file: 'socketclnt/index.js',
      format: 'cjs'
  },
  plugins: [
    nodeResolve(), 
    commonjs()
  ]
};