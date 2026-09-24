import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** 项目内字体文件 */
export const FONT_FILE = join(ROOT, "MapleMono-NF-CN-Regular.ttf");

/** 安装后常见的字体族名（Maple Mono NF CN） */
export const FONT_FAMILY = "Maple Mono NF CN";

/**
 * 尝试将项目字体注册到当前用户字体目录（Windows）。
 * 终端是否立即生效取决于终端是否已将该字体设为默认；Ink 无法直接改渲染字体。
 */
export function ensureProjectFont(): { ok: boolean; message: string } {
  if (!existsSync(FONT_FILE)) {
    return { ok: false, message: `未找到字体文件：${FONT_FILE}` };
  }

  if (process.platform !== "win32") {
    return {
      ok: true,
      message: `请将终端字体设为「${FONT_FAMILY}」（字体文件：${FONT_FILE}）`,
    };
  }

  try {
    const userFonts = join(process.env.LOCALAPPDATA ?? "", "Microsoft", "Windows", "Fonts");
    mkdirSync(userFonts, { recursive: true });
    const dest = join(userFonts, "MapleMono-NF-CN-Regular.ttf");
    if (!existsSync(dest)) {
      copyFileSync(FONT_FILE, dest);
    }

    // 写入用户字体注册表（若已存在则覆盖路径）
    const ps = `
$fontPath = '${dest.replace(/'/g, "''")}'
$regPath = 'HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Fonts'
New-Item -Path $regPath -Force | Out-Null
New-ItemProperty -Path $regPath -Name 'Maple Mono NF CN Regular (TrueType)' -Value $fontPath -PropertyType String -Force | Out-Null
`;
    execFileSync(
      "powershell.exe",
      ["-NoProfile", "-Command", ps],
      { stdio: "ignore", windowsHide: true },
    );

    return {
      ok: true,
      message: `已注册字体「${FONT_FAMILY}」。请在 Windows Terminal 设置中将字体设为该字体后重启终端。`,
    };
  } catch (err) {
    return {
      ok: false,
      message: `字体注册失败：${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
