import nodeResolve from 'rollup-plugin-node-resolve'
import sourcemaps from 'rollup-plugin-sourcemaps';
import commonjs from 'rollup-plugin-commonjs'
const rewrite = require('./rewrite');

export default {
  input: 'socketclnt/src/index.js',
  output: {
      file: 'socketclnt/index.js',
      sourcemap: 'inline',
      format: 'cjs'
  },
  plugins: [
    nodeResolve(), 
    sourcemaps(),
    commonjs(),
    rewrite(),
  ]
};
