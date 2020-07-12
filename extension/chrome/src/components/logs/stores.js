import { writable } from 'svelte/store';

export const source = writable({
  content: '',
  meta: '',
  element: '',
  title: '',
  path: '',
  url: '',
});
