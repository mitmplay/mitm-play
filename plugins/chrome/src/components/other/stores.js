import { writable } from 'svelte/store';

export const client = writable({
  ...window.mitm.client,
});
