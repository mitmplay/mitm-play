export const cfg =  {
  language: 'javascript',
  // theme: "vs-dark",
  minimap: {
    enabled: false,
  },
  value: '',
  fontFamily: ['Cascadia Code', 'Consolas', 'Courier New', 'monospace'],
  fontLigatures: true,
  fontSize: 11
}

export const resize = editor => {
  return entries => {
    const {width, height} = entries[0].contentRect
    editor.layout({width, height})
  }  
}
