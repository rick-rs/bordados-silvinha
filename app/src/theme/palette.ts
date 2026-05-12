export const palette = {
  illusion: '#f7b1c7',
  chantilly: '#f9c3d1',
  wewak: '#f0a3b5',
  froly: '#f57a9d',
  frenchRose: '#f2507d',
} as const;

export type PaletteColor = keyof typeof palette;
