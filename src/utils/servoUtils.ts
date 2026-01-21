export const SERVO_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#FFA07A", // Light Salmon
  "#98D8C8", // Mint
  "#F7DC6F", // Yellow
  "#BB8FCE", // Purple
  "#85C1E2", // Sky Blue
  "#F8B739", // Orange
  "#52BE80", // Green
  "#EC7063", // Coral
  "#5DADE2", // Light Blue
  "#F1948A", // Pink
  "#7FB3D3", // Powder Blue
  "#F5B041", // Amber
  "#58D68D", // Emerald
];

export function getServoLetter(index: number): string {
  return String.fromCharCode(65 + index); // A, B, C, ...
}

export function getServoIndexFromLetter(letter: string): number {
  const upperLetter = letter.toUpperCase();
  if (upperLetter.length !== 1 || upperLetter < "A" || upperLetter > "Z") {
    return 0;
  }
  return upperLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, ...
}

export function getServoColor(index: number, configColor?: string): string {
  if (configColor) {
    return configColor;
  }
  return SERVO_COLORS[index % SERVO_COLORS.length];
}

export function getServoOptions(maxServos: number): Array<[string, string]> {
  const options: Array<[string, string]> = [];
  for (let i = 0; i < maxServos; i++) {
    const letter = getServoLetter(i);
    options.push([letter, letter]);
  }
  return options;
}
