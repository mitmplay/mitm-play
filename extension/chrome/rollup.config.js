import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import preprocess from 'svelte-preprocess';

export default {
	input: 'src/main.js',
	output: {
		file: 'js/bundle.js',
		sourcemap: 'inline',
		format: 'iife',
		name: 'app',
	},
	plugins: [
		svelte({
			dev: true,
			preprocess: [preprocess()],
			css: css => {
				css.write('css/bundle.css');
			},
		}),
		resolve(),
		commonjs(),
		livereload('.'),
  ],
  watch: {
    chokidar: {
      usePolling: true
    }
  },
};
