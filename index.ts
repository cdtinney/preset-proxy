const puppeteer = require('puppeteer');
const { createServer } = require('node:http');

const hostname = '127.0.0.1';
const port = 3000;

const testPresetUrl = `https://pvme.io/preset-maker/#/TR1NQ3YaNPGQQ8mOgzCh`;

const getPresetAsImage = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.setViewport({ width: 1200, height: 700 });
  await page.goto(testPresetUrl);

  // Wait for API requests to finish
  await page.waitForNetworkIdle();

  try {
    const presetSelector = '.preset-editor__export-container';
    const presetDom = await page.$(presetSelector);
    const imageBuffer = await presetDom.screenshot({ omitBackground: true });
    return imageBuffer;
  } finally {
    await page.close();
    await browser.close();
  }
};

const server = createServer(async (req, res) => {
  const image = await getPresetAsImage();
  
  res.statusCode = 200;
  res.setHeader('Content-Type', `image/jpeg`);
  res.end(image);
});

server.listen(port, hostname, () => {
  console.log(`preset-proxy running at http://${hostname}:${port}/`);
});
