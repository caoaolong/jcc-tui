/**
 * CLI：手动爬取羁绊数据
 * npm run scrape:traits
 */
import { scrapeTraitsAndSave } from "../src/traits/scrape.js";

scrapeTraitsAndSave((msg) => console.log(msg)).catch((err) => {
  console.error("爬取失败:", err);
  process.exit(1);
});
