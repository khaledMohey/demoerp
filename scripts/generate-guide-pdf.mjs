import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "..", "docs", "guide.html");
const outDir = path.join(__dirname, "..", "public", "guides");
const outPath = path.join(outDir, "دليل-استخدام-DemoERP.pdf");

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0", timeout: 60000 });
await page.pdf({
  path: outPath,
  format: "A4",
  printBackground: true,
  margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
});
await browser.close();

console.log("PDF created:", outPath);
