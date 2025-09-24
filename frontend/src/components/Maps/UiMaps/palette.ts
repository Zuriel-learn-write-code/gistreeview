// Palette of colors (Tailwind-inspired) used for road coloring
// Pick some distinct colors across different hues for good contrast
// 10-color palette (Tailwind-inspired) for a clean 2x5 grid
const PALETTE = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#eab308', // yellow-500
  '#10b981', // emerald-500
  '#06b6d4', // cyan-400
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
];

// Export a mapping that mirrors the backend RoadColor enum labels (palette_01..palette_10)
// This allows the frontend to map enum values to hex colors easily.
export const PALETTE_ENUM: Record<string, string> = PALETTE.reduce((acc, hex, idx) => {
  const key = `palette_${String(idx + 1).padStart(2, '0')}`;
  acc[key] = hex;
  return acc;
}, {} as Record<string, string>);

export default PALETTE;

// Named exports for individual palette entries: palette_01 .. palette_10
export const palette_01 = PALETTE[0];
export const palette_02 = PALETTE[1];
export const palette_03 = PALETTE[2];
export const palette_04 = PALETTE[3];
export const palette_05 = PALETTE[4];
export const palette_06 = PALETTE[5];
export const palette_07 = PALETTE[6];
export const palette_08 = PALETTE[7];
export const palette_09 = PALETTE[8];
export const palette_10 = PALETTE[9];

