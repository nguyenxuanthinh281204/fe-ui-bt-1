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

  // Scroll down slightly so 3D canvas is framed
  await page.evaluate(() => window.scrollTo(0, 100));
  await new Promise(r => setTimeout(r, 2000));

  // 1. Capture Headphones
  console.log('Capturing headphones...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pbr_headphones.png') });

  // 2. Switch to AirPods
  console.log('Switching to AirPods...');
  await page.evaluate(() => window.switchAuraProduct('aura-pods'));
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pbr_airpods.png') });

  // 3. Switch to Chronograph Watch
  console.log('Switching to Watch...');
  await page.evaluate(() => window.switchAuraProduct('aura-watch'));
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pbr_watch.png') });

  // 4. Switch to Kinetic Runner
  console.log('Switching to Runner...');
  await page.evaluate(() => window.switchAuraProduct('aura-runner'));
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pbr_runner.png') });

  console.log('All 4 models captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
