/**
 * 解析「出售备战席」快捷键 → 0-based 栏位下标。
 * 支持：Ctrl/Alt + 1–9，以及终端 modifyOtherKeys / CSI u 发出的 Ctrl+数字序列。
 */
export function parseBenchSellIndex(
  input: string,
  key: { ctrl: boolean; meta: boolean },
): number | null {
  if ((key.ctrl || key.meta) && input.length === 1 && input >= "1" && input <= "9") {
    return Number(input) - 1;
  }

  // xterm modifyOtherKeys：ESC [ 27 ; modifier ; code ~  （Ink 剥掉 ESC 后剩 [27;…~）
  const m27 = /^\[27;(\d+);(\d+)~$/.exec(input);
  if (m27) {
    const modifier = Number(m27[1]);
    const code = Number(m27[2]);
    // modifier: 1=无, 5=Ctrl, 3=Alt, 7=Ctrl+Alt …
    if (hasCtrlOrAlt(modifier) && code >= 49 && code <= 57) {
      return code - 49;
    }
  }

  // Kitty CSI u：ESC [ code ; modifier u
  const mu = /^\[(\d+);(\d+)u$/.exec(input);
  if (mu) {
    const code = Number(mu[1]);
    const modifier = Number(mu[2]);
    if (hasCtrlOrAlt(modifier) && code >= 49 && code <= 57) {
      return code - 49;
    }
  }

  return null;
}

function hasCtrlOrAlt(modifier: number): boolean {
  // CSI 修饰位：值 = 1 + flags；bit2(4)=Ctrl，bit3(8)=Alt（部分终端用 Meta）
  const flags = modifier - 1;
  return (flags & 4) !== 0 || (flags & 8) !== 0 || (flags & 2) !== 0;
}
