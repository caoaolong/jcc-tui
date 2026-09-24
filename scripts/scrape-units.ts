/**
 * CLI：手动爬取棋子数据
 * npm run scrape:units
 */
import { scrapeAndSave } from "../src/units/scrape.js";

scrapeAndSave((msg) => console.log(msg)).catch((err) => {
  console.error("爬取失败:", err);
  process.exit(1);
});
