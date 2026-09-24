/** 终端显示宽度：CJK / 全角按 2，其余按 1 */
export function charDisplayWidth(ch: string): number {
  const code = ch.codePointAt(0) ?? 0;
  if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) return 0;
  // 粗略：非 ASCII 宽字符按 2（覆盖常用中日韩）
  if (code > 0xff) return 2;
  return 1;
}

export function displayWidth(text: string): number {
  let w = 0;
  for (const ch of text) w += charDisplayWidth(ch);
  return w;
}

/** 按显示宽度截断（不截断半个宽字符） */
export function truncateToDisplayWidth(text: string, maxWidth: number): string {
  let w = 0;
  let out = "";
  for (const ch of text) {
    const cw = charDisplayWidth(ch);
    if (w + cw > maxWidth) break;
    out += ch;
    w += cw;
  }
  return out;
}
