export function applyAlphaToRgb(rgb: string, alpha: number): string {
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

  if (!match) {
    throw new Error("Invalid RGB color format");
  }

  const [, r, g, b] = match.map(Number);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
