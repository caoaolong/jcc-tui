/**
 * 爬取金铲铲大数据羁绊
 * 来源：https://jcc.datatft.com/database#trait
 *
 * - 名称：.trait-popup-item → .trait-title
 * - 总体效果：.trait-introduce
 * - 激活档：.trait-level → .trait-level-num + .trait-level-desc
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, type Page } from "playwright";
import { DATA_DIR, TRAITS_FILE, TRAITS_URL } from "./paths.js";
import type { TraitInfo, TraitsFile } from "./types.js";

export type ScrapeProgress = (message: string) => void;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function preparePage(page: Page): Promise<void> {
  await page.goto(TRAITS_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await sleep(1500);

  await page.evaluate(() => {
    location.hash = "trait";
  });

  // 点击「羁绊」页签，确保面板激活
  await page.evaluate(() => {
    const plain = [...document.querySelectorAll("*")].find((el) => {
      const t = (el as HTMLElement).innerText?.trim();
      return t === "羁绊" && (el as HTMLElement).children.length === 0;
    }) as HTMLElement | undefined;
    if (plain) {
      plain.click();
      return;
    }
    const elTab = [...document.querySelectorAll(".el-tabs__item")].find(
      (el) => (el as HTMLElement).innerText.trim() === "羁绊",
    ) as HTMLElement | undefined;
    elTab?.click();
  });

  await sleep(1200);
  await page.waitForFunction(
    () => document.querySelectorAll(".trait-popup-item .trait-title").length > 0,
    { timeout: 45_000 },
  );
  await sleep(500);
}

async function scrapeTraits(page: Page, onProgress?: ScrapeProgress): Promise<TraitInfo[]> {
  onProgress?.("正在解析羁绊卡片…");

  // 使用字符串脚本，避免 tsx 给 evaluate 回调注入 __name 导致浏览器报错
  const raw = (await page.evaluate(`(() => {
    const iconLabel = (src) => {
      const s = String(src || "").toLowerCase();
      if (s.includes("/ad.png") || s.includes("attackdamage") || s.includes("_ad")) return "[物理加成]";
      if (s.includes("/ap.png") || s.includes("abilitypower") || s.includes("_ap")) return "[法术加成]";
      if (s.includes("armor")) return "[护甲]";
      if (s.includes("mr") || s.includes("magicresist")) return "[魔抗]";
      if (s.includes("hp") || s.includes("health")) return "[生命值]";
      if (s.includes("as") || s.includes("attackspeed")) return "[攻速]";
      if (s.includes("mana")) return "[法力]";
      if (s.includes("crit")) return "[暴击]";
      if (s.includes("range")) return "[攻击距离]";
      return "";
    };

    const richText = (root) => {
      if (!root) return "";
      let out = "";
      const walk = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          out += node.textContent || "";
          return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node;
        if (el.tagName === "BR") {
          out += "\\n";
          return;
        }
        if (el.tagName === "IMG") {
          out += iconLabel(el.getAttribute("src") || "");
          return;
        }
        for (const child of el.childNodes) walk(child);
      };
      walk(root);
      return out.replace(/\\u00a0/g, " ").replace(/[ \\t]+\\n/g, "\\n").replace(/\\n{3,}/g, "\\n\\n").trim();
    };

    return Array.from(document.querySelectorAll(".trait-popup-item")).map((el) => {
      const name = (el.querySelector(".trait-title") && el.querySelector(".trait-title").textContent || "").trim();
      const effect = richText(el.querySelector(".trait-introduce"));
      const levels = Array.from(el.querySelectorAll(".trait-level"))
        .map((lv) => {
          const count = parseInt(
            (lv.querySelector(".trait-level-num") && lv.querySelector(".trait-level-num").textContent || "").trim(),
            10,
          );
          const levelEffect = richText(lv.querySelector(".trait-level-desc"));
          return { count, effect: levelEffect };
        })
        .filter((lv) => Number.isFinite(lv.count) && lv.count > 0);
      return { name, effect, levels };
    });
  })()`)) as Array<{ name: string; effect: string; levels: Array<{ count: number; effect: string }> }>;

  const seen = new Set<string>();
  const traits: TraitInfo[] = [];
  for (const t of raw) {
    if (!t.name || seen.has(t.name)) continue;
    seen.add(t.name);
    traits.push(t);
  }

  traits.sort((a, b) => a.name.localeCompare(b.name, "zh"));
  onProgress?.(`解析完成：${raw.length} 张卡片，去重后 ${traits.length} 个羁绊`);
  for (const t of traits) {
    const lv = t.levels.map((l) => `${l.count}`).join("/");
    onProgress?.(`  ${t.name} [${lv || "无档位"}]`);
  }
  return traits;
}

export function saveTraitsFile(traits: TraitInfo[]): TraitsFile {
  mkdirSync(DATA_DIR, { recursive: true });
  const scrapedAt = new Date().toISOString();
  const payload: TraitsFile = {
    source: TRAITS_URL,
    scrapedAt,
    count: traits.length,
    traits,
  };
  writeFileSync(TRAITS_FILE, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

export async function scrapeTraitsAndSave(onProgress?: ScrapeProgress): Promise<TraitsFile> {
  onProgress?.(`正在打开 ${TRAITS_URL} …`);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      locale: "zh-CN",
    });
    await preparePage(page);
    const traits = await scrapeTraits(page, onProgress);
    const file = saveTraitsFile(traits);
    onProgress?.(`已写入 ${TRAITS_FILE}（${traits.length} 个羁绊）`);
    return file;
  } finally {
    await browser.close();
  }
}
