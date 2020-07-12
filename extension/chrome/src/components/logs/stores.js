import { writable } from 'svelte/store';

export const source = writable({
  headers: '',
  content: '',
  element: '',
  title: '',
  path: '',
  url: '',
});
