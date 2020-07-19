import { writable } from 'svelte/store';

export const logstore = writable({
  respHeader: {},
  headers: '',
  content: '',
  source: '',
  logid: '',
  title: '',
  path: '',
  url: '',
  ext: '',
});
