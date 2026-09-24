# jcc-tui

金铲铲（云顶之弈）终端棋盘练习工具：Ink + TypeScript。

- 交错矩形棋盘（4×7）放置弈子
- 按费用选棋、实时统计激活羁绊
- 牌库份数可配置，自动汇总各费用总量
- 首次启动可从 [金铲铲大数据](https://jcc.datatft.com/database#unit) 自动爬取弈子 / 羁绊

## 环境要求

- Node.js 18+
- 支持 ANSI 颜色的终端（推荐 Windows Terminal）
- 首次爬取需 Playwright Chromium

## 快速开始

```bash
cd jcc-tui
npm install
npx playwright install chromium   # 仅首次爬取需要
npm start
```

若本地已有 `data/units.json`、`data/traits.json`，启动不会重复爬取。

## 操作说明

| 按键 | 作用 |
|------|------|
| ← ↑ → ↓ | 移动棋盘焦点 |
| Tab | 循环格子 |
| 空格 | 打开选棋（按 1–5 费分 Tab） |
| s | 牌库设置 |
| q / Esc | 退出（弹窗内 Esc 为关闭） |

### 选棋弹窗

| 按键 | 作用 |
|------|------|
| ← → | 切换费用 Tab |
| ↑ ↓ | 选择棋子 |
| Enter | 写入当前格子 |
| Esc | 关闭 |

### 牌库设置（s）

配置 1–5 费「每种棋子」的份数（默认约 30 / 25 / 18 / 10 / 9）。

| 显示项 | 含义 |
|--------|------|
| 种类 | 该费用有多少种棋子（来自 units 数据） |
| 每张份数 | 你配置的每种棋子张数 |
| 档位总量 | 种类 × 每张份数 |
| 牌库总计 | 五个费用档位总量之和 |

设置保存到 `data/pool-config.json`。

## 数据与爬取

数据来源（[jcc.datatft.com](https://jcc.datatft.com/database#unit)）：

| 数据 | 页面 | 本地文件 |
|------|------|----------|
| 弈子 | `#unit` | `data/units.json` |
| 羁绊 | `#trait` | `data/traits.json` |

手动刷新：

```bash
npm run scrape:units
npm run scrape:traits
```

## 字体（可选）

项目内字体：`MapleMono-NF-CN-Regular.ttf`  
启动时会尝试注册到当前用户字体。**程序无法强制更改终端字体**，请在 Windows Terminal 中将字体设为 `Maple Mono NF CN`（可参考 `windows-terminal-font.json`），然后新开标签再运行。

## 目录结构

```
jcc-tui/
├── src/
│   ├── App.tsx              # 主界面
│   ├── Bootstrap.tsx        # 启动：字体 / 本地数据
│   ├── BrickMap.tsx         # 棋盘渲染
│   ├── UnitPicker.tsx       # 选棋弹窗
│   ├── ActiveTraitsPanel.tsx# 右侧羁绊
│   ├── PoolSettings.tsx     # 牌库设置
│   ├── pool/                # 牌库配置与计算
│   ├── units/               # 弈子爬取与缓存
│   └── traits/              # 羁绊爬取与缓存
├── scripts/                 # 手动爬取入口
├── data/                    # 本地 JSON 数据
└── package.json
```

## 脚本

| 命令 | 说明 |
|------|------|
| `npm start` | 启动 TUI |
| `npm run typecheck` | TypeScript 检查 |
| `npm run scrape:units` | 爬取弈子 |
| `npm run scrape:traits` | 爬取羁绊 |

## 许可

仅供个人学习与练习使用；游戏数据版权归原作者及 [金铲铲大数据](https://jcc.datatft.com/) 相关方所有。
