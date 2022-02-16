const path       = require('path')
const rollup     = require('rollup')
const preprocess = require('svelte-preprocess')
const scss       = require('rollup-plugin-scss')
const svelte     = require('rollup-plugin-svelte')
const alias      = require('@rollup/plugin-alias')
const commonjs   = require('@rollup/plugin-commonjs')
const {nodeResolve:resolve} = require('@rollup/plugin-node-resolve')
const { path: {app} } = global.mitm

async function bundleRollup(bpath, opath) {
  // see below for details on the options
  const output = opath.replace(/\.js$/,'.css')
  const inputOptions = {
    input: bpath,
    plugins: [
      alias({
        entries: {
          svelte: path.join(__dirname, '../../../node_modules/svelte')
        }
      }),
      svelte({
        // include: `${app}/_svelte_/index.js`,
        compilerOptions: {dev: true},
        preprocess:  preprocess()
      }),
      scss({output}),
      resolve({
        browser: true,
        dedupe: ['svelte'],
        preferBuiltins: false
      }),
      commonjs({
        dynamicRequireTargets: [`${app}/_svelte_/*.svelte`]
      })
    ],
    onwarn: function ( message, warn ) {
      if (/external dependency/.test( message )) return;
      if (message.code==='CIRCULAR_DEPENDENCY')  return;
      console.error( message );
    }
  };
  const outputOptions = {
    sourcemap: 'inline',
    format: 'iife',
    file: opath,
    name: 'app'
  };

  async function build() {
    // create a bundle
    const bundle = await rollup.rollup(inputOptions);
    await bundle.generate(outputOptions);
    await bundle.write(outputOptions);
    await bundle.close();
  }
  await build();
}
module.exports = bundleRollup