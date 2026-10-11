const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/dell/.gemini/antigravity-ide/brain/e30f1c93-a54b-461c-b30c-52478452a88c';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1536,864']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1536, height: 864 });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => window.scrollTo(0, 100));
  await new Promise(r => setTimeout(r, 2000));

  // 1. Capture fixed headphones in Obsidian Black
  console.log('Capturing headphones in Obsidian Black...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pbr_headphones_black_fixed.png') });

  // 2. Switch to Alpine Silver
  console.log('Capturing headphones in Alpine Silver...');
  await page.evaluate(() => {
    const chip = document.querySelector('.hero-color-picker [data-color="silver"]');
    if (chip) chip.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pbr_headphones_silver_fixed.png') });

  // 3. Switch to Midnight Indigo
  console.log('Capturing headphones in Midnight Indigo...');
  await page.evaluate(() => {
    const chip = document.querySelector('.hero-color-picker [data-color="midnight"]');
    if (chip) chip.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pbr_headphones_midnight_fixed.png') });

  console.log('Headphones captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
