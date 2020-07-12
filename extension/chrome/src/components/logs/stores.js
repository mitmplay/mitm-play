import { writable } from 'svelte/store';

export const source = writable({
  headers: '',
  content: '',
  logid: '',
  title: '',
  path: '',
  url: '',
});
