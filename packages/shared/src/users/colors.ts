export function hslToHex(h: number, s: number, l: number): string {
  const lNorm = l / 100;
  const a = (s * Math.min(lNorm, 1 - lNorm)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generateUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return hslToHex(hue, 70, 55);
}

