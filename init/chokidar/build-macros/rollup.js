const rollup = require('rollup')
const scss = require('rollup-plugin-scss')
const svelte = require('rollup-plugin-svelte')
const preprocess = require('svelte-preprocess')
const commonjs = require('@rollup/plugin-commonjs')
const {nodeResolve:resolve} = require('@rollup/plugin-node-resolve')
const { path: {app}, fn: {logmsg} } = global.mitm

function bundleRollup(bpath, opath) {
  // see below for details on the options
  const output = opath.replace(/\.js$/,'.css')
  const inputOptions = {
    input: bpath,
    plugins: [
      svelte({
        // include: `${app}/svelte/index.js`,
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
        dynamicRequireTargets: [`${app}/svelte/*.svelte`]
      })
    ]
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
    logmsg(bundle.watchFiles); // an array of file names this bundle depends on
    const { output } = await bundle.generate(outputOptions);

    for (const chunkOrAsset of output) {
      if (chunkOrAsset.type === 'asset') {
        logmsg('Asset', chunkOrAsset);
      } else {
        logmsg('Chunk', chunkOrAsset.modules);
      }
    }
    await bundle.write(outputOptions);
    await bundle.close();
  }
  build();
}
module.exports = bundleRollup