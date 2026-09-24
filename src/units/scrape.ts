/**
 * 爬取金铲铲大数据棋子：名称 + 费用 + 羁绊
 * 来源：https://jcc.datatft.com/database#unit
 *
 * 卡片已展开，无需悬停：
 * - 名称：div.hero-cover-item → .hero-name
 * - 费用：div.hero-cover-item → .hero-price
 * - 羁绊：div.hero-cover-item → .hero-trait-name
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, type Page } from "playwright";
import { DATA_DIR, UNITS_FILE, UNITS_NAMES_FILE, UNITS_URL } from "./paths.js";
import type { UnitInfo, UnitsFile } from "./types.js";

export type ScrapeProgress = (message: string) => void;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function preparePage(page: Page): Promise<void> {
  await page.goto(UNITS_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("div.hero-cover-item", { timeout: 45_000 });
  await sleep(1200);

  // 确保 hash 切到弈子页签
  await page.evaluate(() => {
    if (!location.hash.includes("unit")) {
      location.hash = "unit";
    }
  });
  await sleep(800);
  await page.waitForSelector("div.hero-cover-item .hero-name", { timeout: 30_000 });
}

async function scrapeUnits(page: Page, onProgress?: ScrapeProgress): Promise<UnitInfo[]> {
  onProgress?.("正在解析页面上的棋子卡片…");

  const raw = await page.$$eval("div.hero-cover-item", (els) =>
    els.map((el) => {
      const name = el.querySelector(".hero-name")?.textContent?.trim() ?? "";
      const priceRaw = el.querySelector(".hero-price")?.textContent?.trim() ?? "";
      const priceNum = Number.parseInt(priceRaw, 10);
      const price = Number.isFinite(priceNum) ? priceNum : null;
      const traits = [
        ...new Set(
          [...el.querySelectorAll(".hero-trait-name")]
            .map((t) => t.textContent?.trim() ?? "")
            .filter((t) => t.length > 0),
        ),
      ];
      return { name, price, traits };
    }),
  );

  const seen = new Set<string>();
  const units: UnitInfo[] = [];
  for (const item of raw) {
    if (!item.name || seen.has(item.name)) continue;
    seen.add(item.name);
    units.push(item);
  }

  units.sort((a, b) => {
    const pa = a.price ?? 99;
    const pb = b.price ?? 99;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name, "zh");
  });

  onProgress?.(`解析完成：${raw.length} 张卡片，去重后 ${units.length} 个棋子`);
  for (const u of units) {
    const priceLabel = u.price === null ? "?" : String(u.price);
    onProgress?.(
      `  ${u.name} 费${priceLabel} → ${u.traits.length ? u.traits.join(" / ") : "(无羁绊)"}`,
    );
  }

  return units;
}

export function saveUnitsFile(units: UnitInfo[]): UnitsFile {
  mkdirSync(DATA_DIR, { recursive: true });
  const scrapedAt = new Date().toISOString();
  const payload: UnitsFile = {
    source: UNITS_URL,
    scrapedAt,
    count: units.length,
    units,
  };
  writeFileSync(UNITS_FILE, JSON.stringify(payload, null, 2), "utf8");
  writeFileSync(
    UNITS_NAMES_FILE,
    JSON.stringify(
      {
        source: UNITS_URL,
        scrapedAt,
        count: units.length,
        names: units.map((u) => u.name),
      },
      null,
      2,
    ),
    "utf8",
  );
  return payload;
}

/** 打开页面并爬取全部棋子，写入 data/units.json */
export async function scrapeAndSave(onProgress?: ScrapeProgress): Promise<UnitsFile> {
  onProgress?.(`正在打开 ${UNITS_URL} …`);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      locale: "zh-CN",
    });
    await preparePage(page);
    const units = await scrapeUnits(page, onProgress);
    const file = saveUnitsFile(units);
    onProgress?.(`已写入 ${UNITS_FILE}（${units.length} 个棋子）`);
    return file;
  } finally {
    await browser.close();
  }
}
